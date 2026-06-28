#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { areaHaForGeometry, bboxForGeometry, centroidForGeometry } from "./lib/geo-utils.mjs";

const root = process.cwd();
const admin1Path = path.join(root, "data/raw/hdx_ocha_eth_admin_boundaries/eth_admin1.geojson");
const outputPath = path.join(root, "data/processed/aoi_boundaries.geojson");
const lookupPath = path.join(root, "data/processed/aoi_lookup.csv");

const targetRegions = [
  {
    region_code: "TIG",
    source_adm1_name: "Tigray",
    canonical_name: "Tigray",
  },
  {
    region_code: "AMH",
    source_adm1_name: "Amhara",
    canonical_name: "Amhara",
  },
  {
    region_code: "ORO",
    source_adm1_name: "Oromia",
    canonical_name: "Oromia",
  },
  {
    region_code: "SET",
    source_adm1_name: "South Ethiopia",
    canonical_name: "South Ethiopia",
  },
  {
    region_code: "SWE",
    source_adm1_name: "South West Ethiopia",
    canonical_name: "Southwest Ethiopia Peoples' Region",
  },
  {
    region_code: "GAM",
    source_adm1_name: "Gambela",
    canonical_name: "Gambela",
  },
];

function fail(message) {
  console.error(`aoi-boundary-builder: ${message}`);
  process.exit(1);
}

async function main() {
  const source = JSON.parse(await readFile(admin1Path, "utf8"));
  const features = [];

  for (const target of targetRegions) {
    const sourceFeature = source.features.find(
      (feature) => feature.properties.adm1_name === target.source_adm1_name
    );

    if (!sourceFeature) {
      fail(`could not find Admin 1 region "${target.source_adm1_name}" in ${path.relative(root, admin1Path)}`);
    }

    features.push({
      type: "Feature",
      properties: {
        region_code: target.region_code,
        region: target.canonical_name,
        source_dataset: "hdx_ocha_eth_admin_boundaries",
        source_admin_level: "adm1",
        source_adm1_name: sourceFeature.properties.adm1_name,
        source_adm1_pcode: sourceFeature.properties.adm1_pcode,
        valid_on: sourceFeature.properties.valid_on,
        geometry_quality: "real_boundary",
        area_ha: areaHaForGeometry(sourceFeature.geometry),
        source_area_ha: Math.round(Number(sourceFeature.properties.area_sqkm) * 100),
        centroid_lon: centroidForGeometry(sourceFeature.geometry)[0],
        centroid_lat: centroidForGeometry(sourceFeature.geometry)[1],
        bbox: bboxForGeometry(sourceFeature.geometry),
      },
      geometry: sourceFeature.geometry,
    });
  }

  const output = {
    type: "FeatureCollection",
    name: "chaka_aoi_boundaries",
    metadata: {
      generated_by: "scripts/aoi-boundary-builder.mjs",
      source: "HDX/OCHA Ethiopia administrative boundaries COD-AB v04",
      source_file: "data/raw/hdx_ocha_eth_admin_boundaries/eth_admin1.geojson",
      crs: "EPSG:4326",
      note: "MVP AOIs include the original South Ethiopia/Southwest Ethiopia focus plus additional regional coverage for a fuller national demo map.",
    },
    features,
  };

  const lookupRows = [
    [
      "region_code",
      "region",
      "source_adm1_name",
      "source_adm1_pcode",
      "area_ha",
      "geometry_quality",
      "valid_on",
    ],
    ...features.map((feature) => [
      feature.properties.region_code,
      feature.properties.region,
      feature.properties.source_adm1_name,
      feature.properties.source_adm1_pcode,
      feature.properties.area_ha,
      feature.properties.geometry_quality,
      feature.properties.valid_on,
    ]),
  ];

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  await writeFile(lookupPath, `${lookupRows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`);

  console.log(`Wrote ${path.relative(root, outputPath)}`);
  console.log(`Wrote ${path.relative(root, lookupPath)}`);
}

function csvEscape(value) {
  const text = String(value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
