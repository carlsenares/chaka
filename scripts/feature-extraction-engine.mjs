#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const candidatesPath = path.join(root, "data/processed/candidate_sites.geojson");
const worldCoverPath = path.join(root, "data/features/source_extracts/worldcover_land_cover.json");
const srtmPath = path.join(root, "data/features/source_extracts/srtm_terrain.json");
const gfwPath = path.join(root, "data/features/source_extracts/gfw_umd_forest_change.json");
const chirpsPath = path.join(root, "data/features/source_extracts/chirps_rainfall.json");
const soilGridsPath = path.join(root, "data/features/source_extracts/soilgrids_soil.json");
const worldPopPath = path.join(root, "data/features/source_extracts/worldpop_population.json");
const osmAccessPath = path.join(root, "data/features/source_extracts/osm_access.json");
const jsonPath = path.join(root, "data/features/site_features.json");
const csvPath = path.join(root, "data/features/site_features.csv");

const profiles = [
  {
    land_cover_primary: "cropland_tree_mosaic",
    land_cover_mix: { tree_cover: 0.18, cropland: 0.52, grassland: 0.2, built_up: 0.02, water: 0.0, other: 0.08 },
    ndvi_current: 0.43,
    ndvi_trend_5y: -0.06,
    evi_current: 0.31,
    forest_loss_score: 68,
    rainfall_mean_mm: 1320,
    rainfall_reliability_score: 74,
    slope_mean_deg: 8.4,
    slope_risk_score: 42,
    soil_organic_carbon_score: 66,
    soil_ph_suitability_score: 72,
    population_pressure_score: 78,
    road_access_score: 69,
    settlement_proximity_score: 63,
    protected_area_overlap_pct: 0,
    safeguard_risk_score: 18,
  },
  {
    land_cover_primary: "degraded_grassland",
    land_cover_mix: { tree_cover: 0.08, cropland: 0.28, grassland: 0.5, built_up: 0.01, water: 0.0, other: 0.13 },
    ndvi_current: 0.34,
    ndvi_trend_5y: -0.09,
    evi_current: 0.24,
    forest_loss_score: 52,
    rainfall_mean_mm: 980,
    rainfall_reliability_score: 58,
    slope_mean_deg: 12.6,
    slope_risk_score: 64,
    soil_organic_carbon_score: 48,
    soil_ph_suitability_score: 61,
    population_pressure_score: 46,
    road_access_score: 38,
    settlement_proximity_score: 42,
    protected_area_overlap_pct: 0,
    safeguard_risk_score: 24,
  },
  {
    land_cover_primary: "forest_agriculture_edge",
    land_cover_mix: { tree_cover: 0.38, cropland: 0.32, grassland: 0.18, built_up: 0.01, water: 0.01, other: 0.1 },
    ndvi_current: 0.55,
    ndvi_trend_5y: -0.04,
    evi_current: 0.39,
    forest_loss_score: 76,
    rainfall_mean_mm: 1460,
    rainfall_reliability_score: 81,
    slope_mean_deg: 15.2,
    slope_risk_score: 69,
    soil_organic_carbon_score: 74,
    soil_ph_suitability_score: 68,
    population_pressure_score: 55,
    road_access_score: 44,
    settlement_proximity_score: 47,
    protected_area_overlap_pct: 6.5,
    safeguard_risk_score: 48,
  },
  {
    land_cover_primary: "highland_mixed_farming",
    land_cover_mix: { tree_cover: 0.14, cropland: 0.58, grassland: 0.16, built_up: 0.04, water: 0.0, other: 0.08 },
    ndvi_current: 0.48,
    ndvi_trend_5y: -0.02,
    evi_current: 0.34,
    forest_loss_score: 42,
    rainfall_mean_mm: 1180,
    rainfall_reliability_score: 67,
    slope_mean_deg: 9.8,
    slope_risk_score: 46,
    soil_organic_carbon_score: 58,
    soil_ph_suitability_score: 70,
    population_pressure_score: 84,
    road_access_score: 82,
    settlement_proximity_score: 76,
    protected_area_overlap_pct: 0,
    safeguard_risk_score: 16,
  },
  {
    land_cover_primary: "dryland_shrub_grass_mosaic",
    land_cover_mix: { tree_cover: 0.05, cropland: 0.18, grassland: 0.42, built_up: 0.01, water: 0.0, other: 0.34 },
    ndvi_current: 0.27,
    ndvi_trend_5y: -0.03,
    evi_current: 0.18,
    forest_loss_score: 28,
    rainfall_mean_mm: 720,
    rainfall_reliability_score: 36,
    slope_mean_deg: 6.2,
    slope_risk_score: 24,
    soil_organic_carbon_score: 35,
    soil_ph_suitability_score: 52,
    population_pressure_score: 32,
    road_access_score: 29,
    settlement_proximity_score: 35,
    protected_area_overlap_pct: 0,
    safeguard_risk_score: 12,
  },
  {
    land_cover_primary: "moist_forest_edge",
    land_cover_mix: { tree_cover: 0.46, cropland: 0.26, grassland: 0.12, built_up: 0.01, water: 0.01, other: 0.14 },
    ndvi_current: 0.61,
    ndvi_trend_5y: -0.05,
    evi_current: 0.44,
    forest_loss_score: 82,
    rainfall_mean_mm: 1580,
    rainfall_reliability_score: 84,
    slope_mean_deg: 11.4,
    slope_risk_score: 53,
    soil_organic_carbon_score: 79,
    soil_ph_suitability_score: 65,
    population_pressure_score: 48,
    road_access_score: 51,
    settlement_proximity_score: 46,
    protected_area_overlap_pct: 3.2,
    safeguard_risk_score: 36,
  },
  {
    land_cover_primary: "cropland_degraded_slope",
    land_cover_mix: { tree_cover: 0.1, cropland: 0.5, grassland: 0.25, built_up: 0.03, water: 0.0, other: 0.12 },
    ndvi_current: 0.37,
    ndvi_trend_5y: -0.08,
    evi_current: 0.26,
    forest_loss_score: 58,
    rainfall_mean_mm: 1100,
    rainfall_reliability_score: 63,
    slope_mean_deg: 18.6,
    slope_risk_score: 82,
    soil_organic_carbon_score: 52,
    soil_ph_suitability_score: 63,
    population_pressure_score: 69,
    road_access_score: 58,
    settlement_proximity_score: 61,
    protected_area_overlap_pct: 0,
    safeguard_risk_score: 21,
  },
  {
    land_cover_primary: "lower_priority_sparse_dryland",
    land_cover_mix: { tree_cover: 0.04, cropland: 0.12, grassland: 0.36, built_up: 0.0, water: 0.0, other: 0.48 },
    ndvi_current: 0.22,
    ndvi_trend_5y: 0.01,
    evi_current: 0.15,
    forest_loss_score: 18,
    rainfall_mean_mm: 640,
    rainfall_reliability_score: 30,
    slope_mean_deg: 5.1,
    slope_risk_score: 20,
    soil_organic_carbon_score: 28,
    soil_ph_suitability_score: 49,
    population_pressure_score: 24,
    road_access_score: 22,
    settlement_proximity_score: 26,
    protected_area_overlap_pct: 0,
    safeguard_risk_score: 10,
  },
];

function fail(message) {
  console.error(`feature-extraction-engine: ${message}`);
  process.exit(1);
}

async function main() {
  const candidates = JSON.parse(await readFile(candidatesPath, "utf8"));
  const worldCoverBySite = await loadExtractBySite(worldCoverPath);
  const srtmBySite = await loadExtractBySite(srtmPath, { optional: true });
  const gfwBySite = await loadExtractBySite(gfwPath, { optional: true });
  const chirpsBySite = await loadExtractBySite(chirpsPath);
  const soilGridsBySite = await loadExtractBySite(soilGridsPath);
  const worldPopBySite = await loadExtractBySite(worldPopPath, { optional: true });
  const osmAccessBySite = await loadExtractBySite(osmAccessPath, { optional: true });
  const features = candidates.features.map((candidate, index) =>
    buildFeature(candidate, index, {
      worldCover: worldCoverBySite.get(candidate.properties.site_id),
      srtm: srtmBySite.get(candidate.properties.site_id),
      gfw: gfwBySite.get(candidate.properties.site_id),
      chirps: chirpsBySite.get(candidate.properties.site_id),
      soilGrids: soilGridsBySite.get(candidate.properties.site_id),
      worldPop: worldPopBySite.get(candidate.properties.site_id),
      osmAccess: osmAccessBySite.get(candidate.properties.site_id),
    })
  );

  await mkdir(path.dirname(jsonPath), { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(features, null, 2)}\n`);
  await writeFile(csvPath, renderCsv(features));

  console.log(`Wrote ${path.relative(root, jsonPath)}`);
  console.log(`Wrote ${path.relative(root, csvPath)}`);
}

async function loadExtractBySite(filePath, { optional = false } = {}) {
  try {
    const extract = JSON.parse(await readFile(filePath, "utf8"));
    if (!Array.isArray(extract.features)) {
      throw new Error("missing features array");
    }
    return new Map(extract.features.map((feature) => [feature.site_id, feature]));
  } catch (error) {
    if (optional && error.code === "ENOENT") return new Map();
    throw new Error(`Could not load source extract ${path.relative(root, filePath)}: ${error.message}`);
  }
}

function buildFeature(candidate, index, extracts) {
  const profile = profiles[index % profiles.length];
  const properties = candidate.properties;
  const worldCoverFeature = extracts.worldCover;
  const srtmFeature = extracts.srtm;
  const gfwFeature = extracts.gfw;
  const chirpsFeature = extracts.chirps;
  const soilGridsFeature = extracts.soilGrids;
  const worldPopFeature = extracts.worldPop;
  const osmAccessFeature = extracts.osmAccess;
  const hasWorldCover = worldCoverFeature?.source_status === "source_derived";
  const hasSrtm = srtmFeature?.source_status === "source_derived";
  const hasGfw = gfwFeature?.source_status === "source_derived";
  const hasChirps = chirpsFeature?.source_status === "source_derived";
  const hasSoilGrids = soilGridsFeature?.source_status === "source_derived";
  const hasWorldPop = worldPopFeature?.source_status === "source_derived";
  const hasOsmAccess = osmAccessFeature?.source_status === "source_derived";
  const landCoverPrimary = hasWorldCover ? worldCoverFeature.land_cover_primary : profile.land_cover_primary;
  const landCoverMix = hasWorldCover ? worldCoverFeature.land_cover_mix : profile.land_cover_mix;
  const slopeMeanDeg = hasSrtm ? srtmFeature.slope_mean_deg : profile.slope_mean_deg;
  const slopeRiskScore = hasSrtm ? srtmFeature.slope_risk_score : profile.slope_risk_score;
  const forestLossScore = hasGfw && isFiniteNumber(gfwFeature.forest_loss_score)
    ? gfwFeature.forest_loss_score
    : profile.forest_loss_score;
  const rainfallMeanMm = hasChirps ? chirpsFeature.rainfall_mean_mm : profile.rainfall_mean_mm;
  const rainfallReliabilityScore = hasChirps
    ? normalizeChirpsReliability(chirpsFeature.rainfall_reliability_score)
    : profile.rainfall_reliability_score;
  const soilOrganicCarbonScore = hasSoilGrids
    ? soilGridsFeature.soil_organic_carbon_score
    : profile.soil_organic_carbon_score;
  const soilPhSuitabilityScore = hasSoilGrids
    ? soilGridsFeature.soil_ph_suitability_score
    : profile.soil_ph_suitability_score;
  const osmPopulationPressureScore = hasOsmAccess && isFiniteNumber(osmAccessFeature.population_pressure_proxy_score)
    ? osmAccessFeature.population_pressure_proxy_score
    : null;
  const populationPressureScore = hasWorldPop && isFiniteNumber(worldPopFeature.population_pressure_score)
    ? worldPopFeature.population_pressure_score
    : osmPopulationPressureScore !== null
    ? osmPopulationPressureScore
    : profile.population_pressure_score;
  const roadAccessScore = hasOsmAccess && isFiniteNumber(osmAccessFeature.road_access_score)
    ? osmAccessFeature.road_access_score
    : profile.road_access_score;
  const settlementProximityScore = hasOsmAccess && isFiniteNumber(osmAccessFeature.settlement_proximity_score)
    ? osmAccessFeature.settlement_proximity_score
    : profile.settlement_proximity_score;
  const hasUsableOsmAccess =
    hasOsmAccess &&
    [
      osmAccessFeature.road_access_score,
      osmAccessFeature.settlement_proximity_score,
      osmAccessFeature.population_pressure_proxy_score,
    ].some(isFiniteNumber);
  const dataQualityScore = Math.min(100,
    58 +
    (hasWorldCover ? 10 : 0) +
    (hasSrtm ? 8 : 0) +
    (hasGfw ? 8 : 0) +
    (hasChirps ? 8 : 0) +
    (hasSoilGrids ? 8 : 0) +
    (hasWorldPop ? 6 : 0) +
    (hasUsableOsmAccess ? 4 : 0)
  );
  const sourceDerivedGroups = [
    hasWorldCover ? "land_cover" : null,
    hasSrtm ? "terrain" : null,
    hasGfw ? "forest" : null,
    hasChirps ? "rainfall" : null,
    hasSoilGrids ? "soil" : null,
    hasWorldPop ? "population" : null,
    hasUsableOsmAccess ? "access" : null,
  ].filter(Boolean);

  return {
    site_id: properties.site_id,
    region: properties.region,
    zone: properties.zone,
    woreda: properties.woreda,
    area_ha: properties.area_ha,
    ...profile,
    land_cover_primary: landCoverPrimary,
    land_cover_mix: landCoverMix,
    rainfall_mean_mm: rainfallMeanMm,
    rainfall_reliability_score: rainfallReliabilityScore,
    slope_mean_deg: slopeMeanDeg,
    slope_risk_score: slopeRiskScore,
    forest_loss_score: forestLossScore,
    soil_organic_carbon_score: soilOrganicCarbonScore,
    soil_ph_suitability_score: soilPhSuitabilityScore,
    population_pressure_score: populationPressureScore,
    road_access_score: roadAccessScore,
    settlement_proximity_score: settlementProximityScore,
    data_quality_score: dataQualityScore,
    field_validation_required: true,
    feature_version: sourceDerivedGroups.length ? `mixed_${sourceDerivedGroups.join("_")}_v0` : "demo_mock_v0",
    feature_quality: sourceDerivedGroups.length
      ? `${sourceDerivedGroups.join("_")}_source_derived_other_fields_demo_mock`
      : "demo_mock_pending_source_verification",
    feature_note: sourceDerivedGroups.length
      ? `Source-derived feature groups: ${sourceDerivedGroups.join(", ")}. Remaining feature values are deterministic MVP placeholders pending source extraction.`
      : "MVP placeholder values based on plausible source ranges. Replace with source-derived extraction before making evidence claims.",
    source_extracts: {
      land_cover: hasWorldCover
        ? {
            dataset_id: "esa_worldcover",
            version: "2021_v200",
            status: "source_derived",
            valid_pixel_count: worldCoverFeature.valid_pixel_count,
            worldcover_primary_class: worldCoverFeature.worldcover_primary_class,
            worldcover_primary_label: worldCoverFeature.worldcover_primary_label,
            worldcover_class_fractions: worldCoverFeature.worldcover_class_fractions,
          }
        : {
            dataset_id: "esa_worldcover",
            status: "not_extracted",
          },
      terrain: hasSrtm
        ? {
            dataset_id: "srtm_dem",
            version: srtmFeature.version,
            status: "source_derived",
            elevation_mean_m: srtmFeature.elevation_mean_m,
            slope_mean_deg: srtmFeature.slope_mean_deg,
            valid_pixel_count: srtmFeature.valid_pixel_count,
          }
        : {
            dataset_id: "srtm_dem",
            status: "not_extracted",
          },
      forest: hasGfw
        ? {
            dataset_id: "gfw_umd_forest_change",
            status: "source_derived",
            forest_loss_score: forestLossScore,
            raw_forest_loss_score: gfwFeature.forest_loss_score,
            tree_cover_context_score: gfwFeature.tree_cover_context_score,
            treecover2000_mean_pct: gfwFeature.treecover2000_mean_pct,
            baseline_tree_cover_area_ha: gfwFeature.baseline_tree_cover_area_ha,
            loss_area_ha_total: gfwFeature.loss_area_ha_total,
            loss_area_ha_recent: gfwFeature.loss_area_ha_recent,
            loss_pct_of_baseline: gfwFeature.loss_pct_of_baseline,
            recent_loss_pct_of_baseline: gfwFeature.recent_loss_pct_of_baseline,
            tree_cover_threshold_pct: gfwFeature.tree_cover_threshold_pct,
            recent_loss_start_year: gfwFeature.recent_loss_start_year,
            gfw_valid_pixel_count: gfwFeature.gfw_valid_pixel_count,
            source_tiles: gfwFeature.source_tiles,
          }
        : {
            dataset_id: "gfw_umd_forest_change",
            status: gfwFeature?.source_status ?? "not_extracted",
          },
      rainfall: hasChirps
        ? {
            dataset_id: "chirps_v2_africa_monthly",
            status: "source_derived",
            rainfall_mean_mm: chirpsFeature.rainfall_mean_mm,
            rainfall_reliability_score_0_100: rainfallReliabilityScore,
            rainfall_reliability_raw_0_1: chirpsFeature.rainfall_reliability_score,
            rainfall_annual_totals_mm: chirpsFeature.rainfall_annual_totals_mm,
            chirps_valid_month_count: chirpsFeature.chirps_valid_month_count,
            chirps_valid_pixel_count_min: chirpsFeature.chirps_valid_pixel_count_min,
            chirps_valid_pixel_count_max: chirpsFeature.chirps_valid_pixel_count_max,
          }
        : {
            dataset_id: "chirps_v2_africa_monthly",
            status: "not_extracted",
          },
      soil: hasSoilGrids
        ? {
            dataset_id: "soilgrids",
            status: "source_derived",
            soil_organic_carbon_score: soilOrganicCarbonScore,
            soil_ph_suitability_score: soilPhSuitabilityScore,
            soilgrids_soc_0_30cm_g_kg_mean: soilGridsFeature.soilgrids_soc_0_30cm_g_kg_mean,
            soilgrids_ph_h2o_0_30cm_mean: soilGridsFeature.soilgrids_ph_h2o_0_30cm_mean,
            soilgrids_depth_means: soilGridsFeature.soilgrids_depth_means,
            soilgrids_valid_pixel_count_min: soilGridsFeature.soilgrids_valid_pixel_count_min,
            soilgrids_valid_pixel_count_max: soilGridsFeature.soilgrids_valid_pixel_count_max,
          }
        : {
            dataset_id: "soilgrids",
            status: soilGridsFeature?.source_status ?? "not_extracted",
          },
      population: hasWorldPop
        ? {
            dataset_id: "worldpop_population",
            status: "source_derived",
            population_pressure_score: populationPressureScore,
            raw_population_pressure_score: worldPopFeature.population_pressure_score,
            worldpop_population_sum: worldPopFeature.worldpop_population_sum,
            worldpop_population_density_per_km2: worldPopFeature.worldpop_population_density_per_km2,
            worldpop_valid_pixel_count: worldPopFeature.worldpop_valid_pixel_count,
          }
        : {
            dataset_id: "worldpop_population",
            status: worldPopFeature?.source_status ?? "not_extracted",
          },
      access: hasOsmAccess
        ? {
            dataset_id: "osm_access",
            status: "source_derived",
            road_access_score: isFiniteNumber(osmAccessFeature.road_access_score) ? osmAccessFeature.road_access_score : null,
            settlement_proximity_score: isFiniteNumber(osmAccessFeature.settlement_proximity_score)
              ? osmAccessFeature.settlement_proximity_score
              : null,
            population_pressure_score: osmPopulationPressureScore,
            raw_road_access_score: osmAccessFeature.road_access_score,
            raw_settlement_proximity_score: osmAccessFeature.settlement_proximity_score,
            raw_population_pressure_proxy_score: osmAccessFeature.population_pressure_proxy_score,
            nearest_road_distance_km: osmAccessFeature.nearest_road_distance_km,
            nearest_road_highway: osmAccessFeature.nearest_road_highway,
            nearest_settlement_distance_km: osmAccessFeature.nearest_settlement_distance_km,
            nearest_settlement_type: osmAccessFeature.nearest_settlement_type,
            osm_road_way_count: osmAccessFeature.osm_road_way_count,
            osm_settlement_element_count: osmAccessFeature.osm_settlement_element_count,
          }
        : {
            dataset_id: "osm_access",
            status: osmAccessFeature?.source_status ?? "not_extracted",
          },
    },
  };
}

function normalizeChirpsReliability(value) {
  if (!Number.isFinite(Number(value))) return null;
  return Math.round(Math.max(0, Math.min(1, Number(value))) * 100);
}

function isFiniteNumber(value) {
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

function renderCsv(features) {
  const columns = [
    "site_id",
    "region",
    "zone",
    "woreda",
    "area_ha",
    "land_cover_primary",
    "tree_cover",
    "cropland",
    "grassland",
    "built_up",
    "water",
    "other",
    "ndvi_current",
    "ndvi_trend_5y",
    "evi_current",
    "forest_loss_score",
    "rainfall_mean_mm",
    "rainfall_reliability_score",
    "slope_mean_deg",
    "slope_risk_score",
    "soil_organic_carbon_score",
    "soil_ph_suitability_score",
    "population_pressure_score",
    "road_access_score",
    "settlement_proximity_score",
    "protected_area_overlap_pct",
    "safeguard_risk_score",
    "data_quality_score",
    "field_validation_required",
    "feature_version",
    "feature_quality",
  ];

  const rows = [
    columns,
    ...features.map((feature) =>
      columns.map((column) =>
        column in feature.land_cover_mix ? feature.land_cover_mix[column] : feature[column]
      )
    ),
  ];

  return `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
