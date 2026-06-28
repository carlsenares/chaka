#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const reviewQueuePath = path.join(root, "data/catalog/source_review_queue.json");
const artifactDir = path.join(root, "data/catalog/quarterly_source_refresh");
const postIngestionCommands = [
  "npm run data:features",
  "npm run data:rank",
  "npm run data:candidates:validate",
  "npm run data:artifacts:validate",
];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipTrigger = args.includes("--skip-trigger");
const reviewer = getStringArg("--reviewer") ?? "local_admin";
const reason = getStringArg("--reason") ?? null;
const explicitArtifact = getStringArg("--artifact");
const approveId = getStringArg("--approve");
const rejectId = getStringArg("--reject");
const blockId = getStringArg("--block");
const showList = args.includes("--list");

async function main() {
  if ([approveId, rejectId, blockId].filter(Boolean).length > 1) {
    throw new Error("Use only one of --approve, --reject, or --block.");
  }

  const artifactPath = explicitArtifact ? path.resolve(root, explicitArtifact) : latestArtifactPath();
  const existing = await readJsonIfExists(reviewQueuePath, null);
  const queue = artifactPath
    ? mergeQueueFromArtifact(await readJson(artifactPath), existing, artifactPath)
    : existing ?? emptyQueue();

  if (approveId) {
    await decide(queue, approveId, "approved");
  } else if (rejectId) {
    await decide(queue, rejectId, "rejected");
  } else if (blockId) {
    await decide(queue, blockId, "blocked");
  } else {
    await persist(queue);
  }

  if (showList || (!approveId && !rejectId && !blockId)) {
    printSummary(queue);
  }
}

async function decide(queue, itemId, status) {
  const item = queue.items.find((candidate) => candidate.review_item_id === itemId);
  if (!item) {
    throw new Error(`No source review item found for ${itemId}`);
  }

  const now = new Date().toISOString();
  item.queue_status = status;
  item.updated_at_utc = now;
  item.review = {
    status,
    reviewed_by: reviewer,
    reviewed_at_utc: now,
    reason,
  };

  if (status === "approved" && !skipTrigger) {
    item.ingestion = item.ingestion ?? ingestionPlan([]);
    if (item.ingestion.can_trigger) {
      item.ingestion.last_run = await runIngestion(item);
    } else {
      item.ingestion.last_run = {
        status: "not_triggered",
        completed_at_utc: now,
        reason: item.ingestion.blocker ?? "No configured ingestion command for this source.",
      };
    }
  }

  await persist(queue);
  printDecision(item);
}

async function runIngestion(item) {
  const commands = [...new Set([...(item.ingestion.commands ?? []), ...postIngestionCommands])];
  const run = {
    status: "completed",
    started_at_utc: new Date().toISOString(),
    completed_at_utc: null,
    commands,
    command_results: [],
  };

  for (const command of commands) {
    if (dryRun) {
      run.command_results.push({
        command,
        status: "dry_run",
        exit_code: null,
      });
      continue;
    }

    const result = spawnSync(command, {
      cwd: root,
      shell: true,
      stdio: "inherit",
      env: process.env,
    });
    run.command_results.push({
      command,
      status: result.status === 0 ? "completed" : "failed",
      exit_code: result.status,
      signal: result.signal,
    });
    if (result.status !== 0) {
      run.status = "failed";
      break;
    }
  }

  run.completed_at_utc = new Date().toISOString();
  return run;
}

function mergeQueueFromArtifact(artifact, existing, artifactPath) {
  const existingById = new Map((existing?.items ?? []).map((item) => [item.review_item_id, item]));
  const generatedAt = new Date().toISOString();
  const items = [
    ...(artifact.known_source_results ?? []).map((source) =>
      knownSourceReviewItem(source, artifact, artifactPath, generatedAt, existingById.get(source.dataset_id)),
    ),
    ...(artifact.new_source_candidates ?? []).map((source) =>
      candidateSourceReviewItem(source, artifact, artifactPath, generatedAt, existingById.get(source.candidate_id)),
    ),
  ];

  return {
    schema_version: "source_review_queue.v1",
    generated_at_utc: generatedAt,
    source_artifact_path: path.relative(root, artifactPath),
    source_artifact_period: artifact.period ?? null,
    summary: summarize(items),
    items,
  };
}

function knownSourceReviewItem(source, artifact, artifactPath, generatedAt, existing) {
  const commands = source.recommended_commands ?? [];
  const defaultStatus =
    source.safe_pipeline_action === "rerun_existing_extractor" || source.manual_review?.required
      ? "pending_review"
      : "monitored";
  const canTrigger = source.safe_pipeline_action === "rerun_existing_extractor" && commands.length > 0;

  return preserveDecision(existing, {
    review_item_id: source.dataset_id,
    source_kind: "known_source",
    source_ref: source.dataset_id,
    period: artifact.period ?? null,
    name: source.name,
    provider: source.provider,
    source_url: source.source_url,
    queue_status: defaultStatus,
    created_at_utc: existing?.created_at_utc ?? generatedAt,
    updated_at_utc: generatedAt,
    discovered_by: "quarterly_source_refresh",
    review_priority: source.manual_review?.required ? "high" : source.version_changed ? "medium" : "low",
    review_reason: source.manual_review?.reason ?? (source.version_changed ? "Source fingerprint changed." : null),
    review: existing?.review ?? null,
    source_metadata: {
      access_status: source.access_status,
      license_status: source.license_status,
      scoring_classification: source.scoring_classification,
      safe_pipeline_action: source.safe_pipeline_action,
      version_changed: source.version_changed,
      current_observed_version: source.current_observed_version ?? null,
      current_fingerprint: source.current_fingerprint ?? null,
      artifact_paths: source.artifact_paths ?? [],
      caveat: source.caveat ?? null,
      evidence: source.evidence ?? [],
      artifact_path: path.relative(root, artifactPath),
    },
    ingestion: ingestionPlan(
      commands,
      canTrigger
        ? null
        : source.safe_pipeline_action === "rerun_existing_extractor"
          ? "Extractor command is missing for this source."
          : "Approval records the source decision; this source is not configured for automatic ingestion.",
    ),
  });
}

function candidateSourceReviewItem(source, artifact, artifactPath, generatedAt, existing) {
  return preserveDecision(existing, {
    review_item_id: source.candidate_id,
    source_kind: "new_source_candidate",
    source_ref: source.candidate_id,
    period: artifact.period ?? null,
    name: source.name,
    provider: source.provider,
    source_url: source.source_url,
    queue_status: "pending_review",
    created_at_utc: existing?.created_at_utc ?? generatedAt,
    updated_at_utc: generatedAt,
    discovered_by: source.discovery_method ?? "openai_research",
    review_priority: source.automation_readiness === "ready" ? "medium" : "low",
    review_reason: source.recommended_next_step,
    review: existing?.review ?? null,
    source_metadata: {
      proposed_class: source.proposed_class,
      proposed_pipeline_role: source.proposed_pipeline_role,
      access_status: source.access_status,
      license_status: source.license_status,
      automation_readiness: source.automation_readiness,
      recommended_boundary: source.recommended_boundary,
      risks: source.risks ?? [],
      citations: source.citations ?? [],
      artifact_path: path.relative(root, artifactPath),
    },
    ingestion: ingestionPlan(
      [],
      "No extractor is configured yet. Approval should create an engineering task or registry update before ingestion can run.",
    ),
  });
}

function preserveDecision(existing, next) {
  if (existing?.source_metadata?.current_fingerprint && next.source_metadata?.current_fingerprint) {
    if (existing.source_metadata.current_fingerprint !== next.source_metadata.current_fingerprint) {
      return {
        ...next,
        review_history: [...(existing.review_history ?? []), existing.review].filter(Boolean),
      };
    }
  }

  if (!existing?.review || ["pending_review", "monitored"].includes(existing.queue_status)) {
    return next;
  }
  return {
    ...next,
    queue_status: existing.queue_status,
    created_at_utc: existing.created_at_utc ?? next.created_at_utc,
    review: existing.review,
    ingestion: {
      ...next.ingestion,
      last_run: existing.ingestion?.last_run ?? null,
    },
  };
}

function ingestionPlan(commands, blocker = null) {
  return {
    can_trigger: commands.length > 0 && !blocker,
    commands,
    post_update_commands: postIngestionCommands,
    blocker,
    last_run: null,
  };
}

async function persist(queue) {
  queue.generated_at_utc = new Date().toISOString();
  queue.summary = summarize(queue.items);
  if (dryRun) {
    console.log(JSON.stringify(queue.summary, null, 2));
    console.log(`Dry run: would write ${path.relative(root, reviewQueuePath)}`);
    return;
  }
  await mkdir(path.dirname(reviewQueuePath), { recursive: true });
  await writeFile(reviewQueuePath, `${JSON.stringify(queue, null, 2)}\n`);
}

function summarize(items) {
  return {
    total: items.length,
    pending_review: items.filter((item) => item.queue_status === "pending_review").length,
    approved: items.filter((item) => item.queue_status === "approved").length,
    rejected: items.filter((item) => item.queue_status === "rejected").length,
    blocked: items.filter((item) => item.queue_status === "blocked").length,
    monitored: items.filter((item) => item.queue_status === "monitored").length,
    approval_can_trigger_ingestion: items.filter((item) => item.ingestion?.can_trigger).length,
  };
}

function printSummary(queue) {
  console.log(`Source review queue: ${path.relative(root, reviewQueuePath)}`);
  console.log(JSON.stringify(queue.summary, null, 2));
  for (const item of queue.items.filter((entry) => entry.queue_status === "pending_review")) {
    const trigger = item.ingestion?.can_trigger ? "auto-ingest on approval" : "approval only";
    console.log(`- ${item.review_item_id}: ${item.name} (${item.review_priority}; ${trigger})`);
  }
}

function printDecision(item) {
  const triggerStatus = item.ingestion?.last_run?.status ? `; ingestion ${item.ingestion.last_run.status}` : "";
  console.log(`${item.review_item_id}: ${item.queue_status}${triggerStatus}`);
}

function latestArtifactPath() {
  if (!existsSync(artifactDir)) return null;
  const files = readdirSync(artifactDir)
    .filter((file) => file.endsWith(".json"))
    .sort();
  if (!files.length) return null;
  return path.join(artifactDir, files[files.length - 1]);
}

function emptyQueue() {
  return {
    schema_version: "source_review_queue.v1",
    generated_at_utc: new Date().toISOString(),
    source_artifact_path: null,
    source_artifact_period: null,
    summary: summarize([]),
    items: [],
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readJsonIfExists(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  return readJson(filePath);
}

function getStringArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
