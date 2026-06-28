import type { ModelPrediction, SiteFeature } from "@/reasoning/types";

export type PriorityWeights = {
  carbon: number;
  biodiversity: number;
  water_soil: number;
  livelihood: number;
  feasibility: number;
};

export type PriorityComponents = {
  carbon: number;
  biodiversity: number;
  water_soil: number;
  livelihood: number;
  feasibility: number;
  feasibility_multiplier: number;
  land_cover_adjustment: number;
};

export const defaultPriorityWeights: PriorityWeights = {
  carbon: 42.5,
  biodiversity: 22.5,
  water_soil: 15,
  livelihood: 15,
  feasibility: 5,
};

export const priorityObjectives: Array<{
  key: keyof PriorityWeights;
  label: string;
  description: string;
}> = [
  {
    key: "carbon",
    label: "Carbon",
    description: "Restoration opportunity, ESA biomass stock context, uncertainty, and rainfall feasibility.",
  },
  {
    key: "biodiversity",
    label: "Biodiversity",
    description: "Habitat structure, restoration uplift, observation context, and pressure.",
  },
  {
    key: "water_soil",
    label: "Water and soil",
    description: "Rainfall reliability, erosion risk, soil carbon, and soil pH suitability.",
  },
  {
    key: "livelihood",
    label: "Livelihood",
    description: "Population pressure, road access, and settlement proximity context.",
  },
  {
    key: "feasibility",
    label: "Feasibility",
    description: "Access, safeguard risk, and data quality; also gates the final score.",
  },
];

export function scoreSite(feature: SiteFeature, weights: PriorityWeights) {
  const components = calculateComponents(feature);
  const normalizedWeights = normalizeWeights(weights);
  const basePriorityScore = clampScore(
    components.carbon * normalizedWeights.carbon +
      components.biodiversity * normalizedWeights.biodiversity +
      components.water_soil * normalizedWeights.water_soil +
      components.livelihood * normalizedWeights.livelihood +
      components.feasibility * normalizedWeights.feasibility +
      components.land_cover_adjustment,
  );
  const priorityScore = clampScore(basePriorityScore * components.feasibility_multiplier);

  return {
    priority_score: priorityScore,
    components,
  };
}

export function labelToScore(label: ModelPrediction["carbon_potential"]) {
  if (label === "high") return 82;
  if (label === "medium") return 57;
  return 32;
}

function calculateComponents(feature: SiteFeature): PriorityComponents {
  const feasibility = average([
    feature.road_access_score,
    100 - numberOr(feature.safeguard_risk_score, 50),
    feature.data_quality_score,
  ]);

  return {
    carbon: carbonScore(feature),
    biodiversity: biodiversityBenefitScore(feature),
    water_soil: average([
      feature.rainfall_reliability_score,
      100 - numberOr(feature.slope_risk_score, 50),
      feature.soil_organic_carbon_score,
      feature.soil_ph_suitability_score,
    ]),
    livelihood: average([
      feature.population_pressure_score,
      feature.road_access_score,
      feature.settlement_proximity_score,
    ]),
    feasibility,
    feasibility_multiplier: feasibilityGateMultiplier(feasibility),
    land_cover_adjustment: landCoverSuitabilityAdjustment(feature),
  };
}

function normalizeWeights(weights: PriorityWeights) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);

  if (!total) {
    return {
      carbon: 0,
      biodiversity: 0,
      water_soil: 0,
      livelihood: 0,
      feasibility: 0,
    };
  }

  return {
    carbon: weights.carbon / total,
    biodiversity: weights.biodiversity / total,
    water_soil: weights.water_soil / total,
    livelihood: weights.livelihood / total,
    feasibility: weights.feasibility / total,
  };
}

function vegetationOpportunityScore(feature: SiteFeature) {
  const lowCurrentVegetationOpportunity = (1 - numberOr(feature.ndvi_current, 0.5)) * 100;
  const degradationSignal = Math.max(0, -numberOr(feature.ndvi_trend_5y, 0)) * 1000;
  return clampScore(
    (lowCurrentVegetationOpportunity +
      degradationSignal +
      numberOr(feature.evi_current, 0.3) * 100) /
      3,
  );
}

function carbonLandCoverFitScore(feature: SiteFeature) {
  const mix = feature.land_cover_mix;
  return clampScore(
    mix.tree_cover * 65 +
      mix.cropland * 55 +
      mix.grassland * 50 +
      mix.other * 35 -
      mix.built_up * 80 -
      mix.water * 80,
  );
}

function carbonScore(feature: SiteFeature) {
  const opportunityRaw = average([
    vegetationOpportunityScore(feature),
    feature.forest_loss_score,
    feature.soil_organic_carbon_score,
    carbonLandCoverFitScore(feature),
  ]);
  const restorationOpportunity = clampScore(
    opportunityRaw * rainfallFeasibilityMultiplier(feature.rainfall_reliability_score),
  );
  const stock = carbonStockScore(feature);
  const confidence = carbonStockConfidenceScore(feature);

  if (stock === null) return restorationOpportunity;
  return clampScore(restorationOpportunity * 0.65 + stock * 0.25 + confidence * 0.1);
}

function carbonStockScore(feature: SiteFeature) {
  const sourceExtracts = (
    feature as SiteFeature & {
      source_extracts?: {
        carbon_stock_context?: {
          status?: string;
          esa_cci_agb_mean_mg_ha?: number | null;
          esa_cci_agb_relative_uncertainty_mean?: number | null;
        };
      };
    }
  ).source_extracts;
  const stock = sourceExtracts?.carbon_stock_context;
  const agbMean = Number(stock?.esa_cci_agb_mean_mg_ha);
  if (stock?.status !== "source_derived" || !Number.isFinite(agbMean)) return null;
  const relativeUncertainty = Number(stock.esa_cci_agb_relative_uncertainty_mean);
  const uncertaintyMultiplier = Number.isFinite(relativeUncertainty)
    ? Math.max(0.65, Math.min(0.95, 1 - relativeUncertainty * 0.35))
    : 0.75;
  return clampScore((agbMean / 160) * 100 * uncertaintyMultiplier);
}

function carbonStockConfidenceScore(feature: SiteFeature) {
  const sourceExtracts = (
    feature as SiteFeature & {
      source_extracts?: {
        carbon_stock_context?: {
          status?: string;
          esa_cci_agb_relative_uncertainty_mean?: number | null;
        };
      };
    }
  ).source_extracts;
  const stock = sourceExtracts?.carbon_stock_context;
  const relativeUncertainty = Number(stock?.esa_cci_agb_relative_uncertainty_mean);
  if (stock?.status !== "source_derived") return 45;
  if (!Number.isFinite(relativeUncertainty)) return 55;
  return clampScore(100 - relativeUncertainty * 60);
}

function rainfallFeasibilityMultiplier(rainfallReliabilityScore: number | null) {
  const score = Number(rainfallReliabilityScore);
  if (!Number.isFinite(score)) return 0.85;
  if (score <= 40) return 0.65;
  if (score <= 70) return 0.65 + ((score - 40) / 30) * 0.25;
  return Math.min(1, 0.9 + ((score - 70) / 30) * 0.1);
}

function biodiversityBenefitScore(feature: SiteFeature) {
  const habitatBase = habitatBaseScore(feature);
  const restorationUplift = average([
    feature.forest_loss_score,
    vegetationOpportunityScore(feature),
  ]);
  const observationContext = biodiversityObservationContextScore(feature);
  const pressurePenalty = biodiversityPressurePenalty(feature);

  if (observationContext === null) {
    return clampScore(habitatBase * 0.6 + restorationUplift * 0.4 - pressurePenalty);
  }

  return clampScore(
    habitatBase * 0.55 +
      restorationUplift * 0.35 +
      observationContext * 0.1 -
      pressurePenalty,
  );
}

function habitatBaseScore(feature: SiteFeature) {
  const mix = feature.land_cover_mix;
  return clampScore(
    mix.tree_cover * 85 +
      mix.grassland * 65 +
      mix.cropland * 40 +
      mix.other * 35 -
      mix.built_up * 90 -
      mix.water * 35,
  );
}

function biodiversityObservationContextScore(feature: SiteFeature) {
  const sourceExtracts = (
    feature as SiteFeature & {
      source_extracts?: {
        biodiversity_observations?: {
          occurrence_count?: number;
          biodiversity_context_score?: number;
        };
      };
    }
  ).source_extracts;
  const observations = sourceExtracts?.biodiversity_observations;
  const occurrenceCount = Number(observations?.occurrence_count);
  const contextScore = Number(observations?.biodiversity_context_score);

  if (
    Number.isFinite(occurrenceCount) &&
    occurrenceCount >= 10 &&
    Number.isFinite(contextScore)
  ) {
    return contextScore;
  }

  return null;
}

function biodiversityPressurePenalty(feature: SiteFeature) {
  const builtUpPenalty = feature.land_cover_mix.built_up * 35;
  const settlementPenalty =
    Math.max(0, numberOr(feature.settlement_proximity_score, 0) - 75) * 0.2;
  const safeguardPenalty =
    Math.max(0, numberOr(feature.safeguard_risk_score, 0) - 45) * 0.15;
  return builtUpPenalty + settlementPenalty + safeguardPenalty;
}

function landCoverSuitabilityAdjustment(feature: SiteFeature) {
  if (
    feature.land_cover_mix.water >= 0.5 ||
    feature.land_cover_primary === "water_dominant"
  ) {
    return -45;
  }

  if (feature.land_cover_mix.water >= 0.2) return -25;

  if (
    feature.land_cover_mix.built_up >= 0.4 ||
    feature.land_cover_primary === "built_up_dominant"
  ) {
    return -35;
  }

  if (feature.land_cover_mix.built_up >= 0.15) return -18;
  return 0;
}

function feasibilityGateMultiplier(feasibilityScore: number) {
  const score = Number(feasibilityScore);
  if (!Number.isFinite(score)) return 0.8;
  if (score <= 35) return 0.55;
  if (score <= 55) return 0.55 + ((score - 35) / 20) * 0.25;
  if (score <= 75) return 0.8 + ((score - 55) / 20) * 0.2;
  return 1;
}

function average(values: Array<number | null>) {
  return (
    values.reduce<number>((sum, value) => sum + numberOr(value, 50), 0) /
    values.length
  );
}

function numberOr(value: number | null, fallback: number) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
