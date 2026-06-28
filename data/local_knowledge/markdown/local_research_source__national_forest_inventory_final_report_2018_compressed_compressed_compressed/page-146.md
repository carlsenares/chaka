# National-Forest-Inventory-Final-Report_2018-compressed-compressed_compressed.pdf - page 146

Source ID: `local_research_source:national_forest_inventory_final_report_2018_compressed_compressed_compressed`
Page: 146
Extraction quality: text_extracted

```text
to that day. For the given task the 1st of November 2016 has been chosen. This day falls
within the beginning of the dry period and should ideally pick up the vegetation signal
of still photosynthetically active woody vegetation, while the herbaceous layer already
dried out. In this way the reflectance is most related to aboveground woody biomass.
The minimum number of scenes per path/row combination had been set to 10,
assuring cloud-free observations for every pixel. The weighting factor between cloud-
freeness and target day importance was kept on 50%. Apart from the shadow
tolerance, which was set to the maximum, all other parameter settings have been kept
to the default values. Snow masking, BRDF correction as well as the median composite
option were activated for the final retrieval of the mosaic. The reason for activating the
median option were mainly agricultural fields that dependent on the pixel selection
resulted in non-homogeneous artifacts in the final mosaic.
The final mosaic was subsequently downloaded for all of Ethiopia, including all
available bands (i.e. blue, green, red, NIR, SWIR 1 and SWIR 2) on a geometric
resolution of 30 m. Further band ratios have been calculated, i.e. the NDVI, MSAVI,
NDWI and the NBR.

ALOS Kyoto & Carbon mosaic

Long-wavelength L-band data (wavelength = 23 cm) demonstrated its sensitivity to
structural forest attributes such as biomass. While there is no free and open access to
raw data, the Japanese Aerospace Exploration Agency (JAXA) provides already
preprocessed data tiles for ALOS PALSAR data. These datasets are generated on a yearly
basis and exhibit a spatial resolution of 25 m. The Open SAR Toolkit (OST) on the
SEPAL platform eases access, applies a Refined Lee Speckle filter and adds a ratio band
for RGB visualization. The 2016 mosaic, based on data from ALOS-2 PALSAR-2, was
used for the elaboration of the biomass map.

Sentinel-1 timescan mosaic

C-band radar data (wavelength = 5 cm) is actually less suited for biomass mapping
itself since the backscatter is rather a function of the canopy structure than the
structure of the tree. In addition, the signal is more sensitive to changes in soil moisture
and the roughness of the surface. However, the dense temporal sampling of the
Sentinel-1 data allows to aggregate the temporal dynamics by calculating basic
descriptive statistics, such as mean, minimum, maximum and standard deviation, in
time. This is referred to as timescan method and enhances the signal with respect to
single imagery. For the mapping, 7 wall- to-wall mosaics between September 2016 and
May 2017 and a spatial resolution of 30 m, were created. This included about 310 full
Sentinel-1 scenes. The resultant time-series data of the full country has then been used
to calculate the respective timescan layers for both the VV and the VH polarization
bands, respectively. All processing has been done with OST on the SEPAL platform,
which provides a fully-automated workflow for the data download, processing and
mosaicking.




             126               Ethiopia’s National Forest Inventory - Final Report
```
