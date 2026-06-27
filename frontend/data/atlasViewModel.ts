import { portfolioMetrics as mockPortfolioMetrics, regions as mockRegions, restorationAreas } from "@/mockData";
import mockPriorityResults from "@/mock_priority_results.json";
import type { PriorityResult } from "@/mapRenderer";
import backendBrief from "../../agents/sample_outputs/SWE-001.brief.json";
import backendCritic from "../../agents/sample_outputs/SWE-001.critic.json";
import backendRecommendation from "../../agents/sample_outputs/SWE-001.recommendation.json";
import backendSiteDetail from "../../api/sample_responses/site_detail_SWE-001.json";
import backendSites from "../../api/sample_responses/sites.json";

export type DataSourceMode = "demo" | "backend";

export type ObjectiveKey = "biodiversity" | "carbon" | "water" | "livelihood";
export type ObjectiveWeights = Record<ObjectiveKey, number>;

export type RegionViewModel = {
  id: string;
  name: string;
  description: string;
  signal: string;
  stats: {
    watersheds: number;
    forestLoss: string;
    households: string;
  };
};

export type RestorationAreaViewModel = {
  id: string;
  regionId: string;
  name: string;
  zone: string;
  rank: number;
  score: number;
  confidence: string;
  hectares: string;
  households: string;
  intervention: string;
  timeline: string;
  investment: string;
  tags: string[];
  scores: {
    biodiversity: number;
    carbon: number;
    water: number;
    soil: number;
    livelihoods: number;
    forestLoss: number;
  };
  rationale: string[];
  risks: string[];
  outputs: string[];
  evidenceStatus: string;
  fieldValidationQuestions: string[];
  decisionSummary?: string;
  recommendedActions?: string[];
  nextSteps?: string[];
  disclaimer?: string;
  pcode?: string;
};

export type RankedAreaViewModel = RestorationAreaViewModel & {
  priorityScore: number;
  weightedRank: number;
};

export type AtlasViewModel = {
  mode: DataSourceMode;
  sourceName: string;
  sourceBadge: string;
  sourceBadgeTone: "green" | "blue";
  prototypeNotice: string;
  dashboardDataLabel: string;
  dashboardDescription: (weights: ObjectiveWeights) => string;
  weightsAffectScores: boolean;
  regions: RegionViewModel[];
  areas: RestorationAreaViewModel[];
  portfolioMetrics: typeof mockPortfolioMetrics;
  priorityResults: PriorityResult[];
};

type BenefitLabel = "low" | "medium" | "high";

type BackendSite = {
  site_id: string;
  name: string;
  rank: number;
  priority_score: number;
  recommended_intervention: string;
  risk_level: BenefitLabel;
  carbon_potential: BenefitLabel;
  livelihood_benefit: BenefitLabel;
  data_quality_score: number;
};

const backendSiteToPcode: Record<string, string> = {
  "SET-010": "ET0802",
  "SWE-009": "ET1106",
  "SWE-001": "ET1103",
  "SWE-004": "ET1104",
  "SWE-003": "ET1101",
  "SWE-002": "ET1102",
  "SET-007": "ET0803",
  "SET-008": "ET0812",
  "SET-005": "ET0801",
  "SWE-006": "ET1105",
};

const demoAreaToPcode: Record<string, string> = {
  "chebera-churchura-buffer": "ET1104",
  "basketo-slope-mosaic": "ET0804",
  "gamo-highland-springs": "ET0802",
  "maji-bench-forest-edge": "ET1103",
  "kafa-biosphere-corridor": "ET1102",
  "sheka-wet-forest-buffer": "ET1101",
};

export const demoAtlasViewModel: AtlasViewModel = {
  mode: "demo",
  sourceName: "Demo (Mock Data)",
  sourceBadge: "Mock Dataset",
  sourceBadgeTone: "green",
  prototypeNotice:
    "Prototype data only. Rankings, impact values, and map overlays are mock outputs designed to be replaced by live ingestion and agent pipelines.",
  dashboardDataLabel: "Prototype data",
  dashboardDescription: (weights) =>
    `Priority scores are recomputed from mock data using the current objective weights: biodiversity ${weights.biodiversity}, carbon ${weights.carbon}, water ${weights.water}, livelihood ${weights.livelihood}.`,
  weightsAffectScores: true,
  regions: mockRegions,
  areas: (restorationAreas as RestorationAreaViewModel[]).map((area) => ({
    ...area,
    pcode: demoAreaToPcode[area.id],
  })),
  portfolioMetrics: mockPortfolioMetrics,
  priorityResults: mockPriorityResults as PriorityResult[],
};

export const backendPreviewAtlasViewModel: AtlasViewModel = {
  mode: "backend",
  sourceName: "Backend Preview",
  sourceBadge: "Backend Pipeline Output",
  sourceBadgeTone: "blue",
  prototypeNotice:
    "Backend Preview uses committed sample outputs from the AI pipeline. Missing production fields are shown with graceful placeholders.",
  dashboardDataLabel: "Pipeline sample",
  dashboardDescription: () =>
    "Priority scores and rankings are rendered from backend sample outputs. Slider values are shown as the future request payload for live prioritization.",
  weightsAffectScores: false,
  regions: buildBackendRegions(),
  areas: buildBackendAreas(),
  portfolioMetrics: {
    estimatedCarbon: "Backend sample",
    waterBenefit: "Validation pending",
    livelihoodReach: "Pipeline scored",
    restorationPotential: "Site-level preview",
  },
  priorityResults: buildBackendPriorityResults(),
};

export const atlasViewModels: Record<DataSourceMode, AtlasViewModel> = {
  demo: demoAtlasViewModel,
  backend: backendPreviewAtlasViewModel,
};

export function calculatePriorityScore(area: RestorationAreaViewModel, weights: ObjectiveWeights) {
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);

  if (totalWeight === 0) {
    return 0;
  }

  const weightedTotal =
    area.scores.biodiversity * weights.biodiversity +
    area.scores.carbon * weights.carbon +
    area.scores.water * weights.water +
    area.scores.livelihoods * weights.livelihood;

  return Math.round(weightedTotal / totalWeight);
}

export function rankAreas(
  areas: RestorationAreaViewModel[],
  weights: ObjectiveWeights,
  weightsAffectScores: boolean,
) {
  return areas
    .map((area) => ({
      ...area,
      priorityScore: weightsAffectScores ? calculatePriorityScore(area, weights) : area.score,
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore || a.rank - b.rank)
    .map((area, index) => ({ ...area, weightedRank: index + 1 }));
}

function buildBackendRegions(): RegionViewModel[] {
  const sites = (backendSites.sites ?? []) as BackendSite[];
  const southCount = sites.filter((site) => site.site_id.startsWith("SET")).length;
  const southwestCount = sites.filter((site) => site.site_id.startsWith("SWE")).length;

  return mockRegions.map((region) => {
    const isSouthwest = region.id === "southwest-ethiopia";
    const count = isSouthwest ? southwestCount : southCount;

    return {
      ...region,
      stats: {
        watersheds: count,
        forestLoss: "From sample features",
        households: "Validation pending",
      },
      signal: isSouthwest
        ? "Backend sample includes ranked Southwest Ethiopia candidate sites"
        : "Backend sample includes ranked South Ethiopia candidate sites",
    };
  });
}

function buildBackendAreas(): RestorationAreaViewModel[] {
  const sites = (backendSites.sites ?? []) as BackendSite[];

  return sites.map((site) => {
    const detailed = site.site_id === backendRecommendation.site_id;
    const detail = detailed ? backendSiteDetail : null;
    const recommendation = detailed ? backendRecommendation : null;
    const critic = detailed ? backendCritic : null;
    const brief = detailed ? backendBrief : null;
    const features = detail?.site_features;
    const modelPrediction = detail?.model_prediction;
    const zone = features?.zone ?? getFallbackZone(site.site_id);
    const woreda = features?.woreda ?? site.name;
    const pcode = backendSiteToPcode[site.site_id];
    const biodiversityScore = benefitToScore(recommendation?.biodiversity_benefit ?? modelPrediction?.biodiversity_benefit);
    const carbonScore = benefitToScore(site.carbon_potential);
    const waterScore = benefitToScore(recommendation?.water_soil_benefit ?? modelPrediction?.water_soil_benefit);
    const livelihoodScore = benefitToScore(site.livelihood_benefit);

    return {
      id: site.site_id,
      regionId: site.site_id.startsWith("SWE") ? "southwest-ethiopia" : "south-ethiopia",
      name: site.name,
      zone: [zone, woreda].filter(Boolean).join(" / "),
      rank: site.rank,
      score: site.priority_score,
      confidence: toConfidenceLabel(critic?.support_level, site.data_quality_score),
      hectares: features?.area_ha ? `${Math.round(features.area_ha).toLocaleString()} ha` : "Area pending",
      households: "Field validation pending",
      intervention: recommendation?.recommended_intervention ?? site.recommended_intervention,
      timeline: "Pilot timeline pending",
      investment: "Budget pending",
      tags: [
        labelTag(site.carbon_potential, "carbon"),
        labelTag(site.livelihood_benefit, "livelihood"),
        `${site.risk_level} risk`,
      ],
      scores: {
        biodiversity: biodiversityScore,
        carbon: carbonScore,
        water: waterScore,
        soil: features?.slope_risk_score ?? waterScore,
        livelihoods: livelihoodScore,
        forestLoss: features?.forest_loss_score ?? site.priority_score,
      },
      rationale:
        recommendation?.main_reasons ??
        [
          `${site.name} is ranked #${site.rank} by the backend sample output.`,
          `${site.recommended_intervention} is the recommended intervention from the pipeline response.`,
          `Carbon potential is ${site.carbon_potential}, livelihood benefit is ${site.livelihood_benefit}, and risk level is ${site.risk_level}.`,
        ],
      risks: recommendation?.risk_flags ?? [`Risk level: ${site.risk_level}`],
      outputs:
        brief?.recommended_actions ??
        [
          site.recommended_intervention,
          "Field validation before investment",
          "Prepare implementation plan after local review",
        ],
      evidenceStatus:
        critic?.recommended_disclaimer ??
        `Backend sample data quality score: ${site.data_quality_score}/100. Detailed evidence refs are pending for this site.`,
      fieldValidationQuestions: recommendation?.field_validation_questions ?? [
        "Confirm land tenure and current land use.",
        "Validate community willingness and implementation feasibility.",
      ],
      decisionSummary: brief?.one_sentence_summary,
      recommendedActions: brief?.recommended_actions,
      nextSteps: brief?.next_steps,
      disclaimer: brief?.disclaimer,
      pcode,
    };
  });
}

function buildBackendPriorityResults(): PriorityResult[] {
  const areas = buildBackendAreas();
  const usedPcodes = new Set<string>();

  // TODO: Replace this site_id -> PCODE bridge when GET /prioritization or
  // GET /pipeline/latest returns admin identifiers directly.
  return areas.flatMap((area) => {
    if (!area.pcode || usedPcodes.has(area.pcode)) return [];
    usedPcodes.add(area.pcode);

    return [
      {
        admin_level: 2,
        pcode: area.pcode,
        priority_score: area.score,
        priority_level: toPriorityLevel(area.score),
        biodiversity_score: area.scores.biodiversity,
        carbon_score: area.scores.carbon,
        water_score: area.scores.water,
        livelihood_score: area.scores.livelihoods,
        estimated_restoration_opportunity: area.hectares,
        rationale: area.rationale[0] ?? "Backend sample recommendation is available for this administrative unit.",
        confidence: area.confidence,
        evidence: area.evidenceStatus,
      },
    ];
  });
}

function benefitToScore(label?: string) {
  if (label === "high") return 86;
  if (label === "medium") return 64;
  if (label === "low") return 38;
  return 50;
}

function toPriorityLevel(score: number): PriorityResult["priority_level"] {
  if (score >= 75) return "Highest";
  if (score >= 65) return "High";
  if (score >= 50) return "Medium";
  return "Lower";
}

function toConfidenceLabel(supportLevel: string | undefined, dataQualityScore: number) {
  if (supportLevel === "supported") return "High";
  if (supportLevel === "supported_with_validation_needed") return "Validation needed";
  if (supportLevel === "weak") return "Weak";
  if (supportLevel === "unsupported") return "Unsupported";
  if (dataQualityScore >= 75) return "Medium-high";
  if (dataQualityScore >= 65) return "Medium";
  return "Low";
}

function labelTag(label: BenefitLabel, subject: string) {
  return `${label[0].toUpperCase()}${label.slice(1)} ${subject}`;
}

function getFallbackZone(siteId: string) {
  if (siteId.startsWith("SWE")) return "Southwest Ethiopia";
  if (siteId.startsWith("SET")) return "South Ethiopia";
  return "Ethiopia";
}
