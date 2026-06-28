# Local Knowledge Layer

## Purpose

The numerical score should stay grounded in structured, source-derived datasets:
admin geometry, land cover, rainfall, terrain, forest change, soil, population,
access, settlement, water productivity, and similar reproducible layers.

Local papers, reports, theses, and field notes should be used as a separate
retrieval-backed knowledge layer. Their job is to flag local implementation
risks, opportunities, and field-validation questions for a proposed investment
idea, not to silently overwrite the score.

Example:

- The scoring pipeline ranks a site highly for assisted tree regeneration.
- The local knowledge layer retrieves a nearby study that reports grazing
  pressure or seedling browsing.
- The frontend shows a cited caveat: tree planting may need enclosure,
  community grazing agreements, species selection, or early maintenance.

## Why Keep It Separate

- Structured geospatial layers are better for comparable scoring across all
  candidate sites.
- Local papers are often geographically narrow, partly subjective, older, or
  methodologically inconsistent.
- Treating papers as caveats preserves their value without pretending they are
  uniform national rasters.
- This makes the system more defensible: the score is reproducible, while local
  research explains how an intervention might need to adapt.

## Evidence Card Schema

Each extracted paper/report fact should become a small evidence card:

```json
{
  "evidence_id": "local_research:wondimu_mamo:erosion_001",
  "source_id": "local_research_source:wondimu_mamo",
  "filename": "Wondimu Mamo.pdf",
  "source_type": "local_thesis_or_report",
  "title": "Short source title",
  "year": 2020,
  "geography": {
    "country": "Ethiopia",
    "region": "Southwest Ethiopia",
    "zone": "Kefa",
    "woreda": null,
    "place_names": []
  },
  "topics": ["erosion", "soil", "land_management"],
  "intervention_tags": ["tree_planting", "agroforestry", "soil_conservation"],
  "claim": "One concise, source-grounded claim.",
  "evidence_quote": "Short quote or table reference when permitted.",
  "citation_locator": "page/table/section",
  "confidence": "medium",
  "allowed_use": "implementation_caveat",
  "not_allowed_use": "direct_score_override",
  "review_status": "needs_manual_qa"
}
```

## Source Validity Weighting

Use confidence as retrieval/ranking metadata, not as a hidden score modifier.

| Evidence Type | Default Confidence | Notes |
| --- | --- | --- |
| Official national inventory/report with methods | High | Good for definitions, coefficients, MRV context, and national priors. |
| Peer-reviewed local study with clear methods | Medium-high | Strong for local caveats if geography matches. |
| Thesis or local report with methods but limited review | Medium | Useful for field questions and implementation notes. |
| NGO/project report | Medium-low | Useful for operational context; watch for advocacy bias. |
| Anecdotal/uncited statement | Low | Do not show unless manually approved. |
| OCR-blocked or unreadable source | Excluded | Do not use until text is recovered and reviewed. |

## Geographic Match Hierarchy

Retrieved evidence should be ranked by location match:

1. Same candidate polygon or named local place.
2. Same woreda.
3. Same zone.
4. Same region and similar agroecology.
5. National context only.

The frontend should label broad matches clearly. National context should not be
presented as a site-specific finding.

## LLM Contract

The LLM may:

- summarize retrieved evidence cards;
- identify caveats for a specific investment idea;
- suggest field-validation questions;
- suggest intervention adjustments;
- cite evidence cards and source locators.

The LLM must not:

- invent uncited local facts;
- claim absence of a risk because no paper mentioned it;
- override the numerical score;
- use OCR-blocked sources;
- cite a source that was not retrieved.

## Frontend Output

Recommended sections on a candidate/investment page:

- Local knowledge warnings
- Intervention adaptations
- Field checks before funding
- Supporting citations

This makes local research visible and valuable while keeping the scoring system
auditable.
