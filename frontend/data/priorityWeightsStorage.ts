import type { ObjectiveWeights } from "@/data/atlasViewModel";
import { defaultObjectiveWeights, objectives } from "@/data/prioritizationConfig";

export const PRIORITY_WEIGHTS_STORAGE_KEY = "chaka.priorityWeights";

export function readStoredPriorityWeights(): ObjectiveWeights {
  if (typeof window === "undefined") return defaultObjectiveWeights;

  try {
    const stored = window.localStorage.getItem(PRIORITY_WEIGHTS_STORAGE_KEY);
    if (!stored) return defaultObjectiveWeights;

    return normalizePriorityWeights(JSON.parse(stored));
  } catch {
    return defaultObjectiveWeights;
  }
}

export function writeStoredPriorityWeights(weights: ObjectiveWeights) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(PRIORITY_WEIGHTS_STORAGE_KEY, JSON.stringify(normalizePriorityWeights(weights)));
}

export function normalizePriorityWeights(value: unknown): ObjectiveWeights {
  const candidate = typeof value === "object" && value !== null ? (value as Partial<Record<keyof ObjectiveWeights, unknown>>) : {};

  return objectives.reduce(
    (weights, objective) => ({
      ...weights,
      [objective.key]: normalizeWeight(candidate[objective.key], defaultObjectiveWeights[objective.key]),
    }),
    {} as ObjectiveWeights,
  );
}

function normalizeWeight(value: unknown, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;

  return Math.max(0, Math.min(100, Math.round(value)));
}
