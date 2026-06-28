import type { SiteDetailResponse } from "@/reasoning/types";
import type { PriorityComponents } from "@/lib/priority-scoring";

export type SiteDashboardItem = {
  site_id: string;
  name: string;
  region: string;
  zone: string;
  woreda: string;
  area_ha: number;
  rank: number;
  canonical_priority_score: number;
  priority_score: number;
  recommended_intervention: string;
  risk_level: string;
  data_quality_score: number | null;
  geometry_quality: string;
  centroid: [number, number] | null;
  geometry: SiteDetailResponse["geometry"];
  feature: SiteDetailResponse["site_features"];
  prediction: SiteDetailResponse["model_prediction"];
  recommendation: SiteDetailResponse["recommendation"];
  components?: PriorityComponents;
};

export function detailToDashboardItem(
  detail: SiteDetailResponse,
  index: number,
): SiteDashboardItem {
  const candidate = detail.candidate;

  return {
    site_id: detail.site_features.site_id,
    name: [detail.site_features.woreda, detail.site_features.zone].filter(Boolean).join(", "),
    region: candidate?.region ?? detail.site_features.region,
    zone: candidate?.zone ?? detail.site_features.zone,
    woreda: candidate?.woreda ?? detail.site_features.woreda,
    area_ha: candidate?.area_ha ?? detail.site_features.area_ha,
    rank: detail.recommendation.rank ?? index + 1,
    canonical_priority_score: detail.recommendation.priority_score,
    priority_score: detail.recommendation.priority_score,
    recommended_intervention: detail.recommendation.recommended_intervention,
    risk_level: detail.recommendation.risk_level,
    data_quality_score: detail.site_features.data_quality_score,
    geometry_quality: candidate?.geometry_quality ?? "unknown",
    centroid:
      candidate?.centroid_lon && candidate?.centroid_lat
        ? [candidate.centroid_lat, candidate.centroid_lon]
        : null,
    geometry: detail.geometry,
    feature: detail.site_features,
    prediction: detail.model_prediction,
    recommendation: detail.recommendation,
  };
}
