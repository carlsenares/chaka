import { sampleSites } from "@/reasoning/sample-sites";
import { generateExplanation } from "@/reasoning/explanations";
import { classifyIntervention } from "@/reasoning/interventions";
import { calculateScores } from "@/reasoning/scoring";
import { findSimilarCases } from "@/reasoning/similarity";
import { detectRisks } from "@/reasoning/risks";
import type { ProcessedSite, RecommendationResult } from "@/reasoning/types";

export function generateRecommendation(site: ProcessedSite): RecommendationResult {
  const scores = calculateScores(site);
  const risk = detectRisks(site);
  const intervention = classifyIntervention(site, scores, risk);
  const similarCases = findSimilarCases(site, intervention);
  const explanation = generateExplanation(
    site,
    scores,
    intervention,
    risk,
    similarCases,
  );

  return {
    site_id: site.site_id,
    admin: site.admin,
    source_site: site,
    component_scores: scores,
    final_priority_score: scores.final_priority_score,
    recommended_intervention: intervention.recommended_intervention,
    intervention_confidence: intervention.confidence,
    intervention_rationale: intervention.rationale,
    carbon_potential: labelScore(scores.carbon_potential_score),
    biodiversity_restoration_value: labelScore(
      scores.biodiversity_restoration_score,
    ),
    livelihood_benefit: labelScore(scores.livelihood_score),
    erosion_water_benefit: labelScore(scores.erosion_water_score),
    feasibility: labelScore(scores.feasibility_score),
    risk_level: risk.risk_level,
    risk_flags: risk.risk_flags,
    field_validation_questions: risk.field_validation_questions,
    main_reasons: explanation.main_reasons,
    explanation,
    similar_cases: similarCases,
    project_brief: {
      title: `${intervention.recommended_intervention} opportunity in ${site.admin.woreda}, ${site.admin.zone}`,
      summary: explanation.summary,
      recommended_actions: intervention.recommended_actions,
      expected_benefits: explanation.expected_benefits,
      risks_to_check: explanation.risks_to_check,
      next_steps: explanation.field_validation_next_steps,
    },
  };
}

export function rankRecommendations(
  sites: ProcessedSite[] = sampleSites,
): RecommendationResult[] {
  return sites
    .map(generateRecommendation)
    .sort((a, b) => b.final_priority_score - a.final_priority_score)
    .map((recommendation, index) => ({
      ...recommendation,
      rank: index + 1,
    }));
}

function labelScore(score: number): "Low" | "Medium" | "High" {
  if (score >= 75) {
    return "High";
  }

  if (score >= 50) {
    return "Medium";
  }

  return "Low";
}
