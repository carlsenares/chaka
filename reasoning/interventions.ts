import type {
  ComponentScores,
  InterventionRecommendation,
  ProcessedSite,
  RiskAssessment,
} from "@/reasoning/types";

export function classifyIntervention(
  site: ProcessedSite,
  scores: ComponentScores,
  risk: RiskAssessment,
): InterventionRecommendation {
  const matchedRules: string[] = [];
  const rationale: string[] = [];
  const actions: string[] = [];
  const landCover = `${site.land_cover.dominant_class} ${site.land_cover.secondary_class}`.toLowerCase();
  const options = site.restoration_context.suggested_restoration_options
    .join(" ")
    .toLowerCase();

  if (site.safeguards.protected_area_overlap || risk.risk_level === "High") {
    matchedRules.push("safeguard_or_high_risk_review");
    rationale.push(
      "Risk screening found constraints that should be resolved before committing to a large intervention.",
    );
    actions.push(
      "Run safeguard and land-use validation",
      "Confirm permitted activities with local authorities",
      "Use native species only where restoration is permitted",
    );

    return {
      recommended_intervention: site.safeguards.protected_area_overlap
        ? "Safeguard review"
        : "Field-validation-first",
      confidence: "High",
      matched_rules: matchedRules,
      rationale,
      recommended_actions: actions,
    } as InterventionRecommendation;
  }

  if (
    site.social_feasibility.settlement_overlap ||
    site.land_cover.built_up_percentage >= 12
  ) {
    matchedRules.push("settlement_overlap_validation");
    rationale.push(
      "Settlement or built-up overlap means the system should avoid recommending large-scale planting until land use is checked.",
    );
    actions.push(
      "Validate settlement and farm boundaries",
      "Prioritize household agroforestry only where landholders opt in",
      "Avoid block planting until land-use conflicts are ruled out",
    );

    return {
      recommended_intervention: "Field-validation-first",
      confidence: "High",
      matched_rules: matchedRules,
      rationale,
      recommended_actions: actions,
    } as InterventionRecommendation;
  }

  if (
    (landCover.includes("cropland") ||
      landCover.includes("tree_cover_mosaic")) &&
    site.land_cover.suitable_for_fmnr_agroforestry &&
    site.social_feasibility.population_pressure_score >= 65 &&
    site.rainfall.rainfall_reliability_score >= 60
  ) {
    matchedRules.push("cropland_tree_mosaic_fmnr_agroforestry");
    rationale.push(
      "Cropland/tree mosaic, strong livelihood need and reliable rainfall fit farmer-managed natural regeneration plus agroforestry.",
    );
    actions.push(
      "Farmer-managed natural regeneration",
      "Agroforestry with locally preferred fruit, fodder and fuelwood species",
      "Community validation of grazing rules and tree ownership",
    );

    return {
      recommended_intervention: "FMNR + agroforestry",
      confidence: scores.livelihood_score >= 75 ? "High" : "Medium",
      matched_rules: matchedRules,
      rationale,
      recommended_actions: actions,
    } as InterventionRecommendation;
  }

  if (
    site.terrain.mean_slope_degrees >= 15 &&
    site.terrain.erosion_risk_score >= 75 &&
    site.terrain.watershed_restoration_relevance.toLowerCase() === "high"
  ) {
    matchedRules.push("steep_degraded_watershed");
    rationale.push(
      "High slope and erosion risk make soil and water conservation central to the restoration package.",
    );
    actions.push(
      "Assisted natural regeneration",
      "Soil bunds, check dams or other locally appropriate erosion-control measures",
      "Temporary exclosures where communities agree",
    );

    return {
      recommended_intervention: "ANR + soil/water conservation",
      confidence: "High",
      matched_rules: matchedRules,
      rationale,
      recommended_actions: actions,
    } as InterventionRecommendation;
  }

  if (
    options.includes("riparian") ||
    landCover.includes("riparian") ||
    site.terrain.watershed_restoration_relevance.toLowerCase() === "high"
  ) {
    matchedRules.push("riparian_or_watershed_relevance");
    rationale.push(
      "Watershed relevance suggests restoration should protect water flow, stream buffers and erosion-prone areas.",
    );
    actions.push(
      "Riparian buffer restoration",
      "Native water-tolerant species selection",
      "Community rules to reduce stream-bank disturbance",
    );

    return {
      recommended_intervention: "Riparian/watershed restoration",
      confidence: "Medium",
      matched_rules: matchedRules,
      rationale,
      recommended_actions: actions,
    } as InterventionRecommendation;
  }

  if (
    site.forest_change.tree_cover_loss_score >= 70 &&
    site.rainfall.rainfall_reliability_score >= 65
  ) {
    matchedRules.push("high_forest_loss_good_rainfall");
    rationale.push(
      "High tree-cover loss and adequate rainfall point to a native restoration opportunity.",
    );
    actions.push(
      "Native tree restoration",
      "Assisted natural regeneration where rootstock remains",
      "Avoid monoculture planting and validate local species choice",
    );

    return {
      recommended_intervention: "Native tree restoration",
      confidence: "Medium",
      matched_rules: matchedRules,
      rationale,
      recommended_actions: actions,
    } as InterventionRecommendation;
  }

  matchedRules.push("general_restoration_screening");
  rationale.push(
    "The site has some restoration potential, but no single rule strongly dominates.",
  );
  actions.push(
    "Field validation",
    "Small pilot restoration plot",
    "Confirm community priorities before scaling",
  );

  return {
    recommended_intervention: "Field-validation-first",
    confidence: "Low",
    matched_rules: matchedRules,
    rationale,
    recommended_actions: actions,
  } as InterventionRecommendation;
}
