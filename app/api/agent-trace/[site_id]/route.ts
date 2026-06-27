import { NextResponse } from "next/server";
import { getCanonicalSiteDetail } from "@/reasoning";

type RouteContext = {
  params: Promise<{
    site_id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { site_id } = await context.params;
  const detail = getCanonicalSiteDetail(site_id);

  if (!detail) {
    return NextResponse.json(
      { error: `Unknown site_id: ${site_id}` },
      { status: 404 },
    );
  }

  return NextResponse.json({
    site_id,
    steps: [
      {
        name: "Data Ingestion",
        status: "complete",
        output: `${detail.site_features.feature_version} features loaded`,
      },
      {
        name: "Suitability Ranker",
        status: "complete",
        output: `priority_score=${detail.model_prediction.priority_score}`,
      },
      {
        name: "Recommendation Agent",
        status: "complete",
        output: detail.recommendation.recommended_intervention,
      },
      {
        name: "Similar Cases RAG",
        status: "complete",
        output: `${detail.similar_cases.length} cases retrieved`,
      },
      {
        name: "Evidence Critic",
        status: "complete",
        output: detail.critic.support_level,
      },
      {
        name: "Project Brief Agent",
        status: "complete",
        output: detail.critic.must_show_disclaimer
          ? "brief includes disclaimer"
          : "brief ready",
      },
    ],
  });
}
