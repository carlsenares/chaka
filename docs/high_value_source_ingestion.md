# High-Value Source Ingestion

This note tracks the stronger data sources that should upgrade Chaka beyond the
current proxy-heavy MVP.

## Scanner

Run:

```bash
npm run data:sources:updates
```

Output:

```text
data/catalog/high_value_source_status.json
```

The scanner checks metadata freshness and access status for high-value sources.
It does not mean every source is safe to score directly. Each source is tagged
with `scoring_classification` and a caveat.

## Use First

### GFW Forest Carbon Flux

Sources:

- `gfw_forest_carbon_gross_removals`
- `gfw_forest_carbon_gross_emissions`
- `gfw_forest_carbon_net_flux`

Use:

- carbon flux context;
- carbon-risk context;
- future carbon score calibration.

Do not mix gross removals, emissions, and net flux into one score without a
named transformation. Do not present these modelled layers as verified project
carbon.

Current status:

- WRI metadata API is reachable.
- Tile metadata for Ethiopia-relevant tiles can be discovered.
- Runtime download of tiles may be blocked by 403 from the data API in this
  environment, so keep raster extraction out of the default pipeline until the
  download path is confirmed.

Implemented command:

```bash
npm run data:gfw-carbon
```

The command writes `data/features/source_extracts/gfw_carbon_flux.json`. When
tile downloads are blocked, it records `source_status: "blocked_download"` and a
blocker object rather than inventing values.

### ESA CCI Biomass

Use:

- wall-to-wall above-ground biomass stock context;
- uncertainty-aware carbon-stock screening;
- future calibration of carbon potential.

Current status:

- CEDA JSON listing and tile downloads are reachable without credentials from
  this environment.
- Implemented as context-only under `source_extracts.carbon_stock_context`.
- Current candidate sites use tile `N10E030` for 2024 AGB and AGB_SD.

Implemented command:

```bash
npm run data:esa-biomass
```

Output:

```text
data/features/source_extracts/esa_cci_biomass.json
```

Do not present ESA CCI AGB as verified project carbon. Convert AGB to carbon
only with an explicit conversion factor and source.

### GBIF / eBird Through GBIF

Use:

- observed biodiversity context;
- data-gap flags;
- possible richness/rarity inputs after bias controls.

Do not use raw record counts as biodiversity quality. Counts mostly reflect
observer effort and road/access bias.

Current status:

- GBIF context extractor exists.
- Current candidate polygons have sparse filtered records, so GBIF remains
  context-only in the ranker.

### WoSIS / AfSIS Soil Observations

Use:

- measured soil observation anchors;
- confidence checks for SoilGrids SOC and pH;
- local soil evidence where nearby observations exist.

Current status:

- Soil-observation extractor exists.
- Coverage is sparse, so it should validate or caveat SoilGrids rather than
  overwrite wall-to-wall soil scores.

## Use Later

### NASA GEDI L4A / L4B

Use:

- biomass/carbon anchor with uncertainty;
- calibration and validation of wall-to-wall biomass products.

Blocker:

- Earthdata/ORNL access and product handling need to preserve quality flags,
  standard error, and footprint/gridded resolution.

## Blocked Or Manual

### KBA / IBAT

Use:

- conservation-priority and safeguard layer;
- biodiversity opportunity around priority sites.

Blocker:

- GIS access and redistribution terms require request, partner access, or
  subscription.

### IUCN Red List Spatial Data

Use:

- threatened-species range context;
- biodiversity gap filling where observations are sparse.

Blocker:

- terms acceptance and range-map limitations. Refine ranges by habitat,
  elevation, and land cover before scoring.

## Admin Upload Classification

When NGO officials upload a file or source, classify it before ingestion:

| Class | Examples | Can affect score? |
| --- | --- | --- |
| `scoring_layer` | raster/vector/table with geography, units, date, license | yes, after validation |
| `validation_anchor` | field biomass, soil samples, survival rates, biodiversity surveys | confidence/calibration first |
| `weak_label_source` | restoration atlas classes, expert rankings, historical outcomes | yes, for future model training |
| `local_knowledge_layer` | PDFs, theses, reports, field notes, interviews | no direct score override |
| `blocked_review_required` | unclear license, missing geography, OCR failure | no |

The deterministic feature layer should remain the audit baseline even after a
trained ranker is added.
