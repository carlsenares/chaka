#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "data/catalog/source_registry.json");
const datasetsPath = path.join(root, "data/catalog/datasets.json");
const inventoryPath = path.join(root, "data/dataset_inventory.md");
const qualityPath = path.join(root, "docs/data_quality.md");

const requiredFields = [
  "dataset_id",
  "name",
  "provider",
  "type",
  "spatial_resolution",
  "temporal_resolution",
  "coverage",
  "access_method",
  "mvp_status",
  "used_features",
  "known_limitations",
  "source_url",
];

const allowedMvpStatuses = new Set(["required", "optional", "future", "blocked"]);
const checkUrls = process.argv.includes("--check-urls");

function fail(message) {
  console.error(`data-registry-agent: ${message}`);
  process.exit(1);
}

function formatList(items) {
  if (!items.length) return "None listed.";
  return items.map((item) => `- ${item}`).join("\n");
}

function validateDataset(dataset, index) {
  for (const field of requiredFields) {
    if (!(field in dataset)) {
      fail(`dataset at index ${index} is missing required field "${field}"`);
    }
  }

  if (!/^[a-z0-9_]+$/.test(dataset.dataset_id)) {
    fail(`${dataset.dataset_id}: dataset_id must use lowercase snake_case`);
  }

  if (!allowedMvpStatuses.has(dataset.mvp_status)) {
    fail(`${dataset.dataset_id}: invalid mvp_status "${dataset.mvp_status}"`);
  }

  if (!Array.isArray(dataset.used_features) || dataset.used_features.length === 0) {
    fail(`${dataset.dataset_id}: used_features must be a non-empty array`);
  }

  if (!Array.isArray(dataset.known_limitations)) {
    fail(`${dataset.dataset_id}: known_limitations must be an array`);
  }

  try {
    new URL(dataset.source_url);
  } catch {
    fail(`${dataset.dataset_id}: source_url is not a valid URL`);
  }
}

async function probeUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "accept": "text/html,application/json,*/*",
        "accept-language": "en",
        "user-agent": "chaka-data-registry-agent/0.1",
      },
      signal: controller.signal,
    });

    if (response.status === 405 || response.status === 403 || response.status === 406) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "accept": "text/html,application/json,*/*",
          "accept-language": "en",
          "user-agent": "chaka-data-registry-agent/0.1",
        },
        signal: controller.signal,
      });
    }

    return {
      checked_at: new Date().toISOString(),
      status: response.status,
      ok: response.ok,
      final_url: response.url,
    };
  } catch (error) {
    return {
      checked_at: new Date().toISOString(),
      status: null,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const raw = await readFile(sourcePath, "utf8");
  const datasets = JSON.parse(raw);

  if (!Array.isArray(datasets)) {
    fail("source registry must be a JSON array");
  }

  const seenIds = new Set();
  for (const [index, dataset] of datasets.entries()) {
    validateDataset(dataset, index);
    if (seenIds.has(dataset.dataset_id)) {
      fail(`duplicate dataset_id "${dataset.dataset_id}"`);
    }
    seenIds.add(dataset.dataset_id);
  }

  const normalized = datasets
    .map((dataset) => ({
      ...dataset,
      source_verification: {
        mode: checkUrls ? "url_probe" : "not_checked_this_run",
      },
    }))
    .sort((a, b) => a.dataset_id.localeCompare(b.dataset_id));

  if (checkUrls) {
    for (const dataset of normalized) {
      dataset.source_verification = {
        mode: "url_probe",
        ...(await probeUrl(dataset.source_url)),
      };
    }
  }

  await mkdir(path.dirname(datasetsPath), { recursive: true });
  await mkdir(path.dirname(inventoryPath), { recursive: true });
  await mkdir(path.dirname(qualityPath), { recursive: true });

  await writeFile(datasetsPath, `${JSON.stringify(normalized, null, 2)}\n`);
  await writeFile(inventoryPath, renderInventory(normalized));
  await writeFile(qualityPath, renderDataQuality(normalized));

  console.log(`Wrote ${path.relative(root, datasetsPath)}`);
  console.log(`Wrote ${path.relative(root, inventoryPath)}`);
  console.log(`Wrote ${path.relative(root, qualityPath)}`);
}

function renderInventory(datasets) {
  const rows = datasets
    .map((dataset) => {
      const features = dataset.used_features.join(", ");
      return `| ${dataset.dataset_id} | ${dataset.provider} | ${dataset.type} | ${dataset.spatial_resolution} | ${dataset.mvp_status} | ${features} |`;
    })
    .join("\n");

  const details = datasets
    .map(
      (dataset) => `### ${dataset.name}

- Dataset ID: \`${dataset.dataset_id}\`
- Provider: ${dataset.provider}
- Coverage: ${dataset.coverage}
- Spatial resolution: ${dataset.spatial_resolution}
- Temporal resolution: ${dataset.temporal_resolution}
- Access method: ${dataset.access_method}
- Source: ${dataset.source_url}

Used features:

${formatList(dataset.used_features)}

Known limitations:

${formatList(dataset.known_limitations)}
`
    )
    .join("\n");

  return `# Dataset Inventory

Generated by \`scripts/data-registry-agent.mjs\`.

## Summary

| Dataset ID | Provider | Type | Spatial resolution | MVP status | Used features |
| --- | --- | --- | --- | --- | --- |
${rows}

## Dataset Details

${details}`;
}

function renderDataQuality(datasets) {
  const required = datasets.filter((dataset) => dataset.mvp_status === "required");
  const optional = datasets.filter((dataset) => dataset.mvp_status === "optional");
  const limitations = datasets
    .map((dataset) => {
      const items = dataset.known_limitations.map((item) => `  - ${item}`).join("\n");
      return `- ${dataset.dataset_id}\n${items}`;
    })
    .join("\n");

  return `# Data Quality Notes

Generated by \`scripts/data-registry-agent.mjs\`.

## MVP Readiness

- Required datasets listed: ${required.length}
- Optional datasets listed: ${optional.length}
- Blocked datasets listed: ${datasets.filter((dataset) => dataset.mvp_status === "blocked").length}

The current data matrix is sufficient for a deterministic pre-feasibility ranking prototype, provided outputs are framed as screening signals and not final project decisions.

## Major Gaps Not Solved By Open Data

- Land tenure and user rights.
- Community willingness.
- Grazing pressure and seasonal land use.
- Local conflict, safety, and access constraints.
- Measured biomass or verified carbon stock.
- Local species survival rates.
- Nursery capacity and implementation cost.
- Field biodiversity baselines.

## Dataset Limitations

${limitations}

## Required Product Guardrails

- Treat carbon outputs as potential or pre-feasibility signals unless measured field carbon exists.
- Include field-validation flags when social feasibility is inferred only from population, roads, or settlement proximity.
- Do not use protected-area overlap as the only safeguard check.
- Keep every numeric score traceable to a source dataset or mark it as mock/demo.
`;
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
