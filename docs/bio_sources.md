# Biodiversity Source Acquisition Plan

This document tells a future agent or teammate exactly which biodiversity
sources to get, how to get them, and how they should enter Chaka.

Do not treat biodiversity sources as interchangeable. Split them into:

- observed biodiversity records;
- conservation-priority polygons;
- threatened-species range context;
- modeled biodiversity condition;
- local field or project evidence.

Only validated, spatially explicit, licensed sources may become scoring layers.
Everything else should remain context or validation evidence.

## Current State

Already implemented:

- GBIF candidate-polygon occurrence context:
  - script: `scripts/extract-gbif-biodiversity.py`
  - output: `data/features/source_extracts/gbif_biodiversity.json`
  - integrated under `source_extracts.biodiversity_observations`

Current limitations:

- Candidate polygons are small, so filtered GBIF records are sparse.
- Raw occurrence counts mostly measure sampling effort, not true biodiversity.
- KBA, IUCN, eBird EBD, and stronger modeled condition layers are not yet
  integrated.

## Priority 1: GBIF Observations

Purpose:

- observed plants, birds, and other taxa;
- data-gap flags;
- positive-only biodiversity context;
- future species-richness proxy with bias controls.

Website:

```text
https://www.gbif.org/
```

API docs:

```text
https://techdocs.gbif.org/en/openapi/v1/occurrence
https://techdocs.gbif.org/en/data-use/api-downloads
```

Exact website steps:

1. Go to `https://www.gbif.org/`.
2. Create or log in to a GBIF account if a DOI-backed download is needed.
3. Search for Ethiopia occurrence data with coordinates.
4. Use filters:
   - Country or area: Ethiopia.
   - Has coordinate: yes.
   - Occurrence status: present.
   - Has geospatial issue: false.
   - Date: prefer 2000-current for current context.
   - Basis of record: human observation, machine observation, preserved
     specimen, material sample.
   - License: CC0, CC-BY, CC-BY-NC where project use allows it.
5. Download through GBIF if a citable DOI is needed.
6. Record the download DOI, query filters, date, license mix, and citation.

Agent implementation instructions:

- Extend `scripts/extract-gbif-biodiversity.py` with optional buffer mode:
  `--buffer-km 5`, `--buffer-km 10`, `--buffer-km 25`.
- Keep polygon-internal records separate from buffered records.
- Add effort/bias indicators:
  - distance to road or settlement;
  - record age;
  - coordinate uncertainty;
  - basis-of-record mix;
  - top publisher/dataset concentration.
- Do not score raw record count directly.
- Use GBIF as positive context only unless bias correction is explicitly added.

Recommended output fields:

```json
{
  "site_id": "SWE-007",
  "source_status": "source_derived",
  "occurrence_count_polygon": 8,
  "occurrence_count_buffer_10km": 120,
  "species_count_buffer_10km": 64,
  "plant_species_count": 22,
  "bird_species_count": 31,
  "recent_occurrence_count_5y": 40,
  "sampling_bias_risk_score": 70,
  "biodiversity_context_score": null,
  "scoring_policy": "context_only_until_bias_handled"
}
```

## Priority 2: Key Biodiversity Areas / WDKBA

Purpose:

- conservation-priority polygons;
- overlap/nearby KBA context;
- connectivity and buffer-restoration opportunity;
- safeguard and biodiversity opportunity flag.

Website:

```text
https://www.keybiodiversityareas.org/
```

GIS request page:

```text
https://www.keybiodiversityareas.org/request-gis-data
```

Exact website steps:

1. Go to `https://www.keybiodiversityareas.org/request-gis-data`.
2. Use an NGO or project email address.
3. Fill in the non-commercial data request form.
4. Request GIS data for Ethiopia.
5. Explain intended use:
   - non-commercial restoration-prioritization screening;
   - internal NGO decision support;
   - no redistribution of raw KBA data in public git.
6. Wait for approval. The KBA page says requests normally take 5-10 working days.
7. When data arrives, store raw files outside git under `data/raw/kba/`.
8. Save license/terms, request confirmation, and citation in:
   `data/catalog/restricted_source_licenses/kba.json`.

Agent implementation instructions:

- Add local-file-only extractor, not live scraper:
  `scripts/extract-kba-context.py --input <path-to-kba-vector>`.
- Accept GeoPackage, GeoJSON, or Shapefile.
- Do not commit raw KBA files unless the license explicitly allows it.
- Summarize only derived context:
  - candidate overlap percent;
  - nearest KBA distance;
  - nearest KBA name/id if terms allow;
  - KBA trigger summary if terms allow;
  - source license status.
- Do not directly overwrite `safeguard_risk_score` yet.

Recommended output block:

```json
"source_extracts": {
  "conservation_priority_context": {
    "dataset_id": "kba_world_database",
    "status": "source_derived_restricted",
    "kba_overlap_pct": 0,
    "nearest_kba_distance_km": 12.4,
    "nearest_kba_name": "name_if_terms_allow",
    "scoring_policy": "context_only_until_safeguard_review"
  }
}
```

## Priority 3: IUCN Red List Spatial Data

Purpose:

- threatened-species potential range context;
- biodiversity safeguard and survey-priority layer;
- species-context caveats for project briefs.

Website:

```text
https://www.iucnredlist.org/
```

Spatial download page:

```text
https://www.iucnredlist.org/resources/spatial-data-download
```

Other spatial products:

```text
https://www.iucnredlist.org/resources/other-spatial-downloads
```

Exact website steps:

1. Go to `https://www.iucnredlist.org/resources/spatial-data-download`.
2. Read and accept the terms for spatial data.
3. Download relevant taxonomic groups for Ethiopia.
4. Prioritize:
   - birds;
   - mammals;
   - amphibians;
   - plants if available and relevant;
   - species richness / rarity-weighted richness products if terms allow.
5. Store raw files outside git under `data/raw/iucn_red_list/`.
6. Save terms, version/date, taxon groups, and citation in:
   `data/catalog/restricted_source_licenses/iucn_red_list.json`.

Agent implementation instructions:

- Add local-file-only extractor:
  `scripts/extract-iucn-threatened-context.py --input <path>`.
- Filter to:
  - presence: extant or probably extant;
  - origin: native or reintroduced;
  - categories: CR, EN, VU, NT where appropriate.
- Refine range overlaps by habitat/elevation/land cover before scoring.
- Raw IUCN range overlap must not be treated as confirmed presence.
- Output should be context and field-survey priority first.

Recommended output block:

```json
"source_extracts": {
  "threatened_species_context": {
    "dataset_id": "iucn_red_list_spatial",
    "status": "source_derived_restricted",
    "potential_threatened_species_count": 6,
    "potential_cr_en_species_count": 2,
    "range_overlap_area_ha": 1430,
    "habitat_refinement_status": "pending",
    "scoring_policy": "context_only_until_habitat_refined"
  }
}
```

## Priority 4: eBird Basic Dataset

Purpose:

- bird observations with effort/checklist metadata;
- stronger bird-richness and sampling-effort correction than GBIF/EOD alone.

Website:

```text
https://science.ebird.org/en/use-ebird-data/download-ebird-data-products
```

Access note:

- eBird raw data are available for non-commercial use after a request.
- The eBird Basic Dataset is the main raw dataset.
- The request flow is available from the eBird site footer through
  `Request Data`.

Exact website steps:

1. Go to `https://science.ebird.org/en/use-ebird-data/download-ebird-data-products`.
2. Create or log in to a Cornell/eBird account.
3. Scroll to the raw data / eBird Basic Dataset section.
4. Click `Request Data` or the lock icon from the eBird site footer.
5. Fill in the data request form:
   - project: Chaka restoration prioritization for Ethiopia;
   - use: non-commercial NGO decision support;
   - geography: Ethiopia;
   - requested product: eBird Basic Dataset.
6. After approval, download the Ethiopia subset if offered; otherwise download
   the full file and subset locally.
7. Store raw data outside git under `data/raw/ebird/`.
8. Save approval/terms/citation in:
   `data/catalog/restricted_source_licenses/ebird.json`.

Agent implementation instructions:

- Add local-file-only extractor:
  `scripts/extract-ebird-context.py --input <EBD.txt>`.
- Filter to Ethiopia and relevant dates.
- Use checklist effort metadata:
  - duration;
  - distance;
  - protocol;
  - observer effort;
  - complete checklist flag.
- Produce bias-aware bird context:
  - species count by candidate/buffer;
  - checklist count;
  - records per checklist;
  - recent records;
  - data deficiency flags.
- Do not merge eBird counts with GBIF counts naively.

## Priority 5: NHM Biodiversity Intactness Index

Purpose:

- modeled biodiversity intactness / pressure context;
- broad ecosystem-condition signal where observations are sparse.

Website:

```text
https://data.nhm.ac.uk/dataset/bii-developed-by-nhm-v2-1-1-limited-release
```

Exact website steps:

1. Open the NHM BII dataset page.
2. Review license terms. The current package is non-commercial / limited
   release.
3. Download the ZIP manually if browser access works.
4. Store raw ZIP outside git under `data/raw/nhm_bii/`.
5. Extract the 2020 raster or latest available raster.
6. Save license and citation in:
   `data/catalog/restricted_source_licenses/nhm_bii.json`.

Agent implementation instructions:

- Add local-raster extractor:
  `scripts/extract-bii-context.py --input-raster <path>`.
- Summarize mean/median BII by candidate polygon.
- Use as `source_extracts.biodiversity_condition_context`.
- Do not use as direct species evidence.

## Priority 6: NGO / Field Biodiversity Uploads

Purpose:

- best long-term source for local truth;
- field survey validation;
- model labels for future supervised learning.

Accepted upload types:

- species survey spreadsheet with coordinates;
- tree plot inventory;
- bird transect/checklist;
- camera-trap summaries;
- biodiversity monitoring report;
- local ecological knowledge interview notes;
- licensed KBA/IUCN/eBird files obtained by the NGO.

Required metadata:

```text
source owner
license / permission
survey date
coordinates or named geography
method
taxon group
observer / organization
coordinate uncertainty if known
```

Classification:

| Upload type | Ingestion class | Score use |
| --- | --- | --- |
| Field species/plot data with coordinates and methods | `validation_anchor` | confidence/calibration first |
| Licensed KBA/IUCN/eBird layer | `restricted_scoring_or_context_layer` | after terms review |
| PDF report or thesis | `local_knowledge_layer` | no direct score override |
| Expert ranking of sites | `weak_label_source` | future model training |
| File without license/geography | `blocked_review_required` | no |

## Recommended Biodiversity Formula Once Sources Are Available

Future biodiversity score:

```text
biodiversity_score =
  habitat_structure        * 0.35
+ restoration_uplift       * 0.25
+ conservation_priority    * 0.25
+ observed_species_context * 0.10
- pressure_penalty
```

Where:

- `habitat_structure`: ESA WorldCover, tree/grassland/cropland mosaic.
- `restoration_uplift`: forest loss and vegetation opportunity.
- `conservation_priority`: KBA, IUCN, WDPA, refined threatened-species ranges.
- `observed_species_context`: GBIF/eBird/field observations, bias-aware and
  positive-only.
- `pressure_penalty`: built-up, settlement, safeguard risk.

Do not raise biodiversity weight back above carbon until at least one
conservation-priority layer or field biodiversity validation layer is available.
