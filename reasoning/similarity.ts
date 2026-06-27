import { restorationCases } from "@/reasoning/cases";
import type {
  InterventionRecommendation,
  ProcessedSite,
  RecommendationObject,
  RestorationCase,
  SimilarCaseMatch,
  SimilarCasesObject,
  SiteFeature,
} from "@/reasoning/types";

export function findSimilarCases(
  site: ProcessedSite,
  intervention: InterventionRecommendation,
  limit = 3,
): SimilarCaseMatch[] {
  return restorationCases
    .map((restorationCase) => scoreCase(site, intervention, restorationCase))
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);
}

export function findCanonicalSimilarCases(
  feature: SiteFeature,
  recommendation: RecommendationObject,
  limit = 3,
): SimilarCasesObject {
  const matches = restorationCases
    .map((restorationCase) =>
      scoreCanonicalCase(feature, recommendation, restorationCase),
    )
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);

  return {
    site_id: feature.site_id,
    similar_cases: matches,
  };
}

function scoreCase(
  site: ProcessedSite,
  intervention: InterventionRecommendation,
  restorationCase: RestorationCase,
): SimilarCaseMatch {
  const matchedDimensions: string[] = [];
  let score = 0;

  if (rainfallMatches(site, restorationCase)) {
    score += 18;
    matchedDimensions.push("rainfall similarity");
  } else {
    score += rainfallNearness(site, restorationCase);
  }

  if (climateMatches(site, restorationCase)) {
    score += 14;
    matchedDimensions.push("climate similarity");
  }

  if (landCoverMatches(site, restorationCase)) {
    score += 16;
    matchedDimensions.push("land-cover similarity");
  }

  if (interventionMatches(intervention, restorationCase)) {
    score += 20;
    matchedDimensions.push("intervention similarity");
  }

  if (communityMatches(site, restorationCase)) {
    score += 12;
    matchedDimensions.push("livelihood/community similarity");
  }

  if (governanceMatches(site, restorationCase)) {
    score += 10;
    matchedDimensions.push("governance/tenure similarity");
  }

  if (restorationCase.country.toLowerCase() === "ethiopia") {
    score += 10;
    matchedDimensions.push("country/regional similarity");
  } else if (isEastAfrica(restorationCase.country)) {
    score += 6;
    matchedDimensions.push("regional similarity");
  }

  const similarityScore = Math.min(1, score / 100);

  return {
    ...restorationCase,
    similarity_score: Number(similarityScore.toFixed(2)),
    matched_dimensions: matchedDimensions,
    why_relevant: buildWhyRelevant(matchedDimensions, restorationCase),
  };
}

function rainfallMatches(site: ProcessedSite, restorationCase: RestorationCase) {
  const [min, max] = restorationCase.annual_rainfall_range_mm;
  return (
    site.rainfall.annual_rainfall_mm >= min &&
    site.rainfall.annual_rainfall_mm <= max
  );
}

function rainfallNearness(site: ProcessedSite, restorationCase: RestorationCase) {
  const [min, max] = restorationCase.annual_rainfall_range_mm;
  const rainfall = site.rainfall.annual_rainfall_mm;
  const distance = rainfall < min ? min - rainfall : rainfall - max;

  if (distance <= 150) {
    return 10;
  }

  if (distance <= 300) {
    return 6;
  }

  return 0;
}

function climateMatches(site: ProcessedSite, restorationCase: RestorationCase) {
  const rainfall = site.rainfall.annual_rainfall_mm;
  const climate = restorationCase.climate_zone.toLowerCase();

  if (rainfall >= 1000 && climate.includes("humid")) {
    return true;
  }

  if (rainfall < 800 && climate.includes("dry")) {
    return true;
  }

  if (rainfall >= 800 && rainfall < 1100 && climate.includes("sub-humid")) {
    return true;
  }

  return false;
}

function landCoverMatches(site: ProcessedSite, restorationCase: RestorationCase) {
  const siteCover =
    `${site.land_cover.dominant_class} ${site.land_cover.secondary_class}`.toLowerCase();
  const caseCover = restorationCase.land_cover.toLowerCase();

  return siteCover
    .split(/[_\s]+/)
    .filter((token) => token.length > 3)
    .some((token) => caseCover.includes(token));
}

function interventionMatches(
  intervention: InterventionRecommendation,
  restorationCase: RestorationCase,
) {
  const recommended = intervention.recommended_intervention.toLowerCase();
  const caseIntervention = restorationCase.intervention_type.toLowerCase();

  return recommended
    .split(/[+\s]+/)
    .filter((token) => token.length > 3)
    .some((token) => caseIntervention.includes(token));
}

function communityMatches(site: ProcessedSite, restorationCase: RestorationCase) {
  const community = restorationCase.community_context.toLowerCase();

  if (
    site.social_feasibility.livelihood_need_score >= 75 &&
    community.includes("livelihood")
  ) {
    return true;
  }

  if (
    site.social_feasibility.population_pressure_score >= 75 &&
    community.includes("population")
  ) {
    return true;
  }

  if (
    site.social_feasibility.population_pressure_score >= 70 &&
    community.includes("fuelwood")
  ) {
    return true;
  }

  return false;
}

function governanceMatches(site: ProcessedSite, restorationCase: RestorationCase) {
  const governance = restorationCase.governance_tenure_context.toLowerCase();

  if (site.safeguards.protected_area_overlap) {
    return governance.includes("protected");
  }

  if (site.social_feasibility.settlement_overlap) {
    return governance.includes("private") || governance.includes("customary");
  }

  if (site.social_feasibility.population_pressure_score >= 70) {
    return governance.includes("customary") || governance.includes("farm");
  }

  return governance.includes("community");
}

function isEastAfrica(country: string) {
  return ["kenya", "tanzania", "uganda", "rwanda"].includes(
    country.toLowerCase(),
  );
}

function buildWhyRelevant(
  matchedDimensions: string[],
  restorationCase: RestorationCase,
) {
  if (!matchedDimensions.length) {
    return `Useful as a weak reference case: ${restorationCase.lesson}`;
  }

  return `Matched on ${matchedDimensions.join(", ")}. Lesson: ${
    restorationCase.lesson
  }`;
}

function scoreCanonicalCase(
  feature: SiteFeature,
  recommendation: RecommendationObject,
  restorationCase: RestorationCase,
): SimilarCasesObject["similar_cases"][number] {
  const whySimilar: string[] = [];
  let score = 0;

  const [minRainfall, maxRainfall] = restorationCase.annual_rainfall_range_mm;
  const rainfall = feature.rainfall_mean_mm ?? 0;
  if (rainfall >= minRainfall && rainfall <= maxRainfall) {
    score += 0.18;
    whySimilar.push("rainfall suitability");
  }

  if (canonicalLandCoverMatches(feature, restorationCase)) {
    score += 0.18;
    whySimilar.push(feature.land_cover_primary.replaceAll("_", " "));
  }

  if (
    restorationCase.intervention_type
      .toLowerCase()
      .includes(recommendation.recommended_intervention.toLowerCase().split(" ")[0])
  ) {
    score += 0.22;
    whySimilar.push("recommended intervention");
  }

  if ((feature.population_pressure_score ?? 0) >= 70) {
    score += 0.12;
    whySimilar.push("livelihood pressure");
  }

  if ((feature.safeguard_risk_score ?? 0) >= 60) {
    score += restorationCase.governance_tenure_context
      .toLowerCase()
      .includes("protected")
      ? 0.14
      : 0;
    if (
      restorationCase.governance_tenure_context
        .toLowerCase()
        .includes("protected")
    ) {
      whySimilar.push("governance/safeguard context");
    }
  }

  if (restorationCase.country.toLowerCase() === "ethiopia") {
    score += 0.12;
    whySimilar.push("country/regional similarity");
  } else if (isEastAfrica(restorationCase.country)) {
    score += 0.06;
    whySimilar.push("regional similarity");
  }

  return {
    case_id: restorationCase.case_id,
    title: `${restorationCase.intervention_type} in ${restorationCase.region}`,
    location: `${restorationCase.region}, ${restorationCase.country}`,
    intervention: restorationCase.intervention_type,
    similarity_score: Number(Math.min(1, score).toFixed(2)),
    why_similar: whySimilar.length ? whySimilar : ["manual demo case"],
    lesson: restorationCase.lesson,
    source: "manual_demo_case",
  };
}

function canonicalLandCoverMatches(
  feature: SiteFeature,
  restorationCase: RestorationCase,
) {
  const caseCover = restorationCase.land_cover.toLowerCase();

  return feature.land_cover_primary
    .split("_")
    .filter((token) => token.length > 3)
    .some((token) => caseCover.includes(token));
}
