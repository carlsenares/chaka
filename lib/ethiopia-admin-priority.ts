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

export type AdminAreaSummary = SiteDashboardItem & {
  site_count: number;
  member_site_ids: string[];
};

function getSiteAdminPcode(site: SiteDashboardItem) {
  return zoneToPcode[site.zone] ?? regionToPcode[site.region] ?? null;
}

export function aggregateSitesByAdminArea(sites: SiteDashboardItem[]): AdminAreaSummary[] {
  const pcodeToTopSite = new Map<string, SiteDashboardItem>();
  const pcodeToMembers = new Map<string, SiteDashboardItem[]>();

  for (const site of sites) {
    const pcode = getSiteAdminPcode(site);
    if (!pcode) continue;

    const members = pcodeToMembers.get(pcode) ?? [];
    members.push(site);
    pcodeToMembers.set(pcode, members);

    const current = pcodeToTopSite.get(pcode);
    if (!current || site.priority_score > current.priority_score) {
      pcodeToTopSite.set(pcode, site);
    }
  }

  return [...pcodeToTopSite.entries()]
    .map(([pcode, site]) => {
      const members = pcodeToMembers.get(pcode) ?? [site];
      return {
        ...site,
        site_count: members.length,
        member_site_ids: members.map((member) => member.site_id),
      };
    })
    .sort((a, b) => b.priority_score - a.priority_score || a.site_id.localeCompare(b.site_id))
    .map((site, index) => ({ ...site, rank: index + 1 }));
}

export function buildAdminPriorityJoin(sites: SiteDashboardItem[]): AdminPriorityJoin {
  const siteIdToPcode = new Map<string, string>();
  const pcodeToTopSite = new Map<string, SiteDashboardItem>();

  for (const site of sites) {
    const pcode = getSiteAdminPcode(site);
    if (!pcode) continue;

    siteIdToPcode.set(site.site_id, pcode);
    const current = pcodeToTopSite.get(pcode);
    if (!current || site.priority_score > current.priority_score) {
      pcodeToTopSite.set(pcode, site);
    }
  }

  const priorityResults = [...pcodeToTopSite.entries()].map(([pcode, site]) => ({
    admin_level: inferAdminLevel(pcode),
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

function inferAdminLevel(pcode: string): PriorityResult["admin_level"] {
  if (pcode === "ET") return 0;
  if (/^ET\d{2}$/.test(pcode)) return 1;
  if (/^ET\d{4}$/.test(pcode)) return 2;
  return 3;
}

function toPriorityLevel(score: number): PriorityResult["priority_level"] {
  if (score >= 75) return "Highest";
  if (score >= 65) return "High";
  if (score >= 50) return "Medium";
  return "Lower";
}
