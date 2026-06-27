"use client";

import { useEffect, useState } from "react";
import type { ObjectiveKey, ObjectiveWeights } from "@/data/atlasViewModel";
import { defaultObjectiveWeights } from "@/data/prioritizationConfig";
import {
  PRIORITY_WEIGHTS_STORAGE_KEY,
  readStoredPriorityWeights,
  writeStoredPriorityWeights,
} from "@/data/priorityWeightsStorage";

export function usePriorityWeights() {
  const [objectiveWeights, setObjectiveWeightsState] = useState<ObjectiveWeights>(defaultObjectiveWeights);

  useEffect(() => {
    setObjectiveWeightsState(readStoredPriorityWeights());

    function syncFromStorage(event: StorageEvent) {
      if (event.key === PRIORITY_WEIGHTS_STORAGE_KEY) {
        setObjectiveWeightsState(readStoredPriorityWeights());
      }
    }

    window.addEventListener("storage", syncFromStorage);

    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  function setObjectiveWeights(weights: ObjectiveWeights) {
    writeStoredPriorityWeights(weights);
    setObjectiveWeightsState(weights);
  }

  function updateObjectiveWeight(key: ObjectiveKey, value: number) {
    setObjectiveWeightsState((current) => ({ ...current, [key]: value }));
  }

  function resetObjectiveWeights() {
    setObjectiveWeights(defaultObjectiveWeights);
  }

  return {
    objectiveWeights,
    setObjectiveWeights,
    updateObjectiveWeight,
    resetObjectiveWeights,
  };
}
