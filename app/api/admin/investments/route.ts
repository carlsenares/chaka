import { NextResponse } from "next/server";
import { addInvestment, readInvestments, readRegionsAndSites } from "@/lib/admin-data";

const ADMIN_PASSWORD = process.env.CHAKA_ADMIN_PASSWORD ?? "4dmin!";

type InvestmentBody = {
  region?: string;
  intervention?: string;
  site_id?: string;
};

export async function GET(request: Request) {
  const auth = authorize(request);
  if (auth) return auth;

  return NextResponse.json({
    investments: await readInvestments(),
    options: await readRegionsAndSites(),
  });
}

export async function POST(request: Request) {
  const auth = authorize(request);
  if (auth) return auth;

  const body = (await request.json().catch(() => ({}))) as InvestmentBody;
  if (!body.region || !body.intervention?.trim()) {
    return NextResponse.json({ error: "Region and investment description are required." }, { status: 400 });
  }

  const investment = await addInvestment({
    region: body.region,
    intervention: body.intervention,
    site_id: body.site_id,
  });

  return NextResponse.json({
    investment,
    investments: await readInvestments(),
    options: await readRegionsAndSites(),
  });
}

function authorize(request: Request) {
  if (request.headers.get("x-admin-password") === ADMIN_PASSWORD) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
