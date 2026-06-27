# Steps

This file is for the user and for any future agent working on this repo.

## Instructions For The Agent

Do not turn this file into a prompt. Do not ask the user to write a prompt.

Give the user concrete, detailed steps. Tell the user that they should get the required data from the official sources, upload or place it in the repo under the paths listed below, and then let the agent commit and push the resulting source files or derived artifacts to git where appropriate so future agents can find them later.

Never ask the user to paste passwords, API tokens, OAuth codes, or service-account keys into chat. Credentials must stay local and uncommitted.

Raw source data should generally stay under `data/raw/`, which is gitignored. Commit only small derived artifacts and documentation unless the project owner explicitly approves otherwise.

## Current Best No-Auth Pipeline

The strongest currently runnable pipeline is:

```bash
npm run data:pipeline:full:noauth
```

It uses already implemented no-auth sources:

- HDX/OCHA admin boundaries
- ESA WorldCover
- CHIRPS rainfall
- SoilGrids
- WorldPop population
- Hansen/GFW forest change
- Geofabrik OpenStreetMap access

The remaining higher-value targets need user action because they require official data downloads, credentials, or terms clearance.

## 1. SRTM Terrain

Purpose: replace placeholder `slope_mean_deg` and `slope_risk_score`.

Missing this means erosion risk and terrain suitability remain placeholder/demo values.

### What The User Should Do

1. Go to NASA Earthdata Search:
   https://search.earthdata.nasa.gov/

2. Sign in or create a NASA Earthdata account.

3. Search for:

```text
SRTMGL1 003
```

Official dataset page:
https://www.earthdata.nasa.gov/data/catalog/lpcloud-srtmgl1-003

4. Download these official SRTMGL1 tiles as `.hgt` or `.hgt.zip`:

```text
N04E036
N05E035
N05E036
N06E035
N06E036
N06E037
N07E035
N07E036
N07E037
N08E035
```

5. Upload or place the files here:

```text
/home/ubuntu/work/chaka/data/raw/srtm/
```

Valid examples:

```text
data/raw/srtm/N04E036.hgt
data/raw/srtm/N05E035.hgt.zip
```

6. Tell the agent:

```text
SRTM tiles are in data/raw/srtm/
```

### What The Agent Should Run

```bash
npm run data:srtm:dry-run
npm run data:srtm
npm run data:features
npm run data:rank
npm run data:artifacts:validate
npm run data:candidates:validate
```

If extraction succeeds, commit and push the small derived artifact:

```text
data/features/source_extracts/srtm_terrain.json
```

Do not commit raw `.hgt` files unless the project owner explicitly requests it.

## 2. WDPA / Protected Areas

Purpose: replace placeholder `protected_area_overlap_pct` and `safeguard_risk_score`.

Missing this means safeguards are not evidence-grade. The system cannot confidently flag overlap with protected areas or OECMs.

### What The User Should Do

1. Go to Protected Planet WDPA:
   https://www.protectedplanet.net/en/thematic-areas/wdpa

2. Read the legal terms:
   https://www.protectedplanet.net/en/legal

3. Decide and tell the agent the use context:

```text
hackathon demo only
internal NGO prototype
donor-facing non-commercial
commercial or revenue-generating
```

4. If allowed by the terms for this project, download the official WDPA/WDPCA data or request API access.

Protected Planet API docs:
https://api.protectedplanet.net/documentation

5. Upload or place the official download here:

```text
/home/ubuntu/work/chaka/data/raw/wdpa/
```

6. Tell the agent:

- the download month and year,
- whether the file is WDPA only or WDPCA/OECM too,
- whether commercial use is involved,
- whether only derived scalar fields may be committed,
- any required attribution text.

### What The Agent Should Do

The agent should not download WDPA automatically without explicit terms confirmation.

The agent should build or run a local-only extractor that:

- reads only from `data/raw/wdpa/`,
- does not commit raw WDPA geometry,
- outputs only per-site summaries,
- includes source release month/year,
- includes required attribution,
- validates `protected_area_overlap_pct` and `safeguard_risk_score`.

Expected derived output:

```text
data/features/source_extracts/wdpa_protected_areas.json
```

Commit and push only the derived summary if licensing permits it.

## 3. Sentinel / Landsat Vegetation Through Google Earth Engine

Purpose: replace placeholder `ndvi_current`, `ndvi_trend_5y`, and `evi_current`.

Missing this means vegetation condition and trend remain placeholder/demo values.

### What The User Should Do

1. Go to Google Earth Engine access setup:
   https://developers.google.com/earth-engine/guides/access

2. Sign in with a Google account.

3. Register for Earth Engine access if needed.

4. Create or choose a Google Cloud project for Earth Engine.

5. Enable the Earth Engine API for that project.

6. Tell the agent:

```text
Earth Engine access is ready
Google Cloud project ID: <project-id>
```

Do not paste passwords, OAuth tokens, service-account JSON, or private keys into chat.

### What The Agent Should Do

The agent should guide local authentication on the machine, keeping credentials uncommitted.

Likely next implementation:

- add an Earth Engine vegetation extractor,
- choose Ethiopia-appropriate seasonal windows,
- apply cloud/shadow masking,
- compute NDVI/EVI per candidate polygon,
- write:

```text
data/features/source_extracts/gee_vegetation.json
```

Then regenerate and validate:

```bash
npm run data:features
npm run data:rank
npm run data:artifacts:validate
npm run data:candidates:validate
```

## 4. GHSL Settlement Context

Purpose: optional settlement or built-up cross-check.

Missing this is acceptable for now because WorldCover, WorldPop, and OSM already provide stronger MVP signals.

### What The User Should Do If This Is Needed

1. Go to GHSL GHS-SMOD 2023:
   https://human-settlement.emergency.copernicus.eu/ghs_smod2023.php

2. Download the 2020, 1 km settlement model product. The file name is expected to look like:

```text
GHS_SMOD_E2020_GLOBE_R2023A_54009_1000_V1_0.zip
```

3. Upload or place it here:

```text
/home/ubuntu/work/chaka/data/raw/ghsl/
```

4. Tell the agent:

```text
GHSL SMOD 2020 zip is in data/raw/ghsl/
```

### Recommended Use

Use GHSL as context or an OSM settlement-gap cross-check. Do not treat it as a major scoring pillar unless the product choice and scoring role are explicitly decided.

## Recommended Priority

1. SRTM terrain if official tiles can be supplied.
2. WDPA if safeguard credibility matters for the next demo or donor story.
3. Sentinel/Landsat through Earth Engine if vegetation evidence is the next priority.
4. GHSL only as optional context.

After the user uploads any required data, the agent should run the relevant extractor, regenerate features and rankings, validate artifacts, then commit and push the derived outputs and code/docs changes to `main`.
