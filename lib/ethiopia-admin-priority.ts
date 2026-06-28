import type { PriorityResult } from "@/lib/map-renderer";
import type { SiteDashboardItem } from "@/lib/site-view-model";

const zoneToPcode: Record<string, string> = {
  "South Omo": "ET0812",
  Gofa: "ET0803",
  Wolayita: "ET0801",
  "West Omo": "ET1105",
  Dawuro: "ET1104",
  "Bench Sheko": "ET1103",
  Kefa: "ET1102",
  Sheka: "ET1101",
  Konta: "ET1106",
};

const regionToPcode: Record<string, string> = {
  Tigray: "ET01",
  Amhara: "ET03",
  Oromia: "ET04",
  "South Ethiopia": "ET08",
  "Southwest Ethiopia Peoples' Region": "ET11",
  Gambela: "ET12",
};

export type AdminPriorityJoin = {
  priorityResults: PriorityResult[];
  siteIdToPcode: Map<string, string>;
  pcodeToSiteId: Map<string, string>;
};

export function buildAdminPriorityJoin(sites: SiteDashboardItem[]): AdminPriorityJoin {
  const siteIdToPcode = new Map<string, string>();
  const pcodeToTopSite = new Map<string, SiteDashboardItem>();

  for (const site of sites) {
    const pcode = zoneToPcode[site.zone] ?? regionToPcode[site.region];
    if (!pcode) continue;

    siteIdToPcode.set(site.site_id, pcode);
    const current = pcodeToTopSite.get(pcode);
    if (!current || site.priority_score > current.priority_score) {
      pcodeToTopSite.set(pcode, site);
    }
  }

  const priorityResults = [...pcodeToTopSite.entries()].map(([pcode, site]) => ({
    admin_level: 2 as const,
    pcode,
    priority_score: site.priority_score,
    priority_level: toPriorityLevel(site.priority_score),
    biodiversity_score: Math.round(site.components?.biodiversity ?? 0),
    carbon_score: Math.round(site.components?.carbon ?? 0),
    water_score: Math.round(site.components?.water_soil ?? 0),
    livelihood_score: Math.round(site.components?.livelihood ?? 0),
    estimated_restoration_opportunity: `${Math.round(site.area_ha).toLocaleString()} ha`,
    rationale:
      site.recommendation.main_reasons[0] ??
      `${site.site_id} is the highest-ranked candidate currently joined to this admin boundary.`,
    confidence: `${site.data_quality_score ?? "n/a"} data quality`,
    evidence: site.recommendation.evidence_refs?.slice(0, 2).join(" | ") ?? "Evidence refs pending",
  }));

  return {
    priorityResults,
    siteIdToPcode,
    pcodeToSiteId: new Map(
      [...pcodeToTopSite.entries()].map(([pcode, site]) => [pcode, site.site_id]),
    ),
  };
}

function toPriorityLevel(score: number): PriorityResult["priority_level"] {
  if (score >= 75) return "Highest";
  if (score >= 65) return "High";
  if (score >= 50) return "Medium";
  return "Lower";
}
