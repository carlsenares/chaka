# 2026_submission_frel_frl_eth_final.pdf - page 33

Source ID: `local_research_source:2026_submission_frel_frl_eth_final`
Page: 33
Extraction quality: text_extracted

```text
Table 3: Error matrix of Ethiopia’s forest cover change map 2013-2017
                                                                             Total    User's
                                                                                                  Commission
                                                                               #     Accuracy
  Error matrix                                                                                       error
                                                   Reference                points   of class i
 for the change
                       Classes
   map 2013 -
       2017
                                                 Stable
                                        Stable    non-    Forest   Forest
                                        Forest   forest   LOSS      GAIN                            100%
             1    Stable Forest           884     117         4        5    1010         88%            12%
             2    Stable non-forest        50    2080         0        0    2130         98%             2%
   map
             3    Forest loss              35      25       471        1     532         89%            11%
             4    Forest gain              37      58        10      423     528         80%            20%
                    Total # points       1006     2280      485      429     4200
                     Producer's
                                         88%      91%      97%      99%
                  Accuracy of class i
                   Omission Error        12%       9%       3%       1%
                  Overall Accuracy       92%

In the error matrix, the rows represent commission errors (over-
detections), where the map incorrectly assigns a sample to a given class.
For example, within the forest loss class, 532 samples were evaluated, of
which 61 were over-detected. Specifically, these commission errors
occurred when the map labeled samples as forest loss, while the reference
data indicated otherwise:
   •     1 sample was actually forest gain
   •     35 samples were stable forest
   •     25 samples were stable non-forest
Conversely, the columns capture omission errors (under-detections),
where the map fails to identify a sample as belonging to a class. For
instance, among 39 reference samples classified as forest loss, the map
missed 14, assigning them to other categories instead.
The subsequent step involves quantifying these biases (both over- and
under-detections) in terms of area (hectares) and applying corrections to
the mapped estimates. This process yields bias-adjusted area estimates
that more accurately reflect the true distribution of land cover change.




                                                                                                           33
```
