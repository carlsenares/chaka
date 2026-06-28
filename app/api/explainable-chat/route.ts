import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCanonicalSiteDetail, rankSiteDetails } from "@/reasoning";
import { createFallbackIntelligence } from "@/reasoning/intelligence";
import { getLocalKnowledgeForSite } from "@/reasoning/local-knowledge";

type ExplainableChatRequest = {
  message?: string;
  site_id?: string;
  weights?: Record<string, number>;
  ranked_site_ids?: string[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as ExplainableChatRequest;
  const message = body.message?.trim();
  const siteId = body.site_id?.trim();

  if (!message || !siteId) {
    return new Response("Missing message or site_id.", { status: 400 });
  }

  const detail = getCanonicalSiteDetail(siteId);
  if (!detail) {
    return new Response(`Unknown site_id: ${siteId}`, { status: 404 });
  }

  const localEvidence = getLocalKnowledgeForSite(detail, 8);
  const fallbackIntelligence = createFallbackIntelligence(
    detail,
    localEvidence,
    "chat_local_context",
  );
  const rankedContext = rankSiteDetails()
    .slice(0, 8)
    .map((item) => ({
      site_id: item.site_features.site_id,
      rank: item.recommendation.rank,
      priority_score: item.recommendation.priority_score,
      woreda: item.site_features.woreda,
      intervention: item.recommendation.recommended_intervention,
      risk_level: item.recommendation.risk_level,
    }));

  const apiKey = loadOpenAiKey();
  if (!apiKey) {
    return NextResponse.json({
      answer: buildLocalAnswer(message, fallbackIntelligence),
      model_used: "local_fallback_no_openai_key",
    });
  }

  const client = new OpenAI({
    apiKey,
    timeout: Number(process.env.OPENAI_EXPLAINABLE_CHAT_TIMEOUT_MS ?? 15000),
    maxRetries: 0,
  });

  try {
    const response = await Promise.race([
      client.responses.create({
        model: process.env.OPENAI_EXPLAINABLE_CHAT_MODEL ?? "gpt-5.4-mini",
        input: [
          {
            role: "system",
            content:
              "You are Chaka, a restoration planning assistant for NGO staff and local partners. Answer only from the provided site detail, ranking context, local evidence, and intelligence preview. Use simple, practical language. Do not mention model names, algorithms, raw variable names, JSON, schemas, or backend processes. Do not invent data or change numeric scores. Clearly label uncertainty. Keep answers concise and cite evidence IDs/pages when using local PDF evidence.",
          },
          {
            role: "user",
            content: JSON.stringify({
              user_question: message,
              selected_site: {
                site_id: detail.site_features.site_id,
                region: detail.site_features.region,
                zone: detail.site_features.zone,
                woreda: detail.site_features.woreda,
                area_ha: detail.site_features.area_ha,
                site_features: detail.site_features,
                model_prediction: detail.model_prediction,
                recommendation: detail.recommendation,
                critic: detail.critic,
              },
              current_weights: body.weights ?? null,
              ranked_context: rankedContext,
              selected_rank_context: body.ranked_site_ids ?? [],
              local_evidence: localEvidence.map((match) => ({
                evidence_id: match.card.evidence_id,
                claim: match.card.claim,
                filename: match.card.filename,
                page: match.card.citation.page,
                confidence: match.card.confidence,
                allowed_use: match.card.allowed_use,
                not_allowed_use: match.card.not_allowed_use,
                match_reasons: match.match_reasons,
              })),
              intelligence_preview: {
                score_explanation: fallbackIntelligence.score_explanation,
                why_this_area: fallbackIntelligence.why_this_area,
                investment_summary: fallbackIntelligence.investment_summary,
                local_caveats: fallbackIntelligence.local_caveats,
                field_checks: fallbackIntelligence.field_checks,
                do_not_overclaim: fallbackIntelligence.do_not_overclaim,
              },
            }),
          },
        ],
      }),
      timeoutAfter(Number(process.env.OPENAI_EXPLAINABLE_CHAT_TIMEOUT_MS ?? 15000)),
    ]);

    return NextResponse.json({
      answer: response.output_text,
      model_used: process.env.OPENAI_EXPLAINABLE_CHAT_MODEL ?? "gpt-5.4-mini",
    });
  } catch (error) {
    return NextResponse.json({
      answer: buildLocalAnswer(message, fallbackIntelligence),
      model_used: "local_fallback_openai_error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function timeoutAfter(timeoutMs: number): Promise<never> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(`OpenAI chat timed out after ${timeoutMs}ms`)), timeoutMs);
  });
}

function buildLocalAnswer(
  message: string,
  intelligence: ReturnType<typeof createFallbackIntelligence>,
) {
  const caveats = intelligence.local_caveats
    .slice(0, 3)
    .map((item) => `- ${item.caveat} (${item.citation})`)
    .join("\n");

  return [
    intelligence.why_this_area,
    intelligence.score_explanation,
    "",
    "Relevant local evidence:",
    caveats || "- No matched local evidence cards are available for this site yet.",
    "",
    `Question received: ${message}`,
  ].join("\n");
}

function loadOpenAiKey() {
  return process.env.OPENAI_API_KEY ?? null;
}
