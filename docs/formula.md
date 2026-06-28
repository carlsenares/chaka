# Scoring Formula

This document describes the current Chaka pre-feasibility scoring formula. It is
the retrieval-friendly reference for frontend, reasoning, and presentation work.

## Scope

The score ranks candidate restoration polygons by expected natural-restoration
priority. It is not measured carbon accounting, a verified biodiversity-impact
estimate, or an investment decision by itself.

The score is designed around the AI for Good challenge dimensions:

- carbon storage / carbon capture potential;
- biodiversity improvement;
- human livelihood;
- water and soil resilience as restoration-support criteria;
- feasibility and safeguard risk.

## Current Weights

```text
base_priority_score =
  carbon_score       * 0.425
+ biodiversity_score * 0.225
+ water_soil_score   * 0.150
+ livelihood_score   * 0.150
+ feasibility_score  * 0.050
+ land_cover_adjustment

priority_score =
  base_priority_score * feasibility_gate_multiplier
```

Carbon is weighted at 42.5% because the MVP now has stronger carbon evidence:
ESA CCI Biomass above-ground biomass and uncertainty, plus the existing
vegetation, forest-change, soil, and rainfall layers. Biodiversity is weighted
at 22.5% for now because the current biodiversity layer is still mostly habitat
and proxy based. Biodiversity should be reweighted upward when KBA, IUCN,
field-survey, or stronger biodiversity-condition layers are available.

Feasibility remains only 5% as a positive benefit because it should not dominate
ecological opportunity. However, feasibility also gates the final score. This is
intentional: poor feasibility should prevent a site from ranking highly, even if
carbon or biodiversity signals are strong.

## Carbon Score

Carbon is split into three sub-signals:

```text
carbon_score =
  restoration_opportunity_score * 0.65
+ carbon_stock_score            * 0.25
+ carbon_stock_confidence_score * 0.10
```

If ESA CCI Biomass is missing, carbon falls back to restoration opportunity
only.

### Restoration Opportunity

This estimates where restoration could plausibly add carbon. It does not
estimate tons of CO2e.

```text
carbon_opportunity_raw =
  average(
    vegetation_opportunity,
    forest_loss_score,
    soil_organic_carbon_score,
    carbon_land_cover_fit
  )

restoration_opportunity_score =
  carbon_opportunity_raw * rainfall_feasibility_multiplier
```

Rainfall is not averaged directly into carbon. It only acts as an establishment
feasibility multiplier, because low rainfall can make vegetation carbon gains
less plausible.

```text
rainfall_feasibility_multiplier:
  rainfall <= 40: 0.65
  rainfall 40-70: scales from 0.65 to 0.90
  rainfall 70-100: scales from 0.90 to 1.00
```

### Carbon Stock Context

This estimates current above-ground biomass context from ESA CCI Biomass v7.0.
It helps separate sites with high existing carbon/protection value from sites
that only look good by restoration-opportunity proxies.

```text
carbon_stock_score =
  normalized(ESA_CCI_AGB_mean_Mg_ha, 0-160 Mg/ha)
  * uncertainty_multiplier

uncertainty_multiplier =
  clamp(1 - ESA_CCI_AGB_relative_uncertainty * 0.35, 0.65, 0.95)
```

Interpretation:

- high `carbon_stock_score` means stronger existing above-ground biomass
  context;
- it does not mean verified project carbon;
- it should not be converted to carbon credits without field measurement,
  methodology, baseline, additionality, permanence, and leakage checks.

### Carbon Stock Confidence

This rewards lower uncertainty in the ESA CCI Biomass signal.

```text
carbon_stock_confidence_score =
  100 - ESA_CCI_AGB_relative_uncertainty * 60
```

If uncertainty is missing, the score uses a cautious fallback.

## Biodiversity Score

Biodiversity is still mostly a habitat and restoration-uplift proxy.

```text
biodiversity_score =
  habitat_base        * 0.55
+ restoration_uplift  * 0.35
+ observation_context * 0.10
- pressure_penalty
```

Habitat base comes from land-cover structure:

```text
tree cover, grassland, cropland mosaic, other natural cover = positive
built-up and water-dominant areas = negative or lower habitat fit
```

Restoration uplift combines:

```text
forest_loss_score
vegetation_opportunity
```

Observation context can use GBIF only when there are enough local records. Sparse
or zero GBIF records are not negative evidence.

Pressure penalty includes:

```text
built-up fraction
very high settlement proximity score
high safeguard risk score
```

Interpretation:

- high biodiversity score means stronger habitat/restoration-improvement
  potential under current proxies;
- it does not mean verified species richness;
- it does not replace protected-area, KBA, IUCN, eBird, or field biodiversity
  surveys.

## Water And Soil Score

```text
water_soil_score =
  average(
    rainfall_reliability_score,
    100 - slope_risk_score,
    soil_organic_carbon_score,
    soil_ph_suitability_score
  )
```

This estimates whether the site has water/soil conditions that support durable
restoration. It is separate from carbon to avoid over-counting rainfall.

Known caveat: slope currently acts mostly as implementation and erosion risk.
Future versions should split slope into:

```text
erosion_restoration_need
slope_implementation_constraint
```

because steep areas can be high-value watershed-restoration targets while also
being harder to implement.

## Livelihood Score

```text
livelihood_score =
  average(
    population_pressure_score,
    road_access_score,
    settlement_proximity_score
  )
```

This estimates potential human relevance and implementation reach. It is not a
social license score and does not replace community consultation.

## Feasibility Score And Gate

```text
feasibility_score =
  average(
    road_access_score,
    100 - safeguard_risk_score,
    data_quality_score
  )
```

Feasibility has two roles:

1. It contributes 5% to the weighted score as a positive practical-readiness
   signal.
2. It gates the final priority score so very low-feasibility sites cannot rank
   highly on ecological signals alone.

```text
feasibility_gate_multiplier:
  feasibility <= 35: 0.55
  feasibility 35-55: scales from 0.55 to 0.80
  feasibility 55-75: scales from 0.80 to 1.00
  feasibility > 75: 1.00
```

This resolves the main logic issue with a low feasibility weight: feasibility is
not meant to dominate opportunity, but infeasibility must still suppress the
final score.

## Land-Cover Adjustment

Land cover applies a negative adjustment when a candidate is visibly unsuitable
for restoration screening:

```text
water >= 50%: -45
water >= 20%: -25
built_up >= 40%: -35
built_up >= 15%: -18
```

This adjustment catches obvious hard constraints before the feasibility gate is
applied.

## Role Of The LLM Layer

The LLM/reasoning layer must not invent scores. It should:

- explain score components using cited fields;
- distinguish restoration opportunity from existing carbon stock;
- flag weak evidence and missing sources;
- detect overclaiming, such as treating ESA CCI Biomass as verified project
  carbon;
- add local-research caveats from evidence cards;
- generate frontend text, field-validation questions, and investment briefs.

The numeric formula remains deterministic and auditable.
