import type {
  EvidenceCriticObject,
  ModelPrediction,
  ProjectBriefObject,
  RecommendationObject,
  SiteFeature,
} from "@/reasoning/types";

export function createEvidenceCritic(
  feature: SiteFeature,
  prediction: ModelPrediction,
  recommendation: RecommendationObject,
  brief?: ProjectBriefObject,
): EvidenceCriticObject {
  const unsupportedClaims: string[] = [];
  const weakClaims: EvidenceCriticObject["weak_claims"] = [];

  if (recommendation.evidence_refs.length < recommendation.main_reasons.length) {
    unsupportedClaims.push(
      "Every main reason must have at least one traceable evidence reference.",
    );
  }

  if (
    prediction.carbon_potential === "high" ||
    recommendation.carbon_potential === "high"
  ) {
    weakClaims.push({
      claim: "High carbon potential",
      reason:
        "Carbon potential is inferred from vegetation recovery and soil carbon proxies, not field biomass measurement.",
    });
  }

  if ((feature.protected_area_overlap_pct ?? 0) > 0) {
    const mentionsSafeguard = [
      ...recommendation.risk_flags,
      ...(brief?.risks ?? []),
    ].some((text) => text.toLowerCase().includes("protected"));

    if (!mentionsSafeguard) {
      unsupportedClaims.push(
        "Protected-area overlap must be reflected in risk flags or brief risks.",
      );
    }
  }

  if ((feature.safeguard_risk_score ?? 0) >= 60) {
    weakClaims.push({
      claim: "Implementation is feasible",
      reason:
        "High safeguard risk means feasibility remains uncertain until field and authority validation.",
    });
  }

  if ((feature.data_quality_score ?? 100) < 70) {
    weakClaims.push({
      claim: "Site ranking confidence",
      reason:
        "Data quality is below the preferred demo threshold, so the result should remain validation-first.",
    });
  }

  if (hasMissingCoreFields(feature)) {
    weakClaims.push({
      claim: "Complete data evidence",
      reason:
        "One or more required feature fields are null and should be acknowledged before final site selection.",
    });
  }

  const supportLevel = unsupportedClaims.length
    ? "unsupported"
    : weakClaims.length || feature.field_validation_required
      ? "supported_with_validation_needed"
      : "supported";

  return {
    site_id: feature.site_id,
    support_level: supportLevel,
    unsupported_claims: unsupportedClaims,
    weak_claims: weakClaims,
    must_show_disclaimer: supportLevel !== "supported",
    recommended_disclaimer:
      "This is a pre-feasibility screening result. Field validation is required before project investment or carbon claims.",
  };
}

function hasMissingCoreFields(feature: SiteFeature) {
  return [
    feature.ndvi_current,
    feature.ndvi_trend_5y,
    feature.rainfall_reliability_score,
    feature.slope_risk_score,
    feature.soil_organic_carbon_score,
    feature.population_pressure_score,
    feature.road_access_score,
    feature.safeguard_risk_score,
    feature.data_quality_score,
  ].some((value) => value === null);
}
