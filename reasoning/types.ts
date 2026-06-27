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
export type RiskLevel = "Low" | "Medium" | "High";

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
