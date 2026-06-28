# Source Verification Handoff

This document is for the teammate or agent who will verify the data sources behind the Chaka MVP. It does not replace `AGENT_STRUCTURE.md`; it explains what needs to be checked before we present the pipeline as evidence-grounded.

## Goal

Verify that every data source used in the MVP has:

- a credible provider,
- a clear access path,
- a known spatial/temporal resolution,
- a defined role in our scoring pipeline,
- known limitations,
- a simple way to explain why the source is valid for pre-feasibility screening.

The verification result should make it easy to answer:

```text
What does this source measure?
How do we extract information from it?
How accurate or coarse is it?
What can it not prove?
How should the frontend/model/LLM describe it without overclaiming?
```

## Current MVP Context

The current MVP candidate sites are generated from HDX/OCHA Ethiopia Admin 1-3 boundaries.

Tracked artifacts:

```text
data/processed/aoi_boundaries.geojson
data/processed/aoi_lookup.csv
data/processed/candidate_sites.geojson
docs/mvp_methodology.md
docs/data_quality.md
data/catalog/source_registry.json
data/catalog/datasets.json
```

Current candidate unit:

- 32 deterministic grid cells.
- 8 in South Ethiopia (`SET`).
- 8 in Southwest Ethiopia Peoples' Region (`SWE`).
- 4 in Tigray (`TIG`).
- 4 in Amhara (`AMH`).
- 4 in Oromia (`ORO`).
- 4 in Gambela (`GAM`).
- Around 2,500 ha each.
- These are screening units, not final project boundaries.

## Verification Output To Produce

Recommended output file:

```text
docs/source_verification_report.md
```

Recommended structure:

```text
1. Executive summary
2. Source-by-source verification table
3. Source access notes
4. Feature extraction notes
5. Accuracy and limitation notes
6. Presentation-safe language
7. Open questions / blocked sources
```

If the teammate creates machine-readable notes, use:

```text
data/catalog/source_verification_notes.json
```

Do not put API keys, tokens, private partner data, or downloaded proprietary data in git.

## Source-By-Source Verification Checklist

For each source below, verify the official source page and record:

- official provider,
- official URL,
- access method,
- data format,
- spatial resolution,
- temporal coverage/update frequency,
- license or access restriction,
- MVP feature fields supported,
- limitation statement,
- whether the source is usable now, usable later, blocked, or context-only.

### 1. HDX/OCHA Ethiopia Admin Boundaries

Current registry ID:

```text
hdx_ocha_eth_admin_boundaries
```

Official URL:

```text
https://data.humdata.org/dataset/cod-ab-eth
```

What we pull:

- Ethiopia Admin 0-3 boundaries.
- Admin 1 AOI boundaries.
- Admin 2 zone names.
- Admin 3 woreda names.
- Administrative pcodes.
- Area metadata where available.

How we pull it:

- Use HDX package metadata.
- Download the GeoJSON zip resource.
- Read:
  - `eth_admin1.geojson`
  - `eth_admin2.geojson`
  - `eth_admin3.geojson`

Current scripts:

```text
scripts/aoi-boundary-builder.mjs
scripts/candidate-site-generator.mjs
scripts/validate-candidate-sites.mjs
```

What to verify:

- HDX still exposes Admin 0-3 GeoJSON.
- Admin 1 includes `South Ethiopia` and `South West Ethiopia`.
- Admin 2/3 names attach correctly to candidate centroids.
- Boundary version and `valid_on` date.
- Whether South/Southwest Ethiopia names align with current official naming.

Accuracy/caveat:

- Strong for administrative labels and rough AOI boundaries.
- Not an ecological boundary.
- Not a final restoration project boundary.

### 2. Ethiopia Tree-Based Landscape Restoration Atlas

Current registry ID:

```text
ethiopia_restoration_atlas
```

Official URL:

```text
https://eth.restorationatlas.org/
```

What we may pull:

- Ethiopia-specific restoration context.
- Possible restoration priority classes.
- Possible intervention classes.
- Possible weak labels for later model training.

How we may pull it:

- Web atlas layers.
- Download links if available.
- Manual extraction or screenshots only as last resort.

What to verify:

- Whether layer downloads are available.
- Whether an API exists.
- Which layers correspond to restoration opportunity, priority, or intervention type.
- Whether layers can be matched to current Ethiopia boundaries.
- Whether old SNNPR-era boundaries require crosswalks.

Accuracy/caveat:

- Useful context and weak labels.
- Do not treat atlas classes as ground truth.
- Do not block MVP if automated access is slow.

Agent note:

- Research this in more detail. This is one of the most important sources for weak labels and intervention context, but automated access is currently less clear than the global sources.

### 3. Sentinel-2 Surface Reflectance

Current registry ID:

```text
sentinel2_sr_harmonized
```

Official URL:

```text
https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED
```

What we pull:

- Current vegetation signal.
- NDVI.
- EVI.
- Bare-soil/degradation proxy.

How we pull it:

- Google Earth Engine image collection.
- Filter by candidate polygon.
- Filter by date window.
- Cloud/shadow mask.
- Composite median or percentile.
- Calculate NDVI/EVI per candidate.

What to verify:

- Best recent seasonal window for Ethiopia.
- Cloud masking method.
- Whether dry-season or wet-season NDVI is more appropriate for restoration screening.
- Bands needed for NDVI/EVI.
- Whether candidate areas have enough clear observations.

Accuracy/caveat:

- Strong for current vegetation condition.
- 10-20m pixel resolution depending on band.
- Does not directly measure carbon.
- Seasonal timing matters.

Agent note:

- Research recommended cloud masking and seasonal compositing for Ethiopian vegetation analysis.

### 4. Landsat Collection 2 Surface Reflectance

Current registry ID:

```text
landsat_collection2_sr
```

Official URL:

```text
https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC08_C02_T1_L2
```

What we pull:

- Long-term vegetation trend.
- NDVI trend over 5-10 years.
- Recovery/degradation baseline.

How we pull it:

- Google Earth Engine.
- Filter Landsat imagery by candidate polygon and time range.
- Cloud mask.
- Calculate annual or seasonal NDVI.
- Fit trend or compare baseline/current periods.

What to verify:

- Whether Landsat 8 alone is enough or if Landsat 5/7/9 should be included.
- Best trend window for MVP.
- Cloud masking and scale factors.
- Whether trend is stable for the candidate areas.

Accuracy/caveat:

- Useful for trend because of long history.
- 30m resolution.
- Trend is a vegetation proxy, not a measured biomass/carbon trend.

### 5. Sentinel-1 SAR

Current registry ID:

```text
sentinel1_grd
```

Official URL:

```text
https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S1_GRD
```

What we may pull:

- VV median.
- VH median.
- VV/VH ratio.
- Moisture/structure proxy.

How we may pull it:

- Google Earth Engine Sentinel-1 GRD collection.
- Filter by orbit, polarization, mode, and date.
- Aggregate per candidate polygon.

What to verify:

- Whether SAR adds enough value for MVP.
- Whether preprocessing choices are explainable.
- Which orbit/polarization filters are appropriate.

Accuracy/caveat:

- Cloud-resistant and useful in cloudy areas.
- More technical to explain.
- Optional for MVP.

Agent note:

- Defer unless time allows. Do not make MVP scoring depend on Sentinel-1.

### 6. ESA WorldCover

Current registry ID:

```text
esa_worldcover
```

Official URL:

```text
https://esa-worldcover.org/en/data-access
```

What we pull:

- Land-cover primary class.
- Land-cover proportions.
- Tree cover, cropland, grassland, built-up, water, other.
- Restoration intervention suitability hints.

How we pull it:

- Download WorldCover tiles, use cloud-optimized GeoTIFFs, or use Earth Engine if available.
- Clip/aggregate by candidate polygon.
- Count pixels by class.
- Map classes into MVP categories.

What to verify:

- Which year/product version to use.
- Class legend.
- Download/API access path.
- How to map classes into `land_cover_mix`.
- Whether candidate cells have enough valid pixels.

Accuracy/caveat:

- Strong MVP layer.
- 10m land-cover map.
- Classification errors exist locally.
- Should be visually spot-checked for top candidate sites.

### 7. GFW / UMD Forest Change

Current registry ID:

```text
gfw_umd_forest_change
```

Official URL:

```text
https://data.globalforestwatch.org/
```

What we pull:

- Tree-cover context.
- Tree-cover loss.
- Forest-loss pressure score.

How we pull it:

- GFW data portal or Hansen/UMD layers in Earth Engine.
- Aggregate loss and baseline tree cover over each candidate polygon.

What to verify:

- Dataset version/year.
- Tree-cover threshold used.
- Whether gain/loss layers are available for desired period.
- Whether candidate areas are tree-covered enough for the metric to be meaningful.

Accuracy/caveat:

- Useful forest-change context.
- Tree-cover loss is not the same as carbon loss.
- Does not directly measure degradation severity.

### 8. CHIRPS Rainfall

Current registry ID:

```text
chirps_rainfall
```

Official URL:

```text
https://www.chc.ucsb.edu/data/chirps
```

What we pull:

- Mean rainfall.
- Rainfall reliability.
- Drought/suitability proxy.

How we pull it:

- CHIRPS daily/monthly data.
- Google Earth Engine or direct download.
- Aggregate rainfall over candidate polygon and time window.

What to verify:

- Use monthly or annual rainfall.
- Appropriate multi-year average window.
- Whether rainfall variability should be included.
- Best suitability thresholds for tree establishment in Ethiopia.

Accuracy/caveat:

- Good climate proxy.
- Coarse relative to 5km candidate sites.
- Should not be overweighted.

Agent note:

- Research simple rainfall suitability thresholds for restoration screening, but keep the first scoring formula transparent.

### 9. SRTM DEM

Current registry ID:

```text
srtm_dem
```

Official URL:

```text
https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003
```

What we pull:

- Elevation mean.
- Slope mean.
- Slope risk score.
- Erosion proxy.

How we pull it:

- Google Earth Engine SRTM layer.
- Derive slope from elevation.
- Aggregate slope/elevation over candidate polygon.

What to verify:

- Slope calculation method.
- Whether mean slope or high-percentile slope is better.
- Suitability/risk thresholds for restoration.

Accuracy/caveat:

- Strong terrain layer.
- Static 30m DEM.
- Slope is an erosion proxy, not measured erosion.

### 10. SoilGrids

Current registry ID:

```text
soilgrids
```

Official URL:

```text
https://docs.isric.org/globaldata/soilgrids/
```

What we pull:

- Soil organic carbon proxy.
- pH suitability.
- Texture context.
- Soil/water suitability proxy.

How we pull it:

- SoilGrids API/WCS/WebDAV or Earth Engine if available.
- Select relevant layers and depth interval.
- Aggregate over candidate polygon.

What to verify:

- Which depth interval to use.
- Units and scaling.
- Whether uncertainty layers should be recorded.
- How to map SOC/pH/texture into suitability scores.

Accuracy/caveat:

- Modeled global product.
- 250m resolution.
- Useful proxy, not measured project carbon.
- Must not be presented as verified carbon stock.

Agent note:

- Research correct units, depth intervals, and uncertainty fields before implementing real extraction.

### 11. WDPA Protected Areas

Current registry ID:

```text
wdpa_protected_areas
```

Official URL:

```text
https://www.protectedplanet.net/en/thematic-areas/wdpa
```

What we pull:

- Protected-area overlap percentage.
- Safeguard review flag.
- Safeguard risk score.

How we pull it:

- Download WDPA data.
- Intersect candidate polygons with protected-area polygons.
- Calculate overlap area percentage.

What to verify:

- Access terms and download requirements.
- Whether Ethiopia subset can be downloaded directly.
- Whether all designation categories should count equally.
- How to handle proposed/not-reported boundaries.

Accuracy/caveat:

- Strong safeguard source.
- Boundary accuracy can vary.
- Protected-area overlap should trigger review, not automatic exclusion.

### 12. WorldPop Population

Current registry ID:

```text
worldpop_population
```

Official URL:

```text
https://hub.worldpop.org/geodata/listing?id=29
```

What we pull:

- Population count/density.
- Population pressure score.
- Livelihood relevance proxy.

How we pull it:

- Download Ethiopia population raster.
- Aggregate population over each candidate polygon.
- Normalize into score.

What to verify:

- Which year/product to use.
- Whether constrained or unconstrained population is better.
- Units: people per pixel vs density.
- How to normalize rural population pressure.

Accuracy/caveat:

- Useful livelihood proxy.
- Does not prove community willingness.
- Does not prove land tenure or implementation feasibility.

### 13. GHSL

Current registry ID:

```text
ghsl_built_up_settlement
```

Official URL:

```text
https://human-settlement.emergency.copernicus.eu/
```

What we pull:

- Settlement/built-up context.
- Settlement proximity score.
- Built-up mask.

How we pull it:

- Download GHSL built-up or settlement layers.
- Aggregate/proximity analysis around candidate polygons.

What to verify:

- Which GHSL layer and epoch to use.
- Whether resolution is appropriate.
- Whether it duplicates or improves WorldPop/OSM signals.

Accuracy/caveat:

- Useful cross-check.
- Does not capture informal access, tenure, or community willingness.
- Optional for MVP if WorldPop/OSM already provide enough signal.

### 14. OSM / Geofabrik Ethiopia

Current registry ID:

```text
osm_geofabrik_ethiopia
```

Official URL:

```text
https://download.geofabrik.de/africa/ethiopia.html
```

What we pull:

- Road distance.
- Road access score.
- Settlement/place proximity.

How we pull it:

- Download Ethiopia extract from Geofabrik.
- Use roads and places layers.
- Calculate nearest road/settlement distance from candidate centroid or polygon.

What to verify:

- Best file format for our stack: `.shp.zip`, `.gpkg.zip`, or `.osm.pbf`.
- Road class filtering.
- Whether mapped road completeness is acceptable in candidate regions.
- Whether place points are enough or GHSL should supplement them.

Accuracy/caveat:

- Useful access proxy.
- Completeness varies by area.
- Road proximity is not the same as implementation cost or safety.

### 15. CIFOR-ICRAF Species Atlas

Current registry ID:

```text
cifor_icraf_species_atlas
```

Official URL:

```text
https://www.cifor-icraf.org/knowledge/publication/8977/
```

What we may pull:

- Species suitability context.
- Species suggestions.
- Climate suitability notes.

How we may pull it:

- Publication and associated atlas/materials.
- Possibly manual context extraction.
- Later RAG/context layer.

What to verify:

- Whether data files are downloadable.
- Which species are relevant to Ethiopia FLR.
- Whether suitability maps can be matched to candidate sites.
- Whether source access allows automated use.

Accuracy/caveat:

- Context-only for MVP.
- Do not use as deterministic scoring until data access and interpretation are verified.
- Local nursery availability and community preference still require field validation.

Agent note:

- Research this source in more detail if recommendation/species context becomes part of the demo. It should not block the first scoring pipeline.

## Cross-Source Validation Questions

The teammate should answer these after reviewing the sources:

1. Which sources can be extracted immediately with Google Earth Engine?
2. Which sources require large downloads?
3. Which sources require account access or manual download?
4. Which features can be real in the MVP?
5. Which features must be proxy/demo for the MVP?
6. Which fields need `null` until a real extraction path exists?
7. Which sources are too coarse for 5km cells and should be down-weighted?
8. Which source limitations must appear in the UI or generated brief?

## Minimum Validity Standard For MVP

Before presenting a site as high priority, the pipeline should be able to show:

- geometry source,
- land-cover evidence,
- vegetation evidence or explicit missing value,
- rainfall suitability evidence,
- slope/terrain evidence,
- soil proxy evidence,
- population/access proxy evidence,
- protected-area/safeguard check,
- data-quality note,
- field-validation questions.

If any key field is missing, keep the candidate but reduce `data_quality_score` and explain the missing input.

## Presentation-Safe Language

Use:

```text
pre-feasibility screening
restoration investment priority
carbon potential
vegetation proxy
soil carbon proxy
field validation required
source-traceable scoring
```

Avoid:

```text
verified carbon
guaranteed carbon capture
final investment decision
community-approved
tenure-secure
field-grade biodiversity baseline
```

## Agent Instruction Note

If an agent continues this work, it should:

- check official source documentation before asserting resolution, units, or update cadence,
- prefer primary sources over summaries,
- record all source URLs used,
- keep generated source-check reports out of git unless they are stable,
- avoid adding secrets or private partner data,
- update `docs/data_quality.md` or create `docs/source_verification_report.md` with findings,
- keep all output compatible with `AGENT_STRUCTURE.md`.
