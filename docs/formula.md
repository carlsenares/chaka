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
priority_score =
  carbon_score       * 0.35
+ biodiversity_score * 0.30
+ water_soil_score   * 0.15
+ livelihood_score   * 0.15
+ feasibility_score  * 0.05
+ land_cover_adjustment
```

The weights intentionally emphasize carbon and biodiversity. Water/soil remains
important, but is treated as restoration support rather than a separate dominant
objective.

## Carbon Score

Carbon score is a carbon-restoration-potential proxy. It does not estimate tons
of CO2e.

```text
carbon_opportunity =
  average(
    vegetation_opportunity,
    forest_loss_score,
    soil_organic_carbon_score,
    carbon_land_cover_fit
  )

carbon_score = carbon_opportunity * rainfall_feasibility_multiplier
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

Interpretation:

- high carbon score means stronger restoration-carbon potential;
- it does not mean measured existing carbon stock;
- it does not mean verified carbon-credit eligibility.

## Biodiversity Score

Biodiversity is a habitat and restoration-uplift proxy.

```text
biodiversity_score =
  habitat_base       * 0.55
+ restoration_uplift * 0.35
+ observation_context * 0.10
- pressure_penalty
```

Habitat base comes from land-cover structure:

```text
tree_cover, grassland, cropland mosaic, other natural cover = positive
built_up and water-dominant areas = negative or lower habitat fit
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
- it does not replace protected-area, KBA, IUCN, or field biodiversity surveys.

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

## Feasibility Score

```text
feasibility_score =
  average(
    road_access_score,
    100 - safeguard_risk_score,
    data_quality_score
  )
```

Feasibility is intentionally low-weighted because real feasibility depends on
field validation, tenure, governance, community interest, and implementation
capacity.

## Land-Cover Adjustment

Land cover can apply a negative adjustment when a candidate is visibly unsuitable
for restoration screening:

```text
water >= 50%: -45
water >= 20%: -25
built_up >= 40%: -35
built_up >= 15%: -18
```

## Role Of The LLM Layer

The LLM/reasoning layer must not invent scores. It should:

- explain score components using cited fields;
- flag weak evidence and missing sources;
- detect overclaiming, such as treating carbon potential as measured CO2e;
- add local-research caveats from evidence cards;
- generate frontend text, field-validation questions, and investment briefs.

The numeric formula remains deterministic and auditable.
