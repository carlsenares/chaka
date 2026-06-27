import { NextResponse } from "next/server";
import { getSiteListResponse } from "@/reasoning";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") ?? undefined;

  return NextResponse.json(getSiteListResponse(region));
}
