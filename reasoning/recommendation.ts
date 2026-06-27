import { interventionNameFromCode } from "@/reasoning/adapters";
import type {
  ModelPrediction,
  RecommendationObject,
  SiteFeature,
} from "@/reasoning/types";

export function createRecommendationObject(
  feature: SiteFeature,
  prediction: ModelPrediction,
  rank?: number,
): RecommendationObject {
  const intervention = interventionNameFromCode(
    prediction.recommended_intervention_seed,
  );
  const mainReasons = buildMainReasons(feature, prediction);
  const evidenceRefs = buildEvidenceRefs(feature, prediction, mainReasons.length);

  return {
    site_id: feature.site_id,
    rank,
    priority_score: prediction.priority_score,
    recommended_intervention: intervention,
    intervention_code: prediction.recommended_intervention_seed,
    carbon_potential: prediction.carbon_potential,
    biodiversity_benefit: prediction.biodiversity_benefit,
    livelihood_benefit: prediction.livelihood_benefit,
    water_soil_benefit: prediction.water_soil_benefit,
    implementation_feasibility: prediction.implementation_feasibility,
    risk_level: prediction.risk_level,
    main_reasons: mainReasons,
    risk_flags: buildRiskFlags(feature, prediction),
    field_validation_questions: buildFieldValidationQuestions(feature),
    evidence_refs: evidenceRefs,
  };
}

function buildMainReasons(feature: SiteFeature, prediction: ModelPrediction) {
  const reasons: string[] = [];

  if ((feature.population_pressure_score ?? 0) >= 70) {
    reasons.push("High livelihood pressure near farming communities");
  }

  if ((feature.rainfall_reliability_score ?? 0) >= 65) {
    reasons.push("Rainfall suitability supports tree establishment");
  }

  if (feature.land_cover_primary.includes("cropland_tree_mosaic")) {
    reasons.push(
      "Cropland-tree mosaic is appropriate for farmer-managed natural regeneration",
    );
  }

  if ((feature.slope_risk_score ?? 0) >= 75) {
    reasons.push("Slope and erosion risk make soil and water resilience important");
  }

  if ((feature.forest_loss_score ?? 0) >= 70) {
    reasons.push("Forest-loss signal indicates a restoration opportunity");
  }

  if (prediction.top_feature_contributions.length) {
    const top = prediction.top_feature_contributions[0];
    reasons.push(
      `Model ranking is strongly influenced by ${top.feature.replaceAll("_", " ")}`,
    );
  }

  return reasons.slice(0, 5);
}

function buildRiskFlags(feature: SiteFeature, prediction: ModelPrediction) {
  const flags: string[] = [];

  if ((feature.protected_area_overlap_pct ?? 0) > 0) {
    flags.push("Protected-area overlap requires safeguard validation");
  }

  if ((feature.safeguard_risk_score ?? 0) >= 60) {
    flags.push("High safeguard risk should be reviewed before investment");
  }

  if ((feature.settlement_proximity_score ?? 0) >= 80) {
    flags.push("Settlement and land-use overlap require field validation");
  }

  if (prediction.carbon_potential === "high") {
    flags.push(
      "Carbon potential is a pre-feasibility signal, not measured or verified carbon",
    );
  }

  if (feature.field_validation_required) {
    flags.push("Field validation is required before project investment");
  }

  return flags.length ? flags : ["No major automated risk flags detected"];
}

function buildFieldValidationQuestions(feature: SiteFeature) {
  const questions = [
    "Who currently uses this land and under what tenure arrangement?",
    "Is grazing pressure seasonal or year-round?",
    "Which tree species are locally preferred for fodder, fruit, fuelwood, or soil restoration?",
  ];

  if ((feature.protected_area_overlap_pct ?? 0) > 0) {
    questions.unshift(
      "Which protected-area rules apply, and which restoration activities are permitted?",
    );
  }

  if ((feature.settlement_proximity_score ?? 0) >= 80) {
    questions.unshift(
      "Which homes, paths, farms, grazing areas, or community assets overlap the candidate site?",
    );
  }

  return questions;
}

function buildEvidenceRefs(
  feature: SiteFeature,
  prediction: ModelPrediction,
  reasonCount: number,
) {
  const refs = [
    `site_features:${feature.site_id}.population_pressure_score`,
    `site_features:${feature.site_id}.rainfall_reliability_score`,
    `site_features:${feature.site_id}.land_cover_primary`,
    `site_features:${feature.site_id}.slope_risk_score`,
    `site_features:${feature.site_id}.forest_loss_score`,
    `site_predictions:${prediction.site_id}.priority_score`,
  ];

  return refs.slice(0, Math.max(reasonCount, 3));
}
