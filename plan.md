# Plan

## Concept and Dataset-Grounded Plan

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

---

## Team Structure and Implementation Plan

# Recommended team structure

## Overall MVP goal

Build a prototype that shows:

**Select region → view relevant restoration/carbon layers → rank candidate areas → explain why an area is prioritised → recommend intervention type → generate a short decision brief**

The MVP does not need to be a perfect working carbon system\. It needs to convincingly show the **decision\-making workflow** for Menschen für Menschen\.

# 1\. Workstream ownership

*[Table view](https://miro.com/app/board/uXjVHBWCAl4=/?moveToWidget=3458764676722821406&cot=14)*

| Person | Main ownership | Role in MVP |
| --- | --- | --- |
| Julia | Frontend, Figma, user journey, stakeholder demo | Owns what the user sees and how the management contact experiences the prototype |
| Patrick | Data ingestion, geospatial datasets, scoring inputs | Owns datasets, cleaning, region filtering, spatial layers, and base ranking data |
| Chirag | Reasoning layer, RAG logic, explanation engine, integration | Owns how the system reasons, explains recommendations, retrieves similar cases, and connects backend outputs to the frontend |

This split matches the three workstreams discussed in the meeting: **frontend/user journey**, **data/database**, and **reasoning/routing/agent logic**\.

# 2\. Parallel task division

## Julia — Frontend, Figma prototype, user journey

Julia should own the **stakeholder\-facing experience**\.

Her main question is:

**How will Menschen für Menschen actually use this tool?**

### Tasks

1. **Create the Lovable walkthrough**
    - Landing page / dashboard
    - Select area of interest: South Ethiopia or Southwest Ethiopia
    - Layer selection: land cover, forest loss, rainfall, soil, carbon, water, population pressure
    - Ranked areas view
    - Area detail page
    - Recommendation page
    - Project brief export screen
2. **Design the main user journey**
    - User selects a region or woreda\.
    - Tool shows available environmental and social layers\.
    - Tool ranks candidate restoration sites\.
    - User clicks one site\.
    - Tool explains why this site is recommended\.
    - Tool suggests intervention type\.
    - User exports a short project brief\.
3. **Prepare stakeholder validation questions**<br>Keep them short, as agreed in the meeting\.
4. Example questions:
    - Who would use this tool internally?
    - Would this be used individually or in a project\-planning meeting?
    - Which information would be most useful on the first screen?
    - Do you prefer a map\-first interface or a ranked\-list\-first interface?
    - What decisions should this tool support?
    - Do you already have visual or reporting guidelines?
    - Do field teams in Ethiopia need to use this directly?
5. **Define frontend API expectations**<br>Julia does not need to build the backend, but she should define what the frontend needs from the backend\.
6. Example:

```json
   {
     "region": "Southwest Ethiopia",
     "ranked_sites": [
       {
         "site_id": "SW-001",
         "priority_score": 87,
         "recommended_intervention": "FMNR + agroforestry",
         "carbon_potential": "High",
         "livelihood_benefit": "High",
         "risk_level": "Medium"
       }
     ]
   }
```

1. **Own the demo story**<br>Julia should prepare the exact 3–5 minute stakeholder flow\.
2. Example:

> “We start by selecting a target region\. The system loads open datasets\. It identifies degraded but feasible areas\. Then it ranks them based on carbon, biodiversity, livelihood and implementation feasibility\. When we click an area, we see why it was selected and what intervention type is recommended\.”

### Julia’s deliverables

- Lovable prototype
- User journey flow
- Stakeholder question list
- Frontend API requirements
- Demo script

## Patrick — Data ingestion, geospatial datasets, scoring foundation

Patrick should own the **data and geospatial foundation**\.

His main question is:

**What data do we actually have, what format is it in, and what can we reliably extract from it?**

### Tasks

1. **Review and organise all datasets**<br>For each dataset, document:
    - dataset name,
    - link/source,
    - file format,
    - coverage,
    - resolution,
    - useful columns/layers,
    - missing data issues,
    - whether it can be used in the MVP\.
2. **Create a dataset inventory table**
3. Example structure:

*[Table view](https://miro.com/app/board/uXjVHBWCAl4=/?moveToWidget=3458764676722821407&cot=14)*

| Dataset | Format | Coverage | Useful for | MVP usable? | Notes |
| --- | --- | --- | --- | --- | --- |
| HDX/OCHA boundaries | SHP/GDB | Ethiopia Admin 0–3 | Region/woreda filtering | Yes | Admin 1 fields may need cleanup |
| ESA WorldCover | Raster | Global | Land cover | Yes | 10 m resolution |
| CHIRPS | Raster/time series | Global | Rainfall/drought | Yes | Good for suitability |
| SoilGrids | Raster | Global | Soil carbon/pH/texture | Yes | Need variable selection |

1. 
2. **Clean and standardise region boundaries**<br>Especially because the meeting notes mentioned:
    - empty Admin 1 fields,
    - South West region missing or unclear,
    - region/zone data only making sense after inspection\.
3. Patrick should create a clean version of the area of interest:
    - South Ethiopia Region
    - Southwest Ethiopia Peoples’ Region
    - zones/woredas if available
4. **Prepare geospatial feature layers**<br>For each candidate area, extract simple features:
    - land\-cover class,
    - vegetation index,
    - forest\-loss signal,
    - rainfall suitability,
    - slope,
    - soil organic carbon,
    - population pressure,
    - distance to roads/settlements,
    - protected\-area overlap\.
5. **Create the first ranking dataset**<br>Patrick should produce a simple table that Chirag and Julia can use\.
6. Example:

*[Table view](https://miro.com/app/board/uXjVHBWCAl4=/?moveToWidget=3458764676722821409&cot=14)*

| site\_id | region | zone | land\_cover | slope\_score | rainfall\_score | soil\_score | population\_pressure | forest\_loss\_score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SW\-001 | Southwest Ethiopia | Zone A | Cropland/tree mosaic | 72 | 81 | 65 | 78 | 70 |
| SW\-002 | South Ethiopia | Zone B | Shrubland | 84 | 75 | 69 | 52 | 80 |

1. 
2. **Create map\-ready outputs**<br>For frontend/demo use:
    - GeoJSON for selected candidate sites,
    - CSV/JSON ranking table,
    - sample map tiles or static screenshots if live maps are too hard\.

### Patrick’s deliverables

- Dataset inventory
- Clean AOI boundary file
- Processed geospatial features
- Ranked candidate\-site table
- GeoJSON/CSV/JSON outputs for frontend and reasoning layer
- Notes on data quality problems

## Chirag — Reasoning, RAG, recommendation logic, integration

Chirag should own the **intelligence layer**\.

His main question is:

**How does the system explain what should be done, where, and why?**

### Tasks

1. **Define the scoring logic**<br>Create a transparent priority score\.
2. Example:

```
   Restoration Priority Score =
   25% carbon potential
   + 20% biodiversity/restoration relevance
   + 20% livelihood need
   + 15% erosion/water benefit
   + 10% rainfall/soil suitability
   + 10% accessibility
   - risk penalty
```

This does not need to be perfect\. It needs to be explainable\.

1. **Define intervention recommendation rules**
2. Example:

*[Table view](https://miro.com/app/board/uXjVHBWCAl4=/?moveToWidget=3458764676722821410&cot=14)*

| Condition | Recommended intervention |
| --- | --- |
| High slope \+ high degradation | Assisted natural regeneration \+ erosion control |
| Cropland/tree mosaic \+ high population pressure | FMNR \+ agroforestry |
| Riparian/water\-adjacent zone | Riparian restoration |
| High forest loss \+ good rainfall | Native tree restoration |
| High settlement overlap | Avoid large\-scale planting; validate land use first |
| High carbon but high social risk | Field validation before carbon project |

1. 
2. **Build the explanation layer**<br>The system should explain recommendations in plain language\.
3. Example:

> “This area is ranked highly because it has moderate\-to\-high rainfall, strong vegetation recovery potential, high livelihood relevance, and visible degradation near existing agricultural land\. The recommended intervention is FMNR combined with agroforestry because the area appears to be a cropland\-tree mosaic rather than fully open land\.”

1. **Design the RAG layer**<br>The RAG layer should retrieve similar restoration cases, but only when context is actually similar\.
2. Case metadata should include:
    - country,
    - climate zone,
    - rainfall range,
    - land\-cover type,
    - intervention type,
    - community context,
    - outcome: successful, unsuccessful, mixed,
    - reason for outcome,
    - relevance to Ethiopia\.
3. **Define similarity metrics for RAG**<br>This was an open question in the meeting\. Chirag should propose the first version\.
4. Suggested similarity dimensions:

*[Table view](https://miro.com/app/board/uXjVHBWCAl4=/?moveToWidget=3458764676722821412&cot=14)*

| Similarity metric | Why it matters |
| --- | --- |
| Climate zone similarity | Avoids transferring lessons from completely different ecosystems |
| Rainfall similarity | Tree survival and restoration type depend heavily on rainfall |
| Land\-cover similarity | Cropland, shrubland, degraded forest and grassland require different interventions |
| Intervention similarity | FMNR cases should be compared with FMNR cases, not generic afforestation |
| Livelihood context | Community dependence on land/fuelwood/grazing affects feasibility |
| Governance/tenure similarity | Restoration success depends on land rights and local management |
| Biodiversity context | Helps avoid inappropriate species or monoculture transfer |

1. 
2. **Create API contracts with Julia and Patrick**<br>Chirag should define what the reasoning layer receives and returns\.
3. Input from Patrick:

```json
   {
     "site_id": "SW-001",
     "region": "Southwest Ethiopia",
     "land_cover": "Cropland/tree mosaic",
     "slope_score": 72,
     "rainfall_score": 81,
     "soil_score": 65,
     "population_pressure": 78,
     "forest_loss_score": 70,
     "protected_area_overlap": false,
     "road_access_score": 69
   }
```

Output to Julia:

```json
   {
     "site_id": "SW-001",
     "priority_score": 87,
     "recommended_intervention": "FMNR + agroforestry",
     "carbon_potential": "High",
     "livelihood_benefit": "High",
     "risk_level": "Medium",
     "explanation": "This area is suitable because...",
     "similar_cases": [
       {
         "country": "Kenya",
         "intervention": "FMNR",
         "outcome": "Successful",
         "similarity_score": 0.78,
         "lesson": "Community-managed grazing rules improved survival."
       }
     ]
   }
```

1. **Own integration logic**<br>Chirag should make sure Patrick’s data can feed the reasoning layer, and Julia’s frontend can consume the outputs\.

### Chirag’s deliverables

- Scoring model
- Intervention recommendation logic
- RAG similarity framework
- Example case database structure
- Explanation generator
- API contract
- Integration between data output and frontend output

# 3\. Suggested architecture

```
                 ┌────────────────────────┐
                 │      Julia: Frontend    │
                 │   Figma / UI / Demo     │
                 └───────────▲────────────┘
                             │
                             │ API response:
                             │ ranked sites, explanations,
                             │ recommended interventions
                             │
┌────────────────────────────┴────────────────────────────┐
│               Chirag: Reasoning Layer                    │
│ scoring model + intervention logic + RAG + explanations   │
└────────────────────────────▲────────────────────────────┘
                             │
                             │ processed geospatial features
                             │ site_id, slope, rainfall, soil,
                             │ land cover, population, forest loss
                             │
                 ┌───────────┴────────────┐
                 │   Patrick: Data Layer   │
                 │ datasets / GIS / GeoJSON│
                 └────────────────────────┘
```

# 4\. Work that must be aligned before parallel development

Before everyone goes too deep, the team should agree on **three contracts**\.

## Contract 1: Site object

This is the common unit everyone uses\.

```json
{
  "site_id": "SW-001",
  "name": "Candidate Area 1",
  "region": "Southwest Ethiopia",
  "zone": "Example Zone",
  "geometry": "GeoJSON polygon",
  "land_cover": "Cropland/tree mosaic",
  "slope_score": 72,
  "rainfall_score": 81,
  "soil_score": 65,
  "forest_loss_score": 70,
  "population_pressure_score": 78,
  "accessibility_score": 69,
  "protected_area_overlap": false
}
```

## Contract 2: Recommendation object

This is what Chirag sends to Julia\.

```json
{
  "site_id": "SW-001",
  "priority_score": 87,
  "rank": 1,
  "recommended_intervention": "FMNR + agroforestry",
  "carbon_potential": "High",
  "biodiversity_benefit": "Medium",
  "livelihood_benefit": "High",
  "water_erosion_benefit": "High",
  "risk_level": "Medium",
  "main_reasons": [
    "High livelihood pressure",
    "Good rainfall suitability",
    "Moderate vegetation recovery potential",
    "Accessible from nearby roads"
  ],
  "risk_flags": [
    "Grazing pressure needs field validation",
    "Land tenure should be checked"
  ]
}
```

## Contract 3: Project brief object

This is the final donor/stakeholder output\.

```json
{
  "site_id": "SW-001",
  "title": "FMNR and Agroforestry Opportunity in Southwest Ethiopia",
  "summary": "This area is a strong candidate for restoration because...",
  "recommended_actions": [
    "Farmer-managed natural regeneration",
    "Agroforestry with suitable native and livelihood species",
    "Community validation of grazing and land-use pressure"
  ],
  "expected_benefits": {
    "climate": "High carbon and vegetation recovery potential",
    "biodiversity": "Moderate native restoration value",
    "livelihood": "High benefit due to proximity to farming communities",
    "water_soil": "High erosion-control relevance"
  },
  "next_steps": [
    "Conduct field validation",
    "Check tenure and community readiness",
    "Confirm locally suitable species",
    "Estimate implementation cost"
  ]
}
```

# 5\. Parallel development plan

## Phase 1: First alignment session

All three should agree on:

- MVP user journey,
- selected region for demo,
- data fields Patrick will provide,
- JSON structure Chirag will consume,
- JSON structure Julia will display,
- one demo scenario\.

Best demo scenario:

**“A programme manager selects Southwest Ethiopia and receives the top 5 candidate areas for FMNR/agroforestry/restoration, with reasons and risk flags\.”**

## Phase 2: Parallel build

### Julia works on:

- Figma prototype,
- dashboard screens,
- map/list/detail/brief screens,
- stakeholder walkthrough,
- visual language\.

### Patrick works on:

- dataset inventory,
- cleaning admin boundaries,
- extracting sample features,
- creating mock/real candidate site table,
- creating GeoJSON\.

### Chirag works on:

- scoring formula,
- intervention rules,
- explanation templates,
- RAG case schema,
- API contract,
- mock endpoint or JSON output\.

## Phase 3: Integration

Once Patrick has even a small sample table, Chirag can run the scoring logic on it\.

Once Chirag has sample JSON outputs, Julia can plug them into the frontend prototype\.

The team should not wait for perfect data\. Use mock data first, then replace it with real data\.

# 6\. Git / branch structure

Use separate branches to avoid blocking each other\.

```
main
├── frontend-julia
├── data-patrick
├── reasoning-chirag
└── integration
```

Recommended folder structure:

```
project-root/
│
├── frontend/
│   ├── figma-assets/
│   ├── ui/
│   └── mock-data/
│
├── data/
│   ├── raw/
│   ├── processed/
│   ├── geojson/
│   └── dataset_inventory.md
│
├── reasoning/
│   ├── scoring_model.py
│   ├── intervention_rules.py
│   ├── rag_schema.md
│   └── sample_outputs/
│
├── api/
│   ├── contracts/
│   └── sample_responses/
│
└── docs/
    ├── stakeholder_questions.md
    ├── user_journey.md
    └── demo_script.md
```

# 7\. Concrete task board

## Julia

*[Table view](https://miro.com/app/board/uXjVHBWCAl4=/?moveToWidget=3458764676722821414&cot=14)*

| Priority | Task | Output |
| --- | --- | --- |
| High | Build Figma user journey | Clickable prototype |
| High | Create dashboard wireframes | Map \+ ranked list \+ detail page |
| High | Prepare stakeholder questions | Short validation list |
| Medium | Define frontend data needs | JSON field list |
| Medium | Prepare demo script | 3–5 minute walkthrough |

## Patrick

*[Table view](https://miro.com/app/board/uXjVHBWCAl4=/?moveToWidget=3458764676722821417&cot=14)*

| Priority | Task | Output |
| --- | --- | --- |
| High | Review dataset formats and coverage | Dataset inventory |
| High | Clean South/Southwest Ethiopia boundaries | AOI file |
| High | Create sample candidate areas | GeoJSON/CSV |
| High | Extract simple geospatial indicators | Feature table |
| Medium | Document data issues | Data quality notes |

## Chirag

*[Table view](https://miro.com/app/board/uXjVHBWCAl4=/?moveToWidget=3458764676722821419&cot=14)*

| Priority | Task | Output |
| --- | --- | --- |
| High | Define scoring model | Priority score formula |
| High | Define intervention rules | Recommendation logic |
| High | Define RAG similarity metrics | Similarity framework |
| High | Create sample JSON outputs | API\-ready responses |
| Medium | Build explanation templates | Human\-readable reasoning |
| Medium | Connect Patrick’s data to Julia’s frontend | Integration logic |

# 8\. Stakeholder meeting preparation

For the management call, the team should not pitch the whole system\. The goal should be validation\.

Use this structure:

## 1\. Show the user journey

“Here is how we imagine someone at Menschen für Menschen would use the tool\.”

## 2\. Ask who the real user is

“Would this be used by management, field teams, technical staff, or all of them?”

## 3\. Ask how decisions are made

“Is restoration site selection done individually, in meetings, with local partners, or with government/donor involvement?”

## 4\. Ask about data

“Can you refine the dataset list? Do you have internal historical data from past interventions?”

## 5\. Ask about failed cases

“Do you have examples of interventions that did not work as expected? This would help us validate the recommendation logic\.”

## 6\. Ask about design expectations

“Do you already have reporting templates, map styles, dashboard expectations or internal guidelines?”

# 9\. Important decisions to make now

The team should decide these quickly:

1. **Who is the primary end user for the MVP?**<br>Recommended assumption: programme manager or restoration planning officer\.
2. **What region is used for the demo?**<br>Recommended: Southwest Ethiopia Peoples’ Region\.
3. **What is the MVP output?**<br>Recommended: top 5 ranked restoration areas with intervention recommendation and explanation\.
4. **Is the prototype live or Figma\-only?**<br>Recommended: Figma\-first, with backend logic shown using sample JSON/data\.
5. **Do you use real data or mock data?**<br>Recommended: hybrid\. Use real dataset names and structure, but allow mock candidate areas if processing takes too long\.
6. **Is RAG part of the MVP or future layer?**<br>Recommended: show RAG as a lightweight “similar cases” panel, even if the first version uses a small manually prepared case database\.

# 10\. Best MVP scope

Do not try to build the full system\.

Build this:

## MVP workflow

**Select region → See ranked restoration areas → Click one area → See explanation → See recommended intervention → Export project brief**

## MVP screens

1. Region selection screen
2. Map \+ layer overview
3. Ranked candidate areas
4. Area detail page
5. Similar cases / RAG explanation panel
6. Project brief export page

## MVP backend logic

1. Load processed candidate site table
2. Calculate priority score
3. Assign intervention type
4. Generate explanation
5. Return JSON to frontend

# 11\. Final recommended ownership

## Julia owns the product experience

She makes sure the prototype looks understandable and useful for Menschen für Menschen\.

## Patrick owns the data truth

He makes sure the datasets are usable, documented and transformed into structured inputs\.

## Chirag owns the intelligence layer

He makes sure the tool can rank, recommend, explain and retrieve similar cases\.

Together, the team should align through one shared contract:

- **Patrick produces site data → Chirag produces recommendations → Julia displays the decision journey\.**
