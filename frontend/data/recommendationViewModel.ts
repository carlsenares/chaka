import {
  atlasViewModels,
  rankAreas,
  type DataSourceMode,
  type ObjectiveWeights,
  type RankedAreaViewModel,
} from "@/data/atlasViewModel";
import { defaultObjectiveWeights } from "@/data/prioritizationConfig";
import type { PriorityResult } from "@/mapRenderer";

export function getRecommendationWorkspace(
  dataSourceMode: DataSourceMode,
  objectiveWeights: ObjectiveWeights = defaultObjectiveWeights,
) {
  const viewModel = atlasViewModels[dataSourceMode];
  const rankedAreas = rankAreas(viewModel.areas, objectiveWeights, viewModel.weightsAffectScores);
  const priorityResults = buildPriorityResultsForAreas(viewModel.priorityResults, rankedAreas);

  return {
    viewModel,
    rankedAreas,
    priorityResults,
  };
}

export function findRecommendationArea(areas: RankedAreaViewModel[], areaId: string) {
  return areas.find((area) => area.id === areaId || area.pcode === areaId);
}

export function buildPriorityResultsForAreas(priorityResults: PriorityResult[], areas: RankedAreaViewModel[]) {
  const resultsByPcode = new Map(priorityResults.map((result) => [result.pcode, result]));

  return areas.flatMap((area) => {
    if (!area.pcode) return [];

    const existingResult = resultsByPcode.get(area.pcode);

    return [
      {
        admin_level: existingResult?.admin_level ?? 2,
        pcode: area.pcode,
        priority_score: area.priorityScore,
        priority_level: toPriorityLevel(area.priorityScore),
        biodiversity_score: area.scores.biodiversity,
        carbon_score: area.scores.carbon,
        water_score: area.scores.water,
        livelihood_score: area.scores.livelihoods,
        estimated_restoration_opportunity: area.hectares,
        rationale:
          area.rationale[0] ??
          existingResult?.rationale ??
          "Recommendation rationale will be populated by the prioritization pipeline.",
        confidence: area.confidence,
        evidence: area.evidenceStatus,
      },
    ] satisfies PriorityResult[];
  });
}

export function toPriorityLevel(score: number): PriorityResult["priority_level"] {
  if (score >= 75) return "Highest";
  if (score >= 65) return "High";
  if (score >= 50) return "Medium";
  return "Lower";
}
