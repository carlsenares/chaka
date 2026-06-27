Below is the **dataset\-grounded version** of the hackathon concept\. I adapted the idea around the exact data themes in the uploaded brief: admin boundaries, Ethiopia restoration atlas, Sentinel/Landsat imagery, ESA land cover, forest change, rainfall, terrain, soils, safeguards, population/settlement data, OSM/HOTOSM, and CIFOR\-ICRAF tree\-species suitability\.

# 1\. Dataset links found

*[Table view](https://miro.com/app/board/uXjVHBWCAl4=/?moveToWidget=3458764676722247075&cot=14)*

| Theme | Dataset / portal | Link source | How it supports the idea |
| --- | --- | --- | --- |
| Area of interest | HDX/OCHA Ethiopia Admin 0–3 boundaries | HDX Ethiopia subnational administrative boundaries\. \(Humanitarian Data Exchange\) | Filter to South Ethiopia and Southwest Ethiopia Peoples’ Region; aggregate scores by region, zone, woreda, kebele where available\. |
| Restoration context | Ethiopia Tree\-Based Landscape Restoration Atlas / MEFCC\-WRI | Ethiopia Restoration Atlas\. \(eth\.restorationatlas\.org\) | Gives Ethiopia\-specific restoration options and priority context; useful for matching interventions to local landscapes\. |
| Current satellite imagery | Sentinel\-2 / Harmonized Sentinel\-2 Surface Reflectance | Google Earth Engine Sentinel\-2 dataset\. \(Google for Developers\) | NDVI/EVI, vegetation health, degradation, bare land, cropland\-tree mosaics, recent land condition\. |
| Historical change | Landsat Collection 2 Surface Reflectance | Google Earth Engine Landsat Collection 2\. \(Google for Developers\) | Long\-term vegetation and land\-cover trends; useful for baseline and additionality screening\. |
| All\-weather imagery | Sentinel\-1 SAR | Google Earth Engine Sentinel\-1 GRD\. \(Google for Developers\) | Works in cloudy regions; adds moisture/structure signals and helps where optical imagery is limited\. |
| Land cover | ESA WorldCover 10 m | ESA WorldCover data access / Earth Engine\. \(WorldCover\) | Land\-cover baseline for cropland, shrubland, forest, grassland, bare areas and settlement masking\. |
| Forest change | Global Forest Watch / UMD tree\-cover loss, gain, canopy data | Global Forest Watch datasets\. \(globalforestwatch\.org\) | Detect past loss/gain, current canopy context, restoration opportunity and degradation pressure\. |
| Rainfall | CHIRPS rainfall | Climate Hazards Center CHIRPS\. \(chc\.ucsb\.edu\) | Rainfall reliability, drought risk, seasonal suitability and tree\-establishment risk\. |
| Terrain | SRTM DEM 30 m | NASA/USGS SRTM in Earth Engine\. \(Google for Developers\) | Elevation, slope, erosion risk, watershed position and accessibility constraints\. |
| Soils | SoilGrids / ISRIC | ISRIC SoilGrids\. \(isric\.org\) | Soil organic carbon, pH, texture, water\-holding indicators and soil restoration potential\. |
| Safeguards | WDPA / Protected Planet | WDPA protected areas\. \(Protected Planet\) | Avoid harmful interventions in protected/sensitive zones; flag biodiversity safeguards\. |
| Population pressure | WorldPop Ethiopia | WorldPop Ethiopia population counts\. \(hub\.worldpop\.org\) | Estimate livelihood need, fuelwood pressure, settlement proximity and beneficiary potential\. |
| Settlements / roads | GHSL, OpenStreetMap, HOTOSM | GHSL from JRC; HOTOSM Ethiopia roads; Geofabrik Ethiopia extracts\. \(data\.jrc\.ec\.europa\.eu\) | Accessibility, implementation cost, proximity to communities, road access and social\-risk screening\. |
| Species suitability | CIFOR\-ICRAF Climate Change Atlas for Ethiopian FLR tree species | CIFOR\-ICRAF / World Agroforestry Atlas\. \(CIFOR\-ICRAF\) | Recommend suitable native/restoration species under current and future climate conditions\. |

# 2\. Adapted hackathon concept

## Concept name

**MfM Restoration Carbon &amp; Livelihood Prioritisation Engine**

A low\-cost AI \+ GIS decision\-support tool that helps **Stiftung Menschen für Menschen** identify where restoration and carbon\-potential projects in **South and Southwest Ethiopia** can deliver the strongest combined benefits for **climate, biodiversity, soil/water resilience and rural livelihoods**\.

# 3\. Problem

Menschen für Menschen and other restoration actors need to answer a difficult planning question:

**Where should restoration happen first, and which intervention type will create the highest combined impact?**

The challenge is that the necessary information is scattered across many sources:

- satellite imagery shows vegetation and land degradation,
- rainfall data shows climate and drought risk,
- soil data shows carbon and fertility potential,
- terrain data shows erosion and slope risk,
- forest\-change data shows degradation history,
- biodiversity data shows ecological sensitivity,
- population and road data show livelihood need and feasibility,
- restoration atlases show possible restoration pathways,
- field teams know local community realities\.

Without a system that combines these layers, MfM may face several pain points:

- hard to compare one woreda or kebele against another,
- hard to know whether an area is better for **ANR, FMNR, agroforestry, afforestation or watershed restoration**,
- hard to screen carbon\-project potential early,
- risk of choosing areas that look good on a map but are socially or practically difficult,
- difficult to produce donor\-ready evidence before project implementation,
- expensive feasibility studies before knowing whether a site is promising\.

So the core problem becomes:

**MfM needs a low\-cost, data\-driven way to identify, rank and justify restoration areas before investing in full field studies or carbon certification\.**

# 4\. Solution

The solution is a **geospatial AI scoring platform** that combines the datasets from the use\-case brief into one practical decision dashboard\.

The platform takes an area of interest, such as **South Ethiopia** or **Southwest Ethiopia Peoples’ Region**, and overlays multiple data layers:

- **HDX/OCHA boundaries** to define regions, zones and woredas\.
- **Ethiopia Restoration Atlas** to understand suitable restoration options\.
- **Sentinel\-2** for current vegetation condition\.
- **Landsat** for long\-term vegetation and degradation trends\.
- **Sentinel\-1 SAR** for cloudy areas and moisture/structure signals\.
- **ESA WorldCover** for land\-cover classification\.
- **Global Forest Watch / UMD** for forest loss, gain and canopy change\.
- **CHIRPS** for rainfall reliability and drought risk\.
- **SRTM DEM** for slope, elevation and erosion risk\.
- **SoilGrids** for soil organic carbon, texture and pH\.
- **WDPA** for protected\-area safeguards\.
- **WorldPop, GHSL and OSM/HOTOSM** for population pressure, settlements, road access and implementation feasibility\.
- **CIFOR\-ICRAF Climate Change Atlas** for tree\-species suitability\.

The system then produces a **Restoration Priority Score** for each candidate area\.

A simple scoring model could be:

**Priority Score = Carbon potential \+ Vegetation recovery potential \+ Biodiversity value \+ Livelihood need \+ Erosion/water benefit \+ Accessibility \+ Community feasibility − Risk**

The dashboard then recommends the best intervention type:

*[Table view](https://miro.com/app/board/uXjVHBWCAl4=/?moveToWidget=3458764676722247077&cot=14)*

| Site condition | Recommended intervention |
| --- | --- |
| Degraded hillsides with high erosion risk | Assisted natural regeneration \+ exclosures \+ soil bunds |
| Cropland with scattered trees | Farmer\-managed natural regeneration |
| Farms near settlements with livelihood pressure | Agroforestry with fruit/fodder/fuelwood trees |
| River or stream buffer zones | Riparian restoration |
| Bare or degraded land with good rainfall | Native tree planting |
| High carbon potential but low social feasibility | Field validation before investment |
| High biodiversity sensitivity | Native\-species restoration with safeguards |

# 5\. USP

The USP is that this is **not just a tree\-planting map** and not just a carbon calculator\.

It is a **multi\-benefit restoration screening engine** that combines ecological, carbon, social and feasibility data into one decision system\.

## Main USP

**It helps MfM choose restoration areas that are not only high\-carbon, but also high\-livelihood, high\-biodiversity and realistically implementable\.**

## What makes it innovative

### 1\. Multi\-benefit prioritisation

Most tools focus on one dimension: carbon, land cover or biodiversity\. This combines all major project goals into one prioritisation score\.

### 2\. Carbon pre\-screening before expensive feasibility studies

MfM can identify which areas are promising enough for deeper carbon\-project development and which areas should remain livelihood or watershed projects\.

### 3\. Intervention recommendation, not only site ranking

The tool does not simply say “this place is good\.” It says:

**This place is best for FMNR\. This place is best for agroforestry\. This place is best for ANR\. This place is risky for carbon finance\.**

### 4\. Uses low\-cost and open datasets

The concept can be prototyped using mostly open data and open\-source tools such as Google Earth Engine, QGIS, Python, Streamlit, PostGIS and Kobo/ODK\.

### 5\. Designed for NGO decision\-making

The output is understandable for programme managers, field teams and donors, not only GIS experts\.

### 6\. Strong donor and carbon\-market communication

The system can generate ranked project briefs with evidence, maps, estimated benefits, risk flags and monitoring indicators\.

# 6\. Value proposition

## For Stiftung Menschen für Menschen

**Plan restoration projects faster, cheaper and with stronger evidence\.**

The platform helps MfM:

- identify where restoration can deliver the highest combined impact,
- reduce the cost of early\-stage site screening,
- prioritise areas before committing field resources,
- align restoration with carbon, biodiversity and livelihood goals,
- avoid low\-impact or high\-risk sites,
- create donor\-ready maps and project briefs,
- build a pipeline of future carbon and restoration projects,
- monitor change over time using satellite data\.

## For field teams

**Make local planning more targeted\.**

Field teams can see which areas need ground validation and what questions to ask communities\.

## For donors

**Increase confidence that restoration funds go to the highest\-impact areas\.**

Donors get transparent evidence on why a site was selected and what outcomes are expected\.

## For communities

**Increase the chance that restoration supports real livelihood needs\.**

The tool can prioritise places where agroforestry, FMNR, water retention, erosion control or fuelwood alternatives directly support households\.

## For carbon\-project development

**Screen carbon potential early before expensive certification work\.**

The platform can separate:

- strong carbon candidates,
- livelihood\-first restoration areas,
- biodiversity\-sensitive areas,
- areas needing more field validation,
- areas too risky for carbon finance\.

# 7\. User journey

## Step 1: Programme manager selects area of interest

An MfM programme manager opens the dashboard and selects:

**South Ethiopia**, **Southwest Ethiopia Peoples’ Region**, or a specific zone/woreda\.

The system uses HDX/OCHA boundaries to define the analysis area\.

## Step 2: Platform loads environmental and social layers

The tool automatically loads the relevant datasets:

- ESA WorldCover for land cover,
- Sentinel\-2 for vegetation health,
- Landsat for long\-term change,
- Sentinel\-1 for cloud\-resistant signals,
- CHIRPS for rainfall patterns,
- SRTM for slope and elevation,
- SoilGrids for soil conditions,
- Global Forest Watch for forest change,
- WDPA for protected\-area safeguards,
- WorldPop/GHSL/OSM for communities, roads and accessibility,
- CIFOR\-ICRAF Atlas for tree\-species suitability\.

## Step 3: System identifies candidate restoration zones

The platform masks out unsuitable areas, such as dense settlements, water bodies or sensitive protected zones where intervention may require safeguards\.

It then highlights candidate areas such as:

- degraded slopes,
- low\-tree\-cover cropland,
- forest\-edge degradation zones,
- erosion\-prone landscapes,
- riparian buffers,
- low\-productivity land with restoration potential,
- areas near communities where agroforestry could support livelihoods\.

## Step 4: AI calculates restoration opportunity scores

For each grid cell, kebele or woreda, the platform calculates scores such as:

- **Carbon potential score**
- **Vegetation recovery score**
- **Biodiversity/safeguard score**
- **Rainfall suitability score**
- **Soil suitability score**
- **Erosion\-control benefit score**
- **Livelihood need score**
- **Accessibility score**
- **Implementation\-risk score**

The system then creates an overall priority score\.

Example output:

*[Table view](https://miro.com/app/board/uXjVHBWCAl4=/?moveToWidget=3458764676722247079&cot=14)*

| Area | Main opportunity | Score | Risk |
| --- | --- | --- | --- |
| Woreda A | FMNR \+ agroforestry | 87/100 | Medium grazing pressure |
| Woreda B | ANR \+ erosion control | 82/100 | High slope, difficult access |
| Woreda C | Carbon\-focused native restoration | 78/100 | Needs tenure validation |
| Woreda D | Riparian restoration | 74/100 | Flood\-season monitoring needed |

## Step 5: Platform recommends intervention type

The user clicks on a high\-priority area\.

The tool explains:

- why the area was ranked highly,
- what restoration method fits best,
- what species may be suitable,
- what risks need field validation,
- whether the area has carbon\-project potential\.

Example:

**Recommended intervention:** FMNR \+ agroforestry<br>**Why:** cropland\-tree mosaic, moderate rainfall, high livelihood need, road access, existing vegetation recovery signal<br>**Suggested species:** based on CIFOR\-ICRAF climate suitability and local nursery validation<br>**Risks:** grazing pressure and land\-tenure confirmation needed<br>**Carbon pathway:** moderate carbon potential, suitable for bundled community restoration project

## Step 6: Field team validates priority sites

MfM field officers visit the top\-ranked sites and collect simple mobile survey inputs:

- community willingness,
- land tenure clarity,
- grazing pressure,
- fuelwood pressure,
- local species preference,
- women’s workload,
- youth employment potential,
- water stress,
- conflict or access concerns\.

This field input updates the implementation feasibility score\.

## Step 7: Project brief is generated

The system generates a donor/project brief for each shortlisted area\.

The brief includes:

- map of the site,
- restoration opportunity summary,
- recommended intervention,
- expected climate benefit,
- expected livelihood benefit,
- expected biodiversity benefit,
- carbon\-readiness estimate,
- risk flags,
- monitoring indicators,
- field\-validation checklist\.

This can support internal planning, grant proposals, partner conversations or carbon\-project pre\-feasibility\.

## Step 8: Monitoring after implementation

After a project starts, the platform monitors change over time\.

It tracks:

- vegetation recovery using Sentinel\-2 NDVI/EVI,
- tree\-cover change using GFW/UMD layers,
- rainfall stress using CHIRPS,
- land\-cover change using ESA WorldCover,
- field progress from MfM teams,
- household participation and livelihood indicators from surveys\.

The dashboard can show:

**planned hectares → restored hectares → vegetation recovery → estimated carbon benefit → households reached → risk alerts\.**

# 8\. Strong hackathon MVP version

For the hackathon, the MVP should not try to solve everything\. It should focus on one powerful workflow:

## MVP: “Select Area → Rank Sites → Recommend Intervention → Generate Brief”

### Input

A user selects **South Ethiopia** or **Southwest Ethiopia Peoples’ Region**\.

### Data used in MVP

- HDX/OCHA boundaries,
- ESA WorldCover,
- Sentinel\-2 NDVI,
- CHIRPS rainfall,
- SRTM slope,
- SoilGrids soil organic carbon,
- WorldPop population,
- OSM roads,
- Ethiopia Restoration Atlas,
- CIFOR\-ICRAF species suitability\.

### Output

A ranked map of priority restoration areas with:

- priority score,
- intervention recommendation,
- carbon\-potential flag,
- livelihood\-benefit flag,
- risk flag,
- suggested next field\-validation questions\.

# 9\. One\-line pitch

- **MfM Restoration Carbon &amp; Livelihood Prioritisation Engine helps Menschen für Menschen combine open geospatial data, AI scoring and field knowledge to identify where restoration in South and Southwest Ethiopia can deliver the greatest climate, biodiversity and livelihood impact\.**

