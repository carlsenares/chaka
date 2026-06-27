import { RESTORATION_KNOWLEDGE_BASE_SNIPPETS } from "@/chatbot/prompts/knowledgeBase";
import type { ExplainableChatContext } from "@/chatbot/types";

type AreaInput = {
  id: string;
  name: string;
  zone: string;
  weightedRank: number;
  priorityScore: number;
  confidence: string;
  intervention: string;
  scores: {
    biodiversity: number;
    carbon: number;
    water: number;
    livelihoods: number;
    soil?: number;
    forestLoss?: number;
  };
  rationale: string[];
  risks?: string[];
  evidenceStatus?: string;
  pcode?: string;
};

type PriorityResultInput = {
  pcode: string;
  priority_score: number;
  biodiversity_score: number;
  carbon_score: number;
  water_score: number;
  livelihood_score: number;
  rationale: string;
  confidence: string;
  evidence: string;
};

export function buildExplainableChatContext({
  selectedRankedArea,
  rankedCandidateAreas,
  priorityResults,
  dataSourceMode,
  objectiveWeights,
  backendSampleOutput,
}: {
  selectedRankedArea: AreaInput;
  rankedCandidateAreas: AreaInput[];
  priorityResults: PriorityResultInput[];
  dataSourceMode: "demo" | "backend";
  objectiveWeights: ExplainableChatContext["objectiveWeights"];
  backendSampleOutput: ExplainableChatContext["backendSampleOutput"];
}): ExplainableChatContext {
  return {
    selectedRankedArea,
    rankedCandidateAreas,
    priorityResults,
    dataSourceMode,
    objectiveWeights,
    backendSampleOutput,
    knowledgeBaseSnippets: [...RESTORATION_KNOWLEDGE_BASE_SNIPPETS],
  };
}
