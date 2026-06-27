#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { areaHaForGeometry, pointInFeature } from "./lib/geo-utils.mjs";

const root = process.cwd();
const aoiPath = path.join(root, "data/processed/aoi_boundaries.geojson");
const candidatesPath = path.join(root, "data/processed/candidate_sites.geojson");

const minAreaHa = 10;
const maxAreaHa = 100000;
const warnings = [];
const errors = [];

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

async function main() {
  const aoi = JSON.parse(await readFile(aoiPath, "utf8"));
  const candidates = JSON.parse(await readFile(candidatesPath, "utf8"));

  if (aoi.type !== "FeatureCollection") addError("AOI file must be a FeatureCollection");
  if (candidates.type !== "FeatureCollection") addError("candidate sites file must be a FeatureCollection");

  const aoiByCode = new Map(aoi.features.map((feature) => [feature.properties.region_code, feature]));
  const seenSiteIds = new Set();

  for (const [index, feature] of candidates.features.entries()) {
    validateCandidate(feature, index, seenSiteIds, aoiByCode);
  }

  console.log(`Validated ${candidates.features.length} candidate sites`);
  console.log(`Warnings: ${warnings.length}`);
  for (const warning of warnings) console.warn(`warning: ${warning}`);

  if (errors.length > 0) {
    console.error(`Errors: ${errors.length}`);
    for (const error of errors) console.error(`error: ${error}`);
    process.exit(1);
  }

  console.log("Candidate site validation passed");
}

function validateCandidate(feature, index, seenSiteIds, aoiByCode) {
  const label = feature.properties?.site_id ?? `feature at index ${index}`;

  if (feature.type !== "Feature") addError(`${label}: must be a GeoJSON Feature`);
  if (!feature.geometry || feature.geometry.type !== "Polygon") {
    addError(`${label}: geometry must be a Polygon`);
    return;
  }

  const properties = feature.properties ?? {};
  const requiredProperties = [
    "site_id",
    "name",
    "region",
    "region_code",
    "zone",
    "woreda",
    "area_ha",
    "candidate_method",
    "geometry_quality",
    "centroid_lon",
    "centroid_lat",
  ];

  for (const property of requiredProperties) {
    if (!(property in properties)) addError(`${label}: missing property "${property}"`);
  }

  if (!/^[A-Z]{3}-\d{3}$/.test(properties.site_id)) {
    addError(`${label}: site_id must match <REGION_CODE>-<THREE_DIGIT_NUMBER>`);
  }

  if (seenSiteIds.has(properties.site_id)) addError(`${label}: duplicate site_id`);
  seenSiteIds.add(properties.site_id);

  if (!properties.site_id?.startsWith(`${properties.region_code}-`)) {
    addError(`${label}: site_id prefix must match region_code`);
  }

  if (properties.candidate_method !== "grid_5km_or_admin_unit") {
    addError(`${label}: candidate_method must remain compatible with AGENT_STRUCTURE.md`);
  }

  if (!["real_boundary", "derived_grid", "mock_demo"].includes(properties.geometry_quality)) {
    addError(`${label}: invalid geometry_quality "${properties.geometry_quality}"`);
  }

  if (properties.geometry_quality !== "derived_grid") {
    addWarning(`${label}: expected MVP candidate geometry_quality "derived_grid"`);
  }

  const computedAreaHa = areaHaForGeometry(feature.geometry);
  const areaDelta = Math.abs(computedAreaHa - Number(properties.area_ha));
  if (areaDelta > 1) {
    addError(`${label}: area_ha ${properties.area_ha} differs from computed ${computedAreaHa}`);
  }

  if (computedAreaHa < minAreaHa || computedAreaHa > maxAreaHa) {
    addError(`${label}: area ${computedAreaHa} ha is outside expected ${minAreaHa}-${maxAreaHa} ha range`);
  }

  if (computedAreaHa > 10000) {
    addWarning(`${label}: area ${computedAreaHa} ha is a large landscape unit, not a pilot-scale parcel`);
  }

  const aoiFeature = aoiByCode.get(properties.region_code);
  if (!aoiFeature) {
    addError(`${label}: no matching AOI for region_code "${properties.region_code}"`);
  } else if (!pointInFeature([properties.centroid_lon, properties.centroid_lat], aoiFeature)) {
    addError(`${label}: centroid is outside its AOI`);
  }

  if (properties.zone === "Unknown") addWarning(`${label}: zone is Unknown`);
  if (properties.woreda === "Unknown") addWarning(`${label}: woreda is Unknown`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
