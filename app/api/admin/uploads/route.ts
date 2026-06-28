import { NextResponse } from "next/server";
import { addFileSourceCandidate, addUrlSourceCandidate, readSourceQueue } from "@/lib/admin-data";

const ADMIN_PASSWORD = process.env.CHAKA_ADMIN_PASSWORD ?? "4dmin!";

export async function POST(request: Request) {
  const auth = authorize(request);
  if (auth) return auth;

  const formData = await request.formData();
  const sourceUrl = String(formData.get("source") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  const file = formData.get("file");
  const created = [];

  if (sourceUrl) {
    try {
      created.push(await addUrlSourceCandidate(sourceUrl, note));
    } catch {
      return NextResponse.json({ error: "The pasted source must be a valid URL." }, { status: 400 });
    }
  }

  if (file instanceof File && file.size > 0) {
    const allowed = [".pdf", ".docx", ".doc", ".txt", ".md", ".csv", ".json", ".geojson"];
    const lowerName = file.name.toLowerCase();
    if (!allowed.some((extension) => lowerName.endsWith(extension))) {
      return NextResponse.json({ error: "Upload a URL, PDF, DOCX, document, or simple data file." }, { status: 400 });
    }
    created.push(await addFileSourceCandidate(file, note));
  }

  if (!created.length) {
    return NextResponse.json({ error: "Paste a URL or choose a file." }, { status: 400 });
  }

  return NextResponse.json({ created, queue: await readSourceQueue() });
}

function authorize(request: Request) {
  if (request.headers.get("x-admin-password") === ADMIN_PASSWORD) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
