export type PatrickAdmin = {
  region: string;
  zone: string;
  woreda: string;
};

export type PatrickRestorationContext = {
  atlas_priority: string;
  suggested_restoration_options: string[];
};

export type PatrickLandCover = {
  dominant_class: string;
  secondary_class: string;
  tree_cover_percentage: number;
  built_up_percentage: number;
  suitable_for_fmnr_agroforestry: boolean;
};

export type PatrickVegetation = {
  ndvi_mean: number;
  vegetation_condition: string;
  vegetation_trend_10yr: string;
  degradation_signal: string;
};

export type PatrickForestChange = {
  tree_cover_loss_score: number;
  tree_cover_gain_score: number;
  canopy_height_class: string;
};

export type PatrickRainfall = {
  annual_rainfall_mm: number;
  rainfall_reliability_score: number;
  drought_risk: string;
};

export type PatrickTerrain = {
  mean_slope_degrees: number;
  erosion_risk_score: number;
  watershed_restoration_relevance: string;
};

export type PatrickSoil = {
  soil_organic_carbon_score: number;
  soil_suitability_score: number;
  soil_ph: number;
};

export type PatrickSocialFeasibility = {
  population_pressure_score: number;
  livelihood_need_score: number;
  settlement_overlap: boolean;
  road_access_score: number;
};

export type PatrickSafeguards = {
  protected_area_overlap: boolean;
  safeguard_level: string;
};

export type PatrickSpeciesSuitability = {
  suitability_score: number;
  recommended_species_groups: string[];
};

export type PatrickSiteInput = {
  site_id: string;
  admin: PatrickAdmin;
  restoration_context: PatrickRestorationContext;
  land_cover: PatrickLandCover;
  vegetation: PatrickVegetation;
  forest_change: PatrickForestChange;
  rainfall: PatrickRainfall;
  terrain: PatrickTerrain;
  soil: PatrickSoil;
  social_feasibility: PatrickSocialFeasibility;
  safeguards: PatrickSafeguards;
  species_suitability: PatrickSpeciesSuitability;
};

export type ProcessedSite = PatrickSiteInput;

export type ScoreLabel = "Low" | "Medium" | "High";
export type CanonicalScoreLabel = "low" | "medium" | "high";
export type RiskLevel = "Low" | "Medium" | "High";
export type CanonicalRiskLevel = "low" | "medium" | "high";
export type InterventionCode =
  | "fmnr_agroforestry"
  | "assisted_natural_regeneration"
  | "riparian_restoration"
  | "native_tree_planting"
  | "erosion_control_exclosures"
  | "field_validation_before_investment";
export type PredictionQuality =
  | "expert_labeled"
  | "atlas_labeled"
  | "weak_supervised_demo"
  | "rule_based_fallback";

export type SiteFeature = {
  site_id: string;
  region: string;
  zone: string;
  woreda: string;
  area_ha: number;
  land_cover_primary: string;
  land_cover_mix: {
    tree_cover: number;
    cropland: number;
    grassland: number;
    built_up: number;
    water: number;
    other: number;
  };
  ndvi_current: number | null;
  ndvi_trend_5y: number | null;
  evi_current: number | null;
  forest_loss_score: number | null;
  rainfall_mean_mm: number | null;
  rainfall_reliability_score: number | null;
  slope_mean_deg: number | null;
  slope_risk_score: number | null;
  soil_organic_carbon_score: number | null;
  soil_ph_suitability_score: number | null;
  population_pressure_score: number | null;
  road_access_score: number | null;
  settlement_proximity_score: number | null;
  protected_area_overlap_pct: number | null;
  safeguard_risk_score: number | null;
  data_quality_score: number | null;
  field_validation_required: boolean;
  feature_version: string;
};

export type ModelPrediction = {
  site_id: string;
  model_version: string;
  priority_score: number;
  carbon_potential: CanonicalScoreLabel;
  biodiversity_benefit: CanonicalScoreLabel;
  livelihood_benefit: CanonicalScoreLabel;
  water_soil_benefit: CanonicalScoreLabel;
  implementation_feasibility: CanonicalScoreLabel;
  risk_level: CanonicalRiskLevel;
  recommended_intervention_seed: InterventionCode;
  top_feature_contributions: Array<{
    feature: keyof SiteFeature | string;
    direction: "positive" | "negative";
    weight: number;
  }>;
  prediction_quality: PredictionQuality;
};

export type ComponentScores = {
  carbon_potential_score: number;
  biodiversity_restoration_score: number;
  livelihood_score: number;
  erosion_water_score: number;
  feasibility_score: number;
  species_suitability_score: number;
  risk_penalty: number;
  final_priority_score: number;
};

export type RiskAssessment = {
  risk_level: RiskLevel;
  risk_score: number;
  risk_penalty: number;
  risk_flags: string[];
  field_validation_questions: string[];
};

export type InterventionRecommendation = {
  recommended_intervention: string;
  confidence: ScoreLabel;
  matched_rules: string[];
  rationale: string[];
  recommended_actions: string[];
};

export type RestorationCase = {
  case_id: string;
  country: string;
  region: string;
  climate_zone: string;
  annual_rainfall_range_mm: [number, number];
  land_cover: string;
  intervention_type: string;
  community_context: string;
  governance_tenure_context: string;
  outcome: "Successful" | "Mixed" | "Unsuccessful";
  reason_for_outcome: string;
  lesson: string;
  relevance_to_ethiopia: string;
};

export type SimilarCaseMatch = Omit<RestorationCase, "case_id"> & {
  case_id?: string;
  intervention?: string;
  similarity_score: number;
  match_reasons?: string[];
  matched_dimensions?: string[];
  why_relevant?: string;
};

export type SimilarCasesObject = {
  site_id: string;
  similar_cases: Array<{
    case_id: string;
    title: string;
    location: string;
    intervention: string;
    similarity_score: number;
    why_similar: string[];
    lesson: string;
    source: "manual_demo_case" | "case_corpus" | "cifor_icraf_context";
  }>;
};

export type Explanation = {
  summary: string;
  main_reasons: string[];
  why_this_area: string;
  why_this_intervention: string;
  expected_benefits: {
    climate: string;
    biodiversity: string;
    livelihood: string;
    water_soil: string;
  };
  risks_to_check: string[];
  field_validation_next_steps: string[];
};

export type ProjectBrief = {
  title: string;
  summary: string;
  recommended_actions: string[];
  expected_benefits: Explanation["expected_benefits"];
  risks_to_check: string[];
  next_steps: string[];
};

export type RecommendationObject = {
  site_id: string;
  rank?: number;
  priority_score: number;
  recommended_intervention: string;
  intervention_code: InterventionCode;
  carbon_potential: CanonicalScoreLabel;
  biodiversity_benefit: CanonicalScoreLabel;
  livelihood_benefit: CanonicalScoreLabel;
  water_soil_benefit: CanonicalScoreLabel;
  implementation_feasibility: CanonicalScoreLabel;
  risk_level: CanonicalRiskLevel;
  main_reasons: string[];
  risk_flags: string[];
  field_validation_questions: string[];
  evidence_refs: string[];
};

export type EvidenceCriticObject = {
  site_id: string;
  support_level:
    | "supported"
    | "supported_with_validation_needed"
    | "weak"
    | "unsupported";
  unsupported_claims: string[];
  weak_claims: Array<{
    claim: string;
    reason: string;
  }>;
  must_show_disclaimer: boolean;
  recommended_disclaimer: string;
};

export type ProjectBriefObject = {
  site_id: string;
  title: string;
  one_sentence_summary: string;
  recommended_actions: string[];
  expected_benefits: {
    climate: string;
    biodiversity: string;
    livelihood: string;
    water_soil: string;
  };
  data_evidence: string[];
  risks: string[];
  next_steps: string[];
  disclaimer?: string;
};

export type SiteListResponse = {
  region: string;
  generated_at: string;
  sites: Array<{
    site_id: string;
    name: string;
    rank: number;
    priority_score: number;
    recommended_intervention: string;
    risk_level: CanonicalRiskLevel;
    carbon_potential: CanonicalScoreLabel;
    livelihood_benefit: CanonicalScoreLabel;
    data_quality_score: number | null;
    geometry: {
      type: "Polygon";
      coordinates: unknown[];
    };
  }>;
};

export type SiteDetailResponse = {
  site_features: SiteFeature;
  model_prediction: ModelPrediction;
  recommendation: RecommendationObject;
  critic: EvidenceCriticObject;
  similar_cases: SimilarCasesObject["similar_cases"];
};

export type RecommendationResult = {
  site_id: string;
  rank?: number;
  admin: ProcessedSite["admin"];
  source_site: ProcessedSite;
  component_scores: ComponentScores;
  final_priority_score: number;
  recommended_intervention: string;
  intervention_confidence: ScoreLabel;
  intervention_rationale: string[];
  carbon_potential: ScoreLabel;
  biodiversity_restoration_value: ScoreLabel;
  livelihood_benefit: ScoreLabel;
  erosion_water_benefit: ScoreLabel;
  feasibility: ScoreLabel;
  risk_level: RiskLevel;
  risk_flags: string[];
  field_validation_questions: string[];
  main_reasons: string[];
  explanation: Explanation;
  similar_cases: SimilarCaseMatch[];
  project_brief: ProjectBrief;
};
