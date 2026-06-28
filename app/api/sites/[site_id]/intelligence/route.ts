import { NextResponse } from "next/server";
import { generateSiteIntelligence } from "@/reasoning/intelligence";

type RouteContext = {
  params: Promise<{
    site_id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { site_id } = await context.params;
  const intelligence = await generateSiteIntelligence(decodeURIComponent(site_id));

  if (!intelligence) {
    return NextResponse.json(
      { error: `Unknown site_id: ${site_id}` },
      { status: 404 },
    );
  }

  return NextResponse.json(intelligence);
}
