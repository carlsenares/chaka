import type { RestorationCase } from "@/reasoning/types";

export const restorationCases: RestorationCase[] = [
  {
    case_id: "CASE-001",
    country: "Ethiopia",
    region: "Tigray",
    climate_zone: "semi-arid highland",
    annual_rainfall_range_mm: [450, 750],
    land_cover: "degraded hillside and cropland mosaic",
    intervention_type: "Assisted natural regeneration + soil and water conservation",
    community_context: "high livelihood need, grazing pressure, community watershed committees",
    governance_tenure_context: "communal hillsides with locally negotiated exclosures",
    outcome: "Successful",
    reason_for_outcome:
      "Area exclosures and soil bunds improved vegetation recovery where community rules were enforced.",
    lesson:
      "ANR works best on degraded slopes when restoration is paired with erosion control and agreed grazing rules.",
    relevance_to_ethiopia:
      "Strong relevance for Ethiopian highland watersheds where erosion and grazing pressure drive degradation.",
  },
  {
    case_id: "CASE-002",
    country: "Niger",
    region: "Maradi",
    climate_zone: "dryland agro-pastoral",
    annual_rainfall_range_mm: [350, 650],
    land_cover: "cropland tree mosaic",
    intervention_type: "FMNR + agroforestry",
    community_context: "smallholder farming, fuelwood pressure, high livelihood dependence on farms",
    governance_tenure_context: "tree tenure rules clarified with farmers",
    outcome: "Successful",
    reason_for_outcome:
      "Farmers protected naturally regenerating trees once tree-use rights were clearer.",
    lesson:
      "FMNR adoption depends on farmer incentives, pruning knowledge and clear rights to tree products.",
    relevance_to_ethiopia:
      "Useful analogue for cropland restoration where farmers can manage existing rootstock and scattered trees.",
  },
  {
    case_id: "CASE-003",
    country: "Kenya",
    region: "Makueni",
    climate_zone: "semi-arid smallholder",
    annual_rainfall_range_mm: [500, 900],
    land_cover: "cropland and settlement mosaic",
    intervention_type: "FMNR + agroforestry",
    community_context: "high household livelihood need, water stress, demand for fruit and fodder",
    governance_tenure_context: "private and family-managed farms",
    outcome: "Mixed",
    reason_for_outcome:
      "Agroforestry benefits were strongest where households had water access and clear farm boundaries.",
    lesson:
      "Avoid blanket recommendations near settlements; validate household willingness and water constraints first.",
    relevance_to_ethiopia:
      "Relevant for densely used cropland where agroforestry must fit household land-use decisions.",
  },
  {
    case_id: "CASE-004",
    country: "Rwanda",
    region: "Western Province",
    climate_zone: "humid highland",
    annual_rainfall_range_mm: [1100, 1600],
    land_cover: "steep cropland watershed",
    intervention_type: "Assisted natural regeneration + soil and water conservation",
    community_context: "dense rural population, erosion risk, farm productivity pressure",
    governance_tenure_context: "mixed private farms and government watershed programs",
    outcome: "Successful",
    reason_for_outcome:
      "Terracing, contour planting and community maintenance reduced erosion on steep slopes.",
    lesson:
      "Watershed restoration should bundle vegetation recovery with physical soil conservation on steep farms.",
    relevance_to_ethiopia:
      "Relevant for high-rainfall Ethiopian zones with steep cultivated slopes and erosion risk.",
  },
  {
    case_id: "CASE-005",
    country: "Ethiopia",
    region: "Oromia",
    climate_zone: "humid forest edge",
    annual_rainfall_range_mm: [1000, 1500],
    land_cover: "degraded forest edge",
    intervention_type: "Native tree restoration",
    community_context: "forest-edge communities, fuelwood pressure, biodiversity concerns",
    governance_tenure_context: "community forest management with local bylaws",
    outcome: "Successful",
    reason_for_outcome:
      "Native species restoration was more durable when communities co-managed forest use rules.",
    lesson:
      "Forest-edge restoration needs native species, benefit sharing and clear rules against renewed clearing.",
    relevance_to_ethiopia:
      "Directly relevant for Ethiopian forest-edge landscapes with canopy loss and restoration potential.",
  },
  {
    case_id: "CASE-006",
    country: "Tanzania",
    region: "Uluguru Mountains",
    climate_zone: "humid montane",
    annual_rainfall_range_mm: [1200, 2000],
    land_cover: "riparian and degraded watershed",
    intervention_type: "Riparian and watershed restoration",
    community_context: "downstream water users, farm-edge buffers, erosion concerns",
    governance_tenure_context: "watershed committees and protected buffer rules",
    outcome: "Successful",
    reason_for_outcome:
      "Riparian buffers improved when rules protected stream banks from cultivation and grazing.",
    lesson:
      "Riparian restoration requires clear buffer boundaries, community enforcement and water-user benefits.",
    relevance_to_ethiopia:
      "Relevant for wet Ethiopian watersheds where water regulation is a core restoration benefit.",
  },
  {
    case_id: "CASE-007",
    country: "Uganda",
    region: "Mount Elgon",
    climate_zone: "humid highland",
    annual_rainfall_range_mm: [1000, 1800],
    land_cover: "protected forest buffer",
    intervention_type: "Safeguard review + native species restoration if permitted",
    community_context: "park-adjacent communities and cultivated buffer areas",
    governance_tenure_context: "protected-area authority approval required",
    outcome: "Mixed",
    reason_for_outcome:
      "Restoration was constrained when protected-area rules and local land-use expectations conflicted.",
    lesson:
      "Protected-area overlap should trigger safeguard review before implementation claims are made.",
    relevance_to_ethiopia:
      "Relevant where candidate sites overlap protected forests or sensitive biodiversity areas.",
  },
  {
    case_id: "CASE-008",
    country: "Malawi",
    region: "Shire Highlands",
    climate_zone: "sub-humid smallholder",
    annual_rainfall_range_mm: [800, 1200],
    land_cover: "cropland and watershed mosaic",
    intervention_type: "FMNR + agroforestry",
    community_context: "high population pressure and demand for fuelwood and soil fertility",
    governance_tenure_context: "customary land with village-level agreements",
    outcome: "Mixed",
    reason_for_outcome:
      "Tree survival improved where villages aligned species choice with fodder, fuelwood and soil goals.",
    lesson:
      "Livelihood species selection can make agroforestry more acceptable than carbon-only planting.",
    relevance_to_ethiopia:
      "Relevant for high-livelihood-need sites where household benefits are essential for adoption.",
  },
];
