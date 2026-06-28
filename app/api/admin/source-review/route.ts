import { NextResponse } from "next/server";
import { readSourceQueue } from "@/lib/admin-data";

const ADMIN_PASSWORD = process.env.CHAKA_ADMIN_PASSWORD ?? "4dmin!";

export async function GET(request: Request) {
  const auth = authorize(request);
  if (auth) return auth;

  return NextResponse.json(await readSourceQueue());
}

function authorize(request: Request) {
  if (request.headers.get("x-admin-password") === ADMIN_PASSWORD) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
