import type {
  CanonicalRiskLevel,
  CanonicalScoreLabel,
  ComponentScores,
  InterventionCode,
  ProcessedSite,
  SiteFeature,
} from "@/reasoning/types";

export function nestedPatrickSiteToSiteFeature(site: ProcessedSite): SiteFeature {
  const treeCover = percentToRatio(site.land_cover.tree_cover_percentage);
  const builtUp = percentToRatio(site.land_cover.built_up_percentage);
  const cropland = site.land_cover.dominant_class.toLowerCase().includes("crop")
    ? 0.52
    : site.land_cover.secondary_class.toLowerCase().includes("crop")
      ? 0.28
      : 0.12;
  const grassland =
    site.land_cover.dominant_class.toLowerCase().includes("grass") ||
    site.land_cover.secondary_class.toLowerCase().includes("grass")
      ? 0.35
      : 0.18;

  return {
    site_id: normalizeSiteId(site.site_id, site.admin.region),
    region: site.admin.region,
    zone: site.admin.zone,
    woreda: site.admin.woreda,
    area_ha: estimateAreaHa(site),
    land_cover_primary: toLandCoverPrimary(site),
    land_cover_mix: normalizeLandCoverMix({
      tree_cover: treeCover,
      cropland,
      grassland,
      built_up: builtUp,
      water: site.land_cover.secondary_class.toLowerCase().includes("riparian")
        ? 0.03
        : 0,
      other: 0.07,
    }),
    ndvi_current: site.vegetation.ndvi_mean,
    ndvi_trend_5y: trendToNumber(site.vegetation.vegetation_trend_10yr),
    evi_current: site.vegetation.ndvi_mean
      ? Number((site.vegetation.ndvi_mean * 0.72).toFixed(2))
      : null,
    forest_loss_score: site.forest_change.tree_cover_loss_score,
    rainfall_mean_mm: site.rainfall.annual_rainfall_mm,
    rainfall_reliability_score: site.rainfall.rainfall_reliability_score,
    slope_mean_deg: site.terrain.mean_slope_degrees,
    slope_risk_score: site.terrain.erosion_risk_score,
    soil_organic_carbon_score: site.soil.soil_organic_carbon_score,
    soil_ph_suitability_score: site.soil.soil_suitability_score,
    population_pressure_score:
      site.social_feasibility.population_pressure_score,
    road_access_score: site.social_feasibility.road_access_score,
    settlement_proximity_score: site.social_feasibility.settlement_overlap
      ? 90
      : Math.max(15, site.social_feasibility.population_pressure_score - 8),
    protected_area_overlap_pct: site.safeguards.protected_area_overlap ? 35 : 0,
    safeguard_risk_score: safeguardToRiskScore(site),
    data_quality_score: estimateDataQuality(site),
    field_validation_required: true,
    feature_version: "v0.1",
  };
}

export function normalizeSiteId(siteId: string, region: string) {
  if (/^[A-Z]{3}-\d{3}$/.test(siteId)) {
    return siteId;
  }

  const number = siteId.match(/\d{3}/)?.[0] ?? "001";
  const normalized = region.toLowerCase();
  const code =
    normalized.includes("tigray") ? "TIG" :
    normalized.includes("amhara") ? "AMH" :
    normalized.includes("oromia") ? "ORO" :
    normalized.includes("southwest") || normalized.includes("south west") ? "SWE" :
    normalized.includes("gambela") ? "GAM" :
    "SET";

  return `${code}-${number}`;
}

export function canonicalLabel(score: number | null): CanonicalScoreLabel {
  if ((score ?? 0) >= 75) {
    return "high";
  }

  if ((score ?? 0) >= 50) {
    return "medium";
  }

  return "low";
}

export function canonicalRiskLabel(score: number | null): CanonicalRiskLevel {
  if ((score ?? 0) >= 60) {
    return "high";
  }

  if ((score ?? 0) >= 30) {
    return "medium";
  }

  return "low";
}

export function interventionCodeFromName(name: string): InterventionCode {
  const normalized = name.toLowerCase();

  if (normalized.includes("fmnr") || normalized.includes("agroforestry")) {
    return "fmnr_agroforestry";
  }

  if (normalized.includes("riparian")) {
    return "riparian_restoration";
  }

  if (normalized.includes("native tree")) {
    return "native_tree_planting";
  }

  if (normalized.includes("erosion") || normalized.includes("soil/water")) {
    return "assisted_natural_regeneration";
  }

  if (normalized.includes("exclosure")) {
    return "erosion_control_exclosures";
  }

  return "field_validation_before_investment";
}

export function interventionNameFromCode(code: InterventionCode) {
  switch (code) {
    case "fmnr_agroforestry":
      return "FMNR + agroforestry";
    case "assisted_natural_regeneration":
      return "Assisted natural regeneration + soil and water conservation";
    case "riparian_restoration":
      return "Riparian restoration";
    case "native_tree_planting":
      return "Native tree restoration";
    case "erosion_control_exclosures":
      return "Erosion control + exclosures";
    case "field_validation_before_investment":
      return "Field validation before investment";
  }
}

export function componentScoresToPredictionLabels(scores: ComponentScores) {
  return {
    carbon_potential: canonicalLabel(scores.carbon_potential_score),
    biodiversity_benefit: canonicalLabel(
      scores.biodiversity_restoration_score,
    ),
    livelihood_benefit: canonicalLabel(scores.livelihood_score),
    water_soil_benefit: canonicalLabel(scores.erosion_water_score),
    implementation_feasibility: canonicalLabel(scores.feasibility_score),
    risk_level: canonicalRiskLabel(scores.risk_penalty * 3),
  };
}

function toLandCoverPrimary(site: ProcessedSite) {
  const dominant = site.land_cover.dominant_class.toLowerCase();
  const secondary = site.land_cover.secondary_class.toLowerCase();

  if (dominant.includes("crop") && secondary.includes("tree")) {
    return "cropland_tree_mosaic";
  }

  if (secondary.includes("riparian")) {
    return "riparian_degraded";
  }

  if (dominant.includes("forest") || secondary.includes("forest")) {
    return "degraded_forest_edge";
  }

  if (secondary.includes("bare")) {
    return "bare_sparse_vegetation";
  }

  if (secondary.includes("slope")) {
    return "steep_cropland_mosaic";
  }

  return `${dominant}_${secondary}`.replaceAll(/[^a-z0-9]+/g, "_");
}

function trendToNumber(trend: string) {
  const normalized = trend.toLowerCase();

  if (normalized.includes("declin")) {
    return -0.06;
  }

  if (normalized.includes("improv") || normalized.includes("increas")) {
    return 0.04;
  }

  return 0;
}

function percentToRatio(value: number) {
  return Number((value / 100).toFixed(2));
}

function normalizeLandCoverMix(
  mix: SiteFeature["land_cover_mix"],
): SiteFeature["land_cover_mix"] {
  const total = Object.values(mix).reduce((sum, value) => sum + value, 0);

  if (!total) {
    return mix;
  }

  return Object.fromEntries(
    Object.entries(mix).map(([key, value]) => [
      key,
      Number((value / total).toFixed(2)),
    ]),
  ) as SiteFeature["land_cover_mix"];
}

function safeguardToRiskScore(site: ProcessedSite) {
  if (site.safeguards.protected_area_overlap) {
    return 90;
  }

  const level = site.safeguards.safeguard_level.toLowerCase();

  if (level === "high") {
    return 75;
  }

  if (level === "medium") {
    return 38;
  }

  return 18;
}

function estimateDataQuality(site: ProcessedSite) {
  let score = 75;

  if (site.safeguards.safeguard_level.toLowerCase() === "high") {
    score -= 8;
  }

  if (site.social_feasibility.road_access_score < 40) {
    score -= 6;
  }

  if (site.rainfall.drought_risk.toLowerCase() === "high") {
    score -= 7;
  }

  return Math.max(45, Math.min(90, score));
}

function estimateAreaHa(site: ProcessedSite) {
  const base = site.admin.region.toLowerCase().includes("southwest")
    ? 1240
    : 980;
  const numeric = Number(site.site_id.match(/\d+/)?.[0] ?? 1);

  return Number((base + numeric * 47.5).toFixed(1));
}
