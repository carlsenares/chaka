import { NextResponse } from "next/server";
import { readInvestment } from "@/lib/admin-data";

const ADMIN_PASSWORD = process.env.CHAKA_ADMIN_PASSWORD ?? "4dmin!";

type RouteContext = {
  params: Promise<{
    investment_id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = authorize(request);
  if (auth) return auth;

  const { investment_id } = await context.params;
  const investment = await readInvestment(decodeURIComponent(investment_id));
  if (!investment) {
    return NextResponse.json({ error: "Investment not found." }, { status: 404 });
  }

  return NextResponse.json({ investment });
}

function authorize(request: Request) {
  if (request.headers.get("x-admin-password") === ADMIN_PASSWORD) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
