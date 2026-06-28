#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/validate-quarterly-source-refresh.mjs <artifact.json>");
  process.exit(1);
}

const artifact = JSON.parse(await readFile(filePath, "utf8"));
const forbiddenPrefixes = ["app/", "components/", "lib/", "public/", "models/", "reasoning/"];
const allowedActions = new Set([
  "no_action",
  "rerun_existing_extractor",
  "add_extractor",
  "manual_review",
  "keep_blocked",
]);

const errors = [];
if (artifact.schema_version !== "quarterly_source_refresh.v1") {
  errors.push("schema_version must be quarterly_source_refresh.v1");
}
if (!/^\d{4}-Q[1-4]$/.test(artifact.period ?? "")) {
  errors.push("period must look like 2026-Q3");
}
if (!artifact.frontend_exclusion?.enforced) {
  errors.push("frontend_exclusion.enforced must be true");
}

for (const source of artifact.known_source_results ?? []) {
  if (!/^[a-z0-9][a-z0-9_:-]*$/.test(source.dataset_id ?? "")) {
    errors.push(`invalid dataset_id: ${source.dataset_id}`);
  }
  if (!allowedActions.has(source.safe_pipeline_action)) {
    errors.push(`invalid safe_pipeline_action for ${source.dataset_id}`);
  }
  for (const artifactPath of source.artifact_paths ?? []) {
    if (forbiddenPrefixes.some((prefix) => artifactPath.startsWith(prefix))) {
      errors.push(`forbidden artifact path for ${source.dataset_id}: ${artifactPath}`);
    }
  }
}

for (const candidate of artifact.new_source_candidates ?? []) {
  if (!candidate.source_url && candidate.automation_readiness !== "do_not_use") {
    errors.push(`candidate ${candidate.name} needs source_url or do_not_use readiness`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Validated ${filePath}`);
