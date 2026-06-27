import type { ProcessedSite } from "@/reasoning/types";

export const sampleSites: ProcessedSite[] = [
  {
    site_id: "SW-001",
    admin: {
      region: "Southwest Ethiopia Peoples' Region",
      zone: "Bench Sheko",
      woreda: "Example Woreda",
    },
    restoration_context: {
      atlas_priority: "high",
      suggested_restoration_options: [
        "agroforestry",
        "assisted natural regeneration",
        "soil and water conservation",
      ],
    },
    land_cover: {
      dominant_class: "cropland",
      secondary_class: "tree_cover_mosaic",
      tree_cover_percentage: 18,
      built_up_percentage: 4,
      suitable_for_fmnr_agroforestry: true,
    },
    vegetation: {
      ndvi_mean: 0.43,
      vegetation_condition: "moderate",
      vegetation_trend_10yr: "declining",
      degradation_signal: "medium",
    },
    forest_change: {
      tree_cover_loss_score: 76,
      tree_cover_gain_score: 22,
      canopy_height_class: "low",
    },
    rainfall: {
      annual_rainfall_mm: 1120,
      rainfall_reliability_score: 78,
      drought_risk: "medium",
    },
    terrain: {
      mean_slope_degrees: 18,
      erosion_risk_score: 82,
      watershed_restoration_relevance: "high",
    },
    soil: {
      soil_organic_carbon_score: 67,
      soil_suitability_score: 72,
      soil_ph: 6.3,
    },
    social_feasibility: {
      population_pressure_score: 78,
      livelihood_need_score: 82,
      settlement_overlap: false,
      road_access_score: 69,
    },
    safeguards: {
      protected_area_overlap: false,
      safeguard_level: "low",
    },
    species_suitability: {
      suitability_score: 74,
      recommended_species_groups: [
        "native restoration species",
        "agroforestry species",
        "fodder species",
      ],
    },
  },
  {
    site_id: "SW-002",
    admin: {
      region: "Southwest Ethiopia Peoples' Region",
      zone: "Keffa",
      woreda: "Hillside Woreda",
    },
    restoration_context: {
      atlas_priority: "high",
      suggested_restoration_options: [
        "assisted natural regeneration",
        "soil and water conservation",
      ],
    },
    land_cover: {
      dominant_class: "shrubland",
      secondary_class: "grassland",
      tree_cover_percentage: 9,
      built_up_percentage: 2,
      suitable_for_fmnr_agroforestry: false,
    },
    vegetation: {
      ndvi_mean: 0.31,
      vegetation_condition: "poor",
      vegetation_trend_10yr: "declining",
      degradation_signal: "high",
    },
    forest_change: {
      tree_cover_loss_score: 68,
      tree_cover_gain_score: 18,
      canopy_height_class: "low",
    },
    rainfall: {
      annual_rainfall_mm: 980,
      rainfall_reliability_score: 70,
      drought_risk: "medium",
    },
    terrain: {
      mean_slope_degrees: 27,
      erosion_risk_score: 91,
      watershed_restoration_relevance: "high",
    },
    soil: {
      soil_organic_carbon_score: 58,
      soil_suitability_score: 64,
      soil_ph: 6.1,
    },
    social_feasibility: {
      population_pressure_score: 54,
      livelihood_need_score: 63,
      settlement_overlap: false,
      road_access_score: 47,
    },
    safeguards: {
      protected_area_overlap: false,
      safeguard_level: "medium",
    },
    species_suitability: {
      suitability_score: 66,
      recommended_species_groups: ["native restoration species"],
    },
  },
  {
    site_id: "SW-003",
    admin: {
      region: "Southwest Ethiopia Peoples' Region",
      zone: "Sheka",
      woreda: "River Buffer Woreda",
    },
    restoration_context: {
      atlas_priority: "medium",
      suggested_restoration_options: [
        "riparian restoration",
        "assisted natural regeneration",
      ],
    },
    land_cover: {
      dominant_class: "grassland",
      secondary_class: "riparian_degraded",
      tree_cover_percentage: 14,
      built_up_percentage: 1,
      suitable_for_fmnr_agroforestry: false,
    },
    vegetation: {
      ndvi_mean: 0.39,
      vegetation_condition: "moderate",
      vegetation_trend_10yr: "stable",
      degradation_signal: "medium",
    },
    forest_change: {
      tree_cover_loss_score: 48,
      tree_cover_gain_score: 28,
      canopy_height_class: "low",
    },
    rainfall: {
      annual_rainfall_mm: 1350,
      rainfall_reliability_score: 83,
      drought_risk: "low",
    },
    terrain: {
      mean_slope_degrees: 9,
      erosion_risk_score: 74,
      watershed_restoration_relevance: "high",
    },
    soil: {
      soil_organic_carbon_score: 71,
      soil_suitability_score: 79,
      soil_ph: 6.5,
    },
    social_feasibility: {
      population_pressure_score: 51,
      livelihood_need_score: 62,
      settlement_overlap: false,
      road_access_score: 61,
    },
    safeguards: {
      protected_area_overlap: false,
      safeguard_level: "low",
    },
    species_suitability: {
      suitability_score: 82,
      recommended_species_groups: [
        "native restoration species",
        "riparian species",
      ],
    },
  },
  {
    site_id: "SW-004",
    admin: {
      region: "Southwest Ethiopia Peoples' Region",
      zone: "Dawro",
      woreda: "Forest Edge Woreda",
    },
    restoration_context: {
      atlas_priority: "high",
      suggested_restoration_options: [
        "native tree restoration",
        "assisted natural regeneration",
      ],
    },
    land_cover: {
      dominant_class: "degraded_forest",
      secondary_class: "shrubland",
      tree_cover_percentage: 24,
      built_up_percentage: 1,
      suitable_for_fmnr_agroforestry: false,
    },
    vegetation: {
      ndvi_mean: 0.36,
      vegetation_condition: "moderate",
      vegetation_trend_10yr: "declining",
      degradation_signal: "high",
    },
    forest_change: {
      tree_cover_loss_score: 92,
      tree_cover_gain_score: 11,
      canopy_height_class: "medium",
    },
    rainfall: {
      annual_rainfall_mm: 1210,
      rainfall_reliability_score: 80,
      drought_risk: "low",
    },
    terrain: {
      mean_slope_degrees: 14,
      erosion_risk_score: 68,
      watershed_restoration_relevance: "medium",
    },
    soil: {
      soil_organic_carbon_score: 76,
      soil_suitability_score: 73,
      soil_ph: 6.2,
    },
    social_feasibility: {
      population_pressure_score: 49,
      livelihood_need_score: 57,
      settlement_overlap: false,
      road_access_score: 58,
    },
    safeguards: {
      protected_area_overlap: false,
      safeguard_level: "medium",
    },
    species_suitability: {
      suitability_score: 79,
      recommended_species_groups: ["native restoration species"],
    },
  },
  {
    site_id: "SW-005",
    admin: {
      region: "South Ethiopia Region",
      zone: "Gamo",
      woreda: "Settlement Edge Woreda",
    },
    restoration_context: {
      atlas_priority: "medium",
      suggested_restoration_options: ["agroforestry"],
    },
    land_cover: {
      dominant_class: "cropland",
      secondary_class: "built_up_mosaic",
      tree_cover_percentage: 11,
      built_up_percentage: 18,
      suitable_for_fmnr_agroforestry: true,
    },
    vegetation: {
      ndvi_mean: 0.35,
      vegetation_condition: "moderate",
      vegetation_trend_10yr: "stable",
      degradation_signal: "medium",
    },
    forest_change: {
      tree_cover_loss_score: 41,
      tree_cover_gain_score: 19,
      canopy_height_class: "low",
    },
    rainfall: {
      annual_rainfall_mm: 900,
      rainfall_reliability_score: 63,
      drought_risk: "medium",
    },
    terrain: {
      mean_slope_degrees: 8,
      erosion_risk_score: 52,
      watershed_restoration_relevance: "medium",
    },
    soil: {
      soil_organic_carbon_score: 52,
      soil_suitability_score: 61,
      soil_ph: 6.8,
    },
    social_feasibility: {
      population_pressure_score: 89,
      livelihood_need_score: 86,
      settlement_overlap: true,
      road_access_score: 82,
    },
    safeguards: {
      protected_area_overlap: false,
      safeguard_level: "medium",
    },
    species_suitability: {
      suitability_score: 68,
      recommended_species_groups: [
        "agroforestry species",
        "fodder species",
        "fruit species",
      ],
    },
  },
  {
    site_id: "SW-006",
    admin: {
      region: "Southwest Ethiopia Peoples' Region",
      zone: "Sheka",
      woreda: "Protected Buffer Woreda",
    },
    restoration_context: {
      atlas_priority: "high",
      suggested_restoration_options: ["native tree restoration"],
    },
    land_cover: {
      dominant_class: "forest",
      secondary_class: "degraded_forest_edge",
      tree_cover_percentage: 42,
      built_up_percentage: 0,
      suitable_for_fmnr_agroforestry: false,
    },
    vegetation: {
      ndvi_mean: 0.55,
      vegetation_condition: "good",
      vegetation_trend_10yr: "declining",
      degradation_signal: "medium",
    },
    forest_change: {
      tree_cover_loss_score: 64,
      tree_cover_gain_score: 31,
      canopy_height_class: "medium",
    },
    rainfall: {
      annual_rainfall_mm: 1480,
      rainfall_reliability_score: 87,
      drought_risk: "low",
    },
    terrain: {
      mean_slope_degrees: 16,
      erosion_risk_score: 66,
      watershed_restoration_relevance: "high",
    },
    soil: {
      soil_organic_carbon_score: 83,
      soil_suitability_score: 81,
      soil_ph: 5.9,
    },
    social_feasibility: {
      population_pressure_score: 34,
      livelihood_need_score: 45,
      settlement_overlap: false,
      road_access_score: 39,
    },
    safeguards: {
      protected_area_overlap: true,
      safeguard_level: "high",
    },
    species_suitability: {
      suitability_score: 88,
      recommended_species_groups: ["native restoration species"],
    },
  },
  {
    site_id: "SW-007",
    admin: {
      region: "South Ethiopia Region",
      zone: "Wolayita",
      woreda: "Carbon Candidate Woreda",
    },
    restoration_context: {
      atlas_priority: "high",
      suggested_restoration_options: [
        "native tree restoration",
        "agroforestry",
      ],
    },
    land_cover: {
      dominant_class: "shrubland",
      secondary_class: "cropland_mosaic",
      tree_cover_percentage: 8,
      built_up_percentage: 3,
      suitable_for_fmnr_agroforestry: true,
    },
    vegetation: {
      ndvi_mean: 0.29,
      vegetation_condition: "poor",
      vegetation_trend_10yr: "declining",
      degradation_signal: "high",
    },
    forest_change: {
      tree_cover_loss_score: 84,
      tree_cover_gain_score: 9,
      canopy_height_class: "low",
    },
    rainfall: {
      annual_rainfall_mm: 1040,
      rainfall_reliability_score: 72,
      drought_risk: "medium",
    },
    terrain: {
      mean_slope_degrees: 22,
      erosion_risk_score: 84,
      watershed_restoration_relevance: "high",
    },
    soil: {
      soil_organic_carbon_score: 86,
      soil_suitability_score: 75,
      soil_ph: 6.4,
    },
    social_feasibility: {
      population_pressure_score: 72,
      livelihood_need_score: 80,
      settlement_overlap: false,
      road_access_score: 28,
    },
    safeguards: {
      protected_area_overlap: false,
      safeguard_level: "medium",
    },
    species_suitability: {
      suitability_score: 77,
      recommended_species_groups: [
        "native restoration species",
        "agroforestry species",
      ],
    },
  },
  {
    site_id: "SW-008",
    admin: {
      region: "South Ethiopia Region",
      zone: "Konso",
      woreda: "Dryland Woreda",
    },
    restoration_context: {
      atlas_priority: "medium",
      suggested_restoration_options: [
        "soil and water conservation",
        "dryland agroforestry",
      ],
    },
    land_cover: {
      dominant_class: "grassland",
      secondary_class: "bare_sparse_vegetation",
      tree_cover_percentage: 5,
      built_up_percentage: 2,
      suitable_for_fmnr_agroforestry: false,
    },
    vegetation: {
      ndvi_mean: 0.22,
      vegetation_condition: "poor",
      vegetation_trend_10yr: "declining",
      degradation_signal: "high",
    },
    forest_change: {
      tree_cover_loss_score: 35,
      tree_cover_gain_score: 8,
      canopy_height_class: "low",
    },
    rainfall: {
      annual_rainfall_mm: 620,
      rainfall_reliability_score: 42,
      drought_risk: "high",
    },
    terrain: {
      mean_slope_degrees: 19,
      erosion_risk_score: 77,
      watershed_restoration_relevance: "high",
    },
    soil: {
      soil_organic_carbon_score: 38,
      soil_suitability_score: 45,
      soil_ph: 7.4,
    },
    social_feasibility: {
      population_pressure_score: 61,
      livelihood_need_score: 74,
      settlement_overlap: false,
      road_access_score: 55,
    },
    safeguards: {
      protected_area_overlap: false,
      safeguard_level: "low",
    },
    species_suitability: {
      suitability_score: 49,
      recommended_species_groups: ["drought tolerant species", "fodder species"],
    },
  },
  {
    site_id: "SW-009",
    admin: {
      region: "Southwest Ethiopia Peoples' Region",
      zone: "Bench Sheko",
      woreda: "Agroforestry Woreda",
    },
    restoration_context: {
      atlas_priority: "high",
      suggested_restoration_options: [
        "agroforestry",
        "farmer managed natural regeneration",
      ],
    },
    land_cover: {
      dominant_class: "cropland",
      secondary_class: "tree_cover_mosaic",
      tree_cover_percentage: 23,
      built_up_percentage: 3,
      suitable_for_fmnr_agroforestry: true,
    },
    vegetation: {
      ndvi_mean: 0.48,
      vegetation_condition: "moderate",
      vegetation_trend_10yr: "stable",
      degradation_signal: "medium",
    },
    forest_change: {
      tree_cover_loss_score: 55,
      tree_cover_gain_score: 33,
      canopy_height_class: "low",
    },
    rainfall: {
      annual_rainfall_mm: 1180,
      rainfall_reliability_score: 84,
      drought_risk: "low",
    },
    terrain: {
      mean_slope_degrees: 11,
      erosion_risk_score: 61,
      watershed_restoration_relevance: "medium",
    },
    soil: {
      soil_organic_carbon_score: 69,
      soil_suitability_score: 76,
      soil_ph: 6.6,
    },
    social_feasibility: {
      population_pressure_score: 83,
      livelihood_need_score: 88,
      settlement_overlap: false,
      road_access_score: 78,
    },
    safeguards: {
      protected_area_overlap: false,
      safeguard_level: "low",
    },
    species_suitability: {
      suitability_score: 81,
      recommended_species_groups: [
        "agroforestry species",
        "fodder species",
        "fruit species",
      ],
    },
  },
  {
    site_id: "SW-010",
    admin: {
      region: "South Ethiopia Region",
      zone: "Gedeo",
      woreda: "Watershed Woreda",
    },
    restoration_context: {
      atlas_priority: "high",
      suggested_restoration_options: [
        "soil and water conservation",
        "assisted natural regeneration",
      ],
    },
    land_cover: {
      dominant_class: "cropland",
      secondary_class: "steep_slope_mosaic",
      tree_cover_percentage: 16,
      built_up_percentage: 5,
      suitable_for_fmnr_agroforestry: true,
    },
    vegetation: {
      ndvi_mean: 0.41,
      vegetation_condition: "moderate",
      vegetation_trend_10yr: "declining",
      degradation_signal: "medium",
    },
    forest_change: {
      tree_cover_loss_score: 62,
      tree_cover_gain_score: 21,
      canopy_height_class: "low",
    },
    rainfall: {
      annual_rainfall_mm: 1260,
      rainfall_reliability_score: 79,
      drought_risk: "low",
    },
    terrain: {
      mean_slope_degrees: 24,
      erosion_risk_score: 89,
      watershed_restoration_relevance: "high",
    },
    soil: {
      soil_organic_carbon_score: 64,
      soil_suitability_score: 71,
      soil_ph: 6.0,
    },
    social_feasibility: {
      population_pressure_score: 76,
      livelihood_need_score: 84,
      settlement_overlap: false,
      road_access_score: 64,
    },
    safeguards: {
      protected_area_overlap: false,
      safeguard_level: "low",
    },
    species_suitability: {
      suitability_score: 73,
      recommended_species_groups: [
        "native restoration species",
        "agroforestry species",
        "fodder species",
      ],
    },
  },
];
