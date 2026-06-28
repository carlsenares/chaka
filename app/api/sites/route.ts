import { NextResponse } from "next/server";
import { localizeSiteListResponse } from "@/lib/i18n/server-localization";
import { getSiteListResponse } from "@/reasoning";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") ?? undefined;
  const locale = searchParams.get("locale");
  const response = getSiteListResponse(region);

  return NextResponse.json(await localizeSiteListResponse(response, locale));
}
