import type {
  EvidenceCriticObject,
  ProjectBriefObject,
  RecommendationObject,
  SiteFeature,
} from "@/reasoning/types";

export function createProjectBrief(
  feature: SiteFeature,
  recommendation: RecommendationObject,
  critic: EvidenceCriticObject,
): ProjectBriefObject {
  return {
    site_id: feature.site_id,
    title: `${recommendation.recommended_intervention} Opportunity in ${feature.woreda}, ${feature.zone}`,
    one_sentence_summary: `${feature.woreda} is promising for ${recommendation.recommended_intervention} because it combines ${recommendation.livelihood_benefit} livelihood relevance, ${recommendation.carbon_potential} carbon potential, and ${feature.land_cover_primary.replaceAll("_", " ")} land cover context.`,
    recommended_actions: [
      "Run community field validation",
      "Assess land tenure and grazing pressure",
      "Confirm locally suitable native and livelihood tree species",
      "Prepare a small pilot intervention before carbon project development",
    ],
    expected_benefits: {
      climate: benefitSentence(
        recommendation.carbon_potential,
        "vegetation recovery and future carbon storage",
      ),
      biodiversity: benefitSentence(
        recommendation.biodiversity_benefit,
        "native restoration value if species selection follows local ecology",
      ),
      livelihood: benefitSentence(
        recommendation.livelihood_benefit,
        "household benefit through agroforestry, fodder, fruit, fuelwood, or soil restoration",
      ),
      water_soil: benefitSentence(
        recommendation.water_soil_benefit,
        "soil and water resilience if slope and runoff risks are addressed",
      ),
    },
    data_evidence: [
      "Sentinel-2 vegetation signal",
      "CHIRPS rainfall suitability",
      "ESA WorldCover land-cover class",
      "WorldPop population pressure",
      "SRTM slope proxy",
    ],
    risks: recommendation.risk_flags,
    next_steps: [
      "Field visit",
      "Community consultation",
      "Species validation",
      "Pilot design",
    ],
    disclaimer: critic.must_show_disclaimer
      ? critic.recommended_disclaimer
      : undefined,
  };
}

function benefitSentence(level: string, benefit: string) {
  const prefix =
    level === "high" ? "High potential for" : level === "medium" ? "Moderate potential for" : "Limited current signal for";

  return `${prefix} ${benefit}, subject to field validation.`;
}
