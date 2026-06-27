# Source Candidate Triage

Prepared: 2026-06-27

This triage reviews `research/source_candidates/source_matrix.md` and the PDFs in
`research/source_candidates/papers/`. It classifies each candidate by how it
should enter the Chaka restoration-prioritization pipeline.

## Classification Key

- `use-now`: ready to implement or use immediately with public/no-auth access, or
  ready as a citable method/coefficient source.
- `use-later`: valuable, but needs product selection, heavier engineering,
  account access, or calibration before it should affect scoring.
- `context-only`: useful for assumptions, narrative, coefficients, definitions,
  or QA, but not a direct geospatial scoring input.
- `blocked`: cannot be automated or relied on until access, terms, OCR, or raw
  data availability is resolved.
- `do-not-use`: should not be used in the scoring system in its current form.
  Keep this as a separate triage flag; do not rely on `mvp_status` to carry it.

## Recommended Implementation Order

1. Add observed validation anchors that complement the current no-auth pipeline:
   WoSIS soil observations, GBIF biodiversity observations, and GBIF/eBird bird
   observations.
2. Add water/productivity context from FAO WaPOR once the exact products are
   selected.
3. Add coarse modeled biodiversity context from NHM BII.
4. Add carbon stock/flux products after deciding how to handle heavier downloads
   and Earthdata/CEDA access: GFW forest carbon flux first, then ESA CCI and
   GEDI. Keep stock and flux separate.
5. Keep KBA, IUCN, eBird EBD, Soils4Africa, and Ethiopia biodiversity platform
   sources in a tracked blocker list until access is obtained.

## Source Classifications

| Source | Class | How to use | Blockers / caveats |
|---|---|---|---|
| WoSIS latest organic carbon and total carbon | use-now | Use measured soil-profile carbon as an observation anchor for SoilGrids SOC/pH and as a confidence/uncertainty signal. Also inspect water-retention layers for soil-water support. | Point observations are sparse and unevenly sampled; preserve depth, method, positional uncertainty, and dataset metadata. |
| GBIF Ethiopia georeferenced occurrences | use-now | Build an observed biodiversity layer by taxon, date, basis of record, coordinate uncertainty, license, and dataset key. Useful for richness, rarity candidates, data gaps, and validation. | Raw occurrence density mostly reflects sampling effort. Do not use raw counts directly as biodiversity quality. Need thinning/effort correction and citation/download DOI handling. |
| eBird Observation Dataset through GBIF/EOD | use-now | Treat as a tagged bird-observation subset inside the GBIF pipeline. Useful for near-term bird presence/richness proxies. | GBIF/EOD lacks full checklist effort metadata; correct for sampling bias and record age. |
| FAO WaPOR | use-now | Add ETa, biomass production, NPP, precipitation, and water productivity as water/productivity/livelihood-support variables. | Not direct carbon stock or biodiversity evidence. Product/version choice must be explicit. |
| NHM Biodiversity Intactness Index | use-now | Use as coarse modeled ecosystem-condition context and pressure screen. | Resolution/model assumptions make it unsuitable as direct species evidence. |
| Genesys PGR / Ethiopian Biodiversity Institute genebank records | use-now | Use for agrobiodiversity and crop genetic-resource context, especially where restoration intersects crop wild relatives or local provenance. | Not a general wild-biodiversity layer; some Genesys functions may require login. |
| Ethiopia 2026 UNFCCC FREL/FRL submission | use-now | Use for official forest definition, carbon pools, MRV methods, biome strata, national coefficients, uncertainty framing, and consistency checks. Encode the forest definition as `>=0.5 ha`, `>=20% canopy`, and `>=2 m height` where compatible with products. | Not a fine spatial layer by itself. Supporting workbooks would improve exact coefficient/activity-data reproduction if obtained later. |
| Ethiopia National Forest Inventory final report | use-now | Use published tables and methods for forest definitions, stratification, biomass/carbon assumptions, species/forest-type context, and uncertainty language. | Raw Open Foris/plot data and the described biomass raster are not available from the PDF; do not treat report tables as national point data unless raw data are obtained. |
| Ethiopia 2024 forest cover / deforestation report | use-now | Use for national forest-cover/change methods, activity-data validation, driver priors, and QA against current forest masks. | The PDF is not a replacement for ingestible raster/vector layers. Request 2023 forest map, 2020-2023 change map, reference points, and confusion-matrix assets before using it as a direct layer. |
| GFW/WRI forest carbon flux layers | use-later | Use for modeled gross removals, emissions, and net flux to separate carbon protection from restoration opportunity. This is the most practical next carbon-flux layer. | Need tile/product download implementation and careful period handling. Modeled product, not field measurement; do not treat cumulative removals as annual without conversion. |
| ESA CCI Biomass v7.0 | use-later | Use as the main wall-to-wall annual AGB stock layer with uncertainty once download/subsetting is designed. | Very large product set; CEDA access and storage strategy required. Script should subset Ethiopia/year rather than fetching the full archive. Convert AGB to carbon explicitly. |
| NASA GEDI L4B gridded AGBD | use-later | Use as a 1 km biomass/carbon screen with standard error and as a cross-check for ESA CCI/current stock estimates. | Earthdata/ORNL access and product handling should be confirmed; coarser than candidate-site scale. Retain standard error band. |
| NASA GEDI L4A footprint AGBD | use-later | Use as footprint-level carbon validation/calibration and uncertainty anchor. | HDF5 footprint product is heavier to process and not wall-to-wall. Needs Ethiopia bbox filtering, quality flags, degrade flags, and prediction standard error handling. |
| Bale Mountains plant diversity and structure GBIF dataset | use-later | Use as local validation/calibration for woody plant diversity and structure, including DBH, height, crown diameter, growth habit, and habitat fields. | Strong but geographically local; do not extrapolate nationally. Needs ExtendedMeasurementOrFact parsing. |
| eBird EBD | use-later | Prefer over GBIF/EOD for bird models that need checklist effort metadata. | Requires eBird account, terms acceptance, request/download process, and monthly bulk data handling. |
| IUCN Red List spatial data | use-later | Use for threatened-species weighting and gap filling where observations are sparse. Refine ranges by habitat, elevation, and land cover. | Requires IUCN spatial-data terms. Range maps can overstate occupied habitat. |
| IUCN/UNEP-WCMC richness refined by Area of Habitat | use-later | Use as a modeled biodiversity layer after direct observation layers are stable. | Still modeled; needs terms/source verification and should not replace occurrences. |
| Irrecoverable carbon maps | use-later | Use to identify high-carbon areas to protect and climate-security priorities. | Conservation/context layer, not annual restoration sequestration or credit accounting. |
| GLOBIO / GLOBIOweb | use-later | Use as a secondary modeled biodiversity intactness/pressure screen. | Lower priority than GBIF, BII, and conservation-priority layers. |
| Crop Wild Relative Global Occurrence Database | use-later | Use for agrobiodiversity and food-security context through GBIF/CWR records. | Historical compiled occurrence data; needs taxon filtering and should not be treated as live monitoring. |
| Local soil/livelihood theses: Wondimu Mamo and Alemayehu Haile | use-later | Mine later for feature ideas around erosion, slope, soil fertility, forest pressure, household practice, and restoration adoption. | Local and noisy; table/coordinate extraction would need manual QA before ingestion. |
| Soils4Africa / Soil Data of Africa | blocked | Potentially excellent measured soil lab/field source for SOC, bulk density, texture, chemistry, and water-holding variables. | Matrix inspection found placeholder download links. Need stable catalogue/API/file URLs before automation. |
| KBA / WDKBA / IBAT / KBA GEE | blocked | High-value conservation-priority polygons for safeguards, connectivity, buffers, and trigger species. | GIS access requires non-commercial request or IBAT subscription/API; redistribution terms may restrict git storage. |
| Ethiopia Biodiversity Institute direct pages / National Biodiversity Platform | blocked | Could contain valuable national biodiversity records or metadata. | Direct access was blocked by a verification page; do not depend on it until a person confirms downloads or provides data. |
| Ethiopia Species Habitat Index preprint/raw data | blocked | Promising Ethiopia-specific plant habitat-change approach. | Raw source data/download path is not verified. Treat method as context until data are available. |
| Mammals of Bale Mountains National Park PDF | blocked | Could become local mammal context after OCR. | Extracted text is effectively empty, so it cannot be evaluated or ingested yet. Needs OCR/manual extraction. |
| Biodiversity Indicators for Ethiopia report | context-only | Use for indicator-species precedent, threatened-species framing, protected-area context, and national biodiversity reporting language. | Old report and not a machine-ready spatial layer. |
| Sixth National Report / NBSAP 2015-2020 | context-only | Use for policy alignment, targets, protected areas, invasive species, agrobiodiversity, and ecosystem-service framing. | No raw geospatial layer in the PDF. |
| Ethiopia First BUR | context-only | Use for GHG inventory context and AFOLU/forest accounting framing. | Superseded for current forest coefficients by NFI/FREL materials. |
| R-PP Ethiopia 2011 | context-only | Use for historical REDD readiness, driver, stakeholder, and MRV design context. | Historical document; not current enough for scoring coefficients. |
| Migration and Conservation in the Bale Mountains Ecosystem | context-only | Use for livelihood/pressure narrative: migration, grazing, forest coffee, agricultural encroachment, Harenna Forest, and water links. | Report tables/maps are not ready as national scoring inputs. |
| DOPA / Global Biodiversity Data Viewer | context-only | Use for country-level biodiversity/protected-area/KBA reporting and sanity checks. | Indicator focused; not enough as a raw pixel-level scoring source. |
| Older R-PP/WBISPP/FRA forest-cover estimates | do-not-use | Use only as historical background. They are inconsistent with later definitions and methods and are risky for current quantitative scoring. | No ingestion. |
| NFI 2016 wall-to-wall biomass map from report figures/text | blocked | The NFI report describes a wall-to-wall biomass map, but the actual raster is absent. | Obtain original raster and validation metadata before use. |

## Do-Not-Use Rules

These are not rejected sources, but they should not enter scoring in the listed
forms:

- Do not use raw GBIF/eBird record counts as uncorrected richness or importance.
  They mostly encode observer effort and road/access bias.
- Do not use IUCN ranges or modeled condition layers as direct occurrence
  evidence. They are secondary context unless refined by habitat, elevation, land
  cover, and date.
- Do not cite or encode values from the Mammals of Bale Mountains PDF until OCR
  or manual extraction recovers usable text/tables.
- Do not convert AGB to carbon without documenting the conversion factor and
  source.
- Do not mix carbon stock and carbon flux in one score without a named
  transformation. Stock sources include ESA CCI, GEDI, and NFI/FREL tables; flux
  and risk sources include GFW removals, emissions, and net flux.
- Do not store restricted KBA/IUCN/IBAT/eBird EBD data in git unless the license
  explicitly allows it.

## Pipeline Design Notes

Keep layer classes separate in metadata and scoring:

- `observed_anchor`: WoSIS, GBIF, eBird/EOD, GEDI L4A, local Bale plot data.
- `wall_to_wall_model`: SoilGrids, ESA CCI Biomass, GEDI L4B, GFW carbon flux,
  WaPOR, BII, GLOBIO.
- `official_context`: FREL/FRL, NFI, forest-cover report, BUR, NBSAP, R-PP.
- `conservation_priority`: KBA/IBAT, IUCN spatial data, Area-of-Habitat richness.
- `livelihood_proxy`: WaPOR productivity/water, WorldPop/GHSL, OSM access,
  existing settlement and infrastructure proxies.
- `blocked_manual`: Soils4Africa, EBI platform, KBA/IBAT, SHI preprint data.

Confidence should be explicit. Add penalties or flags for distance to observed
anchors, coordinate uncertainty, record age, basis of record, sampling effort,
model uncertainty, and product resolution.

## Next Engineering Tasks

1. Add a `data:extract:wosis` script that downloads Ethiopia WoSIS SOC/total
   carbon observations and produces candidate-site summary features plus
   metadata.
2. Add a `data:extract:gbif` script that creates gridded/candidate summaries for
   observed plants, birds, and all taxa, with filters for date, uncertainty,
   basis of record, license, and dataset key.
3. Add eBird/EOD as a GBIF subset in the same extractor, not as a separate truth
   source.
4. Add `data:extract:wapor` after choosing products for ETa, biomass production,
   NPP, and water productivity.
5. Add `data:extract:bii` as a coarse context layer.
6. Track blocked datasets in a machine-readable manifest so future agents can
   enable them without rediscovering access status.
7. For carbon, implement `gfw_flux` before heavier ESA/GEDI work, then add an
   access-aware `carbon_stock` extractor that can run ESA CCI/GEDI when
   credentials and storage are available.
