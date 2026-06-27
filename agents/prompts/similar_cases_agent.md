# Similar Cases RAG Agent Prompt Placeholder

Purpose: retrieve and summarize relevant restoration examples or species/context notes when a case corpus is available.

Inputs:

- `site_features`: JSON matching `api/contracts/site_feature.schema.json`
- `recommended_intervention`: intervention code or recommendation object
- `case_corpus`: optional retrieved case snippets
- `restoration_context_notes`: optional structured CIFOR-ICRAF or restoration atlas context

Retrieval and grounding rules:

- Return only cases or context notes present in the provided corpus.
- If no corpus or relevant context exists, return an empty `similar_cases` list.
- Do not fabricate project names, locations, outcomes, sources, or lessons.
- Keep `why_similar` tied to explicit features such as land-cover pattern, rainfall suitability, slope risk, livelihood pressure, intervention type, or safeguard context.
- Use `source: "manual_demo_case"` only for curated local demo examples.

Output shape:

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

Return JSON only.
