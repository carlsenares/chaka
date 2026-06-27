export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type ChatArea = {
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

export type ChatPriorityResult = {
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

export type ExplainableChatContext = {
  selectedRankedArea: ChatArea;
  rankedCandidateAreas: ChatArea[];
  priorityResults: ChatPriorityResult[];
  dataSourceMode: "demo" | "backend";
  objectiveWeights: {
    biodiversity: number;
    carbon: number;
    water: number;
    livelihood: number;
  };
  backendSampleOutput: {
    sourceName: string;
    sourceBadge: string;
    dashboardDataLabel: string;
  };
  knowledgeBaseSnippets: string[];
};

export type ExplainableChatRequest = {
  message: string;
  context: ExplainableChatContext;
};
