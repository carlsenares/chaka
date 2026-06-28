#!/usr/bin/env node

import { execFile } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import OpenAI from "openai";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const agentVersion = "0.1.0";

const args = new Set(process.argv.slice(2));
const period = getStringArg("--period") ?? currentQuarter();
const skipProbes = args.has("--skip-probes");
const skipRegistryCheck = args.has("--skip-registry-check");
const researchNewSources = args.has("--research-new-sources") || args.has("--openai");
const dryRun = args.has("--dry-run");
const outputDir = path.join(root, "data/catalog/quarterly_source_refresh");
const reportDir = path.join(root, "docs/reports");
const artifactPath = path.join(outputDir, `${period}.json`);
const reportPath = path.join(reportDir, `quarterly_source_refresh_${period.replace("-", "_")}.md`);
const reviewQueuePath = path.join(root, "data/catalog/source_review_queue.json");

const inputPaths = {
  source_registry_path: "data/catalog/source_registry.json",
  source_access_check_path: "data/catalog/source_access_check.json",
  source_url_checks_path: "data/catalog/source_url_checks.local.json",
  high_value_status_path: "data/catalog/high_value_source_status.json",
  research_candidates_path: "research/source_candidates/",
};

const extractorHints = {
  esa_cci_biomass_v7: {
    commands: ["npm run data:esa-biomass"],
    artifact_paths: ["data/features/source_extracts/esa_cci_biomass.json"],
  },
  gbif_ethiopia_occurrences: {
    commands: ["npm run data:gbif"],
    artifact_paths: ["data/features/source_extracts/gbif_biodiversity.json"],
  },
  wosis_latest_soil_observations: {
    commands: ["npm run data:soilobs"],
    artifact_paths: ["data/features/source_extracts/soil_observations.json"],
  },
  gfw_forest_carbon_gross_removals: {
    commands: ["npm run data:gfw-carbon"],
    artifact_paths: ["data/features/source_extracts/gfw_carbon_flux.json"],
  },
  gfw_forest_carbon_gross_emissions: {
    commands: ["npm run data:gfw-carbon"],
    artifact_paths: ["data/features/source_extracts/gfw_carbon_flux.json"],
  },
  gfw_forest_carbon_net_flux: {
    commands: ["npm run data:gfw-carbon"],
    artifact_paths: ["data/features/source_extracts/gfw_carbon_flux.json"],
  },
};

const manualTermsStatuses = new Set([
  "manual_or_license_required",
  "portal_metadata_only",
  "download_blocked_or_requires_terms",
]);

async function main() {
  const generatedAt = new Date().toISOString();
  const probeRuns = skipProbes ? [] : await runProbes();
  const highValueStatus = await readJsonIfExists(path.join(root, inputPaths.high_value_status_path), null);
  if (!highValueStatus?.sources?.length) {
    throw new Error(
      "No high-value source status found. Run npm run data:sources:updates or omit --skip-probes.",
    );
  }

  const sourceAccessCheck = await readJsonIfExists(path.join(root, inputPaths.source_access_check_path), null);
  const sourceUrlChecks = await readJsonIfExists(path.join(root, inputPaths.source_url_checks_path), null);
  const sourceRegistry = await readJsonIfExists(path.join(root, inputPaths.source_registry_path), null);
  const registrySummary = buildRegistrySummary(sourceRegistry, sourceAccessCheck, sourceUrlChecks);
  const previousArtifact = await readPreviousArtifact(period);
  const knownSourceResults = highValueStatus.sources.map((source) =>
    classifyKnownSource(source, previousArtifact, generatedAt),
  );
  const openAiDiscovery = researchNewSources
    ? await runOpenAiDiscovery({
        period,
        generated_at_utc: generatedAt,
        known_source_results: knownSourceResults,
        source_registry: compactRegistry(sourceRegistry),
        source_access_check: compactAccessCheck(sourceAccessCheck),
        source_url_checks: compactUrlChecks(sourceUrlChecks),
      })
    : skippedDiscovery("skipped_not_requested", "Run with --research-new-sources to perform web-backed OpenAI source discovery.");

  const newSourceCandidates = normalizeCandidateSources(openAiDiscovery);
  const scriptRecommendations = buildScriptRecommendations(knownSourceResults, newSourceCandidates);
  const artifact = {
    schema_version: "quarterly_source_refresh.v1",
    period,
    generated_at_utc: generatedAt,
    agent_version: agentVersion,
    mode: researchNewSources ? "known_sources_plus_openai_research" : "known_sources_only",
    inputs: inputPaths,
    registry_coverage: registrySummary,
    probe_runs: probeRuns,
    openai_discovery: openAiDiscovery,
    summary: summarize(knownSourceResults, newSourceCandidates, scriptRecommendations, registrySummary),
    known_source_results: knownSourceResults,
    new_source_candidates: newSourceCandidates,
    script_recommendations: scriptRecommendations,
    frontend_exclusion: {
      enforced: true,
      excluded_paths: ["app/", "components/", "lib/", "public/", "models/", "reasoning/"],
      note:
        "Refresh artifacts are review inputs only and must not update UI routes, scoring artifacts, or serving logic directly.",
    },
  };

  validateArtifact(artifact);
  const report = renderReport(artifact);

  if (dryRun) {
    console.log(JSON.stringify(artifact.summary, null, 2));
    console.log(`Dry run: would write ${relative(artifactPath)} and ${relative(reportPath)}`);
    return;
  }

  await mkdir(outputDir, { recursive: true });
  await mkdir(reportDir, { recursive: true });
  await writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
  await writeFile(reportPath, report);
  await syncReviewQueue();
  console.log(`Wrote ${relative(artifactPath)}`);
  console.log(`Wrote ${relative(reportPath)}`);
  console.log(`Wrote ${relative(reviewQueuePath)}`);
}

async function syncReviewQueue() {
  await execFileAsync("node", ["scripts/source-review-queue.mjs", "--artifact", relative(artifactPath)], {
    cwd: root,
    maxBuffer: 1024 * 1024 * 4,
  });
}

async function runProbes() {
  const runs = [];
  const commands = [
    ["npm", ["run", "data:registry:check"], "all registry source URL reachability"],
    ["npm", ["run", "data:sources:updates"], "known high-value source freshness"],
    ["npm", ["run", "data:sources:check"], "registered source URL access"],
  ];
  if (skipRegistryCheck) {
    commands.shift();
  }

  for (const [cmd, cmdArgs, description] of commands) {
    const startedAt = new Date().toISOString();
    try {
      const { stdout, stderr } = await execFileAsync(cmd, cmdArgs, {
        cwd: root,
        maxBuffer: 1024 * 1024 * 8,
      });
      runs.push({
        command: [cmd, ...cmdArgs].join(" "),
        description,
        status: "completed",
        started_at_utc: startedAt,
        completed_at_utc: new Date().toISOString(),
        stdout_tail: tail(stdout),
        stderr_tail: tail(stderr),
      });
    } catch (error) {
      runs.push({
        command: [cmd, ...cmdArgs].join(" "),
        description,
        status: "failed",
        started_at_utc: startedAt,
        completed_at_utc: new Date().toISOString(),
        stdout_tail: tail(error.stdout ?? ""),
        stderr_tail: tail(error.stderr ?? ""),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return runs;
}

function classifyKnownSource(source, previousArtifact, observedAt) {
  const previous = previousArtifact?.known_source_results?.find(
    (candidate) => candidate.dataset_id === source.dataset_id,
  );
  const currentFingerprint = fingerprintSource(source);
  const previousFingerprint = previous?.current_fingerprint ?? null;
  const versionChanged = Boolean(previousFingerprint && previousFingerprint !== currentFingerprint);
  const manualReview = manualReviewFor(source);
  const action = safePipelineAction(source, versionChanged, manualReview.required);
  const hint = extractorHints[source.dataset_id] ?? { commands: [], artifact_paths: [] };

  return {
    dataset_id: source.dataset_id,
    name: source.name,
    provider: providerFromSource(source),
    source_url: source.source_url ?? source.listing_url ?? null,
    registry_status: registryStatus(source),
    refresh_class: refreshClass(source),
    access_status: normalizeAccessStatus(source),
    previous_observed_version: previous?.current_observed_version ?? null,
    current_observed_version: observedVersion(source),
    previous_fingerprint: previousFingerprint,
    current_fingerprint: currentFingerprint,
    version_changed: versionChanged,
    metadata_modified: source.provider_metadata_modified ?? source.agb_resource?.last_modified ?? null,
    license_status: licenseStatus(source),
    scoring_classification: normalizeScoringClass(source.scoring_classification),
    safe_pipeline_action: action,
    recommended_commands: action === "rerun_existing_extractor" ? hint.commands : [],
    artifact_paths: hint.artifact_paths,
    caveat: source.caveat ?? null,
    evidence: evidenceForSource(source, observedAt),
    manual_review: manualReview,
  };
}

function fingerprintSource(source) {
  const stableFields = {
    status: source.status ?? null,
    provider_metadata_modified: source.provider_metadata_modified ?? null,
    resource_count: source.resource_count ?? null,
    count: source.count ?? null,
    expected_tile_resource_found: source.expected_tile_resource_found ?? null,
    license_title: source.license_title ?? null,
    agb_md5: source.agb_resource?.md5 ?? null,
    agb_sd_md5: source.agb_sd_resource?.md5 ?? null,
    access_status: source.access_probe?.status ?? source.download_probe?.status ?? null,
    tile_status: source.tile_download_probe?.status ?? null,
  };
  return Buffer.from(JSON.stringify(stableFields)).toString("base64url");
}

function safePipelineAction(source, versionChanged, manualRequired) {
  if (manualRequired) return source.status === "manual_or_license_required" ? "keep_blocked" : "manual_review";
  if (!extractorHints[source.dataset_id]) return "no_action";
  if (!versionChanged) return "no_action";
  if (source.status === "metadata_ok" || source.status === "missing_expected_resources") {
    return "rerun_existing_extractor";
  }
  return "manual_review";
}

function manualReviewFor(source) {
  if (source.status === "manual_or_license_required") {
    return {
      required: true,
      reason: "Source requires license, account, or partner approval before automated ingestion.",
      owner_hint: "data lead or NGO administrator",
    };
  }
  if (source.status === "portal_metadata_only") {
    return {
      required: true,
      reason: "Only landing-page or portal metadata is reachable; authenticated download flow needs review.",
      owner_hint: "data engineer with account access",
    };
  }
  const probes = [
    source.access_probe,
    source.download_probe,
    source.tile_download_probe,
    source.agb_download_probe,
    source.agb_sd_download_probe,
  ].filter(Boolean);
  const blocked = probes.find((probe) => manualTermsStatuses.has(probe.status));
  if (blocked) {
    return {
      required: true,
      reason: `Probe returned ${blocked.status}; confirm terms before ingestion.`,
      owner_hint: "data lead",
    };
  }
  return { required: false, reason: null, owner_hint: null };
}

function evidenceForSource(source, observedAt) {
  const evidence = [];
  for (const probeName of [
    "access_probe",
    "download_probe",
    "tile_download_probe",
    "agb_download_probe",
    "agb_sd_download_probe",
  ]) {
    const probe = source[probeName];
    if (!probe) continue;
    evidence.push({
      kind: "api_probe",
      url: source.source_url ?? source.listing_url ?? null,
      observed_at_utc: observedAt,
      status_code: probe.status_code ?? null,
      note: `${probeName}: ${probe.status}`,
    });
  }
  if (!evidence.length) {
    evidence.push({
      kind: "api_probe",
      url: source.source_url ?? source.listing_url ?? null,
      observed_at_utc: observedAt,
      status_code: null,
      note: `source checker status: ${source.status}`,
    });
  }
  return evidence;
}

async function runOpenAiDiscovery(context) {
  if (process.env.OPENAI_SOURCE_DISCOVERY_ENABLED === "false") {
    return skippedDiscovery("skipped_disabled", "OPENAI_SOURCE_DISCOVERY_ENABLED=false");
  }
  const apiKey = loadOpenAiKey();
  if (!apiKey) {
    return skippedDiscovery("skipped_no_openai_key", "OPENAI_API_KEY was not found in the environment or .env.local.");
  }

  const routing = await readJsonIfExists(path.join(root, "config/openai-model-routing.json"), {});
  const models = modelFallbacks(routing, "source_discovery_synthesizer");
  const client = new OpenAI({
    apiKey,
    maxRetries: 1,
    timeout: Number(process.env.OPENAI_SOURCE_DISCOVERY_TIMEOUT_MS ?? 60000),
  });

  let lastError = null;
  for (const model of models) {
    try {
      const response = await client.responses.create({
        model,
        reasoning: { effort: routing.reasoning?.source_discovery ?? "medium" },
        tools: [{ type: "web_search", search_context_size: "low" }],
        tool_choice: "auto",
        input: [
          {
            role: "system",
            content:
              "You are a source discovery analyst for an Ethiopia restoration prioritization system. Find only public, citable data-source leads. Do not invent numeric features. Do not change scoring. Treat license-gated sources as manual-review candidates.",
          },
          {
            role: "user",
            content: JSON.stringify({
              context,
              task:
                "Search for updated or missing Ethiopia-relevant data sources for carbon, biodiversity, water/soil, livelihood, and safeguards. Return only schema-valid JSON. Prefer official providers, global datasets with Ethiopia coverage, and sources that can improve ingestion or validation. Include citations with URLs for every candidate.",
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "source_discovery",
            strict: true,
            schema: sourceDiscoverySchema,
          },
        },
      });
      return {
        status: "completed",
        mode: "openai_responses_web_search",
        model_used: model,
        generated_at_utc: new Date().toISOString(),
        ...JSON.parse(response.output_text),
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    status: "failed_openai_error",
    mode: "openai_responses_web_search",
    model_used: null,
    generated_at_utc: new Date().toISOString(),
    candidate_sources: [],
    verification_questions: [],
    blocked_or_manual_sources: [],
    recommended_registry_updates: [],
    notes: [lastError instanceof Error ? lastError.message : String(lastError)],
  };
}

function normalizeCandidateSources(discovery) {
  return (discovery.candidate_sources ?? []).slice(0, 12).map((candidate, index) => ({
    candidate_id:
      candidate.candidate_id ??
      `source_candidate:${slug(candidate.name ?? `candidate_${index + 1}`)}_${period.toLowerCase()}`,
    name: candidate.name ?? "Unnamed source candidate",
    provider: candidate.provider ?? "unknown",
    source_url: candidate.source_url ?? null,
    discovery_method: discovery.status === "completed" ? "openai_research" : "manual_seed",
    why_relevant: candidate.why_relevant ?? candidate.evidence_for_relevance ?? "",
    proposed_class: candidate.proposed_class ?? candidate.scoring_classification ?? "context_only",
    proposed_pipeline_role: candidate.proposed_pipeline_role ?? "source_discovery_lead",
    access_status: candidate.access_status ?? "unknown",
    license_status: candidate.license_status ?? "unknown",
    automation_readiness: candidate.automation_readiness ?? "needs_probe",
    recommended_boundary: candidate.recommended_boundary ?? "catalog_only",
    recommended_next_step: candidate.recommended_next_step ?? "Verify URL, license, coverage, and stable download path.",
    risks: candidate.risks ?? [],
    citations: (candidate.citations ?? []).map((citation) => ({
      title: citation.title ?? candidate.name ?? "Source page",
      url: citation.url ?? candidate.source_url ?? null,
      accessed_at_utc: citation.accessed_at_utc ?? discovery.generated_at_utc ?? new Date().toISOString(),
    })),
  }));
}

function buildScriptRecommendations(knownSources, candidates) {
  const recommendations = [
    {
      script: "scripts/check-high-value-source-updates.mjs",
      change_type: "extend_existing",
      recommendation:
        "Move the hard-coded high-value source list into data/catalog/high_value_sources.json once the source set stabilizes.",
      priority: "medium",
      rationale:
        "A catalog-backed checker lets NGO admins and data engineers add monitored sources without editing scanner code.",
    },
  ];
  const actionableCandidates = candidates.filter((candidate) =>
    ["ready", "needs_engineering"].includes(candidate.automation_readiness),
  );
  if (actionableCandidates.length) {
    recommendations.push({
      script: "new extractor or source-access checker",
      change_type: "new_script",
      recommendation: `Review ${actionableCandidates.length} source candidates for extractor work after license and coverage verification.`,
      priority: "medium",
      rationale:
        "The quarterly agent only creates review leads; ingestion should be a separate reviewed change.",
    });
  }
  if (knownSources.some((source) => source.safe_pipeline_action === "rerun_existing_extractor")) {
    recommendations.push({
      script: "existing extractor scripts",
      change_type: "no_change",
      recommendation:
        "Run the listed extractor commands for changed sources, then run feature extraction, ranking, and artifact validation in a separate data-refresh pass.",
      priority: "high",
      rationale:
        "Known source metadata changed and existing extractor coverage is already available.",
    });
  }
  return recommendations;
}

function summarize(knownSources, candidates, recommendations, registrySummary) {
  return {
    registry_sources_total: registrySummary.registry_sources_total,
    registry_source_urls_checked: registrySummary.registry_source_urls_checked,
    access_probe_results: registrySummary.access_probe_results,
    high_value_monitored_sources_checked: knownSources.length,
    high_value_sources_changed: knownSources.filter((source) => source.version_changed).length,
    new_source_candidates: candidates.length,
    high_value_blocked_sources: knownSources.filter((source) => source.safe_pipeline_action === "keep_blocked").length,
    recommended_script_changes: recommendations.filter((item) => item.change_type !== "no_change").length,
    high_value_manual_review_required: knownSources.filter((source) => source.manual_review.required).length,
  };
}

function renderReport(artifact) {
  const changed = artifact.known_source_results.filter((source) => source.version_changed);
  const manual = artifact.known_source_results.filter((source) => source.manual_review.required);
  const commands = [
    ...new Set(artifact.known_source_results.flatMap((source) => source.recommended_commands)),
  ];
  return `# Quarterly Source Refresh ${artifact.period}

Generated: ${artifact.generated_at_utc}

## Executive summary

- Registry sources listed: ${artifact.summary.registry_sources_total}
- Registry source URLs checked: ${artifact.summary.registry_source_urls_checked}
- Specialist access probes checked: ${artifact.summary.access_probe_results}
- High-value monitored freshness sources checked: ${artifact.summary.high_value_monitored_sources_checked}
- High-value sources changed since previous artifact: ${artifact.summary.high_value_sources_changed}
- High-value manual review required: ${artifact.summary.high_value_manual_review_required}
- New source candidates: ${artifact.summary.new_source_candidates}
- OpenAI discovery status: ${artifact.openai_discovery.status}

## Source coverage

${renderCoverage(artifact.registry_coverage)}

## High-value monitored source changes

${changed.length ? changed.map(renderKnownSourceLine).join("\n") : "- No changed high-value monitored sources detected against the previous quarterly artifact."}

## Blocked or manual high-value sources

${manual.length ? manual.map((source) => `- ${source.dataset_id}: ${source.manual_review.reason}`).join("\n") : "- No manual source blockers detected."}

## New source candidates

${artifact.new_source_candidates.length ? artifact.new_source_candidates.map(renderCandidateLine).join("\n") : "- No new source candidates in this run."}

## Safe rerun commands

${commands.length ? commands.map((command) => `- \`${command}\``).join("\n") : "- No extractor reruns recommended from this report."}

## Proposed script or catalog changes

${artifact.script_recommendations.map((item) => `- ${item.priority}: ${item.recommendation}`).join("\n")}

## Risks and manual review queue

- The quarterly agent does not update scoring, feature artifacts, frontend routes, or model outputs.
- OpenAI-discovered sources are leads only; verify URL, license, coverage, and stable access before ingestion.
- License-gated datasets remain blocked until terms are accepted and redistribution/use constraints are documented.
`;
}

function renderKnownSourceLine(source) {
  const commands = source.recommended_commands.length
    ? ` Commands: ${source.recommended_commands.map((command) => `\`${command}\``).join(", ")}.`
    : "";
  return `- ${source.dataset_id}: ${source.access_status}; action \`${source.safe_pipeline_action}\`.${commands}`;
}

function renderCandidateLine(candidate) {
  return `- ${candidate.name} (${candidate.provider}): ${candidate.proposed_class}, ${candidate.automation_readiness}. Next: ${candidate.recommended_next_step}`;
}

function renderCoverage(coverage) {
  const missing = coverage.registry_sources_without_registry_url_probe ?? [];
  const failed = coverage.registry_url_probe_failures ?? [];
  const lines = [
    `- \`source_registry.json\` entries: ${coverage.registry_sources_total}`,
    `- Registry URL probes from \`data:registry:check\`: ${coverage.registry_source_urls_checked}/${coverage.registry_sources_total}`,
    `- Specialist source-access probes from \`data:sources:check\`: ${coverage.access_probe_results}`,
    `- High-value freshness/update monitor entries from \`data:sources:updates\`: ${coverage.high_value_monitor_note}`,
  ];
  if (failed.length) {
    lines.push(`- Registry URL probes needing review: ${failed.join(", ")}`);
  }
  if (missing.length) {
    lines.push(`- Registry entries without URL probe output: ${missing.join(", ")}`);
  }
  if (!failed.length && !missing.length) {
    lines.push("- Every registry source URL has a registry reachability probe in this run.");
  }
  return lines.join("\n");
}

function validateArtifact(artifact) {
  const forbiddenPrefixes = ["app/", "components/", "lib/", "public/", "models/", "reasoning/"];
  for (const source of artifact.known_source_results) {
    if (!/^[a-z0-9][a-z0-9_:-]*$/.test(source.dataset_id)) {
      throw new Error(`Invalid dataset_id: ${source.dataset_id}`);
    }
    if (!source.safe_pipeline_action) {
      throw new Error(`Missing safe_pipeline_action for ${source.dataset_id}`);
    }
    for (const artifactPath of source.artifact_paths ?? []) {
      if (forbiddenPrefixes.some((prefix) => artifactPath.startsWith(prefix))) {
        throw new Error(`Forbidden frontend/serving artifact path in ${source.dataset_id}: ${artifactPath}`);
      }
    }
  }
}

async function readPreviousArtifact(currentPeriod) {
  if (!existsSync(outputDir)) return null;
  const files = readdirSync(outputDir)
    .filter((file) => file.endsWith(".json") && file !== `${currentPeriod}.json`)
    .sort();
  if (!files.length) return null;
  return readJsonIfExists(path.join(outputDir, files[files.length - 1]), null);
}

async function readJsonIfExists(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(await readFile(filePath, "utf8"));
}

function compactRegistry(registry) {
  const sources = Array.isArray(registry) ? registry : registry?.sources ?? registry?.datasets ?? [];
  return Array.isArray(sources)
    ? sources.slice(0, 80).map((source) => ({
        dataset_id: source.dataset_id ?? source.id ?? null,
        name: source.name ?? source.title ?? null,
        url: source.url ?? source.source_url ?? null,
        role: source.role ?? source.category ?? null,
      }))
    : [];
}

function compactAccessCheck(accessCheck) {
  const sources = accessCheck?.sources ?? accessCheck?.results ?? [];
  return Array.isArray(sources)
    ? sources.slice(0, 80).map((source) => ({
        dataset_id: source.dataset_id ?? source.id ?? null,
        status: source.status ?? source.access_status ?? null,
        url: source.url ?? source.source_url ?? null,
      }))
    : [];
}

function compactUrlChecks(urlChecks) {
  const checks = Array.isArray(urlChecks) ? urlChecks : [];
  return checks.slice(0, 80).map((check) => ({
    dataset_id: check.dataset_id ?? null,
    ok: check.ok ?? null,
    status: check.status ?? null,
    source_url: check.source_url ?? null,
  }));
}

function buildRegistrySummary(registry, accessCheck, sourceUrlChecks) {
  const registrySources = Array.isArray(registry) ? registry : registry?.sources ?? registry?.datasets ?? [];
  const urlChecks = Array.isArray(sourceUrlChecks) ? sourceUrlChecks : [];
  const accessResults = accessCheck?.results ?? accessCheck?.sources ?? [];
  const checkedIds = new Set(urlChecks.map((check) => check.dataset_id).filter(Boolean));
  return {
    registry_sources_total: registrySources.length,
    registry_source_urls_checked: urlChecks.length,
    registry_url_probe_failures: urlChecks
      .filter((check) => check.ok === false)
      .map((check) => check.dataset_id)
      .filter(Boolean),
    registry_sources_without_registry_url_probe: registrySources
      .map((source) => source.dataset_id)
      .filter((datasetId) => datasetId && !checkedIds.has(datasetId)),
    access_probe_results: Array.isArray(accessResults) ? accessResults.length : 0,
    high_value_monitor_note:
      "separate curated list for source freshness, update metadata, and license/manual review risk",
  };
}

function modelFallbacks(routing, route) {
  const configured = process.env.OPENAI_SOURCE_DISCOVERY_MODEL;
  if (configured) return [configured];
  return [
    routing.models?.[route],
    routing.models?.reasoning_synthesizer,
    routing.models?.structured_extractor,
    ...(routing.fallbacks?.[route] ?? []),
    ...(routing.fallbacks?.reasoning_synthesizer ?? []),
  ].filter(Boolean);
}

function loadOpenAiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const envPath = path.join(root, ".env.local");
  if (!existsSync(envPath)) return null;
  const text = readFileSync(envPath, "utf8");
  const match = text.match(/^OPENAI_API_KEY=(.*)$/m);
  return match?.[1]?.trim().replace(/^["']|["']$/g, "") || null;
}

function skippedDiscovery(status, note) {
  return {
    status,
    mode: "not_run",
    model_used: null,
    generated_at_utc: new Date().toISOString(),
    candidate_sources: [],
    verification_questions: [],
    blocked_or_manual_sources: [],
    recommended_registry_updates: [],
    notes: [note],
  };
}

function normalizeAccessStatus(source) {
  if (source.status === "metadata_ok") return "metadata_ok";
  if (source.status === "manual_or_license_required") return "blocked_terms";
  if (source.status === "portal_metadata_only") return "blocked_auth";
  if (source.status === "check_failed") return "check_failed";
  if (source.status === "metadata_failed") return "unavailable";
  return source.status ?? "unknown";
}

function normalizeScoringClass(value) {
  if (!value) return "context_only";
  if (value.includes("blocked")) return "blocked_review_required";
  if (value.includes("validation")) return "validation_anchor";
  if (value.includes("context")) return "context_only";
  if (value.includes("scoring")) return "scoring_layer";
  return value;
}

function licenseStatus(source) {
  const text = `${source.license_title ?? ""} ${source.scoring_classification ?? ""} ${source.status ?? ""}`.toLowerCase();
  if (text.includes("blocked") || text.includes("terms") || text.includes("manual")) return "terms_required";
  if (text.includes("creative commons") || text.includes("cc-by") || text.includes("open")) return "open";
  if (text.includes("non-commercial") || text.includes("noncommercial")) return "non_commercial";
  return "unknown";
}

function registryStatus(source) {
  if (String(source.scoring_classification ?? "").includes("blocked")) return "blocked";
  if (source.priority === "high") return "required";
  if (source.priority === "medium_high") return "optional";
  return "future";
}

function refreshClass(source) {
  if (source.status === "manual_or_license_required" || source.status === "portal_metadata_only") return "manual_terms";
  if (source.count != null) return "dynamic";
  if (source.provider_metadata_modified || source.agb_resource?.last_modified) return "periodic";
  return "static";
}

function observedVersion(source) {
  return String(
    source.year ??
      source.provider_metadata_modified ??
      source.agb_resource?.last_modified ??
      source.count ??
      source.status ??
      "unknown",
  );
}

function providerFromSource(source) {
  const name = `${source.name ?? ""} ${source.source_url ?? ""}`.toLowerCase();
  if (name.includes("gfw") || name.includes("wri")) return "WRI/GFW";
  if (name.includes("gbif")) return "GBIF";
  if (name.includes("wosis") || name.includes("isric")) return "ISRIC";
  if (name.includes("iucn")) return "IUCN";
  if (name.includes("key biodiversity")) return "KBA Partnership";
  if (name.includes("natural history museum") || name.includes("nhm")) return "Natural History Museum";
  if (name.includes("gedi") || name.includes("nasa")) return "NASA";
  if (name.includes("esa") || name.includes("ceda")) return "ESA/CEDA";
  return "unknown";
}

function currentQuarter(date = new Date()) {
  return `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
}

function getStringArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

function tail(text, lines = 12) {
  return String(text ?? "").trim().split("\n").slice(-lines).join("\n");
}

function relative(filePath) {
  return path.relative(root, filePath);
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

const sourceDiscoverySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidate_sources: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          candidate_id: { type: ["string", "null"] },
          name: { type: "string" },
          provider: { type: "string" },
          source_url: { type: ["string", "null"] },
          why_relevant: { type: "string" },
          proposed_class: {
            type: "string",
            enum: [
              "scoring_layer",
              "validation_anchor",
              "context_only",
              "weak_label_source",
              "blocked_review_required",
            ],
          },
          proposed_pipeline_role: { type: "string" },
          access_status: {
            type: "string",
            enum: ["unknown", "available", "blocked_terms", "blocked_auth", "unavailable"],
          },
          license_status: {
            type: "string",
            enum: ["unknown", "open", "non_commercial", "terms_required"],
          },
          automation_readiness: {
            type: "string",
            enum: ["ready", "needs_probe", "needs_terms", "needs_engineering", "do_not_use"],
          },
          recommended_boundary: {
            type: "string",
            enum: ["catalog_only", "local_knowledge", "source_extract", "blocked_manifest"],
          },
          recommended_next_step: { type: "string" },
          risks: { type: "array", items: { type: "string" } },
          citations: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                url: { type: "string" },
                accessed_at_utc: { type: ["string", "null"] },
              },
              required: ["title", "url", "accessed_at_utc"],
            },
          },
        },
        required: [
          "candidate_id",
          "name",
          "provider",
          "source_url",
          "why_relevant",
          "proposed_class",
          "proposed_pipeline_role",
          "access_status",
          "license_status",
          "automation_readiness",
          "recommended_boundary",
          "recommended_next_step",
          "risks",
          "citations",
        ],
      },
    },
    verification_questions: { type: "array", items: { type: "string" } },
    blocked_or_manual_sources: { type: "array", items: { type: "string" } },
    recommended_registry_updates: { type: "array", items: { type: "string" } },
    notes: { type: "array", items: { type: "string" } },
  },
  required: [
    "candidate_sources",
    "verification_questions",
    "blocked_or_manual_sources",
    "recommended_registry_updates",
    "notes",
  ],
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
