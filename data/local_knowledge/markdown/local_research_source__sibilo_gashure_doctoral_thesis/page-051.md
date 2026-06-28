# Sibilo Gashure - Doctoral Thesis.pdf - page 51

Source ID: `local_research_source:sibilo_gashure_doctoral_thesis`
Page: 51
Extraction quality: text_extracted

```text
satellite-gauge station data. Therefore, this study examines the spatiotemporal rainfall and
temperature variability and trends using merged satellite-gauge station data in Konso and
maps meteorological droughts using a standardized precipitation index.

4.2. Materials and methods
4.2.1. Data preparation and quality control
To validate the dataset, the strength of the relationship between gridded and
meteorological station data was examined using Pearson correlation coefficients (r). The
mean rainfall and temperature data from gridded and meteorological stations have strong
positive correlations of r = 0.70 and r = 0.76, respectively. The prime source of the grid
data information was done by Dinku et al. (2018). In Ethiopia, Dinku et al. (2018) found
that the correlation coefficients between monthly meteorological station rainfall data and
gridded data such as ARC2, TAMSAT3, CHIRP, and CHIRPS were 0.86, 0.91, 0.92, and
0.93, respectively. Before analysis, monthly rainfall and temperature data were
aggregated, and seasonal and annual means were generated. Serial autocorrelation was
calculated by the autocorrelation function (acf) using the (modifiedmk) package of R
version 3.5.3 software. The lag-1 autocorrelation coefficient was calculated to remove the
autoregressive component from the detrended series. When the autocorrelation
coefficient of lag-1 was significant, the autocorrelation component was removed from the
series using prewhitening by Eq. (1) and the MK (Eq. 5 to 8) test; otherwise, the original
data series was used with the following formula:

Y1  Yt  r1Yt -1                                                                          1

where Y1 is a series without an autoregressive part, Yt is the detrended series, and r1 is the
lag-1 autocorrelation coefficient.

4.2.2. Data analysis
2.2.1. Variability analysis

The coefficient of variation was used to calculate rainfall variability. A CV is specified
as:



                                             36
```
