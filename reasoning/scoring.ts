import type { ComponentScores, ProcessedSite } from "@/reasoning/types";

export function calculateScores(site: ProcessedSite): ComponentScores {
  const carbon_potential_score = scoreCarbonPotential(site);
  const biodiversity_restoration_score = scoreBiodiversityRestoration(site);
  const livelihood_score = scoreLivelihood(site);
  const erosion_water_score = scoreErosionWater(site);
  const feasibility_score = scoreFeasibility(site);
  const species_suitability_score = clamp(
    site.species_suitability.suitability_score,
  );
  const risk_penalty = scoreRiskPenalty(site);

  const final_priority_score = clamp(
    carbon_potential_score * 0.25 +
      biodiversity_restoration_score * 0.2 +
      livelihood_score * 0.2 +
      erosion_water_score * 0.15 +
      feasibility_score * 0.1 +
      species_suitability_score * 0.1 -
      risk_penalty,
  );

  return {
    carbon_potential_score,
    biodiversity_restoration_score,
    livelihood_score,
    erosion_water_score,
    feasibility_score,
    species_suitability_score,
    risk_penalty,
    final_priority_score,
  };
}

function scoreCarbonPotential(site: ProcessedSite) {
  const lowCanopyOpportunity =
    site.forest_change.canopy_height_class.toLowerCase() === "low" ? 78 : 58;
  const recoveryGap = clamp(100 - site.land_cover.tree_cover_percentage);
  const ndviRecoveryOpportunity = clamp((0.65 - site.vegetation.ndvi_mean) * 140);

  return roundedAverage([
    site.soil.soil_organic_carbon_score,
    site.forest_change.tree_cover_loss_score,
    lowCanopyOpportunity,
    recoveryGap,
    ndviRecoveryOpportunity,
    site.species_suitability.suitability_score,
  ]);
}

function scoreBiodiversityRestoration(site: ProcessedSite) {
  const atlas = priorityToScore(site.restoration_context.atlas_priority);
  const degradation = signalToScore(site.vegetation.degradation_signal);
  const forestLoss = site.forest_change.tree_cover_loss_score;
  const species = site.species_suitability.suitability_score;
  const nativeSpeciesBonus = hasSpeciesGroup(site, "native") ? 8 : 0;
  const safeguardAdjustment =
    site.safeguards.protected_area_overlap ||
    site.safeguards.safeguard_level.toLowerCase() === "high"
      ? -12
      : 0;

  return clamp(
    roundedAverage([atlas, degradation, forestLoss, species]) +
      nativeSpeciesBonus +
      safeguardAdjustment,
  );
}

function scoreLivelihood(site: ProcessedSite) {
  const agroforestryFit = site.land_cover.suitable_for_fmnr_agroforestry ? 82 : 48;

  return roundedAverage([
    site.social_feasibility.livelihood_need_score,
    site.social_feasibility.population_pressure_score,
    site.social_feasibility.road_access_score,
    agroforestryFit,
  ]);
}

function scoreErosionWater(site: ProcessedSite) {
  const slopeBenefit = clamp(site.terrain.mean_slope_degrees * 3.2);
  const watershed = priorityToScore(
    site.terrain.watershed_restoration_relevance,
  );

  return roundedAverage([
    site.terrain.erosion_risk_score,
    slopeBenefit,
    watershed,
    site.rainfall.rainfall_reliability_score,
  ]);
}

function scoreFeasibility(site: ProcessedSite) {
  const safeguardFeasibility =
    site.safeguards.protected_area_overlap ||
    site.safeguards.safeguard_level.toLowerCase() === "high"
      ? 25
      : site.safeguards.safeguard_level.toLowerCase() === "medium"
        ? 62
        : 88;
  const settlementFeasibility = site.social_feasibility.settlement_overlap
    ? 35
    : 86;
  const droughtFeasibility =
    site.rainfall.drought_risk.toLowerCase() === "high"
      ? 35
      : site.rainfall.drought_risk.toLowerCase() === "medium"
        ? 65
        : 88;

  return roundedAverage([
    site.social_feasibility.road_access_score,
    site.rainfall.rainfall_reliability_score,
    site.soil.soil_suitability_score,
    site.species_suitability.suitability_score,
    safeguardFeasibility,
    settlementFeasibility,
    droughtFeasibility,
  ]);
}

function scoreRiskPenalty(site: ProcessedSite) {
  let penalty = 0;

  if (site.social_feasibility.settlement_overlap) {
    penalty += 12;
  }

  if (site.safeguards.protected_area_overlap) {
    penalty += 18;
  }

  if (site.safeguards.safeguard_level.toLowerCase() === "high") {
    penalty += 10;
  } else if (site.safeguards.safeguard_level.toLowerCase() === "medium") {
    penalty += 4;
  }

  if (site.rainfall.drought_risk.toLowerCase() === "high") {
    penalty += 12;
  } else if (site.rainfall.drought_risk.toLowerCase() === "medium") {
    penalty += 5;
  }

  if (site.terrain.mean_slope_degrees >= 25) {
    penalty += 7;
  }

  if (site.social_feasibility.road_access_score < 40) {
    penalty += 8;
  }

  return clamp(penalty);
}

function hasSpeciesGroup(site: ProcessedSite, token: string) {
  return site.species_suitability.recommended_species_groups.some((group) =>
    group.toLowerCase().includes(token),
  );
}

function priorityToScore(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("high")) {
    return 88;
  }

  if (normalized.includes("medium")) {
    return 62;
  }

  if (normalized.includes("low")) {
    return 35;
  }

  return 50;
}

function signalToScore(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("high")) {
    return 86;
  }

  if (normalized.includes("medium") || normalized.includes("moderate")) {
    return 62;
  }

  if (normalized.includes("low")) {
    return 34;
  }

  return 50;
}

function roundedAverage(values: number[]) {
  return Math.round(
    values.reduce((total, value) => total + clamp(value), 0) / values.length,
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
