# Ethiopia carbon and biodiversity data sources for restoration area prioritization

Prepared: 2026-06-27

## Starting point from the supplied files

The challenge deck asks for Ethiopia-wide prioritization of restoration areas by impact on biodiversity improvement, carbon storage, water/soil, and livelihood. The existing DOCX matrix already includes useful proxy and context layers: Ethiopia admin boundaries, WRI/MEFCC restoration maps, Sentinel-1/2, Landsat, ESA WorldCover, Global Forest Watch/UMD forest change, CHIRPS, SRTM, SoilGrids/ISRIC, WDPA/WorldPop/GHSL/OSM, and CIFOR-ICRAF tree suitability.

The main missing layers are not more land-cover proxies. The missing layers are:

- direct or near-direct carbon measurements or biomass products with uncertainty;
- biodiversity observations, species/plot records, threatened-species layers, and site-level biodiversity priority data;
- data with clear update paths or at least citable snapshots.

## Highest-value sources to add first

| Priority | Source | What it adds beyond the existing matrix | Coverage/use | Update/access status | Recommendation |
|---|---|---|---|---|---|
| 1 | NASA GEDI L4A Footprint Aboveground Biomass Density v3 | Lidar-footprint AGBD estimates in Mg/ha with prediction standard error, quality flags, and geolocation. This is closer to measurement than a land-cover proxy. | Global ISS latitude band, Ethiopia included; footprint diameter about 25 m; records start 2019-04-04 and continue after GEDI resumed acquisition. | ORNL DAAC/Earthdata, HDF5. Official guide revision 2026-06-05. | Use as the carbon validation/calibration layer and uncertainty anchor. Do not treat as wall-to-wall coverage. Source: https://daac.ornl.gov/GEDI/guides/GEDI_L4A_AGB_Density_V3.html |
| 2 | ESA CCI Biomass v7.0 | Wall-to-wall forest above-ground biomass raster with per-pixel uncertainty. | Global, 100 m; annual maps for 2005-2012 and 2015-2024; GeoTIFF and NetCDF. | CEDA open access, published 2026-05-21, 760 GB. | Use as the main wall-to-wall current and historical biomass/carbon stock layer. Convert AGB to carbon only with an explicit factor and cite it. Source: https://catalogue.ceda.ac.uk/uuid/6429d1aafe1e43b9b414e4a5a7f8b903/ |
| 3 | NASA GEDI L4B Gridded Aboveground Biomass Density v2.1 | 1 km x 1 km gridded AGBD and standard error from GEDI L4A samples. | Global land between about 52 N and 52 S; 2019-04-18 to 2023-03-16; Cloud Optimized GeoTIFF. | ORNL DAAC/Earthdata, complete. | Use for coarser screening and uncertainty-aware aggregation where ESA 100 m products are too heavy. Source: https://www.earthdata.nasa.gov/data/catalog/ornl-cloud-gedi-l4b-gridded-biomass-v2-1-2299-2.1 |
| 4 | Global Forest Watch / WRI forest carbon flux layers | Forest carbon gross removals, emissions from stand-replacing disturbances, and net flux. | Global forest areas. WRI dataset page states removals cover 2001-2023; MapBuilder lists net flux/emissions/removals for 2001-2024. | GeoTIFF tiled downloads via WRI/GFW; removals page last updated 2025-10-22. | Use for carbon benefit/risk ranking: current carbon sink, disturbance emissions, and net flux. Caveat: modelled; removals are total over model period, not annual trend unless divided appropriately. Sources: https://datasets.wri.org/datasets/gfw-forest-carbon-gross-removals and https://mapbuilder.wri.org/resources/ |
| 5 | WoSIS latest organic carbon and total carbon | Measured soil profile/sample organic carbon and total carbon, not just SoilGrids predictions. | Global point/profile data; Ethiopia records are present. Verified sample query returned Ethiopian organic carbon and total carbon records from AF-AfSP/AF-AfSIS-I. | ISRIC dynamic dataset via GraphQL/WFS; static snapshots released irregularly. | Add as observed soil-carbon anchor. Use to validate SoilGrids and to flag areas where soil-carbon uncertainty is high. Sources: https://data.isric.org/geonetwork/srv/api/records/2b643ef9-4bee-44d4-b50d-5020c9133b8b and https://graphql.isric.org/ |
| 6 | GBIF Ethiopia georeferenced occurrences | Direct biodiversity observations/specimens across taxa. | Verified on 2026-06-27: 1,066,954 georeferenced occurrence records for country=ET; 844,173 Animalia and 202,207 Plantae; 774,034 human observations and 150,966 preserved specimens. | GBIF API, continually updated by publishers. | Use for species richness, rarity, endemic/threatened species observations, and "data deficiency" layers. Must correct for sampling bias. Query used: https://api.gbif.org/v1/occurrence/search?country=ET&hasCoordinate=true&limit=0 |
| 7 | eBird / EOD / EBD | Large bird observation layer with dates, species, and coordinates. | Verified through GBIF: 788,908 georeferenced bird records for Ethiopia; eBird Observation Dataset contributes 664,462. EBD is richer because it includes effort metadata. | EBD direct download updated monthly for logged-in users; EOD through GBIF updated annually. | Use for bird-variety proxy, but prefer EBD over GBIF/EOD if you need effort correction. Source: https://science.ebird.org/en/use-ebird-data/download-ebird-data-products |
| 8 | Hawassa University / GBIF Bale Mountains plant diversity and structure dataset | Plot-level plant diversity and structure with DBH, height, crown diameter, growth habit, habitat, and land-use context. | Bale Mountains National Park and surroundings; 962 records from 2024-2025; plot sampling. | GBIF DOI, CC0, update frequency "as needed". | Very relevant local validation dataset for woody plant biodiversity and restoration response, but geographically local. Source: https://doi.org/10.15468/245m9v |
| 9 | World Database of Key Biodiversity Areas / IBAT / KBA GEE | Conservation-priority site polygons and trigger species/ecosystems. | Ethiopia KBAs are available through country profiles and the global WDKBA. | WDKBA managed by BirdLife for KBA Partnership; IBAT says updated twice per year. Non-commercial GIS access requires request; commercial access via IBAT. | Use as a safeguard and biodiversity opportunity layer: prioritize restoration near/around KBAs, avoid harm, and weight trigger species. Sources: https://www.ibat-alliance.org/datasets/world-database-of-key-biodiversity-areas and https://www.keybiodiversityareas.org/request-gis-data |
| 10 | IUCN Red List spatial data and richness/rarity-weighted richness | Species range polygons/points, threat category, distribution status, and derived richness/rarity layers. | Global, Ethiopia included for assessed taxa. | Red List versioned releases; spatial downloads require IUCN terms. | Use for threatened-species weighting and range-based gap filling where GBIF/eBird observations are sparse. Caveat: ranges can overstate occupied habitat; refine by land cover/elevation. Source: https://www.iucnredlist.org/resources/spatial-data-download |
| 11 | Natural History Museum Biodiversity Intactness Index | Modelled biodiversity intactness, useful for condition/pressure context. | Public BII v2.1.1 gives global rasters at about 10 km for 2000, 2005, 2010, 2015, 2020; newer 1 km annual services exist through partners. | Downloadable NHM data portal; model improves as data/model updates occur. | Use as a modelled ecosystem-condition screen, not as direct species evidence. Source: https://www.nhm.ac.uk/our-science/services/data/biodiversity-intactness-index.html |
| 12 | Genesys PGR / Ethiopian Biodiversity Institute genebank | Agrobiodiversity and crop genetic resource accessions. | EBI genebank page reports over 88,000 conserved accessions; Genesys lists 30,873 accessions in Genesys for ETH085 and 63,644 accessions with Ethiopian provenance. | Genesys web/API; some functions require login/authentication. | Use for livelihood/agrobiodiversity/crop-wild-relative relevance, not as a general wild biodiversity layer. Sources: https://www.genesys-pgr.org/wiews/ETH085 and https://www.genesys-pgr.org/iso3166/ETH |

## Additional useful sources

| Source | Type | Why it matters | Caveat |
|---|---|---|---|
| Ethiopia 2026 UNFCCC FREL/FRL submission | National forest carbon reference and MRV source | Official Ethiopia forest carbon accounting and reference-level material. FAO notes Ethiopia is finalizing a national forest inventory to derive updated forest carbon stock estimates. | Not a fine spatial prioritization layer by itself; use for national coefficients, methods, and consistency checks. Sources: https://redd.unfccc.int/media/2026_submission_frel_frl_eth_final.pdf and https://www.fao.org/forest-monitoring/news-and-events/news/news-detail/ethiopia-s-country-led-forest-monitoring-progress--from-national-ownership-and-responsibility-to-international-reporting/en |
| Ethiopia National Forest Inventory final report | National inventory report | Official report useful for biomass/carbon estimates, forest definitions, and stratification. | Raw plot data may not be public; verify before assuming point data access. Source found: https://www.efd.gov.et/wp-content/uploads/2025/05/National-Forest-Inventory-Final-Report_2018-compressed-compressed_compressed.pdf |
| Soils4Africa / Soil Data of Africa | Field observations and lab samples from 2022-2024; organic carbon content, bulk density, texture, chemistry; mapped products | Potentially excellent for soil carbon and water-holding covariates. The project aims for repeated monitoring. | The download page states CSV/GeoPackage/GeoTIFF availability, but in inspected HTML the specific links currently pointed to "#". Treat as promising but not yet fully automated until the data catalogue/API links are confirmed. Source: https://africasis.isric.org/download.html |
| FAO WaPOR | Remote-sensing biomass production, evapotranspiration, precipitation, NPP, water productivity | Good for water holding/productivity/livelihood factors and for detecting vegetation response after restoration. Covers Africa/Near East with 100 m continental/national products and 20 m sub-basin/irrigation products where available. | Agriculture/water-productivity focus; not a direct biodiversity or carbon-stock product. Source: https://www.fao.org/in-action/remote-sensing-for-water-productivity/wapor-data/en |
| Irrecoverable carbon maps | Global maps of aboveground, belowground and soil carbon density plus irrecoverable/manageable/vulnerable carbon | Useful to identify "do not lose" carbon areas and climate-security priorities, complementary to restoration sequestration. | Not an annual field measurement. Use for conservation priority, not carbon-credit accounting. Source: https://zenodo.org/records/17645053 |
| IUCN/UNEP-WCMC species richness refined by Area of Habitat | Raster species richness and rarity-weighted richness | Provides biodiversity layers that refine raw IUCN ranges by habitat/elevation assumptions. | Still modelled; not a substitute for occurrence data. Source: https://www.iucnredlist.org/resources/other-spatial-downloads |
| Global Biodiversity Data Viewer / DOPA | Country profiles, protected areas, KBAs, pressures and biodiversity indicators | Quick way to produce Ethiopia country-level reports and check global biodiversity indicators. | Country-level and indicator focused; may not expose all raw layers directly. Source: https://knowledge4policy.ec.europa.eu/biodiversity/gbdv_en |
| GLOBIO / GLOBIOweb | Modelled mean species abundance / biodiversity intactness | Useful scenario and pressure-based biodiversity condition layer. | Modelled pressure-response product; use as secondary screen. Source: https://www.globio.info/globioweb |
| 2026 Ethiopia Species Habitat Index preprint | Ethiopia-specific plant habitat-change study | Compiled georeferenced occurrence records and IUCN habitat preferences for 1,247 Ethiopian plant species, including 340 endemics, with 1992-2020 land-cover time series. | Preprint/source data access needs follow-up; do not assume raw data are downloadable. Source: https://www.researchgate.net/publication/404351341_A_National_Application_of_the_Species_Habitat_Index_for_Ethiopia_Reveals_Uneven_Habitat_Change_Across_Plant_Groups_and_Ecosystems |
| Crop Wild Relative Global Occurrence Database | Global CWR occurrence dataset, also published through GBIF | Useful where restoration intersects agrobiodiversity, food security, and wild relatives. | Historical/compiled occurrence data; not a live ecosystem monitoring layer. Sources: https://www.gbif.org/dataset/07044577-bd82-4089-9f3a-f4a9d2170b2e and https://cwr.croptrust.org/resources/databases/ |

## Verified API checks

### GBIF Ethiopia occurrence counts

Date queried: 2026-06-27.

API:

```text
https://api.gbif.org/v1/occurrence/search?country=ET&hasCoordinate=true&limit=0
```

Verified results:

- all georeferenced Ethiopia records: 1,066,954
- Animalia: 844,173
- Plantae: 202,207
- human observations: 774,034
- preserved specimens: 150,966
- machine observations: 52,887
- 2024 records: 71,539

Useful filtered APIs:

```text
Birds:
https://api.gbif.org/v1/occurrence/search?country=ET&hasCoordinate=true&classKey=212&limit=0

Plants:
https://api.gbif.org/v1/occurrence/search?country=ET&hasCoordinate=true&kingdomKey=6&limit=0

eBird through GBIF:
https://api.gbif.org/v1/occurrence/search?country=ET&hasCoordinate=true&classKey=212&datasetKey=4fa7b334-ce0d-4e88-aaae-2e0c138d049e&limit=0
```

### WoSIS Ethiopia soil carbon sample query

The ISRIC GraphQL API verified Ethiopia records for organic carbon and total carbon.

Example organic carbon record returned:

- country: Ethiopia
- dataset: AF-AfSP
- longitude/latitude: 34.25, 8.13
- depth: 0-22 cm and 22-50 cm
- organic carbon value_avg: 13.0 g/kg and 5.0 g/kg
- positional uncertainty: 100 m - 1 km

Example total carbon record returned:

- country: Ethiopia
- dataset: AF-AfSIS-I
- longitude/latitude: 39.6437, 11.3290
- depth: 0-20 cm
- total carbon value_avg: 18.4 g/kg
- positional uncertainty: circa 100 m

Useful layer names discovered through WFS:

```text
wosis_latest_orgc = organic carbon
wosis_latest_totc = total carbon
wosis_latest_wg0033 / wg1500 etc. = measured water-retention related properties
```

### Bale Mountains plant dataset

GBIF dataset key: `c7346e49-7056-4f1e-ac64-bde1286f5cec`

Verified:

- title: "Plants Diversity and Structure Under different Land Uses of Bale Mountains National Park and its surroundings, South Western Ethiopia"
- DOI: https://doi.org/10.15468/245m9v
- 962 occurrence records
- years: 2024 and 2025
- includes measurements in GBIF ExtendedMeasurementOrFact, e.g. DBH, total height, average crown diameter, growth habit
- license: CC0

## Recommended deterministic layer design

Use separate layer classes and never mix them silently:

1. Observed carbon anchors:
   - GEDI L4A footprint AGBD;
   - WoSIS/AfSIS organic and total carbon point profiles;
   - Ethiopia NFI/FREL coefficients and strata where available.

2. Wall-to-wall carbon surfaces:
   - ESA CCI Biomass v7 100 m annual AGB plus uncertainty;
   - GEDI L4B 1 km AGBD plus standard error;
   - GFW gross removals, emissions, and net flux.

3. Observed biodiversity:
   - GBIF occurrence points by taxon, date, basis of record, coordinate uncertainty, and license;
   - eBird EBD/EOD for birds, preferably with effort correction;
   - Bale Mountains plot dataset for local plant structure validation;
   - iNaturalist research-grade records through GBIF as current citizen-science observations.

4. Conservation-priority biodiversity:
   - KBA/WDKBA;
   - IUCN Red List ranges and species richness/rarity-weighted richness;
   - BirdLife IBA/DataZone where KBA access is not enough.

5. Modelled ecosystem condition:
   - NHM BII;
   - GLOBIO MSA;
   - Global Biodiversity Data Viewer/DOPA indicators.

6. Water/productivity/livelihood support:
   - FAO WaPOR actual evapotranspiration, biomass production, NPP, water productivity;
   - measured WoSIS/Soils4Africa water-retention and bulk-density variables;
   - retain existing CHIRPS, SRTM, WorldPop/GHSL/OSM layers.

## Practical scoring suggestions

- Carbon stock score: combine ESA CCI AGB latest year, GEDI L4B AGBD, and GFW aboveground/live biomass or net flux. Penalize high uncertainty.
- Carbon restoration potential: separate "current high carbon to protect" from "degraded but recoverable". Use GFW removals and potential natural forest regrowth data where appropriate, but do not confuse potential with measured stock.
- Soil carbon confidence: use SoilGrids for wall-to-wall prediction, but compute distance/coverage to WoSIS/Soils4Africa observations as a confidence penalty.
- Bird richness: use eBird/GBIF records in a grid, but rarefy or effort-correct. The raw count of records is mostly sampling effort.
- Plant richness/endemicity: use GBIF plant/herbarium records plus IUCN or Ethiopia SHI-style habitat refinement; do not treat old herbarium records as current presence without date filtering.
- Biodiversity opportunity: high weight where restoration improves buffers/connectivity around KBAs, threatened-species ranges, or high rarity-weighted richness.
- Data-gap score: identify areas with high restoration suitability but sparse GEDI/GBIF/WoSIS observations as recommended research areas.

## Limitations and sources not fully verified

- Ethiopian Biodiversity Institute/National Biodiversity Platform pages appeared in search results, but direct access was blocked by a verification page during inspection. I do not recommend relying on those pages until a browser or direct contact confirms downloadable datasets.
- Soils4Africa appears highly relevant, but the visible HTML download links inspected on 2026-06-27 were placeholders (`#`). Treat it as a promising source requiring follow-up through its catalogue/API or project contact.
- eBird Status and Trends should not be assumed to cover all Ethiopian species. The raw EBD and GBIF/EOD occurrence products are the safer starting point for Ethiopia.
- KBA/WDKBA GIS data are not immediately open for automated public download. Non-commercial requests normally take 5-10 working days; IBAT commercial/API access requires subscription.
- IUCN range maps are not direct observations. They should be refined with habitat/elevation/land cover and cross-checked against GBIF/eBird where possible.
- GFW forest carbon flux and ESA CCI Biomass are modelled remote-sensing products. They are useful and citable, but not equivalent to field plot carbon measurements.

## Search procedure

I searched and verified across the following source classes:

- supplied files: extracted PDF challenge slides and DOCX source matrix;
- spaceborne carbon and biomass: NASA GEDI L4A/L4B, ESA CCI Biomass, GFW/WRI forest carbon flux;
- measured soil carbon: ISRIC WoSIS, AfSIS, Soils4Africa, Ethiopia forest inventory/FREL;
- biodiversity observations: GBIF, eBird, iNaturalist via GBIF, Bale Mountains plot dataset, herbarium datasets;
- conservation biodiversity: IUCN Red List spatial data, Key Biodiversity Areas/IBAT/BirdLife, Global Biodiversity Data Viewer/DOPA;
- biodiversity condition models: NHM BII, GLOBIO, Species Habitat Index;
- Ethiopian/agrobiodiversity sources: Ethiopian Biodiversity Institute, Genesys, Crop Wild Relative database;
- supporting hydrology/productivity: FAO WaPOR.

No source has been invented. Where I could not verify downloadable data or automated access, I marked it as a caveat rather than a source ready for production.
