# Melese Getinet - Doctoral Thesis semi useful for local knowledge.pdf

Source ID: `local_research_source:unpacked_lake_tana_amhara_20260627t215313z_3_001_lake_tana_amhara_melese_getinet_doctoral_thesis`



## Page 1

ADDIS ABABA UNIVERSITY
                 COLLEGE OF SOCIAL SCIENCES
DEPARTMENT OF GEOGRAPHY AND ENVIRONMENTAL STUDIES


ASSESSMENT OF LAND SUITABILITY USING A GIS-BASED MULTI-
   CRITERIA ANALYSIS FOR RICE CULTIVATION IN FOGERA
        WOREDA, AMHARA REGIONAL STATE, ETHIOPIA


                                 BY
                      MELESE GETINET KASSIE



                    A THESIS SUBMITTED TO
THE DEPARTMENT OF GEOGRAPHY AND ENVIRONMENTAL STUDIES OF ADDIS
ABABA UNIVERSITY IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE
DEGREE OF MASTER OF ARTS IN GEOGRAPHY AND ENVIRONMENTAL STUDIES
(WITH SPECIALIZATION IN GIS, REMOTE SENSING AND DIGITAL CARTOGRAPHY)




                    ADVISER: DEMIS MENGIST(PhD)




                       ADDIS ABABA, ETHIOPIA
                              JUNE 2024


## Page 2

ADDIS ABABA UNIVERSITY

                               COLLEGE OF SOCIAL SCIENCES

       DEPARTMENT OF GEOGRAPHY AND ENVIRONMENTAL STUDIES

                               STATEMENT OF APPROVAL

This is to certify that the thesis prepared by Melese Getinet, entitled: Assessment of land
suitability using a GIS-based multi-criteria analysis for rice cultivation: The case of Fogera
Woreda and submitted in partial fulfillment of the requirements for the award of the degree of
Master of Arts in Geography and Environmental Studies (specialization in Geographic
Information System, Remote Sensing, and Digital Cartography) by the school of graduate
studies, Addis Ababa University through the College of Social Science complies with the
regulations of the university and meets the accepted standards concerning the originality and
quality.

Signed by the examining committee:

           Demis Mengist (PhD)        ____________             __________

           Thesis Advisor               Signature               Date

           Molla Maru                  ___________             __________

           Internal Examiner            Signature               Date

           Misganaw Meragiaw (PhD)    ___________              __________

           External Examiner             Signature              Date

              _______________________________________________

                Chair of Department or Graduate Program Coordinator




                                             i


## Page 3

ABSTRACT

Land evaluation is a basis for sustainable land resource planning and management. In
Ethiopia, national economic growth is highly dependent on agriculture and the land’s
productivity is low due to mismanagement of the land, land degradation, and intensive
cultivation; this condition is worse in Fogera plain. This study evaluates land suitability for
rice cultivation in the Fogera Woreda. A GIS technique with a multi-criteria evaluation (MCE)
approach was applied to evaluate the land appropriateness for rice cultivation. Factors that
were considered for the analysis of the land suitability for rice cultivation were rainfall,
temperature, slope, land use land cover (LULC), soil type, soil texture, soil depth, and soil pH.
The weight of influence of each factor was computed by pair-wise comparison technique which
is one of the Analytic Hierarchy Process (AHP) methods. The final rice suitability analysis map
was created by combining all factors with their respective weights in the ArcGIS Pro overlay
tool. The results of the suitability analysis revealed that 728.5km² (65.9%) was highly suitable,
235.9 km² (21.4%) was moderately suitable, 57.4 km² (5.2%) was less suitable, and 82.7 km²
(7.5%) unsuitable for rice cultivation. The results of the research show that the study area has
a huge potential area for rice cultivation.

Keywords: AHP, MCE, rice cultivation, suitability analysis, weighted overlay analysis




                                              ii


## Page 4

ACKNOWLEDGMENTS

The first gratefulness goes to the Almighty God, who is helping me in every part of my life,
including this research work. Then I would like to thank many people for supporting me in
accomplishing this study work. My greatest thanks and heartfelt appreciation to my advisor and
head of the Geography and Environmental Studies (GeES) department Demis Mengist (PhD)
and Dr. Asnake Mekuriaw (Graduate Program Coordinator of GeES) for their valuable
guidance and support throughout the whole research work in particular and for working hard in
all aspects in general.

I am highly indebted to my family especially Yemisrach Dagnaw, dear friends, my work
colleagues, and classmates for their valuable support and consistent encouragement to complete
my MA studies. I gratefully acknowledge all organization staff, such as the Ministry of
Agriculture, National Meteorological Agency, Space Science and Geospatial Institute, and
Ethiopian Statistical Service for their kindness in providing the required data and information
to carry out this research.

Finally, I thank my sponsor Space Science and Geospatial Institute for their financial and
material support. Lastly, I want this master's degree to be a reminder to my father Getinet
Kassie, even if it isn't adequate because the first year second semester exam cost my father's
life. After all, I wasn't near him when he was sick.




                                              iii


## Page 5

Table of Contents
Contents                                                                                                                             Page

Table of Contents ................................................................................................................... IV

List of Tables .........................................................................................................................VII

List of Figures ...................................................................................................................... VIII

List of Appendices ............................................................................................................... VIII

Acronyms and Abbreviation ................................................................................................. IX

CHAPTER ONE: INTRODUCTION .....................................................................................1

   1.1       Background ..................................................................................................................1
   1.2       Statement of the Problem .............................................................................................3
   1.3       Objectives of the Study ................................................................................................4
      1.3.1         General Objective................................................................................................. 4

      1.3.2         Specific Objectives............................................................................................... 4

   1.4       Research Questions ......................................................................................................4
   1.5       Significance of the Study .............................................................................................4
   1.6       Scope of the Study ........................................................................................................5
   1.7       Limitations of the Study ...............................................................................................5
CHAPTER TWO: REVIEW OF RELATED LITERATURE .............................................6

   2.1       Introduction ..................................................................................................................6
   2.2       Definitions and Concepts of Terms ..............................................................................6
   2.3       Rice Cultivation: An Overview ....................................................................................8
   2.4       Rice Cultivation in Africa ............................................................................................8
   2.5       Rice Adoption in Ethiopia ............................................................................................9
   2.6       Rice Cultivation and Expansion in Ethiopia ..............................................................11
   2.7       Rice Cultivation in Fogera Woreda ............................................................................12
   2.8       Land Suitability Analysis for Sustainable Development............................................14
   2.9       Land Suitability Analysis for Rice Cultivation ..........................................................15
   2.10      Factors that Affecting Land Suitability for Rice Cultivation .....................................18


                                                                   iv


## Page 6

2.10.1      Climate Conditions ............................................................................................ 18

     2.10.2      Soil Characteristics............................................................................................. 19

     2.10.3      Land Availability and Topography .................................................................... 19

     2.10.4      Farming Practices and Technology .................................................................... 20

     2.10.5      Socioeconomic Factors ...................................................................................... 20

  2.11     Constraints Associated with Rice Cultivation in Fogera Woreda ..............................20
     2.11.1      Traditional Means and System of Land Preparation .......................................... 20

     2.11.2      Insufficient Mechanization................................................................................. 21

     2.11.3      Market Failure of Improved Varieties................................................................ 21

     2.11.4      Harvest and Post-Harvest Management ............................................................. 21

     2.11.5      Lack of Awareness of Improved Agronomic Practices ..................................... 21

  2.12     The Role of Geospatial Technologies for Land Suitability Analysis .........................21
     2.12.1      GIS Applications for Land Suitability Analysis ................................................ 21

     2.12.2      Multicriteria Analysis: For Land Suitability ...................................................... 22

     2.12.3      Analytical Hierarchy Process ............................................................................. 23

CHAPTER THREE: MATERIALS AND METHODS ......................................................24

  3.1      Materials .....................................................................................................................24
     3.1.1       Data Type and Their Sources ............................................................................. 24

  3.1.2 Methods of Data Collection .......................................................................................25
  3.1.3 Tools and Software’s Use...........................................................................................25
  3.2      Description of the Study Area ....................................................................................26
     3.2.1       Physical and Socio-Economic Characteristics ................................................... 27

  3.3      Methods ......................................................................................................................30
  3.4      Rice Suitability Evaluation Factors ............................................................................32
     3.4.1       Topographic Factors........................................................................................... 32

     3.4.2       Climate Factors .................................................................................................. 32



                                                                  v


## Page 7

3.4.3         Soil Factors ........................................................................................................ 32

      3.4.4         Land use Land cover .......................................................................................... 33

   3.5       Research Design .........................................................................................................33
   3.6       Methods of Data Processing and Analysis .................................................................33
      3.6.1         Criteria Determination ....................................................................................... 33

      3.6.2         Criteria Standardization and Rating ................................................................... 37

      3.6.3         Assigning Criterion Weights .............................................................................. 37

      3.6.4         Weighted Overly Analysis ................................................................................. 39

CHAPTER FOUR: RESULTS AND DISCUSSIONS .........................................................40

   4.1       Preprocessing of Data and Reclassification Results ...................................................40
      4.1.1         Factors of Rice Cultivation Suitability Analysis ................................................ 40

   4.2       Determining Criterion Weights ..................................................................................53
   4.3       Suitability Model Used ...............................................................................................56
   4.4       Weighted Overlay Analysis ........................................................................................57
   4.5       Discussions .................................................................................................................60
CHAPTER FIVE: CONCLUSIONS AND RECOMMENDATIONS ...............................62

   5.1       Conclusions ................................................................................................................62
   5.2       Recommendations ......................................................................................................63
References ................................................................................................................................64

Appendices ...............................................................................................................................74




                                                                   vi


## Page 8

List of Tables
Table 2. 1: Structure of the land suitability classification ........................................................ 17
Table 3.1 Study area rice crop calendar……………………………………………………….31

Table 3. 2 Data and their sources……………………………………………………………...33

Table 3. 3 Software used for processing and analysis…………………….……………….….25

Table 3. 4 Criteria used, data range and suitability class for rice………………………………34

Table 3. 5 Land use/cover categories of Fogera Woreda………………………………………36

Table 3. 6 Scale for pairwise comparisons……………………………………………………38

Table 4. 1Temperature suitability class……………………………………………………….40

Table 4. 2 Rainfall suitability class……………………………………………………………42

Table 4. 3 Slope suitability class of the study area…………………………………………….44

Table 4. 4 Soil type suitability class of the study area…………………………………………45

Table 4. 5 Soil texture suitability class of the study area………………………………………46

Table 4. 6 Soil depth suitability class of the study area………………………………………48

Table 4. 7 Soil pH suitability class of the study area…………………………………………..49

Table 4. 8 LULC suitability class of the study area……………………………………………51




                                                         vii


## Page 9

List of Figures
Figure       2.     1     Rice        value          chain
processes………………………………………………………...Error!     Bookmark   not
defined.

Figure 2. 2 Fogera rice cultivation trend………………………………………………………14

Figure 3. 1 Map of the study area……………………….…………………………………….26

Figure 3. 2 Flow diagram of the method used for suitability analysis………………………….31

Figure 4. 1Temperature suitability map of the study area……..…………….……………..… .43

Figure 4. 2 Rainfall suitability map of the study area ………………………………………...42

Figure 4. 3 Climate variables weight of influence for rice suitability map…………………….43

Figure 4. 4 Slope suitability map………………………………………………………………44

Figure 4. 5 Soil type suitability map…………………………………………………………...45

Figure 4. 6 Soil texture suitability map of the study area………………………………………47

Figure 4. 7 Soil depth suitability map of the study area………………………………………..48

Figure 4. 8 Soil pH suitability map of the study area…………………………………………..49

Figure 4. 9 Soil properties weight of influences for rice crop suitability map………………….50

Figure 4. 10 LULC suitability map of the study area…………………………………………..51

Figure 4. 11: Overall land suitability for rice cultivation based on factors………………...…60

Figure 4. 12 The suitability analysis model used………………………………………………57

Figure 4. 13 Potential area map for rice crop suitability in Fogera Woreda……………………59

Figure 4. 14: Distribution of suitability classes for rice cultivation……………………………66

List of Appendices
Appendix A: LULC accuracy assessment result (confusion matrices table)…………….....73

Appendix B: Consistency ratio computing using the AHP extension tool…………………74

Appendix C: Calculating the highest Eigen Value…………………………………………74


                                         viii


## Page 10

Acronyms and Abbreviation
Agro BIG: Agribusiness Induced Growth

AHP: Analytic Hierarchy Process

CR: Consistency Ratio

DM: Decision Makers

DEM: Digital Elevation Model

EIC: Ethiopian Investment Commission

EMA: Ethiopian Meteorological Agency

ERDAS: Earth Resource Data Analysis System

ESA: European Space Agency

ESS: Ethiopian Statistical Service

FAO: Food and Agriculture Organization

GIS: Geographical Information System

IDW: Inverse Distance Weighted

ISRIC: International Soil Reference and Information Centre

LSA: Land Suitability Analysis

LULC: Land Use Land Cover

MoA: Ministry of Agriculture

MCDA: Multi-Criteria Decision-Making Analysis

MCDM: Multi-Criteria Decision Making


                                           ix


## Page 11

MDS: Multi-Dimensional Scaling

MCE: Multi-Criteria Evaluation

MCA: Multi-Criteria Analysis

MoARD: Ministry of Agriculture Research and Development

MODM: Multiple Objective Decision-Making

MADM: Multiple Attribute Decision-Making

MT: Million Metric Tons

OLI: Operational Land Imager

PCM: Pairwise Comparison Matrix

RI: Random Consistency Index

SAA: Sasakawa Africa Association

SNAP: Sentinels Application Platform

SSGI: Space Science and Geospatial Institute

SSA: Sub-Saharan Africa

SNNPR: Southern Nations, Nationalities and Peoples Region

UET: Ultimate Environmental Threshold

USGS: United States Geological Survey




                                               x


## Page 12

CHAPTER ONE

                                   INTRODUCTION
1.1 Background
Population numbers, particularly in developing countries, increase the pressure on natural and
agricultural resources. An increased food supply was required to meet the rising world
population's nutritional demands. The population grows rapidly, and the process of urbanization
has increased the pressure on agricultural resources. This increased pressure on the presented
land resources might result in land degradation (Elaalem et al., 2011). Reliable and accurate
land assessment is therefore essential to the decision-making processes involved in developing
land use policies that will support sustainable rural development.

Rice is the main food source for more than half of the world’s inhabitants, affecting many billion
people’s livelihoods and economics. Previously, it was so called an Asian product. Currently,
rice is produced in many other parts of the world. It is also the most quickly rising source of
nutrition in Africa and is significant to food security and food self-sufficiency in an increasing
number of low-income food-deficit countries. Therefore, improving the cultivation of rice crops
would help hunger eradication, poverty mitigation, countrywide food security, and economic
development (FAO, 2015).

Ethiopia is one of the growing African countries with high population insecurity. Agriculture
is the backbone of the country's economy involving the largest sizes of its population. The
country has vast potential for agricultural crop cultivation due to its enormous arable land, water
resources, and wide range of climates that can assist varieties of crops. However, the sector is

still in its primal stage despite significant developments recorded in recent times. Understanding
this problem, the government has been framing and applying several strategies that give due
emphasis to commercialization as the succeeding step of agricultural development. The
strategies include variation and specialization of crop cultivation by farmers to enhance
productivity (Mohidem et al., 2022).

Rice is among the target crops that have received deserving emphasis in the promotion of
agricultural constituents. It is considered the "Millennium Crop" supposed to contribute to


                                               1


## Page 13

safeguarding food security in the country. Even though, introduced recently, rice is recognized
to be a crop that can ensure food security in Ethiopia (Mohidem et al., 2022). Considering the
potential of the agricultural land the time can't be too far for Ethiopia to be one of the major
producers of rice crops in the whole world (Cai et al., 2022).

Corresponding to this, the Ethiopian Investment Commission (EIC) has identified the main
potential rice areas in Amhara, Benshangul, Gambella, SNNPR, Oromia, and Somali areas.
However, the suitability of those probable areas has not been well-studied. Therefore, to ensure
the higher productivity of rice crops one must encourage the crops where they suit best and for
which the first and fundamental requirement is to carry out a land suitability assessment (Nisar
Ahamed et al., 2000). Suitability is a determination of crop requirements matching with land
characteristics. Land suitability assessment must be evaluated in such a way that local needs
and situations are reflected well in the final decision-making process (Anusha et al., 2023).

Multi-criteria decision-making (MCDM) can be thought of as a process that combines and
transforms various spatial data inputs into an outcome decision output (Lindfors, 2021). MCE
methods are used in some Regional planning processes since they aim at “estimating the
potential of land for alternative land uses, among which agricultural land use being the most
important area where it is applying” (Chen et al., 2010). This method could play a significant
role in future land-use planning (Huang, 2012) (Huang, 2012). Agricultural land suitability
classification founded on indigenous knowledge was the key to land use planning. The scientific
analysis of land aims to identify potential areas and put into practice future alternative land uses
that will best meet the needs of the societies, while at the same time preserving land resources
for the future (Boliko, 2019).

In this study, the aim was to assess the suitability of rain-fed rice crop cultivation using a GIS-
based multi-criteria decision-making technique to categorize the study area regarding the
quality of land for rice crops. The study was applied in the Fogera Woreda, west-central
highlands of Amhara Regional State of Ethiopia. This area has been selected as a primary
location for rain-fed rice crop cultivation endorsed by the Ethiopian Investment Commission
(EIC). This study could support agricultural insurance by the identification and classification
of land-based capabilities with socio-economical, biophysical, and environmental potential.



                                                2


## Page 14

1.2 Statement of the Problem
Ethiopia is among the countries facing significant challenges in terms of population size and
food security in Africa. Agriculture serves as the foundation of the country's economy,
employing a large portion of its population. With vast arable land, water resources, and diverse
climates, Ethiopia has great potential for agricultural crop cultivation. However, accurately
selecting suitable land for specific crops remains a persistent and critical issue (Suruliandi et
al., 2021). The classification of land into different capability classes based on soil, climate,
topography, and other factors is essential to determine the most suitable land for different crops,
highlighting the importance of precise land use types (Szarek-Iwaniuk et al., 2022).

Land suitability analysis is important for the planning and sustainable management of land
resources, used to assess the land's potential for various uses (Herzberg et al., 2019). With the
country's population steadily increasing, the demand for shelter and food has also risen, posing
a significant challenge. These factors pose a serious threat to land resources, leading to issues
like land degradation. Utilizing land according to its potential is key to ensuring sustainable use
(Boliko, 2019). Analyzing the suitability of land for agricultural purposes involves processing
spatial data on soil properties, topography, and climate conditions to align land capabilities with
the needs of rice cultivation (Arouna et al., 2023).

Despite the significant number of farmers involved in rice cultivation, many fail to realize the
extent of their impact through their hard work and dedication. While rice plays a vital role in
the livelihoods of many households and serves as a main income source in the Region (Takele,
2010), research on rice cultivation has been limited. Existing studies have mainly focused on
aspects like adoption rates, trends, and marketing strategies in rice cultivation. However, there
is a lack of systematic information on the potential areas suitable for rice cultivation.

The main objective of this study is to address the underutilization of rice crops in the Amhara
Regional State and Ethiopia as a whole, particularly in terms of technological support,
especially in geospatial analysis. The agricultural sector is still developing to meet domestic
demand and currently relies heavily on imported rice. Therefore, this research aims to assess
the suitability of land for rice cultivation in the Fogera Woreda using a GIS-based MCE
approach, providing valuable insights for experts in the field.


                                               3


## Page 15

1.3 Objectives of the Study
1.3.1 General Objective
The main objective of this study was to analyze land suitability for producing an economically
important crop, rice, in the Fogera Woreda, using a GIS-based MCE method.

1.3.2 Specific Objectives
The particular goal of the study was to evaluate land suitability for rice cultivation through the
use of a GIS-based multi-criteria evaluation approach.

The specific objectives were formulated to:

1. Examine the factors that are necessary for selecting rice cultivation suitability sites.
2. Analyze the suitability of land for rice cultivation areas in the Fogera Woreda using GIS-
   based MCE approaches.
3. Determine potentially suitable areas for the rice crops and produce its thematic map.

1.4 Research Questions
The research seeks to answer the following questions framed to achieve the above-mentioned
objectives about the suitability of land for rice cultivation integrating GIS and MCDM in the
case of Fogera Woreda (Ethiopia).

Hence, the critical questions would be:

1. What are the necessary factors for selecting rice cultivation suitability sites?
2. How to analyze the suitability of land for rice production areas in the Fogera Woreda using
   GIS-based MCE approaches?
3. How to determine potentially suitable areas for the rice crops and produce its thematic map?

1.5 Significance of the Study
The study produced valuable insights on assessing land suitability for rice cultivation through
a GIS-based MCE method. This method enabled a comprehensive and accurate analysis of
potential rice cultivation areas. The integration of the MCE method with GIS technology in
land suitability assessment provides essential data for understanding past land use and
predicting future changes.



                                               4


## Page 16

The study's results assist land managers and planners in identifying areas with physical
constraints for different land uses. Additionally, the findings offer a user-friendly tool for
decision-makers, including farmers, to improve rice crop cultivation and yield, while also
laying the groundwork for researchers to explore innovative approaches to increase rice
cultivation and enhance export revenues.

1.6 Scope of the Study
This study was undertaken in one Woreda, namely Fogera which is one of the major rice-
producing districts in Amhara National Regional State (ANRS). It covers a total area of around
1111.4 km2 with 35 rural and 4 Woreta town kebeles. The study was focused on the
identification of potential land for rice cultivation by using multi-criteria decision approaches
through GIS techniques. Moreover, this study also employed only the following land and
climatic factors such as; climate conditions, topography, LULC, and soil properties used to
assess land suitability levels of the study area for rice crops.

1.7 Limitations of the Study
This study has attempted to identify potential rice cultivation areas in Fogera Woreda and has
successfully achieved its objectives. However, current security issues and the state of
emergency in the Region have an impact to move for gathering socio-economic data, collecting
and verifying current LULC data, and validating the final result of the study area.




                                                5


## Page 17

CHAPTER TWO

                  REVIEW OF RELATED LITERATURE
2.1 Introduction
This chapter tries to present relevant definitions and concepts, and related literature including
conceptual issues regarding rice cultivation from global to study area perspectives, rice
adoption, trend and expansion in Ethiopia, land suitability analysis for sustainable development,
land suitability analysis for rice cultivation, factors that affecting land suitability for rice
cultivation, constraints associated with rice cultivation in Fogera Woreda, GIS applications for
land suitability assessment and also addresses multi-criteria analysis for land suitability
assessments.

2.2 Definitions and Concepts of Terms
To increase understanding of the land suitability and GIS methods, key terms and conceptual
issues are described as follows.

Suitability refers to the appropriateness and fitness of a particular kind of soil for a well-
outlined purpose. The evaluation might ponder the soil in its current state or take into account
any advancements that possibly might be undertaken. The procedure for assessing soil
suitability comprises assessing and categorizing distinct pieces of soil grounded on their
appropriateness for specific uses. Soil suitability categorization assists us in apprehending
which parts of soil are most fitting for different objectives, contemplating both inherent resource
characteristics and human soil inhabitation.

Land suitability analysis (LSA) is a method of land evaluation, which measures the degree of
suitability of land for a certain usage (Feizizadeh and Blaschke, 2013). Suitability involves
aligning crop requirements with land characteristics, and it is a measure of how well the
qualities of land units match the requirements of a particular form of land usage (Boliko, 2019).
Suitability analysis can respond to the question - to cultivate and where?

Land suitability analysis indicates the assigning of values to alternatives that are evaluated
along multiple decisions or criteria (Muzira et al., 2021). These criteria are detrimental to land
suitability assessments for different land use types. Land suitability analysis evaluates many


                                               6


## Page 18

alternative land uses under numerous criteria from various disciplines. Analyzing suitability is
mostly based on the land potentials such as erosion resistance, water and nutrient availability,
rooting condition, drainage, and flood hazard. The value of land quality is a function of the
evaluation and grouping of land types into orders and classes based on their appropriateness.

Geographical Information System (GIS) is a method used to determine the suitability of a
given area for a specific purpose or activity. The fundamental principle is that each aspect of
the landscape has basic characteristics that are either suitable or unsuitable for the planned
activities. It involves evaluating many factors, such as environmental conditions,
socioeconomic considerations, and land characteristics. GIS provides critical decision support
–makers by assisting in site selection and land use planning. GIS enables us to assess land
suitability by analyzing spatial data, considering diverse factors, and making informed
decisions concerning land use and development.

Multi-criteria decision-making (MCDM) has become a familiar approach used by decision-
makers in the daily business of making the best choices at the business or administrative levels
of various organizations. It has proved to be a reliable method that performs its functions by
incorporating multiple sets of procedures. All the methods that constitute this technique are
geared towards supporting decision-makers in executing their roles of decision-making (Jafari
and Zaredar, 2010). As MCDM took center stage in decision-making problems, several
methods have been formulated to supplement the technique. Some of these very important
methods include the Multi-Attribute Utility Theory (Akpan and Morimoto, 2022), and the
Analytical Hierarchy Process (Saaty, 1987).

The analytical hierarchy process (AHP) is one of the multi-criteria decision-making systems
first discovered by Thomas Saaty (Prof.). It is a theory of measurement through pairwise
comparisons and depends on experts' judgments to derive important scales. Its use of pairwise
comparisons can allow decision-makers to weigh factors and compare alternatives with relative
ease.




                                              7


## Page 19

2.3 Rice Cultivation: An Overview
The rice crop is the most important source of food around half of the world's population. Rice
is the food that people have harvested, eaten, and grown for more than 10,000 years worldwide,
longer than any other crop. Global cultivation of rice has enhanced gradually from around 200
million metric tons (MT) of unmilled rice in 1960 to over 678 million MT in 2009. Rice
represents 29% of the total output of grain crops produced universally (Belayneh and Tekle,
2017).

In South and East Asia, rice accounts for more than 90% of the worldwide rice crop. China is
the world's top producer and consumer nation. Africa accounts for as it were 3% of worldwide
cultivation (Junichi, 2022). The major limiting factor for the cultivation of rice is not climate,
but water supply. Rice is the only major crop that can be cultivated in standing water in vast
areas of flat, low-lying tropical soils and is uniquely adapted for growth in water-logged
conditions. Rice is growing in the tropical and subtropical regions of most continents. It is
produced under broadly differing conditions because of the great cultivar diversity (Belayneh
and Tekle, 2017).

2.4 Rice Cultivation in Africa
In Sub-Saharan Africa (SSA) agricultural development is more significant for poverty reduction
and food security (Vetterlein, 2012). Along with the major cereals developed within the area,
the significance of rice is presently expanding quickly (Singh et al., 2021). Rice has become a
highly strategic and priority product for food security in Africa. Consumption is growing faster
than that of any other major essential food in the continent because of high population growth,
rapid urbanization, and changes in eating habits (Camacho et al., 2018).

Africa produced an average of 26.4 million tons of rough rice in 2012 (Eves. et al., 2021). By
2020, SAA rice paddy cultivation will have increased from 18.4 million tons (Mt) in 2010 to
46.8 Mt, with the yield improved by research and development activities (Djagba et al., 2019).
Rice is becoming an increasingly accepted nutrition in Africa because it is easy to store and
cook; it is tasty and can be used for a large variety of dishes. It is grown in more than 75% of
African countries, with a joint population of close to 800 million people.




                                               8


## Page 20

Africa has suitable land and water resources to produce enough rice to feed its population and,
in the long term, generate export revenues. Rice cultivars, rice-based cropping systems, and the
rice itself will, however, undergo adaptations and expansions to meet future demands for both
the food security of the growing population and environmental protection (Omoyajowo et al.,
2023). The challenge posed by climate variability and change is a compelling factor in fast-
moving the innovation process and this requires cooperation among many scientific disciplines
and stakeholders. Rice study and development, including market access, will, therefore, follow
consistent paths (Mohamad et al., 2021).

With the rapid development of the rice sector, new actors, and new public-private companies
are appearing. Many of these actors are not used to working with each other, and chances for
co-learning and negotiation will need to be explored and evaluated. With more and more actors
involved in the rice sector in Africa, increasing an understanding of the changing roles and
patterns of interaction, and how these can be facilitated, will help improve overall system
performance (Djagba et al., 2019).

2.5 Rice Adoption in Ethiopia
Rice is an emerging crop in Ethiopia and one of the economically important crops in the Amhara
Region. Some reports have shown that the cultivation of rice in Ethiopia started first at Fogera
and followed at Gambella Plains in the early 1970s. It was believed that a Dutch man introduced
rice first in 1973 from Fogera to the Gambella Plain in the Gambella Region (Belayneh and
Tekle, 2017). Another author Portuguese, in the sixteenth century, brought rice (Oryza sativa)
with them for the cultivation of this grain crop in Ethiopia (Almgard, 1963).

Other author rice cultivation in Ethiopia is supposed to have started around 1957 in Metahara,
along with the Awash River. Later rice adaptation and screening experiments were started and
studied at Fogera, Gambella, Melkaworer, Debre Zeit, and Arbaminch from 1968 to 1988 by
various organizations (Ndue et al., 2023). Ayanaw (2023) reported that rice cultivation had
probably been initiated in Ethiopia when the wild rice (long staminate) was observed in the
swampy and waterlogged areas of Fogera (locally known as zurha) and Gambella plains. So,
evidence has indicated that cultivation of the rice crop in Ethiopia was first started at Fogera
and Gambella plains in the early 1970’s.


                                              9


## Page 21

Although rice was begun and tested initially in many areas of Ethiopia such as Gambella, Pawe,
and Woreta at the beginning of the 1970s, due attention was not given before the mid-1990s
(Abera et al., 2021). Since the mid-1990s, however, around seven upland rice diversities
including four NERICA varieties have been released. Currently, the released varieties,
especially, NERICAs, have been under dissemination and expansion in different agro-ecologies
of the country, from lowlands of 750m to areas of about 2000m elevations by different
governmental and non-governmental organizations. In addition, the cultivation of rain-fed new
rice varieties (NERICA-3 and 4) has been started since 2006 in the Oromia Region in Jimma,
Iluababora, and West Wellega Zones and former SNNPR in Hadiya Zone (Dessie and Mulat,
2019).

Ethiopia is known for its diverse agricultural practices, including the cultivation of various rice
varieties suited to different regions and climates. These varieties reflect Ethiopia's efforts to
enhance rice production through breeding programs, promoting resilience against local
challenges such as drought and pests, and improving overall food security in the country. Here
are some notable rice varieties grown in Ethiopia:

1. NERICA (New Rice for Africa): These are high-yielding rice varieties developed through
   a cross between African and Asian rice species. They are known for their adaptability to
   various African environments, including those in Ethiopia.
2. Farmer-Preferred Local Varieties: Many farmers in Ethiopia grow traditional or local
   rice varieties that have been adapted over generations to local conditions. These varieties
   often exhibit resilience to local pests, diseases, and climate variations.
3. Improved Varieties: Various improved rice varieties have been developed and promoted
   by research institutions and agricultural organizations in Ethiopia. These varieties are
   typically bred to be higher-yielding, disease-resistant, and better adapted to local conditions.
4. Bilikis: This is a popular variety grown in the Gambella region of Ethiopia, known for its
   good yield and adaptation to the local environment.
5. Koumbia: Another variety grown in Ethiopia, particularly in the Gambella region, is known
   for its tolerance to drought conditions.




                                               10


## Page 22

6. Faro 52: Developed by the Africa Rice Center (AfricaRice), this variety is known for its
   high yield potential and suitability to African rice-growing conditions, including those in
   Ethiopia.
7. WITA 4: An improved variety developed by the West Africa Rice Development
   Association (WARDA), now known as AfricaRice. It is adapted to rainfed lowland
   ecosystems common in parts of Ethiopia.

2.6 Rice Cultivation and Expansion in Ethiopia
Rice cultivation in Ethiopia began a few decades ago and now the country is proven to have
reasonable potential to grow diverse rice types for rain-fed lowland, upland, and irrigated
ecosystems. Rice is currently recognized as a strategic food security crop and its use as a food
crop, source of income, employment opportunity, and animal feed has been well-known in
Ethiopia (Berhe et al., 2024). The demand for improved rice innovations is expanding from
time to time from distinctive partners. This, therefore, calls for the desire to establish a strong
research and development organization to bring about a productive, sustainable, stable, and
profitable rice agricultural system in the country (Tarekegn and Fiseha, 2016).

In Ethiopia, rice is among the target commodities that have received due emphasis in the
promotion of agricultural cultivation, and as such it is considered the "millennium crop”
expected to contribute to guaranteeing nourishment security in the country. Currently, mainly
small-scale farmers grow rice in different parts of the country, but it is also produced by large-
scale farms in a few places mainly in the lowlands of the country (Sikuku et al., 2015).

Despite the huge potential of the country to produce various rice types, the crop is not under
cultivation in many parts of the country. Nowadays, rice cultivation is concentrated only in a
few areas such as Pawe, Gambella, Fogera, Libo Kemkem, Dera, Denbia, Alfetakusa Woreda,
Mizan Tefri, Jimma (Gojeb area), Melkaworrer, Arbaminch, North Shewa, South Wollo
(Chefa), Dangila-Jewi, Bichena, Quora, Metema and Armachiho (Desta et al., 2019). Rice is a
highly productive crop in Ethiopia next to teff, wheat, and maize. Its average cultivation in the
2017/18 fiscal year, a total area of 53,106 ha was covered with rice. That coverage area grew
to 63,361 ha in the last fiscal year, while the yield has also increased by 14 to 1.2 million
quintals. Amhara Regional State now produces about all of Ethiopia's rice, gathering 1.19


                                               11


## Page 23

million quintals of rice from 41,700 ha of land that was harvested by 114,000 ranchers within
the most recent fiscal year (Beyene et al., 2022).




Figure 2. 1 Rice production trend in Ethiopia

Source: (Dawit, 2018)

2.7 Rice Cultivation in Fogera Woreda
Fogera Plain is known as the major provider of rice cultivation in the country. It accounts for
70% of the rice grain amount that comes from this plain. Before starting the cultivation of rice
crops in Fogera, the Woreda food was supported in the 1970s and 1980s and so far, the area
was recognized typically for grazing land, livestock rearing, small-scale crop cultivation using
residual moistures, as well as being sparsely populated (Tilahun et al., 2021).

Rice cultivation started in July 1984 in the seasonally flooded plains of Lake Tana (submerged
in water every rainy season) as a pilot project entitled “Ethio-Jigna Development Project’’
including the agricultural cooperatives Jigna and Shaga cooperatives with thirty young farmers
supported by nine North Korean agricultural experts. The objective of the pilot project was to


                                              12


## Page 24

establish and promote rice and horticultural crops first in the two cooperatives. The introduction
of rice cultivation in the Region changed the livelihood of the farmers in the Fogera Plain
radically. Apart from playing an important role in abating the problem of food insecurity in the
Fogera, rice cultivation increased the revenues of farming households considerably (Hagos and
Zemedu, 2015).




                                                                                  Local
                                                                               Consumers

                                                                 AA/Bahirdar/
                                                                 Gonder
                                                 Millers/
                                                Processors
                                 Collectors/
                                Traders
         Updated
               –
               Small
             Producer
     Input
   Provider



Figure 2. 2 Rice value chain processes

Source: (Agro BIG, 2016)

Fogera has become a densely populated area and non-flooded agricultural farming (onions,
vegetables) crops are prospering. Nowadays, in local terms, rice farmers from Fogera are “rich”
(Asmare and Yayeh, 2018). That is the reason the first introduced variety is still called x.Jigina-
the introduction of x. Jigina in the Region changed the livelihood of farmers from the poorest
to the wealthiest and currently in the Fogera plain, rice plays an important role in abating the
problem of food insecurity in the farming community (Migongo et al., 2012).




                                               13


## Page 25

Figure 2. 3 Fogera rice cultivation trend by volume

Source: (Agro BIG, 2016)

2.8 Land Suitability Analysis for Sustainable Development
From a land use planning perspective, to ensure long-term productivity and sustained land use,
land use systems should be well suited to the inherent characteristics of the land. Land
suitability assessment plays an important role in this regard (Xu et al., 2024). Land contains the
physical environment to the degree that it affects the capability for land use, including climate,
relief, soils, hydrology, and vegetation. This involves the effects of past and current human
activity, e.g. sea reclamation, clearing of forests, and even negative results, e.g. soil salinity
(Setyowati, 2021).

Evaluation and grouping of areas of land in terms of their suitability for a given use is the
process of classification of land capacity. The key objective of the land analysis is to evaluate
the intrinsic capacity of a land unit to sustain, for a long period without reduction, the specific
use of land to reduce socio-economic and environmental costs (Hirunkul et al., 2003).

The broadly specified study of land suitability aims to determine the most suitable spatial
pattern for future land use according to requirements, expectations, or predictors of certain
activities (Moisa et al., 2022). Land suitability has been studied in terms of topography, soil,
climatic variables, ground cover, and interrelationships between landforms. Land-use



                                               14


## Page 26

suitability methods enable land-use managers and planners to analyze the interactions among
three types of factors: location, development action, and environmental elements (Rinner and
Voss, 2013).

2.9 Land Suitability Analysis for Rice Cultivation
Land suitability assessment is the separation of the essence or condition of the land into its
parts, based on the quality of the land to serve a specific use or purpose. High land suitability
implies that the land has a relatively high number of portions that it involves to serve a specific
use or purpose. In contrast, low land suitability analysis implies that the land has relatively
small numbers of parts that need to serve a specific use or purpose (Keson et al., 2023).

Each part of the Earth's landscape has a different set of characteristics that make it more
suitable for certain uses than others. The concept of land suitability for uses was successfully
developed by the late Ian McHarg, former professor of urban design and landscape architecture
at the University of Pennsylvania. The definition of land suitability can also be discussed in a
more specific way through McHarg’s discussion of using the land for suitability evaluation
(Keson et al., 2023).

The management of natural resources is a cross-boundary issue that should be emphasized in
all planning processes within a multi‐sectoral approach (administrative and geographical). Land
suitability is part of land use planning and defines potential alternatives for future land use and
supports to define these relationships (policies, agencies, and data management) (Kalfas et al.,
2023). Land suitability is the qualification of a given type of land for a defined use. The
classification and grouping of areas of land in terms of their suitability for specified uses is the
process of land suitability assessment (Agidew, 2015).

The way society uses the land depends on the available skills, knowledge, culture, and
experiences. The land suitability analysis is similar to the identification of a suitable site, except
that the aim is not to isolate the best alternatives but to map the suitability index for the entire
study area. Kozlowski (1993) combines the UET (Ultimate Environmental Threshold) method
with map overlays to evaluate land suitability for development. Labella and Martínez (2020)




                                                15


## Page 27

also use map overlays to define homogeneous zones, but then they apply classification
techniques to assess the agricultural land suitability level of each zone.

Combining GIS and MCDA is a powerful approach to land suitability assessments (Mendas
and Delali, 2012). Land suitability is analyzed based on the quality of the land. The quality of
land is a complex feature of land that directly affects land use (Song et al., 2023). These
attributes are properties of soil, landform information (topography), land use, and climatic
factors. Most land qualities are determined by the interaction of several land characteristics,
which are measurable attributes of the land. The importance of land quality is the role of
evaluating and grouping land types in the sense of their fitness into orders and groups.

Land suitability is categorized as suitable (S) and not suitable (N). Whereas S has lands that are
ideal for use with better advantages, N denotes land qualities that do not allow the form of use
considered or are not suitable for appropriate results (AL-Taani et al., 2021). The suitability of
land is significant for the future biological productivity of land. Land productivity can be
determined by environmental essentials such as temperature, local topography (roughness,
steepness, and exposure), soil type, and LULC.

Land suitability classification is developed by considering different factors of land
characteristics. The classification of the suitability of the land is calculated by considering
different factors relating to the characteristics of the land. Based on the suitability of each
criterion, a weighted value ranging from 4 (least suitable) to 1 (most suitable) is given. The
weighted value of each criterion is reclassified for each land use. Each criterion is given a value
depending on its suitability for each category. The weighted value of each land characteristics
criteria is added and the average value of them is engaged to determine the suitability of land
for each land use type. The average value is categorized into four suitable classes to get the
final suitability for each parameter.




                                               16


## Page 28

Table 2. 1: Structure of the land suitability classification (adopted from FAO guidelines)

 Order              Class                 Description

 Suitable           Highly      Suitable Land without significant limitations. Include the best 20 ‐
                    (S1)                  30% of suitable land as S1. This land is not perfect but that
 (S)
                                          can be expected.

                    Moderately            Land that is appropriate but has limitations that either reduce
                                          productivity or enhance the inputs needed to sustain
                    Suitable (S2)
                                          productivity associated with those needed for S1 land.

                    Marginally            Land with limitations so severe that profits are reduced and
                                          the inputs needed to sustain cultivation are improved so that
                    Suitable (S3)
                                          this cost is only marginally justified.

 Not suitable       Currently       not Land with restrictions to sustained use that cannot be
                                          overwhelmed at a current acceptable cost.
 (N)                Suitable (N1)




Land suitability assessments using a scientific approach are essential to evaluate the potential
and constraints of a given land parcel for agricultural purposes (Brennan and Venigalla, 2016).
In recent years, the negative effects of land use on the climate and the environmental
sustainability of agricultural cultivation systems have become a matter of concern. The
problems of declining soil fertility, stagnant yield levels, and unfettered soil erosion are
associated with intensive agriculture in industrialized countries. In contrast, over-exploitation
of natural resources and lack of inputs such as chemical fertilizers are associated with intensive
farming in developing areas (Kongolo and Dlamini, 2012).

Land evaluation and crop suitability analysis using multicriteria evaluation integrated with GIS
would resolve these issues while providing better land‐use options to the farmers. Therefore, it
is vital to evaluate crop suitability under different systems that could be grown in each Region.



                                               17


## Page 29

GIS is an important help for decision-making in space (Singha and Swain, 2016). Developments
in GIS have led to important improvements in its capability for decision-making procedures in
land allocation and environmental management (Gebre et al., 2021).

Suitability analysis is a methodology or a set of analytical procedures that use their geographic
feature spatial relationships to simulate real-world situations within a GIS to classify geographic
areas that are optimally suitable for specific land use. To identify geographical areas that are
optimally suitable for specific land use, the creation of criteria is essential. There can be two
types of criteria: factors and constraints. Constraints are Boolean parameters that restrict the
analysis to a specific geographical area (i.e. limit). Factors, on the other hand, are criteria that
determine a certain level of appropriateness for all geographical regions (Bahaj et al., 2020).
The composite effect of physical factors describes the degree of suitability and support to
further classify the land into various development classes.

2.10   Factors that Affecting Land Suitability for Rice Cultivation
Rice cultivation is sensitive to biophysical factors such as climate, topography, soil
characteristics, and farming practices (Hashim et al., 2024). Landform information, soil
properties, LULC, and climate conditions are the criteria required for the cultivation of rice in
the study area. The factors, which were stated above, are the major physical factors, which were
considered in determining the cultivation of rice crops in the study area. All these factors do
not have the same influences on crops. Some crops want one factor more than the others. These
factors bring different impacts on cultivation. Therefore, the weight given for the rice crop
depends on their requirements.

2.10.1 Climate Conditions
Fogera Wereda’s climate and weather conditions play a significant role in rice cultivation. Rice
is typically produced in areas with warm and humid climates, and it desires a substantial amount
of water for proper growth. The availability of rainfall, temperature patterns, and the length of
the growing season can all impact the success of rice cultivation in the area.




                                               18


## Page 30

2.10.1.1        Rainfall
Rainfall is the most important factor governing the distribution of rice cultivation areas. The
distribution of rainfall varies greatly across the study area, according to season, altitude, and
physical features of the landscape. Clear annual patterns are evident, although rainfall is
extremely variable. Rice crop requires rainfall ranging between 1000 and 1500 mm per year
(Adamu et al., 2012). If the rainfall pattern is well distributed hence favoring the cultivation of
rice. Annual rainfall in the rice cultivation Regions of Ethiopia varies from 1300 to 2000mm
(Shitu et al., 2023).

2.10.1.2        Temperature
According to (Moat et al., 2017), the ideal average minimum temperature for rice crops is 13 -
15˚C, which in most cases occurs. The ideal average temperature is 18 - 23˚C, with an ideal
average maximum (daytime) temperature of 25 - 27˚C. Maximum temperatures of 27 - 30˚C
are not harmful if they exist for short periods (hours), and if there is sufficient water available
in the soil. According to Joseph et al. (2023), rice does not well under temperatures of 15 and
above 28°C. These temperatures overcome in most of the country's rice-producing areas.

2.10.2 Soil Characteristics
Soil fertility can be used to describe the availability of nutrients for plant uptake and in the
broader context can result from soil type, soil organic matter status, soil properties including
salinity or alkalinity, as well as the concentration of available nutrients should be reflective of
land use. The type and quality of soil in the study area can affect rice cultivation. In rice, like
any other agricultural activity, soil contributes a larger percentage of influence towards the crop.
Rice generally needs fertile soils with good water-retention capabilities. The existence of
nutrients, soil pH levels, soil depth level, and soil texture can impact the efficiency and health
of rice crops in the area.

2.10.3 Land Availability and Topography
The availability of suitable land for rice cultivation is vital. Flat or gently sloping terrains are
favored for rice farming as they facilitate water management and prevent waterlogging. The
size and quality of available land for rice cultivation can determine the scale and productivity
of rice crops in Fogera Woreda.



                                               19


## Page 31

According to (Zenna and Berhe, 2009), rice cultivates at various altitudes, ranging from 1700 -
2500m above sea level in the study area. However, the majority of rice crops are produced in
altitudes ranging from 1800 - 2300m above mean sea level.

Slope describes the vulnerability of a location to erosion and determines the potential for
mechanization. Thus, flat or low slopes are best, as steep slopes desire major soil conservation
practices and reduce the efficiency of agricultural practices.

2.10.4 Farming Practices and Technology
The adoption of appropriate farming practices and technologies can significantly influence rice
cultivation. Factors such as seed selection, planting methods, crop management techniques, pest
and disease control measures, and post-harvest handling practices can impact the yield and
quality of rice crops in the Region.

2.10.5 Socioeconomic Factors
Socioeconomic factors, such as the accessibility of credit, farmers' access to information and
extension services, land ownership patterns, and government policies, can also influence rice
crop cultivation. These factors influence farmers' decision-making processes and their ability
to invest in rice cultivation.

2.11    Constraints Associated with Rice Cultivation in Fogera Woreda
Rice cultivation is fundamental for food security and economic development, but it comes with
its own set of obstacles. Here are some key constraints identified in the district of Fogera:

2.11.1 Traditional Means and System of Land Preparation
Means of land preparation (tillage, bunding, and leveling) in rice crop cultivation from the study
area have been undertaken by all farmers using animal plowing. There is no mechanized way
like by using tractor machines. Land preparation for lowland rice cultivation starts with the
bunding and leveling of the field to impound water and permit even flooding. The land for rice
cultivation has to be plowed repeatedly in summer to acquire the necessary depth. For
successful deep-water rice culture extra leveling of land, in addition to deep plowing, is the first
aim of land preparation.




                                               20


## Page 32

2.11.2 Insufficient Mechanization
The lack of modern machinery and equipment for land preparation, planting, and harvesting
hinders the efficiency and productivity of rice cultivation. Farmers often rely on traditional
methods, which can be time-consuming and less productive.

2.11.3 Market Failure of Improved Varieties
While the trend of rice marketing has improved in terms of supply to the Woreda market over
the last decade, there are still market-related challenges. Despite advancements in rice varieties,
inadequate market access and awareness prevent farmers from adopting the improved seeds.
Market failures for improved rice varieties can impact farmers’ income and overall
productivity.

2.11.4 Harvest and Post-Harvest Management
Proper handling and storage of rice after harvest are critical for maintaining quality. Inadequate
post-harvest practices can lead to yield losses during this phase like pests, diseases, and poor
storage conditions.

Agriculturalists didn’t use harvesting machines within the last ten years ago among the time
interval of 2008 to 2018 in the area of study. Even they didn’t get access to and use any
harvesting machine since they started rice cultivation in the 1970s. This has been a challenge
for quite a long time for the farmers harvesting rice manually which wastes their time, energy,
and resources.

2.11.5 Lack of Awareness of Improved Agronomic Practices
Farmers need education and training on best practices, including proper seed rates, fertilization,
and other agronomic techniques. Raising awareness about improved techniques can enhance
rice productivity.

2.12   The Role of Geospatial Technologies for Land Suitability Analysis
2.12.1 GIS Applications for Land Suitability Analysis
The feature of GIS is its capability for analysis due to the integration of spatial and attribute
data. GIS can not only be used to prepare maps automatically but is unique in its capability to
interpret and spatially evaluate multi-source data sets like land use data, population,


                                               21


## Page 33

topography, hydrology, climate, vegetation, transport network, public infrastructure, etc. The
data is manipulated and analyzed to gain information useful for a particular application like
land‐use suitability analysis (Ferretti, 2011).

According to Seftin and Wati (2022), the purpose of GIS is to provide support for the way of
making spatial decisions. Many data layers need to be treated in multi-criterion evaluation to
arrive at suitability that can be easily accomplished using GIS. GIS allows the consumer to
assess which locations are most/least fit for purposes in the sense of land suitability assessment.
The findings of GIS analysis also may provide help for decision-making in this context. It also
enables the creation and modification of any land suitability analysis that makes the best use of
available data.

2.12.2 Multicriteria Analysis: For Land Suitability
Multi-criteria decision-making is a concept that includes multiple attribute decision-making
(MADM) and multiple objective decision-making (MODM). MADM is functional when a
choice out of a set of separate actions is to be made. It is supposed in MODM that the best
solution can be found anywhere in the space of feasible alternatives and is therefore viewed as
a problem of continuous decision. MADM is often referred to as MCA or MCE. Instead,
MODM is like Pareto’s optimal search using mathematical programming procedures (Takagi
et al., 2023).

To define the suitability of an area for a specific purpose, several criteria need to be evaluated.
MCDM or MCE has been developed to improve spatial decision-making when a set of
alternatives needs to be evaluated based on incompatible and disproportionate criteria. MCE is
an effective tool for multiple criteria decision-making issues and aims to investigate several
choice possibilities considering multiple criteria and objectives. Crop-land suitability analysis
is a precondition to achieving optimal utilization of the available land resources for sustainable
agricultural cultivation (Xiao et al., 2020).

In MCDM, every criterion is weighted to represent its impact on the phenomenon. These are
dependent on the nature of the alternatives under consideration, the factor used to compare
alternatives, and the weights derived for the factor. MCDM involves input data, the decision
maker’s preference, and manipulation of both information using identified decision rules. In


                                                  22


## Page 34

this spatial, multi-criterion decision-making approach, the input data is geographical. In this
study topography, soil properties, and climate variables have been identified for suitability
analysis of rice cultivation. Then, the fundamental factors, including slope, soil type, soil
texture, soil depth, soil pH, LULC, temperature, and rainfall were chosen based on the expert’s
knowledge and consideration of literature inputs.

2.12.3 Analytical Hierarchy Process
This method is one of the popular techniques used in any condition where decision-making
involves examining the best choice from various alternatives. It is employed by multi-criteria
decision-making. In some literature, it is stated as the Saaty method. This is because it was first
designed by Thomas Saaty in 1970. The main characteristic of the AHP method is the use of
pair-wise comparisons.

Complex problems constantly require a rigorous decision-making process which can break the
problems into manageable levels. A problem is revealed to have been completely solved if the
best consideration and choice are used to realize the stated goal. By use of hierarchical
arrangement on the way to solving any problem, every criterion that may be involved in the
process is measured and given a chance to contribute some impact (Taiwo, 2022).




                                               23


## Page 35

CHAPTER THREE

                            MATERIALS AND METHODS
    3.1 Materials
    3.1.1 Data Type and Their Sources
    In this study topography, properties of soil, LULC, and climate variables are selected for land
    suitability assessment of rain-fed rice cultivation. Then, eight causal factors, including slope,
    LULC, soil type, soil texture, soil depth, soil pH, temperature, and rainfall are identified
    depending on local expert's knowledge and consideration of different literature inputs.

    Table 3. 1: Data and their sources

No. Main              Sub-criteria/      Type              Data Sources        Resol   Year    Purpose
    Criteria/                            (data                                 ution
    Datasets          Layers             format)

1      Climate        Temperature        Excel             Ethiopian                   1994    Temperature
                      & Rainfall                           Meteorology                 -2023   and Rainfall
                                                           Agency (EMA)                        map

2      Topography DEM/elevatio           Raster/Tif        Sentinel1-A         10m     2023    Slope map
                  n and slope            f                 (https://scihub.c
                                                           opernicus.eu/.)

3      Soil           Soil type, soil Raster/Tif           Ministry       of 250m      2022    Soil    type,
                      depth, and soil f                    Agriculture                         texture, pH,
                      pH                                   (MoA)                               and      soil
                                                                                               depth map
                      Soil texture       Raster/Tif        ISRIC               250m
                                         f

4      Land use       LULC               Raster/Tif        Landsat 8 image 30m         2023    Current land
                                         f                 from      USGS                      use map
                                                           Earth Explorer

5                     Administrativ      Shapefile/        ESS       former            2020    Study area
                      e boundaries       Vector            CSA                                 delineation




                                                      24


## Page 36

3.1.2 Methods of Data Collection
The achievement of any GIS application depends on the quality of the spatial data used (Xue et
al., 2023). Collecting high‐quality and up-to-date spatial data input for GIS is a critical stage.
Data collection is one of the most time‐consuming and expensive, yet important for GIS‐based
studies. GIS can comprise a wide variety of spatial data types originating from many diverse
sources (Mao et al., 2020).

Data acquisition and preparation is the first fundamental step in GIS-based MCDM land
suitability analysis. Various spatial and non-spatial datasets are gathered from different
organizations related to rice crop suitability and processed using multiple GIS tools for analysis
and mapping purposes. Secondary data sources were used to get relevant information and
address the specified objectives of the study.

3.1.3 Tools and Software’s Use
For this study the following software was used for data organizing, pre-processing, editing,
processing, analyzing, visualization, and mapping of the result ArcGIS Pro was used; for
satellite image processing, image stacking, classification, and accuracy assessment Erdas
Imagine 2015 was used; SNAP (European Space Agency) for DEM generation, and Microsoft
Excel was used for data analysis, research writing and presentation.

Table 3. 2: Software used for processing and analysis

 No.       Software Type                              Purpose

 1         ArcGIS Pro 3.0                             For suitability analysis

 2         Erdas Imagine 2015                         For LULC processing

 3         SNAP                                       For DEM generating

 4         Microsoft Office Packages (Excel, For data analysis, research
           Word, PowerPoint & Access) 2013            writing, and presentation




                                                 25


## Page 37

3.2 Description of the Study Area
Fogera is one of the 183 Weredas of the Amhara Regional State and is placed in the South
Gondar Zone. It has 35 rural peasant associations (PAs) and 4 urban kebeles. Woreta is the
capital city of Fogera Woreda and is found 625 km from Addis Ababa and 55 km north of the
Regional capital Bahir Dar City. Fogera is bordered to the south by East Este Woreda,
southwest by Dera Woreda, and west by Lake Tana, north by Libo Kemkem Woreda, east by
Farta Woreda, and northeast by Ebinat Woreda. Geographically, it is found at 11° 57' 59.99" N
and 37° 40' 59.99" E, covering a total area of 1111.4km².




Figure 3. 1 Map of the study area



                                            26


## Page 38

3.2.1 Physical and Socio-Economic Characteristics
The Woreda, also called the Fogera plane, has an extraordinarily level arrival and is located
next to Lake Tana's eastern shore. But as you move east, the terrain becomes more rocky. The
range of altitude is 1800–2500 meters. About 76% of the Woreda is made up of flat land, with
the other 24% being made up of valley bottoms and mountain slopes. (Tilahun et al., 2017).

The Region is characterized by a subtropical plateau climate, which affects the temperature. In
the Region, the mean monthly temperature is roughly 23 °C, the mean monthly maximum
temperature is roughly 27.4 °C, and the mean monthly minimum temperature is roughly 15 °C.
In Fogera Woreda, the average yearly temperature varies between 15 and 27 °C (NMA, 2018).




Figure 3. 2 Temperature distribution of the study area

According to the National Metrological Agency (NMA, 2015), the rainfall of the area is
characterized by an unimodal distribution with the highest in July. The yearly rainfall ranges
from about 1000 to 1500 mm from both the short (March and April) and long rains (June to
September). The mean monthly values vary from 0.6 mm (January) to 415.8 mm (July), which
shows the poor temporal distribution of rainfall.




                                             27


## Page 39

Figure 3. 3 Rainfall distribution of the study area

Source: (NMA, 2017)

Rice cultivation prefers soil with good water-holding capability, fertility, permeability, and a
middle pH value. Sandy clay soil is usually the most suitable for rice (Asebu, 2021). The major
soil types in the study area reveal a general relationship between altitude and slopes. According
to the soil data from the Minister of Agriculture, the area has 9 main soil types. The dominant
soil type is haplic xerosols typically in the lowland flat plains, valley bottoms, and river terraces.

In the northern and western Regions of the Woreda, which include the Fogera lowlands and are
subject to flooding during the rainy season, the primary agricultural products are rice, fish,
horticulture, and livestock. From the lowlands to the highlands, the agricultural products grown
in the south and east include grains, oil crops, horticulture, cattle, and beekeepers. Native cattle
are abundant throughout the plains. While rearing cattle remains a significant business, crop
cultivation has grown in significance. The rice cultivation on the Fogera Plain and its distinction
as the home of the rare Fogera Cattle breed set Fogera apart from other Woredas.

The LULC in Woreda is dominated by agricultural land, around 68% of the total land area was
allocated to agriculture including farming and grazing land. The quantity of water bodies and
swampy areas (wetlands) accounts for 21% of the total Woreda land mass (Mulugeta, 2014).




                                                28


## Page 40

The main rice sowing season in Fogera is between June to July, grows until September, and is
commonly harvested during November with some kebele trailing into December harvests. Most
of the time rice is produced during the main rainy season in the study area.

Table 3.3: Study area rice crop calendar


June                  July   August                               October
                                                  September                     November




Rice    (main;
wet season)
                 Sowing



                 Growing



                 Harvest




According to the Ethiopian Statistical Service (ESS, 2007), the total population of the Fogera
Woreda is around 233,529. The 2014-2017 population projection displays that Wereda’s
population in both sexes increased by 2%.




                                             29


## Page 41

3.3 Methods
When analyzing the suitability of land for farming, many different factors must be evaluated to
determine the best location for growing rice. GIS techniques integrated with a spatial multi-
criteria decision-making approach was a method where geospatial data are combined and
transformed into a decision. In MCDM, each criterion is weighted to represent its actual
importance to the phenomenon. The study uses a multi-criteria assessment approach to combine
environmental datasets such as topography, soil properties, current land use, and climatic
conditions to identify suitable locations for rain-fed rice cultivation. Eight basic factors were
then selected, including slope, soil type, soil texture, soil depth, soil pH, LULC, temperature,
and precipitation, taking into account experts' and various literature. Constraints that limit or
restrict the production of rice crops like settlement areas, religious institutions, forest areas,
rock areas, grazing land, and water bodies particularly in a study area,

Using AHP as a supportive decision-making tool would help gain a better insight into complex
decision problems. Structuring the problem as a hierarchy makes researchers consider possible
decision criteria and select the most important parameter concerning the decision objective.
Using pairwise comparisons supports the discovery of and corrects logical inconsistencies.

The suitability level of each criterion was classified as high, medium, unsuitable, and poor
based on the property suitability classification structure. Factors were assigned weights
according to the relative importance of the criteria. Pairwise comparisons were used to evaluate
the parameters and the generated priorities were used to assign weights using the weight overlay
tool in ArcGIS Pro 3.0. The weights of the criteria depend on the principal eigenvector of the
decision matrix.




                                              30


## Page 42

Figure 3. 4 Flow diagram of the method used for suitability analysis



                                            31


## Page 43

3.4 Rice Suitability Evaluation Factors
3.4.1 Topographic Factors
The landform information of an area is an essential factor for land suitability evaluation in the
area of study. The elevation and slope of a given area play a significant role in agricultural
activities in general, and specifically for rice cultivation. The workability of the area, erosion
hazard, and possible mechanization, especially for rice cultivation areas, depends on the slope
or elevation of the area in one or the other way. The slope for cropland suitability assessment
is a key variable when used with other variables, a slope is vital in site analysis and estimating
suitability (ESRI, 2023). The slope is generally generated from a digital elevation model
(DEM) using spatial analyst tools in ArcGIS Pro.

3.4.2 Climate Factors
Climate is one of the most important factors for land suitability analysis mapping. Climate
influences the spatial and temporal variations of farming activities and land use patterns.
Consequently, in the land suitability analysis climatic variables should be considered as
diagnostic land qualities/land characteristics. It influences the growth, development, and yields
of crops, including rice, favorably or unfavorably. The majority of the land uses are sustainably
affected by rainfall, temperature, and humidity of the area (FAO, 2015). This study has used
rainfall and temperature, to assess land suitability as a climatic factor. Rice being a tropical and
sub-tropical crop was normally grown at a fairly high temperature – high rainfall regime,
ranging from 21 to 27°C and 1300mm to 1530mm of annual rainfall (Sanogo et al., 2023).

3.4.3 Soil Factors
The suitability of soil for rice cultivation is another important factor. It is a vital element in our
ecosystem. It provides an anchorage and nutrients to the crops. Thus soil is a fundamental raw
material for the cultivation of any crops including rice. Rice generally grows well in fertile soils
with good water-holding capacity. Subsequently, the information on soil characteristics is
essential for rice cropland suitability analysis and mapping. The presence of nutrients, soil pH
levels, soil depth, and soil texture can impact the productivity and health of rice crops in the
study area. Soil information of the study area was obtained from the Ministry of Agriculture
(Ethiopia) in raster form.



                                                32


## Page 44

3.4.4 Land use Land cover
For this study, LULC is one of the main factors that are considered for rice suitability analysis.
It is one of the most easily detectable indicators of human intervention on land. Because it can
change quickly over time, it is also a good representation of the dynamics of the earth's surface
resulting from a variety of factors (Chaemiso et al., 2021). Understanding the LULC status of
a study area is highly essential for assessing and managing natural resources, land use planning,
land evaluation, change detection, and monitoring environmental changes such as deforestation,
drought, and land degradation.

3.5 Research Design
There are different types of research approaches. However, for this study, the quantitative
research approach was applied to manage, pre-process, classify, and analyze the collected data.
All the data was processed and weighted like soil, topography, LULC, and climate datasets
related to suitability for rice cultivation and expressed in percent.

3.6 Methods of Data Processing and Analysis
Land suitability for agriculture contains various social, technological, environmental, and
economic aspects. GIS-based MCDA is a method that interprets and integrates geographical
data and preferences of decision-makers to obtain decision-making information (Malczewski,
2006). GIS-based MCDA provides a unique method that can manage and fit together a wide
variety of variables analyzed in different ways, thus providing the decision-maker with valuable
assistance in pointing at suitable locations.

3.6.1 Criteria Determination
For land suitability analysis of rice crops, there is no uniform standard in the overall procedure
of the operations; rather, it is applied based on nature, situation, and available resources in a
given geographic location. The suitability levels for each of the criteria were defined based on
national manuals, guidelines, expert knowledge, author’s practical experiences, research station
publications, and relevant literature for rice cultivation as clear in the following Table 3.4
(Kihoro et al., 2013; Ayehu and Besufekad, 2015; and Getachew, 2015). Hence, four main
criteria and eight parameters namely: topography (slope), climate (temperature and rainfall),




                                                33


## Page 45

soil (type, texture, pH, and depth), and LULC were identified considering the nature of the
       study area and the available information.

       Table 3. 4: Criteria used, data range, and suitability class for rice

General        Sub Criteria          Level of Suitability
Criteria
                                     S1               S2             S3            N1              References

Topography     Slope (%)             0-4              4-8            8 - 20        >20             Getachew,
                                                                                                   2015,
Climate        Temperature (°C)      23 - 27          19 - 23        15 – 19       <15 or >27
                                                                                                   Ayehu      &
                                                                                                   Besufekad,
               Rainfall (mm)         >1300            1200 - 1300 1000           - <1000
                                                                                                   2015
                                                                  1200

Soil           Soil type             Haplic           Chromic        Eutric        Calcic          Ayehu     &
                                     xerosols         vertisols      nitisols      xerosols     & Besufekad,
                                                                                   Orthic luvisols 2015

               Soil depth (cm)       > 100            50 - 100       30 – 50       0 - 30

               Soil        texture Sandy clay & Clay loam            Sandy    Sand                 Kihoro et
               (class)             Sandy clay                        Loam and                      al., 2013
                                   loam                              Loam

               Soil pH               5.6 - 7.4        7.4 - 7.8      5.1 - 5.6     <5.1 or >7.8    Getachew,
                                                                                                   2015

Land_use       LULC (class)          Agricultural     Waterbody      Grassland     Forest       & Google
                                     land                                          settlement area Earth Pro


       3.6.1.1 Climate Data
       Two meteorological stations that are found inside the study area (Woreta and Alem ber) with
       average monthly rainfall and temperature of 30 (1994 - 2023) years were acquired from the
       National Metrological Agency of Ethiopia in Excel format. In the MS Excel file containing the
       climate data, spatial data in terms of latitudes and longitudes of the places of weather stations
       were entered into corresponding climate data. The results were exported to the ArcGIS Pro
       software for further manipulation, and then the interpolation technique was applied with the use



                                                      34


## Page 46

of the Geostatic analyst tool an Inverse Distance Weighted (IDW) method was made to estimate
the overall rainfall and temperature distribution of the area. Finally, the mean temperature and
rainfall map was reclassified input to land suitability analysis classification for (Ayehu and
Besufekad, 2015) rice crop cultivation.

3.6.1.2 Topography Data
Elevation, also known as altitude, is the height of a place above or below a reference point, such
as the mean sea level (MSL). Slope factors are the major influences on land suitability for rice
crop cultivation (Topuz and Deniz, 2023). A digital elevation model with high spatial resolution
data (10m) was downloaded from Sentinel 1-A on the ESA website and generated by using
SNAP software 9.0. From the elevation data, the slope was derived by using ArcGIS Pro
software surface analysis. The slope of the Fogera Woreda which was derived from DEM was
given in percent and reclassified based on land suitability analysis classification (Getachew,
2015).

3.6.1.3 Soil Data
Soil data (soil type, soil depth, soil pH, and texture) which had 250m spatial resolution were
acquired from the Ministry of Agriculture in raster format and then, reclassified depending on
rice crop requirements according to agricultural land suitability analysis category (Kihoro et
al., 2013). The main soil types in the district include haplic xerosols, chromic vertisols, eutric
nitisols, calcic xerosols, and orthic luvisols.

3.6.1.4 Land Use Land CoverFogera
A LULC map was used in this study to distinguish various features on the land surface that are
recorded by the Landsat 8 sensor. According to Fritz (2010), for land evaluation, delineating
the current land-use boundary was the first stage. Landsat 8 image of 2023 which has 30m
spatial resolution was downloaded from the USGS website. It is used to prepare the current
LULC map of Fogera Woreda through Erdas Imagine image processing software 2015. For the
preparations of the current LULC map of the study area the following key steps must be
completed: pre-processing of the downloaded image, LULC classification (supervised
classification), and checked accuracy assessment using Google Earth Pro.

    1. Pre-Processing of Satellite Images


                                                  35


## Page 47

The Landsat 8 (OLI) image has eleven bands. Under this, the corresponding seven bands were
stacked together. Band eight was excluded because it has a panchromatic image. The stacked
images were calibrated through the calibrate tool in Erdas Imagine 2015. Before classifying
LULC, first, the stacked image should be done in preprocessing data operations (atmospheric
and radiometric correction). The false-color composite that is red 5, green 4, and blue 3 was
used to produce the LULC map of the study area.

   2. LULC Classification

For every single class, proper training sites were taken to create signatures. After establishing
training sites, each was stored in the signature editor, and color was chosen for the particular
feature class. To classify image pixels into spectral classes the supervised classification
technique was applied. A supervised classification maximum likelihood algorithm in Erdas
imagine was applied in this study to classify LULC using multispectral satellite data obtained
from Landsat 8 for 2023. The study area was classified into five main LULC classes. These
were agricultural land, water bodies, forests, grassland, and settlement areas.

Table 3. 5: LULC categories of Fogera Woreda

 Land cover class     Description

 Forest land          The land was sheltered by a relatively condensed collection of trees that
                      have closed canopy and eucalyptus plantations.

 Agricultural land    This category comprises all cultivated land. It contains holding areas for
                      livestock and land plowed and made ready for sowing.

 Waterbody            This category includes rivers, streams, reservoirs and lakes

 Settlement           This category contains dispersed rural settlements, residential areas,
                      commercial, and recreational sites, public installations, and
                      infrastructures.

 Grassland            Areas permanently covered by grasses are used for grazing and are
                      communal as well.


   3. Accuracy Assessment



                                              36


## Page 48

The accuracy assessment reveals the real difference between classification and the reference
map or data. Random selection of reference pixels was used to decrease the biases of using the
same pixels for testing classification. Since image classification without accuracy assessment
is incomplete, the accuracy assessment for the image was done. Because of that, LULC maps
generated from remote sensing imagery always contain some sort of errors due to various
factors which range from the method of satellite data capture to classification technique. There
were 35 reference points collected randomly in the area of Fogera Woreda by using Google
Earth Pro. Then, 13 points from agriculture, 10 points from forest, 6 points from grassland, 4
points from settlement, and 2 points from water bodies were collected depending on the study
area. The overall accuracy of classified LULC in the study area was approximately 91%.

3.6.2 Criteria Standardization and Rating
Rice cultivation area requires suitable LULC, slope, rainfall or sufficient moisture content, and
fertile soil for cultivation. Those are the most significant requirements common for all crops in
general and rice cultivation in specific. Data are measured on various units as well as on
different scales of measurement. Thus, it is essential to standardize the criteria before
combination and ensure they are transformed, if necessary, all criteria maps are positively
correlated with suitability.

Linear scale transformation is the most commonly used GIS-based method for criteria
standardization. Thus, all factors have been standardized for this study, by using a reclassified
spatial analyst tool (ArcGIS Pro), to make sure that each criterion had a corresponding
measurement basis. Simultaneously during reclassification, factor rankings were also assigned
for suitability analysis from 1 (highly suitable) to 4 (unsuitable). To have a reasonable contrast,
a common standard is required to apply a weighted overlay over each of the input parameters.

3.6.3 Assigning Criterion Weights
A weight is a value assigned to an assessment basis that visualizes its significance relative to
the other criteria under consideration. There have been several methods used for evaluating
criterion weights. The pairwise comparison method is based on the assumption of spatial
homogeneity of selections and assigns a single weight to each criterion.




                                               37


## Page 49

A pair-wise comparison of the AHP method introduced by Saaty (1987) is used to calculate the
required weighting criteria for this study. A pairwise comparison matrix has been calculated in
an AHP extension tool (ArcGIS add-on) and cross-checked with an Excel sheet. The pairwise
comparison method developed by Saaty in the context of a decision-making procedure is a ratio
(reciprocal matrix) where each aspect is compared with the other parameter, relative to its
importance on a scale.

Table 3. 6: Scale for pairwise comparisons (Saaty, 1987)

 Intensity of Definition                          Explanation
 Importance

 1              Equal importance                  Two activities contribute similarly

 3              Moderate importance of one Experience and judgment strongly favor one
                over another               activity over another

 5              Essential or strong importance Involvement & judgment strongly favor one
                                               activity over another

 7              Very strong importance            An activity is strongly favored & its dominance
                                                  confirmed in practice

 9              Extreme importance                The evidence favoring one action over another
                                                  is the highest possible order of confirmation

 2,4,6,8        Intermediate value                When compromise is required

 Reciprocals    Value for inverse compression The inverse value of the comparison


The ratio scales are derived with the support of Principal Eigen Vectors and the consistency
index is derived through Principal Eigen Value. To make some decisions compare one or more
alternatives with one or more parameters to make some conclusion, this depends on the
comparison. Some of the parameters have more effects than others and according to their
importance, are assigned their weights.

For this study criteria weight was calculated based on the following formula;




                                             38


## Page 50

Where:      = criteria weight


                                                         =Normalized entire matrix

                                                       n = number of criteria

Then, the consistency ratio was computed to check the consistency of comparisons. It was
calculated as follows;




3.6.4 Weighted Overly Analysis
Weighted overlay applies a common scale of values to diverse and dissimilar inputs to produce
an integrated analysis. The weighted overlay roles weigh the individual input raster on a defined
scale. The higher favorable places for each input criterion were reclassified to the higher values.
In the weighted overlay tool, the percentage influences assigned to all the input raster must
equal 100%.

In this study, different map layers characterizing land suitability were weighted using the
weights derived from the AHP method. Aggregation of the weight and standardized rated
criterion map, the weighted overlay method was applied to joint standardized rated criteria and
weighted criteria to map the suitable land.

This was completed as the following formula;




                                               39


## Page 51

CHAPTER FOUR

                         RESULTS AND DISCUSSION
4.1 Preprocessing of Data and Reclassification Results
The physical factors of the land as well as climate conditions are the major influences that
determine crop suitability of a given land. The physical land properties of the study area, which
were analyzed include topography (slope), soil (type, texture, pH, and depth), and current
LULC. The climate (temperature and rainfall) of the area was also used for rice cultivation
suitability analysis.

4.1.1 Factors of Rice Cultivation Suitability Analysis
4.1.1.1 Rice Suitability Analysis Based on Temperature
Temperature is one of the limiting criteria for rice crop cultivation. The classified temperature
data was resampled to 10m spatial resolution before reclassifying its suitability map of the area
study. This was done by using ArcGIS Pro (Resample tool). Based on the temperature
requirement of rice cultivation, the temperature of the study area was reclassified into four
suitability levels affording to the land suitability analysis classification. These were highly
suitable (S1), moderately suitable (S2), less suitable (S3), and unsuitable (N1). The temperature
that ranges from 23° to 27° (48%) and 19° to 23° (26 %) were classified as highly and
moderately suitable respectively for rice crop cultivation.

Table 4. 1: Temperature suitability class

 Temperature (oC)        Level of suitability    Value        Area (km²)   Area coverage (% )

 <15 or >27              N1                      4            53.8         4.8

 15 - 19                 S3                      3            240.5        21.6

 19 - 23                 S2                      2            289          26.1

 23 - 27                 S1                      1            528.1        47.5

                                                 Total        1111.4       100




                                                40


## Page 52

Figure 4. 1 Suitability map for temperature analysis of the study area

4.1.1.2 Rice Suitability Analysis Based on Rainfall
Rainfall distribution plays a significant role in improving agricultural cultivation. Thus, the
average rainfall distribution together with its variation in both frequency and extent
encompasses its agronomic importance. The classified rainfall data was resampled to 10m
spatial resolution before reclassifying its suitability map of the study area. This was done by
using the ArcGIS pro software Resample tool. Rainfall requirement for rice crop cultivation in
the study area was classified into four suitability classes depending on the land suitability
analysis classification standards. Its suitability levels range from highly suitable to unsuitable.

The results (Table 4.2 and Figure 4.2) show that rainfall ranges greater than 1300 mm (26.8%),
and 1200 to 1300 mm (24.5%) were classified as highly and moderately suitable for rice
cultivation respectively in the study area.




                                               41


## Page 53

Table 4. 2: Rainfall suitability class

 Rainfall (mm)       Level of suitability    Value       Area (km²)   Area coverage (% )

 >1300               S1                      1           297.5        26.8

 1200 - 1300         S2                      2           272.9        24.5

 1000 - 1200         S3                      3           295.6        26.6

 <1000               N1                      4           245.4        22.1

                                             Total       1111.4       100




Figure 4. 2 Rainfall suitability map of the study area

The result (Figure 4.3) shows the weight of influences of climate conditions both rainfall (55%)
and temperature (45%) for rice crop cultivation suitability in the study area. From the total study
area 61.5 km² (5.5%), 520.8 km² (46.8%), 528.2 km² (47.1), and 1.3 km² (0.2%) were classified
as highly suitable, moderately suitable, less suitable and unsuitable respectively for rice crop
cultivation.




                                                 42


## Page 54

Figure 4. 3 Map of climate variables weight of influence for rice suitability

4.1.1.3 Rice Suitability Analysis Based on Slope
The slope has been considered as one of the evaluation criteria in rice crop suitability
assessment. The slope of the study area was reclassified into four classes according to land
suitability analysis classification. The classes include highly suitable, moderately suitable, less
suitable, and unsuitable. Slopes between 0 to 4 (61.9%), and 4 to 8 (18.3%) were categorized
as highly and moderately suitable for rice cultivation respectively.




                                               43


## Page 55

Table 4. 3: Slope suitability class of the study area

 Range (%)          Level of suitability    Value       Area (km²)       Area coverage (% )

 0-4                S1                      1           687.6            61.9

 8                  S2                      2           203.6            18.3

 8 - 20             S3                      3           200.8            18.1

 >20                N1                      4           19.4             1.7

                                                Total   1111.4           100




Figure 4. 4 Slope suitability map

4.1.1.4 Rice Suitability Analysis Based on Soil Types
Soil type influences the determination of land suitability potential for suitable crop cultivation.
Thus, it was taken as one criterion in developing a rice crop suitability analysis map for the
study area. The soil type of the study area which was gained from MoA was extracted by using
the study area boundary and resampled to 10m spatial resolution. This was done by using the
ArcGIS Pro Resample tool. All types of soils are not suitable for crops in cultivation, in this
study area Haplic xerosols are identified as highly suitable soil for rice cultivation due to their



                                                44


## Page 56

highest area coverage (69.1%) and Calcic xerosols & Orthic luvisols were identified as
unsuitable (3.7%) soil types for rice crops. Other soil types of the Woreda fall in between this
extremity due to their moderate and less suitable. The rasterized soil type of the area was
reclassified depending on rice crop requirements.

Table 4. 4: Soil type suitability class of the study area

 Soil type             Level of suitability Value           Area (km²)   Area coverage (% )

 Haplic xerosols       S1                     1             750.5        69.1

 Chromic vertisols     S2                     2             196.2        18.0

 Eutric nitisols       S3                     3             99.4         9.2

 Calcic xerosols & N1                         4             40.7         3.7
 Orthic luvisols

                                                  Total     1086.8       100




Figure 4. 5 Soil type suitability map




                                               45


## Page 57

4.1.1.5 Rice Suitability Analysis Based on Soil Texture
Soil texture is the level of coarseness of the soil, and rice being a tropical trim, desires a soil
surface that can hold water for a longer period, supportive of the classification of soil suitability
for rice. The suitability of soil texture for crops was evaluated through its suitability potential
for rice cultivation. The categorized soil texture data was resampled to 10m spatial resolution
before reclassifying its suitability analysis map of the study area. This was determined by using
ArcGIS Pro (Resample tool). Based on the soil texture requirement for rice cultivation, the soil
texture of the study area was reclassified into four suitability classes according to the land
suitability analysis classification. Its suitability class ranges from highly suitable to unsuitable.

The results (Table 4.5 and Figure 4.6) display that 83.9 % of the total area of the study area soil
texture was dominated by clay loam and was moderately suitable for rice cultivation. Of the
total area, 3.9% was sandy clay and sandy clay loam was highly suitable, whereas, 0.5% of the
area was sand and unsuitable for rice crop cultivation.

Table 4. 5: Soil texture suitability class of the study area

 Soil texture            Level of suitability    Value       Area (km²)      Area coverage (% )

 Sandy clay & Sandy S1                           1           43.9            3.9
 clay loam

 Clay loam               S2                      2           926.2           83.9

 Sandy Loam and S3                               3           129.5           11.7
 Loam

 Sand                    N1                      4           4.8             0.5

                                                     Total   1104.4          100




                                                46


## Page 58

Figure 4. 6 Soil texture suitability map of the study area

4.1.1.6 Rice Suitability Analysis Based on Soil Depth
The soil depth of the study area which was obtained from MoA was extracted by using the study
area boundary and resampled to 10m spatial resolution. This was done by using the ArcGIS Pro
Resample tool. Based on the soil depth requirement for rice cultivation, the soil depth of the
study area was reclassified into four suitability classes according to the land suitability analysis
classification. Its suitability classes range from highly suitable to unsuitable classes.

The result (Table 4.6 and Figure 4.7) shows that soil depth greater than 100 cm (85.7%) was
classified as highly suitable for rice. Soil depth that ranges from 50 to 100 cm (13.8%), and 30
to 50cm (0.5%) were classified as moderately, and less suitable respectively for rice cultivation.




                                               47


## Page 59

Table 4. 6: Soil depth suitability class of the study area

 Soil depth (cm)     Level of Suitability Value         Area (km²)     Area coverage (% )

 > 100               S1                      1          947.6          85.7

 50 - 100            S2                      2          152.7          13.8

 30 - 50             S3                      3          4.6             0.5

 0 - 30              N1                      4          0.0            0.0

                                                  Total 1104.4         100




Figure 4. 7 Soil depth suitability analysis map of the study area

4.1.1.7 Rice Suitability Analysis Based on Soil pH
The soil pH value was the other factor that influenced rice cultivation suitability analysis. The
classified soil pH data was resampled to 10m spatial resolution before reclassifying its
suitability map of the Fogera Woreda. This was done by using the ArcGIS Pro Resample tool.
The amount of soil pH in the study area ranges between a minimum value of 5.1 to a maximum
value of 7.8. The result was visualized in a map as shown in Figure 4.8.




                                                 48


## Page 60

The Soil pH value of the study area was reclassified into four levels depending on rice
cultivation requirements according to land suitability analysis classification. The classes range
from highly suitable (S1) to unsuitable (N1).

Table 4. 7: Soil pH suitability class of the study area

 Soil pH            Level of suitability   Value          Area (km²)   Area coverage (% )

 5.6 - 7.4          S1                     1              1062.4       95.6

 7.4 - 7.8          S2                     2              30.5         2.7

 5.1 - 5.6          S3                     3              3.4           0.3

 <5.1 or>7.8        N1                     4              15.1         1.4

                                                Total     1111.4       100


From the total area of the district (1062.4 km²) 95.5% was highly suitable for rice cultivation
regarding soil pH. Of the total study area (30.5 km²) 2.7% was moderately suitable for rice crop
cultivation, whereas 1.4% of the study area 15.1 km² of the Woreda was not suitable for rice
crop cultivation.




Figure 4. 8 Soil pH suitability map of the study area


                                                49


## Page 61

The result (Figure 4.9) displayed that soil's physical and chemical properties (Soil type (26%),
Soil texture (33%), Soil pH (23%), and Soil depth (18%)) weight influence rice cultivation
suitability in the study area. From the total study area 876.1 km² (86.6%), 132.9 km² (13.1%),
and 2.5 km² (0.3%) were classified as highly suitable, moderately suitable, and less suitable
respectively for rice cultivation.




Figure 4. 9 Soil properties weight of influences for rice crop suitability map

4.1.1.8 Rice Suitability Analysis Based on LULC
The primary step in the MCE technique is preparing LULC data to classify the current LULC
according to its importance. The classified LULC data was resampled to 10m spatial resolution
before reclassifying its suitability map of the study area. This was done by using the ArcGIS
Pro software Resample tool. Accordingly, from the LULC classes of the study area agricultural
land (82.3%) and water bodies (2.4%) were categorized as highly and moderately suitable for



                                              50


## Page 62

rice crop cultivation respectively. Settlement and forest (8.9%) areas were classified as
unsuitable for rice crop cultivation.

Table 4. 8: LULC suitability class of the study area

 LULC classes          Level of suitability    Value        Area (km²) Area coverage (% )

 Agricultural land     S1                      1            914.2          82.3

 Waterbody             S2                      2            26.7           2.4

 Grassland             S3                      3            71.1           6.4

 Forest            & N1                        4            99.4           8.9
 Settlement Area

                                                    Total   1111.4         100




Figure 4. 10 LULC suitability map of the study area

After reclassifying all factors which were used for rice cultivation suitability the following table
provides a comparative analysis of those considerations based on their suitability criteria.

Table 4. 9: Overall land suitability class for rice cultivation (Area in %)



                                               51


## Page 63

Area of suitability classes in %

 Criteria                S1          S2            S3                      N1

 Rainfall                26.8        24.5          26.6                    22.1

 Temperature             47.5        26.1          21.6                    4.8

 LULC                    82.3        2.4           6.4                     8.9

 Slope                   61.9        18.3          18.1                    1.7

 Soil type               69.1        18.0          9.2                     3.7

 Soil texture            3.9         83.9          11.7                    0.5

 Soil depth              85.7        13.8          0.5                     0.0

 Soil pH                 95.6        2.7           0.3                     1.4


From the table above large area was classified under highly suitable and moderately suitable
for rice cultivation concerning all factors. Of the total area, 48% was highly suitable for rice
cultivation regarding to temperature. From the total area, 82% was highly suitable for rice
cultivation regarding LULC. From the total area of the study area, 4%, 84%, 11%, and 1% were
highly, moderately, less, and unsuitable respectively for rice crop cultivation regarding soil
texture. For a better understanding, it can be expressed in Figure 4.11.




                                              52


## Page 64

Figure 4.11: Overall land suitability for rice cultivation based on 8 factors (area %)

4.2 Determining Criterion Weights
All factors that were selected for the evaluation of land suitability for rice cultivation in the
study area were weighted using a pairwise comparison method. The pairwise comparison
matrix (PCM) was created using the analytic hierarchy process on a scale of 1 to 9. This
comparison matrix was decided and filled with the review of literature and related field expert
opinions were included.




                                              53


## Page 65

Table 4. 10: Pairwise comparison matrix for multi-criteria decision problems

 Factors        Rainfall Temperature LULC Slope           Soil      Soil        Soil            Soil pH
                                                          Type      Depth       Texture

 Rainfall       1         2             3        3        3         2           3               2

 Temperature 0.50         1             3        2        3         2           2               3

 LULC           0.33      0.33          1        3        2         3           3               3

 Slope          0.33      0.50          0.33     1        3         2           3               2

 Soil Type      0.33      0.33          0.50     0.33     1         3           2               3

 Soil Depth     0.50      0.50          0.33     0.50     0.33      1           2               2

 Soil Texture   0.33      0.50          0.33     0.33     0.50      0.50        1               3

 Soil pH        0.50      0.33          0.33     0.50     0.33      0.50        0.33            1

 Total          3.83      5.50          8.83     10.67    13.17     14.00       16.33           19


To determine the weight of each criterion, a normalization process was mandatory. To
normalize the above comparison matrix value, each cell value was divided by its column total.
To get the relative importance weight of each criterion, the mean value of the row was
computed.




                                            54


## Page 66

Table 4. 11: Normalized pairwise comparison matrix




According to the normalized pair-wise comparison results (Table 4.11), climate, soil, LULC,
and topographic factors were assigned weight values of 0.43, 0.30, 0.16, and 0.12, respectively.
From the climate sub-criteria, rainfall (0.24) followed by temperature (0.19) got high weight
values. The contribution of soil type was superior (0.10) over soil depth (0.08) from the soil
sub-criteria. Among the main soil characteristics, physical (0.25) followed by chemical (0.05)
got higher values.

After the pairwise comparison matrices were calculated, the weight module was used to
calculate the consistency ratio and develop the best-fit weights. Furthermore, one of the major
properties of the analytic hierarchy process is that it finds and calculates the inconsistencies of
decision-makers. The consistency relationship is used to estimate the efficiency criteria of the
analytic hierarchy method. The consistency ratio was calculated and the result was 0.09, which
was accepted for weighting the criteria to analyze the land suitability of rice in the study area.

Maximum eigenvector = 8.96, n = 8, CI= 0.13, CR= 0.09 which is less than 0.1 (acceptable).




                                               55


## Page 67

The percentage influence of rainfall was allocated as 24% of the total layers of the study area
maps, which was the highest weight. This is because rainfall is the most limiting criterion in
the identification of potential areas for rice crop cultivation. The temperature was assigned a
percentage influence of 19%. It was the second limiting factor in the identification of land
suitability analysis for rice cultivation. The land uses land cover and slope were assigned 15%
and 12% percentage influence respectively.

4.3 Suitability Model Used
A land suitability model was established using GIS capabilities and modeling functions. The
spatial geo-environmental characteristics (soil, climate, topography, and land use) were
combined into the GIS environment as information layers and overlaid to produce an overall
land suitability analysis for rice crops.

Using a model builder from ArcGIS toolbox, a suitability assessment model was designed and
used for processing the suitability map. The model that produced the preliminary suitability
analysis map is shown in Figure 4.12.




                                             56


## Page 68

Figure 4. 12 The suitability analysis model used

4.4 Weighted Overlay Analysis
After reclassifying each criterion to a common suitable class and assigning criterion weights to
each factor were added to the weighted overlay tool. The factors were rated from 1 to 4 (highly
suitable to unsuitable) to their suitability class range in the ranking system. The final appropriate
land or suitability map of rice in the study area was established. The map of potential land
suitable for rice was further analyzed and queried.




                                               57


## Page 69

The values which were obtained from the weighted overlay analysis results categorized into
four suitability classes. These were highly suitable, moderately suitable, less suitable, and
unsuitable for suitable rice crop cultivation areas of the district (as shown in Figure 4.12 below).
According to GIS-based MCE methods of the total study area, 728.5km² (65.9%) was highly
suitable, 235.9km² (21.4%) was moderately suitable, 57.4km² (5.2%) was less suitable, and the
remaining spatial extent which covers 82.7km²(7.5%) was unsuitable for rice crop cultivation.

Table 4. 12: Potential lands of the study area for rice cultivation

 No.      Suitability class                 Value            Area (km²)       Area coverage (% )


 1        Highly suitable                   1                728.5            65.9

 2        Moderately suitable               2                235.9            21.4

 3        Less suitable                     3                57.4             5.2

 4        Unsuitable                        4                82.7             7.5

                                                     Total   1104.5           100




                                                58


## Page 70

Figure 4. 13 Potential area map for rice crop suitability in Fogera Woreda

The suitability map for rice crop, identified by weighted overlay using Spatial Analyst tools in
ArcGIS Pro, was visualized in Figure 4.13. As can be seen from Table 4.12 (above) highly
suitable land covers an area of 728.5 km² (65.9%) of the total land. Thus, we could say that a
significant part of the study area was highly suitable for rice cultivation.

The final map of the study area shows an enormous potential for rice cultivation. In Fogera
Woreda, the proportion of highly and moderately suitable areas for rice crop cultivation covers
approximately 87% of the total area. Highly suitable areas were characterized by: slope levels
0 - 4%, soil type Haplic xerosols, soil pH values from 5.6 to 7.4, soil depth levels greater than
100cm, soil texture class sandy clay, rainfall levels >1300mm and temperatures between 23 to
27°C. Therefore, economic levels of agricultural cultivation can be accomplished by
encouraging rice crops in highly and moderately suitable areas and practicing diversification of
less suitable areas to crops other than rice.


                                                59


## Page 71

From the result of the rice crop potential map in the study area, 728.5km² (65.9%) was highly
suitable. From highly suitable areas, 39.5% were found in Gazen Aridafofot kebele, Chalmana
mntura, Wej Arba Amba, Tihua Ena Kokit, and Zeneg kebeles.

Table 4. 13: Highly suitable area coverage of rice in Fogera kebeles

 No.    Kebele Name            Area (km²)          Area (% )            Geographically
                                                                        located

 1      Gazen Aridafofot       94.1                12.9                 southern

 2      Chalmana mntura        54.5                7.5                  southeastern

 3      Wej Arba Amba          50.6                6.9                  central

 4      Tihua Ena Kokit        43.5                5.9                  northwestern

 5      Zeneg                  43.3                5.9                  northeastern

                      Total    286 out of 728.5    39.3 out of 100


The results gained from the land suitability evaluation for rice crops, highly suitable areas were
dominated in the northeastern part of the study area. The southwestern part of the study area
was moderately suitable for rice crop cultivation. Along the southern and northern parts of the
Fogera Woreda, the land was less suitable for rice crops.

According to the Fogera Woreda Agriculture and Rural Development office report (2021),
380km² (38000 hectares) were covered by rice cultivation which is very low related to its
suitability sites. That is 728.5 km² highly suitable and 235.9 km² moderately suitable. The
potential area for rice cultivation was much larger than the current cultivated area.

4.5 Discussions
Differentiating from previous studies of the suitability of the Woreda for rice crop cultivation
(Belachew, 2022; Enawgaw, 2012; and Getachew, 2015), this study included a greater number
of sub-criteria. Furthermore, only one (Getachew, 2015) of the previous studies integrated AHP



                                              60


## Page 72

to rank and weigh the importance of the sub-criteria. In studies of the suitability of the Fogera
Woreda for rice crop cultivation, it is common to consider groups of climatological, soil
properties, and landform information criteria. However, this study included one group of
criteria, that is, current LULC conditions for rice. It should be noted that the criteria used in the
analysis of the suitability of the area depend on the focus of the research and the availability of
spatial data. For example, future studies may include cost-benefit, productivity, crop rate of
return, costs of land use changes, population benefits by the crop, or other economic sub-
criteria. However, the main problem lies in the lack of spatial data for the sub-criteria.

In terms of the development of rice cultivation in Fogera Woreda, my study result shows that
climate variables (43%), soil physical and chemical properties (30%), LULC (16%), and
topographic information (11%) factors play a major role in rice cultivation. However, for
Getachew (2015), soil physical and chemical properties parameters were the most important,
followed by climatological, and landform information. In contrast, although Getachew (2015)
did not analyze LULC conditions. The number and the different sub-criteria used by each group
of criteria, the local reality, and the experience of the experts, contributed to differentiating the
importance of the criteria. Of course, in my study, the slightly greater importance of the socio-
economic criteria was not analyzed because of the current security situation of the Region
particularly the study area

In relation to climatological sub-criteria, the average annual rainfall (24%) is the highest,
followed by temperature (19%); similarly, Belachew (2022), the rainfall is the most important
climatological sub-criterion; for their part, Enawgaw (2012), states that precipitation is the most
important. Rice crops are highly sensitive to climate, especially to the rainfall at which they are
growing (Enawgaw, 2012 and Getachew, 2015). Additionally, in this type of study, the
suitability models are generated under current environmental conditions and must be constantly
updated, since climate change is a factor that influences the patterns of climatological sub-
criteria (Getachew,2015). This is important for the agricultural sector in Ethiopian highlands
particularly in Fogera Plain because it is one of the most affected by climate change.




                                                61


## Page 73

CHAPTER FIVE

             CONCLUSIONS AND RECOMMENDATIONS
5.1 Conclusions
This study primarily focused on identifying a suitable site for rice cultivation in the district of
Fogera. The parameters used for this suitability analysis were topography (slope), climate
(temperature and rainfall), soil (type, texture, depth, and pH value), and LULC. The GIS-based
MCE methods have been used to examine and verify the circumstances that favor the cultivation
of rice crops in the Fogera Woreda.

Land suitability assessments were performed using the AHP method by assigning different
weights to all parameters and then suitability maps were generated. In this model, all required
criteria work together and according to their suitability ratios, highly, moderately, less suitable,
and unsuitable areas were identified for rice cultivation. The findings show that the study area
has a huge potential for rice cultivation.

The results have shown that 65.9%, 21.4%, 5.2%, and 7.5% of the total study area was highly,
moderately, less suitable, and unsuitable for rice cultivation respectively. Hence, the suitability
of land classification analysis results shows that more area of land was available which is
suitable for rice cultivation. The higher potential area was placed in the northern part and a
small amount in the western part of the study area. This is because most of the physical land
resource accessibility was suitable for rice crop cultivation. The study concluded that there was
a huge potential land in Fogera Woreda for rice cultivation.




                                               62


## Page 74

5.2 Recommendations
Land suitability analysis should be considered a necessity in any agricultural venture. Hence,
the Fogera Woreda Agriculture and Rural Development office and another agricultural research
organization should encourage this scientific approach to avoid loss-generating agricultural
activities. This is because farmers avoid unnecessary losses before engaging in any farming
activity.

According to the findings of this research work, potential areas for rice cultivation were fairly
distributed across the Woreda. So, it should be encouraged in the Fogera Woreda to produce
rice highly and generate export revenues.

Land suitability for rice crops was analyzed using GIS-based MCE approaches such as soil,
topography, climate, and LULC data. It is a benchmark for the future, further studies should be
conducted by researchers. Such suitability analysis method guides land use planning, resource
management, and sustainable food cultivation. Decision-makers can use these findings to
allocate land effectively and enhance rice productivity.




                                              63


## Page 75

References
Abera, A. A., Tadesse, E. E., Abera, B. B., & Satheesh, N. (2021). Effect of rice variety and
    location on nutritional composition, physicochemical, cooking and functional properties
    of newly released upland rice varieties in Ethiopia. Cogent Food and Agriculture, 7(1).
    https://doi.org/10.1080/23311932.2021.1945281

Adamu, S., Abiola, Y., & Omolola, M. (2012). Evaluation of complementary use of organic
    and inorganic fertilizers on the performance of upland rice. International Journal Of
    Advanced Biological Research, 2(3).

Agidew, A. A. (2015). Land Suitability Evaluation for Sorghum and Barley Crops in South
    Wollo Zone of Ethiopia. Journal of Economics and Sustainable Development
    Www.Iiste.Org ISSN, 6(1).

Akpan, U., & Morimoto, R. (2022). An application of Multi-Attribute Utility Theory (MAUT)
    to the prioritization of rural roads to improve rural accessibility in Nigeria. Socio-
    Economic Planning Sciences, 82. https://doi.org/10.1016/j.seps.2022.101256

Almgard, G. (1963). The high content of iron in teff, Eragrostis abyssinica Link., and some
    other crop species from Ethiopia result in contamination. Lantbrukshogsk Ann, 29.

AL-Taani, A., Al-husban, Y., & Farhan, I. (2021). Land suitability evaluation for agricultural
    use using GIS and remote sensing techniques: The case study of Ma’an Governorate,
    Jordan.   Egyptian    Journal   of    Remote   Sensing    and   Space    Science,   24(1).
    https://doi.org/10.1016/j.ejrs.2020.01.001

Anusha, B. N., Babu, K. R., Kumar, B. P., Sree, P. P., Veeraswamy, G., Swarnapriya, C., &
    Rajasekhar, M. (2023). Integrated studies for land suitability analysis towards sustainable
    agricultural development in semi-arid regions of AP, India. Geosystems and
    Geoenvironment, 2(2). https://doi.org/10.1016/j.geogeo.2022.100131

Asebu M. (2021). Assessment of Honey Bee Production Systems and Major Honey Bee Pests
    and Predators at Ankober District Of North Shoa Zone, Amhara Region, Ethiopia.
    Frontiers in Neuroscience, 14(1).



                                            64


## Page 76

Asmare, B., & Yayeh, Z. (2018). Determinants of rice by-products utilization as feed and their
     management in Ethiopia: the case of Fogera District. Asian Journal of Agriculture, 2(01).
     https://doi.org/10.13057/asianjagric/g020101

Ayanaw, H. (2023). Rice Production Status and Irrigated Rice in Ethiopia, a Review.
     Agriculture, Forestry, and Fisheries. https://doi.org/10.11648/j.aff.20231204.11

Ayehu, G. T., & Besufekad, S. A. (2015). Rain-fed rice, Land suitability, AHP, MCDM, GIS;
     Rain-fed rice, Land suitability, AHP, MCDM, GIS. American Journal of Geographic
     Information System, 2015(3).

Bahaj, A. B. S., Mahdy, M., Alghamdi, A. S., & Richards, D. J. (2020). A new approach to
     determine the Importance Index for developing offshore wind energy potential sites:
     Supported by UK and Arabian Peninsula case studies. Renewable Energy, 152.
     https://doi.org/10.1016/j.renene.2019.12.070

Belayneh, T., & Tekle, J. (2017). Review on adoption, trend, potential, and constraints of rice
     production to livelihood in Ethiopia. International Journal of Research -Granthaalayah,
     5(6). https://doi.org/10.29121/granthaalayah.v5.i6.2017.2097

Berhe, D. H., Gidey, T., Gebregziabher, D., Tesema, T., Anjulo, A., Retta, A. N., Sisay, A., &
     Okolo, C. C. (2024). Seedling survival and plantation success in the drylands of Northern
     Ethiopia. Discover Agriculture, 2(1). https://doi.org/10.1007/s44279-024-00015-4

Beyene, A. M., Gashu, A. T., Tegegne, M. A., & Anteneh Mihertie, A. (2022). Is the
     longstanding local rice cultivar “X-Jigna” replaced by the improved variety “Shaga” in
     fogera    plain,    Northwest     Ethiopia?    Cogent   Economics    and   Finance,   10(1).
     https://doi.org/10.1080/23322039.2022.2145748

Boliko, M. C. (2019). FAO and the Situation of Food Security and Nutrition in the World.
     Journal    of      Nutritional   Science   and     Vitaminology,   65(Supplement),    S4–S8.
     https://doi.org/10.3177/jnsv.65.S4




                                                   65


## Page 77

Brennan, T. M., & Venigalla, M. (2016). A constructability assessment method (CAM) for
     sustainable     division     of      land        parcels.    Land       Use     Policy,     56.
     https://doi.org/10.1016/j.landusepol.2016.04.031

Cai, L., Wang, H., Liu, Y., Fan, D., & Li, X. (2022). Is potential cultivated land expanding or
     shrinking in the dryland of China? Spatiotemporal evaluation based on remote sensing and
     SVM. Land Use Policy, 112. https://doi.org/10.1016/j.landusepol.2021.105871

Camacho-Otero, J., Boks, C., & Pettersen, I. N. (2018). Consumption in the circular economy:
     A        literature        review.          Sustainability          (Switzerland),        10(8).
     https://doi.org/10.3390/su10082758

Chaemiso, S. E., Kartha, S. A., & Pingale, S. M. (2021). Effect of land use/land cover changes
     on surface water availability in the Omo-Gibe basin, Ethiopia. Hydrological Sciences
     Journal, 66(13). https://doi.org/10.1080/02626667.2021.1963442

Chen, Y., Yu, J., & Khan, S. (2010). Spatial sensitivity analysis of multi-criteria weights in
     GIS-based land suitability evaluation. Environmental Modelling and Software, 25(12).
     https://doi.org/10.1016/j.envsoft.2010.06.001

Dessie, G., & Mulat, G. (2019). Performance of garlic cultivars under rain-fed cultivation
     practice at South Gondar Zone, Ethiopia. African Journal of Agricultural Research, 14(5).
     https://doi.org/10.5897/ajar2018.13757

Desta, M. A., Zeleke, G., Payne, W. A., Shenkoru, T., & Dile, Y. (2019). The impacts of rice
     cultivation on an indigenous Fogera cattle population at the eastern shore of Lake Tana,
     Ethiopia. Ecological Processes, 8(1). https://doi.org/10.1186/s13717-019-0167-7

Djagba, J. F., Kouyaté, A. M., Baggie, I., & Zwart, S. J. (2019). A geospatial dataset of inland
     valleys in four zones in Benin, Sierra Leone, and Mali. Data in Brief, 23.
     https://doi.org/10.1016/j.dib.2019.103699

Elaalem, M., Comber, A., & Fisher, P. (2011). A Comparison of Fuzzy AHP and Ideal Point
     Methods for Evaluating Land Suitability. Transactions in GIS, 15(3), 329–346.
     https://doi.org/10.1111/j.1467-9671.2011.01260.x


                                                 66


## Page 78

ESRI. (2023). How Topo to Raster works. ArcGIS Pro.

FAO. (2015). Food wastage footprint & Climate Change. Fao, 1.

Feizizadeh, B., & Blaschke, T. (2013). Land suitability analysis for Tabriz County, Iran: A
     multi-criteria evaluation approach using GIS. Journal of Environmental Planning and
     Management, 56(1). https://doi.org/10.1080/09640568.2011.646964

Ferretti, V. (2011). Integrating Multicriteria Analysis and Geographic Information Systems: a
     survey and classification of the literature. 74th Meeting of the European Working Group
     “Multiple Criteria Decision Aiding.”

Fritz, S., See, L., & Rembold, F. (2010). Comparison of global and regional land cover maps
     with statistical information for the agricultural domain in Africa. International Journal of
     Remote Sensing, 31(9). https://doi.org/10.1080/01431160902946598

Gebre, S. L., Cattrysse, D., Alemayehu, E., & Van Orshoven, J. (2021). Multi-criteria decision-
     making methods to address rural land allocation problems: A systematic review. In
     International   Soil   and   Water     Conservation    Research     (Vol.   9,   Issue   4).
     https://doi.org/10.1016/j.iswcr.2021.04.005

Getachew Tesfaye Ayehu, S. A. (2015). Land Suitability Analysis for Rice Production: A GIS-
     Based Multi-Criteria Decision Approach. American Journal of Geographic Information
     System, 4(3). https://doi.org/10.5923/j.ajgis.20150403.02

Hagos, A., & Zemedu, L. (2015). Determinants of Improved Rice Varieties Adoption in Fogera
     District of Ethiopia. Science, Technology and Arts Research Journal, 4(1).
     https://doi.org/10.4314/star.v4i1.35

Hashim, N., Ali, M. M., Mahadi, M. R., Abdullah, A. F., Wayayok, A., Mohd Kassim, M. S.,
     & Jamaluddin, A. (2024). Smart Farming for Sustainable Rice Production: An Insight into
     Application, Challenge, and Future Prospect. In Rice Science (Vol. 31, Issue 1).
     https://doi.org/10.1016/j.rsci.2023.08.004




                                              67


## Page 79

Hirunkul, B., Suwanwerakamtorn, R., & Mongkolsawat, C. (2003). Agricultural Land Use
     Planning with GIS-based Land Suitability for Crop Combination. Computer.

Jafari, S., & Zaredar, N. (2010). Land Suitability Analysis using Multi-Attribute Decision
     Making Approach. International Journal of Environmental Science and Development.
     https://doi.org/10.7763/ijesd.2010.v1.85

Joseph, M., Moonsammy, S., Davis, H., Warner, D., Adams, A., & Timothy Oyedotun, T. D.
     (2023). Modeling climate variabilities and global rice production: A panel regression and
     time series analysis. Heliyon, 9(4). https://doi.org/10.1016/j.heliyon.2023.e15480

Jun-Ichi, S. (2022). The prospect of rice development in Africa. 農学国際協力.

Kalfas, D., Kalogiannidis, S., Chatzitheodoridis, F., & Toska, E. (2023). Urbanization and Land
     Use Planning for Achieving the Sustainable Development Goals (SDGs): A Case Study of
     Greece. Urban Science, 7(2). https://doi.org/10.3390/urbansci7020043

Keson, J., Silalertruksa, T., & Gheewala, S. H. (2023). Land suitability class and implications
     to Land-Water-Food Nexus: A case of rice cultivation in Thailand. Energy Nexus, 10.
     https://doi.org/10.1016/j.nexus.2023.100205

Kihoro, J., Bosco, N. J., & Murage, H. (2013). Suitability analysis for rice growing sites using
     a multicriteria evaluation and GIS approach in great Mwea region, Kenya. SpringerPlus,
     2(1). https://doi.org/10.1186/2193-1801-2-265

Kongolo, M. &, & Dlamini, D. K. (2012). Small-Scale Livestock Farming in Developing Areas
     of Swaziland and South Africa. An International Journal of Science and Technology Bahir
     DarOnline) AFRREV STECH, 11(13).

Kozlowski, J. (1993). Ultimate environmental threshold: An alternative tool for planning
     sustainable         development.           Sustainable         Development,           1(1).
     https://doi.org/10.1002/sd.3460010110




                                             68


## Page 80

Labella, Á., & Martínez, L. (2020). Flintstones 2.0 is an open and comprehensive fuzzy tool for
     multi-criteria decision analysis. Advances in Intelligent Systems and Computing, 1029.
     https://doi.org/10.1007/978-3-030-23756-1_91

Lindfors, A. (2021). Assessing sustainability with multi-criteria methods: A methodologically
     focused literature review. In Environmental and Sustainability Indicators (Vol. 12).
     https://doi.org/10.1016/j.indic.2021.100149

Malczewski, J. (2006). Integrating multicriteria analysis and geographic information systems:
     The ordered weighted averaging (OWA) approach. International Journal of
     Environmental            Technology              and       Management,            6(1–2).
     https://doi.org/10.1504/ijetm.2006.008251

Mao, X., Deng, Y., Zhu, L., & Yao, Y. (2020). Hierarchical geographic object-based vegetation
     type extraction based on multi-source remote sensing data. Forests, 11(12).
     https://doi.org/10.3390/f11121271

Mendas, A., & Delali, A. (2012). Integration of MultiCriteria Decision Analysis in GIS to
     develop land suitability for agriculture: Application to durum wheat cultivation in the
     region of Mleta in Algeria. Computers and Electronics in Agriculture, 83.
     https://doi.org/10.1016/j.compag.2012.02.003

Migongo-Bake, C., Catacutan, D., & Namirembe, S. (2012). Assessment of the headwaters of
     the Blue Nile in Ethiopia. ICRAF Working Paper - World Agroforestry Centre, 149.

Moat, et al. 2017. (2017). Coffee Farming and Climate Change in Ethiopia: Impacts, Forecasts,
     Resilience and Opportunities. - Summary. Royal Botanic Gardens, Kew (UK).

Mohamad Noor, N. H., Ng, B. K., & Abdul Hamid, M. J. (2021). Tapping the Potential of Rice
     Research for Sustainable Agricultural Development: Lessons from Malaysia’s Public
     Research Institutions. International Journal of Interdisciplinary and Strategic Studies,
     2(1). https://doi.org/10.47548/ijistra.2021.29




                                              69


## Page 81

Mohidem, N. A., Hashim, N., Shamsudin, R., & Man, H. C. (2022). Rice for Food Security:
     Revisiting Its Production, Diversity, Rice Milling Process and Nutrient Content. In
     Agriculture (Switzerland) (Vol. 12, Issue 6). https://doi.org/10.3390/agriculture12060741

Moisa, M. B., Tiye, F. S., Dejene, I. N., & Gemeda, D. O. (2022). Land suitability analysis for
     maize production using geospatial technologies in the Didessa watershed, Ethiopia.
     Artificial Intelligence in Agriculture, 6. https://doi.org/10.1016/j.aiia.2022.02.001

Mulugeta, G. (2014). Vegetation Dynamics of Area Enclosure Practices: A Case of Gonder
     Zuria District, Amhara Region, Ethiopia. Journal of Natural Sciences Research Www,
     4(7).

Muzira, N. M., Mushore, T. D., Wuta, M., Mutasa, C., & Mashonjowa, E. (2021). Land
     suitability analysis of Zimbabwe for the production of sorghum (Sorghum -bicolor) and
     maize (Zea mays) using a Remote Sensing and GIS-based approach. Remote Sensing
     Applications: Society and Environment, 23. https://doi.org/10.1016/j.rsase.2021.100553

Ndue, K., Baylie, M. M., & Goda, P. (2023). Determinants of Rural Households’ Intensity of
     Flood Adaptation in the Fogera Rice Plain, Ethiopia: Evidence from Generalised Poisson
     Regression. Sustainability (Switzerland), 15(14). https://doi.org/10.3390/su151411025

Nisar Ahamed, T. R., Gopal Rao, K., & Murthy, J. S. R. (2000). GIS-based fuzzy membership
     model     for    crop-land    suitability        analysis.   Agricultural   Systems,    63(2).
     https://doi.org/10.1016/S0308-521X(99)00036-0

Omoyajowo, K., Danjin, M., Omoyajowo, K., Odipe, O., Mwadi, B., May, A., Amos Ogunyebi,
     & Rabie, M. (2023). Exploring the interplay of environmental conservation within
     spirituality and multicultural perspective: insights from a cross-sectional study.
     Environment, Development and Sustainability. https://doi.org/10.1007/s10668-023-
     03319-5

Rinner, C., & Voss, S. (2013). MCDA for ArcMap – An Open-Source Multi-Criteria Decision
     Analysis and Geovisualization Tool for ArcGIS 10. Cartouche, 86.




                                                 70


## Page 82

Saaty, R. W. (1987). The analytic hierarchy process-what it is and how it is used. Mathematical
     Modelling, 9(3–5). https://doi.org/10.1016/0270-0255(87)90473-8

Sanogo, K., Touré, I., Arinloye, D. D. A. A., Dossou-Yovo, E. R., & Bayala, J. (2023). Factors
     affecting the adoption of climate-smart agriculture technologies in rice farming systems in
     Mali,        West       Africa.      Smart        Agricultural       Technology,         5.
     https://doi.org/10.1016/j.atech.2023.100283

Seftin Fitri Ana Wati, Fitri, A. S. F., Dhian Satria Yuda Kartika, Anita Wulansari, Eristya Maya
     Safitri, & Agussalim. (2022). GIS Land Suitability to Increasing Agricultural Production
     for the Agriculture Supply Chain: A Systematic Literature Review. IJCONSIST
     JOURNALS, 3(2). https://doi.org/10.33005/ijconsist.v3i2.67

Setyowati, D. L. (2021). Assessment of Watershed Carrying Capacity and Land Use Change
     on   Flood    Vulnerability Areas     in    Semarang City.     Forum    Geografi,   35(2).
     https://doi.org/10.23917/forgeo.v35i2.15542

Shitu, K., Hymiro, A., Degu, T., & Mekuriaw, M. (2023). Spatial Interpolations of Annual
     Rainfall in Ethiopia Using Simple and Universal Kriging Techniques. Hydrospatial
     Analysis, 7(1). https://doi.org/10.21523/gcj3.2023070102

Sikuku, P., Kimani, J., Kamau, J., & Njinju, S. (2015). Evaluation of Different Improved
     Upland Rice Varieties for Low Soil Nitrogen Adaptability. International Journal of Plant
     & Soil Science, 5(1). https://doi.org/10.9734/ijpss/2015/13637

Singh, T., Singh, P., & Singh, A. (2021). Silicon significance in crop production: Special
     consideration    to   rice:   An     overview.    The     Pharma     Innovation,    10(3).
     https://doi.org/10.22271/tpi.2021.v10.i3d.5776

Singha, C., & Swain, K. C. (2016). Land suitability evaluation criteria for agricultural crop
     selection: A review. Agricultural Reviews, 37(2). https://doi.org/10.18805/ar.v37i2.10737

Song, L., Estes, A. B., & Estes, L. D. (2023). A super-ensemble approach to map land cover
     types with high resolution over data-sparse African savanna landscapes. International




                                                71


## Page 83

Journal     of     Applied     Earth      Observation       and    Geoinformation,    116.
    https://doi.org/10.1016/j.jag.2022.103152

Takele, A. (2010). Analysis of rice profitability and marketing chain: The case of Fogera
    Woreda, South Gondar Zone, Amhara National Regional State, Ethiopia (Doctoral
    dissertation, Haramaya University).

Taiwo, O. (2022). GIS-MCE-based suitability analysis for sustainable estate development in
    Ede North LGA Osun State, Nigeria. Journal of Geoinformatics & Environmental
    Research, 3(02). https://doi.org/10.38094/jgier30241

Takagi, T., Takadama, K., & Sato, H. (2023). Directional Pareto Front and Its Estimation to
    Encourage         Multi-Objective        Decision-Making.         IEEE     Access,     11.
    https://doi.org/10.1109/ACCESS.2023.3250238

Tarekegn, K., & Fiseha, D. (2016). Dairy Production and Marketing Systems in Kaffa and
    Sheka Zones, Southern Ethiopia. Journal of Marketing and Consumer Research Journal,
    27.

Tilahun, A., Teklu, B., & Hoag, D. (2017). Erratum to: Challenges and contributions of crop
    production in agro-pastoral systems of Borana Plateau, Ethiopia (Pastoralism: Research,
    Policy and Practice, 10.1186/s13570-016-0074-9). In Pastoralism (Vol. 7, Issue 1).
    https://doi.org/10.1186/s13570-017-0088-y

Tilahun, M., Tena, W., & Desta, B. (2021). Effects of Different Nitrogen and Sulfur Fertilizer
    Rates on Growth, Yield, Quality and Nutrient Uptake of Onion (Allium cepa L.) at Shewa
    Robit,    North    Shewa,    Ethiopia.    The   Open    Biotechnology     Journal,   15(1).
    https://doi.org/10.2174/1874070702115010059

Topuz, M., & Deniz, M. (2023). Application of GIS and AHP for land use suitability analysis:
    the case of Demirci district (Turkey). Humanities and Social Sciences Communications,
    10(1). https://doi.org/10.1057/s41599-023-01609-x

Vetterlein, A. (2012). Seeing Like the World Bank on Poverty. New Political Economy, 17(1).
    https://doi.org/10.1080/13563467.2011.569023


                                              72


## Page 84

Xiao, J., Song, Y., & You, H. (2020). Explaining peasants’ intention and behavior of farmland
    trusteeship in China: Implications for sustainable agricultural production. Sustainability
    (Switzerland), 12(14). https://doi.org/10.3390/su12145748

Xu, J., Jiao, C., Zheng, D., & Li, L. (2024). Agricultural Land Suitability Assessment at the
    County      Scale    in    Taiyuan,    China.     Agriculture    (Switzerland),    14(1).
    https://doi.org/10.3390/agriculture14010016

Xue, B., Zhao, B., & Li, J. (2023). Evaluation and enhancement methods of POI data quality in
    the context of geographic big data. Dili Xuebao/Acta Geographica Sinica, 78(5).
    https://doi.org/10.11821/dlxb202305014

Zenna, N., & Berhe, T. (2009). Cold tolerant rice evaluation in Ethiopian highlands. African
    Crop Science Conference, 9.




                                            73


## Page 85

Appendices
Appendix A: LULC accuracy assessment result (confusion matrices table)

                                           Reference data

 Land      cover Agricultural   Forest    Water    Settle   Grass   Total     User’s         Kappa
 classes          land          land      body     ment     land              accuracy(%) coefficient

 Agricultural     11            0         0        1        1       13        84.60
 land

 Forest land      0             8         1        0        1       10        80.30
                                                                                             0.882
 Waterbody        0             0         2        0        0       2         100.00

 Settlement       0             0         0        3        1       4         85.00

 Grassland        1             0         1        0        4       6         86.70

 Total            12            8         5        4        7       35

 Producer’s       91.67         100.0     90.08    88.30    92.00   Overall     classification   accuracy
 accuracy (%)                                                       90.5%




                                              74


## Page 86

Appendix B: Consistency ratio computing using the AHP extension tool (add-on ArcGIS)




                                         75


## Page 87

Appendix C: Calculating the highest Eigen Value




                                         76
