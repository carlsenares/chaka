#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  areaHaForGeometry,
  bboxForFeatures,
  pointInFeature,
  round,
  squareCell,
} from "./lib/geo-utils.mjs";

const root = process.cwd();
const aoiPath = path.join(root, "data/processed/aoi_boundaries.geojson");
const admin2Path = path.join(root, "data/raw/hdx_ocha_eth_admin_boundaries/eth_admin2.geojson");
const admin3Path = path.join(root, "data/raw/hdx_ocha_eth_admin_boundaries/eth_admin3.geojson");
const outputPath = path.join(root, "data/processed/candidate_sites.geojson");

const targetCountByRegion = new Map([
  ["TIG", 4],
  ["AMH", 4],
  ["ORO", 4],
  ["SWE", 8],
  ["SET", 8],
  ["GAM", 4],
]);

const cellSizeDegrees = 0.045; // About 5 km north-south at Ethiopia latitudes.

function fail(message) {
  console.error(`candidate-site-generator: ${message}`);
  process.exit(1);
}

async function main() {
  const aoi = JSON.parse(await readFile(aoiPath, "utf8"));
  const admin2 = JSON.parse(await readFile(admin2Path, "utf8"));
  const admin3 = JSON.parse(await readFile(admin3Path, "utf8"));
  const candidates = [];

  for (const regionFeature of aoi.features) {
    const regionCode = regionFeature.properties.region_code;
    const targetCount = targetCountByRegion.get(regionCode) ?? 0;
    if (targetCount === 0) continue;

    const cells = generateRegionCells(regionFeature).slice(0, targetCount);
    if (cells.length < targetCount) {
      fail(`${regionCode}: generated ${cells.length} cells, expected ${targetCount}`);
    }

    candidates.push(
      ...cells.map((cell, index) => {
        const sequence = String(index + 1).padStart(3, "0");
        const admin2Feature = admin2.features.find((feature) => pointInFeature(cell.center, feature));
        const admin3Feature = admin3.features.find((feature) => pointInFeature(cell.center, feature));

        return {
          type: "Feature",
          properties: {
            site_id: `${regionCode}-${sequence}`,
            name: `${regionFeature.properties.region} Candidate ${sequence}`,
            region: regionFeature.properties.region,
            region_code: regionCode,
            zone: admin2Feature?.properties.adm2_name ?? "Unknown",
            woreda: admin3Feature?.properties.adm3_name ?? "Unknown",
            zone_pcode: admin2Feature?.properties.adm2_pcode ?? null,
            woreda_pcode: admin3Feature?.properties.adm3_pcode ?? null,
            area_ha: areaHaForGeometry(cell.geometry),
            candidate_method: "grid_5km_or_admin_unit",
            geometry_quality: "derived_grid",
            source_aoi: regionFeature.properties.source_adm1_pcode,
            centroid_lon: cell.center[0],
            centroid_lat: cell.center[1],
            data_coverage_basis:
              "Selected inside HDX/OCHA Admin 1 AOI; core registry sources have Ethiopia/global coverage. Feature extraction must still mark per-source nulls.",
          },
          geometry: cell.geometry,
        };
      })
    );
  }

  const output = {
    type: "FeatureCollection",
    name: "chaka_candidate_sites",
    metadata: {
      generated_by: "scripts/candidate-site-generator.mjs",
      source_aoi: "data/processed/aoi_boundaries.geojson",
      crs: "EPSG:4326",
      cell_size_degrees: cellSizeDegrees,
      candidate_count: candidates.length,
      note: "MVP candidate sites are deterministic grid cells inside target AOIs. They preserve the AGENT_STRUCTURE.md GeoJSON contract and can scale to national grid generation later.",
    },
    features: candidates,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${path.relative(root, outputPath)} (${candidates.length} candidates)`);
}

function generateRegionCells(regionFeature) {
  const bbox = bboxForFeatures([regionFeature]);
  const cells = [];

  for (
    let lat = round(bbox[1] + cellSizeDegrees / 2);
    lat <= bbox[3] - cellSizeDegrees / 2;
    lat = round(lat + cellSizeDegrees)
  ) {
    for (
      let lon = round(bbox[0] + cellSizeDegrees / 2);
      lon <= bbox[2] - cellSizeDegrees / 2;
      lon = round(lon + cellSizeDegrees)
    ) {
      if (!pointInFeature([lon, lat], regionFeature)) continue;
      cells.push({
        center: [lon, lat],
        geometry: squareCell(lon, lat, cellSizeDegrees),
      });
    }
  }

  return selectSpreadCells(cells, targetCountByRegion.get(regionFeature.properties.region_code));
}

function selectSpreadCells(cells, targetCount) {
  if (cells.length <= targetCount) return cells;

  const selected = [];
  const step = (cells.length - 1) / (targetCount - 1);

  for (let index = 0; index < targetCount; index += 1) {
    selected.push(cells[Math.round(index * step)]);
  }

  return selected;
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
