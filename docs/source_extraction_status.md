# Source Extraction Status

This document tracks which feature groups are source-derived and which are still placeholders.

## Current Status

Expansion note: the candidate map now contains 32 screening cells: the original
16 in South Ethiopia and Southwest Ethiopia, plus 16 additional cells in
Tigray, Amhara, Oromia, and Gambela for broader demo coverage. Feature and
prediction artifacts have been regenerated and validated for all 32 sites.
Some source-extract artifacts were originally built for the first 16-site AOI;
expanded-region rows may therefore use deterministic fallback values until the
heavy geospatial extractors are rerun nationally.

| Feature group | Fields | Source status | Source | Notes |
| --- | --- | --- | --- | --- |
| Geometry/admin labels | `site_id`, `region`, `zone`, `woreda`, `area_ha` | Source-derived | HDX/OCHA Ethiopia Admin 1-3 | Generated from downloaded HDX GeoJSON. |
| Land cover | `land_cover_primary`, `land_cover_mix` | Source-derived | ESA WorldCover 2021 v200 | Extracted from public 10m WorldCover COG tiles. |
| Vegetation | `ndvi_current`, `ndvi_trend_5y`, `evi_current` | Partial source-derived for 16/16 sites | Sentinel-2 L2A via Element84 Earth Search; optional Landsat C2 L2 via Planetary Computer | Current NDVI/EVI are extracted from public Sentinel-2 COGs. Landsat 5-year trend is implemented as opt-in because signed COG reads are slow from this environment, so `ndvi_trend_5y` still falls back when trend is not run. |
| Forest context | `forest_loss_score` | Source-derived for 16/16 sites | Hansen Global Forest Change / GFW v1.13 | Extracts tree-cover baseline and loss from official direct-download tiles. Default threshold is 30% tree cover; tree-cover loss is a disturbance proxy, not verified deforestation or carbon loss. |
| Carbon stock context | `source_extracts.carbon_stock_context` | Optional source-derived context for 16/16 sites | ESA CCI Biomass v7.0 2024 | Above-ground biomass and AGB uncertainty from 100m CEDA GeoTIFF tiles. Context-only; does not overwrite carbon score or convert biomass to verified carbon. |
| Carbon flux context | `source_extracts.carbon_flux_context` | Optional metadata/blocker context | GFW/WRI forest carbon gross removals, gross emissions, net flux | Metadata and tile resources are discoverable, but raster downloads currently require a valid API key from this environment. Context-only; no score override. |
| Rainfall | `rainfall_mean_mm`, `rainfall_reliability_score` | Source-derived | CHIRPS v2.0 Africa Monthly 2021-2025 | Extracted from official UCSB monthly GeoTIFFs. Reliability is normalized to 0-100 in `site_features.json`; raw 0-1 reliability is retained in `source_extracts`. |
| Water/productivity context | `source_extracts.water_productivity` | Optional source-derived context | FAO WaPOR v3 L2 annual products | AETI, total biomass production, and biomass water productivity context. Does not overwrite rainfall, carbon, or livelihood scores. |
| Terrain | `slope_mean_deg`, `slope_risk_score` | Source-derived for 16/16 sites | SRTMGL1 | Artifact imported from the coworker SRTM branch and normalized to the current source-extract schema. Raw official `.hgt` tiles remain gitignored. |
| Soil | `soil_organic_carbon_score`, `soil_ph_suitability_score` | Source-derived for 15/16 sites | SoilGrids 2.0 topsoil SOC and pH | Extracted from official ISRIC WebDAV/VRT rasters. `SET-001` has no valid soil pixels, consistent with water-dominant WorldCover. |
| Biodiversity observations | `source_extracts.biodiversity_observations` | Optional source-derived context | GBIF occurrence search API | Observation-density/species context only. Does not overwrite ranker fields or imply absence where records are sparse. |
| Population/livelihood | `population_pressure_score` | Source-derived for 15/16 sites | WorldPop Ethiopia 2020 UN-adjusted population counts | Extracted from official WorldPop 100m GeoTIFF. `SET-001` has no valid population pixels and falls back to OSM's zero-valued mapped population proxy. |
| Access | `road_access_score`, `settlement_proximity_score` | Partial source-derived, reproducible local extract | OSM via Geofabrik Ethiopia `.osm.pbf` | Current Geofabrik artifact has road scores for 13/16 sites and settlement scores for 12/16 sites. Individual null fields still fall back to deterministic placeholders in `site_features.json`. |
| Settlement context | `source_extracts.settlement_context` | Optional source-derived context | GHSL GHS-SMOD 2020 R2023A | Coarse 1 km settlement model context. Cross-checks WorldPop/OSM and does not overwrite access or population scores. |
| Local research context | `source_extracts.local_research_context` | Context-derived for 16/16 sites | Curated local PDF bundle | Evidence-card matches for implementation caveats and policy/method context. Does not overwrite scoring fields. |
| Safeguards | `protected_area_overlap_pct`, `safeguard_risk_score` | Placeholder | Pending WDPA | WDPA access terms must be checked before committing raw data. |

## Implemented Extraction

Land-cover command:

```bash
npm run data:worldcover
```

Land-cover script:

```text
scripts/extract-worldcover-land-cover.py
```

Land-cover output:

```text
data/features/source_extracts/worldcover_land_cover.json
```

Land-cover raw cache:

```text
data/raw/esa_worldcover/
```

Vegetation dry-run command:

```bash
npm run data:vegetation:dry-run
```

Vegetation command:

```bash
npm run data:vegetation
```

Vegetation trend command, slower opt-in:

```bash
npm run data:vegetation:trend
```

Vegetation script:

```text
scripts/extract-vegetation-indices.py
```

Vegetation output:

```text
data/features/source_extracts/vegetation_indices.json
```

Current vegetation artifact coverage:

- Sentinel-2 current NDVI/EVI extracted for 16/16 candidate sites.
- Landsat NDVI trend extraction is implemented but not part of the default vegetation command because Planetary Computer signed COG reads were too slow for the PR workflow.
- `ndvi_current` and `evi_current` are now source-derived from Sentinel-2 where valid scenes exist; `ndvi_trend_5y` remains fallback unless `npm run data:vegetation:trend` is run successfully.

Rainfall command:

```bash
npm run data:chirps
```

Rainfall script:

```text
scripts/extract-chirps-rainfall.py
```

Rainfall output:

```text
data/features/source_extracts/chirps_rainfall.json
```

Rainfall raw cache:

```text
data/raw/chirps/
```

Terrain dry-run command:

```bash
npm run data:srtm:dry-run
```

Terrain script:

```text
scripts/extract-srtm-terrain.py
```

Terrain output after official tiles are provided:

```text
data/features/source_extracts/srtm_terrain.json
```

Terrain raw tile location:

```text
data/raw/srtm/
```

Current terrain artifact coverage:

- Source-derived elevation and slope summaries for 16/16 candidate sites.
- Raw SRTMGL1 `.hgt` tiles are not committed. The committed artifact is small and reproducible if the official tiles listed in `data/features/source_extracts/srtm_terrain.json` are placed under `data/raw/srtm/`.
- Steepest current candidate by mean slope is `SET-006` at 29.32 degrees; flattest is `SET-001` at 0.01 degrees.

Soil command:

```bash
npm run data:soilgrids
```

Soil script:

```text
scripts/extract-soilgrids-soil.py
```

Soil output:

```text
data/features/source_extracts/soilgrids_soil.json
```

SoilGrids source access:

```text
https://files.isric.org/soilgrids/latest/data/
```

Soil observation dry-run command:

```bash
npm run data:soilobs:dry-run
```

Soil observation command:

```bash
npm run data:soilobs
```

Soil observation script:

```text
scripts/extract-soil-observations.py
```

Soil observation output:

```text
data/features/source_extracts/soil_observations.json
```

Soil observation source access:

```text
WoSIS latest WFS layers: orgc, phaq, sand, silt, clay
AfSIS Phase I public georeference and wet-chemistry CSVs
```

The observation lane summarizes nearby measured soil observations within 25 km
of each candidate centroid. These values are embedded under
`source_extracts.soil_observations` and support interpretation of SoilGrids; they
do not overwrite `soil_organic_carbon_score` or `soil_ph_suitability_score`.

Current soil-observation artifact coverage:

- Nearby observations found for 5/16 candidate sites.
- Current nearby matches are from WoSIS; AfSIS Phase I data fetched successfully but had no topsoil observations within the default 25 km candidate radius.
- Observation rows are context/provenance only and do not change current priority scores.

GBIF biodiversity dry-run command:

```bash
npm run data:gbif:dry-run
```

GBIF biodiversity command:

```bash
npm run data:gbif
```

GBIF biodiversity script:

```text
scripts/extract-gbif-biodiversity.py
```

GBIF biodiversity output:

```text
data/features/source_extracts/gbif_biodiversity.json
```

GBIF raw cache:

```text
data/raw/gbif_biodiversity/
```

The GBIF lane queries candidate-site polygons through the public occurrence
search API and filters to Ethiopia records with coordinates, no GBIF geospatial
issue flag, present occurrence status, 2000-current event dates, coordinate
uncertainty up to 5 km, accepted Creative Commons licenses, and observation or
specimen basis types. It tags EOD/eBird and Bale Mountains plant-record subsets
when those GBIF dataset keys appear in candidate polygons.

GBIF rows are embedded under `source_extracts.biodiversity_observations`.
They are biodiversity observation context only. Sparse or missing records mean
the source has insufficient local observations for this polygon, not that the
site has low biodiversity. The current PR does not give GBIF a direct ranker
weight and does not override top-level feature values from GBIF; GBIF can still
appear in source provenance, quality/context groups, and the per-site source
payload.

Current GBIF-derived artifact coverage:

- Source-derived biodiversity context scores: 0/16 sites.
- Insufficient-record context rows: 16/16 sites.
- `SWE-007` currently has 8 filtered occurrences across 8 species; the other candidate polygons have zero filtered GBIF records.
- Records with missing or greater-than-5-km coordinate uncertainty, disallowed licenses, disallowed basis types, geospatial issues, non-present status, or dates before 2000 are filtered out before summarization.

Local research context dry-run command:

```bash
npm run data:local-research:dry-run
```

Local research context command:

```bash
npm run data:local-research
```

Local research context script:

```text
scripts/extract-local-research-context.mjs
```

Local research context output:

```text
data/features/source_extracts/local_research_context.json
```

The local research lane turns curated PDF/source-matrix findings into evidence
cards and candidate matches. It is context-only and cannot change priority
scores. It currently provides national policy/method context for 16/16 sites,
national species-selection context for 16/16 sites, comparable
western-Ethiopia context for 8/16 Southwest Ethiopia sites, and one explicit
district-level match for `SWE-007` from the Gimbo soil-management paper. Newly
pushed Bale/Konso/local plant papers are included as context/use-later evidence
cards, not scoring layers.

WorldPop population dry-run command:

```bash
npm run data:worldpop:dry-run
```

WorldPop population command:

```bash
npm run data:worldpop
```

WorldPop population script:

```text
scripts/extract-worldpop-population.py
```

WorldPop population output:

```text
data/features/source_extracts/worldpop_population.json
```

WorldPop raw cache:

```text
data/raw/worldpop/
```

The WorldPop 2020 Ethiopia UN-adjusted GeoTIFF is about 514 MB. It is cached locally and gitignored. The default lightweight `data:pipeline` does not force this download; use `npm run data:pipeline:worldpop` for a pipeline run that refreshes WorldPop first.

GFW/UMD forest-change dry-run command:

```bash
npm run data:gfw:dry-run
```

GFW/UMD forest-change command:

```bash
npm run data:gfw
```

GFW/UMD forest-change script:

```text
scripts/extract-gfw-umd-forest-change.py
```

GFW/UMD forest-change output:

```text
data/features/source_extracts/gfw_umd_forest_change.json
```

GFW/UMD raw cache:

```text
data/raw/gfw_umd_forest_change/
```

The current candidate set requires one Hansen tile, `10N_030E`, for `treecover2000`, `lossyear`, and `datamask`. Use `npm run data:pipeline:gfw` for a pipeline run that refreshes WorldPop and GFW before feature generation.

Current GFW/UMD-derived artifact coverage:

- Forest loss scores: 16/16 sites.
- Tree-cover context scores: 16/16 sites.
- Hansen tile set: `10N_030E`.

ESA CCI Biomass dry-run command:

```bash
npm run data:esa-biomass:dry-run
```

ESA CCI Biomass command:

```bash
npm run data:esa-biomass
```

ESA CCI Biomass script:

```text
scripts/extract-esa-cci-biomass.py
```

ESA CCI Biomass output:

```text
data/features/source_extracts/esa_cci_biomass.json
```

ESA CCI Biomass raw cache:

```text
data/raw/esa_cci_biomass/
```

The ESA CCI lane uses CEDA JSON listings to find the 2024 v7.0 100m AGB and
AGB_SD GeoTIFF tiles for the candidate polygons. The current candidate set uses
tile `N10E030`. The lane summarizes above-ground biomass and uncertainty under
`source_extracts.carbon_stock_context`. It does not convert biomass to carbon
and does not affect the current ranker.

Current ESA CCI Biomass artifact coverage:

- Source-derived AGB context rows: 16/16 sites.
- Source-derived AGB uncertainty rows: 16/16 sites.
- ESA tile set: `N10E030`.

GFW carbon flux dry-run command:

```bash
npm run data:gfw-carbon:dry-run
```

GFW carbon flux command:

```bash
npm run data:gfw-carbon
```

GFW carbon flux script:

```text
scripts/extract-gfw-carbon-flux.py
```

GFW carbon flux output:

```text
data/features/source_extracts/gfw_carbon_flux.json
```

The GFW carbon flux lane discovers WRI/GFW gross removals, gross emissions, and
net flux tile resources for the current candidate tile `10N_030E`. Raster
downloads currently return `403` without a valid API key, so the extractor writes
a blocked context artifact instead of fabricating values. If API-key access is
added later, the same script can summarize the tiles into
`source_extracts.carbon_flux_context`.

WaPOR water/productivity dry-run command:

```bash
npm run data:wapor:dry-run
```

WaPOR water/productivity command:

```bash
npm run data:wapor
```

WaPOR water/productivity script:

```text
scripts/extract-wapor-water-productivity.py
```

WaPOR water/productivity output:

```text
data/features/source_extracts/wapor_water_productivity.json
```

WaPOR metadata cache:

```text
data/raw/wapor/metadata/
```

The WaPOR lane uses FAO WaPOR v3 `WAPOR-3` Level 2 annual 100 m products:
`L2-AETI-A`, `L2-TBP-A`, `L2-GBWP-A`, and `L2-NBWP-A`. The extractor reads
official FAO Cloud Optimized GeoTIFFs through GDAL `/vsicurl/` range requests
and caches only product metadata. It summarizes annual values for 2023-2025 by
default. These values are water/productivity context, not carbon stock or direct
biodiversity evidence.

OSM access dry-run command:

```bash
npm run data:osm:dry-run
```

OSM access command:

```bash
npm run data:osm
```

OSM Geofabrik reproducible dry-run command:

```bash
npm run data:osm:geofabrik:dry-run
```

OSM Geofabrik reproducible command:

```bash
npm run data:osm:geofabrik
```

OSM access script:

```text
scripts/extract-osm-access.py
```

OSM access output:

```text
data/features/source_extracts/osm_access.json
```

OSM raw cache:

```text
data/raw/osm/
```

OSM is not part of the default pipeline yet because public Overpass requests can be rate-limited or incomplete. The feature engine consumes numeric OSM fields if present and falls back to deterministic placeholders when individual OSM scores are null.

For reproducible access extraction, use the local Geofabrik Ethiopia `.osm.pbf` with:

```bash
npm run data:pipeline:geofabrik
```

That pipeline records the local PBF path, file size, SHA-256 checksum, candidate-site hash, source mode, extractor version, and scoring version in `osm_access.json`. It fails fast if the local PBF is missing instead of silently using live Overpass.

Current Geofabrik-derived artifact coverage:

- Road access scores: 13/16 sites.
- Settlement proximity scores: 12/16 sites.
- Population pressure proxy scores: 16/16 sites, including zero-valued mapped proxies where no mapped settlement/population signals were returned.

`npm run data:artifacts:validate` now checks that integrated OSM raw values in `site_features.json` match `data/features/source_extracts/osm_access.json`, so stale feature artifacts fail validation.

The raw cache is gitignored. The source-derived summary JSON is small enough to commit.

GHSL settlement dry-run command:

```bash
npm run data:ghsl:dry-run
```

GHSL settlement command:

```bash
npm run data:ghsl
```

GHSL settlement script:

```text
scripts/extract-ghsl-settlement.py
```

GHSL settlement output:

```text
data/features/source_extracts/ghsl_settlement.json
```

GHSL raw cache:

```text
data/raw/ghsl/
```

The GHSL lane uses the official JRC GHS-SMOD 2020, R2023A, 1 km global
settlement model zip. Candidate polygons are reprojected to the product CRS
(`ESRI:54009`) before raster masking. Results are embedded under
`source_extracts.settlement_context` and are used as context only.

Current GHSL-derived artifact coverage:

- Settlement context rows: 16/16 sites.
- Dense settlement fractions above zero: 2/16 sites (`SWE-005`, `SWE-007`).
- Highest settlement-context scores: `SET-008` at 36, `SWE-005` at 28, and `SWE-007` at 14.
- GHSL does not overwrite OSM access or WorldPop population pressure.

## Important Interpretation

`data/features/site_features.json` currently has mixed quality:

```text
feature_version: mixed_<source-derived-groups>_v0
feature_quality: <source-derived-groups>_source_derived_other_fields_demo_mock
```

The exact `feature_version` and `feature_quality` values are row-dependent,
because a candidate can have valid pixels or mapped features for some source
groups and blocked/no-valid-pixel status for others.

This means:

- land-cover fields are source-derived,
- geometry/admin labels are source-derived,
- forest context is source-derived from Hansen/GFW where valid land pixels exist,
- rainfall fields are source-derived from CHIRPS,
- WaPOR water/productivity context is source-derived where valid product pixels exist,
- soil SOC and pH suitability fields are source-derived from SoilGrids where valid soil pixels exist,
- population pressure is source-derived from WorldPop where valid population pixels exist,
- OSM access fields are source-derived where Overpass or Geofabrik returned usable mapped features,
- GHSL settlement context is source-derived where valid settlement-model pixels exist,
- GBIF biodiversity observation context is source-derived where enough occurrence/species records exist,
- all other numerical environmental/social fields are deterministic placeholders,
- rankings remain `rule_based_fallback`,
- the output is suitable for integration and demo scaffolding, not final evidence claims.

## Next Recommended Extractions

1. Run OSM Geofabrik extraction once the Ethiopia `.osm.pbf` is available locally.
2. SRTM slope/elevation after official NASA/USGS tiles are available locally or Earth Engine auth exists.
3. GHSL built-up proxies if a distinct built-up/settlement product decision is needed beyond WorldCover and OSM.
4. WDPA protected-area overlap, after checking access and redistribution terms.
5. Sentinel-2/Landsat NDVI once Earth Engine auth/project setup exists.

## Earth Engine Blocker

Sentinel-2, Landsat, and Sentinel-1 are best accessed through Google Earth Engine for this MVP, but the EC2 host cannot run real GEE extraction until the project has:

- a registered Earth Engine Google Cloud project,
- Earth Engine API enabled,
- user OAuth or service-account/ADC credentials,
- explicit instruction not to commit credentials.

Until then, keep these fields as placeholders or implement alternate public-raster workflows.
