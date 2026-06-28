import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type RouteContext = {
  params: Promise<{
    source_id: string;
  }>;
};

type LocalSource = {
  source_id: string;
  filename: string;
  source_path: string;
  file_type: string;
};

const root = process.env.CHAKA_PROJECT_ROOT ?? process.cwd();

export async function GET(_request: Request, context: RouteContext) {
  const { source_id } = await context.params;
  const decodedSourceId = decodeURIComponent(source_id);
  const sourcesPath = path.join(root, "data/local_knowledge/sources.json");

  if (!existsSync(sourcesPath)) {
    return new Response("Source catalog missing.", { status: 404 });
  }

  const sources = JSON.parse(readFileSync(sourcesPath, "utf8")) as LocalSource[];
  const source = sources.find((item) => item.source_id === decodedSourceId);

  if (!source || source.file_type !== "pdf") {
    return new Response(`Unknown PDF source: ${decodedSourceId}`, { status: 404 });
  }

  const sourcePath = path.resolve(root, source.source_path);
  const allowedRoot = path.resolve(root, "research/source_candidates/papers");
  if (!sourcePath.startsWith(allowedRoot) || !existsSync(sourcePath)) {
    return new Response("PDF file is not available.", { status: 404 });
  }

  const body = readFileSync(sourcePath);
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${source.filename.replaceAll('"', "")}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
