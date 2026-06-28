import { NextResponse } from "next/server";
import { localizeSiteDetailResponse } from "@/lib/i18n/server-localization";
import { getCanonicalSiteDetail } from "@/reasoning";

type RouteContext = {
  params: Promise<{
    site_id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { site_id } = await context.params;
  const detail = getCanonicalSiteDetail(site_id);

  if (!detail) {
    return NextResponse.json(
      { error: `Unknown site_id: ${site_id}` },
      { status: 404 },
    );
  }

  const locale = new URL(request.url).searchParams.get("locale");

  return NextResponse.json(await localizeSiteDetailResponse(detail, locale));
}
