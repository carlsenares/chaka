import { NextResponse } from "next/server";
import { rankRecommendations } from "@/reasoning";
import { sampleSites } from "@/reasoning/sample-sites";
import type { ProcessedSite } from "@/reasoning/types";

type RecommendationRequest = {
  site?: ProcessedSite;
  sites?: ProcessedSite[];
  limit?: number;
};

export async function GET() {
  return NextResponse.json({
    generated_from: "sample_sites",
    count: sampleSites.length,
    recommendations: rankRecommendations(sampleSites),
  });
}

export async function POST(request: Request) {
  let body: RecommendationRequest;

  try {
    body = (await request.json()) as RecommendationRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sites = resolveSites(body);

  if (!sites) {
    return NextResponse.json(
      {
        error:
          "Expected `site` to be a Patrick-style object or `sites` to be an array of Patrick-style objects.",
      },
      { status: 400 },
    );
  }

  const limit = normalizeLimit(body.limit, sites.length);
  const recommendations = rankRecommendations(sites).slice(0, limit);

  return NextResponse.json({
    generated_from: body.sites || body.site ? "request_body" : "sample_sites",
    count: recommendations.length,
    recommendations,
  });
}

function normalizeLimit(limit: number | undefined, fallback: number) {
  if (!limit || Number.isNaN(limit)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.floor(limit), fallback));
}

function resolveSites(body: RecommendationRequest) {
  if (body.sites) {
    return body.sites.every(isProcessedSite) ? body.sites : null;
  }

  if (body.site) {
    return isProcessedSite(body.site) ? [body.site] : null;
  }

  return sampleSites;
}

function isProcessedSite(value: unknown): value is ProcessedSite {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isString(value.site_id) &&
    hasStrings(value.admin, ["region", "zone", "woreda"]) &&
    isRestorationContext(value.restoration_context) &&
    isLandCover(value.land_cover) &&
    isVegetation(value.vegetation) &&
    isForestChange(value.forest_change) &&
    isRainfall(value.rainfall) &&
    isTerrain(value.terrain) &&
    isSoil(value.soil) &&
    isSocialFeasibility(value.social_feasibility) &&
    isSafeguards(value.safeguards) &&
    isSpeciesSuitability(value.species_suitability)
  );
}

function isRestorationContext(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.atlas_priority) &&
    isStringArray(value.suggested_restoration_options)
  );
}

function isLandCover(value: unknown) {
  return (
    isRecord(value) &&
    hasStrings(value, ["dominant_class", "secondary_class"]) &&
    hasNumbers(value, ["tree_cover_percentage", "built_up_percentage"]) &&
    typeof value.suitable_for_fmnr_agroforestry === "boolean"
  );
}

function isVegetation(value: unknown) {
  return (
    isRecord(value) &&
    isNumber(value.ndvi_mean) &&
    hasStrings(value, [
      "vegetation_condition",
      "vegetation_trend_10yr",
      "degradation_signal",
    ])
  );
}

function isForestChange(value: unknown) {
  return (
    isRecord(value) &&
    hasNumbers(value, ["tree_cover_loss_score", "tree_cover_gain_score"]) &&
    isString(value.canopy_height_class)
  );
}

function isRainfall(value: unknown) {
  return (
    isRecord(value) &&
    hasNumbers(value, ["annual_rainfall_mm", "rainfall_reliability_score"]) &&
    isString(value.drought_risk)
  );
}

function isTerrain(value: unknown) {
  return (
    isRecord(value) &&
    hasNumbers(value, ["mean_slope_degrees", "erosion_risk_score"]) &&
    isString(value.watershed_restoration_relevance)
  );
}

function isSoil(value: unknown) {
  return (
    isRecord(value) &&
    hasNumbers(value, [
      "soil_organic_carbon_score",
      "soil_suitability_score",
      "soil_ph",
    ])
  );
}

function isSocialFeasibility(value: unknown) {
  return (
    isRecord(value) &&
    hasNumbers(value, [
      "population_pressure_score",
      "livelihood_need_score",
      "road_access_score",
    ]) &&
    typeof value.settlement_overlap === "boolean"
  );
}

function isSafeguards(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.protected_area_overlap === "boolean" &&
    isString(value.safeguard_level)
  );
}

function isSpeciesSuitability(value: unknown) {
  return (
    isRecord(value) &&
    isNumber(value.suitability_score) &&
    isStringArray(value.recommended_species_groups)
  );
}

function hasStrings(value: unknown, keys: string[]) {
  return isRecord(value) && keys.every((key) => isString(value[key]));
}

function hasNumbers(value: unknown, keys: string[]) {
  return isRecord(value) && keys.every((key) => isNumber(value[key]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}
