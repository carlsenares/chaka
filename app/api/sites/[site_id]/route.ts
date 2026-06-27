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

  return NextResponse.json(detail);
}
