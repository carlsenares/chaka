import { access, readFile } from "fs/promises";
import path from "path";

export type LocalKnowledgeSourceView = {
  sourceId: string;
  title: string;
  sourceStatus: string;
  sourceType: string | null;
  year: string | null;
  institution: string | null;
  authors: string | null;
  location: string | null;
  artifactSummary: string[];
  raw: Record<string, unknown>;
};

export type LocalKnowledgeCatalog = {
  exists: boolean;
  path: string;
  sourceCount: number;
  sources: LocalKnowledgeSourceView[];
  error: string | null;
};

const SOURCES_PATH = path.join(process.cwd(), "data/local_knowledge/sources.json");

export async function loadLocalKnowledgeCatalog(): Promise<LocalKnowledgeCatalog> {
  const exists = await fileExists(SOURCES_PATH);

  if (!exists) {
    return {
      exists: false,
      path: SOURCES_PATH,
      sourceCount: 0,
      sources: [],
      error: null,
    };
  }

  try {
    const raw = await readFile(SOURCES_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const records = normalizeRecords(parsed);

    return {
      exists: true,
      path: SOURCES_PATH,
      sourceCount: records.length,
      sources: records.map((record, index) => toSourceView(record, index)),
      error: null,
    };
  } catch (error) {
    return {
      exists: true,
      path: SOURCES_PATH,
      sourceCount: 0,
      sources: [],
      error: error instanceof Error ? error.message : "Unable to read sources.json",
    };
  }
}

function normalizeRecords(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isObject);
  }

  if (!isObject(payload)) {
    return [];
  }

  for (const key of ["sources", "items", "records", "data"]) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.filter(isObject);
    }
  }

  if (
    "source_id" in payload ||
    "upload_id" in payload ||
    "title" in payload ||
    "name" in payload
  ) {
    return [payload];
  }

  return Object.values(payload).filter(isObject);
}

function toSourceView(record: Record<string, unknown>, index: number): LocalKnowledgeSourceView {
  const sourceId =
    stringValue(record.source_id) ??
    stringValue(record.upload_id) ??
    stringValue(record.id) ??
    `source_${String(index + 1).padStart(3, "0")}`;
  const title =
    stringValue(record.title) ??
    stringValue(record.name) ??
    stringValue(record.filename) ??
    sourceId;

  return {
    sourceId,
    title,
    sourceStatus: stringValue(record.source_status) ?? stringValue(record.status) ?? "unknown",
    sourceType:
      stringValue(record.source_type) ??
      stringValue(record.type) ??
      stringValue(record.category) ??
      null,
    year: stringValue(record.year) ?? stringValue(record.published_year) ?? null,
    institution:
      stringValue(record.institution) ??
      stringValue(record.publisher) ??
      stringValue(record.organization) ??
      null,
    authors: formatAuthors(record.authors ?? record.author),
    location: formatLocation(record.geography ?? record.location ?? record),
    artifactSummary: summarizeArtifacts(record),
    raw: record,
  };
}

function summarizeArtifacts(record: Record<string, unknown>): string[] {
  const artifactKeys: Array<[string, string]> = [
    ["document_analyses", "document analyses"],
    ["document_analysis", "document analysis"],
    ["evidence_cards", "evidence cards"],
    ["evidence_card", "evidence cards"],
    ["markdown_pages", "markdown pages"],
    ["pages", "pages"],
    ["page_text", "page text"],
    ["artifacts", "artifacts"],
    ["processing_artifacts", "processing artifacts"],
    ["review_notes", "review notes"],
    ["qa_notes", "QA notes"],
  ];

  return artifactKeys.flatMap(([key, label]) => {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.length ? [`${label}: ${value.length}`] : [];
    }

    if (isObject(value)) {
      const count = Object.keys(value).length;
      return count ? [`${label}: ${count}`] : [];
    }

    return [];
  });
}

function formatAuthors(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const parts = value.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
    return parts.length ? parts.join(", ") : null;
  }

  return null;
}

function formatLocation(value: unknown): string | null {
  if (!isObject(value)) {
    return null;
  }

  const geography = isObject(value.geography) ? value.geography : value;
  const parts = [
    stringValue(geography.country),
    stringValue(geography.region),
    stringValue(geography.zone),
    stringValue(geography.woreda),
    stringValue(geography.place),
  ].filter(Boolean) as string[];

  return parts.length ? parts.join(" / ") : null;
}

function stringValue(value: unknown): string | null {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
