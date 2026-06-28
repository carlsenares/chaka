import { readFileSync } from "node:fs";
import { join } from "node:path";

export type GeoJsonPolygon = {
  type: "Polygon";
  coordinates: number[][][];
};

export type CandidateSiteProperties = {
  site_id: string;
  name: string;
  region: string;
  region_code: string;
  zone: string;
  woreda: string;
  zone_pcode: string;
  woreda_pcode: string;
  area_ha: number;
  candidate_method: string;
  geometry_quality: string;
  source_aoi: string;
  centroid_lon: number;
  centroid_lat: number;
  data_coverage_basis: string;
};

export type CandidateSiteFeature = {
  type: "Feature";
  properties: CandidateSiteProperties;
  geometry: GeoJsonPolygon;
};

type CandidateSiteCollection = {
  type: "FeatureCollection";
  features: CandidateSiteFeature[];
};

let candidateSiteCache: CandidateSiteFeature[] | null = null;

export function getCandidateSites() {
  if (!candidateSiteCache) {
    const filePath = join(process.cwd(), "data/processed/candidate_sites.geojson");
    const collection = JSON.parse(
      readFileSync(filePath, "utf8"),
    ) as CandidateSiteCollection;

    candidateSiteCache = collection.features;
  }

  return candidateSiteCache;
}

export function getCandidateSite(siteId: string) {
  return getCandidateSites().find(
    (candidate) => candidate.properties.site_id === siteId,
  );
}
