import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { getCanonicalSiteDetail } from "@/reasoning";
import {
  getHybridLocalKnowledgeForSite,
  getLocalKnowledgeForSite,
} from "@/reasoning/local-knowledge";
import type {
  LocalKnowledgeMatch,
  SiteDetailResponse,
  SiteIntelligenceResponse,
} from "@/reasoning/types";

const root = process.cwd();

export async function generateSiteIntelligence(
  siteId: string,
): Promise<SiteIntelligenceResponse | null> {
  const detail = getCanonicalSiteDetail(siteId);
  if (!detail) return null;

  const apiKey = loadOpenAiKey();
  const openAiSynthesisEnabled = process.env.OPENAI_SITE_INTELLIGENCE_ENABLED !== "false";
  if (!apiKey || !openAiSynthesisEnabled) {
    const retrieved = getLocalKnowledgeForSite(detail, 10);
    return createFallbackIntelligence(
      detail,
      retrieved,
      apiKey ? "local_fallback_openai_synthesis_disabled" : "fallback_no_openai_key",
    );
  }

  const client = new OpenAI({
    apiKey,
    maxRetries: 1,
    timeout: Number(process.env.OPENAI_SITE_INTELLIGENCE_TIMEOUT_MS ?? 15000),
  });
  const retrievalMode = process.env.LOCAL_KNOWLEDGE_RETRIEVAL ?? "local";
  const retrieved =
    retrievalMode === "hybrid" || retrievalMode === "openai"
      ? await getHybridLocalKnowledgeForSite(detail, client, 10)
      : getLocalKnowledgeForSite(detail, 10);
  const routing = JSON.parse(
    readFileSync(path.join(root, "config/openai-model-routing.json"), "utf8"),
  );
  const configuredModel = process.env.OPENAI_SITE_INTELLIGENCE_MODEL;
  const models = configuredModel
    ? [configuredModel]
    : [
        routing.models.reasoning_synthesizer,
        ...(routing.fallbacks.reasoning_synthesizer ?? []),
      ].filter(Boolean);

  let lastError: unknown = null;
  for (const model of models) {
    try {
      const response = await createResponseWithTimeout(client, {
        model,
        reasoning: { effort: routing.reasoning.site_intelligence ?? "medium" },
        input: [
          {
            role: "system",
            content:
              "You create plain-language restoration investment notes for NGO staff and local partners. Use only provided scores and retrieved local evidence. Do not change numeric scores. Do not mention model names, algorithms, variable names, JSON, schemas, or backend processes. Explain what the result means in direct, professional language. Cite evidence IDs and pages when using local evidence. Local caveats must explain the obstacle, what the referenced source says, and why it could affect implementation. Do not repeatedly introduce caveats with phrases like 'treat this as a question', 'ask whether', or 'verify locally'. Low-confidence sources may only support cautious implementation-risk language.",
          },
          {
            role: "user",
            content: JSON.stringify({
              site_detail: compactSiteDetail(detail),
              retrieved_evidence: retrieved.map(compactMatch),
              task:
                "Explain the score, whether this area is worth funding now, and return a plain investment_summary with opportunity, investment, why_here, and expected_change. Draft practical investment ideas only when appropriate. Convert local evidence into clear implementation obstacles: describe what the PDF/source explains, why that can be a problem for this type of restoration investment, and what it implies for planning. Be concise, avoid repeated disclaimers, and cite evidence IDs in citations.",
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "site_intelligence",
            strict: true,
            schema: siteIntelligenceSchema,
          },
        },
      });
      const parsed = JSON.parse(response.output_text);
      const audit =
        process.env.OPENAI_SITE_INTELLIGENCE_AUDIT_ENABLED === "true"
          ? await runIntelligenceAudit(client, routing, parsed, retrieved)
          : {
              status: "not_run" as const,
              notes: [
                "OpenAI synthesis ran; final citation audit is disabled for low-latency demo serving.",
              ],
            };
      return {
        ...parsed,
        site_id: detail.site_features.site_id,
        generated_at: new Date().toISOString(),
        model_used: model,
        retrieval_strategy:
          retrievalMode === "hybrid" || retrievalMode === "openai"
            ? "openai_vector_store_search_plus_local_policy_rerank"
            : "metadata_filter_plus_local_evidence_rerank",
        retrieved_evidence: retrieved,
        audit,
      };
    } catch (error) {
      lastError = error;
    }
  }

  const fallback = createFallbackIntelligence(detail, retrieved, "fallback_openai_error");
  fallback.audit.notes.push(lastError instanceof Error ? lastError.message : String(lastError));
  return fallback;
}

async function runIntelligenceAudit(
  client: OpenAI,
  routing: Record<string, any>,
  intelligence: unknown,
  retrieved: LocalKnowledgeMatch[],
): Promise<SiteIntelligenceResponse["audit"]> {
  const models = [
    routing.models.critic,
    ...(routing.fallbacks.critic ?? []),
  ].filter(Boolean);

  for (const model of models) {
    try {
      const response = await createResponseWithTimeout(client, {
        model,
        reasoning: { effort: routing.reasoning.critic ?? "medium" },
        input: [
          {
            role: "system",
            content:
              "Audit restoration intelligence for unsupported claims, overclaiming, and citation misuse. Low-confidence evidence may only support cautious verify-locally language. Return only schema-valid JSON.",
          },
          {
            role: "user",
            content: JSON.stringify({
              intelligence,
              retrieved_evidence: retrieved.map(compactMatch),
              task:
                "Check that all cited local caveats and investment caveats are supported by retrieved evidence. Flag if the response changes numeric scores, overstates low-confidence sources, or cites unavailable evidence.",
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "site_intelligence_audit",
            strict: true,
            schema: intelligenceAuditSchema,
          },
        },
      });

      return JSON.parse(response.output_text);
    } catch {
      continue;
    }
  }

  return {
    status: "needs_review",
    notes: ["Citation audit model call failed; manual review recommended."],
  };
}

async function createResponseWithTimeout(
  client: OpenAI,
  params: Parameters<OpenAI["responses"]["create"]>[0],
) {
  const timeoutMs = Number(process.env.OPENAI_SITE_INTELLIGENCE_TIMEOUT_MS ?? 15000);
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      client.responses.create(params, { signal: controller.signal }),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error(`OpenAI response timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]) as Awaited<ReturnType<OpenAI["responses"]["create"]>> & { output_text: string };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function createFallbackIntelligence(
  detail: SiteDetailResponse,
  retrieved: LocalKnowledgeMatch[] = getLocalKnowledgeForSite(detail, 10),
  modelUsed = "local_fallback",
): SiteIntelligenceResponse {
  const feature = detail.site_features;
  const recommendation = detail.recommendation;
  const lowPriority = recommendation.priority_score < 35;
  const caveats = retrieved.slice(0, 4).map((match) => ({
    caveat: localEvidenceToCheck(match),
    confidence: match.card.confidence,
    source: match.card.filename,
    citation: `${match.card.evidence_id}, page ${match.card.citation.page}`,
  }));

  return {
    site_id: feature.site_id,
    generated_at: new Date().toISOString(),
    model_used: modelUsed,
    retrieval_strategy: "metadata_filter_plus_local_evidence_rerank",
    score_explanation: lowPriority
      ? `This area scores ${recommendation.priority_score}, which makes it a low priority compared with the other mapped areas. The available data does not make it a strong first choice for funding right now.`
      : `This area scores ${recommendation.priority_score}. It ranks well because the available information on land cover, rainfall, soil, access, and community benefit looks stronger than many other mapped areas.`,
    why_this_area: lowPriority
      ? `${feature.woreda}, ${feature.zone} is not recommended for investment yet. It may still be worth reviewing if local partners have newer information or a specific community request.`
      : `${feature.woreda}, ${feature.zone} is a candidate area because the available map and source data point to a possible restoration opportunity.`,
    investment_summary: buildInvestmentSummary(detail, lowPriority),
    investment_ideas: [
      {
        title: recommendation.recommended_intervention,
        reasoning: lowPriority
          ? "Do not treat this as a funding target yet. Review stronger ranked areas first, unless local partners provide new evidence."
          : `Use ${recommendation.recommended_intervention.toLowerCase()} as an initial planning idea, then confirm it with people who know the area.`,
        caveats: caveats.map((item) => item.caveat).slice(0, 3),
        citations: caveats.map((item) => item.citation).slice(0, 3),
      },
    ],
    local_caveats: caveats,
    field_checks: [
      ...recommendation.field_validation_questions,
      ...retrieved
        .filter((match) => match.card.confidence === "low" || match.source_analysis?.validity.subjectivity_risk === "high")
        .slice(0, 3)
        .map((match) => `Verify locally before relying on ${match.card.filename}: ${match.card.claim}`),
    ],
    do_not_overclaim: [
      "Treat this as an early screening result, not a final funding decision.",
      "Do not claim verified carbon or livelihood outcomes without field measurement.",
      "Use broad or low-confidence evidence only as a reason to ask better local questions.",
    ],
    retrieved_evidence: retrieved,
    audit: {
      status: "not_run",
      notes: ["Local fallback generated without final OpenAI citation audit."],
    },
  };
}

function buildInvestmentSummary(detail: SiteDetailResponse, lowPriority: boolean) {
  const feature = detail.site_features;
  const recommendation = detail.recommendation;
  const landCover = feature.land_cover_primary.replaceAll("_", " ");
  const validationFirst = recommendation.intervention_code === "field_validation_before_investment";

  if (lowPriority) {
    return {
      opportunity: "This area is mainly useful as a place to review later, not as a first funding target.",
      investment:
        "Do not start a restoration investment here unless local partners bring stronger, newer evidence.",
      why_here:
        `The current screening shows weak restoration fit for ${feature.woreda}, especially compared with higher-ranked areas.`,
      expected_change:
        "The most useful action now would be better local information, not planting or restoration spending.",
    };
  }

  return {
    opportunity:
      `The opportunity is to improve degraded or pressured ${landCover} land while protecting remaining useful vegetation.`,
    investment: validationFirst
      ? "Start with field validation, then choose the restoration package with local communities. The first spend should confirm land use, tenure, restoration fit, and practical constraints."
      : `${recommendation.recommended_intervention} could be used as the starting package, with the final design chosen with local communities.`,
    why_here:
      `This area stands out because rainfall, soil, land cover, access, and community benefit signals look comparatively strong.`,
    expected_change:
      "A well-designed investment could improve tree cover, soil protection, water retention, and local livelihood benefits over time.",
  };
}

function localEvidenceToCheck(match: LocalKnowledgeMatch) {
  const claim = match.card.claim.trim();
  const topics = new Set(match.card.topics.map((topic) => topic.toLowerCase()));
  const allowedUse = match.card.allowed_use.toLowerCase();
  const locality =
    match.card.geography.woreda || match.card.geography.zone || match.card.geography.region || "the source area";
  const confidencePrefix =
    match.card.confidence === "low" || match.card.confidence === "medium_low"
      ? "This is a possible implementation issue, not site-specific proof."
      : "This is a planning-relevant implementation issue.";

  if (topics.has("fertility management") || topics.has("farm practices") || allowedUse.includes("fertility")) {
    return `${confidencePrefix} The referenced source describes soil and farm-management practices in ${locality}, including the practical constraints around inputs, labor, livestock, and adoption. That can become an implementation obstacle if a restoration package assumes farmers will use compost, manure, crop rotation, intercropping, grass strips, contour farming, or residue management without matching their existing workload and input access. Source note: ${claim}`;
  }

  if (topics.has("soil erosion") || topics.has("soil conservation")) {
    return `${confidencePrefix} The referenced source describes soil erosion or soil-conservation conditions relevant to ${locality}. That can be an obstacle because erosion problems are site-specific: contour work, grass strips, planting, grazing controls, or no intervention may be appropriate depending on where runoff is actually damaging farms, paths, grazing areas, or water flow. Source note: ${claim}`;
  }

  if (topics.has("mrv design") || topics.has("co-benefits") || topics.has("biodiversity")) {
    return `${confidencePrefix} The referenced source explains monitoring, co-benefits, or biodiversity considerations. That can be an obstacle if the project tracks planting activity but not the outcomes funders and communities actually care about, such as tree survival, biodiversity, water effects, and benefit sharing. Source note: ${claim}`;
  }

  return `${confidencePrefix} The referenced source provides context that may not map perfectly onto the selected site. That can be an obstacle if the project treats broader evidence as site-specific proof without checking whether the place, people, and land use in the PDF match the actual implementation area. Source note: ${claim}`;
}

function compactSiteDetail(detail: SiteDetailResponse) {
  return {
    site_id: detail.site_features.site_id,
    admin: {
      region: detail.site_features.region,
      zone: detail.site_features.zone,
      woreda: detail.site_features.woreda,
    },
    area_ha: detail.site_features.area_ha,
    land_cover_primary: detail.site_features.land_cover_primary,
    site_features: detail.site_features,
    model_prediction: detail.model_prediction,
    recommendation: detail.recommendation,
    critic: detail.critic,
  };
}

function compactMatch(match: LocalKnowledgeMatch) {
  return {
    evidence_id: match.card.evidence_id,
    claim: match.card.claim,
    evidence_quote: match.card.evidence_quote,
    filename: match.card.filename,
    page: match.card.citation.page,
    confidence: match.card.confidence,
    source_confidence: match.card.source_confidence,
    source_subjectivity_risk: match.source_analysis?.validity.subjectivity_risk ?? "unknown",
    allowed_use: match.card.allowed_use,
    not_allowed_use: match.card.not_allowed_use,
    geography: match.card.geography,
    topics: match.card.topics,
    intervention_tags: match.card.intervention_tags,
    match_reasons: match.match_reasons,
  };
}

function loadOpenAiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const envLocal = path.join(root, ".env.local");
  if (!existsSync(envLocal)) return null;
  const content = readFileSync(envLocal, "utf8");
  const match = content.match(/^OPENAI_API_KEY=(.+)$/m);
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? null;
}

const siteIntelligenceSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "score_explanation",
    "why_this_area",
    "investment_summary",
    "investment_ideas",
    "local_caveats",
    "field_checks",
    "do_not_overclaim",
  ],
  properties: {
    score_explanation: { type: "string" },
    why_this_area: { type: "string" },
    investment_summary: {
      type: "object",
      additionalProperties: false,
      required: ["opportunity", "investment", "why_here", "expected_change"],
      properties: {
        opportunity: { type: "string" },
        investment: { type: "string" },
        why_here: { type: "string" },
        expected_change: { type: "string" },
      },
    },
    investment_ideas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "reasoning", "caveats", "citations"],
        properties: {
          title: { type: "string" },
          reasoning: { type: "string" },
          caveats: { type: "array", items: { type: "string" } },
          citations: { type: "array", items: { type: "string" } },
        },
      },
    },
    local_caveats: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["caveat", "confidence", "source", "citation"],
        properties: {
          caveat: { type: "string" },
          confidence: { type: "string", enum: ["blocked", "low", "medium_low", "medium", "medium_high", "high"] },
          source: { type: "string" },
          citation: { type: "string" },
        },
      },
    },
    field_checks: { type: "array", items: { type: "string" } },
    do_not_overclaim: { type: "array", items: { type: "string" } },
  },
};

const intelligenceAuditSchema = {
  type: "object",
  additionalProperties: false,
  required: ["status", "notes"],
  properties: {
    status: { type: "string", enum: ["passed", "needs_review"] },
    notes: { type: "array", items: { type: "string" } },
  },
};
