# MVP Methodology and Validity

This document explains what the first Chaka data pipeline can validly claim, how to validate it, and where field or partner data is still required.

## MVP Purpose

The MVP is a pre-feasibility screening tool for restoration prioritization in Ethiopia.

It helps answer:

- Which geographic areas appear promising for restoration investment?
- Why does the data suggest carbon, biodiversity, water/soil, and livelihood potential?
- Which areas need field validation before investment or carbon claims?

It does not prove:

- verified carbon credits,
- exact biomass/carbon stock,
- community willingness,
- land tenure security,
- exact implementation cost,
- final project boundaries,
- species survival rates.

## Candidate Areas

The first MVP started with deterministic candidate grid cells inside two target regions from the data matrix:

- South Ethiopia (`SET`)
- Southwest Ethiopia Peoples' Region (`SWE`)

For the demo map, the candidate set has been expanded to 32 screening cells so the map has broader national coverage:

- 8 in South Ethiopia (`SET`)
- 8 in Southwest Ethiopia Peoples' Region (`SWE`)
- 4 in Tigray (`TIG`)
- 4 in Amhara (`AMH`)
- 4 in Oromia (`ORO`)
- 4 in Gambela (`GAM`)

The candidate areas are generated from HDX/OCHA Ethiopia administrative boundaries and written to:

```text
data/processed/aoi_boundaries.geojson
data/processed/aoi_lookup.csv
data/processed/candidate_sites.geojson
```

Current candidate cells are approximately 2,500 hectares each. This fits the challenge framing of restoration areas in the "10 to 1000s of hectares" range, but these cells should be treated as screening units, not final implementation parcels.

Future versions can support multiple scales:

- 10-100 ha: pilot parcels or field validation plots,
- 100-1,000 ha: project candidates,
- 1,000-10,000+ ha: landscape screening units.

## Data Source Roles

Each source has a specific role. No single source determines the final priority.

| Dimension | Sources | MVP use | Main caveat |
| --- | --- | --- | --- |
| AOI and labels | HDX/OCHA Admin 0-3 | Region, zone, woreda, candidate geometry | Administrative boundaries may need future crosswalk checks. |
| Carbon potential | Sentinel-2, Landsat, ESA WorldCover, GFW/UMD, SoilGrids | Vegetation condition, trend, tree-cover context, soil carbon proxy | Proxy only; not measured project carbon. |
| Biodiversity potential | ESA WorldCover, WDPA, restoration/species context | Habitat/land-cover context and safeguard flags | Not a field biodiversity baseline. |
| Water/soil resilience | CHIRPS, SRTM, SoilGrids | Rainfall suitability, slope/erosion proxy, soil suitability | Coarse datasets cannot replace local hydrology or erosion surveys. |
| Livelihood benefit | WorldPop, GHSL, OSM/HOTOSM | Population pressure and access proxies | Does not prove community willingness or tenure. |
| Safeguards/risk | WDPA, settlement/access proxies | Protected-area overlap and review flags | Protected-area overlap is a review trigger, not an automatic decision. |

## Scoring Direction

Higher final priority means higher restoration investment priority.

The first scoring model should separate:

- restoration need,
- carbon potential,
- biodiversity improvement potential,
- water/soil resilience,
- livelihood relevance,
- feasibility/risk,
- data quality.

Initial fixed weighting assumption:

| Factor | Weight |
| --- | ---: |
| Carbon potential | 35% |
| Biodiversity improvement | 30% |
| Water/soil resilience | 15% |
| Livelihood benefit | 15% |
| Feasibility/risk adjustment | 5% |

These weights are MVP defaults. Carbon and biodiversity are emphasized because
they are central challenge dimensions. Rainfall is not directly averaged into
carbon; it is used as a carbon-establishment feasibility multiplier. Later, the
frontend can expose sliders so users can adjust priorities for carbon,
biodiversity, water/soil, and livelihood.

## Model Role

The first MVP should use deterministic or rule-based scoring. A trained model should start only after we have:

- candidate geometries,
- extracted feature rows,
- labels or weak labels.

Acceptable early label sources:

- expert labels,
- restoration atlas priority classes,
- MfM historical project outcomes,
- transparent weak labels from rules.

Until real outcome labels exist, outputs should use:

```text
prediction_quality: "rule_based_fallback"
```

or:

```text
prediction_quality: "weak_supervised_demo"
```

The deterministic feature layer remains necessary even after training because it makes the ranking explainable and auditable.

## LLM and RAG Role

LLM reasoning is not the source of geospatial truth.

The LLM layer should read structured artifacts:

```text
data/features/site_features.json
models/artifacts/site_predictions.json
```

Then it can produce:

- recommendations,
- risk explanations,
- field-validation questions,
- evidence checks,
- project briefs.

RAG is optional for the first MVP. It is useful later for:

- restoration case studies,
- MfM reports,
- species guidance,
- similar-country investments,
- project outcomes and lessons learned.

RAG should not generate numeric map scores.

## Validation Layers

### 1. Source Validation

Check that every registered source has a credible URL and documented role.

Command:

```bash
npm run data:registry:check
```

The local URL-check report is written to:

```text
data/catalog/source_url_checks.local.json
```

### 2. Geometry Validation

Check that candidate sites are structurally valid.

Command:

```bash
npm run data:candidates:validate
```

This checks:

- GeoJSON shape,
- unique `site_id`,
- `site_id` format,
- area range,
- centroid inside AOI,
- required properties,
- zone/woreda label availability.

### 3. Feature Validation

The feature extraction script should validate:

- units,
- score ranges,
- null values,
- source references,
- whether each feature is real, weak, mock, or missing.

If a feature cannot be computed, use `null` and add a data-quality note. Do not invent values silently.

### 4. Scoring Validation

The model report should document:

- score formula or model type,
- feature list,
- weights,
- what is real vs proxy vs mock,
- known limitations,
- required field validation.

## Presentation Language

Use:

```text
carbon potential
pre-feasibility carbon signal
restoration investment priority
field validation required
proxy-based screening
```

Avoid:

```text
verified carbon
guaranteed sequestration
final project selection
community-approved
investment-ready without validation
```
