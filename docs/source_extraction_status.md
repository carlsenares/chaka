# Source Extraction Status

This document tracks which feature groups are source-derived and which are still placeholders.

## Current Status

| Feature group | Fields | Source status | Source | Notes |
| --- | --- | --- | --- | --- |
| Geometry/admin labels | `site_id`, `region`, `zone`, `woreda`, `area_ha` | Source-derived | HDX/OCHA Ethiopia Admin 1-3 | Generated from downloaded HDX GeoJSON. |
| Land cover | `land_cover_primary`, `land_cover_mix` | Source-derived | ESA WorldCover 2021 v200 | Extracted from public 10m WorldCover COG tiles. |
| Vegetation | `ndvi_current`, `ndvi_trend_5y`, `evi_current` | Placeholder | Pending Sentinel-2/Landsat | Requires Earth Engine auth or alternate public raster workflow. |
| Forest context | `forest_loss_score` | Source-derived for 16/16 sites | Hansen Global Forest Change / GFW v1.13 | Extracts tree-cover baseline and loss from official direct-download tiles. Default threshold is 30% tree cover; tree-cover loss is a disturbance proxy, not verified deforestation or carbon loss. |
| Rainfall | `rainfall_mean_mm`, `rainfall_reliability_score` | Source-derived | CHIRPS v2.0 Africa Monthly 2021-2025 | Extracted from official UCSB monthly GeoTIFFs. Reliability is normalized to 0-100 in `site_features.json`; raw 0-1 reliability is retained in `source_extracts`. |
| Terrain | `slope_mean_deg`, `slope_risk_score` | Placeholder, extractor scaffolded | SRTMGL1 | Script lists required official tiles and extracts terrain once local official `.hgt`/`.hgt.zip` tiles are supplied. |
| Soil | `soil_organic_carbon_score`, `soil_ph_suitability_score` | Source-derived for 15/16 sites | SoilGrids 2.0 topsoil SOC and pH | Extracted from official ISRIC WebDAV/VRT rasters. `SET-001` has no valid soil pixels, consistent with water-dominant WorldCover. |
| Population/livelihood | `population_pressure_score` | Source-derived for 15/16 sites | WorldPop Ethiopia 2020 UN-adjusted population counts | Extracted from official WorldPop 100m GeoTIFF. `SET-001` has no valid population pixels and falls back to OSM's zero-valued mapped population proxy. |
| Access | `road_access_score`, `settlement_proximity_score` | Partial source-derived, reproducible local extract | OSM via Geofabrik Ethiopia `.osm.pbf` | Current Geofabrik artifact has road scores for 13/16 sites and settlement scores for 12/16 sites. Individual null fields still fall back to deterministic placeholders in `site_features.json`. |
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
- soil SOC and pH suitability fields are source-derived from SoilGrids where valid soil pixels exist,
- population pressure is source-derived from WorldPop where valid population pixels exist,
- OSM access fields are source-derived where Overpass or Geofabrik returned usable mapped features,
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
