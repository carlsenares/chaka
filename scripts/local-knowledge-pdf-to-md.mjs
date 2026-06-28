#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const inputDir = path.join(root, "research/source_candidates/papers");
const outputRoot = path.join(root, "data/local_knowledge");
const markdownRoot = path.join(outputRoot, "markdown");
const limitSources = getNumberArg("--limit-sources");
const onlySource = getStringArg("--source");

async function main() {
  const entries = await listSourceFiles(inputDir);

  const selected = entries
    .filter((entry) => {
      if (onlySource) return slugify(entry.relativePath) === onlySource || entry.relativePath === onlySource || entry.filename === onlySource;
      return entry.relativePath.toLowerCase().endsWith(".pdf") || entry.relativePath.toLowerCase().endsWith(".zip");
    })
    .slice(0, limitSources ?? undefined);

  const sources = [];
  const pages = [];
  const seenChecksums = new Map();

  await mkdir(markdownRoot, { recursive: true });

  for (const entry of selected) {
    const { filename, relativePath, sourcePath } = entry;
    const sourceKey = relativePath.replace(/\.(pdf|zip)$/i, "");
    const sourceId = `local_research_source:${slugify(sourceKey)}`;
    const sourceDir = path.join(markdownRoot, sourceId.replace(":", "__"));
    const extension = path.extname(filename).toLowerCase();
    const fileBuffer = await readFile(sourcePath);
    const checksum = createHash("sha256").update(fileBuffer).digest("hex");

    if (seenChecksums.has(checksum)) {
      sources.push({
        source_id: sourceId,
        filename,
        source_path: path.relative(root, sourcePath),
        file_type: extension.slice(1),
        checksum_sha256: checksum,
        processing_status: "skipped_duplicate",
        duplicate_of: seenChecksums.get(checksum),
        page_count: 0,
        markdown_dir: null,
        notes: "Skipped because an identical file checksum was already processed.",
      });
      continue;
    }
    seenChecksums.set(checksum, sourceId);

    if (extension !== ".pdf") {
      sources.push({
        source_id: sourceId,
        filename,
        source_path: path.relative(root, sourcePath),
        file_type: extension.slice(1),
        checksum_sha256: checksum,
        processing_status: "skipped_bundle",
        page_count: 0,
        markdown_dir: null,
        notes: "Zip bundles require a later unpacking step before page extraction.",
      });
      continue;
    }

    await mkdir(sourceDir, { recursive: true });

    const pageCount = getPdfPageCount(sourcePath);
    const sourcePages = [];
    let fullMarkdown = `# ${filename}\n\n`;
    fullMarkdown += `Source ID: \`${sourceId}\`\n\n`;

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const text = extractPageText(sourcePath, pageNumber);
      const normalized = normalizeText(text);
      const wordCount = countWords(normalized);
      const needsOcr = wordCount < 25;
      const md = [
        `# ${filename} - page ${pageNumber}`,
        "",
        `Source ID: \`${sourceId}\``,
        `Page: ${pageNumber}`,
        `Extraction quality: ${needsOcr ? "needs_ocr_or_vision_review" : "text_extracted"}`,
        "",
        "```text",
        normalized || "[No extractable text found on this page.]",
        "```",
        "",
      ].join("\n");

      const pageFile = `page-${String(pageNumber).padStart(3, "0")}.md`;
      await writeFile(path.join(sourceDir, pageFile), md);

      fullMarkdown += `\n\n## Page ${pageNumber}\n\n${normalized}\n`;

      const row = {
        source_id: sourceId,
        filename,
        page: pageNumber,
        markdown_path: path.relative(root, path.join(sourceDir, pageFile)),
        word_count: wordCount,
        char_count: normalized.length,
        extraction_quality: needsOcr ? "needs_ocr_or_vision_review" : "text_extracted",
        text_preview: normalized.slice(0, 500),
      };
      sourcePages.push(row);
      pages.push(row);
    }

    await writeFile(path.join(sourceDir, "full.md"), fullMarkdown.trimEnd() + "\n");

    sources.push({
      source_id: sourceId,
      filename,
      source_path: path.relative(root, sourcePath),
      file_type: "pdf",
      checksum_sha256: checksum,
      processing_status: "markdown_extracted",
      page_count: pageCount,
      markdown_dir: path.relative(root, sourceDir),
      low_text_pages: sourcePages.filter((page) => page.extraction_quality !== "text_extracted").length,
    });

    console.log(`Extracted ${filename}: ${pageCount} pages`);
  }

  await mkdir(outputRoot, { recursive: true });
  await writeJson("sources.json", sources);
  await writeJson("pages_manifest.json", pages);

  console.log(`Wrote ${path.relative(root, outputRoot)}/sources.json`);
  console.log(`Wrote ${path.relative(root, outputRoot)}/pages_manifest.json`);
}

async function listSourceFiles(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listSourceFiles(fullPath, base));
      continue;
    }

    if (!entry.isFile()) continue;
    files.push({
      filename: entry.name,
      relativePath: path.relative(base, fullPath),
      sourcePath: fullPath,
    });
  }

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function getPdfPageCount(pdfPath) {
  const output = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const match = output.match(/^Pages:\s+(\d+)/m);
  if (!match) throw new Error(`Could not determine page count for ${pdfPath}`);
  return Number(match[1]);
}

function extractPageText(pdfPath, pageNumber) {
  try {
    return execFileSync("pdftotext", ["-f", String(pageNumber), "-l", String(pageNumber), "-layout", pdfPath, "-"], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    return "";
  }
}

function normalizeText(text) {
  return text
    .replace(/\f/g, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim();
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

async function writeJson(filename, value) {
  await writeFile(path.join(outputRoot, filename), `${JSON.stringify(value, null, 2)}\n`);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 96);
}

function getStringArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function getNumberArg(name) {
  const value = getStringArg(name);
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
