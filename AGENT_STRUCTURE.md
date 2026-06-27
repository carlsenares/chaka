# Agent Structure and Integration Plan

This document is the build contract for the three parallel workstreams:

- Patrick: data ingestion, geospatial processing, feature extraction, lightweight model training.
- Chirag: reasoning layer, agent orchestration, recommendation logic, evidence checks, brief generation.
- Julia: frontend, product flow, map/list/detail screens, stakeholder demo.

The goal is to let each person build independently, then connect with minimal rewriting. If a field, file, endpoint, or output shape is not in this document, treat it as optional until the team agrees to add it.

## 1. Product Goal

Build a hackathon MVP for Menschen fuer Menschen that helps restoration planners prioritize geographic areas in Ethiopia by combined impact on:

- biodiversity improvement,
- carbon storage potential,
- water and soil resilience,
- livelihood benefit,
- implementation feasibility,
- safeguard and field-validation risk.

The demo workflow is:

```text
Select region -> see ranked restoration candidate areas -> click area -> see why it ranks highly -> see recommended intervention -> generate project brief
```

The system must be evidence-grounded. Numeric scores come from geospatial data and transparent scoring or a lightweight model. LLM agents explain, check, and package the results; they do not invent geospatial facts.

## 2. Final Architecture

```text
                             Frontend
             Next.js dashboard, map, ranked list, project brief
                                  |
                                  | HTTP/JSON
                                  v
                         Frontend Adapter API
                stable endpoints for sites, scores, details, briefs
                                  |
                                  v
                       Reasoning Orchestrator
        recommendation agent + critic agent + brief agent + RAG context
                                  |
                    reads feature table and model outputs
                                  |
                                  v
        Data Layer and Model Layer owned by Patrick
        ingestion -> geospatial feature extraction -> suitability ranker
                                  |
                                  v
                     AWS/S3 artifact storage
        raw data metadata, processed GeoJSON, CSV features, model artifact
```

Recommended implementation rule:

- Data pipeline can run offline or as a script and publish static artifacts.
- Reasoning layer can read static JSON/CSV artifacts first.
- Frontend can use static sample responses first.
- Live API integration happens only after each artifact contract is stable.

## 3. Source Data Matrix and What It Means For Models

The `datamatrix.docx` lists these data families. They are not one uniform model input; they require different processing strategies.

| Data family | Type | Primary use | Model implication |
| --- | --- | --- | --- |
| HDX/OCHA Ethiopia Admin 0-3 | Vector polygons | AOI selection, region/zone/woreda aggregation | No ML. Spatial joins and canonical IDs. |
| Ethiopia restoration atlas | Map/context layer | Restoration option context and weak supervision | Use for rules or weak labels if classes are available. |
| Sentinel-2 | Optical raster time series, 10-20m | NDVI/EVI, vegetation health, bare soil, degradation | Feature extraction first; optional geospatial embeddings. |
| Landsat Collection 2 | Optical raster time series, 30m | long-term vegetation trend and baseline | Trend features; useful for additionality and recovery/degradation history. |
| Sentinel-1 SAR | Radar raster time series, around 10m | cloud-resistant structure/moisture proxy | Add simple VV/VH statistics only if time allows. |
| ESA WorldCover | Categorical raster, 10m | land-cover masks and intervention rules | Deterministic class proportions per site. |
| GFW/UMD forest change | Raster layers | tree-cover loss/gain/canopy context | Numeric degradation and forest-pressure features. |
| CHIRPS rainfall | Climate time series, 0.05 degree | rainfall suitability and drought risk | Coarse suitability feature; do not over-weight. |
| SRTM DEM | Elevation raster, 30m | slope, elevation, erosion proxy | Deterministic slope/elevation features. |
| SoilGrids | Soil rasters, 250m | SOC, pH, texture, water-related soil indicators | Coarse suitability feature plus uncertainty note. |
| WDPA | Protected-area vector polygons | safeguards and exclusion/risk flags | Binary/overlap feature and risk flag. |
| WorldPop/GHSL/OSM/HOTOSM | Population, settlement, roads vectors/rasters | livelihood pressure and feasibility | Density/proximity features. |
| CIFOR-ICRAF species atlas | Species/context knowledge | species suggestions and climate suitability context | RAG/context layer; do not overclaim numeric precision. |

Key decision:

The main trained model should be a lightweight tabular/geospatial ranker trained on extracted features, not a satellite foundation model trained from scratch.

## 4. Agent and Component List

This project has agents and non-agent engines. Do not call every script an agent. The distinction matters for credibility.

| Component | Type | Owner | Primary output |
| --- | --- | --- | --- |
| Dataset Registry Agent | LLM-assisted data agent | Patrick | `data/dataset_inventory.md`, `data/catalog/datasets.json` |
| AOI Boundary Builder | deterministic geospatial script | Patrick | `data/processed/aoi_boundaries.geojson` |
| Candidate Site Generator | deterministic geospatial script | Patrick | `data/processed/candidate_sites.geojson` |
| Feature Extraction Engine | deterministic geospatial script | Patrick | `data/features/site_features.csv`, `data/features/site_features.json` |
| Weak Labeling and Training Agent | data/model component | Patrick | `models/suitability_ranker.pkl`, `models/model_report.md` |
| Geospatial Embedding Agent | optional ML component | Patrick or Chirag | `data/features/site_embeddings.parquet` |
| Reasoning Orchestrator | agent controller | Chirag | calls other reasoning agents |
| Recommendation Agent | LLM agent | Chirag | recommendation object |
| Evidence Critic Agent | LLM agent | Chirag | evidence audit object |
| Similar Cases RAG Agent | retrieval + LLM agent | Chirag | similar cases object |
| Project Brief Agent | LLM agent | Chirag | project brief object |
| Frontend Adapter API | application API | Chirag + Julia | stable JSON endpoints |
| Demo Frontend | UI | Julia | dashboard and demo flow |

## 5. Shared IDs and Naming

Every layer must use the same `site_id`.

Format:

```text
<REGION_CODE>-<THREE_DIGIT_NUMBER>
```

Examples:

- `SWE-001` for Southwest Ethiopia.
- `SET-001` for South Ethiopia.

Do not use row index as ID. Do not change IDs after the first integration.

## 6. Shared Folder Structure

Create these folders as work begins:

```text
data/
  raw/
  catalog/
  processed/
  geojson/
  features/
  samples/

models/
  artifacts/
  reports/
  schemas/

agents/
  prompts/
  schemas/
  sample_inputs/
  sample_outputs/

api/
  contracts/
  sample_responses/

docs/
  data_quality.md
  model_report.md
  integration_checklist.md
```

Ownership:

- Patrick owns `data/` and `models/`.
- Chirag owns `agents/` and `api/contracts/`.
- Julia owns frontend screens and can read `api/sample_responses/`.
- Shared docs are edited carefully and reviewed before changing contracts.

## 7. Canonical Data Contracts

### 7.1 Site Geometry Object

File:

```text
data/processed/candidate_sites.geojson
```

GeoJSON feature properties:

```json
{
  "site_id": "SWE-001",
  "name": "Candidate Area 1",
  "region": "Southwest Ethiopia Peoples' Region",
  "zone": "Unknown",
  "woreda": "Unknown",
  "area_ha": 1240.5,
  "candidate_method": "grid_5km_or_admin_unit",
  "geometry_quality": "demo"
}
```

Allowed `geometry_quality`:

- `real_boundary`
- `derived_grid`
- `mock_demo`

Frontend requirement:

- Must render even when `zone` or `woreda` is `Unknown`.
- Must visually distinguish mock/demo geometry if shown in technical view.

### 7.2 Site Feature Object

Files:

```text
data/features/site_features.csv
data/features/site_features.json
```

Canonical JSON shape:

```json
{
  "site_id": "SWE-001",
  "region": "Southwest Ethiopia Peoples' Region",
  "zone": "Unknown",
  "woreda": "Unknown",
  "area_ha": 1240.5,
  "land_cover_primary": "cropland_tree_mosaic",
  "land_cover_mix": {
    "tree_cover": 0.18,
    "cropland": 0.52,
    "grassland": 0.21,
    "built_up": 0.02,
    "water": 0.0,
    "other": 0.07
  },
  "ndvi_current": 0.43,
  "ndvi_trend_5y": -0.06,
  "evi_current": 0.31,
  "forest_loss_score": 68,
  "rainfall_mean_mm": 1320,
  "rainfall_reliability_score": 74,
  "slope_mean_deg": 8.4,
  "slope_risk_score": 61,
  "soil_organic_carbon_score": 66,
  "soil_ph_suitability_score": 72,
  "population_pressure_score": 78,
  "road_access_score": 69,
  "settlement_proximity_score": 63,
  "protected_area_overlap_pct": 0.0,
  "safeguard_risk_score": 18,
  "data_quality_score": 73,
  "field_validation_required": true,
  "feature_version": "v0.1"
}
```

Score scale:

- All `*_score` fields are integers from 0 to 100.
- Higher is better unless the name contains `risk`.
- Risk scores: 0 means low risk, 100 means high risk.

Required fields for reasoning MVP:

- `site_id`
- `region`
- `area_ha`
- `land_cover_primary`
- `ndvi_current`
- `ndvi_trend_5y`
- `rainfall_reliability_score`
- `slope_risk_score`
- `soil_organic_carbon_score`
- `population_pressure_score`
- `road_access_score`
- `protected_area_overlap_pct`
- `safeguard_risk_score`
- `data_quality_score`
- `field_validation_required`

If a feature cannot be computed, use `null` and add a data quality note. Do not invent values silently.

### 7.3 Model Prediction Object

File:

```text
models/artifacts/site_predictions.json
```

Shape:

```json
{
  "site_id": "SWE-001",
  "model_version": "ranker_v0.1",
  "priority_score": 84,
  "carbon_potential": "high",
  "biodiversity_benefit": "medium",
  "livelihood_benefit": "high",
  "water_soil_benefit": "high",
  "implementation_feasibility": "medium",
  "risk_level": "medium",
  "recommended_intervention_seed": "fmnr_agroforestry",
  "top_feature_contributions": [
    {
      "feature": "population_pressure_score",
      "direction": "positive",
      "weight": 0.18
    },
    {
      "feature": "rainfall_reliability_score",
      "direction": "positive",
      "weight": 0.14
    },
    {
      "feature": "safeguard_risk_score",
      "direction": "negative",
      "weight": 0.09
    }
  ],
  "prediction_quality": "weak_supervised_demo"
}
```

Allowed labels:

- `low`
- `medium`
- `high`

Allowed `prediction_quality`:

- `expert_labeled`
- `atlas_labeled`
- `weak_supervised_demo`
- `rule_based_fallback`

### 7.4 Recommendation Object

Produced by the reasoning layer.

```json
{
  "site_id": "SWE-001",
  "rank": 1,
  "priority_score": 84,
  "recommended_intervention": "FMNR + agroforestry",
  "intervention_code": "fmnr_agroforestry",
  "carbon_potential": "high",
  "biodiversity_benefit": "medium",
  "livelihood_benefit": "high",
  "water_soil_benefit": "high",
  "implementation_feasibility": "medium",
  "risk_level": "medium",
  "main_reasons": [
    "High livelihood pressure near farming communities",
    "Rainfall suitability supports tree establishment",
    "Cropland-tree mosaic is appropriate for farmer-managed natural regeneration"
  ],
  "risk_flags": [
    "Land tenure requires field validation",
    "Grazing pressure should be checked with community leaders"
  ],
  "field_validation_questions": [
    "Who currently uses this land and under what tenure arrangement?",
    "Is grazing pressure seasonal or year-round?",
    "Which tree species are locally preferred for fodder, fruit, fuelwood, or soil restoration?"
  ],
  "evidence_refs": [
    "site_features:SWE-001.population_pressure_score",
    "site_features:SWE-001.rainfall_reliability_score",
    "site_features:SWE-001.land_cover_primary"
  ]
}
```

### 7.5 Evidence Critic Object

```json
{
  "site_id": "SWE-001",
  "support_level": "supported_with_validation_needed",
  "unsupported_claims": [],
  "weak_claims": [
    {
      "claim": "High carbon potential",
      "reason": "Carbon potential is inferred from vegetation recovery and soil carbon proxies, not field biomass measurement."
    }
  ],
  "must_show_disclaimer": true,
  "recommended_disclaimer": "This is a pre-feasibility screening result. Field validation is required before project investment or carbon claims."
}
```

Allowed `support_level`:

- `supported`
- `supported_with_validation_needed`
- `weak`
- `unsupported`

### 7.6 Project Brief Object

```json
{
  "site_id": "SWE-001",
  "title": "FMNR and Agroforestry Opportunity in Southwest Ethiopia",
  "one_sentence_summary": "This candidate area is promising for FMNR and agroforestry because it combines livelihood relevance, suitable rainfall, and a cropland-tree mosaic land cover pattern.",
  "recommended_actions": [
    "Run community field validation",
    "Assess land tenure and grazing pressure",
    "Confirm locally suitable native and livelihood tree species",
    "Prepare a small pilot intervention before carbon project development"
  ],
  "expected_benefits": {
    "climate": "High potential for vegetation recovery and future carbon storage, subject to field validation.",
    "biodiversity": "Medium native restoration value if species selection follows local ecology.",
    "livelihood": "High relevance due to nearby population pressure and agroforestry potential.",
    "water_soil": "High potential benefit if soil and slope risks are addressed."
  },
  "data_evidence": [
    "Sentinel-2 vegetation signal",
    "CHIRPS rainfall suitability",
    "ESA WorldCover land-cover class",
    "WorldPop population pressure",
    "SRTM slope proxy"
  ],
  "risks": [
    "Tenure and community willingness unknown",
    "Grazing pressure may reduce survival",
    "Carbon estimate is pre-feasibility only"
  ],
  "next_steps": [
    "Field visit",
    "Community consultation",
    "Species validation",
    "Pilot design"
  ]
}
```

## 8. Patrick Workstream: Data and Lightweight Model

### 8.1 Dataset Registry Agent

Purpose:

Create a machine-readable and human-readable inventory of all datasets. This is the first deliverable because every other layer depends on knowing what fields are real.

Inputs:

- `datamatrix.docx`
- `plan.md`
- source links found by research
- any downloaded files

Outputs:

```text
data/catalog/datasets.json
data/dataset_inventory.md
docs/data_quality.md
```

`datasets.json` shape:

```json
{
  "dataset_id": "sentinel2_sr",
  "name": "Sentinel-2 Surface Reflectance Harmonized",
  "provider": "ESA/Copernicus via Google Earth Engine",
  "type": "raster_time_series",
  "spatial_resolution": "10-20m",
  "temporal_resolution": "5 day revisit",
  "coverage": "global",
  "access_method": "google_earth_engine",
  "mvp_status": "required",
  "used_features": ["ndvi_current", "evi_current", "ndvi_trend_5y"],
  "known_limitations": ["cloud masking required"],
  "source_url": "https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED"
}
```

Allowed `mvp_status`:

- `required`
- `optional`
- `future`
- `blocked`

LLM use:

- GPT-5.5 may help convert messy documentation into `datasets.json`.
- The agent must not mark a dataset as available unless the source is verified or a local file exists.

### 8.2 AOI Boundary Builder

Purpose:

Produce clean boundaries for South Ethiopia and Southwest Ethiopia Peoples' Region, or a demo-safe fallback if boundary names are inconsistent.

Inputs:

- HDX/OCHA admin boundaries.
- Region names from challenge.

Outputs:

```text
data/processed/aoi_boundaries.geojson
data/processed/aoi_lookup.csv
docs/data_quality.md
```

Important checks:

- Coordinate reference system must be WGS84 for frontend GeoJSON.
- Keep original admin IDs if available.
- If the new region boundaries do not align with older SNNPR-era data, document the crosswalk issue.

### 8.3 Candidate Site Generator

Purpose:

Create the candidate areas that will be ranked. The unit can be:

- woreda/admin unit if boundaries are clean,
- fixed grid cells if admin boundaries are messy,
- hand-picked demo polygons if time is short.

Decision:

For the hackathon, use 5-20 candidate areas. This is enough for a convincing ranked list and avoids slow full-country processing.

Outputs:

```text
data/processed/candidate_sites.geojson
```

Minimum:

- 5 sites for demo.
- 1 clearly top-ranked site.
- 1 high-risk site.
- 1 livelihood-first site.
- 1 carbon-potential site.
- 1 lower-priority comparison site.

### 8.4 Feature Extraction Engine

Purpose:

Extract comparable features for every candidate site.

Processing mode:

- Preferred: Google Earth Engine exports to CSV/GeoJSON.
- Fallback: mock features based on known source ranges, clearly marked `feature_version: demo_mock_v0`.

Feature groups:

```text
vegetation:
  ndvi_current
  ndvi_trend_5y
  evi_current

land_cover:
  land_cover_primary
  land_cover_mix

forest:
  forest_loss_score
  tree_cover_context_score

climate:
  rainfall_mean_mm
  rainfall_reliability_score

terrain:
  slope_mean_deg
  slope_risk_score

soil:
  soil_organic_carbon_score
  soil_ph_suitability_score

social_feasibility:
  population_pressure_score
  road_access_score
  settlement_proximity_score

safeguards:
  protected_area_overlap_pct
  safeguard_risk_score

quality:
  data_quality_score
  field_validation_required
```

Outputs:

```text
data/features/site_features.csv
data/features/site_features.json
```

### 8.5 Weak Labeling and Suitability Ranker

Purpose:

Train or simulate a lightweight model that turns site features into priority predictions.

Final call:

Patrick owns this because model quality depends on feature quality and labeling assumptions.

Allowed approaches, in priority order:

1. Expert labels from MfM or team if available.
2. Weak labels from restoration atlas priority classes.
3. Weak labels from transparent rules.
4. Rule-based fallback with no trained model.

Recommended hackathon model:

```text
LightGBM or XGBoost if available.
RandomForest or GradientBoostingClassifier if using only scikit-learn.
```

If package installation becomes a bottleneck, use scikit-learn RandomForest or no trained model. Demo credibility comes more from clean features and explanation than from model complexity.

Training data shape:

```text
site_id, feature columns..., weak_label_priority, weak_label_intervention
```

Prediction outputs:

```text
models/artifacts/site_predictions.json
models/reports/model_report.md
models/schemas/feature_schema.json
```

`model_report.md` must include:

- label source,
- feature list,
- what is real vs mock,
- model type,
- evaluation method if possible,
- limitation statement.

Limitation statement template:

```text
This model is a pre-feasibility ranking prototype. Labels are weak or expert-derived and should be improved with MfM historical project outcomes, field survival rates, biomass measurements, biodiversity monitoring, and community feasibility data.
```

### 8.6 Deterministic Model Data Gaps and Acquisition Plan

The deterministic ranker can score candidate areas from open data, but it cannot prove that a site is implementable or that the predicted benefits will happen. Treat the first version as a transparent screening model until the missing validation data is collected.

What current sources give us:

| Decision dimension | Current sources | Good enough for MVP? | What it can support |
| --- | --- | --- | --- |
| AOI and candidate geometry | HDX/OCHA admin boundaries, grid fallback | Yes | Region, zone, woreda, area, map rendering, aggregation unit. |
| Current vegetation condition | Sentinel-2 NDVI/EVI, ESA WorldCover | Yes | Vegetation health, bare soil signal, land-cover mix. |
| Long-term vegetation trend | Landsat Collection 2 | Useful but optional | Degradation or recovery trend if cloud masking and time windows are consistent. |
| Forest pressure | GFW/UMD forest change | Yes | Tree-cover loss context, not measured degradation severity. |
| Water and climate suitability | CHIRPS rainfall | Yes with low weight | Rainfall suitability and drought-risk proxy. |
| Terrain and erosion proxy | SRTM slope/elevation | Yes | Slope risk and terrain suitability, not direct erosion measurement. |
| Soil suitability and carbon proxy | SoilGrids | Yes with disclaimer | SOC, pH, and texture context, not measured project carbon stock. |
| Safeguard screening | WDPA | Yes as a flag | Protected-area overlap and safeguard review trigger. |
| Livelihood pressure and access | WorldPop, GHSL, OSM roads/places | Yes as proxy | Population pressure and road access, not consent or cost. |
| Species/context suggestions | CIFOR-ICRAF species atlas, restoration atlas | Optional | Context, RAG notes, weak labels, suggested intervention families. |

What we still need to evaluate properly:

| Missing data | Why it matters | How to get it | MVP handling until available |
| --- | --- | --- | --- |
| MfM historical project sites and outcomes | Needed for real labels and model evaluation. | Ask MfM for past project polygons, intervention type, start year, survival rate, monitoring notes, and success/failure tags. | Use weak labels and mark `prediction_quality: weak_supervised_demo` or `rule_based_fallback`. |
| Field biomass or carbon measurements | Needed before any carbon claim. | Partner monitoring plots, biomass surveys, allometric estimates, or verified carbon project reports. | Say "carbon potential" only; do not claim measured carbon or credits. |
| Biodiversity baselines | Needed to validate biodiversity benefit. | Species surveys, habitat quality observations, eDNA/camera/acoustic data if available, protected/key biodiversity area overlays. | Score habitat opportunity from land cover and restoration context only. |
| Land tenure and user rights | Determines whether implementation is legally and socially feasible. | MfM/local partner records, woreda land offices, community consultation. | Always add tenure as a field-validation question. |
| Community willingness and governance | Determines adoption and maintenance. | Interviews, participatory mapping, local cooperative/committee records. | Infer nothing from population density; mark `field_validation_required: true`. |
| Grazing pressure and seasonal land use | Affects survival and intervention choice. | Field survey, local expert input, seasonal calendars, livestock pressure notes. | Add risk flag for FMNR, exclosures, and planting. |
| Nursery capacity and species availability | Determines feasibility and cost. | MfM nursery inventory, local supplier lists, seedling production schedule. | Keep species suggestions as context, not prescription. |
| Cost, labor, and access constraints | Needed for implementation feasibility and ranking. | Road travel time, local wage/cost assumptions, MfM logistics records. | Use OSM road proximity only as a weak proxy. |
| Conflict, safety, and access constraints | Determines whether field teams can work there. | Partner security notes, local authority guidance, up-to-date access constraints. | Do not automate go/no-go decisions from open data alone. |
| Independent holdout labels | Needed for honest evaluation. | Split historical MfM sites by geography/time, or manually label a holdout set with domain experts. | Report that numeric evaluation is not available yet. |

Minimum data request to MfM or local partners:

```text
1. Past and current project polygons or GPS points.
2. Intervention type per site.
3. Start year and implementation status.
4. Survival or establishment rate if measured.
5. Monitoring notes and known failure reasons.
6. Tenure/community acceptance status.
7. Grazing, fire, pest, conflict, or access flags.
8. Local species planted or naturally regenerated.
9. Approximate implementation cost or labor intensity.
10. Any biodiversity or biomass/carbon measurements.
```

Evaluation plan:

1. Start with rule-based scoring and weak labels from the restoration atlas or expert review.
2. Build a small labeled table from MfM historical sites as soon as partner data arrives.
3. Use spatial or time-based holdout splits so nearby sites do not leak into both train and test.
4. Evaluate ranking quality with top-k precision, nDCG, and expert review of the top 5 sites, not just classification accuracy.
5. Track calibration by checking whether "high" benefit sites are actually high in the partner labels.
6. Keep a confusion table for intervention recommendation errors, especially high-risk false positives.
7. Keep every score traceable to source fields; if a feature is missing, use `null` plus a data-quality note.

First acquisition order:

1. Verify downloadable/API access for restoration atlas layers.
2. Export Sentinel-2, WorldCover, CHIRPS, SRTM, SoilGrids, WorldPop, OSM, WDPA, and GFW features for the 5-20 demo sites.
3. Ask MfM for the minimum partner data request above.
4. Add a manual expert-label CSV if partner data cannot arrive before the demo.
5. Freeze demo artifacts and document exactly which fields are real, weak, or mock in `models/reports/model_report.md`.

### 8.7 Optional Geospatial Embedding Agent

Purpose:

Add a visible geospatial AI feature without blocking the MVP.

Recommended use:

- Generate embeddings for candidate image patches.
- Use embeddings for "similar landscape" search or clustering.

Potential models:

- Clay Foundation Model for geospatial embeddings.
- Prithvi EO 2.0 for Earth observation foundation-model story.

Do not make this required. If it works, expose it in the demo as:

```text
Similar landscapes detected by geospatial foundation-model embeddings.
```

If it does not work, the MVP still functions with feature-based similarity.

## 9. Chirag Workstream: Reasoning and Agents

### 9.1 Reasoning Orchestrator

Purpose:

Coordinate the reasoning agents and expose one stable API to the frontend.

Inputs:

- `data/features/site_features.json`
- `models/artifacts/site_predictions.json`
- optional `data/features/site_embeddings.parquet`
- optional case-study corpus

Outputs:

- recommendation JSON
- critic JSON
- project brief JSON
- API responses

Recommended implementation:

- Use OpenAI Responses API or Agents SDK.
- Use GPT-5.5 for recommendation, critic, and brief generation.
- Use structured outputs with JSON Schema or Zod so frontend integration is stable.

Call order:

```text
1. load site feature object
2. load model prediction object
3. Recommendation Agent creates recommendation
4. Similar Cases Agent retrieves cases if available
5. Evidence Critic Agent checks recommendation against features
6. Project Brief Agent creates brief
7. Frontend Adapter API returns combined object
```

### 9.2 Recommendation Agent

Use case:

Convert geospatial features and model predictions into a planner-readable recommendation.

Inputs:

```json
{
  "site_features": {},
  "model_prediction": {},
  "allowed_interventions": [
    "fmnr_agroforestry",
    "assisted_natural_regeneration",
    "riparian_restoration",
    "native_tree_planting",
    "erosion_control_exclosures",
    "field_validation_before_investment"
  ]
}
```

Output:

Recommendation Object from section 7.4.

Rules:

- Must cite evidence refs for every main reason.
- Must not claim measured carbon unless measured carbon exists.
- Must say "carbon potential" or "pre-feasibility carbon signal", not "verified carbon".
- Must include field-validation questions.

Recommended intervention mapping:

| Condition | Intervention |
| --- | --- |
| Cropland/tree mosaic + high population pressure | `fmnr_agroforestry` |
| High slope risk + degradation | `assisted_natural_regeneration` plus erosion control |
| Riparian/water-adjacent zone | `riparian_restoration` |
| Forest loss + good rainfall + low settlement pressure | `native_tree_planting` or ANR |
| High safeguard risk | `field_validation_before_investment` |
| High carbon potential + high social risk | field validation before carbon pathway |

### 9.3 Similar Cases RAG Agent

Use case:

Retrieve relevant restoration examples or species/context notes. This strengthens the reasoning layer, but it is optional for the first integration.

Inputs:

- site features,
- recommended intervention,
- case corpus if available,
- CIFOR-ICRAF or restoration context notes if structured.

Output:

```json
{
  "site_id": "SWE-001",
  "similar_cases": [
    {
      "case_id": "case-001",
      "title": "FMNR in semi-humid East African cropland",
      "location": "East Africa",
      "intervention": "FMNR",
      "similarity_score": 0.74,
      "why_similar": [
        "cropland-tree mosaic",
        "livelihood pressure",
        "rainfall suitability"
      ],
      "lesson": "Community grazing rules are a key success factor.",
      "source": "manual_demo_case"
    }
  ]
}
```

Fallback:

If no case corpus exists, return an empty list and let the frontend hide the panel or show "No similar cases loaded for this prototype."

### 9.4 Evidence Critic Agent

Use case:

Protect credibility. The critic checks that claims in the recommendation and brief are supported by the feature table and model output.

Inputs:

- site features,
- model prediction,
- recommendation object,
- project brief draft.

Output:

Evidence Critic Object from section 7.5.

Checks:

- Are all numeric claims traceable?
- Are coarse datasets overclaimed?
- Are carbon claims framed as potential/pre-feasibility?
- Are safeguards mentioned when protected-area overlap or high risk exists?
- Are missing fields acknowledged?

This agent is valuable for the OpenAI prize because it shows responsible, grounded AI.

### 9.5 Project Brief Agent

Use case:

Generate the donor/stakeholder-ready brief.

Inputs:

- site features,
- prediction,
- recommendation,
- critic output,
- similar cases if available.

Output:

Project Brief Object from section 7.6.

Rules:

- Must include limitations if `must_show_disclaimer` is true.
- Must be concise enough for a demo screen.
- Must separate expected benefits from validated benefits.

## 10. Julia Workstream: Frontend and Demo

### 10.1 Frontend Goal

The frontend should make the system understandable in 3-5 minutes. It does not need to expose every dataset. It must make the decision workflow clear.

Screens:

1. Region selection.
2. Map plus ranked list.
3. Site detail.
4. Evidence and recommendation.
5. Project brief.
6. Optional agent workflow panel for prize strategy.

### 10.2 Frontend Data Dependencies

Julia should build first against:

```text
api/sample_responses/sites.json
api/sample_responses/site_detail_SWE-001.json
api/sample_responses/brief_SWE-001.json
```

Then switch to live endpoints once Chirag exposes them.

### 10.3 Required UI Behavior

Map/list screen:

- show top 5 candidate sites,
- color by priority score,
- show risk badge,
- show recommended intervention,
- allow click into detail.

Site detail:

- show score breakdown,
- show top reasons,
- show risk flags,
- show data confidence,
- show field validation questions.

Brief screen:

- show generated project brief,
- show disclaimer if required,
- show export button even if export only downloads JSON or prints page in MVP.

Agent workflow panel:

- show Data Agent -> Ranker -> Recommendation Agent -> Critic -> Brief Agent.
- useful for Mutagents/OpenAI side challenge narrative.

## 11. Frontend Adapter API

These endpoints can be implemented as Next.js route handlers or a separate small API. Use static JSON files first if faster.

### 11.1 `GET /api/sites`

Returns map/list-ready sites.

```json
{
  "region": "Southwest Ethiopia Peoples' Region",
  "generated_at": "2026-06-27T18:00:00Z",
  "sites": [
    {
      "site_id": "SWE-001",
      "name": "Candidate Area 1",
      "rank": 1,
      "priority_score": 84,
      "recommended_intervention": "FMNR + agroforestry",
      "risk_level": "medium",
      "carbon_potential": "high",
      "livelihood_benefit": "high",
      "data_quality_score": 73,
      "geometry": {
        "type": "Polygon",
        "coordinates": []
      }
    }
  ]
}
```

### 11.2 `GET /api/sites/{site_id}`

Returns full site detail.

```json
{
  "site_features": {},
  "model_prediction": {},
  "recommendation": {},
  "critic": {},
  "similar_cases": []
}
```

### 11.3 `POST /api/sites/{site_id}/brief`

Generates or returns cached brief.

Request:

```json
{
  "audience": "donor",
  "length": "short"
}
```

Response:

```json
{
  "brief": {},
  "critic": {}
}
```

### 11.4 `GET /api/agent-trace/{site_id}`

Optional demo endpoint.

```json
{
  "site_id": "SWE-001",
  "steps": [
    {
      "name": "Data Ingestion",
      "status": "complete",
      "output": "17 features extracted"
    },
    {
      "name": "Suitability Ranker",
      "status": "complete",
      "output": "priority_score=84"
    },
    {
      "name": "Recommendation Agent",
      "status": "complete",
      "output": "FMNR + agroforestry"
    },
    {
      "name": "Evidence Critic",
      "status": "complete",
      "output": "supported with validation needed"
    },
    {
      "name": "Project Brief Agent",
      "status": "complete",
      "output": "brief generated"
    }
  ]
}
```

## 12. AWS Plan

You have AWS credits, so use AWS where it strengthens the story and reduces risk.

Recommended AWS services:

| Service | Use | Owner |
| --- | --- | --- |
| EC2 | AWS-hosted development and demo server for Codex, builds, Docker, and nginx | all |
| S3 | store raw metadata, processed GeoJSON/CSV, model artifacts, sample responses | Patrick |
| SageMaker Processing | run feature extraction or preprocessing jobs if local/GEE export is inconvenient | Patrick |
| SageMaker Training | train lightweight ranker if using a managed job | Patrick |
| Lambda | lightweight API tasks or cached brief generation if needed | Chirag |
| ECS Fargate or existing server deploy | app hosting; choose whichever is faster | Julia/Chirag |
| CloudWatch | logs for demo reliability | all |

Do not overbuild:

- No complex VPC unless required.
- No data lake architecture.
- No streaming pipeline.
- No full MLOps pipeline.

AWS-hosted Codex development path:

1. Launch one Ubuntu EC2 instance in `us-west-2`.
2. Allow SSH from the developer's IP only; allow ports `80` and `443` only if this instance hosts the public demo.
3. Install Git, Docker, Node/project dependencies, `bubblewrap`, and Codex CLI on the instance.
4. Authenticate Codex with `codex login --device-auth` or SSH callback forwarding.
5. Clone the repo on the EC2 instance and run Codex from that server:

```bash
codex --sandbox workspace-write --ask-for-approval on-request
```

6. Do not expose Codex app-server ports to the internet. If remote TUI access is needed, use SSH tunneling or Codex's documented SSH remote-project flow.

Detailed EC2 setup lives in `DEPLOY.md`.

Minimum AWS artifact layout:

```text
s3://<bucket>/chaka/
  raw/
  processed/aoi_boundaries.geojson
  processed/candidate_sites.geojson
  features/site_features.csv
  features/site_features.json
  models/site_predictions.json
  models/model_report.md
  api/sites.json
  api/site_detail_SWE-001.json
```

Recommended local mirror:

Keep the same structure in the repo under `data/`, `models/`, and `api/sample_responses/`.

Demo rule:

The app should be able to run from local/static artifacts if AWS, internet, or credentials fail during the pitch.

## 13. OpenAI Plan

Use OpenAI for the agentic reasoning layer, not for raster computation.

Recommended model:

- `gpt-5.5` for recommendation, critic, and brief generation.

OpenAI capabilities to use:

- Structured Outputs for stable JSON.
- File search/vector retrieval if a case-study corpus is added.
- Tool/function calls for loading site features and predictions.
- Agents SDK if Chirag wants a visible multi-agent workflow.

Provider boundary:

```text
OpenAI agents receive:
  site feature JSON
  model prediction JSON
  retrieved context snippets

OpenAI agents return:
  structured recommendation JSON
  structured critic JSON
  structured brief JSON
```

OpenAI agents must not:

- compute NDVI directly,
- classify raw raster pixels in the MVP,
- invent missing data,
- claim verified carbon credits,
- override safeguard exclusions without evidence.

## 14. Integration Workflow

### Phase 0: Contract Freeze

Everyone agrees on:

- `site_id`,
- feature object,
- prediction object,
- recommendation object,
- API endpoints.

After this, changes require a short team check.

### Phase 1: Parallel Mock Build

Patrick:

- creates 5-20 sample sites,
- creates `site_features.json`,
- creates `site_predictions.json`.

Chirag:

- creates agents against sample feature/prediction objects,
- writes sample recommendations and briefs,
- exposes sample API.

Julia:

- builds frontend using sample responses,
- does not wait for real data.

### Phase 2: Real Data Swap

Patrick replaces mock features with real extracted features.

Required check:

- same field names,
- same score scale,
- same `site_id`,
- no frontend changes needed.

### Phase 3: Model Swap

Patrick replaces rule-based predictions with trained ranker predictions.

Required check:

- same prediction object shape,
- `prediction_quality` updated,
- model report written.

### Phase 4: Live Agent Integration

Chirag switches from cached sample outputs to live OpenAI calls where useful.

Required check:

- structured output validation passes,
- frontend still receives same response shape,
- cached fallback exists.

### Phase 5: Demo Lock

Freeze data and generated responses for the pitch.

Do not regenerate during the live demo unless the live generation itself is the demo moment.

## 15. Quality Gates

### Patrick Gate

- `candidate_sites.geojson` renders.
- `site_features.json` validates.
- Every score has a source or is marked mock.
- `model_report.md` explains labels and limitations.
- At least 5 sites are ranked.

### Chirag Gate

- Recommendation object validates.
- Critic catches unsupported carbon claims.
- Brief object validates.
- API returns stable JSON even if OpenAI call fails.
- Prompt outputs are grounded in feature refs.

### Julia Gate

- Frontend can run from sample responses.
- Top 5 ranked areas are visible.
- Site detail screen explains why an area is recommended.
- Brief screen includes disclaimer.
- Demo works without typing.

## 16. Prize Strategy

### Main Challenge

Emphasize:

- restoration prioritization for Ethiopia,
- real open geospatial data,
- clear impact dimensions,
- field-validation workflow for MfM.

### OpenAI Side Challenge

Emphasize:

- GPT-5.5 structured agents,
- evidence critic agent,
- grounded project brief generation,
- no unsupported claims.

### Mutagents Side Challenge

Emphasize:

- visible multi-agent workflow,
- specialist agents with handoffs,
- each agent has a narrow responsibility.

### AWS Side Challenge

Emphasize:

- S3 artifact pipeline,
- SageMaker preprocessing/training,
- reliable hosted demo or reproducible artifact storage,
- CloudWatch/logged execution if available.

Do not let side challenges distort the core demo. The strongest story is:

```text
We combine open geospatial data, a lightweight trained suitability model, and grounded AI agents to turn restoration planning into a ranked, explainable, field-validatable decision workflow.
```

## 17. Build Priorities

If time is short, build in this order:

1. Static candidate sites and feature table.
2. Rule-based scoring and predictions.
3. Frontend map/list/detail.
4. GPT-5.5 recommendation and brief generation.
5. Evidence critic.
6. Lightweight trained model.
7. AWS artifact sync.
8. Optional geospatial embeddings.
9. Optional live RAG similar cases.

Minimum viable demo:

```text
5 ranked candidate sites + one detailed recommendation + one generated project brief + visible data evidence and validation disclaimer
```

## 18. References

- HDX Ethiopia administrative boundaries: https://data.humdata.org/dataset/cod-ab-eth
- Sentinel-2 Surface Reflectance Harmonized: https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED
- Landsat Collection 2 Surface Reflectance: https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC08_C02_T1_L2
- Sentinel-1 GRD: https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD
- SRTM 30m: https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003
- CHIRPS rainfall: https://www.chc.ucsb.edu/data/chirps
- SoilGrids: https://docs.isric.org/globaldata/soilgrids/
- ESA WorldCover: https://esa-worldcover.org/en/data-access
- Global Forest Watch data: https://data.globalforestwatch.org/
- Protected Planet WDPA: https://www.protectedplanet.net/en/thematic-areas/wdpa
- WorldPop: https://hub.worldpop.org/
- GHSL: https://human-settlement.emergency.copernicus.eu/
- Geofabrik Ethiopia OSM: https://download.geofabrik.de/africa/ethiopia.html
- Clay Foundation Model: https://clay-foundation.github.io/model/
- Prithvi EO 2.0: https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M
- TerraTorch: https://github.com/torchgeo/terratorch
- OpenAI latest model guidance: https://developers.openai.com/api/docs/guides/latest-model.md
- OpenAI Agents SDK: https://developers.openai.com/api/docs/guides/agents.md
- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs.md
