#!/usr/bin/env node

import fs from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

const root = process.cwd();
const dataRoot = path.join(root, "data/local_knowledge");
const routingPath = path.join(root, "config/openai-model-routing.json");
const candidatesPath = path.join(root, "data/processed/candidate_sites.geojson");
const dryRun = process.argv.includes("--dry-run");
const skipOpenAI = process.argv.includes("--skip-openai");
const syncVectorStore = process.argv.includes("--sync-vector-store");
const syncOnly = process.argv.includes("--sync-only");
const limitSources = getNumberArg("--limit-sources");
const onlySource = getStringArg("--source");

const routing = JSON.parse(await readFile(routingPath, "utf8"));
const sources = await readJsonIfExists(path.join(dataRoot, "sources.json"), []);
const pagesManifest = await readJsonIfExists(path.join(dataRoot, "pages_manifest.json"), []);
const candidates = JSON.parse(await readFile(candidatesPath, "utf8"));
const apiKey = loadOpenAiKey();
const client = apiKey && !skipOpenAI ? new OpenAI({ apiKey }) : null;

const candidatePlaces = collectCandidatePlaces(candidates);
const selectedSources = sources
  .filter((source) => source.file_type === "pdf" && source.processing_status === "markdown_extracted")
  .filter((source) => !onlySource || source.source_id === onlySource || source.filename === onlySource)
  .slice(0, limitSources ?? undefined);

async function main() {
  if (syncOnly) {
    if (!client) {
      throw new Error("OPENAI_API_KEY is required for --sync-only");
    }
    const vectorStore = await syncEvidenceCardsToVectorStore();
    await writeJson(path.join(dataRoot, "openai_vector_store.json"), vectorStore);
    console.log(`Synced existing evidence_cards.jsonl to vector store ${vectorStore.vector_store_id}`);
    return;
  }

  if (!selectedSources.length) {
    throw new Error("No markdown-extracted PDF sources found. Run npm run data:local-knowledge:md first.");
  }

  console.log(`Processing ${selectedSources.length} sources${client ? " with OpenAI" : " without OpenAI"}`);

  const documentAnalyses = [];
  const evidenceCards = [];

  for (const source of selectedSources) {
    const sourcePages = pagesManifest.filter((page) => page.source_id === source.source_id);
    const profile = await buildDocumentProfile(source, sourcePages);
    const analysis = client
      ? await withModelFallback("structured_extractor", (model) =>
          runDocumentAnalysis(model, source, profile),
        )
      : deterministicDocumentAnalysis(source, profile);

    const normalizedAnalysis = normalizeDocumentAnalysis(analysis);
    documentAnalyses.push(normalizedAnalysis);

    const selectedPages = await selectEvidencePages(source, sourcePages, normalizedAnalysis);
    const cards = client
      ? await withModelFallback("structured_extractor", (model) =>
          runEvidenceExtraction(model, source, normalizedAnalysis, selectedPages),
        )
      : deterministicEvidenceCards(source, normalizedAnalysis, selectedPages);

    evidenceCards.push(...cards.map((card, index) => normalizeEvidenceCard(card, source, normalizedAnalysis, index)));
    console.log(`${source.filename}: ${normalizedAnalysis.document_use_class}; ${cards.length} evidence cards`);
  }

  const retrievalIndex = await buildRetrievalIndex(evidenceCards);

  if (dryRun) {
    console.log(`Dry run: would write ${documentAnalyses.length} analyses, ${evidenceCards.length} cards`);
    return;
  }

  await mkdir(dataRoot, { recursive: true });
  await writeJson(path.join(dataRoot, "document_analyses.json"), documentAnalyses);
  await writeJson(path.join(dataRoot, "evidence_cards.json"), evidenceCards);
  await writeJson(path.join(dataRoot, "retrieval_index.json"), retrievalIndex);
  await writeJsonl(path.join(dataRoot, "evidence_cards.jsonl"), evidenceCards.map(cardToJsonlRecord));
  await writeFile(path.join(dataRoot, "evidence_cards_openai.md"), evidenceCards.map(cardToMarkdown).join("\n\n---\n\n"));

  if (syncVectorStore && client) {
    const vectorStore = await syncEvidenceCardsToVectorStore();
    await writeJson(path.join(dataRoot, "openai_vector_store.json"), vectorStore);
  }

  console.log(`Wrote data/local_knowledge/document_analyses.json`);
  console.log(`Wrote data/local_knowledge/evidence_cards.json`);
  console.log(`Wrote data/local_knowledge/retrieval_index.json`);
}

async function runDocumentAnalysis(model, source, profile) {
  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You analyze restoration research sources for a geospatial investment intelligence system. Return only schema-valid JSON. Be conservative. Do not overstate local specificity or scoring eligibility.",
      },
      {
        role: "user",
        content: JSON.stringify({
          source,
          candidate_places: candidatePlaces,
          document_profile: profile,
          task:
            "Create a source validity profile. Decide geography, allowed uses, blocked uses, subjectivity risk, and whether any facts may be candidates for future scoring only after manual QA.",
        }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "document_analysis",
        strict: true,
        schema: documentAnalysisSchema,
      },
    },
  });

  return JSON.parse(response.output_text);
}

async function runEvidenceExtraction(model, source, analysis, selectedPages) {
  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "Extract concise, source-grounded evidence cards for restoration intelligence. Return only schema-valid JSON. Claims must be supported by the provided page text and cite page numbers.",
      },
      {
        role: "user",
        content: JSON.stringify({
          source,
          document_analysis: analysis,
          selected_pages: selectedPages,
          task:
            "Extract up to 8 evidence cards. Prefer implementation caveats, geography-specific findings, scoring-candidate measurements, and field validation questions. If support is weak, mark low confidence.",
        }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "evidence_card_batch",
        strict: true,
        schema: evidenceCardBatchSchema,
      },
    },
  });

  const parsed = JSON.parse(response.output_text);
  return parsed.evidence_cards ?? [];
}

async function buildDocumentProfile(source, sourcePages) {
  const firstPages = sourcePages.slice(0, 4);
  const keywordPages = scorePages(sourcePages)
    .filter((page) => page.score > 0)
    .slice(0, 10)
    .map((page) => page.page);
  const pageNumbers = [...new Set([...firstPages.map((page) => page.page), ...keywordPages])].slice(0, 12);
  const pages = [];

  for (const pageNumber of pageNumbers) {
    const page = sourcePages.find((candidate) => candidate.page === pageNumber);
    if (!page) continue;
    pages.push(await readPageForModel(page, 3500));
  }

  return {
    source_id: source.source_id,
    filename: source.filename,
    page_count: source.page_count,
    low_text_pages: source.low_text_pages,
    candidate_places: candidatePlaces,
    sampled_pages: pages,
  };
}

async function selectEvidencePages(source, sourcePages, analysis) {
  const ranked = scorePages(sourcePages, analysis)
    .slice(0, 10);
  const selected = ranked.length ? ranked : sourcePages.slice(0, 6).map((page) => ({ ...page, score: 0 }));
  const pages = [];

  for (const page of selected.slice(0, 10)) {
    pages.push(await readPageForModel(page, 4500));
  }

  return pages;
}

function scorePages(sourcePages, analysis = null) {
  const analysisTerms = [
    ...(analysis?.geographic_scope?.places ?? []),
    ...(analysis?.topics ?? []),
    ...(analysis?.intervention_tags ?? []),
  ].map((value) => String(value).toLowerCase());
  const terms = [
    ...candidatePlaces.flatMap((place) => [place.region, place.zone, place.woreda]).filter(Boolean),
    "grazing",
    "livestock",
    "erosion",
    "soil",
    "carbon",
    "biomass",
    "forest",
    "tree",
    "agroforestry",
    "restoration",
    "biodiversity",
    "settlement",
    "tenure",
    "species",
    "method",
    "result",
    "table",
    ...analysisTerms,
  ].map((term) => String(term).toLowerCase());

  return sourcePages
    .map((page) => {
      const text = `${page.text_preview ?? ""}`.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (term && text.includes(term) ? 1 : 0), 0);
      return { ...page, score };
    })
    .sort((a, b) => b.score - a.score || b.word_count - a.word_count);
}

async function readPageForModel(page, maxChars) {
  const md = await readFile(path.join(root, page.markdown_path), "utf8");
  return {
    page: page.page,
    extraction_quality: page.extraction_quality,
    word_count: page.word_count,
    text: md.slice(0, maxChars),
  };
}

async function buildRetrievalIndex(evidenceCards) {
  const records = evidenceCards.map((card) => ({
    id: card.evidence_id,
    text: evidenceCardSearchText(card),
    metadata: {
      source_id: card.source_id,
      filename: card.filename,
      page: card.citation.page,
      confidence: card.confidence,
      allowed_use: card.allowed_use,
      review_status: card.review_status,
      topics: card.topics,
      intervention_tags: card.intervention_tags,
      candidate_site_ids: card.geography.candidate_site_ids,
      region: card.geography.region,
      zone: card.geography.zone,
      woreda: card.geography.woreda,
    },
  }));

  if (!client || records.length === 0) {
    return { embedding_model: null, records };
  }

  const model = routing.models.embedding;
  const embeddings = [];
  for (let index = 0; index < records.length; index += 64) {
    const batch = records.slice(index, index + 64);
    const response = await client.embeddings.create({
      model,
      input: batch.map((record) => record.text),
    });
    for (const item of response.data) {
      embeddings.push(item.embedding);
    }
  }

  return {
    embedding_model: model,
    records: records.map((record, index) => ({
      ...record,
      embedding: embeddings[index],
    })),
  };
}

async function syncEvidenceCardsToVectorStore() {
  const markdownPath = path.join(dataRoot, "evidence_cards_openai.md");
  if (!fs.existsSync(markdownPath)) {
    const cards = await readJsonIfExists(path.join(dataRoot, "evidence_cards.json"), []);
    await writeFile(markdownPath, cards.map(cardToMarkdown).join("\n\n---\n\n"));
  }
  const vectorStore = await client.vectorStores.create({
    name: `Chaka local knowledge ${new Date().toISOString()}`,
    description: "Chaka local knowledge evidence cards for restoration intelligence RAG",
  });
  const file = await client.vectorStores.files.uploadAndPoll(
    vectorStore.id,
    fs.createReadStream(markdownPath),
    { pollIntervalMs: 2000 },
  );
  const readyStore = await client.vectorStores.retrieve(vectorStore.id);
  return {
    vector_store_id: readyStore.id,
    vector_store_file_id: file.id,
    name: readyStore.name,
    status: readyStore.status,
    file_counts: readyStore.file_counts,
    created_at: readyStore.created_at,
    synced_at: new Date().toISOString(),
    source_file: "data/local_knowledge/evidence_cards_openai.md",
  };
}

async function withModelFallback(route, fn) {
  const models = [routing.models[route], ...(routing.fallbacks[route] ?? [])].filter(Boolean);
  let lastError = null;
  for (const model of models) {
    try {
      return await fn(model);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Model ${model} failed for ${route}: ${message.slice(0, 240)}`);
    }
  }
  throw lastError ?? new Error(`No model configured for ${route}`);
}

function deterministicDocumentAnalysis(source, profile) {
  const filename = source.filename.toLowerCase();
  const text = profile.sampled_pages.map((page) => page.text).join("\n").toLowerCase();
  const matchedPlaces = candidatePlaces.filter((place) =>
    [place.region, place.zone, place.woreda].some((value) => value && text.includes(value.toLowerCase())),
  );
  const sourceType = filename.includes("thesis") || text.includes("thesis")
    ? "thesis"
    : filename.includes("report") || text.includes("report")
      ? "official_or_project_report"
      : "research_source";

  return {
    source_id: source.source_id,
    filename: source.filename,
    title: source.filename.replace(/\.pdf$/i, ""),
    source_type: sourceType,
    year: inferYear(`${source.filename}\n${text}`),
    document_use_class: matchedPlaces.length ? "local_implementation_context" : "national_or_comparable_context",
    geographic_scope: {
      match_level: matchedPlaces.length ? "candidate_or_admin_match" : "national_or_unspecified",
      candidate_site_ids: [...new Set(matchedPlaces.map((place) => place.site_id))],
      country: "Ethiopia",
      region: matchedPlaces[0]?.region ?? null,
      zone: matchedPlaces[0]?.zone ?? null,
      woreda: matchedPlaces[0]?.woreda ?? null,
      places: [...new Set(matchedPlaces.flatMap((place) => [place.region, place.zone, place.woreda]).filter(Boolean))],
    },
    topics: inferTopics(text),
    intervention_tags: inferInterventionTags(text),
    validity: {
      overall_confidence: sourceType === "thesis" ? "medium" : "medium_low",
      subjectivity_risk: "medium",
      method_clarity: text.includes("method") ? "partial" : "unclear",
      ocr_quality: source.low_text_pages > 0 ? "mixed" : "good",
      notes: ["Deterministic fallback analysis; OpenAI analysis was not used."],
    },
    allowed_uses: ["implementation_caveat", "field_validation_question", "narrative_context"],
    blocked_uses: ["direct_score_override"],
    scoring_candidate_facts: [],
    summary: "Fallback source profile created from extracted markdown.",
  };
}

function deterministicEvidenceCards(source, analysis, selectedPages) {
  return selectedPages.slice(0, 4).map((page, index) => ({
    evidence_id: `${source.source_id}:fallback:${index + 1}`,
    claim: `This source contains potentially relevant local restoration context on page ${page.page}; manual review is required before using it as a strong claim.`,
    source_id: source.source_id,
    filename: source.filename,
    source_type: analysis.source_type,
    geography: analysis.geographic_scope,
    topics: analysis.topics,
    intervention_tags: analysis.intervention_tags,
    allowed_use: "field_validation_question",
    not_allowed_use: "direct_score_override",
    confidence: "low",
    review_status: "needs_manual_qa",
    citation: { page: page.page, locator: `page ${page.page}` },
    evidence_quote: page.text.split("\n").find((line) => line.trim().length > 40)?.trim().slice(0, 280) ?? "",
    validation_notes: ["Fallback evidence card; model extraction was not used."],
  }));
}

function normalizeEvidenceCard(card, source, analysis, index) {
  const sourceConfidence = analysis.validity?.overall_confidence ?? "medium_low";
  return {
    evidence_id: card.evidence_id || `${source.source_id}:card:${index + 1}`,
    source_id: source.source_id,
    filename: source.filename,
    source_type: analysis.source_type,
    claim: card.claim,
    evidence_quote: card.evidence_quote ?? "",
    citation: {
      page: Number(card.citation?.page ?? card.page ?? 1),
      locator: card.citation?.locator ?? `page ${card.citation?.page ?? 1}`,
    },
    geography: normalizeGeography(card.geography ?? analysis.geographic_scope),
    topics: normalizeStringArray(card.topics ?? analysis.topics),
    intervention_tags: normalizeStringArray(card.intervention_tags ?? analysis.intervention_tags),
    allowed_use: card.allowed_use ?? "implementation_caveat",
    not_allowed_use: card.not_allowed_use ?? "direct_score_override",
    confidence: downgradeConfidence(card.confidence ?? sourceConfidence, sourceConfidence),
    source_confidence: sourceConfidence,
    review_status: card.review_status ?? "needs_manual_qa",
    validation_notes: normalizeStringArray(card.validation_notes),
  };
}

function normalizeDocumentAnalysis(analysis) {
  const blockedUses = normalizeStringArray(analysis.blocked_uses);
  if (!blockedUses.includes("direct_score_override")) {
    blockedUses.push("direct_score_override");
  }

  return {
    ...analysis,
    blocked_uses: blockedUses,
    allowed_uses: normalizeStringArray(analysis.allowed_uses),
    topics: normalizeStringArray(analysis.topics),
    intervention_tags: normalizeStringArray(analysis.intervention_tags),
  };
}

function downgradeConfidence(cardConfidence, sourceConfidence) {
  const order = ["blocked", "low", "medium_low", "medium", "medium_high", "high"];
  const cardIndex = order.indexOf(cardConfidence);
  const sourceIndex = order.indexOf(sourceConfidence);
  if (cardIndex === -1) return sourceConfidence;
  if (sourceIndex === -1) return cardConfidence;
  return order[Math.min(cardIndex, sourceIndex)];
}

function normalizeGeography(geography) {
  return {
    country: geography?.country ?? "Ethiopia",
    region: geography?.region ?? null,
    zone: geography?.zone ?? null,
    woreda: geography?.woreda ?? null,
    places: normalizeStringArray(geography?.places ?? geography?.place_names),
    candidate_site_ids: normalizeStringArray(geography?.candidate_site_ids),
    match_level: geography?.match_level ?? "unspecified",
  };
}

function evidenceCardSearchText(card) {
  return [
    card.claim,
    card.evidence_quote,
    card.geography.region,
    card.geography.zone,
    card.geography.woreda,
    ...(card.geography.places ?? []),
    ...(card.topics ?? []),
    ...(card.intervention_tags ?? []),
  ].filter(Boolean).join("\n");
}

function cardToJsonlRecord(card) {
  return {
    id: card.evidence_id,
    text: evidenceCardSearchText(card),
    metadata: {
      source_id: card.source_id,
      filename: card.filename,
      page: card.citation.page,
      confidence: card.confidence,
      source_confidence: card.source_confidence,
      allowed_use: card.allowed_use,
      review_status: card.review_status,
      region: card.geography.region,
      zone: card.geography.zone,
      woreda: card.geography.woreda,
      topics: card.topics,
      intervention_tags: card.intervention_tags,
      candidate_site_ids: card.geography.candidate_site_ids,
    },
  };
}

function cardToMarkdown(card) {
  return [
    `# Evidence ${card.evidence_id}`,
    "",
    `Evidence ID: ${card.evidence_id}`,
    `Source ID: ${card.source_id}`,
    `Filename: ${card.filename}`,
    `Page: ${card.citation.page}`,
    `Confidence: ${card.confidence}`,
    `Source confidence: ${card.source_confidence}`,
    `Allowed use: ${card.allowed_use}`,
    `Not allowed use: ${card.not_allowed_use}`,
    `Region: ${card.geography.region ?? ""}`,
    `Zone: ${card.geography.zone ?? ""}`,
    `Woreda: ${card.geography.woreda ?? ""}`,
    `Candidate site IDs: ${card.geography.candidate_site_ids.join(", ")}`,
    `Topics: ${card.topics.join(", ")}`,
    `Intervention tags: ${card.intervention_tags.join(", ")}`,
    "",
    "Claim:",
    card.claim,
    "",
    "Evidence quote:",
    card.evidence_quote || "[No quote provided]",
  ].join("\n");
}

function collectCandidatePlaces(featureCollection) {
  return featureCollection.features.map((feature) => ({
    site_id: feature.properties.site_id,
    region: feature.properties.region,
    zone: feature.properties.zone,
    woreda: feature.properties.woreda,
    name: feature.properties.name,
  }));
}

function inferYear(text) {
  const years = [...text.matchAll(/\b(19|20)\d{2}\b/g)].map((match) => Number(match[0]));
  return years.find((year) => year >= 1990 && year <= 2035) ?? null;
}

function inferTopics(text) {
  const topics = [];
  for (const [needle, topic] of [
    ["grazing", "grazing_pressure"],
    ["livestock", "livestock_pressure"],
    ["erosion", "erosion"],
    ["soil", "soil"],
    ["carbon", "carbon"],
    ["forest", "forest"],
    ["biodiversity", "biodiversity"],
    ["settlement", "settlement_pressure"],
    ["tenure", "tenure"],
    ["species", "species_selection"],
  ]) {
    if (text.includes(needle)) topics.push(topic);
  }
  return [...new Set(topics)];
}

function inferInterventionTags(text) {
  const tags = [];
  if (text.includes("agroforestry")) tags.push("agroforestry");
  if (text.includes("tree") || text.includes("forest")) tags.push("native_tree_planting");
  if (text.includes("natural regeneration")) tags.push("assisted_natural_regeneration");
  if (text.includes("erosion") || text.includes("soil conservation")) tags.push("soil_conservation");
  if (text.includes("grazing") || text.includes("livestock")) tags.push("field_validation_before_investment");
  return [...new Set(tags)];
}

function normalizeStringArray(value) {
  return [...new Set((Array.isArray(value) ? value : []).map((item) => String(item)).filter(Boolean))];
}

async function writeJson(filename, value) {
  await writeFile(filename, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeJsonl(filename, rows) {
  await writeFile(filename, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
}

async function readJsonIfExists(filename, fallback) {
  try {
    return JSON.parse(await readFile(filename, "utf8"));
  } catch {
    return fallback;
  }
}

function loadOpenAiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const envLocal = path.join(root, ".env.local");
  if (!fs.existsSync(envLocal)) return null;
  const content = fs.readFileSync(envLocal, "utf8");
  const match = content.match(/^OPENAI_API_KEY=(.+)$/m);
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? null;
}

function getStringArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function getNumberArg(name) {
  const value = getStringArg(name);
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

const documentAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "source_id",
    "filename",
    "title",
    "source_type",
    "year",
    "document_use_class",
    "geographic_scope",
    "topics",
    "intervention_tags",
    "validity",
    "allowed_uses",
    "blocked_uses",
    "scoring_candidate_facts",
    "summary",
  ],
  properties: {
    source_id: { type: "string" },
    filename: { type: "string" },
    title: { type: "string" },
    source_type: { type: "string" },
    year: { type: ["number", "null"] },
    document_use_class: {
      type: "string",
      enum: [
        "site_specific_context",
        "local_implementation_context",
        "comparable_landscape_context",
        "national_policy_or_methods_context",
        "national_or_comparable_context",
        "blocked_or_low_confidence",
      ],
    },
    geographic_scope: {
      type: "object",
      additionalProperties: false,
      required: ["match_level", "candidate_site_ids", "country", "region", "zone", "woreda", "places"],
      properties: {
        match_level: { type: "string" },
        candidate_site_ids: { type: "array", items: { type: "string" } },
        country: { type: "string" },
        region: { type: ["string", "null"] },
        zone: { type: ["string", "null"] },
        woreda: { type: ["string", "null"] },
        places: { type: "array", items: { type: "string" } },
      },
    },
    topics: { type: "array", items: { type: "string" } },
    intervention_tags: { type: "array", items: { type: "string" } },
    validity: {
      type: "object",
      additionalProperties: false,
      required: ["overall_confidence", "subjectivity_risk", "method_clarity", "ocr_quality", "notes"],
      properties: {
        overall_confidence: { type: "string", enum: ["blocked", "low", "medium_low", "medium", "medium_high", "high"] },
        subjectivity_risk: { type: "string", enum: ["low", "medium", "high"] },
        method_clarity: { type: "string", enum: ["clear", "partial", "unclear"] },
        ocr_quality: { type: "string", enum: ["good", "mixed", "poor"] },
        notes: { type: "array", items: { type: "string" } },
      },
    },
    allowed_uses: { type: "array", items: { type: "string" } },
    blocked_uses: { type: "array", items: { type: "string" } },
    scoring_candidate_facts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["variable", "page", "reason", "manual_review_required"],
        properties: {
          variable: { type: "string" },
          page: { type: ["number", "null"] },
          reason: { type: "string" },
          manual_review_required: { type: "boolean" },
        },
      },
    },
    summary: { type: "string" },
  },
};

const evidenceCardBatchSchema = {
  type: "object",
  additionalProperties: false,
  required: ["evidence_cards"],
  properties: {
    evidence_cards: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "claim",
          "evidence_quote",
          "citation",
          "geography",
          "topics",
          "intervention_tags",
          "allowed_use",
          "not_allowed_use",
          "confidence",
          "review_status",
          "validation_notes",
        ],
        properties: {
          claim: { type: "string" },
          evidence_quote: { type: "string" },
          citation: {
            type: "object",
            additionalProperties: false,
            required: ["page", "locator"],
            properties: {
              page: { type: "number" },
              locator: { type: "string" },
            },
          },
          geography: documentAnalysisSchema.properties.geographic_scope,
          topics: { type: "array", items: { type: "string" } },
          intervention_tags: { type: "array", items: { type: "string" } },
          allowed_use: { type: "string" },
          not_allowed_use: { type: "string" },
          confidence: { type: "string", enum: ["blocked", "low", "medium_low", "medium", "medium_high", "high"] },
          review_status: { type: "string" },
          validation_notes: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
