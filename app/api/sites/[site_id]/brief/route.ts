import { NextResponse } from "next/server";
import { createProjectBrief } from "@/reasoning/brief";
import { getCanonicalSiteDetail } from "@/reasoning";

type RouteContext = {
  params: Promise<{
    site_id: string;
  }>;
};

type BriefRequest = {
  audience?: "donor" | "internal" | "field_team";
  length?: "short" | "medium";
};

export async function POST(request: Request, context: RouteContext) {
  const { site_id } = await context.params;
  const detail = getCanonicalSiteDetail(site_id);

  if (!detail) {
    return NextResponse.json(
      { error: `Unknown site_id: ${site_id}` },
      { status: 404 },
    );
  }

  try {
    (await request.json()) as BriefRequest;
  } catch {
    // The demo brief is deterministic; an empty or malformed body still returns
    // the cached short donor-safe brief for this site.
  }

  const brief = createProjectBrief(
    detail.site_features,
    detail.recommendation,
    detail.critic,
  );

  return NextResponse.json({
    brief,
    critic: detail.critic,
  });
}
