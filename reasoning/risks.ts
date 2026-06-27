import type { ProcessedSite, RiskAssessment } from "@/reasoning/types";

export function detectRisks(site: ProcessedSite): RiskAssessment {
  const riskFlags: string[] = [];
  const fieldValidationQuestions: string[] = [];
  let riskScore = 0;

  if (site.social_feasibility.settlement_overlap) {
    riskScore += 22;
    riskFlags.push(
      "Do not recommend large-scale planting without land-use validation because settlement overlap is present.",
    );
    fieldValidationQuestions.push(
      "Which land uses, homes, paths, grazing areas or community assets overlap the proposed restoration area?",
    );
  }

  if (site.safeguards.protected_area_overlap) {
    riskScore += 30;
    riskFlags.push(
      "Protected-area overlap requires a safeguard review before any intervention is recommended.",
    );
    fieldValidationQuestions.push(
      "Which authority manages the protected area and what restoration activities are permitted?",
    );
  }

  const safeguardLevel = site.safeguards.safeguard_level.toLowerCase();
  if (safeguardLevel === "high") {
    riskScore += 18;
    riskFlags.push(
      "High safeguard level means biodiversity and community safeguards must be checked before implementation.",
    );
  } else if (safeguardLevel === "medium") {
    riskScore += 8;
    riskFlags.push(
      "Medium safeguard level should be reviewed during site validation.",
    );
  }

  const droughtRisk = site.rainfall.drought_risk.toLowerCase();
  if (droughtRisk === "high") {
    riskScore += 20;
    riskFlags.push(
      "High drought risk could reduce seedling survival and limit carbon-project reliability.",
    );
    fieldValidationQuestions.push(
      "Which species and water-conservation measures have survived recent dry seasons locally?",
    );
  } else if (droughtRisk === "medium") {
    riskScore += 9;
    riskFlags.push(
      "Medium drought risk means species choice and planting timing need local validation.",
    );
  }

  if (site.terrain.mean_slope_degrees >= 25) {
    riskScore += 12;
    riskFlags.push(
      "Very steep slopes raise implementation cost and field safety concerns.",
    );
  } else if (site.terrain.mean_slope_degrees >= 18) {
    riskScore += 6;
    riskFlags.push(
      "Steep slopes need erosion-control design before restoration work starts.",
    );
  }

  if (site.social_feasibility.road_access_score < 40) {
    riskScore += 14;
    riskFlags.push(
      "Low road access may increase implementation cost and monitoring effort.",
    );
    fieldValidationQuestions.push(
      "How long does it take field teams and nursery materials to reach this area in rainy season?",
    );
  }

  if (site.vegetation.vegetation_trend_10yr.toLowerCase() === "declining") {
    riskScore += 7;
    riskFlags.push(
      "Declining vegetation trend should be checked for drivers such as grazing, fuelwood pressure or tenure conflict.",
    );
  }

  if (site.social_feasibility.population_pressure_score >= 75) {
    riskScore += 6;
    fieldValidationQuestions.push(
      "How strong are grazing, fuelwood, crop expansion and tenure pressures around the candidate site?",
    );
  }

  fieldValidationQuestions.push(
    "Is there community willingness to protect regenerating trees for at least the first three years?",
    "Which land tenure or user-rights issues could affect restoration management?",
    "Which locally preferred species should be prioritized by nurseries and field teams?",
  );

  return {
    risk_level: levelFromScore(riskScore),
    risk_score: Math.min(100, riskScore),
    risk_penalty: Math.min(30, Math.round(riskScore * 0.35)),
    risk_flags: riskFlags.length
      ? riskFlags
      : ["No major automated risk flags detected; field validation is still required."],
    field_validation_questions: unique(fieldValidationQuestions),
  } as RiskAssessment;
}

function levelFromScore(score: number) {
  if (score >= 45) {
    return "High";
  }

  if (score >= 20) {
    return "Medium";
  }

  return "Low";
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
