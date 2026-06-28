# ETH_FOREST_COVER-_DEFORESTATION_report_final_EFD_JUNE_2024.pdf - page 19

Source ID: `local_research_source:eth_forest_cover_deforestation_report_final_efd_june_2024`
Page: 19
Extraction quality: text_extracted

```text
Studies examining post-classification change have shown two forest/non-forest maps can be highly
accurate with user's accuracies of about 95%, the user's accuracy of the deforestation class in the
change map is likely to be much lower, indicating that the forest change obtained by post-
classification is inaccurate (Olofsson et al., 2013).

The approach chosen to detect LULC change was a supervised change detection using change
training points (Tewkesbury et al., 2015). Therefore, image-to-image change detection was applied
following the GFOI guiding principle 1 for remote sensing (GFOI, 2014): 8When mapping forest
(LULC) change, it is generally more accurate to find change by comparing images where the
satellite imageries from base and end year processed in the same algorithm as opposed to
comparing maps estimated from images.9 In the case of change detection, the classes are
deforestation or stable. The stable ones are stable forest (forestland remaining forestland) and
stable non-forest. The deforestation classes are forest loss (forestland converted to cropland,
forestland converted to grassland, forestland converted to settlement, forestland converted to
wetland and forestland converted to other land). Such classification enables the forestry sector to
have IPCC compliant activity data (AD) for national and international reporting requirements.

The process assessed two mosaics for the year 2020 and 2023, to assess the change occurred in
this period. A target day is fixed in order to get the maximum vegetation cover and least cloud
cover as possible. All the data collection, correction and composition are implemented within
Google Earth Engine (GEE) API (Application Programming Interface) integrated with SEPAL.

As supervised classification is dependent on the quality of samples, about 16,706 training points
were generated for all of the stable and deforestation classes. Points for changes were carefully
assessed through a visual assessment using a time series of Sentinel-2 images and vegetation
indices and very high-resolution imagery available in the Google Earth.

Spectral bands such as Near Infrared (NIR), Red, Green and Blue were utilized during
classification to get better classification. Auxiliary data sources such as SRTM data, Latitude and
JRC Global Surface Water Mapping Layers, which were integrated with SEPAL, are applied
during classification. The classification has been significantly improved due to the utilization of
SRTM (terrain) data which includes elevation, aspect and slope, particularly considering Ethiopia's
rugged topography (Figure 13).


                                                                                                18
```
