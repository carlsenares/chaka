# National-Forest-Inventory-Final-Report_2018-compressed-compressed_compressed.pdf - page 147

Source ID: `local_research_source:national_forest_inventory_final_report_2018_compressed_compressed_compressed`
Page: 147
Extraction quality: text_extracted

```text
SRTM

The Shuttle Radar Topography Mission (SRTM) provides elevation data for most parts
of the earth. Recent studies on biomass mapping integrate this data into machine
learning algorithms for better estimates. For the biomass map of Ethiopia, the height
and slope information were derived on a 90 m spatial resolution.

Multi-Sensor Integration

All the above-mentioned satellite data has been merged to a single image stack
consisting of 24 layers. A visual inspection did not result in any data offsets, so that a
separate co- registration of the different layers was not necessary. The extent and pixel
spacing of the Landsat data was used as a reference for the other datasets. Therefore,
all layers were resampled to a 30 m resolution.

Classification

For the integration of the NFI data with the satellite data, a data-driven approach based
on machine learning was chosen. This approach is integrated into the OST and was
consequently run on SEPAL. In detail, the random forest regression algorithm (RF) was
used to create a model between the averaged biomass values for each of the
generalized SUs, and the average value of each of the satellite layers underlying the
generalized SUs. While this includes spatial averaging, it is assumed to account for
localization errors and spatial inhomogeneity. RF showed to be highly efficient for non-
linear relations between a set of multiple predictors (i.e. the satellite data) and the
target parameter (i.e. biomass), while at the same time easy to parameterize.
During the model elaboration, different parameter sets for the classifier are tested on
the fly. The best model was chosen based on the Out-Of-Bag estimate from the RF
classifier itself, and a Leave 5-out cross-validation procedure. In addition, the
importance of features has been used to create a subset of input features (i.e. the
satellite layers) for an additional parameter testing. All those steps are applied to avoid
overfitting of the final model, which RF is prone to when using correlated feature input.
Once the best model has been selected, it is applied on the unseen satellite data in
order to derive the final biomass estimates. While the model has been elaborated on a
reduced resolution of the satellite data (underlying the 300 m radius SU), it was applied
on the full resolution of 30 m, which represents the geometric resolution of the final
product.
In order to attribute for the structural differences of forests between the different
biome zones of Ethiopia, the country has been split into 4 zones beforehand (Figure 1).
The above- mentioned model elaboration was then applied for each zone separately.
This assures that the model represents the relation between the satellite data and the
biomass data according to the specific forest biome, which is assumed to be
homogeneous. One issue is that within the ALOS and Sentinel-1 data missing values
appeared due to strong topography. Due to the side-looking geometry of SAR
instruments, in some cases no information can be retrieved at steep slopes. In these
cases, the same classification approach has been followed for those


            127                Appendices
```
