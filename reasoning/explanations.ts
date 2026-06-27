import type {
  ComponentScores,
  Explanation,
  InterventionRecommendation,
  ProcessedSite,
  RiskAssessment,
  SimilarCaseMatch,
} from "@/reasoning/types";

export function generateExplanation(
  site: ProcessedSite,
  scores: ComponentScores,
  intervention: InterventionRecommendation,
  risk: RiskAssessment,
  similarCases: SimilarCaseMatch[],
): Explanation {
  const mainReasons = buildMainReasons(site, scores, intervention);
  const topCase = similarCases[0];

  return {
    summary: `${site.admin.woreda} is ranked at ${scores.final_priority_score}/100 because it combines ${label(
      scores.carbon_potential_score,
    ).toLowerCase()} carbon recovery potential, ${label(
      scores.livelihood_score,
    ).toLowerCase()} livelihood relevance and ${label(
      scores.erosion_water_score,
    ).toLowerCase()} erosion/water benefit. The recommended intervention is ${
      intervention.recommended_intervention
    }.`,
    main_reasons: mainReasons,
    why_this_area: buildWhyThisArea(site, scores),
    why_this_intervention: buildWhyThisIntervention(intervention, topCase),
    expected_benefits: {
      climate: buildClimateBenefit(scores),
      biodiversity: buildBiodiversityBenefit(site, scores),
      livelihood: buildLivelihoodBenefit(site, scores),
      water_soil: buildWaterSoilBenefit(site, scores),
    },
    risks_to_check: risk.risk_flags,
    field_validation_next_steps: risk.field_validation_questions,
  };
}

function buildMainReasons(
  site: ProcessedSite,
  scores: ComponentScores,
  intervention: InterventionRecommendation,
) {
  const reasons = [
    `${label(scores.carbon_potential_score)} carbon potential from soil carbon, tree-cover recovery opportunity and species suitability.`,
    `${label(scores.livelihood_score)} livelihood relevance from population pressure, livelihood need and road access.`,
    `${label(scores.erosion_water_score)} erosion/water benefit from slope, erosion risk and watershed relevance.`,
  ];

  if (site.restoration_context.atlas_priority.toLowerCase() === "high") {
    reasons.push("High atlas priority supports restoration relevance.");
  }

  if (site.land_cover.suitable_for_fmnr_agroforestry) {
    reasons.push(
      "Land-cover structure is suitable for FMNR/agroforestry rather than only block planting.",
    );
  }

  reasons.push(...intervention.rationale);

  return reasons;
}

function buildWhyThisArea(site: ProcessedSite, scores: ComponentScores) {
  return `This area stands out because Patrick's data shows ${site.vegetation.degradation_signal} degradation, ${site.forest_change.tree_cover_loss_score}/100 tree-cover loss pressure, ${site.rainfall.rainfall_reliability_score}/100 rainfall reliability and ${site.social_feasibility.livelihood_need_score}/100 livelihood need. Together these inputs produce a final priority score of ${scores.final_priority_score}/100.`;
}

function buildWhyThisIntervention(
  intervention: InterventionRecommendation,
  topCase: SimilarCaseMatch | undefined,
) {
  const caseSentence = topCase
    ? ` The closest reference case is ${topCase.region}, ${topCase.country}, where the lesson was: ${topCase.lesson}`
    : "";

  return `${intervention.recommended_intervention} is recommended because ${intervention.rationale.join(
    " ",
  )}${caseSentence}`;
}

function buildClimateBenefit(scores: ComponentScores) {
  if (scores.carbon_potential_score >= 75) {
    return "High carbon and vegetation recovery potential; suitable for deeper carbon pre-feasibility screening.";
  }

  if (scores.carbon_potential_score >= 50) {
    return "Moderate carbon potential; better framed as a community restoration project unless field data confirms stronger sequestration.";
  }

  return "Lower carbon potential; climate value should be treated as secondary to resilience or livelihood benefits.";
}

function buildBiodiversityBenefit(site: ProcessedSite, scores: ComponentScores) {
  if (site.safeguards.protected_area_overlap) {
    return "Potential biodiversity value is high, but protected-area safeguards must be reviewed before action.";
  }

  if (scores.biodiversity_restoration_score >= 75) {
    return "High biodiversity/restoration value if native and locally suitable species are prioritized.";
  }

  if (scores.biodiversity_restoration_score >= 50) {
    return "Moderate biodiversity benefit through native enrichment, tree regeneration and avoided further degradation.";
  }

  return "Limited biodiversity signal from the current data; validate locally before making biodiversity claims.";
}

function buildLivelihoodBenefit(site: ProcessedSite, scores: ComponentScores) {
  if (scores.livelihood_score >= 75) {
    return `High livelihood benefit because livelihood need is ${site.social_feasibility.livelihood_need_score}/100 and the area can support household-relevant restoration options.`;
  }

  if (scores.livelihood_score >= 50) {
    return "Moderate livelihood benefit; field teams should confirm which restoration products communities value most.";
  }

  return "Lower direct livelihood signal; benefits may depend on watershed protection or biodiversity rather than household production.";
}

function buildWaterSoilBenefit(site: ProcessedSite, scores: ComponentScores) {
  if (scores.erosion_water_score >= 75) {
    return `High erosion-control and water-resilience relevance because erosion risk is ${site.terrain.erosion_risk_score}/100 and watershed relevance is ${site.terrain.watershed_restoration_relevance}.`;
  }

  if (scores.erosion_water_score >= 50) {
    return "Moderate water and soil benefit; restoration should include basic soil conservation where slopes or runoff are visible.";
  }

  return "Lower watershed signal; water/soil benefits should be validated before being emphasized.";
}

function label(score: number) {
  if (score >= 75) {
    return "High";
  }

  if (score >= 50) {
    return "Medium";
  }

  return "Low";
}
