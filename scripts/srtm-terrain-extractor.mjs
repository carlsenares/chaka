#!/usr/bin/env node

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { bboxForGeometry, pointInGeometry, round } from "./lib/geo-utils.mjs";

const root = process.cwd();
const rawDir = path.join(root, "data/raw/srtm");
const candidatesPath = path.join(root, "data/processed/candidate_sites.geojson");
const outputPath = path.join(root, "data/features/source_extracts/srtm_terrain.json");
const isDryRun = process.argv.includes("--dry-run");

const hgtCells = 3601;
const arcSecondDegrees = 1 / 3600;
const noData = -32768;
const sampleStep = 3;

async function main() {
  const candidates = JSON.parse(await readFile(candidatesPath, "utf8"));
  const tiles = await loadTilesForFeatures(candidates.features);
  const siteSummaries = candidates.features.map((feature) => summarizeSite(feature, tiles));
  const missingSites = siteSummaries.filter((site) => site.sample_count === 0);

  const output = {
    source_id: "srtm_dem",
    provider: "NASA/USGS LP DAAC",
    source_dataset: "NASA Shuttle Radar Topography Mission Global 1 arc second V003 (SRTMGL1.003)",
    source_url: "https://www.earthdata.nasa.gov/data/catalog/lpcloud-srtmgl1-003",
    raw_data_path: "data/raw/srtm/",
    raw_data_commit_policy: "Raw .hgt files are intentionally ignored and are not committed.",
    extraction_method:
      "Local SRTMGL1 .hgt tiles sampled inside each candidate polygon. Slope is estimated from central elevation differences using neighboring 1 arc-second cells.",
    sample_step_arc_seconds: sampleStep,
    generated_at: new Date().toISOString(),
    sites: siteSummaries,
  };

  console.log(`Loaded ${tiles.size} SRTM tiles from ${path.relative(root, rawDir)}`);
  console.log(`Extracted terrain summaries for ${siteSummaries.length} candidate sites`);

  if (missingSites.length > 0) {
    console.warn(`warning: ${missingSites.length} sites had no valid SRTM samples`);
    for (const site of missingSites) console.warn(`warning: ${site.site_id}: ${site.note}`);
  }

  if (isDryRun) {
    console.log("Dry run passed; no output written");
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${path.relative(root, outputPath)}`);
}

async function loadTilesForFeatures(features) {
  const tileIds = new Set();

  for (const feature of features) {
    const [west, south, east, north] = bboxForGeometry(feature.geometry);
    for (let lat = Math.floor(south); lat <= Math.floor(north); lat += 1) {
      for (let lon = Math.floor(west); lon <= Math.floor(east); lon += 1) {
        tileIds.add(tileIdForSouthwestCorner(lat, lon));
      }
    }
  }

  const tiles = new Map();
  for (const tileId of tileIds) {
    const tilePath = path.join(rawDir, `${tileId}.hgt`);
    await assertReadableTile(tilePath, tileId);
    tiles.set(tileId, {
      id: tileId,
      south: Number(tileId.slice(1, 3)) * (tileId[0] === "S" ? -1 : 1),
      west: Number(tileId.slice(4, 7)) * (tileId[3] === "W" ? -1 : 1),
      data: await readFile(tilePath),
    });
  }

  return tiles;
}

async function assertReadableTile(tilePath, tileId) {
  const tileStat = await stat(tilePath).catch(() => null);
  if (!tileStat) {
    throw new Error(`Missing SRTM tile ${tileId}. Expected ${path.relative(root, tilePath)}`);
  }

  const expectedBytes = hgtCells * hgtCells * 2;
  if (tileStat.size !== expectedBytes) {
    throw new Error(
      `Unexpected size for ${path.relative(root, tilePath)}: ${tileStat.size} bytes, expected ${expectedBytes}`,
    );
  }
}

function summarizeSite(feature, tiles) {
  const [west, south, east, north] = bboxForGeometry(feature.geometry);
  const elevations = [];
  const slopes = [];

  for (let lat = south; lat <= north; lat += arcSecondDegrees * sampleStep) {
    for (let lon = west; lon <= east; lon += arcSecondDegrees * sampleStep) {
      if (!pointInGeometry([lon, lat], feature.geometry)) continue;

      const elevation = elevationAt(lon, lat, tiles);
      const slope = slopeAt(lon, lat, tiles);
      if (elevation === null || slope === null) continue;

      elevations.push(elevation);
      slopes.push(slope);
    }
  }

  const slopeMeanDeg = mean(slopes);
  const elevationMeanM = mean(elevations);

  return {
    site_id: feature.properties.site_id,
    region: feature.properties.region,
    zone: feature.properties.zone,
    woreda: feature.properties.woreda,
    elevation_mean_m: elevationMeanM === null ? null : round(elevationMeanM, 1),
    slope_mean_deg: slopeMeanDeg === null ? null : round(slopeMeanDeg, 2),
    slope_p90_deg: slopes.length === 0 ? null : round(percentile(slopes, 0.9), 2),
    slope_risk_score: slopeMeanDeg === null ? null : slopeRiskScore(slopeMeanDeg),
    sample_count: slopes.length,
    note: slopes.length === 0 ? "No valid SRTM samples found inside candidate polygon." : undefined,
  };
}

function elevationAt(lon, lat, tiles) {
  const tile = tiles.get(tileIdForPoint(lon, lat));
  if (!tile) return null;

  const col = Math.round((lon - tile.west) / arcSecondDegrees);
  const row = Math.round((tile.south + 1 - lat) / arcSecondDegrees);
  if (row < 0 || row >= hgtCells || col < 0 || col >= hgtCells) return null;

  const value = tile.data.readInt16BE((row * hgtCells + col) * 2);
  return value === noData ? null : value;
}

function slopeAt(lon, lat, tiles) {
  const north = elevationAt(lon, lat + arcSecondDegrees, tiles);
  const south = elevationAt(lon, lat - arcSecondDegrees, tiles);
  const east = elevationAt(lon + arcSecondDegrees, lat, tiles);
  const west = elevationAt(lon - arcSecondDegrees, lat, tiles);

  if ([north, south, east, west].some((value) => value === null)) return null;

  const metersPerDegreeLat = 111320;
  const metersPerDegreeLon = Math.cos((lat * Math.PI) / 180) * metersPerDegreeLat;
  const dzDx = (east - west) / (2 * arcSecondDegrees * metersPerDegreeLon);
  const dzDy = (north - south) / (2 * arcSecondDegrees * metersPerDegreeLat);
  return (Math.atan(Math.sqrt(dzDx ** 2 + dzDy ** 2)) * 180) / Math.PI;
}

function tileIdForPoint(lon, lat) {
  return tileIdForSouthwestCorner(Math.floor(lat), Math.floor(lon));
}

function tileIdForSouthwestCorner(lat, lon) {
  const latPrefix = lat < 0 ? "S" : "N";
  const lonPrefix = lon < 0 ? "W" : "E";
  return `${latPrefix}${String(Math.abs(lat)).padStart(2, "0")}${lonPrefix}${String(Math.abs(lon)).padStart(3, "0")}`;
}

function mean(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

function slopeRiskScore(slopeMeanDeg) {
  return Math.max(0, Math.min(100, Math.round((slopeMeanDeg / 30) * 100)));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
