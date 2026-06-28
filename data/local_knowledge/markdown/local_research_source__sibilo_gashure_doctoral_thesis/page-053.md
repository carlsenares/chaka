# Sibilo Gashure - Doctoral Thesis.pdf - page 53

Source ID: `local_research_source:sibilo_gashure_doctoral_thesis`
Page: 53
Extraction quality: text_extracted

```text
where xj and xk are the values of the data series and N is the length of the data set:

                    1 if X j  X k   0
sgn X j  X k    0 if X j  X k
                   
                                      0                                                         6
                    1 if X  X      0
                           j     k



The variance, Var(S) is computed as:

            n n - 12n  5
Var S                                                                                         7 
                    18

Then, the Z score is calculated as:

     S 1                        
                        if S  0
     Var S 1
                  2
                                  
Z  0                   if S  0                                                               8
     S 1               if S  0 
     Var S12                 
                                 

The magnitude of changes was analyzed for significant trends by estimating slope. Thus,
slope (β) is defined as:

      X j  Xk
β                                                                                               9
        j k

where Xj and Xk are data values at times j and k (j > k). The median of N values β is
represented as Sen's slope, which is computed as Q med   ( N 1) / 2 if N exists as odd and
taken as Q med  [ N / 2    N 2 / 2  ] if N appears as even. A positive value of Qmed indicates
a rising trend in the data series, while a negative value indicates a declining trend.

2.2.3. Spatial analysis
The ArcGIS 10.5 map algebra was used to combine multiple Networks Common Data
Form (NetCDF) raster files to spatially show the study period's seasonal and annual
average rainfall and temperature. We interpolated the gridded point rainfall and
temperature data using the ordinary kriging method given in Eq. (10) to create a
continuous surface. We wrote the model of Kriging as:

                                                 38
```
