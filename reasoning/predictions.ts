import siteFeaturesData from "@/data/features/site_features.json";
import sitePredictionsData from "@/models/artifacts/site_predictions.json";
import {
  canonicalLabel,
  canonicalRiskLabel,
  componentScoresToPredictionLabels,
  interventionCodeFromName,
} from "@/reasoning/adapters";
import { calculateScores } from "@/reasoning/scoring";
import type {
  ModelPrediction,
  PredictionQuality,
  ProcessedSite,
  SiteFeature,
} from "@/reasoning/types";

export const siteFeatures = siteFeaturesData as SiteFeature[];
export const sitePredictions = sitePredictionsData as ModelPrediction[];

export function getSiteFeatures() {
  return siteFeatures;
}

export function getSiteFeature(siteId: string) {
  return siteFeatures.find((feature) => feature.site_id === siteId);
}

export function getModelPrediction(siteId: string) {
  return sitePredictions.find((prediction) => prediction.site_id === siteId);
}

export function getPredictionForFeature(
  feature: SiteFeature,
  fallbackSite?: ProcessedSite,
): ModelPrediction {
  return getModelPrediction(feature.site_id) ?? createFallbackPrediction(feature, fallbackSite);
}

export function createFallbackPrediction(
  feature: SiteFeature,
  fallbackSite?: ProcessedSite,
): ModelPrediction {
  const scores = fallbackSite ? calculateScores(fallbackSite) : null;
  const labels = scores
    ? componentScoresToPredictionLabels(scores)
    : {
        carbon_potential: canonicalLabel(feature.soil_organic_carbon_score),
        biodiversity_benefit: canonicalLabel(feature.forest_loss_score),
        livelihood_benefit: canonicalLabel(feature.population_pressure_score),
        water_soil_benefit: canonicalLabel(feature.slope_risk_score),
        implementation_feasibility: canonicalLabel(feature.road_access_score),
        risk_level: canonicalRiskLabel(feature.safeguard_risk_score),
      };

  return {
    site_id: feature.site_id,
    model_version: "ranker_v0.1",
    priority_score: scores
      ? scores.final_priority_score
      : fallbackPriorityScore(feature),
    recommended_intervention_seed: fallbackSite
      ? interventionCodeFromName(seedNameFromFeature(feature))
      : seedCodeFromFeature(feature),
    top_feature_contributions: topFeatureContributions(feature),
    prediction_quality: "rule_based_fallback" satisfies PredictionQuality,
    ...labels,
  };
}

function fallbackPriorityScore(feature: SiteFeature) {
  const positive =
    (feature.forest_loss_score ?? 50) * 0.18 +
    (feature.rainfall_reliability_score ?? 50) * 0.16 +
    (feature.slope_risk_score ?? 50) * 0.14 +
    (feature.soil_organic_carbon_score ?? 50) * 0.14 +
    (feature.population_pressure_score ?? 50) * 0.16 +
    (feature.road_access_score ?? 50) * 0.08 +
    (feature.data_quality_score ?? 50) * 0.08;
  const riskPenalty =
    (feature.safeguard_risk_score ?? 0) * 0.12 +
    (feature.protected_area_overlap_pct ?? 0) * 0.3;

  return Math.max(0, Math.min(100, Math.round(positive - riskPenalty)));
}

function seedCodeFromFeature(feature: SiteFeature) {
  if ((feature.safeguard_risk_score ?? 0) >= 60) {
    return "field_validation_before_investment";
  }

  if (feature.land_cover_primary.includes("riparian")) {
    return "riparian_restoration";
  }

  if (
    feature.land_cover_primary.includes("cropland") &&
    (feature.population_pressure_score ?? 0) >= 65
  ) {
    return "fmnr_agroforestry";
  }

  if ((feature.slope_risk_score ?? 0) >= 75) {
    return "assisted_natural_regeneration";
  }

  if ((feature.forest_loss_score ?? 0) >= 70) {
    return "native_tree_planting";
  }

  return "field_validation_before_investment";
}

function seedNameFromFeature(feature: SiteFeature) {
  return seedCodeFromFeature(feature);
}

function topFeatureContributions(feature: SiteFeature) {
  const contributions: ModelPrediction["top_feature_contributions"] = [
    {
      feature: "population_pressure_score",
      direction: "positive",
      weight: 0.18,
    },
    {
      feature: "rainfall_reliability_score",
      direction: "positive",
      weight: 0.14,
    },
    {
      feature: "safeguard_risk_score",
      direction: "negative",
      weight: 0.09,
    },
  ];

  if ((feature.slope_risk_score ?? 0) >= 75) {
    contributions.push({
      feature: "slope_risk_score",
      direction: "positive",
      weight: 0.12,
    });
  }

  return contributions;
}
