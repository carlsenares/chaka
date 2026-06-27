# Sources

Prepared: 2026-06-27

This file is the operational source matrix for Chaka. It answers:

- where each factor comes from;
- what it contributes to the current candidate-site features;
- which sources should be rechecked for updated data;
- which local PDF/research sources are static context and cannot be refreshed automatically.

GBIF note: the GBIF extractor works, but the current candidate polygons have sparse
filtered occurrence records. That means GBIF is useful as auditable observation
context now, but not strong enough to drive scoring weights yet.

## Recheckable Source Matrix

These sources are public datasets, APIs, web catalogues, or access-controlled
data portals. They can change over time and should be rechecked before major
model/scoring updates.

| Source | Provider | What We Get | Current Pipeline Use | Artifact / Script | Recheck Trigger | Current Status |
| --- | --- | --- | --- | --- | --- | --- |
| Ethiopia administrative boundaries COD-AB | HDX/OCHA | Admin labels, AOI geometry, region/zone/woreda names, area | Candidate-site generation and admin labels | `scripts/aoi-boundary-builder.mjs`, `data/processed/candidate_sites.geojson` | Check for boundary releases or region/name changes before production use | Source-derived |
| ESA WorldCover 2021 v200 | ESA | Land-cover classes and land-cover mix | `land_cover_primary`, `land_cover_mix`, water/built-up context | `scripts/extract-worldcover-land-cover.py`, `data/features/source_extracts/worldcover_land_cover.json` | Check when ESA releases a newer WorldCover product | Source-derived |
| CHIRPS v2.0 Africa monthly | UCSB Climate Hazards Center | Monthly rainfall totals and recent reliability | `rainfall_mean_mm`, `rainfall_reliability_score` | `scripts/extract-chirps-rainfall.py`, `data/features/source_extracts/chirps_rainfall.json` | Re-run when adding newer months/years or changing climate baseline | Source-derived |
| SoilGrids 2.0 | ISRIC | Modeled SOC and pH rasters | `soil_organic_carbon_score`, `soil_ph_suitability_score` | `scripts/extract-soilgrids-soil.py`, `data/features/source_extracts/soilgrids_soil.json` | Check when ISRIC publishes new SoilGrids layers/version | Source-derived for 15/16 sites |
| WoSIS latest / AfSIS soil observations | ISRIC / AfSIS | Measured nearby soil observations for organic carbon, total carbon, pH, texture, and water-retention variables | `source_extracts.soil_observations` context; supports SoilGrids interpretation | `scripts/extract-soil-observations.py`, `data/features/source_extracts/soil_observations.json` | Re-run before reports because WoSIS latest is dynamic | Source-derived context for 5/16 sites; Ethiopia organic/total carbon records verified; water-retention layers discovered but not yet used |
| Hansen Global Forest Change / GFW | UMD / Global Forest Watch | Baseline tree cover, annual tree-cover loss, valid land mask | `forest_loss_score`, tree-cover context | `scripts/extract-gfw-umd-forest-change.py`, `data/features/source_extracts/gfw_umd_forest_change.json` | Check annually when new GFW/Hansen loss year is released | Source-derived |
| WorldPop Ethiopia population | WorldPop | Population count and density raster | `population_pressure_score` | `scripts/extract-worldpop-population.py`, `data/features/source_extracts/worldpop_population.json` | Check when choosing a newer population year/product | Source-derived for 15/16 sites |
| OpenStreetMap Ethiopia extract | Geofabrik / OSM contributors | Roads, settlements, mapped population-like tags | `road_access_score`, `settlement_proximity_score`, fallback population proxy | `scripts/extract-osm-access.py`, `data/features/source_extracts/osm_access.json` | Re-run when the Geofabrik `.osm.pbf` is refreshed | Partial source-derived |
| GBIF occurrence search | GBIF publishers | Georeferenced occurrence records, species counts, basis-of-record, coordinate uncertainty, dataset summaries, taxon/date filters, sampling-bias context | `source_extracts.biodiversity_observations`; no ranker weight yet | `scripts/extract-gbif-biodiversity.py`, `data/features/source_extracts/gbif_biodiversity.json` | Re-run before biodiversity scoring changes or reports; GBIF changes continuously | Ethiopia API counts verified 2026-06-27; extractor works, but current candidate polygons have insufficient records under current filters |
| Hawassa University / GBIF Bale Mountains plant diversity and structure dataset | Hawassa University / GBIF | Plot-level plant diversity and structure records with DBH, height, crown diameter, growth habit, habitat, and land-use context | Future local validation for woody plant biodiversity/restoration response; not national scoring | Not implemented | Recheck GBIF DOI/update status before local validation use | Use-later; local Bale Mountains dataset, CC0, 2024-2025 |
| SRTMGL1 terrain | NASA/USGS | Elevation and slope | `slope_mean_deg`, `slope_risk_score`, `source_extracts.terrain` | `scripts/extract-srtm-terrain.py`, `data/features/source_extracts/srtm_terrain.json` | Recheck only if tile/source path changes; product is static | Source-derived for 16/16 sites from coworker-provided artifact; raw official tiles are not committed |
| Sentinel-2 L2A COGs | ESA/Copernicus via Element84 Earth Search | Current NDVI/EVI and seasonal vegetation condition | `ndvi_current`, `evi_current`, `source_extracts.vegetation` | `scripts/extract-vegetation-indices.py`, `data/features/source_extracts/vegetation_indices.json` | Re-run frequently when current-season vegetation state matters | Partial source-derived for 16/16 sites; current NDVI/EVI only |
| Landsat Collection 2 L2 COGs | USGS/NASA via Microsoft Planetary Computer | Long-term NDVI trend and vegetation baseline | Optional `ndvi_trend_5y` via `npm run data:vegetation:trend` | `scripts/extract-vegetation-indices.py` | Re-run when trend window or current year changes | Implemented as opt-in; signed COG reads are too slow for default PR workflow |
| Sentinel-1 GRD | ESA/Copernicus via Earth Engine or alternate raster path | Radar vegetation/structure and moisture proxies | Optional vegetation/degradation context | Not implemented | Recheck if radar features become a scoring target | Blocked on Earth Engine/auth or alternate public raster workflow |
| WDPA protected areas | UNEP-WCMC / IUCN Protected Planet | Protected-area overlap and safeguard context | Intended for `protected_area_overlap_pct`, `safeguard_risk_score` | Not implemented | Recheck monthly release and license/redistribution terms | Blocked pending access/terms decision |
| GHSL GHS-SMOD settlement model | European Commission JRC | 1 km settlement degree-of-urbanization classes and class fractions | `source_extracts.settlement_context`; optional WorldPop/OSM cross-check | `scripts/extract-ghsl-settlement.py`, `data/features/source_extracts/ghsl_settlement.json` | Recheck when GHSL publishes a newer release/epoch | Source-derived context; does not replace access or population scores |
| FAO WaPOR v3 L2 annual products | FAO | Actual evapotranspiration/interception, total biomass production, gross and net biomass water productivity | `source_extracts.water_productivity`; water/productivity/livelihood-support context | `scripts/extract-wapor-water-productivity.py`, `data/features/source_extracts/wapor_water_productivity.json` | Recheck when adding newer years or changing WaPOR products/version | Source-derived context; default products are `L2-AETI-A`, `L2-TBP-A`, `L2-GBWP-A`, `L2-NBWP-A` for 2023-2025 |
| Curated local research context | Local PDF bundle / source matrix | Evidence cards for local caveats, methods, policy context, and geography-aware implementation notes | `source_extracts.local_research_context`; context-only, no score override | `scripts/extract-local-research-context.mjs`, `data/features/source_extracts/local_research_context.json` | Re-run when PDFs or the curated evidence index change | Context-derived for 16/16 sites; strongest explicit local match is Gimbo/SWE-007 |
| NHM Biodiversity Intactness Index | Natural History Museum | Modeled biodiversity intactness / ecosystem condition | Future coarse biodiversity pressure/context layer | Not implemented | Recheck model version before use | Use-later; public metadata and DOI verified, but direct zip download is Cloudflare-challenged from the server, so user-provided zip may be needed |
| GLOBIO / GLOBIOweb | PBL / GLOBIO consortium | Modeled mean species abundance and pressure-based biodiversity condition | Future secondary ecosystem-condition screen | Not implemented | Recheck model/version and data access before use | Use-later; modeled secondary layer |
| GFW/WRI forest carbon flux | WRI / GFW | Modeled gross removals, emissions, net forest carbon flux | Future carbon stock/flux context | Not implemented | Recheck product period, API key requirements, and tile availability | Use-later; public metadata verified but raster download endpoint requires a valid GFW API key from this host; modeled period totals, not annual trend unless normalized |
| ESA CCI Biomass v7.0 | ESA CCI / CEDA | 100 m annual aboveground biomass maps with uncertainty for 2005-2012 and 2015-2024 | Future carbon stock layer | Not implemented | Recheck release/version and storage strategy | Use-later; GeoTIFF/NetCDF, very large download |
| GEDI L4A footprint AGBD v3 | NASA ORNL DAAC / Earthdata | Footprint aboveground biomass density with uncertainty and quality flags | Future observed biomass validation/calibration anchor | Not implemented | Recheck product version and Earthdata access | Use-later; account/heavy processing |
| GEDI L4B gridded AGBD v2.1 | NASA ORNL DAAC / Earthdata | 1 km gridded aboveground biomass density with standard error | Future coarse biomass/carbon screening layer | Not implemented | Recheck product version and Earthdata access | Use-later; account/heavy processing |
| Irrecoverable carbon maps | Conservation International / global carbon mapping authors | Aboveground, belowground, soil, irrecoverable/manageable/vulnerable carbon layers | Future "do not lose" carbon and climate-security safeguard context | Not implemented | Recheck dataset version and licensing before use | Use-later; conservation-priority layer, not carbon-credit accounting |
| KBA / WDKBA / IBAT | KBA Partnership / BirdLife / IBAT | Key Biodiversity Area polygons and trigger species/ecosystems | Future conservation-priority and safeguard layer | Not implemented | Recheck access approval and redistribution terms; IBAT updates roughly twice per year | Blocked pending access; non-commercial GIS request or IBAT subscription/API required |
| Global Biodiversity Data Viewer / DOPA | European Commission JRC | Country biodiversity indicators, protected areas, KBAs, pressures, and reporting context | Future country-level QA/reporting and biodiversity indicator context | Not implemented | Recheck portal/layer availability before report generation | Use-later; mostly indicator/reporting context |
| IUCN Red List spatial data | IUCN | Threatened-species ranges and threat categories | Future threatened-species weighting and gap filling | Not implemented | Recheck Red List version and terms | Blocked/use-later pending terms; refine ranges by land cover/elevation and cross-check with GBIF/eBird |
| IUCN/UNEP-WCMC species richness refined by Area of Habitat | IUCN / UNEP-WCMC | Raster species richness and rarity-weighted richness refined by habitat/elevation assumptions | Future modeled threatened-species richness and rarity context | Not implemented | Recheck release/version and terms | Use-later; modeled, not occurrence evidence |
| 2026 Ethiopia Species Habitat Index preprint | Research authors / ResearchGate preprint | Ethiopia-specific plant habitat-change study using occurrences, IUCN habitat preferences, and 1992-2020 land cover | Future method/context for plant habitat and endemicity scoring, pending source-data access | Not implemented | Recheck publication status and downloadable source data | Use-later; preprint, not automation-ready |
| eBird EBD / EOD via GBIF | Cornell/eBird / GBIF | Bird checklists and bird occurrence records; EBD includes effort metadata | Future effort-corrected bird biodiversity layer; EOD/GBIF is easier but less complete for effort correction | Not implemented as separate extractor; EOD can be tagged through GBIF | Recheck monthly download and terms | Use-later; account/terms required for EBD |
| Genesys PGR / EBI genebank | Genesys / Ethiopian Biodiversity Institute | Crop genetic-resource and agrobiodiversity accessions | Future agrobiodiversity/crop-wild-relative relevance, not general wild biodiversity | Not implemented | Recheck API/account access and source scope | Use-later; EBI pages were not directly verified due access blocking |
| Crop Wild Relative Global Occurrence Database | Crop Trust / GBIF | Crop wild relative occurrence records | Future agrobiodiversity, food-security, and livelihood context | Not implemented | Recheck GBIF dataset/version and Crop Trust source availability | Use-later; historical compiled occurrences |
| Soils4Africa / Soil Data of Africa | Soils4Africa / ISRIC ecosystem | Soil field/lab observations and mapped products | Future measured soil, bulk density, water-holding context | Not implemented | Recheck when stable catalogue/API/file URLs exist | Blocked; visible links were not automation-ready |
| Ethiopia Restoration Atlas | MEFCC / WRI | Restoration opportunity classes and weak-label context | Future context or weak labels, not ground truth | Not implemented as extractor | Recheck download/API availability | Use-later |
| CIFOR-ICRAF Ethiopia FLR tree species atlas | CIFOR-ICRAF | Tree species suitability/context | Future species suggestions and local restoration guidance | Not implemented | Recheck atlas/source availability before recommendations | Context/use-later |

## Static Local Research And PDF Sources

These files are committed or expected under `research/source_candidates/papers/`.
They are not live data feeds, so they cannot be rechecked automatically in the
same way as API/catalogue sources. They can be reviewed again, OCRed, or replaced
by newer editions if someone provides a new file.

| File / Source | What It Is Used For | Current Use Class | Why It Is Static |
| --- | --- | --- | --- |
| `2026_submission_frel_frl_eth_final.pdf` | Ethiopia forest reference level methods, forest definition, carbon/MRV framing | Context and official coefficients/methods | PDF snapshot; recheck only if Ethiopia submits a newer FREL/FRL |
| `National-Forest-Inventory-Final-Report_2018-compressed-compressed_compressed.pdf` | National forest inventory methods, stratification, forest/carbon assumptions | Context and QA | PDF report; raw plot/raster data are not included |
| `ETH_FOREST_COVER-_DEFORESTATION_report_final_EFD_JUNE_2024.pdf` | National forest-cover/deforestation context and driver priors | Context and QA | PDF report; direct raster/vector assets must be obtained separately |
| `Ethiopia_First BUR.pdf` | GHG inventory and AFOLU reporting context | Context-only | Historical reporting PDF; not a current spatial layer |
| `R-PP Ethiopia-final May 25-2011.pdf` | REDD readiness, drivers, MRV design, stakeholder context | Context-only | Historical PDF; not current enough for scoring coefficients |
| `Sixth-national-report-on-the-implementation-of-NBSAP-2015-2020.pdf` | Policy alignment, biodiversity targets, protected-area and ecosystem-service framing | Context-only | Static national report |
| `Biodiversity-Indicators-for-Ethiopia-English.pdf` | Biodiversity indicator framing and national reporting language | Context-only | Static report; not machine-ready spatial data |
| `GBIF_CountryReport_ET.pdf` | GBIF country-level biodiversity data context | Context-only and QA for GBIF interpretation | Static report; live GBIF API is the recheckable source |
| `MammalsofBaleMountansNationaPark_Walia-SpecialEdition.pdf` | Potential Bale Mountains mammal context | Blocked OCR/manual extraction | Current text extraction is not usable enough for ingestion |
| `migration-conservation-bale-mountains-ecosystem-report.pdf` | Bale Mountains migration, grazing, forest coffee, conservation pressure, livelihood context | Context-only | Static local report; not national scoring data |
| `Alemayehu Haile.pdf` | Local soil/livelihood/restoration context, subject to manual QA | Use-later context | Thesis/report PDF; needs structured extraction before any scoring use |
| `Wondimu Mamo.pdf` | Local erosion/soil/land-management context, subject to manual QA | Use-later context | Thesis/report PDF; needs structured extraction before any scoring use |

## Interpretation Rules

- Live/recheckable source artifacts may enter the pipeline when extraction,
  provenance, and validation are implemented.
- Static PDFs may support explanation, assumptions, citations, and caveats, but
  should not directly change scores unless a specific table/value is extracted
  with geography, date, unit, citation, and QA metadata.
- Observed sources and modeled sources must remain separate. GBIF/WoSIS/GEDI L4A
  are observation anchors; SoilGrids/BII/ESA CCI/GFW carbon products are modeled
  surfaces.
- Sparse observation records are not negative evidence. For example, zero GBIF
  records in a candidate polygon means insufficient GBIF observations under the
  current filters, not low biodiversity.
- Restricted or terms-limited data should not be committed to git unless the
  license explicitly permits it.

## Current Gap Summary

The current system has working source-derived coverage for admin geometry, land
cover, current vegetation indices, rainfall, terrain, forest disturbance
context, SoilGrids soil, WorldPop population, partial OSM access, GHSL
settlement context, WaPOR water/productivity context, nearby soil observations,
and GBIF biodiversity observation context. It also has context-derived local
research evidence cards for caveats and implementation notes. Remaining
high-value gaps are vegetation trend, safeguards, carbon stock/flux, modeled
biodiversity condition, and conservation-priority layers.
