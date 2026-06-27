#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const featuresPath = path.join(root, "data/features/site_features.json");
const predictionsPath = path.join(root, "models/artifacts/site_predictions.json");
const reportPath = path.join(root, "models/reports/model_report.md");
const schemaPath = path.join(root, "models/schemas/feature_schema.json");
const modelVersion = "ranker_rule_based_v0.2";

const weights = {
  carbon: 0.35,
  biodiversity: 0.3,
  water_soil: 0.15,
  livelihood: 0.15,
  feasibility: 0.05,
};

function fail(message) {
  console.error(`rule-based-ranker: ${message}`);
  process.exit(1);
}

async function main() {
  const features = JSON.parse(await readFile(featuresPath, "utf8"));
  const predictions = features
    .map((feature) => buildPrediction(feature))
    .sort((a, b) => b.priority_score - a.priority_score)
    .map((prediction, index) => ({ ...prediction, rank: index + 1 }));

  await mkdir(path.dirname(predictionsPath), { recursive: true });
  await mkdir(path.dirname(reportPath), { recursive: true });
  await mkdir(path.dirname(schemaPath), { recursive: true });

  await writeFile(predictionsPath, `${JSON.stringify(predictions, null, 2)}\n`);
  await writeFile(reportPath, renderReport(predictions));
  await writeFile(schemaPath, `${JSON.stringify(renderSchema(), null, 2)}\n`);

  console.log(`Wrote ${path.relative(root, predictionsPath)}`);
  console.log(`Wrote ${path.relative(root, reportPath)}`);
  console.log(`Wrote ${path.relative(root, schemaPath)}`);
}

function buildPrediction(feature) {
  const carbonOpportunityScore = average([
    vegetationOpportunityScore(feature),
    feature.forest_loss_score,
    feature.soil_organic_carbon_score,
    carbonLandCoverFitScore(feature),
  ]);
  const carbonScore = clampScore(carbonOpportunityScore * rainfallFeasibilityMultiplier(feature.rainfall_reliability_score));

  const biodiversityScore = biodiversityBenefitScore(feature);

  const waterSoilScore = average([
    feature.rainfall_reliability_score,
    100 - feature.slope_risk_score,
    feature.soil_organic_carbon_score,
    feature.soil_ph_suitability_score,
  ]);

  const livelihoodScore = average([
    feature.population_pressure_score,
    feature.road_access_score,
    feature.settlement_proximity_score,
  ]);

  const feasibilityScore = average([
    feature.road_access_score,
    100 - feature.safeguard_risk_score,
    feature.data_quality_score,
  ]);

  const landCoverAdjustment = landCoverSuitabilityAdjustment(feature);
  const priorityScore = clampScore(
    carbonScore * weights.carbon +
      biodiversityScore * weights.biodiversity +
      waterSoilScore * weights.water_soil +
      livelihoodScore * weights.livelihood +
      feasibilityScore * weights.feasibility +
      landCoverAdjustment
  );

  return {
    site_id: feature.site_id,
    model_version: modelVersion,
    priority_score: priorityScore,
    carbon_potential: label(carbonScore),
    biodiversity_benefit: label(biodiversityScore),
    livelihood_benefit: label(livelihoodScore),
    water_soil_benefit: label(waterSoilScore),
    implementation_feasibility: label(feasibilityScore),
    risk_level: riskLabel(average([feature.safeguard_risk_score, feature.slope_risk_score])),
    recommended_intervention_seed: interventionFor(feature),
    top_feature_contributions: topContributions(feature, {
      carbonScore,
      carbonOpportunityScore,
      biodiversityScore,
      waterSoilScore,
      livelihoodScore,
      feasibilityScore,
      landCoverAdjustment,
    }),
    prediction_quality: "rule_based_fallback",
    scoring_note:
      "Rule-based MVP score from mixed source-derived and placeholder feature values. Treat as pre-feasibility screening, not final evidence.",
  };
}

function vegetationOpportunityScore(feature) {
  const lowCurrentVegetationOpportunity = (1 - feature.ndvi_current) * 100;
  const degradationSignal = Math.max(0, -feature.ndvi_trend_5y) * 1000;
  return clampScore((lowCurrentVegetationOpportunity + degradationSignal + feature.evi_current * 100) / 3);
}

function carbonLandCoverFitScore(feature) {
  const mix = feature.land_cover_mix;
  return clampScore(
    mix.tree_cover * 65 +
      mix.cropland * 55 +
      mix.grassland * 50 +
      mix.other * 35 -
      mix.built_up * 80 -
      mix.water * 80
  );
}

function rainfallFeasibilityMultiplier(rainfallReliabilityScore) {
  const score = Number(rainfallReliabilityScore);
  if (!Number.isFinite(score)) return 0.85;
  if (score <= 40) return 0.65;
  if (score <= 70) return 0.65 + ((score - 40) / 30) * 0.25;
  return Math.min(1, 0.9 + ((score - 70) / 30) * 0.1);
}

function biodiversityBenefitScore(feature) {
  const habitatBase = habitatBaseScore(feature);
  const restorationUplift = average([feature.forest_loss_score, vegetationOpportunityScore(feature)]);
  const observationContext = biodiversityObservationContextScore(feature);
  const pressurePenalty = biodiversityPressurePenalty(feature);

  if (observationContext === null) {
    return clampScore(habitatBase * 0.6 + restorationUplift * 0.4 - pressurePenalty);
  }

  return clampScore(habitatBase * 0.55 + restorationUplift * 0.35 + observationContext * 0.1 - pressurePenalty);
}

function habitatBaseScore(feature) {
  const mix = feature.land_cover_mix;
  return clampScore(
    mix.tree_cover * 85 +
      mix.grassland * 65 +
      mix.cropland * 40 +
      mix.other * 35 -
      mix.built_up * 90 -
      mix.water * 35
  );
}

function biodiversityObservationContextScore(feature) {
  const observations = feature.source_extracts?.biodiversity_observations;
  const occurrenceCount = Number(observations?.occurrence_count);
  const contextScore = Number(observations?.biodiversity_context_score);

  if (Number.isFinite(occurrenceCount) && occurrenceCount >= 10 && Number.isFinite(contextScore)) {
    return contextScore;
  }

  return null;
}

function biodiversityPressurePenalty(feature) {
  const builtUpPenalty = feature.land_cover_mix.built_up * 35;
  const settlementPenalty = Math.max(0, Number(feature.settlement_proximity_score ?? 0) - 75) * 0.2;
  const safeguardPenalty = Math.max(0, Number(feature.safeguard_risk_score ?? 0) - 45) * 0.15;
  return builtUpPenalty + settlementPenalty + safeguardPenalty;
}

function interventionFor(feature) {
  if (feature.land_cover_mix.water >= 0.35 || feature.land_cover_primary === "water_dominant") {
    return "field_validation_before_investment";
  }
  if (feature.land_cover_mix.built_up >= 0.25 || feature.land_cover_primary === "built_up_dominant") {
    return "field_validation_before_investment";
  }
  if (feature.safeguard_risk_score >= 45) return "field_validation_before_investment";
  if (feature.slope_risk_score >= 70) return "erosion_control_exclosures";
  if (feature.land_cover_primary.includes("forest")) return "assisted_natural_regeneration";
  if (feature.land_cover_primary.includes("cropland") || feature.population_pressure_score >= 70) {
    return "fmnr_agroforestry";
  }
  if (feature.rainfall_reliability_score >= 70 && feature.soil_organic_carbon_score >= 65) {
    return "native_tree_planting";
  }
  return "field_validation_before_investment";
}

function landCoverSuitabilityAdjustment(feature) {
  if (feature.land_cover_mix.water >= 0.5 || feature.land_cover_primary === "water_dominant") return -45;
  if (feature.land_cover_mix.water >= 0.2) return -25;
  if (feature.land_cover_mix.built_up >= 0.4 || feature.land_cover_primary === "built_up_dominant") return -35;
  if (feature.land_cover_mix.built_up >= 0.15) return -18;
  return 0;
}

function topContributions(feature, scores) {
  const contributions = [
    { feature: "carbon_potential_composite", direction: "positive", weight: weights.carbon, value: scores.carbonScore },
    {
      feature: "biodiversity_benefit_composite",
      direction: "positive",
      weight: weights.biodiversity,
      value: scores.biodiversityScore,
    },
    {
      feature: "water_soil_benefit_composite",
      direction: "positive",
      weight: weights.water_soil,
      value: scores.waterSoilScore,
    },
    {
      feature: "livelihood_benefit_composite",
      direction: "positive",
      weight: weights.livelihood,
      value: scores.livelihoodScore,
    },
    {
      feature: "forest_loss_score",
      direction: "positive",
      weight: 0.12,
      value: feature.forest_loss_score,
    },
    {
      feature: "rainfall_feasibility_multiplier",
      direction: "negative",
      weight: 0.08,
      value: (1 - rainfallFeasibilityMultiplier(feature.rainfall_reliability_score)) * 100,
    },
    {
      feature: "safeguard_risk_score",
      direction: "negative",
      weight: 0.08,
      value: feature.safeguard_risk_score,
    },
    {
      feature: "slope_risk_score",
      direction: "negative",
      weight: 0.06,
      value: feature.slope_risk_score,
    },
  ];

  if (scores.landCoverAdjustment < 0) {
    contributions.push({
      feature: "land_cover_suitability_adjustment",
      direction: "negative",
      weight: Math.abs(scores.landCoverAdjustment) / 100,
      value: Math.abs(scores.landCoverAdjustment),
    });
  }

  return contributions
    .sort((a, b) => contributionStrength(b) - contributionStrength(a))
    .slice(0, 3)
    .sort((a, b) => b.weight - a.weight)
    .map(({ feature, direction, weight }) => ({ feature, direction, weight }));
}

function contributionStrength(contribution) {
  const normalizedValue =
    contribution.direction === "negative" ? contribution.value / 100 : contribution.value / 100;
  return contribution.weight * normalizedValue;
}

function average(values) {
  return values.reduce((sum, value) => sum + Number(value), 0) / values.length;
}

function label(score) {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function riskLabel(score) {
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function renderReport(predictions) {
  const topRows = predictions
    .slice(0, 10)
    .map(
      (prediction) =>
        `| ${prediction.rank} | ${prediction.site_id} | ${prediction.priority_score} | ${prediction.carbon_potential} | ${prediction.biodiversity_benefit} | ${prediction.water_soil_benefit} | ${prediction.livelihood_benefit} | ${prediction.risk_level} | ${prediction.recommended_intervention_seed} |`
    )
    .join("\n");

  return `# Model Report

Generated by \`scripts/rule-based-ranker.mjs\`.

## Model Type

Transparent rule-based fallback. This is not a trained model.

## Prediction Quality

\`rule_based_fallback\`

The current model reads \`data/features/site_features.json\`, which currently contains mixed feature quality. Geometry/admin labels, ESA WorldCover land cover, Sentinel-2 current NDVI/EVI, SRTM terrain, GFW/UMD forest-change context, CHIRPS rainfall, SoilGrids soil, WorldPop population, partial OSM access, GHSL settlement context, WaPOR water/productivity context, nearby soil observations, and GBIF biodiversity observation context are source-derived where valid pixels, observations, or mapped features exist. Local research evidence cards are context-derived for caveats and implementation notes only. Remaining fields, especially vegetation trend and safeguards, are deterministic placeholders. The ranking is useful for frontend and reasoning-layer integration, but it must not be presented as fully source-derived evidence until the remaining feature groups are extracted from verified sources.

## Default Weights

| Factor | Weight |
| --- | ---: |
| Carbon potential | ${weights.carbon} |
| Biodiversity improvement | ${weights.biodiversity} |
| Water/soil resilience | ${weights.water_soil} |
| Livelihood benefit | ${weights.livelihood} |
| Feasibility/risk adjustment | ${weights.feasibility} |

## Formula Notes

The formula is documented in \`docs/formula.md\`. Rainfall no longer enters carbon as a direct averaged input. Instead, carbon opportunity is multiplied by a rainfall feasibility factor so dry sites are not over-promoted for tree-carbon restoration. Biodiversity is scored from habitat structure, restoration uplift, limited positive observation context, and pressure penalties.

ESA WorldCover land-cover extraction, Sentinel-2 current vegetation extraction, SRTM terrain extraction, GFW/UMD forest-change extraction, CHIRPS rainfall extraction, SoilGrids soil extraction, and WorldPop population extraction are currently source-derived where valid pixels exist. If a candidate is water-dominant, heavily built-up, very steep, or otherwise high-risk, the ranker applies the relevant feature penalties and recommends field validation before investment. This prevents strong values in other feature groups from over-ranking areas that are visibly or physically unsuitable from source evidence.

## Top Ranked Candidates

| Rank | Site ID | Priority | Carbon | Biodiversity | Water/soil | Livelihood | Risk | Intervention seed |
| ---: | --- | ---: | --- | --- | --- | --- | --- | --- |
${topRows}

## Limitation Statement

This model is a pre-feasibility ranking prototype. Labels are not available yet, and current feature values are a mix of verified source-derived extracts and deterministic demo placeholders. The model should be improved with source-derived geospatial features, MfM historical project outcomes, field survival rates, biomass measurements, biodiversity monitoring, land tenure data, and community feasibility data.
`;
}

function renderSchema() {
  return {
    feature_version_pattern: "^mixed_[a-z_]+_v0$",
    example_feature_versions: [
      "mixed_land_cover_forest_rainfall_access_v0",
      "mixed_land_cover_forest_rainfall_soil_population_access_v0",
    ],
    required_fields: [
      "site_id",
      "region",
      "area_ha",
      "land_cover_primary",
      "ndvi_current",
      "ndvi_trend_5y",
      "forest_loss_score",
      "rainfall_reliability_score",
      "slope_risk_score",
      "soil_organic_carbon_score",
      "population_pressure_score",
      "road_access_score",
      "protected_area_overlap_pct",
      "safeguard_risk_score",
      "data_quality_score",
      "field_validation_required",
    ],
    score_scale: "0-100; higher is better except fields containing risk",
    source_status: "mixed source-derived and demo placeholders pending full source extraction",
  };
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
