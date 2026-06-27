# Chirag Intelligence Layer Alignment Plan

This plan compares the current Chirag reasoning/intelligence implementation with `AGENT_STRUCTURE.md`, limited only to Chirag's reasoning layer, agent orchestration, recommendation logic, evidence checks, RAG/similar cases, project brief generation, and frontend adapter API.

## Current State

Implemented so far:

- `reasoning/types.ts`
  - Defines Patrick's earlier nested site input shape.
  - Defines component scores, risk assessment, intervention recommendation, similar case, explanation, project brief, and recommendation result types.
- `reasoning/sample-sites.ts`
  - Contains 10 dummy Patrick-style nested site objects.
- `reasoning/scoring.ts`
  - Calculates carbon, biodiversity/restoration, livelihood, erosion/water, feasibility, species suitability, risk penalty, and final priority score.
- `reasoning/interventions.ts`
  - Implements rule-based intervention classification.
- `reasoning/risks.ts`
  - Detects risks and returns field-validation questions.
- `reasoning/cases.ts` and `reasoning/similarity.ts`
  - Provide a lightweight local similar-case retriever.
- `reasoning/explanations.ts`
  - Generates planner-readable explanations.
- `reasoning/index.ts`
  - Orchestrates scoring, risk detection, intervention classification, similar cases, explanation, and project brief.
- `app/api/recommendations/route.ts`
  - Exposes `GET` and `POST /api/recommendations`.
  - Accepts the earlier nested Patrick-style object.
  - Includes runtime shape validation.

Verified so far:

- TypeScript check passes.
- Production build passes.
- The recommendations API returns ranked sample outputs.
- Invalid POST data returns a clean error.

## What AGENT_STRUCTURE.md Expects

For Chirag's part, `AGENT_STRUCTURE.md` expects these main pieces:

1. A Reasoning Orchestrator that reads:
   - `data/features/site_features.json`
   - `models/artifacts/site_predictions.json`
   - optional `data/features/site_embeddings.parquet`
   - optional case-study corpus

2. A canonical feature contract:
   - flat `SiteFeature` object, not the earlier nested Patrick object
   - IDs like `SWE-001` and `SET-001`
   - required fields such as `area_ha`, `land_cover_primary`, `ndvi_current`, `ndvi_trend_5y`, `slope_risk_score`, `protected_area_overlap_pct`, `safeguard_risk_score`, `data_quality_score`, and `field_validation_required`

3. A separate model prediction contract:
   - `models/artifacts/site_predictions.json`
   - fields such as `priority_score`, `recommended_intervention_seed`, `top_feature_contributions`, and `prediction_quality`

4. A recommendation object matching section 7.4:
   - `priority_score`
   - `intervention_code`
   - lowercase labels: `low`, `medium`, `high`
   - `implementation_feasibility`
   - `evidence_refs`

5. An Evidence Critic Agent:
   - returns `support_level`
   - catches unsupported or weak claims
   - forces disclaimers where needed
   - especially guards carbon, safeguard, missing-data, and coarse-dataset claims

6. A Project Brief Agent:
   - returns the section 7.6 brief shape
   - includes `one_sentence_summary`
   - includes `data_evidence`
   - includes limitations if the critic says a disclaimer is needed

7. A Similar Cases RAG Agent:
   - returns section 9.3 shape
   - each case has `title`, `location`, `intervention`, `similarity_score`, `why_similar`, `lesson`, and `source`
   - if no corpus exists, returns an empty list

8. Frontend Adapter API endpoints:
   - `GET /api/sites`
   - `GET /api/sites/{site_id}`
   - `POST /api/sites/{site_id}/brief`
   - optional `GET /api/agent-trace/{site_id}`

9. Agentic implementation direction:
   - OpenAI Responses API or Agents SDK
   - structured outputs with JSON Schema or Zod
   - GPT-5.5 recommended for recommendation, critic, and brief generation
   - cached fallback required for demo reliability

## Gap Analysis

### 1. Input Contract Mismatch

Current implementation uses the earlier nested Patrick object:

- `admin.region`
- `land_cover.dominant_class`
- `vegetation.ndvi_mean`
- `terrain.erosion_risk_score`
- `safeguards.protected_area_overlap`

`AGENT_STRUCTURE.md` now defines a flat canonical `site_features.json` object:

- `region`
- `area_ha`
- `land_cover_primary`
- `ndvi_current`
- `ndvi_trend_5y`
- `slope_risk_score`
- `protected_area_overlap_pct`
- `safeguard_risk_score`
- `data_quality_score`
- `field_validation_required`

Impact:

- Patrick's new data artifacts will not plug directly into the current reasoning code.
- Julia's frontend may expect fields from the canonical contract, while the current API returns a different shape.

Required change:

- Add canonical `SiteFeature` and `ModelPrediction` types.
- Add an adapter from the earlier nested Patrick object to the canonical flat feature object, so we do not lose current dummy data.
- Make the orchestrator consume canonical `SiteFeature` + `ModelPrediction`.

### 2. Site ID Format Mismatch

Current sample IDs use:

- `SW-001`
- `SW-002`

`AGENT_STRUCTURE.md` expects:

- `SWE-001` for Southwest Ethiopia
- `SET-001` for South Ethiopia

Impact:

- Integration with Patrick and Julia can break if IDs differ.

Required change:

- Rename sample IDs to `SWE-*` and `SET-*`.
- Add a short helper to normalize legacy `SW-*` only if needed during transition.

### 3. Missing Model Prediction Layer

Current implementation calculates scores directly inside `reasoning/scoring.ts`.

`AGENT_STRUCTURE.md` expects a separate `ModelPrediction` object from:

- `models/artifacts/site_predictions.json`

Impact:

- We currently blur Patrick's model layer and Chirag's reasoning layer.
- The recommendation layer cannot show `top_feature_contributions` or `prediction_quality`.

Required change:

- Add `models/artifacts/sample-site-predictions.json` or `models/artifacts/site_predictions.json` for demo.
- Add `reasoning/predictions.ts` to load or synthesize predictions.
- Keep rule-based scoring as fallback only when model prediction is missing.

### 4. Recommendation Object Shape Mismatch

Current output uses:

- `final_priority_score`
- `component_scores`
- `biodiversity_restoration_value`
- `erosion_water_benefit`
- `feasibility`
- no `intervention_code`
- no `evidence_refs`

`AGENT_STRUCTURE.md` expects:

- `priority_score`
- `intervention_code`
- `biodiversity_benefit`
- `water_soil_benefit`
- `implementation_feasibility`
- `evidence_refs`

Impact:

- Frontend integration may need mapping logic.
- Evidence traceability is weaker than the contract requires.

Required change:

- Add canonical `RecommendationObject` type from section 7.4.
- Keep the richer current internals, but return the canonical fields in API responses.
- Add `evidence_refs` for every `main_reason`.

### 5. Evidence Critic Agent Missing

Current implementation has risk flags and field-validation questions, but no standalone critic output.

`AGENT_STRUCTURE.md` expects:

- `support_level`
- `unsupported_claims`
- `weak_claims`
- `must_show_disclaimer`
- `recommended_disclaimer`

Impact:

- We do not yet meet the credibility and OpenAI prize narrative around grounded agents.
- Carbon and biodiversity claims are not formally audited against input evidence.

Required change:

- Add `reasoning/critic.ts`.
- The critic should check:
  - every main reason has evidence refs
  - carbon is framed as potential/pre-feasibility
  - protected-area or high-safeguard sites mention safeguards
  - missing/null fields are acknowledged
  - coarse datasets such as CHIRPS and SoilGrids are not overclaimed

### 6. Project Brief Shape Mismatch

Current brief has:

- `title`
- `summary`
- `recommended_actions`
- `expected_benefits`
- `risks_to_check`
- `next_steps`

`AGENT_STRUCTURE.md` expects:

- `title`
- `one_sentence_summary`
- `recommended_actions`
- `expected_benefits`
- `data_evidence`
- `risks`
- `next_steps`
- disclaimer/limitations when critic requires them

Impact:

- Julia's brief screen may not match the agreed contract.
- Demo may miss the required validation disclaimer.

Required change:

- Add canonical `ProjectBriefObject`.
- Include `data_evidence`.
- Include critic disclaimer in the brief output.

### 7. Similar Cases Shape Mismatch

Current similar cases include:

- `country`
- `region`
- `climate_zone`
- `annual_rainfall_range_mm`
- `intervention_type`
- `matched_dimensions`
- `why_relevant`

`AGENT_STRUCTURE.md` expects:

- `title`
- `location`
- `intervention`
- `similarity_score`
- `why_similar`
- `lesson`
- `source`

Impact:

- Current RAG data is useful but not API-contract compatible.

Required change:

- Keep current richer case database internally.
- Add a mapper to return the canonical `similar_cases` shape.
- Add `source: "manual_demo_case"` for local examples.

### 8. API Endpoint Mismatch

Current endpoint:

- `GET /api/recommendations`
- `POST /api/recommendations`

`AGENT_STRUCTURE.md` expects:

- `GET /api/sites`
- `GET /api/sites/{site_id}`
- `POST /api/sites/{site_id}/brief`
- optional `GET /api/agent-trace/{site_id}`

Impact:

- Julia may build against different endpoints than what exists.

Required change:

- Keep `/api/recommendations` temporarily for backward compatibility.
- Add canonical route handlers:
  - `app/api/sites/route.ts`
  - `app/api/sites/[site_id]/route.ts`
  - `app/api/sites/[site_id]/brief/route.ts`
  - optional `app/api/agent-trace/[site_id]/route.ts`

### 9. Missing `agents/` and `api/contracts/` Artifacts

Current implementation keeps code in:

- `reasoning/`
- `app/api/`

`AGENT_STRUCTURE.md` says Chirag owns:

- `agents/prompts/`
- `agents/schemas/`
- `agents/sample_inputs/`
- `agents/sample_outputs/`
- `api/contracts/`
- `api/sample_responses/`

Impact:

- Contracts and demo sample responses are not documented where the team expects them.

Required change:

- Add JSON schemas or TypeScript-derived contract docs under `api/contracts/`.
- Add sample response JSON under `api/sample_responses/`.
- Add prompt placeholders under `agents/prompts/` for future OpenAI/Agents SDK integration.

### 10. Agentic OpenAI Layer Not Implemented Yet

Current implementation is deterministic TypeScript, not live OpenAI Responses API or Agents SDK.

This is acceptable for the current MVP baseline because `AGENT_STRUCTURE.md` build priorities say rule-based scoring and predictions come before GPT-5.5 recommendation/brief generation. But it is not aligned with the full Chirag target.

Required change:

- Add OpenAI integration as a later phase, with cached fallback.
- Use structured outputs only after canonical schemas are stable.
- Do not let OpenAI compute raster/geospatial facts.

## Alignment Implementation Plan

### Phase 1: Freeze Canonical Contracts

Goal:

Make the code reflect `AGENT_STRUCTURE.md` without deleting the current working reasoning layer.

Tasks:

1. Add canonical types in `reasoning/types.ts`:
   - `SiteFeature`
   - `ModelPrediction`
   - `RecommendationObject`
   - `EvidenceCriticObject`
   - `ProjectBriefObject`
   - `SimilarCasesObject`
   - `SiteDetailResponse`
   - `SiteListResponse`

2. Add lowercase label compatibility:
   - current labels are `Low`, `Medium`, `High`
   - canonical labels should be `low`, `medium`, `high`

3. Add intervention code mapping:
   - `FMNR + agroforestry` -> `fmnr_agroforestry`
   - `ANR + soil/water conservation` -> `assisted_natural_regeneration`
   - `Riparian/watershed restoration` -> `riparian_restoration`
   - `Native tree restoration` -> `native_tree_planting`
   - `Safeguard review` or `Field-validation-first` -> `field_validation_before_investment`

Deliverables:

- Updated canonical type definitions.
- No frontend route changes yet.

### Phase 2: Build Input Adapter

Goal:

Support both the current nested Patrick-style dummy objects and the new flat `site_features.json` contract.

Tasks:

1. Add `reasoning/adapters.ts`.

2. Implement:
   - `nestedPatrickSiteToSiteFeature(site): SiteFeature`
   - `siteFeatureToFallbackPrediction(feature): ModelPrediction`
   - optional `normalizeSiteId(site_id, region): string`

3. Convert existing 10 sample objects to canonical features.

4. Rename sample IDs:
   - Southwest Ethiopia -> `SWE-*`
   - South Ethiopia -> `SET-*`

Deliverables:

- Existing dummy data still works.
- New canonical feature objects can be consumed directly.

### Phase 3: Add Model Prediction Support

Goal:

Separate Patrick's model/prediction layer from Chirag's reasoning layer.

Tasks:

1. Add `models/artifacts/site_predictions.json` with demo predictions for the 10 sample sites.

2. Add `reasoning/predictions.ts`:
   - load prediction by `site_id`
   - fallback to rule-based scoring if prediction missing
   - preserve `prediction_quality`
   - expose `top_feature_contributions`

3. Update the orchestrator call order:
   - load feature
   - load prediction
   - create recommendation
   - retrieve similar cases
   - run critic
   - create brief
   - return combined object

Deliverables:

- Model prediction object exists.
- Recommendation uses prediction score when available.
- Rule-based scoring remains available as fallback.

### Phase 4: Canonical Recommendation Output

Goal:

Make the recommendation object match section 7.4.

Tasks:

1. Add `reasoning/recommendation.ts` or refactor `reasoning/index.ts` to return:
   - `site_id`
   - `rank`
   - `priority_score`
   - `recommended_intervention`
   - `intervention_code`
   - `carbon_potential`
   - `biodiversity_benefit`
   - `livelihood_benefit`
   - `water_soil_benefit`
   - `implementation_feasibility`
   - `risk_level`
   - `main_reasons`
   - `risk_flags`
   - `field_validation_questions`
   - `evidence_refs`

2. Generate evidence refs for every main reason, such as:
   - `site_features:SWE-001.population_pressure_score`
   - `site_features:SWE-001.rainfall_reliability_score`
   - `site_features:SWE-001.land_cover_primary`
   - `site_predictions:SWE-001.priority_score`

3. Keep current score breakdown internally or include it in detail responses under `debug` or `score_breakdown`, not in the canonical recommendation object unless Julia asks for it.

Deliverables:

- Canonical recommendation object validates against the plan.
- Evidence refs exist.

### Phase 5: Add Evidence Critic

Goal:

Meet the `Evidence Critic Agent` requirement and strengthen demo credibility.

Tasks:

1. Add `reasoning/critic.ts`.

2. Implement deterministic critic first:
   - no OpenAI dependency yet
   - checks recommendation, feature, prediction, and brief draft

3. Return:
   - `support_level`
   - `unsupported_claims`
   - `weak_claims`
   - `must_show_disclaimer`
   - `recommended_disclaimer`

4. Critic rules:
   - carbon claims must say potential/pre-feasibility unless measured biomass/carbon field exists
   - high safeguard risk or protected-area overlap must be mentioned
   - null/missing features must appear in weak claims or data-quality notes
   - low `data_quality_score` should force validation-needed support level
   - feature refs must exist for recommendation reasons

Deliverables:

- Critic object from section 7.5.
- Every detail response includes `critic`.

### Phase 6: Align Project Brief

Goal:

Make project brief output match section 7.6.

Tasks:

1. Add `reasoning/brief.ts`.

2. Generate:
   - `title`
   - `one_sentence_summary`
   - `recommended_actions`
   - `expected_benefits`
   - `data_evidence`
   - `risks`
   - `next_steps`

3. Include critic disclaimer when `must_show_disclaimer` is true.

4. Separate expected benefits from validated benefits in the wording.

Deliverables:

- Canonical project brief object.
- Brief screen can show disclaimer.

### Phase 7: Align Similar Cases API Shape

Goal:

Keep current richer local case database but return the contract shape expected by `AGENT_STRUCTURE.md`.

Tasks:

1. Update `reasoning/similarity.ts` to return:
   - `site_id`
   - `similar_cases`

2. Map each case to:
   - `case_id`
   - `title`
   - `location`
   - `intervention`
   - `similarity_score`
   - `why_similar`
   - `lesson`
   - `source`

3. If no case corpus is loaded:
   - return `similar_cases: []`
   - do not fabricate examples

Deliverables:

- Similar cases match section 9.3.

### Phase 8: Add Canonical Frontend Adapter API

Goal:

Expose the stable endpoints Julia expects while keeping `/api/recommendations` as a temporary compatibility endpoint.

Tasks:

1. Add `GET /api/sites`:
   - returns map/list-ready ranked sites
   - includes `region`, `generated_at`, and `sites`

2. Add `GET /api/sites/[site_id]`:
   - returns `{ site_features, model_prediction, recommendation, critic, similar_cases }`

3. Add `POST /api/sites/[site_id]/brief`:
   - accepts `{ audience, length }`
   - returns `{ brief, critic }`

4. Optional but valuable:
   - add `GET /api/agent-trace/[site_id]`
   - return deterministic trace steps for data ingestion, ranker, recommendation, critic, and brief

Deliverables:

- Frontend can use the exact endpoints in `AGENT_STRUCTURE.md`.
- Old `/api/recommendations` still works for backward compatibility until removed.

### Phase 9: Add Contract and Sample Response Files

Goal:

Put Chirag-owned artifacts where the team expects them.

Tasks:

1. Create:
   - `api/contracts/site_feature.schema.json`
   - `api/contracts/model_prediction.schema.json`
   - `api/contracts/recommendation.schema.json`
   - `api/contracts/evidence_critic.schema.json`
   - `api/contracts/project_brief.schema.json`

2. Create:
   - `api/sample_responses/sites.json`
   - `api/sample_responses/site_detail_SWE-001.json`
   - `api/sample_responses/brief_SWE-001.json`

3. Create:
   - `agents/sample_inputs/SWE-001.site_features.json`
   - `agents/sample_inputs/SWE-001.model_prediction.json`
   - `agents/sample_outputs/SWE-001.recommendation.json`
   - `agents/sample_outputs/SWE-001.critic.json`
   - `agents/sample_outputs/SWE-001.brief.json`

Deliverables:

- Contracts documented outside code.
- Julia can build from sample responses without running live generation.

### Phase 10: Optional OpenAI/Agents SDK Layer

Goal:

Align with the full agentic direction after deterministic contracts are stable.

Tasks:

1. Add prompt placeholders:
   - `agents/prompts/recommendation_agent.md`
   - `agents/prompts/evidence_critic_agent.md`
   - `agents/prompts/project_brief_agent.md`
   - `agents/prompts/similar_cases_agent.md`

2. Add structured output schemas that match `api/contracts`.

3. Add provider boundary:
   - OpenAI gets only feature JSON, prediction JSON, and retrieved context snippets.
   - OpenAI does not compute raster features.
   - OpenAI does not invent missing data.

4. Add cached fallback:
   - if OpenAI fails, return deterministic output from the current TypeScript implementation.

Deliverables:

- Visible agent architecture for demo/prize narrative.
- Stable fallback for live demo.

## Recommended Immediate Next Steps

Build in this order:

1. Add canonical types and adapters.
2. Add prediction support and sample predictions.
3. Add evidence refs to recommendations.
4. Add evidence critic.
5. Add canonical `/api/sites` endpoints.
6. Add canonical brief shape.
7. Add sample response files for Julia.
8. Only then add optional OpenAI/Agents SDK live calls.

## Keep From Current Implementation

Do not throw away the current reasoning layer. These parts are useful and should be reused:

- scoring formulas as rule-based fallback,
- intervention classifier rules,
- risk detector and field-validation questions,
- local similar-case corpus,
- explanation text generation,
- runtime input validation approach,
- `/api/recommendations` as a temporary compatibility route.

## Main Principle

Move from "nested Patrick object -> direct recommendation" to:

```text
site_features + model_prediction
  -> recommendation
  -> similar cases
  -> evidence critic
  -> project brief
  -> frontend adapter response
```

This aligns Chirag's layer with `AGENT_STRUCTURE.md` while preserving the working MVP intelligence code already built.
