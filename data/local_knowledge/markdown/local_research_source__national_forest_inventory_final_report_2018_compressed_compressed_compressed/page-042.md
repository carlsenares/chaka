# National-Forest-Inventory-Final-Report_2018-compressed-compressed_compressed.pdf - page 42

Source ID: `local_research_source:national_forest_inventory_final_report_2018_compressed_compressed_compressed`
Page: 42
Extraction quality: text_extracted

```text
Figure 2.4      Example of validation graphic used to identify potential error cases




The data cleansing operation was supported by using the validate28 package of R29 in RStudio30
that supports this function by introducing rules based on the dataset.

All of the suspect values were first checked in the field forms and then verified and corrected if
necessary. In order to avoid decisions that can introduce bias31, the outliers were not purged
or removed from the final analysis. A similar procedure was adopted for the sample plots’ GPS
coordinates: all the coordinates have been plotted using GIS software, but in this case some
data was edited as not compatible with the plot extents and coordinates.

Regarding the verification and validation of tree species names, two different approaches have
been adopted: ex-ante and ex-post methods. In a first phase, all the scientific names were
checked using iPlant collaborative portal32 in order to check obsolete names and typos. In the
second phase, the BIOMASS33 package in R was used to introduce the corresponding scientific
name, family, genus and dry wood density.


 2.6             Data analysis
The data analysis of the field data results has been done using R language scripts and R scripts
in OF Calc34. OF Calc is a robust, modular browser-based tool for results calculation that allows
expert users to write custom R modules to personalize data analysis.

Along with Calc, Saiku35 software was used as a reporting tool to provide a flexible way to
produce aggregated results. These systems are perfectly compatible with OF Collect data,



 28      Jonge, 2017.
 29      R Core Team, 2017.
 30      RStudio Team, 2015.
 31      Pinkard and Beadle, 2000.
 32      Go, Vaughn, and McKay, 2011.
 33      Tanguy et al., 2017.
 34      FAO, 2018.
 35      http://www.openforis.org/tools/collect-earth/tutorials/saiku.html



                    28                  Ethiopia’s National Forest Inventory - Final Report
```
