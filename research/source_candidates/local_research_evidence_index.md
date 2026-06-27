# Local Research Evidence Index

Prepared: 2026-06-27

This index turns the committed PDF bundle into an explicit evidence foundation.
It is for explanations, citations, assumptions, caveats, and future QA. It is
not a scoring layer by itself.

## Use Rules

- Use these sources for narrative and methodological support first.
- Do not promote a paper-derived value into scoring unless it has geography,
  date, units, citation, extraction method, and manual QA.
- Do not extrapolate local studies nationally.
- Keep official national reports separate from local theses/case studies.
- Treat unreadable/scanned PDFs as blocked until OCR or manual extraction.

## Evidence Matrix

| File | Evidence Type | Geography | Main Topics | Current Use Class | Scoring Eligibility | Extraction Status | Next QA Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `2026_submission_frel_frl_eth_final.pdf` | Official UNFCCC FREL/FRL submission | Ethiopia national; biome strata | Forest definition, REDD+ activities, carbon pools, emission/removal factors, historical period, forest degradation, uncertainty | official_context | Eligible for methods/coefficient context after table-level QA; not a raster layer | Text readable; tables listed | Extract forest definition, pools/gases, biome strata, emission/removal factor tables, uncertainty method |
| `National-Forest-Inventory-Final-Report_2018-compressed-compressed_compressed.pdf` | Official national forest inventory report | Ethiopia national; forest/biome strata | NFI sampling, forest definitions, biomass/carbon stocks, tree species, disturbance, governance | official_context | Eligible for national assumptions and QA; raw plot/raster data absent | Text readable; table of contents readable | Extract biomass/carbon stock tables, forest definitions, species/biodiversity sections, disturbance indicators |
| `ETH_FOREST_COVER-_DEFORESTATION_report_final_EFD_JUNE_2024.pdf` | Official forest-cover mapping report | Ethiopia national | 2023 forest cover, 2020-2023 change, Planet NICFI methods, accuracy assessment, bias-corrected areas | official_context | Eligible for QA/context; direct scoring requires original raster/vector/reference data | Text readable | Extract map class definitions, confusion matrix, adjusted area estimates, recommendations; request original map assets |
| `Ethiopia_First BUR.pdf` | Official UNFCCC Biennial Update Report | Ethiopia national | GHG inventory, AFOLU, climate policy, Green Legacy Initiative, mitigation/adaptation framing | context_only | Not direct scoring; use for reporting alignment and policy context | Text readable | Extract AFOLU/forest accounting references and policy framing relevant to current-state summaries |
| `R-PP Ethiopia-final May 25-2011.pdf` | REDD readiness proposal | Ethiopia national; REDD planning | Drivers, stakeholder consultation, REDD strategy, monitoring system design, older forest-cover context | context_only | Not current enough for scoring coefficients | Text readable | Extract driver/stakeholder/MRV context only; avoid older quantitative forest-cover estimates in current scoring |
| `Sixth-national-report-on-the-implementation-of-NBSAP-2015-2020.pdf` | National biodiversity policy/report | Ethiopia national | NBSAP implementation, biodiversity targets, protected areas, invasive species, ecosystem services, agrobiodiversity | context_only | Not direct scoring; supports biodiversity/safeguard narrative | Text readable enough; encrypted but copyable | Extract policy targets, threat categories, ecosystem-service framing, protected-area context |
| `Biodiversity-Indicators-for-Ethiopia-English.pdf` | Biodiversity indicator report | Ethiopia national | Indicator species, biodiversity monitoring, national biodiversity status framing | context_only | Not direct scoring; useful for indicator vocabulary and report framing | Text readable | Extract indicator categories and any cited biodiversity-monitoring concepts |
| `GBIF_CountryReport_ET.pdf` | GBIF country activity report | Ethiopia national | GBIF mobilization/use, occurrence counts by kingdom, data availability | context_only / source_QA | Not direct scoring; live GBIF API remains the recheckable source | Text readable | Use to explain GBIF coverage limits; prefer live API counts for current artifacts |
| `Alemayehu Haile.pdf` | Local MSc thesis | Gimbo District, Southern Ethiopia | Soil fertility degradation, soil management practices, local land management | local_context | Potential candidate-context match for `SWE-007`/Gimbo only after manual table QA | Text readable | Extract study sites, soil variables, management practice findings, coordinates/maps if present |
| `Wondimu Mamo.pdf` | Local PhD dissertation | Bururi Catchment, Western Ethiopia | Land-use/cover dynamics, erosion rate, soil quality, SOC and total nitrogen stock | local_context | Possible comparable-landscape context after manual QA; do not extrapolate nationally | Text readable | Extract study geography, LULC periods, erosion/SOC/TN tables, methods, and whether coordinates are usable |
| `migration-conservation-bale-mountains-ecosystem-report.pdf` | Local conservation/livelihood report | Bale Mountains ecosystem, BMNP, Harenna Forest | Migration, forest pressure, grazing, forest coffee, agricultural encroachment, conservation impacts | local_context | Context only unless specific geographies are matched and QAed | Text readable | Extract pressure pathways and governance/livelihood caveats for comparable forest-edge landscapes |
| `MammalsofBaleMountansNationaPark_Walia-SpecialEdition.pdf` | Local biodiversity paper/report | Bale Mountains National Park | Mammal biodiversity context, potentially endemic/threatened species | blocked_ocr | Not eligible until OCR/manual extraction succeeds | `pdftotext` returned effectively empty pages | OCR or manually transcribe title, species list, geography, date, and citation before use |

## Candidate Relevance Notes

- `Alemayehu Haile.pdf` is the strongest local paper match because the study is
  explicitly about Gimbo District, and the current candidate list includes
  `SWE-007` in Gimbo.
- Bale Mountains reports are geographically local and useful for biodiversity
  and pressure narratives, but they should not be used to score South Omo or
  Southwest Ethiopia candidates unless clearly marked as comparable-landscape
  context.
- National FREL/FRL, NFI, forest-cover, BUR, NBSAP, and indicator reports are
  strong for justification, definitions, coefficients, and caveats, but they do
  not replace the source-derived spatial layers.

## Recommended Derived Artifact

Create this later after manual QA:

```text
data/features/source_extracts/local_research_context.json
```

Suggested row shape:

```json
{
  "site_id": "SWE-007",
  "matched_source_count": 1,
  "matched_sources": [
    {
      "file": "Alemayehu Haile.pdf",
      "match_type": "explicit_district",
      "topics": ["soil_fertility_degradation", "soil_management"],
      "evidence_confidence": "contextual_pending_manual_table_qa"
    }
  ],
  "source_status": "context_derived"
}
```

Do not let this artifact affect priority scores until the scoring role is
reviewed explicitly.
