import type { Feature, FeatureCollection, Geometry, Polygon, MultiPolygon } from "geojson";

export type PriorityLevel = "Highest" | "High" | "Medium" | "Lower";

export type AdminBoundaryProperties = {
  adm0_name: string;
  adm0_pcode: string;
  adm1_name: string;
  adm1_pcode: string;
  adm2_name: string;
  adm2_pcode: string;
  adm3_name?: string;
  adm3_pcode?: string;
  area_sqkm?: number | string;
  center_lat?: number | string | null;
  center_lon?: number | string | null;
};

export type PriorityResult = {
  admin_level: 0 | 1 | 2 | 3;
  pcode: string;
  priority_score: number;
  priority_level: PriorityLevel;
  biodiversity_score: number;
  carbon_score: number;
  water_score: number;
  livelihood_score: number;
  estimated_restoration_opportunity: string;
  rationale: string;
  confidence: string;
  evidence: string;
};

export type JoinedPriorityProperties = AdminBoundaryProperties & {
  recommendation?: PriorityResult;
  is_priority: boolean;
  join_pcode: string;
};

export type AdminBoundaryFeature = Feature<Polygon | MultiPolygon, AdminBoundaryProperties>;
export type JoinedPriorityFeature = Feature<Polygon | MultiPolygon, JoinedPriorityProperties>;

export function joinPriorityResultsToBoundaries(
  boundaries: FeatureCollection<Geometry, AdminBoundaryProperties>,
  results: PriorityResult[],
): FeatureCollection<Polygon | MultiPolygon, JoinedPriorityProperties> {
  const resultsByPcode = new Map(results.map((result) => [result.pcode, result]));

  return {
    type: "FeatureCollection",
    features: boundaries.features
      .filter((feature): feature is AdminBoundaryFeature => {
        return feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon";
      })
      .map((feature) => {
        const pcode = getFeaturePcode(feature.properties);
        const recommendation = resultsByPcode.get(pcode);

        return {
          ...feature,
          properties: {
            ...feature.properties,
            recommendation,
            is_priority: Boolean(recommendation),
            join_pcode: pcode,
          },
        };
      }),
  };
}

export function getFeaturePcode(properties: AdminBoundaryProperties) {
  return properties.adm3_pcode || properties.adm2_pcode || properties.adm1_pcode || properties.adm0_pcode;
}

export function getPriorityColor(level?: PriorityLevel) {
  if (level === "Highest") return "#0f5f46";
  if (level === "High") return "#2f7d4f";
  if (level === "Medium") return "#9faa3d";
  return "#e9d87a";
}

export function getPriorityLabel(level?: PriorityLevel) {
  if (level === "Highest") return "Highest priority";
  if (level === "High") return "High priority";
  if (level === "Medium") return "Medium priority";
  return "Lower priority";
}

export function getAdminHierarchy(properties: AdminBoundaryProperties) {
  return [
    properties.adm0_name,
    properties.adm1_name,
    properties.adm2_name,
    properties.adm3_name,
  ].filter(Boolean);
}

export function getAreaSqKm(properties: AdminBoundaryProperties) {
  if (properties.area_sqkm === undefined || properties.area_sqkm === null || properties.area_sqkm === "") {
    return "Not available";
  }

  const area = Number(properties.area_sqkm);
  if (Number.isNaN(area)) return String(properties.area_sqkm);

  return `${Math.round(area).toLocaleString()} km²`;
}
