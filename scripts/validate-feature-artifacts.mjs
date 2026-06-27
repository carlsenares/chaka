#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const root = process.cwd();
const candidatesPath = path.join(root, "data/processed/candidate_sites.geojson");
const featuresPath = path.join(root, "data/features/site_features.json");
const predictionsPath = path.join(root, "models/artifacts/site_predictions.json");
const osmAccessPath = path.join(root, "data/features/source_extracts/osm_access.json");
const worldPopPath = path.join(root, "data/features/source_extracts/worldpop_population.json");
const gfwPath = path.join(root, "data/features/source_extracts/gfw_umd_forest_change.json");
const soilGridsPath = path.join(root, "data/features/source_extracts/soilgrids_soil.json");
const soilObservationsPath = path.join(root, "data/features/source_extracts/soil_observations.json");
const gbifBiodiversityPath = path.join(root, "data/features/source_extracts/gbif_biodiversity.json");
const ghslSettlementPath = path.join(root, "data/features/source_extracts/ghsl_settlement.json");

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
  const soilGridsBySite = await loadOptionalExtractBySite(soilGridsPath);
  const soilObservationsBySite = await loadOptionalExtractBySite(soilObservationsPath);
  const gbifBiodiversityBySite = await loadOptionalExtractBySite(gbifBiodiversityPath);
  const ghslSettlementBySite = await loadOptionalExtractBySite(ghslSettlementPath);

  const candidateIds = new Set(candidates.features.map((feature) => feature.properties.site_id));
  validateRows("feature", features, candidateIds, (row) =>
    validateFeature(row, {
      osmAccessBySite,
      worldPopBySite,
      gfwBySite,
      soilGridsBySite,
      soilObservationsBySite,
      gbifBiodiversityBySite,
      ghslSettlementBySite,
    })
  );
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
    await access(filePath, constants.F_OK);
  } catch {
    return new Map();
  }

  try {
    const extract = JSON.parse(await readFile(filePath, "utf8"));
    if (!Array.isArray(extract.features)) {
      throw new Error("missing features array");
    }
    return new Map(extract.features.map((feature) => [feature.site_id, feature]));
  } catch (error) {
    throw new Error(`Could not read optional source extract ${path.relative(root, filePath)}: ${error.message}`);
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
  validateSoilGridsSync(row, extracts.soilGridsBySite.get(row.site_id));
  validateSoilObservationsSync(row, extracts.soilObservationsBySite.get(row.site_id));
  validateGbifBiodiversitySync(row, extracts.gbifBiodiversityBySite.get(row.site_id));
  validateGhslSettlementSync(row, extracts.ghslSettlementBySite.get(row.site_id));
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

function validateSoilGridsSync(row, soilGrids) {
  if (!soilGrids) {
    if (row.source_extracts?.soil?.status === "source_derived") {
      addError(`feature ${row.site_id}: missing soilgrids source extract row`);
    }
    return;
  }

  if (soilGrids.source_status === "source_derived") {
    if (!isScore(soilGrids.soil_organic_carbon_score)) {
      addError(`soilgrids ${row.site_id}: soil_organic_carbon_score must be 0-100`);
    }
    if (!isScore(soilGrids.soil_ph_suitability_score)) {
      addError(`soilgrids ${row.site_id}: soil_ph_suitability_score must be 0-100`);
    }
    if (!Number.isInteger(Number(soilGrids.soilgrids_valid_pixel_count_min)) || Number(soilGrids.soilgrids_valid_pixel_count_min) <= 0) {
      addError(`soilgrids ${row.site_id}: soilgrids_valid_pixel_count_min must be a positive integer`);
    }
  }

  const integrated = row.source_extracts?.soil;
  if (!integrated || integrated.dataset_id !== "soilgrids") {
    addError(`feature ${row.site_id}: missing integrated soilgrids source extract`);
    return;
  }

  if (!sameNullableNumber(soilGrids.soil_organic_carbon_score, integrated.soil_organic_carbon_score)) {
    addError(`feature ${row.site_id}: integrated SoilGrids soil_organic_carbon_score is stale`);
  }
  if (!sameNullableNumber(soilGrids.soil_ph_suitability_score, integrated.soil_ph_suitability_score)) {
    addError(`feature ${row.site_id}: integrated SoilGrids soil_ph_suitability_score is stale`);
  }
  if (!sameNullableNumber(soilGrids.soilgrids_soc_0_30cm_g_kg_mean, integrated.soilgrids_soc_0_30cm_g_kg_mean)) {
    addError(`feature ${row.site_id}: integrated SoilGrids SOC mean is stale`);
  }
  if (!sameNullableNumber(soilGrids.soilgrids_ph_h2o_0_30cm_mean, integrated.soilgrids_ph_h2o_0_30cm_mean)) {
    addError(`feature ${row.site_id}: integrated SoilGrids pH mean is stale`);
  }
}

function validateSoilObservationsSync(row, soilObservations) {
  if (!soilObservations) {
    if (row.source_extracts?.soil_observations?.status && row.source_extracts.soil_observations.status !== "not_extracted") {
      addError(`feature ${row.site_id}: missing soil_observations source extract row`);
    }
    return;
  }

  const validStatuses = new Set(["source_derived", "partial_source_derived", "no_observations", "blocked_source_unavailable"]);
  if (!validStatuses.has(soilObservations.source_status)) {
    addError(`soil observations ${row.site_id}: invalid source_status`);
  }

  for (const field of [
    "soil_observation_count_total",
    "soil_observation_count_wosis",
    "soil_observation_count_afsis",
    "soil_observation_profile_count",
  ]) {
    if (!Number.isInteger(Number(soilObservations[field])) || Number(soilObservations[field]) < 0) {
      addError(`soil observations ${row.site_id}: ${field} must be a nonnegative integer`);
    }
  }

  if (!isScore(soilObservations.soil_observation_support_score)) {
    addError(`soil observations ${row.site_id}: soil_observation_support_score must be 0-100`);
  }
  if (soilObservations.soil_observation_nearest_distance_km !== null) {
    if (!isNonNegativeNumber(soilObservations.soil_observation_nearest_distance_km)) {
      addError(`soil observations ${row.site_id}: nearest distance must be nonnegative`);
    }
    if (Number(soilObservations.soil_observation_nearest_distance_km) > Number(soilObservations.soil_observation_radius_km)) {
      addError(`soil observations ${row.site_id}: nearest distance exceeds observation radius`);
    }
  }
  if (soilObservations.observed_soc_0_30cm_g_kg_mean !== null) {
    const value = Number(soilObservations.observed_soc_0_30cm_g_kg_mean);
    if (!Number.isFinite(value) || value < 0 || value > 300) addError(`soil observations ${row.site_id}: SOC mean is implausible`);
  }
  if (soilObservations.observed_ph_h2o_0_30cm_mean !== null) {
    const value = Number(soilObservations.observed_ph_h2o_0_30cm_mean);
    if (!Number.isFinite(value) || value < 0 || value > 14) addError(`soil observations ${row.site_id}: pH mean must be 0-14`);
  }
  for (const field of ["observed_sand_pct_mean", "observed_silt_pct_mean", "observed_clay_pct_mean"]) {
    if (soilObservations[field] !== null && !isScore(soilObservations[field])) {
      addError(`soil observations ${row.site_id}: ${field} must be 0-100`);
    }
  }
  const textureValues = ["observed_sand_pct_mean", "observed_silt_pct_mean", "observed_clay_pct_mean"]
    .map((field) => soilObservations[field])
    .filter((value) => value !== null && value !== undefined)
    .map(Number);
  if (textureValues.length === 3) {
    const textureSum = textureValues.reduce((sum, value) => sum + value, 0);
    if (Math.abs(textureSum - 100) > 10) addError(`soil observations ${row.site_id}: texture means should sum near 100`);
  }

  const integrated = row.source_extracts?.soil_observations;
  if (!integrated || integrated.dataset_id !== "soil_observations") {
    addError(`feature ${row.site_id}: missing integrated soil_observations source extract`);
    return;
  }

  if (soilObservations.source_status !== integrated.status) {
    addError(`feature ${row.site_id}: integrated soil_observations status is stale`);
  }

  for (const field of [
    "soil_observation_count_total",
    "soil_observation_count_wosis",
    "soil_observation_count_afsis",
    "soil_observation_profile_count",
    "soil_observation_nearest_distance_km",
    "soil_observation_radius_km",
    "observed_soc_0_30cm_g_kg_mean",
    "observed_ph_h2o_0_30cm_mean",
    "observed_sand_pct_mean",
    "observed_silt_pct_mean",
    "observed_clay_pct_mean",
    "soil_observation_support_score",
    "soilgrids_soc_delta_g_kg",
    "soilgrids_ph_delta",
  ]) {
    if (!sameNullableNumber(soilObservations[field], integrated[field])) {
      addError(`feature ${row.site_id}: integrated soil_observations ${field} is stale`);
    }
  }

  if (JSON.stringify(soilObservations.nearest_observations ?? []) !== JSON.stringify(integrated.nearest_observations ?? [])) {
    addError(`feature ${row.site_id}: integrated soil_observations nearest_observations is stale`);
  }
}

function validateGbifBiodiversitySync(row, gbifBiodiversity) {
  if (!gbifBiodiversity) {
    if (row.source_extracts?.biodiversity_observations?.status && row.source_extracts.biodiversity_observations.status !== "not_extracted") {
      addError(`feature ${row.site_id}: missing gbif_biodiversity source extract row`);
    }
    return;
  }

  const validStatuses = new Set(["source_derived", "insufficient_records", "blocked_source_unavailable", "not_processed_limit"]);
  if (!validStatuses.has(gbifBiodiversity.source_status)) {
    addError(`gbif biodiversity ${row.site_id}: invalid source_status`);
  }

  for (const field of [
    "occurrence_count",
    "unfiltered_occurrence_count",
    "rejected_or_filtered_occurrence_count",
    "species_count",
    "eod_ebird_occurrence_count",
    "eod_ebird_species_count",
    "bale_plant_occurrence_count",
    "bale_plant_species_count",
    "plant_species_count",
    "threatened_or_near_threatened_species_count",
    "recent_occurrence_count_5y",
  ]) {
    if (!Number.isInteger(Number(gbifBiodiversity[field])) || Number(gbifBiodiversity[field]) < 0) {
      addError(`gbif biodiversity ${row.site_id}: ${field} must be a nonnegative integer`);
    }
  }

  if (!isScore(gbifBiodiversity.sampling_bias_risk_score)) {
    addError(`gbif biodiversity ${row.site_id}: sampling_bias_risk_score must be 0-100`);
  }
  if (gbifBiodiversity.biodiversity_context_score !== null && !isScore(gbifBiodiversity.biodiversity_context_score)) {
    addError(`gbif biodiversity ${row.site_id}: biodiversity_context_score must be null or 0-100`);
  }
  if (gbifBiodiversity.observation_density_per_km2 !== null && !isNonNegativeNumber(gbifBiodiversity.observation_density_per_km2)) {
    addError(`gbif biodiversity ${row.site_id}: observation_density_per_km2 must be nonnegative`);
  }
  for (const field of ["coordinate_uncertainty_median_m", "coordinate_uncertainty_p90_m"]) {
    if (gbifBiodiversity[field] !== null && !isNonNegativeNumber(gbifBiodiversity[field])) {
      addError(`gbif biodiversity ${row.site_id}: ${field} must be nonnegative`);
    }
  }
  for (const field of ["gbif_query_hash", "gbif_query_url"]) {
    if (gbifBiodiversity[field] !== null && typeof gbifBiodiversity[field] !== "string") {
      addError(`gbif biodiversity ${row.site_id}: ${field} must be null or a string`);
    }
  }
  for (const field of ["basis_counts", "license_counts"]) {
    if (!isPlainObject(gbifBiodiversity[field])) {
      addError(`gbif biodiversity ${row.site_id}: ${field} must be an object`);
    }
  }
  for (const field of ["dataset_counts_top", "top_taxa"]) {
    if (!Array.isArray(gbifBiodiversity[field])) {
      addError(`gbif biodiversity ${row.site_id}: ${field} must be an array`);
    }
  }

  const integrated = row.source_extracts?.biodiversity_observations;
  if (!integrated || integrated.dataset_id !== "gbif_biodiversity") {
    addError(`feature ${row.site_id}: missing integrated gbif_biodiversity source extract`);
    return;
  }

  if (gbifBiodiversity.source_status !== integrated.status) {
    addError(`feature ${row.site_id}: integrated gbif_biodiversity status is stale`);
  }

  for (const field of ["gbif_query_hash", "gbif_query_url"]) {
    if ((gbifBiodiversity[field] ?? null) !== (integrated[field] ?? null)) {
      addError(`feature ${row.site_id}: integrated gbif_biodiversity ${field} is stale`);
    }
  }

  for (const field of [
    "occurrence_count",
    "unfiltered_occurrence_count",
    "rejected_or_filtered_occurrence_count",
    "species_count",
    "eod_ebird_occurrence_count",
    "eod_ebird_species_count",
    "bale_plant_occurrence_count",
    "bale_plant_species_count",
    "plant_species_count",
    "threatened_or_near_threatened_species_count",
    "recent_occurrence_count_5y",
    "observation_density_per_km2",
    "coordinate_uncertainty_median_m",
    "coordinate_uncertainty_p90_m",
    "sampling_bias_risk_score",
    "biodiversity_context_score",
  ]) {
    if (!sameNullableNumber(gbifBiodiversity[field], integrated[field])) {
      addError(`feature ${row.site_id}: integrated gbif_biodiversity ${field} is stale`);
    }
  }

  for (const field of ["basis_counts", "license_counts", "dataset_counts_top", "top_taxa"]) {
    if (JSON.stringify(gbifBiodiversity[field] ?? null) !== JSON.stringify(integrated[field] ?? null)) {
      addError(`feature ${row.site_id}: integrated gbif_biodiversity ${field} is stale`);
    }
  }
}

function validateGhslSettlementSync(row, ghslSettlement) {
  if (!ghslSettlement) {
    if (row.source_extracts?.settlement_context?.status && row.source_extracts.settlement_context.status !== "not_extracted") {
      addError(`feature ${row.site_id}: missing ghsl_settlement source extract row`);
    }
    return;
  }

  const validStatuses = new Set(["source_derived", "no_valid_pixels", "no_intersection"]);
  if (!validStatuses.has(ghslSettlement.source_status)) {
    addError(`ghsl settlement ${row.site_id}: invalid source_status`);
  }

  if (!isPlainObject(ghslSettlement.ghsl_smod_class_fractions)) {
    addError(`ghsl settlement ${row.site_id}: ghsl_smod_class_fractions must be an object`);
  } else if (Object.keys(ghslSettlement.ghsl_smod_class_fractions).length > 0) {
    const total = Object.values(ghslSettlement.ghsl_smod_class_fractions).reduce((sum, value) => sum + Number(value), 0);
    if (Math.abs(total - 1) > 0.01) addError(`ghsl settlement ${row.site_id}: class fractions must sum to 1`);
  }

  for (const field of [
    "ghsl_urban_centre_fraction",
    "ghsl_dense_settlement_fraction",
    "ghsl_rural_or_low_density_fraction",
  ]) {
    if (ghslSettlement[field] !== null && !isUnitFraction(ghslSettlement[field])) {
      addError(`ghsl settlement ${row.site_id}: ${field} must be null or 0-1`);
    }
  }

  if (ghslSettlement.ghsl_settlement_context_score !== null && !isScore(ghslSettlement.ghsl_settlement_context_score)) {
    addError(`ghsl settlement ${row.site_id}: ghsl_settlement_context_score must be null or 0-100`);
  }
  if (!Number.isInteger(Number(ghslSettlement.ghsl_valid_pixel_count)) || Number(ghslSettlement.ghsl_valid_pixel_count) < 0) {
    addError(`ghsl settlement ${row.site_id}: ghsl_valid_pixel_count must be a nonnegative integer`);
  }
  if (ghslSettlement.source_status === "source_derived" && Number(ghslSettlement.ghsl_valid_pixel_count) <= 0) {
    addError(`ghsl settlement ${row.site_id}: source_derived rows must have valid pixels`);
  }

  const integrated = row.source_extracts?.settlement_context;
  if (!integrated || integrated.dataset_id !== "ghsl_settlement") {
    addError(`feature ${row.site_id}: missing integrated ghsl_settlement source extract`);
    return;
  }

  if (ghslSettlement.source_status !== integrated.status) {
    addError(`feature ${row.site_id}: integrated ghsl_settlement status is stale`);
  }

  for (const field of [
    "ghsl_urban_centre_fraction",
    "ghsl_dense_settlement_fraction",
    "ghsl_rural_or_low_density_fraction",
    "ghsl_settlement_context_score",
    "ghsl_valid_pixel_count",
  ]) {
    if (!sameNullableNumber(ghslSettlement[field], integrated[field])) {
      addError(`feature ${row.site_id}: integrated ghsl_settlement ${field} is stale`);
    }
  }

  if (JSON.stringify(ghslSettlement.ghsl_smod_class_fractions ?? null) !== JSON.stringify(integrated.ghsl_smod_class_fractions ?? null)) {
    addError(`feature ${row.site_id}: integrated ghsl_settlement class fractions are stale`);
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

function isUnitFraction(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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
