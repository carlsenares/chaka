# ETH_FOREST_COVER-_DEFORESTATION_report_final_EFD_JUNE_2024.pdf

Source ID: `local_research_source:eth_forest_cover_deforestation_report_final_efd_june_2024`



## Page 1

National Forest Cover Mapping Report

          for the year 2023




                 By:

             Heiru Sebrala
          Worku Zewdie (PhD)
            Kefyalew Sahle
             Daniel Belay




                               April 2024


## Page 2

Contents
    Contents ........................................................................................................................................................ 1
    LIST OF TABLES ...................................................................................................................................... 2
    LIST OF FIGURES .................................................................................................................................... 3
    Acronyms ..................................................................................................................................................... 4
    Acknowledgements ..................................................................................................................................... 5
    1. Introduction ......................................................................................................................................... 6
         1.1 Background ....................................................................................................................................... 6
         1.2 Objectives........................................................................................................................................... 9
    2.     Methodology ........................................................................................................................................ 9
         2.1 Satellite data acquisition................................................................................................................... 9
            2.1.1 Planet NICFI............................................................................................................................... 9
            2.1.2 Method ......................................................................................................................................... 9
         2.2 Class definition ................................................................................................................................ 11
         2.3 Mapping scheme and mapping process ........................................................................................ 12
         2.4 Training data collection .................................................................................................................. 13
         2.5 Image Classification and post-classification editing .................................................................... 17
         2.6 Map accuracy assessment............................................................................................................... 20
            2.6.1 Reference (validation) data collection ...................................................................................... 20
            2.6.2 Bias corrected area and uncertainty estimates......................................................................... 24
         2.7 Quality Assurance and Quality Control (QA & QC) activities .................................................. 25
    3.     Results and discussion ........................................................................................................................ 26
         3.1 The forest cover change map for the period 2020-2023............................................................... 26
         3.2 The forest cover map for the year 2023 ........................................................................................ 27
         3.3 Bias corrected area estimates. ........................................................................................................ 28
         3.6 Activity data trend analysis............................................................................................................ 30
    4.     Conclusions and Recommendations ................................................................................................ 32
         4.1 Conclusion ....................................................................................................................................... 32
      4.2 Recommendations ........................................................................................................................... 32
    5. References .......................................................................................................................................... 33




                                                                                                                                                                     1


## Page 3

LIST OF TABLES
Table 1: Inputs needed for the statistical formula that calculates the overall number of samples for
the accuracy assessment. ............................................................................................................... 24
Table 2: Samples distributed in the map classes for verification (collection of reference data) . 24
Table 3: LULC after deforestation between 2020 and 2023......................................................... 27
Table 4. Confusion matrix for the forest cover map of Ethiopia for the year 2023...................... 29
Table 5: Map and adjusted (bias corrected) area estimates with uncertainty estimates for the forest
cover map of Ethiopia for the year 2023 ...................................................................................... 29
Table 6. Activity Data (AD) trend per period ............................................................................... 31




                                                                                                                                         2


## Page 4

LIST OF FIGURES
Figure 1: Planet mosaics ready for analysis for 2020 and 2023 ................................................... 10
Figure 2: SEPAL interface ............................................................................................................ 10
Figure 3. Subdivision of the AOI .................................................................................................. 11
Figure 4. Workflow of forest cover mapping of Ethiopia ............................................................. 13
Figure 5: Training dataset for the image-to-image change detection ........................................... 14
Figure 6: Training data collection for Stable Forest in SEPAL for the year 2023 ....................... 14
Figure 7: Training data collection for Stable non-forest in SEPAL for the year 2023 ................. 15
Figure 8. Training data collection for deforestation (forestland converted to cropland) (Red points)
in SEPAL ...................................................................................................................................... 15
Figure 9: Training data collection for deforestation (Forestland converted to Grassland) in SEPAL
for the year 2023 ........................................................................................................................... 16
Figure 10: Training data collection for deforestation (Forestland converted to Settlement) in
SEPAL for the year 2023 .............................................................................................................. 16
Figure 11: Training data collection for deforestation (Forestland converted to Wetland) in SEPAL
for the year 2023 ........................................................................................................................... 17
Figure 12: Training data collection for deforestation (Forestland converted to Other land) in
SEPAL for the year 2023 .............................................................................................................. 17
Figure 13:Classification of a riverine forest without SRTM data (Left) and with SRTM data (Right)
....................................................................................................................................................... 19
Figure 14: CEO interface ............................................................................................................. 21
Figure 15: Reference points in CEO ............................................................................................ 21
Figure 16: Reference points collected on the ground ................................................................... 22
Figure 17: R-shiny app interface for accuracy assessment design and analysis ......................... 23
Figure 18: LULC change map of Ethiopia (2020-2023) with two zoomed in areas of deforestation
....................................................................................................................................................... 26
Figure 19: Forest cover map of Ethiopia (2023).......................................................................... 28
Figure 20: Map area and BCA estimates with uncertainty estimates for the final forest cover map
of Ethiopia for the year 2023 ........................................................................................................ 30
Figure 21. Deforestation trend per period ..................................................................................... 31




                                                                                                                                                        3


## Page 5

Acronyms

AD         Activity Data
AFOLU      Agriculture Forestry and Other Land Uses
BAU        Business as Usual
CEO        Collect Earth Online
COP        Conference of the Parties
CRGE       Climate Resilient Green Economy
EF         Emission Factor
EFCCC      Environment Forest and Climate Change Commission
EFD        Ethiopia Forest Development
FREL/FRL   Forest Reference Emission Level/ Forest Reference Level
GEE        Google Earth Engine
GFRA       Global Forest Resource Assessment
GHG        Greenhouse Gas
IPCC       Intergovernmental Panel on Climate Change
JRC        Joint Research Centre of Europe
LT-LEDS    Long Term Low Emissions Development Strategy
LULCC      Land Use Land Cover Change
LULUCF     Land use Land Use Change and Forestry
MEFCC      Ministry of Environment, Forest and Climate Change
MMU        Minimum Mapping Unit
MtCO2e     Million tons of carbon dioxide equivalent
NDC        Nationally Determined Contribution
PA         Paris Agreement
RCMRD      Regional Centre for Mapping of Resources for Development
REDD+      Reducing Emissions from Deforestation and forest Degradation
SEPAL      System for Earth observation, data access, Processing and Analysis for Land monitoring
SOC        Soil Organic Carbon
SRTM       Shuttle Radar Topographic Mission
UNFCCC     United Nations Framework Convention on Climate Change




                                                                                                4


## Page 6

Acknowledgements

Sincere gratitude goes to Centre for International Forestry Research (CIFOR) and International
Center for Tropical Agriculture (CIAT) for funding this study. This forest cover and deforestation
mapping was done by Ethiopian Forestry Development (EFD) in collaboration with stakeholders
such as, Centre for International Forestry Research (CIFOR), Bioversity International and
International Center for Tropical Agriculture (CIAT), Space Science and Geospatial Institute
(SSGI) and Wondo Genet College of Forestry and Natural Resources (WGCFNR). Also, great
gratitude goes to stakeholders such as Bureaus of Regional states, Ministry of Agriculture (MoA),
Ethiopian Biodiversity Institute (EBI), FARM Africa Ethiopia, We Forest, Ethio wetlands, Bahir
Dar University, Amhara Region Agricultural Research Institute (ARARI), and GIZ for engaging
expertise to validate the methodology and the results.




                                                                                                5


## Page 7

1. Introduction
1.1 Background
Forest resources of Ethiopia make a significant contribution to the national economy. With forestry
being primarily a rural activity, the sector has enormous potential to contribute to the
transformation of the rural economy. The contribution by the sector should also be seen in the
value that it adds through harboring biodiversity resources and other ecosystem services such as
climate regulation, fertile soil, water, and clean air (MEFCC, 2017). Forests regulate ecosystems,
protect biodiversity, play an integral part in the carbon cycle, support livelihoods, and supply goods
and services that can drive sustainable growth (MEFCC, 2017).

The forest sector is a strong element of the Sustainable Development Goals (SDGs), particularly
SDG 13 Climate Action and SDG 15 Life on Land. A recent study (MEFCC, 2016, unpublished)
reports that in 2012-13, Ethiopia9s forests generated economic benefits in the form of cash and in-
kind income equivalent to USD 16.7 billion (111.2 billion Ethiopian Birr (ETB)), or 12.9% of the
measured value of GDP. The largest market income benefits were associated with flows of wood
fuel (firewood and charcoal) and livestock fodder from forests. In addition, 2.4 billion ETB was
attributed to non-market benefits based on Ethiopians9 willingness to pay to maintain forests.
Further, the study suggests that current GDP estimates undervalue the contribution of the forest
industry to national income by about 42%. Their assessment estimates the forest industry9s
contribution to GDP to be about 6.1% (MEFCC, 2017).

Ethiopia formulated its Climate Resilient Green Economy strategy in 2011(CRGE, 2011). The
CRGE intentionally aim at following a carbon-neutral and climate-resilient development
trajectory, and outlines a roadmap to attain middle-income status by 2025 while building climate
resilience and achieving green growth with a zero-net increase in greenhouse gas (GHG) emissions
from 2010 levels, by 2030.

The country also submitted its Intended Nationally Determined Contribution (INDC) to the United
Nations Framework Convention on Climate Change (UNFCCC) on 10 June 2015, which later
converted to Ethiopia9s 1st Nationally Determined Contribution after Ethiopia, ratified the Paris
Agreement (PA) in March 2017. The updated emission level in 2010 are estimated at 247 million
metric tons of carbon dioxide equivalents (Mt CO2e) which are projected to increase to a level of
403.5 Mt CO2e in the Business as Usual (BAU) scenario in 2030 (FDRE, 2021). The unconditional

                                                                                                    6


## Page 8

pathway will result in absolute emission levels of 347.3 Mt CO2e in 2030, which represents a
reduction against the revised BAU of 14% (-56 Mt CO2e) in 2030. The impact of further policy
interventions proposed under the conditional pathway decreases absolute emission levels to 125.8
Mt CO2e such that the combined impact of unconditional and conditional contributions represents
a reduction of 68.8% (-277.7 Mt CO2e) in comparison with the revised BAU emissions in 2030.

The Ethiopian forest stock of 17.2 million hectares is threatened by an annual deforestation rate of
0.54% i.e., an annual loss of about 91,735 hectares despite an afforestation of 18,928 ha annually
between the year 2000 and 2013 (UN-REDD, 2017). According to the Ethiopian Forest Reference
Emission Level (FREL) report, emissions from deforestation stands at 17.9 Mt CO2e/year while
removals from afforestation/reforestation are at 4.8 Mt CO2e/year highlighting significant loss of
net forestland.

Several pledges have been made at various scales: national, regional, international, to implement
climate change mitigation and adaptation actions. Parties to the UNFCCC have committed to limit
the global temperature rise well below 2 degrees Celsius by 2030 on the PA (PA, 2015). Such
ambitions and global targets require the attention and dedication of signatory parties to implement
mitigation and adaptation actions, as well as to report on progress for global accounting. Ethiopia,
as a signatory of the PA, is expected to provide timely report on progresses being made to achieve
the NDC economy wide targets.

Reporting from the Forestry sector is essential to global accounting as forests play a key role in
climate change mitigation, being vital sequesters of carbon. They can also be large emitters of
carbon dioxide and other greenhouse gasses if deforestation and forest degradation are not reduced
or halted. Measurement, reporting, and verification (MRV) requirements are put in place for
transparent emission reduction accounting and for providing safeguards against environmental and
social risks. Countries are expected to develop a well-established national forest monitoring system
(NFMS) and MRV system to measure and report progress made on reducing deforestation and
forest degradation (D&D) which can be later verified by independent parties.

Ethiopia, as one of the signatories of the Conference of the Parties (COP), has identified
Agriculture, Forestry, and Other Land Uses (AFOLU) as a key mitigation and adaptation sector in
combating climate change. Reports show that the forest cover of Ethiopia has increased from


                                                                                                  7


## Page 9

11.1% in 2010 to 17.2% in 2020, which is relatively lower compared to the East African average,
which is 18.2% (FAO, 2010; EFD, Unpublished; World bank, 2020).

Reliable estimation of forest area and changes is an important component in the MRV system for
forest resources assessment and monitoring and facilitation of result-based payments.
Accordingly, there are remarkable efforts in forest mapping and forest change detection made by
different local and international partner institutions over different periods using remote sensing
data. In this regard, one can mention as examples the national land cover map and forest cover
map produced by the then Ministry of Environment, Forest and Climate Change (MEFCC) with
the support of FAO for the year 2013, the national forest cover map produced by Environment
Forest and Climate Change Commission (EFCCC) with the support of EU for the year 2020 and
the 2016 African Regional land cover map produced by the European Space Agency (ESA).
However, due to the different forest definitions adopted by these institutions while producing the
maps, and variation in the reported accuracy of the respective maps, varying area estimates have
been derived and communicated. For example, the Global Forest Resource Assessment (GFRA,
2020) has indicated that Ethiopia9s forest assessment report (FAR) in 2020 is different from what
was reported in 2015 due to the different forest map products adopted across reporting periods.
Most importantly, a national map that abides with the latest definition of forests adopted by the
Ethiopian Forestry Development (EFD) remains to be produced. The EFD defines forest as <land
covering at least 0.5 ha of its area by trees with a height of at least 2 m and a canopy cover of at
least 20% or trees with the potential to reach to these thresholds in-situ in due course= (UN-REDD,
2017).

Several maps (e.g., ESA land cover map, NASA9s Forest Canopy Height map, Global Forest
Change map) exist at regional and global scales. However, such platforms often provide
information that is either generalized or too specific to a certain region, thus lacking the required
level of accuracy and detail to support targeted monitoring and decision making at national and
sub-national levels. Recent trends show that there is a growing availability of new datasets (e.g.,
high and moderate resolution optical and radar datasets such as Plant NICFI L1, Sentinel 2 and
Sentinel 1, etc.), advanced analytical methods (e.g. machine learning algorithms), cloud based
geospatial analysis platforms (e.g., Google Earth Engine, SEPAL, CEO, etc.), and analytical tools,
along with the rising number of national experts on the field that can enhance existing products.


                                                                                                   8


## Page 10

These trends can enable the design of a transparent, reproducible, and reliable forest map products.
Such technical processes need to be guided through the coordinated effort of national MRV
stakeholder institutions and experts in support of generating quality national reports for global
communication.

Countries are expected to follow global guidelines in developing the definition of forests and
establish a benchmark: forest reference level (FRL) and forest reference emission level (FREL)
against which changes in emission reduction are measured. Hence, this forest mapping activity
adopted the new forest definition of Ethiopia to produce a forest map for the year 2023 and a forest
cover change map between 2020 and 2023. This will enable EFD to maintain reliable information
on the country9s status of forest cover change and drivers of deforestation and forest degradation.

1.2 Objectives
The overall aim of the mapping exercise was to undertake forest cover change detection and
develop standardized forest maps consistent with the forest definition adopted by Ethiopian
Forestry Development (EFD) that will guide the delineation, demarcation and certification of
forestlands.


   2. Methodology
2.1 Satellite data acquisition
2.1.1 Planet NICFI
In order to map forestland for the year 2023 and a forest cover change map between 2020 and
2023, a high spatial resolution Planet NICFI level 1 imagery was acquired for the years 2020 and
2023 covering the boundary of Ethiopia. Planet NICFI level 1 quads for 2020 and 2023 were
downloaded and mosaicked using System for Earth Observation Data access, Processing, &
Analysis for Land Monitoring (SEPAL) for the two years considering a relatively low cloud cover
period of the year, specifically for the month of December – January (Figure 1).

2.1.2 Method

SEPAL is a web-based cloud-computing platform that enables users to create image composites,
process images, download files, create stratified sampling designs, and more activities simply
using internet browser platform (Figure 2). It is designed by the United Nation9s Food and
Agricultural Organization (FAO) to support the remote sensing and satellite-based forest

                                                                                                  9


## Page 11

monitoring efforts of developing countries. Planet NICFI mosaics were created from 01 December
2019 to 31 January 2020 and from 01 December 2023 to 31 January 2024 for the year 2020 and
2023, respectively (Figure 1).




Figure 1: Planet mosaics ready for analysis for 2020 and 2023




Figure 2: SEPAL interface
The forest mapping activity is performed by dividing the country into various areas of interest
(AOI). The area of interest (AOI) is subdivided in to 10 classes based on the vegetation type of
Friis and Demissew (2010) and agro-ecological zones (AEZ) of Ethiopia (Figure 3). Homogeneity


                                                                                             10


## Page 12

in terms of topography (elevation) and climatic parameters such as rainfall and temperature were
attained. This helped us to classify land features correctly according to the vegetation types, which
ultimately increases the accuracy of the LULC maps.




Figure 3. Subdivision of the AOI
AC = Acacia-Commiphora; CT = Combretum-Terminalia; DA = Dry Afromontane; MA = Moist
Afromontane

2.2 Class definition
The LULC maps have six classes such as Forestland, Cropland, Grassland, Settlement, Wetland
and Other land according to Intergovernmental Panel on Climate Change (IPCC) LULC classes.
According to IPCC (Eggleston, 2006; IPCC, 2014, 2003) forestland includes all land with woody
vegetation consistent with thresholds used to define forestland in the national GHG inventory, sub-
divided into managed and unmanaged, and also by ecosystem type as specified in the IPCC
Guidelines. It also includes systems with vegetation that currently fall below, but are expected to
exceed, the threshold of the forestland category.




                                                                                                  11


## Page 13

According to the forest reference emission level (FREL/FRL) of Ethiopia (UN-REDD, 2017)
8forest9 is defined as 'Land spanning at least 0.5 ha covered by trees (including bamboo) (with a
minimum width of 20 m) attaining a height of at least 2m and a canopy cover of at least 20% or
trees with the potential to reach these thresholds in situ in due course.9 (MEFCC minute cited in
UN-REDD, 2017). Non-forest can be defined as any LULC which is neither forest nor bamboo.

Deforestation/Forest loss is defined as a human-induced, permanent conversion of forest land to
another land use or land cover within a spatial resolution of the satellite imagery used.

Forest gain is defined as a permanent conversion of another land use or land cover to forest land
within a spatial resolution of the satellite imagery used in a given period of time which includes
assisted natural regeneration.

2.3 Mapping scheme and mapping process
The mapping process includes imagery data acquisition, training data collection, pre-processing
(image stacking, clipping, enhancement and mosaicking) through SEPAL, image classification
through SEPAL, post-processing, accuracy assessment and generation of bias corrected area
estimates using Collect Earth Online (CEO), R-Shiny App and MS Excel (Figure 6) and Random
forest machine learning algorithm were for image classification.




                                                                                               12


## Page 14

Data Acquisition




Planet NICFI L1 imagery for 2020                                      Training data collection
    & 2023 (through SEPAL)                                                 through Visual
                                                                           interpretation

                                    Pre-processing (through SEPAL)



                                       Supervised Classification
                                   (Random forest algorithm through
                                               SEPAL)




                         Forest cover change Maps between 2020 & 2023
                              & Forest cover map for the year 2023



                                                                                  Reference data
    Reference data                     Map Accuracy Assessment
                                                                             collection through Visual
     collection in                   (through CEO & R-Shiny App)
                                                                             interpretation using CEO
       the field


                                         Area statistics (Bias
                                      corrected area estimates)
 Figure 4. Workflow of forest cover mapping of Ethiopia

 2.4 Training data collection
 About 16,706 training data were collected for deforestation (3876) and stable (12,830) classes for
 the image-to-image change detection with visual interpretation of Very High Resolution (VHR)
 imagery from Google Earth using SEPAL covering the whole country for training the random
 forest classification algorithm (Figure 5). Demonstrations of training points per class are presented
 below in SEPAL (Figure 6-12).

                                                                                                         13


## Page 15

Figure 5: Training dataset for the image-to-image change detection




Figure 6: Training data collection for Stable Forest in SEPAL for the year 2023




                                                                                  14


## Page 16

Figure 7: Training data collection for Stable non-forest in SEPAL for the year 2023




Figure 8. Training data collection for deforestation (forestland converted to cropland) (Red points)
in SEPAL




                                                                                                 15


## Page 17

Figure 9: Training data collection for deforestation (Forestland converted to Grassland) in
SEPAL for the year 2023




Figure 10: Training data collection for deforestation (Forestland converted to Settlement) in
SEPAL for the year 2023




                                                                                          16


## Page 18

Figure 11: Training data collection for deforestation (Forestland converted to Wetland) in SEPAL
for the year 2023




Figure 12: Training data collection for deforestation (Forestland converted to Other land) in
SEPAL for the year 2023

2.5 Image Classification and post-classification editing
Post-classification change detection is not a suitable option because most historical LULC maps
do not have sufficient accuracy to derive change. Particularly, post-classification is well-known to
be error-prone since the errors of each single-date classification is being combined and reproduced.

                                                                                                 17


## Page 19

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


## Page 20

Figure 13:Classification of a riverine forest without SRTM data (Left) and with SRTM data (Right)
The selected approach for LULC mapping is supervised classification. In a supervised
classification of imagery, the user identifies representative spectral samples for each of the classes
in the digital image. The process assessed two mosaics for the year 2020 and 2023, to assess the
change occurred in this period. A target day was fixed in order to get the maximum vegetation
cover and minimum cloud cover as possible.

Despite being time-consuming and requiring extensive editing work for the misclassified pixels,
the team dedicated significant effort to edit the misclassifications. The minimum area of the forest
definition is 0.5 ha and hence the minimum mapping unit (MMU) of the map is 0.5 ha.
Accordingly, the minimum biophysical threshold values were set for forest patch area (>=0.5 ha),
tree height (>= 2m), and tree canopy cover (>=20%) for the data processing. Therefore, in order
to have a 0.5 ha MMU for Planet NICFI L1 imagery of about 5 m spatial resolution 200 adjacent
pixels were merged together. MMU is attained using the algorithm <sieve= in QGIS.

Post-classification manual editing using satellite images is a crucial technique in remote sensing
and geospatial analysis for minimizing misclassifications. Despite the effectiveness of automated
classification methods, they can still lead to misclassifications due to various factors such as
spectral confusion or limitations in distinguishing subtle differences between similar LULC types.
To address these issues, post-classification manual editing involves a detailed review of the
classified map against high-resolution satellite imagery. This enables the analysts to identify and
correct errors through visual interpretation and ensuring a higher level of accuracy. This method
requires expertise as it involves the application of image interpretation elements. For instance,
major towns in the southwestern part of Ethiopia were manually edited, and misclassified large

                                                                                                   19


## Page 21

wet grasslands were identified and manually digitized using Planet NICFI and Google satellite
images in the QGIS environment. Additionally, coffee and tea plantations in the southwest were
also manually edited features.

2.6 Map accuracy assessment
2.6.1 Reference (validation) data collection

The map9s errors are identified through verification of the map classification by visual
interpretation of 3599 points in CEO (Figure 15) and reference data collection on the ground (94
points) (Figure 16) which were the only ground survey data available at that time. About 3693
reference data (ground truth samples) were collected from visual interpretation using Very High
Resolution (VHR) imagery from Google Earth using CEO and from the field ground truthing
activities conducted in different provinces of Ethiopia for assessing the accuracy of the forest cover
map for the year 2023. CEO is a tool for collecting reference data from very high, high and medium
resolution satellite imageries. It was developed by Food and Agriculture Organization of the
United Nations (FAO) under the Open Foris Initiative. CEO is a free and open-source image
viewing and interpretation tool, suitable for projects requiring information about land cover and/or
land use. CEO enables simultaneous visual interpretations of satellite imagery, providing global
coverage from MapBox and Bing Maps, a variety of satellite data sources from Google Earth
Engine (Figure 14).




                                                                                                   20


## Page 22

Figure 14: CEO interface




Figure 15: Reference points in CEO

                                     21


## Page 23

Figure 16: Reference points collected on the ground
The classified maps may contain some sort of systematic errors related with classification
technique, nature of satellite data and methods of data capture, among others. According to good
practice guideline (GPG) of the IPCC (IPCC, 2003), emission estimates shall neither over-nor
underestimate the actual emissions as far as can be judged, and reduce uncertainties as far as
practicable given national circumstances. It is also good practice to quantify uncertainties and
report them in a transparent manner. A correct identification and quantification of the various
sources of uncertainty helps to assess the robustness of any GHG inventory and prioritize efforts
for their further development/improvement.

In order to use the classified maps, the errors were quantitatively evaluated by applying standard
accuracy assessment techniques. For this study, the accuracy assessment was performed using R-
shiny (for sample size calculation and accuracy estimation) and CEO (for reference data
collection). R-shiny is a package in R statistical software and used to generate sample size for
reference data collection and to estimate the accuracy of the maps. The reference points were

                                                                                               22


## Page 24

generated using R-Shiny app. It has two components, accuracy assessment design and accuracy
assessment analysis (Figure 17).




Figure 17: R-shiny app interface for accuracy assessment design and analysis
In proportional allocation, the overall sample size has been calculated to the classes proportional
to the area of the classes, so rare classes have been received a small proportion of the overall
sample size. The R-shiny extension used Equation 1 (Cochran, 1977) to calculate an adequate
overall sample size for stratified random sampling that can then be distributed among the different
classes. N is number of overall pixels, S(Ȏ) is the standard error of the estimated overall accuracy
that will be achieved, Wi is the mapped proportion of area of class i, and Si is the standard deviation
of class i.
                                                     Ā
                  (∑ �㕾�㖊�㕺�㖊)Ā           ∑ �㕾�㖊�㕺�㖊
      �㖏 =                             ≈(            )                              (ÿ)
                        ÿ                  �㕺(Ȏ)
           [�㕺(Ȏ) ]Ā + ( ) ∑ �㕾�㖊�㕺�㖊Ā
                        �㕵

Based on this equation, the total numbers of reference sample plots (n) used for accuracy
assessment were 3693. The plot covered 0.50 ha (71mx71m).

The required overall number of samples which was calculated using the Olofsson et al. (2013)
methodology adopting the following assumptions, using conservative user inputs to have a cost
effective and robust sample size (Table 1):

                                                                                                    23


## Page 25

Table 1: Inputs needed for the statistical formula that calculates the overall number of samples
for the accuracy assessment.

                                                    Input values selected
  The standard error of the estimated overall               0.005
  accuracy that will be achieved
  Expected user9s accuracy for forest                        0.9
  Expected user9s accuracy for non-forest                    0.9

The total required samples for the accuracy assessment are distributed proportionally across the
two map classes (Forest and Non- Forest) (Table 2). We collected reference sample data to verify
the accuracy of the map classification at each sample point location. The sample data was collected
through visual interpretation using a time series of very high-resolution imagery and high-
resolution Planet NICFI images. The visual interpretation of sample points is referred to as
<reference data=. Points where the interpreters had low confidence in the classification were
subject to field verification (83 points). Consequently, the total number of reference points used in
the accuracy assessment and bias corrected area estimation is 3693 samples. Following the
generation of reference sample plots, these reference sample plots were assessed using CEO. This
tool enables users to visually assess the LULC of sample locations with the freely available data
from Google Earth and high-spatial-resolution Planet NICFI images.

Table 2: Samples distributed in the map classes for verification (collection of reference data)

        Classes                Sample points per map class
  Forest                                    802
  Non-forest                                2797
  Total samples                             3599



2.6.2 Bias corrected area and uncertainty estimates

According to IPCC (Espejo et al., 2020; IPCC, 2003), it is good practice for countries to produce
emission estimates which: 1) neither over-nor underestimate actual emissions as far as can be
judged, introducing a systematic error (or bias), and 2) reduce uncertainties as far as practicable

                                                                                                  24


## Page 26

given national circumstances. It is also good practice to quantify uncertainties and report them in
a transparent manner. All surface estimations contain errors, most of which tend to be systematic
(bias).

The map area was corrected for bias using stratified random samples using visually interpreted
high temporal and spatial resolution satellite imagery. Classification errors were identified by
collecting sample point data, independent of the training data. The sample data verifies whether
the classification is correct or incorrect at the location of the sample points. This information is
summarized in an error matrix and the matrix is used to correct the areas per class for the map bias
resulting in new area estimates, referred to as bias-corrected area estimates. Bias corrected areas
of each class were estimated after accuracy assessment using a confusion matrix (error matrix)
(Table 7). The map area estimates are corrected for systematic error (bias) in the map and
confidence intervals are calculated around the bias-corrected area estimates as a measure of the
random error remaining in the estimate after removal of the bias. The bias-corrected area estimates
are obtained by the map area minus the over-detections (commission errors) plus the under-
detections (omission errors). E.g., the bias-corrected area estimate of forest class is calculated by
28,324,359 ha - 4,449,548 ha + 2,880,125 = 26,754,937 ha (Table 7).

To quantify and report uncertainty, confidence intervals were calculated and reported around the
bias-corrected area estimates, which provide an indication of the precision of the estimate.
Precision gives a description of random errors or variability. Large confidence intervals indicate a
large statistical variability of the population. The process of correcting the map for bias is referred
to as accuracy assessment. The 90% confidence interval for the bias-corrected area estimates are
calculated by multiplying 1.645006 by the standard error of the area estimate.

2.7 Quality Assurance and Quality Control (QA & QC) activities
Both formal and informal QA/QC methods were employed. Informal QA/QC involved qualitative
approaches to identify issues within our own analysis and classifications enabled to iterate and
create improved classifications. The team members dedicated significant time to reviewing their
own classification in order to ascertain the robustness of results. This process enabled the team to
visualize the data and collect additional training points for areas of poor classification.




                                                                                                    25


## Page 27

3. Results and discussion
     3.1 The forest cover change map for the period 2020-2023

A deforestation map was produced which demonstrates spatially explicit changes (Table 4,
Figure 18).




Figure 18: LULC change map of Ethiopia (2020-2023) with two zoomed in areas of deforestation




                                                                                           26


## Page 28

This indicates that expansion of cropland remains to be the main driver of deforestation. The
sources/drivers of forest gain may include artificial and natural regeneration and expansion of
small-scale tree plantation. Whereas, the sources/drivers of forest loss are such as urbanization,
commercial agriculture, expansion of smallholder agricultural and commodity-based extractions.
About 53 % of the deforestation is attributed to cropland followed by wetland (39 %) (Table 3).


Table 3: LULC after deforestation between 2020 and 2023
                            No    LULC after     AD (ha)         %
                                 deforestation
                            1    Cropland         58,966        53.2
                            2    Grassland         1,266         1.1
                            3    Settlement        6,256         5.6
                            4    Wetland          43,510        39.3
                            5    Other land         816          0.7
                                 Total           110,814



3.2 The forest cover map for the year 2023
The three change and stable classes were aggregated into two broad categories of Forest and Non-
Forest by keeping stable forest as a class of 8Forest’ and aggregating stable non forest, forestland
converted to cropland, forestland converted to grassland, forestland converted to settlement,
forestland converted to wetland and forestland converted to other land into a class of 8Non- Forest’
(Figure 19). The overall accuracy of the Forest / Non- Forest map for the year 2023 is 94 % (Table
4).




                                                                                                 27


## Page 29

Figure 19: Forest cover map of Ethiopia (2023)

3.3 Bias corrected area estimates.
The team collected, analyzed and interpreted images for the years 2020 and 2023. Accordingly,
the following statistical report for remaining land and change classes was prepared. As shown in
the confusion matrix table (Table 4), the overall accuracy of the assessment is 94% with varying
level of producer and user accuracy. According to IPCC GPG document assessing the accuracy of
a map and using the results of the accuracy assessment to adjust the area estimates is a good
practice (Hiraishi et al., 2014). Therefore, the bias corrected area estimates are summarized in
Table 5.




                                                                                             28


## Page 30

Table 4. Confusion matrix for the forest cover map of Ethiopia for the year 2023

                                       Reference data
                                     Forest     Non-forest    Total       UA
  Map       Forest                    719           134        853        84%
  data      Non-forest                                        2840        97%
                                       96          2744
            Total                                             3693
                                     815           2878
            PA                       88%           95%
                         Overall Accuracy                                 94%


PA = Producer9s Accuracy (Omission errors); UA = User9s Accuracy (Commission errors)
Table 5: Map and adjusted (bias corrected) area estimates with uncertainty estimates for the forest
cover map of Ethiopia for the year 2023

  Classes Map area (ha) Commission              Omission     Adjusted area estimate       90% CI
                                 errors (ha)   errors (ha)      (ha) = map area -          (ha)
                                                              Commission errors +
                                                                 Omission errors
   Forest         28,324,359       4,449,548     2,880,125                26,754,937       750,602

   Non-           85,203,704       2,880,125     4,449,548                86,773,126       750,602
   forest
   Total         113,528,063       7,329,673     7,329,673               113,528,063


The uncertainty estimate showed that the non-forest class is more certain than the forest class
(Table 5, Figure 20). The forest cover by the year 2023 is 23.6 %.




                                                                                                  29


## Page 31

Figure 20: Map area and BCA estimates with uncertainty estimates for the final forest cover map
of Ethiopia for the year 2023

      3.6 Activity data trend analysis

Having spatially explicit LULC change detection (Figure 18) leads to Approach 3 (The last
approach) of AD generation according to IPCC GPG document. Deforestation was declining from
the previous periods onwards to the current period (Figure 21, Table 6). This is probably linked to
the decline in large scale commercial agricultural investment at the expense of natural forests
(changing investment policy) and boosting Participatory Forest Management (PFM) in south-
western Ethiopia. PFM acknowledges community participation in forest management to safeguard
forests while allowing their traditional forest use. Moreover, the Green Legacy Initiative (GLI) by


                                                                                                30


## Page 32

itself created awareness about conservation of natural forests. Cultural values, traditional
knowledge and institutions also contributing a lot for forest conservation. On the other hand, forest
gain shows an increasing trend when the current period was compared to the previous periods
(2000 – 2013 (UN-REDD, 2017) and 2014 – 2020 (EFCCC, 2020)) (Table 6).

Table 6. Activity Data (AD) trend per period
                      Class                      2000 - 2013     2014 - 2020       2020 - 2023
   Forest Loss (ha)                                1,192,559          229,163           110,814
   Forest Loss (ha/yr)                                91,735            38,194            27,703
   Forest area at the end of the period (ha)      17,785,035       19,372,865        26,754,937
   Forest cover at the end of the period (%)             15.5             17.2              23.6




Figure 21. Deforestation trend per period
Despite the promising declining trend in forest cover loss (Figure 21), it is worth mentioning
cropland expansion and commodity driven deforestation would continue to occur and reverse the
magnitude unless permanence of the observed decline is maintained through strong commitment
and policy support coupled with accelerated investment in forest sector mitigation actions.




                                                                                                   31


## Page 33

4. Conclusions and Recommendations
4.1 Conclusion
CIFOR in collaboration with CIAT and EFD conducted the national forest mapping. High
resolution imagery (Planet NICFI Level 1) is used for the first time for the national scale mapping
in Ethiopia. The team has also applied a contemporary state-of-the-art techniques and tools
(SEPAL, CEO, GEE, R-Shiny App and others) for the analysis. Two distinct maps were produced
including, forest cover change map for the period 2020 – 2023 and forest cover map for the year
2023. The overall accuracy of the forest cover map for the year 2023 is 94 %. The forest cover by
the year 2023 is 26,754,937 ha (23.6 %). This product represents a significant advancement
compared to previous national, regional, and global mapping products for Ethiopia, introducing
advanced methodologies and tools and improved classification accuracies. Deforestation is
decreasing compared to the historical reference period (2000 – 2013).

4.2 Recommendations
The current forest mapping activity utilized state of the art models, processing algorithms and
high-resolution multispectral satellite imagery. This significantly improved the accuracy of the
forest mapping activity. Therefore, the following are some recommendations:

    o Strengthening collaboration with regional and local institutions (academia, research
       institutions) for quality assurance and state-of-the art research.
   o Transforming towards use of high-resolution satellite data for land monitoring is started. It
       is vital to strengthen the experience and improve the capacity of national experts for
       continuous use of high-resolution data and for future forest mapping activities.
   o Promote and disseminate the generated data and information for wider stakeholders.
   o Publishing online of the results soon for assuring open and transparent data/ Data
       democratization
   o Going to Results Based Payments (RBPs).




                                                                                                32


## Page 34

5. References
Cochran, W. G.,1977. Sampling techniques. John Wiley & Sons
Eggleston, H.S. (Ed.), 2006. 2006 IPCC guidelines for national greenhouse gas inventories.
        Institute for Global Environmental Strategies, Hayama, Japan.
Espejo, A., Federici, S., ro, G., Carly, A., Naikoa, d9Annunzio, Remi, B., Heiko, B., Pradeepa, B.,
        Cris, B., Charles, B., Luca, C., Edersson, C., Sarah, C., Narendra, Donoghue, D.,
        Eggleston, S., Fitzgerald, N., Foody, G., Galindo, G., Goeking, S., Grassi, G., Held, A.,
        Herold, M., Kleinn, C., Kurz, W., Lindquist, E., McRoberts, R., Mitchell, A., Næsset, E.,
        Notman, E., Quegan, S., Rosenqvist, A., Roxburgh, S., Sannier, C., Scott, C., Stahl, G.,
        Stehman, S., Tupua, V., Watt, P., Wilson, S., Woodcock, C., Wulder, M., 2020. Integration
        of remote-sensing and ground-based observations for estimation of emissions and removals
        of greenhouse gases in forests: Methods and guidance from the Global Forest Observations
        Initiative, Edition 3.0.
FDRE. 2010. Ethiopia’s Climate-Resilient Green Economy: Green Economy Strategy. Addis
        Ababa: FDRE. http://www. undp.org/content/dam/ethiopia/docs/Ethiopia%20CRGE.pdf.
        Accessed October 8, 2023.
FDRE,       2021.     Updated      Nationally     Determined     Contribution      of    Ethiopia.
        https://unfccc.int/sites/default/files/NDC/2022-
        06/Ethiopia%27s%20updated%20NDC%20JULY%202021%20Submission_.pdf
        (accessed November 2023)
EFCCC, 2020. Reporting on Performance in GHG Emission from Deforestation and Removals
        from Afforestation/Forest Restoration For The Period 2014 – 2020. Unpublished report.
GFRA, 2020. Global Forest Resources Assessment 2020. FAO. https://doi.org/10.4060/ca9825en
Hiraishi, T., Krug, T., Tanabe, K., Srivastava, N., Jamsranjav, B., Fukuda, M., Troxler, T. (Eds.),
        2014. 2013 revised supplementary methods and good practice guidance arising from the
        Kyoto Protocol. Intergovernmental Panel on Climate Change, Hayama, Japan.
IPCC, 2014. 2013 revised supplementary methods and good practice guidance arising from the
        Kyoto Protocol. Intergovernmental Panel on Climate Change, Geneva, Switzerland.


                                                                                                33


## Page 35

IPCC, 2003. Good practice guidance for land use, land-use change and forestry /The
       Intergovernmental Panel on Climate Change. Ed. by Jim Penman. Hayama, Kanagawa.
MEFCC, 2017. National Forest Sector Development Program. Ministry of Environment, Forest
       and Climate Change, Addis Ababa, Ethiopia.
Olofsson, P., Foody, G.M., Stehman, S.V., Woodcock, C.E., 2013. Making better use of accuracy
       data in land change studies: Estimating accuracy and area and quantifying uncertainty
       using   stratified estimation. Remote Sensing of Environment                  129, 122–131.
       https://doi.org/10.1016/j.rse.2012.10.031
PA, 2015. Report of the Conference of the Parties on its twenty-first session, held in Paris from 30
       November to 11 December 2015. Addendum. Part two: Action taken by the Conference of
       the Parties at its twenty-first session.
Tewkesbury, A.P., Comber, A.J., Tate, N.J., Lamb, A., Fisher, P.F., 2015. A critical synthesis of
       remotely sensed optical image change detection techniques. Remote Sensing of
       Environment 160, 1–14. https://doi.org/10.1016/j.rse.2015.01.006
UN-REDD, 2017. Ethiopia9s Forest Reference Level Submission to the UNFCCC.
       https://redd.unfccc.int/files/ethiopia_frel_3.2_final_modified_submission.pdf      (accessed
       November 2023).
Zhang, Y., Rossow, W.B., Lacis, A.A., Oinas, V., 2022. Calculation, Evaluation and Application
       of Long-term, Global Radiative Flux Datasets at ISCCP: Past and Present, in: Lectures in
       Climate         Change.           WORLD           SCIENTIFIC,           pp.        151–177.
       https://doi.org/10.1142/9789811256912_0009




                                                                                                 34
