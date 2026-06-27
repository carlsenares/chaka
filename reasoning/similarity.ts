import { restorationCases } from "@/reasoning/cases";
import type {
  InterventionRecommendation,
  ProcessedSite,
  RestorationCase,
  SimilarCaseMatch,
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
