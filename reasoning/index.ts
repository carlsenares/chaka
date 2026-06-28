import { sampleSites } from "@/reasoning/sample-sites";
import { createProjectBrief } from "@/reasoning/brief";
import { createEvidenceCritic } from "@/reasoning/critic";
import { generateExplanation } from "@/reasoning/explanations";
import { classifyIntervention } from "@/reasoning/interventions";
import { getCandidateSite } from "@/reasoning/candidate-sites";
import {
  getPredictionForFeature,
  getSiteFeature,
  getSiteFeatures,
} from "@/reasoning/predictions";
import { createRecommendationObject } from "@/reasoning/recommendation";
import { calculateScores } from "@/reasoning/scoring";
import {
  findCanonicalSimilarCases,
  findSimilarCases,
} from "@/reasoning/similarity";
import { detectRisks } from "@/reasoning/risks";
import type {
  ProcessedSite,
  RecommendationResult,
  SiteDetailResponse,
  SiteFeature,
  SiteListResponse,
} from "@/reasoning/types";

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

export function generateSiteDetail(
  feature: SiteFeature,
  rank?: number,
): SiteDetailResponse {
  const candidateSite = getCandidateSite(feature.site_id);
  const prediction = getPredictionForFeature(feature);
  const recommendation = createRecommendationObject(feature, prediction, rank);
  const similarCases = findCanonicalSimilarCases(feature, recommendation);
  const firstPassCritic = createEvidenceCritic(
    feature,
    prediction,
    recommendation,
  );
  const brief = createProjectBrief(feature, recommendation, firstPassCritic);
  const critic = createEvidenceCritic(feature, prediction, recommendation, brief);

  return {
    site_features: feature,
    candidate: candidateSite?.properties ?? null,
    geometry: candidateSite?.geometry ?? null,
    model_prediction: prediction,
    recommendation,
    critic,
    similar_cases: similarCases.similar_cases,
  };
}

export function rankSiteDetails(features: SiteFeature[] = getSiteFeatures()) {
  return features
    .map((feature) => {
      const prediction = getPredictionForFeature(feature);
      return { feature, prediction };
    })
    .sort((a, b) => b.prediction.priority_score - a.prediction.priority_score)
    .map(({ feature }, index) => generateSiteDetail(feature, index + 1));
}

export function getCanonicalSiteDetail(siteId: string) {
  const ranked = rankSiteDetails();
  return (
    ranked.find((detail) => detail.site_features.site_id === siteId) ??
    (getSiteFeature(siteId) ? generateSiteDetail(getSiteFeature(siteId)!) : null)
  );
}

export function getSiteListResponse(region?: string): SiteListResponse {
  const ranked = rankSiteDetails(
    region
      ? getSiteFeatures().filter((feature) => feature.region === region)
      : getSiteFeatures(),
  );

  return {
    region: region ?? "All demo regions",
    generated_at: new Date().toISOString(),
    sites: ranked.map((detail, index) => {
      const candidateSite = getCandidateSite(detail.site_features.site_id);

      return {
        site_id: detail.site_features.site_id,
        name: candidateSite?.properties.name ?? detail.site_features.woreda,
        rank: index + 1,
        priority_score: detail.recommendation.priority_score,
        recommended_intervention: detail.recommendation.recommended_intervention,
        risk_level: detail.recommendation.risk_level,
        carbon_potential: detail.recommendation.carbon_potential,
        livelihood_benefit: detail.recommendation.livelihood_benefit,
        data_quality_score: detail.site_features.data_quality_score,
        candidate: candidateSite?.properties ?? null,
        geometry: candidateSite?.geometry ?? null,
      };
    }),
  };
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
