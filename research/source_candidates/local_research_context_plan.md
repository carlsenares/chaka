# Local Research Context Plan

Prepared: 2026-06-27

The supplied local research PDFs should be kept in the project, but most should
not become direct numeric scoring layers yet. They are valuable because they let
the system cite Ethiopian and local research in current-state analysis,
explanations, assumptions, and caveats.

## Decision

Use local research as a citable context/evidence layer first.

Do not convert local reports or theses into scoring features unless the source
has clear geography, structured values, usable dates, and a scope that matches
the candidate sites.

## Intended Uses

- current-state summaries for candidate areas and comparable landscapes;
- soil degradation, erosion, forest pressure, migration, grazing, forest coffee,
  livelihood, and restoration-adoption context;
- national forest definitions, MRV methods, coefficients, and uncertainty
  language from official reports;
- policy alignment and reporting language from NBSAP, BUR, R-PP, and biodiversity
  indicator documents;
- source-specific caveats for final recommendations.

## Non-Uses For Now

- no direct scoring from narrative PDFs;
- no national extrapolation from local theses or case studies;
- no values from scanned or poorly extracted PDFs until OCR/manual QA is done;
- no paper-derived values in committed artifacts without citation, geography,
  date, units, and confidence metadata.

## Proposed Artifact

Create a source-derived context artifact later:

```text
data/features/source_extracts/local_research_context.json
```

Expected row shape:

```json
{
  "site_id": "SET-003",
  "matched_source_count": 2,
  "topics": ["soil_degradation", "forest_pressure", "livelihood_pressure"],
  "nearest_research_area": "Bale Mountains",
  "evidence_confidence": "contextual",
  "source_status": "context_derived"
}
```

This artifact should support reporting and explanations. It should not affect
priority scores until specific source facts have been promoted through a
separate reviewed scoring decision.

## First Extraction Pass

1. Build a hand-curated evidence index from the local PDFs.
2. For each source, record title, year, geography, topics, evidence type,
   candidate relevance, extraction status, and confidence.
3. Match sources to candidates by explicit geography first, then by comparable
   landscape only when clearly labeled as contextual.
4. Keep short summaries in markdown/JSON, not long copied text.
5. Mark the Bale mammals PDF as `blocked_ocr` until text or tables are recovered.

