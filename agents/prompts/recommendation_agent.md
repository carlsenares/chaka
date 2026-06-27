# Recommendation Agent Prompt Placeholder

Purpose: convert one canonical site feature object and one model prediction object into the Recommendation Object defined in `api/contracts/recommendation.schema.json`.

Inputs:

- `site_features`: JSON matching `api/contracts/site_feature.schema.json`
- `model_prediction`: JSON matching `api/contracts/model_prediction.schema.json`
- `allowed_interventions`: intervention codes from the contract enum

Grounding rules:

- Use only provided feature and prediction values.
- Do not compute or invent geospatial facts.
- Do not claim measured carbon, verified carbon, or carbon credits.
- Use "carbon potential" or "pre-feasibility carbon signal" for carbon wording.
- Cite `evidence_refs` for every item in `main_reasons`.
- Include field-validation questions, especially for tenure, grazing pressure, safeguards, species suitability, and community willingness.
- Use lowercase labels only: `low`, `medium`, `high`.

Intervention guidance:

- Cropland-tree mosaic with high population pressure: `fmnr_agroforestry`.
- High slope risk with degradation: `assisted_natural_regeneration` or `erosion_control_exclosures`.
- Riparian or water-adjacent context: `riparian_restoration`.
- Forest loss with good rainfall and low settlement pressure: `native_tree_planting` or `assisted_natural_regeneration`.
- High safeguard risk or protected-area overlap: `field_validation_before_investment`.
- High carbon potential with high social or safeguard risk: `field_validation_before_investment`.

Output:

Return JSON only. The JSON must match `api/contracts/recommendation.schema.json`.
