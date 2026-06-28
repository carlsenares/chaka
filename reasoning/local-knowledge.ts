import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import type {
  LocalDocumentAnalysis,
  LocalEvidenceCard,
  LocalKnowledgeMatch,
  SiteDetailResponse,
} from "@/reasoning/types";

const root = process.cwd();
const localKnowledgeRoot = path.join(root, "data/local_knowledge");

let evidenceCache: LocalEvidenceCard[] | null = null;
let analysisCache: LocalDocumentAnalysis[] | null = null;

export function getLocalEvidenceCards() {
  if (!evidenceCache) {
    evidenceCache = readJsonIfExists<LocalEvidenceCard[]>(
      path.join(localKnowledgeRoot, "evidence_cards.json"),
      [],
    );
  }

  return evidenceCache;
}

export function getLocalDocumentAnalyses() {
  if (!analysisCache) {
    analysisCache = readJsonIfExists<LocalDocumentAnalysis[]>(
      path.join(localKnowledgeRoot, "document_analyses.json"),
      [],
    );
  }

  return analysisCache;
}

export function getLocalKnowledgeForSite(
  detail: SiteDetailResponse,
  limit = 10,
): LocalKnowledgeMatch[] {
  const evidence = getLocalEvidenceCards();
  const analyses = getLocalDocumentAnalyses();
  const analysisBySource = new Map(analyses.map((analysis) => [analysis.source_id, analysis]));
  const feature = detail.site_features;
  const intervention = detail.recommendation.intervention_code;

  return evidence
    .map((card) => {
      const match = scoreEvidenceMatch(card, detail, intervention);
      return {
        card,
        source_analysis: analysisBySource.get(card.source_id) ?? null,
        match_score: match.score,
        match_reasons: match.reasons,
      };
    })
    .filter((match) => {
      if (match.card.confidence === "blocked") return false;
      if (match.card.review_status.toLowerCase().includes("blocked")) return false;
      if (match.match_score <= 0) return false;
      return (
        match.card.geography.candidate_site_ids.includes(feature.site_id) ||
        sameText(match.card.geography.woreda, feature.woreda) ||
        sameText(match.card.geography.zone, feature.zone) ||
        sameText(match.card.geography.region, feature.region) ||
        match.match_score >= 5
      );
    })
    .sort((a, b) => b.match_score - a.match_score || confidenceRank(b.card.confidence) - confidenceRank(a.card.confidence))
    .slice(0, limit);
}

export async function getHybridLocalKnowledgeForSite(
  detail: SiteDetailResponse,
  client: OpenAI,
  limit = 10,
): Promise<LocalKnowledgeMatch[]> {
  const localMatches = getLocalKnowledgeForSite(detail, Math.max(limit, 16));
  const vectorStoreConfig = readJsonIfExists<{ vector_store_id?: string }>(
    path.join(localKnowledgeRoot, "openai_vector_store.json"),
    {},
  );

  if (!vectorStoreConfig.vector_store_id) {
    return localMatches.slice(0, limit);
  }

  try {
    const openAiEvidenceIds = await searchOpenAiVectorStoreForEvidenceIds(
      client,
      vectorStoreConfig.vector_store_id,
      detail,
    );
    if (!openAiEvidenceIds.length) {
      return localMatches.slice(0, limit);
    }

    const localById = new Map(localMatches.map((match) => [match.card.evidence_id, match]));
    const allMatches = getAllLocalKnowledgeMatches(detail);
    const allById = new Map(allMatches.map((match) => [match.card.evidence_id, match]));
    const boosted = new Map<string, LocalKnowledgeMatch>();

    for (const match of localMatches) {
      boosted.set(match.card.evidence_id, match);
    }

    for (const [index, evidenceId] of openAiEvidenceIds.entries()) {
      const match = localById.get(evidenceId) ?? allById.get(evidenceId);
      if (!match) continue;
      boosted.set(evidenceId, {
        ...match,
        match_score: match.match_score + Math.max(1, 6 - Math.floor(index / 2)),
        match_reasons: [...new Set([...match.match_reasons, "openai vector search"])],
      });
    }

    return [...boosted.values()]
      .filter((match) => match.card.confidence !== "blocked")
      .sort((a, b) => b.match_score - a.match_score || confidenceRank(b.card.confidence) - confidenceRank(a.card.confidence))
      .slice(0, limit);
  } catch {
    return localMatches.slice(0, limit);
  }
}

function getAllLocalKnowledgeMatches(detail: SiteDetailResponse): LocalKnowledgeMatch[] {
  const evidence = getLocalEvidenceCards();
  const analyses = getLocalDocumentAnalyses();
  const analysisBySource = new Map(analyses.map((analysis) => [analysis.source_id, analysis]));

  return evidence.map((card) => {
    const match = scoreEvidenceMatch(card, detail, detail.recommendation.intervention_code);
    return {
      card,
      source_analysis: analysisBySource.get(card.source_id) ?? null,
      match_score: match.score,
      match_reasons: match.reasons,
    };
  });
}

async function searchOpenAiVectorStoreForEvidenceIds(
  client: OpenAI,
  vectorStoreId: string,
  detail: SiteDetailResponse,
) {
  const query = [
    detail.site_features.site_id,
    detail.site_features.region,
    detail.site_features.zone,
    detail.site_features.woreda,
    detail.recommendation.recommended_intervention,
    detail.site_features.land_cover_primary,
    ...detail.model_prediction.top_feature_contributions.slice(0, 4).map((item) => String(item.feature)),
    "local caveats field validation implementation risks",
  ].filter(Boolean).join("\n");

  const results = await client.vectorStores.search(vectorStoreId, {
    query,
    max_num_results: 20,
    rewrite_query: true,
    ranking_options: {
      ranker: "auto",
    },
  });
  const ids: string[] = [];

  for await (const result of results.iterPages()) {
    for (const item of result.getPaginatedItems()) {
      const text = item.content.map((content) => content.text).join("\n");
      for (const match of text.matchAll(/"id":"([^"]+)"/g)) {
        ids.push(match[1]);
      }
      for (const match of text.matchAll(/"evidence_id":"([^"]+)"/g)) {
        ids.push(match[1]);
      }
      for (const match of text.matchAll(/Evidence ID:\s*([^\n]+)/g)) {
        ids.push(match[1].trim());
      }
    }
  }

  return [...new Set(ids)];
}

function scoreEvidenceMatch(
  card: LocalEvidenceCard,
  detail: SiteDetailResponse,
  intervention: string,
) {
  const reasons: string[] = [];
  let score = 0;
  const feature = detail.site_features;
  const recommendation = detail.recommendation;

  const specificCandidateIds =
    card.geography.candidate_site_ids.length > 0 &&
    card.geography.candidate_site_ids.length <= 4;

  if (specificCandidateIds && card.geography.candidate_site_ids.includes(feature.site_id)) {
    score += 10;
    reasons.push("same candidate site");
  }
  if (sameAdmin(card.geography.woreda, feature.woreda) || placeMatches(card, feature.woreda)) {
    score += 8;
    reasons.push("same woreda");
  }
  if (sameAdmin(card.geography.zone, feature.zone) || placeMatches(card, feature.zone)) {
    score += 5;
    reasons.push("same zone");
  }
  if (sameAdmin(card.geography.region, feature.region) || placeMatches(card, feature.region)) {
    score += 3;
    reasons.push("same region");
  }
  if (card.intervention_tags.includes(intervention)) {
    score += 4;
    reasons.push("same intervention");
  }
  if (card.intervention_tags.some((tag) => interventionTagMatches(tag, recommendation.recommended_intervention))) {
    score += 2;
    reasons.push("intervention text match");
  }

  const featureTerms = [
    feature.land_cover_primary,
    ...(detail.model_prediction.top_feature_contributions ?? []).map((item) => item.feature),
  ].map((value) => String(value).toLowerCase());
  const cardTerms = [...card.topics, ...card.intervention_tags, card.claim].map((value) => value.toLowerCase());

  for (const term of featureTerms) {
    if (cardTerms.some((candidate) => candidate.includes(term) || term.includes(candidate))) {
      score += 1;
      reasons.push(`feature topic: ${term}`);
      break;
    }
  }

  score += Math.max(0, confidenceRank(card.confidence) - 1);

  if (card.allowed_use.includes("caveat")) {
    score += 1;
  }

  return { score, reasons: [...new Set(reasons)] };
}

function confidenceRank(confidence: string) {
  return {
    blocked: 0,
    low: 1,
    medium_low: 2,
    medium: 3,
    medium_high: 4,
    high: 5,
  }[confidence] ?? 1;
}

function sameText(left: string | null | undefined, right: string | null | undefined) {
  return Boolean(left && right && left.trim().toLowerCase() === right.trim().toLowerCase());
}

function sameAdmin(left: string | null | undefined, right: string | null | undefined) {
  if (!left || !right) return false;
  const normalizedLeft = normalizeAdmin(left);
  const normalizedRight = normalizeAdmin(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
}

function placeMatches(card: LocalEvidenceCard, adminName: string | null | undefined) {
  if (!adminName) return false;
  return card.geography.places.some((place) => sameAdmin(place, adminName));
}

function normalizeAdmin(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(district|woreda|zone|region|special|peoples'?|people's|snnpr|snnprs|sn\.n\.p\.r\.)\b/g, " ")
    .replace(/\bkaffa\b/g, "kefa")
    .replace(/\bsouthen\b/g, "south")
    .replace(/\bsouthern\b/g, "south")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function interventionTagMatches(tag: string, interventionText: string) {
  const normalizedTag = tag.replaceAll("_", " ").toLowerCase();
  const normalizedIntervention = interventionText.toLowerCase();
  if (normalizedIntervention.includes(normalizedTag)) return true;
  if (tag === "soil_conservation" && normalizedIntervention.includes("soil and water conservation")) return true;
  if (tag === "fertility_management" && normalizedIntervention.includes("soil")) return true;
  if (tag === "native_tree_planting" && normalizedIntervention.includes("tree")) return true;
  return false;
}

function readJsonIfExists<T>(filename: string, fallback: T): T {
  if (!existsSync(filename)) return fallback;
  return JSON.parse(readFileSync(filename, "utf8")) as T;
}
