#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataRoot = path.join(root, "data/local_knowledge");

async function main() {
  const sources = await readJson("sources.json");
  const pages = await readJson("pages_manifest.json");
  const analyses = await readJson("document_analyses.json");
  const cards = await readJson("evidence_cards.json");
  const retrieval = await readJson("retrieval_index.json");

  const errors = [];
  const warnings = [];
  const sourceIds = new Set(sources.map((source) => source.source_id));
  const pageBySourceAndPage = new Map(pages.map((page) => [`${page.source_id}:${page.page}`, page]));

  for (const analysis of analyses) {
    if (!sourceIds.has(analysis.source_id)) {
      errors.push(`Analysis references unknown source_id ${analysis.source_id}`);
    }
    if (!analysis.blocked_uses?.includes("direct_score_override")) {
      warnings.push(`Analysis ${analysis.source_id} does not explicitly block direct_score_override`);
    }
  }

  for (const card of cards) {
    if (!sourceIds.has(card.source_id)) {
      errors.push(`Card ${card.evidence_id} references unknown source_id ${card.source_id}`);
    }
    const page = pageBySourceAndPage.get(`${card.source_id}:${card.citation?.page}`);
    if (!page) {
      errors.push(`Card ${card.evidence_id} cites missing page ${card.citation?.page}`);
      continue;
    }
    if (card.evidence_quote && card.evidence_quote.length >= 24) {
      const markdown = await readFile(path.join(root, page.markdown_path), "utf8");
      if (!containsLoose(markdown, card.evidence_quote)) {
        warnings.push(`Card ${card.evidence_id} quote not found exactly on cited page ${card.citation.page}`);
      }
    }
    if (!card.not_allowed_use || String(card.not_allowed_use).trim().length < 8) {
      warnings.push(`Card ${card.evidence_id} has weak not_allowed_use guidance`);
    }
  }

  if (retrieval.records?.length !== cards.length) {
    errors.push(`Retrieval records ${retrieval.records?.length ?? 0} != evidence cards ${cards.length}`);
  }

  console.log(`Validated ${sources.length} sources`);
  console.log(`Validated ${pages.length} page records`);
  console.log(`Validated ${analyses.length} document analyses`);
  console.log(`Validated ${cards.length} evidence cards`);
  console.log(`Warnings: ${warnings.length}`);

  for (const warning of warnings.slice(0, 20)) {
    console.warn(`Warning: ${warning}`);
  }

  if (warnings.length > 20) {
    console.warn(`Warning: ${warnings.length - 20} additional warnings omitted`);
  }

  if (errors.length) {
    for (const error of errors) {
      console.error(`Error: ${error}`);
    }
    process.exit(1);
  }

  console.log("Local knowledge artifact validation passed");
}

async function readJson(filename) {
  return JSON.parse(await readFile(path.join(dataRoot, filename), "utf8"));
}

function containsLoose(haystack, needle) {
  const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  const normalizedHaystack = normalize(haystack);
  const normalizedNeedle = normalize(needle).slice(0, 140);
  if (normalizedNeedle.length < 24 || normalizedHaystack.includes(normalizedNeedle)) {
    return true;
  }
  const words = normalizedNeedle.split(" ").filter((word) => word.length > 3);
  if (words.length < 5) return false;
  const hits = words.filter((word) => normalizedHaystack.includes(word)).length;
  return hits / words.length >= 0.75;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
