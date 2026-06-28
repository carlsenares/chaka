import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { rankSiteDetails } from "@/reasoning";

const root = process.cwd();
const adminRoot = path.join(root, "data/admin");
const sourceQueuePath = path.join(root, "data/catalog/source_review_queue.json");
const investmentsPath = path.join(adminRoot, "investments.json");
const investmentNotesPath = path.join(adminRoot, "investment_update_notes.json");

export type SourceReviewQueue = {
  schema_version: "source_review_queue.v1";
  generated_at_utc: string;
  source_artifact_path: string | null;
  source_artifact_period: string | null;
  summary: Record<string, number>;
  items: SourceReviewItem[];
};

export type SourceReviewItem = {
  review_item_id: string;
  source_kind: string;
  source_ref: string;
  period: string | null;
  name: string;
  provider: string;
  source_url: string | null;
  queue_status: "pending_review" | "approved" | "rejected" | "blocked" | "monitored";
  created_at_utc: string;
  updated_at_utc: string;
  discovered_by: string;
  review_priority: "low" | "medium" | "high";
  review_reason: string | null;
  review: Record<string, unknown> | null;
  source_metadata: Record<string, unknown>;
  ingestion: {
    can_trigger: boolean;
    commands: string[];
    post_update_commands: string[];
    blocker: string | null;
    last_run: Record<string, unknown> | null;
  };
};

export type Investment = {
  investment_id: string;
  name: string;
  region: string;
  zone: string;
  woreda: string;
  site_id: string;
  created_at_utc: string;
  intervention: string;
  status: "planned" | "active" | "monitoring";
  area_ha: number;
  summary: string;
  current_score: number;
  baseline_score: number;
  score_history: Array<{
    year: number;
    score: number;
    why_changed: string;
  }>;
  image_timeline: Array<{
    year: number;
    label: string;
    image_url: string;
    note: string;
  }>;
  update_note: string;
};

export type InvestmentNote = {
  investment_id: string;
  region: string;
  site_id: string;
  watched_artifacts: string[];
  requested_update_logic: string;
  created_at_utc: string;
};

export async function readSourceQueue() {
  if (!existsSync(sourceQueuePath)) return emptySourceQueue();
  return JSON.parse(await readFile(sourceQueuePath, "utf8")) as SourceReviewQueue;
}

export async function writeSourceQueue(queue: SourceReviewQueue) {
  queue.generated_at_utc = new Date().toISOString();
  queue.summary = summarizeSourceItems(queue.items);
  await mkdir(path.dirname(sourceQueuePath), { recursive: true });
  await writeFile(sourceQueuePath, `${JSON.stringify(queue, null, 2)}\n`);
}

export async function addUrlSourceCandidate(sourceUrl: string, note: string | null) {
  const queue = await readSourceQueue();
  const now = new Date().toISOString();
  const url = new URL(sourceUrl);
  const id = `admin_source:${slug(`${url.hostname}-${url.pathname}`) || randomUUID().slice(0, 8)}`;
  const existing = queue.items.find((item) => item.review_item_id === id);
  if (existing) return existing;

  const item: SourceReviewItem = {
    review_item_id: id,
    source_kind: "admin_url_upload",
    source_ref: id,
    period: queue.source_artifact_period,
    name: titleFromUrl(url),
    provider: url.hostname,
    source_url: sourceUrl,
    queue_status: "pending_review",
    created_at_utc: now,
    updated_at_utc: now,
    discovered_by: "admin_upload",
    review_priority: "medium",
    review_reason: note || "Admin-submitted URL needs validation before registry or ingestion work.",
    review: null,
    source_metadata: {
      proposed_class: "source_candidate",
      proposed_pipeline_role: "admin_submitted_source",
      access_status: "unknown",
      license_status: "unknown",
      automation_readiness: "needs_probe",
      recommended_boundary: "catalog_only",
      risks: ["URL has not been probed or license-checked yet."],
      citations: [{ title: titleFromUrl(url), url: sourceUrl, accessed_at_utc: now }],
    },
    ingestion: {
      can_trigger: false,
      commands: [],
      post_update_commands: [
        "npm run data:features",
        "npm run data:rank",
        "npm run data:candidates:validate",
        "npm run data:artifacts:validate",
      ],
      blocker: "No extractor is configured yet. Validate provider, license, coverage, and access first.",
      last_run: null,
    },
  };
  queue.items.unshift(item);
  await writeSourceQueue(queue);
  return item;
}

export async function addFileSourceCandidate(file: File, note: string | null) {
  const queue = await readSourceQueue();
  const now = new Date().toISOString();
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 140);
  const uploadDir = path.join(root, "data/admin_uploads/inbox");
  const storedName = `${Date.now()}-${safeName}`;
  const storedPath = path.join(uploadDir, storedName);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(storedPath, bytes);

  const id = `admin_upload:${slug(safeName.replace(/\.[^.]+$/, ""))}-${Date.now().toString(36)}`;
  const item: SourceReviewItem = {
    review_item_id: id,
    source_kind: "admin_file_upload",
    source_ref: id,
    period: queue.source_artifact_period,
    name: safeName,
    provider: "admin upload",
    source_url: null,
    queue_status: "pending_review",
    created_at_utc: now,
    updated_at_utc: now,
    discovered_by: "admin_upload",
    review_priority: "medium",
    review_reason: note || "Uploaded document/data file needs triage before use.",
    review: null,
    source_metadata: {
      filename: safeName,
      stored_path: path.relative(root, storedPath),
      content_type: file.type || "unknown",
      size_bytes: bytes.length,
      proposed_class: file.name.toLowerCase().match(/\.(pdf|docx|doc|txt|md)$/)
        ? "local_knowledge_document"
        : "source_candidate",
      access_status: "uploaded",
      license_status: "unknown",
      automation_readiness: "needs_probe",
      recommended_boundary: "local_knowledge",
      risks: ["Uploaded file has not been reviewed for license, relevance, or prompt-injection risk."],
    },
    ingestion: {
      can_trigger: false,
      commands: [],
      post_update_commands: [
        "npm run data:features",
        "npm run data:rank",
        "npm run data:candidates:validate",
        "npm run data:artifacts:validate",
      ],
      blocker: "Run admin upload triage and approve promotion before ingestion.",
      last_run: null,
    },
  };
  queue.items.unshift(item);
  await writeSourceQueue(queue);
  return item;
}

export async function readInvestments() {
  if (!existsSync(investmentsPath)) {
    const seeded = seedInvestments();
    await writeInvestments(seeded);
    await writeInvestmentNotes(seeded.map(investmentToNote));
    return seeded;
  }
  return JSON.parse(await readFile(investmentsPath, "utf8")) as Investment[];
}

export async function readInvestment(investmentId: string) {
  const investments = await readInvestments();
  return investments.find((investment) => investment.investment_id === investmentId) ?? null;
}

export async function addInvestment(input: {
  region: string;
  intervention: string;
  site_id?: string | null;
}) {
  const investments = await readInvestments();
  const sites = rankSiteDetails();
  const site =
    sites.find((item) => item.site_features.site_id === input.site_id) ??
    sites.find((item) => item.site_features.region === input.region) ??
    sites[0];
  const region = input.region || site.site_features.region;
  const intervention = input.intervention.trim() || "Assisted natural regeneration";
  const investment: Investment = {
    investment_id: `investment:${slug(`${region}-${intervention}`)}-${Date.now().toString(36)}`,
    name: `${site.site_features.woreda} ${plainInvestmentName(intervention)}`,
    region,
    zone: site.site_features.zone,
    woreda: site.site_features.woreda,
    site_id: site.site_features.site_id,
    created_at_utc: new Date().toISOString(),
    intervention,
    status: "planned",
    area_ha: Math.round(site.site_features.area_ha * 0.42),
    summary: `Planned investment in ${site.site_features.woreda}, ${site.site_features.zone}.`,
    baseline_score: Math.max(36, site.recommendation.priority_score - 7),
    current_score: site.recommendation.priority_score,
    score_history: [
      { year: 2026, score: site.recommendation.priority_score, why_changed: "Investment registered; future data refreshes will compare source-derived changes in this region." },
    ],
    image_timeline: [
      {
        year: 2026,
        label: "Registration baseline",
        image_url: "/admin-investments/challenge-green-hillside.png",
        note: "Mock baseline image attached for the demo investment record.",
      },
    ],
    update_note:
      "On each data refresh, compare this region's score, component drivers, local evidence, and imagery against the baseline.",
  };
  investments.unshift(investment);
  await writeInvestments(investments);

  const notes = await readInvestmentNotes();
  notes.unshift(investmentToNote(investment));
  await writeInvestmentNotes(notes);
  return investment;
}

export async function readRegionsAndSites() {
  const sites = rankSiteDetails();
  const regions = [...new Set(sites.map((site) => site.site_features.region))].sort();
  return {
    regions,
    sites: sites.map((site) => ({
      site_id: site.site_features.site_id,
      region: site.site_features.region,
      zone: site.site_features.zone,
      woreda: site.site_features.woreda,
      priority_score: site.recommendation.priority_score,
      recommended_intervention: site.recommendation.recommended_intervention,
    })),
  };
}

async function writeInvestments(investments: Investment[]) {
  await mkdir(adminRoot, { recursive: true });
  await writeFile(investmentsPath, `${JSON.stringify(investments, null, 2)}\n`);
}

async function readInvestmentNotes() {
  if (!existsSync(investmentNotesPath)) return [] as InvestmentNote[];
  return JSON.parse(await readFile(investmentNotesPath, "utf8")) as InvestmentNote[];
}

async function writeInvestmentNotes(notes: InvestmentNote[]) {
  await mkdir(adminRoot, { recursive: true });
  await writeFile(investmentNotesPath, `${JSON.stringify(notes, null, 2)}\n`);
}

function investmentToNote(investment: Investment): InvestmentNote {
  return {
    investment_id: investment.investment_id,
    region: investment.region,
    site_id: investment.site_id,
    watched_artifacts: [
      "data/features/site_features.json",
      "models/artifacts/site_predictions.json",
      "data/features/source_extracts/",
      "data/local_knowledge/evidence_cards.json",
    ],
    requested_update_logic:
      "When source-derived features, score, local evidence, or imagery change for this region, update the investment page with score delta, driver explanation, and visual timeline evidence.",
    created_at_utc: new Date().toISOString(),
  };
}

function seedInvestments(): Investment[] {
  const sites = rankSiteDetails();
  const gimbo = sites.find((site) => site.site_features.woreda.toLowerCase().includes("gimbo")) ?? sites[0];
  const dryland =
    sites.find((site) => site.site_features.region === "South Ethiopia" && site.site_features.land_cover_primary.includes("shrubland")) ??
    sites.find((site) => site.site_features.region === "South Ethiopia") ??
    sites[1] ??
    sites[0];
  return [
    {
      investment_id: "investment:gimbo-assisted-natural-regeneration-demo",
      name: `${gimbo.site_features.woreda} forest recovery`,
      region: gimbo.site_features.region,
      zone: gimbo.site_features.zone,
      woreda: gimbo.site_features.woreda,
      site_id: gimbo.site_features.site_id,
      created_at_utc: "2026-06-28T08:00:00.000Z",
      intervention: "Assisted natural regeneration with community protection",
      status: "monitoring",
      area_ha: 1280,
      summary: "Community protection and enrichment planting on degraded forest-edge slopes.",
      baseline_score: Math.max(35, gimbo.recommendation.priority_score - 12),
      current_score: gimbo.recommendation.priority_score,
      score_history: [
        { year: 2019, score: Math.max(35, gimbo.recommendation.priority_score - 12), why_changed: "Baseline showed sparse tree cover and high slope risk." },
        { year: 2022, score: Math.max(42, gimbo.recommendation.priority_score - 6), why_changed: "Mock monitoring shows vegetation recovery and reduced bare-soil signal." },
        { year: 2026, score: gimbo.recommendation.priority_score, why_changed: "Current feature stack gives stronger forest-edge and rainfall context, but field validation is still required." },
      ],
      image_timeline: [
        { year: 2019, label: "Baseline", image_url: "/admin-investments/satellite-gimbo-2019.svg", note: "Sparse green patches before protection." },
        { year: 2022, label: "Early recovery", image_url: "/admin-investments/satellite-gimbo-2022.svg", note: "More contiguous vegetation in protected gullies." },
        { year: 2026, label: "Current mock state", image_url: "/admin-investments/satellite-gimbo-2026.svg", note: "Denser canopy pattern in the investment area." },
        { year: 2026, label: "Field context", image_url: "/admin-investments/challenge-green-hillside.png", note: "Landscape image extracted from AI4goodChallenge.pdf for demo context." },
      ],
      update_note:
        "Needs automatic update when Gimbo source-derived score, NDVI trend, forest context, or local evidence changes.",
    },
    {
      investment_id: "investment:south-ethiopia-soil-water-demo",
      name: `${dryland.site_features.woreda} soil-water works`,
      region: dryland.site_features.region,
      zone: dryland.site_features.zone,
      woreda: dryland.site_features.woreda,
      site_id: dryland.site_features.site_id,
      created_at_utc: "2026-06-28T08:05:00.000Z",
      intervention: "Terracing repair, exclosures, and native tree planting",
      status: "active",
      area_ha: 740,
      summary: "Dryland restoration package focused on erosion control and vegetation recovery.",
      baseline_score: Math.max(30, dryland.recommendation.priority_score - 9),
      current_score: dryland.recommendation.priority_score,
      score_history: [
        { year: 2020, score: Math.max(30, dryland.recommendation.priority_score - 9), why_changed: "Baseline dryland context had low vegetation cover and high erosion sensitivity." },
        { year: 2026, score: dryland.recommendation.priority_score, why_changed: "Mock vegetation recovery improves implementation story, but source-derived trend data is still pending." },
      ],
      image_timeline: [
        { year: 2020, label: "Dry baseline", image_url: "/admin-investments/satellite-konso-2020.svg", note: "Sparse vegetation and exposed soil pattern." },
        { year: 2026, label: "Restoration mock", image_url: "/admin-investments/satellite-konso-2026.svg", note: "Vegetation patches expand around restored terraces." },
        { year: 2026, label: "Forest-edge context", image_url: "/admin-investments/challenge-forest-ridge.png", note: "Landscape image extracted from AI4goodChallenge.pdf for demo context." },
      ],
      update_note:
        "Needs automatic update when regional rainfall, soil, slope, vegetation, or source imagery changes.",
    },
  ];
}

function summarizeSourceItems(items: SourceReviewItem[]) {
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

function emptySourceQueue(): SourceReviewQueue {
  return {
    schema_version: "source_review_queue.v1",
    generated_at_utc: new Date().toISOString(),
    source_artifact_path: null,
    source_artifact_period: null,
    summary: summarizeSourceItems([]),
    items: [],
  };
}

function titleFromUrl(url: URL) {
  const final = url.pathname.split("/").filter(Boolean).pop();
  return final ? final.replace(/[-_]+/g, " ").replace(/\.\w+$/, "") : url.hostname;
}

function plainInvestmentName(intervention: string) {
  return intervention
    .replace(/\b(with|and|for|the|a|an)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 80);
}
