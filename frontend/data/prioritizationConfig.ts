import type { ObjectiveKey, ObjectiveWeights } from "@/data/atlasViewModel";

export const defaultObjectiveWeights: ObjectiveWeights = {
  biodiversity: 90,
  carbon: 75,
  water: 85,
  livelihood: 80,
};

export const objectives: Array<{
  key: ObjectiveKey;
  label: string;
  description: string;
  backendField: string;
}> = [
  {
    key: "biodiversity",
    label: "Biodiversity",
    description: "Habitat connectivity, species value, and ecological uplift.",
    backendField: "biodiversity_weight",
  },
  {
    key: "carbon",
    label: "Carbon Storage",
    description: "Above-ground biomass recovery and long-term sequestration potential.",
    backendField: "carbon_weight",
  },
  {
    key: "water",
    label: "Water Security",
    description: "Watershed regulation, spring protection, and downstream water benefits.",
    backendField: "water_weight",
  },
  {
    key: "livelihood",
    label: "Livelihood Impact",
    description: "Household benefit, implementation feasibility, and community value.",
    backendField: "livelihood_weight",
  },
];

export const scoreLabels = {
  biodiversity: "Biodiversity uplift",
  carbon: "Carbon storage potential",
  water: "Water impact",
  soil: "Soil stability",
  livelihoods: "Livelihood benefit",
  forestLoss: "Forest-loss risk",
};

export function toBackendWeights(weights: ObjectiveWeights) {
  return Object.fromEntries(objectives.map((objective) => [objective.backendField, weights[objective.key]]));
}
