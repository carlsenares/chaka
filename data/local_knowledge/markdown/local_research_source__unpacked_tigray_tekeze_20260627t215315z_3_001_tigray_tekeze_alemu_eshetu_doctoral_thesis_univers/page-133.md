# Alemu Eshetu - doctoral thesis, university of addis abeba.pdf - page 133

Source ID: `local_research_source:unpacked_tigray_tekeze_20260627t215315z_3_001_tigray_tekeze_alemu_eshetu_doctoral_thesis_univers`
Page: 133
Extraction quality: text_extracted

```text
5.2.3 Methods of Soil Loss Estimation Using RUSLE-GEE
Summary of data type, data source, and processing software for estimating RUSLE parameters
presented in Table 5.3. RUSLE is an empirical model that estimates the long-term average soil
loss rate by taking into account six factors that affect soil erosion: rainfall erosivity, soil erodibility,
slope length and steepness, cover management, and conservation practices (Renard et al., 1997;
Wischmeier & Smith, 1978). RUSLE has been very popular mainly for its easy integration with
GIS. This study uses GEE, an open-source platform for analyzing geospatial data to estimate
parameters of RUSLE and soil loss rates. GEE has been used worldwide for retrieving and
processing earth observation data.
Table 5.3 Summary of data type, data source, and processing software for estimating RUSLE parameters
 Parameters      Input data                               Source and processing environment
 R               CHIRPS-V2 rainfall data                  Obtained from GEE datasets using
                 1 km Spatial resolution for the          Javascript code ee.ImageCollection ('UCSB-
                 past 42 years (1981-2021)                CHG/CHIRPS/PENTAD')
 K               SoilGrids250m                            Filtered and computed in GEE after the data
                 Soil organic matter, soil textural       is imported from SoilGrids as (ee.Image
                 class, and soil bulk density data        ("projects/soilgrids-isric/--")
                 HiHydroSoilv2_0 (Simons et al.,          HiHydroSoilv2_0 accessed through GEE
                 2020)
                 Permeability        class,     and
                 Hydrologic group and saturated
                 hydraulic conductivity
 LS              DEM: SRTM V3 30 m                          STRM DEM is freely available in GEE
                   resolution                               and imported as (ee.Image
                 Flow accumulation: MERIT                   ("USGS/SRTMGL1_003")
                 Hydrograph dataset                         MERIT Hydrograph dataset is available in
                                                            GEE and imported as ee.Image
                                                            ("MERIT/Hydro/v1_0_1")
 C               NDVI from sentinel collections           Accessed and processed in GEE
 P               LULC and Slope data                      Image accessed and processed in GEE


There is an attempt to integrate RUSLE with GEE because of the computation power of GEE and
availability of geospatial data allows the estimation of RUSLE parameters. This approach is now
a days mentioned as GEE-RUSLE framework (Elnashar et al., 2021; Petito et al., 2022). The
popular RUSLE formula is presented in Eq. 5.5;
      A = R.K.LS.C. P                                                                              (5.5)
Where A is annual average soil loss rate (t ha−1 yr−1) at pixel level; R is a rainfall erosivity factor
(MJ mm ha−1 h−1 yr−1), K is erodibility (t ha h (ha−1 MJ−1 mm−1)); LS factor is a dimensionless

                                                    116
```
