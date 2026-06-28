import { spawnSync } from "node:child_process";
import { NextResponse } from "next/server";
import { readSourceQueue } from "@/lib/admin-data";

const ADMIN_PASSWORD = process.env.CHAKA_ADMIN_PASSWORD ?? "4dmin!";

type RouteContext = {
  params: Promise<{
    review_item_id: string;
  }>;
};

type ActionBody = {
  action?: "approve" | "reject" | "block";
  reason?: string;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = authorize(request);
  if (auth) return auth;

  const { review_item_id } = await context.params;
  const itemId = decodeURIComponent(review_item_id);
  const body = (await request.json().catch(() => ({}))) as ActionBody;
  const action = body.action;
  if (!action || !["approve", "reject", "block"].includes(action)) {
    return NextResponse.json({ error: "Expected action approve, reject, or block." }, { status: 400 });
  }

  const flag = action === "approve" ? "--approve" : action === "reject" ? "--reject" : "--block";
  const commandArgs = ["scripts/source-review-queue.mjs", flag, itemId, "--reviewer", "admin-dashboard"];
  if (body.reason?.trim()) commandArgs.push("--reason", body.reason.trim());

  const result = spawnSync("node", commandArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
    maxBuffer: 1024 * 1024 * 8,
  });

  if (result.status !== 0) {
    return NextResponse.json(
      {
        error: "Source review action failed.",
        stdout: result.stdout,
        stderr: result.stderr,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    queue: await readSourceQueue(),
    stdout: result.stdout,
  });
}

function authorize(request: Request) {
  if (request.headers.get("x-admin-password") === ADMIN_PASSWORD) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
