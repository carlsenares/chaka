#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const candidatesPath = path.join(root, "data/processed/candidate_sites.geojson");
const featuresPath = path.join(root, "data/features/site_features.json");
const predictionsPath = path.join(root, "models/artifacts/site_predictions.json");
const osmAccessPath = path.join(root, "data/features/source_extracts/osm_access.json");
const worldPopPath = path.join(root, "data/features/source_extracts/worldpop_population.json");
const gfwPath = path.join(root, "data/features/source_extracts/gfw_umd_forest_change.json");

const featureRequiredFields = [
  "site_id",
  "region",
  "area_ha",
  "land_cover_primary",
  "land_cover_mix",
  "ndvi_current",
  "ndvi_trend_5y",
  "forest_loss_score",
  "rainfall_reliability_score",
  "slope_risk_score",
  "soil_organic_carbon_score",
  "population_pressure_score",
  "road_access_score",
  "protected_area_overlap_pct",
  "safeguard_risk_score",
  "data_quality_score",
  "field_validation_required",
  "feature_version",
];

const predictionRequiredFields = [
  "site_id",
  "model_version",
  "priority_score",
  "carbon_potential",
  "biodiversity_benefit",
  "livelihood_benefit",
  "water_soil_benefit",
  "implementation_feasibility",
  "risk_level",
  "recommended_intervention_seed",
  "top_feature_contributions",
  "prediction_quality",
];

const labels = new Set(["low", "medium", "high"]);
const predictionQualities = new Set(["expert_labeled", "atlas_labeled", "weak_supervised_demo", "rule_based_fallback"]);
const errors = [];

function addError(message) {
  errors.push(message);
}

async function main() {
  const candidates = JSON.parse(await readFile(candidatesPath, "utf8"));
  const features = JSON.parse(await readFile(featuresPath, "utf8"));
  const predictions = JSON.parse(await readFile(predictionsPath, "utf8"));
  const osmAccessBySite = await loadOptionalExtractBySite(osmAccessPath);
  const worldPopBySite = await loadOptionalExtractBySite(worldPopPath);
  const gfwBySite = await loadOptionalExtractBySite(gfwPath);

  const candidateIds = new Set(candidates.features.map((feature) => feature.properties.site_id));
  validateRows("feature", features, candidateIds, (row) => validateFeature(row, { osmAccessBySite, worldPopBySite, gfwBySite }));
  validateRows("prediction", predictions, candidateIds, validatePrediction);

  if (errors.length > 0) {
    console.error(`Artifact validation failed with ${errors.length} error(s)`);
    for (const error of errors) console.error(`error: ${error}`);
    process.exit(1);
  }

  console.log(`Validated ${features.length} feature rows`);
  console.log(`Validated ${predictions.length} prediction rows`);
  console.log("Feature and prediction artifact validation passed");
}

async function loadOptionalExtractBySite(filePath) {
  try {
    const extract = JSON.parse(await readFile(filePath, "utf8"));
    if (!Array.isArray(extract.features)) return new Map();
    return new Map(extract.features.map((feature) => [feature.site_id, feature]));
  } catch {
    return new Map();
  }
}

function validateRows(label, rows, candidateIds, validateRow) {
  if (!Array.isArray(rows)) {
    addError(`${label} artifact must be a JSON array`);
    return;
  }

  const seenIds = new Set();
  for (const row of rows) {
    if (!candidateIds.has(row.site_id)) addError(`${label} ${row.site_id}: no matching candidate site`);
    if (seenIds.has(row.site_id)) addError(`${label} ${row.site_id}: duplicate site_id`);
    seenIds.add(row.site_id);
    validateRow(row);
  }

  for (const siteId of candidateIds) {
    if (!seenIds.has(siteId)) addError(`${label}: missing row for ${siteId}`);
  }
}

function validateFeature(row, extracts) {
  for (const field of featureRequiredFields) {
    if (!(field in row)) addError(`feature ${row.site_id}: missing "${field}"`);
  }

  for (const [field, value] of Object.entries(row)) {
    if (field.endsWith("_score") && !isScore(value)) addError(`feature ${row.site_id}: ${field} must be 0-100`);
  }

  if (row.ndvi_current !== null && (row.ndvi_current < -1 || row.ndvi_current > 1)) {
    addError(`feature ${row.site_id}: ndvi_current must be -1 to 1`);
  }

  if (row.ndvi_trend_5y !== null && (row.ndvi_trend_5y < -1 || row.ndvi_trend_5y > 1)) {
    addError(`feature ${row.site_id}: ndvi_trend_5y must be -1 to 1`);
  }

  if (row.protected_area_overlap_pct !== null && !isScore(row.protected_area_overlap_pct)) {
    addError(`feature ${row.site_id}: protected_area_overlap_pct must be 0-100`);
  }

  const mixTotal = Object.values(row.land_cover_mix ?? {}).reduce((sum, value) => sum + Number(value), 0);
  if (Math.abs(mixTotal - 1) > 0.01) addError(`feature ${row.site_id}: land_cover_mix must sum to 1`);

  if (row.field_validation_required !== true) {
    addError(`feature ${row.site_id}: field_validation_required must be true for MVP`);
  }

  validateOsmAccessSync(row, extracts.osmAccessBySite.get(row.site_id));
  validateWorldPopSync(row, extracts.worldPopBySite.get(row.site_id));
  validateGfwSync(row, extracts.gfwBySite.get(row.site_id));
}

function validateOsmAccessSync(row, osmAccess) {
  if (!osmAccess) return;
  const integrated = row.source_extracts?.access;
  if (!integrated || integrated.dataset_id !== "osm_access") {
    addError(`feature ${row.site_id}: missing integrated osm_access source extract`);
    return;
  }

  const comparisons = [
    ["road_access_score", "raw_road_access_score"],
    ["settlement_proximity_score", "raw_settlement_proximity_score"],
    ["population_pressure_proxy_score", "raw_population_pressure_proxy_score"],
  ];

  for (const [sourceField, integratedField] of comparisons) {
    if (!sameNullableNumber(osmAccess[sourceField], integrated[integratedField])) {
      addError(
        `feature ${row.site_id}: integrated OSM ${integratedField} is stale; expected ${formatNullable(
          osmAccess[sourceField]
        )}, got ${formatNullable(integrated[integratedField])}`
      );
    }
  }
}

function validateWorldPopSync(row, worldPop) {
  if (!worldPop) return;

  if (worldPop.source_status === "source_derived") {
    if (!isNonNegativeNumber(worldPop.worldpop_population_sum)) {
      addError(`worldpop ${row.site_id}: worldpop_population_sum must be nonnegative`);
    }
    if (!isNonNegativeNumber(worldPop.worldpop_population_density_per_km2)) {
      addError(`worldpop ${row.site_id}: worldpop_population_density_per_km2 must be nonnegative`);
    }
    if (!Number.isInteger(Number(worldPop.worldpop_valid_pixel_count)) || Number(worldPop.worldpop_valid_pixel_count) <= 0) {
      addError(`worldpop ${row.site_id}: worldpop_valid_pixel_count must be a positive integer`);
    }
    if (!isScore(worldPop.population_pressure_score)) {
      addError(`worldpop ${row.site_id}: population_pressure_score must be 0-100`);
    }
  }

  const integrated = row.source_extracts?.population;
  if (!integrated || integrated.dataset_id !== "worldpop_population") {
    addError(`feature ${row.site_id}: missing integrated worldpop_population source extract`);
    return;
  }

  if (!sameNullableNumber(worldPop.population_pressure_score, integrated.raw_population_pressure_score)) {
    addError(
      `feature ${row.site_id}: integrated WorldPop raw_population_pressure_score is stale; expected ${formatNullable(
        worldPop.population_pressure_score
      )}, got ${formatNullable(integrated.raw_population_pressure_score)}`
    );
  }

  if (!sameNullableNumber(worldPop.worldpop_population_sum, integrated.worldpop_population_sum)) {
    addError(`feature ${row.site_id}: integrated WorldPop population sum is stale`);
  }

  if (!sameNullableNumber(worldPop.worldpop_population_density_per_km2, integrated.worldpop_population_density_per_km2)) {
    addError(`feature ${row.site_id}: integrated WorldPop population density is stale`);
  }
}

function validateGfwSync(row, gfw) {
  if (!gfw) return;

  if (gfw.source_status === "source_derived") {
    if (!isScore(gfw.forest_loss_score)) addError(`gfw ${row.site_id}: forest_loss_score must be 0-100`);
    if (!isScore(gfw.tree_cover_context_score)) addError(`gfw ${row.site_id}: tree_cover_context_score must be 0-100`);
    for (const field of [
      "treecover2000_mean_pct",
      "baseline_tree_cover_area_ha",
      "loss_area_ha_total",
      "loss_area_ha_recent",
      "loss_pct_of_baseline",
      "recent_loss_pct_of_baseline",
    ]) {
      if (!isNonNegativeNumber(gfw[field])) addError(`gfw ${row.site_id}: ${field} must be nonnegative`);
    }
    if (!Number.isInteger(Number(gfw.gfw_valid_pixel_count)) || Number(gfw.gfw_valid_pixel_count) <= 0) {
      addError(`gfw ${row.site_id}: gfw_valid_pixel_count must be a positive integer`);
    }
  }

  const integrated = row.source_extracts?.forest;
  if (!integrated || integrated.dataset_id !== "gfw_umd_forest_change") {
    addError(`feature ${row.site_id}: missing integrated gfw_umd_forest_change source extract`);
    return;
  }

  if (!sameNullableNumber(gfw.forest_loss_score, integrated.raw_forest_loss_score)) {
    addError(
      `feature ${row.site_id}: integrated GFW raw_forest_loss_score is stale; expected ${formatNullable(
        gfw.forest_loss_score
      )}, got ${formatNullable(integrated.raw_forest_loss_score)}`
    );
  }
  if (!sameNullableNumber(gfw.loss_pct_of_baseline, integrated.loss_pct_of_baseline)) {
    addError(`feature ${row.site_id}: integrated GFW loss_pct_of_baseline is stale`);
  }
  if (!sameNullableNumber(gfw.recent_loss_pct_of_baseline, integrated.recent_loss_pct_of_baseline)) {
    addError(`feature ${row.site_id}: integrated GFW recent_loss_pct_of_baseline is stale`);
  }
}

function validatePrediction(row) {
  for (const field of predictionRequiredFields) {
    if (!(field in row)) addError(`prediction ${row.site_id}: missing "${field}"`);
  }

  if (!isScore(row.priority_score)) addError(`prediction ${row.site_id}: priority_score must be 0-100`);

  for (const field of [
    "carbon_potential",
    "biodiversity_benefit",
    "livelihood_benefit",
    "water_soil_benefit",
    "implementation_feasibility",
    "risk_level",
  ]) {
    if (!labels.has(row[field])) addError(`prediction ${row.site_id}: invalid ${field}`);
  }

  if (!predictionQualities.has(row.prediction_quality)) {
    addError(`prediction ${row.site_id}: invalid prediction_quality`);
  }

  if (!Array.isArray(row.top_feature_contributions) || row.top_feature_contributions.length === 0) {
    addError(`prediction ${row.site_id}: top_feature_contributions must be non-empty`);
  }
}

function isScore(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100;
}

function isNonNegativeNumber(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;
}

function sameNullableNumber(left, right) {
  const leftValue = normalizeNullableNumber(left);
  const rightValue = normalizeNullableNumber(right);
  return leftValue === rightValue;
}

function normalizeNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (!Number.isFinite(Number(value))) return null;
  return Number(value);
}

function formatNullable(value) {
  const normalized = normalizeNullableNumber(value);
  return normalized === null ? "null" : String(normalized);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
