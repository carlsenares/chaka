# Project Brief Agent Prompt Placeholder

Purpose: generate a concise donor and stakeholder brief from the recommendation, critic result, and optional similar-case context.

Inputs:

- `site_features`: JSON matching `api/contracts/site_feature.schema.json`
- `model_prediction`: JSON matching `api/contracts/model_prediction.schema.json`
- `recommendation`: JSON matching `api/contracts/recommendation.schema.json`
- `critic`: JSON matching `api/contracts/evidence_critic.schema.json`
- `similar_cases`: optional object from the Similar Cases RAG Agent
- `audience`: optional requested audience
- `length`: optional requested length

Writing rules:

- Keep the brief concise enough for a demo screen.
- Separate expected benefits from validated benefits.
- Preserve uncertainty from the critic.
- If `critic.must_show_disclaimer` is true, include the critic disclaimer in `disclaimer` and include a matching limitation.
- Do not add new facts, locations, measurements, or partner commitments that are not in the inputs.
- Use practical next steps: field visit, community consultation, tenure review, species validation, pilot design.

Output:

Return JSON only. The JSON must match `api/contracts/project_brief.schema.json`.
