#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputPath = path.join(root, "data/catalog/source_access_check.json");

const checks = [
  {
    dataset_id: "ghsl_settlement",
    name: "GHSL GHS-SMOD 2020 R2023A zip",
    expected: "available",
    method: "HEAD",
    url: "https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_SMOD_GLOBE_R2023A/GHS_SMOD_E2020_GLOBE_R2023A_54009_1000/V1-0/GHS_SMOD_E2020_GLOBE_R2023A_54009_1000_V1_0.zip",
  },
  {
    dataset_id: "wapor_l2_aeti",
    name: "FAO WaPOR v3 L2 AETI annual mapset metadata",
    expected: "available",
    method: "GET_JSON",
    url: "https://data.apps.fao.org/gismgr/api/v2/catalog/workspaces/WAPOR-3/mapsets/L2-AETI-A",
    extract: (json) => ({
      mapset: json.response?.code,
      unit: json.response?.measureUnit,
      scale: json.response?.scale,
      big_tiff: json.response?.bigTiff,
    }),
  },
  {
    dataset_id: "wapor_l2_tbp_latest",
    name: "FAO WaPOR v3 L2 TBP latest raster listing",
    expected: "available",
    method: "GET_JSON",
    url: "https://data.apps.fao.org/gismgr/api/v2/catalog/workspaces/WAPOR-3/mapsets/L2-TBP-A/rasters?size=1&sort=code:desc",
    extract: (json) => {
      const item = json.response?.items?.[0];
      return item
        ? {
            latest_code: item.code,
            download_url: item.downloadUrl,
            size: item.size?.humanReadable,
            updated: item.updated,
          }
        : {};
    },
  },
  {
    dataset_id: "nhm_bii_v2_1_1_metadata",
    name: "NHM BII v2.1.1 package metadata",
    expected: "available_metadata",
    method: "GET_JSON",
    url: "https://data.nhm.ac.uk/api/3/action/package_show?id=ed428544-c494-4289-961c-1a5adf8fae74",
    extract: (json) => ({
      title: json.result?.title,
      doi: json.result?.doi,
      license: json.result?.license_title,
      temporal_extent: json.result?.temporal_extent,
      download_url: json.result?.resources?.[0]?.url,
    }),
  },
  {
    dataset_id: "nhm_bii_v2_1_1_download",
    name: "NHM BII v2.1.1 zip direct download",
    expected: "blocked_server_challenge_or_available",
    method: "GET_RANGE",
    url: "https://data.nhm.ac.uk/dataset/ed428544-c494-4289-961c-1a5adf8fae74/resource/c4c281c4-befa-4e1b-a162-ba2f25e5ae82/download/bii-v2-1-1-nhm-data-portal.zip",
  },
  {
    dataset_id: "gfw_carbon_removals_metadata",
    name: "GFW forest carbon removals metadata",
    expected: "available_metadata",
    method: "GET_JSON",
    url: "https://data-api.globalforestwatch.org/dataset/gfw_forest_carbon_gross_removals",
    extract: (json) => ({
      latest_version: json.data?.versions?.at?.(-1) ?? json.data?.versions?.[json.data?.versions?.length - 1],
      title: json.data?.metadata?.title,
      subtitle: json.data?.metadata?.subtitle,
      license: json.data?.metadata?.license,
    }),
  },
  {
    dataset_id: "gfw_carbon_removals_tile",
    name: "GFW forest carbon removals tile download",
    expected: "blocked_auth_or_available",
    method: "GET_RANGE",
    url: "https://data-api.globalforestwatch.org/dataset/gfw_forest_carbon_gross_removals/v20240308/download/geotiff?grid=10/40000&tile_id=10N_030E&pixel_meaning=Mg_CO2e_ha-1",
  },
  {
    dataset_id: "wdpa_protected_areas",
    name: "WDPA Protected Planet",
    expected: "blocked_terms",
    method: "MANUAL",
    url: "https://www.protectedplanet.net/en/thematic-areas/wdpa",
    note: "Human must confirm WDPA terms and provide official download/API access before automation.",
  },
  {
    dataset_id: "kba_wdkba",
    name: "World Database of Key Biodiversity Areas",
    expected: "blocked_access_request",
    method: "MANUAL",
    url: "https://www.keybiodiversityareas.org/request-gis-data",
    note: "GIS access requires request or IBAT subscription/API.",
  },
  {
    dataset_id: "iucn_red_list_spatial",
    name: "IUCN Red List spatial data",
    expected: "blocked_account_terms",
    method: "MANUAL",
    url: "https://www.iucnredlist.org/resources/spatial-data-download",
    note: "Requires IUCN account/terms and product/taxa selection.",
  },
];

async function main() {
  const checkedAt = new Date().toISOString();
  const results = [];
  for (const check of checks) {
    results.push(await runCheck(check));
  }
  const output = {
    checked_at_utc: checkedAt,
    note: "Quick access/update check only. It does not download large source datasets or accept restricted terms.",
    results,
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  printSummary(output);
}

async function runCheck(check) {
  const base = {
    dataset_id: check.dataset_id,
    name: check.name,
    url: check.url,
    expected: check.expected,
    method: check.method,
  };
  if (check.method === "MANUAL") {
    return { ...base, access_status: check.expected, note: check.note };
  }

  try {
    const response = await fetch(check.url, requestOptions(check.method));
    const status = classifyHttpStatus(response);
    const result = {
      ...base,
      http_status: response.status,
      content_type: response.headers.get("content-type"),
      content_length: response.headers.get("content-length"),
      access_status: status,
    };
    if (check.method === "GET_JSON" && response.ok) {
      const json = await response.json();
      result.details = check.extract ? check.extract(json) : {};
    }
    return result;
  } catch (error) {
    return {
      ...base,
      access_status: "request_failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function requestOptions(method) {
  if (method === "HEAD") return { method: "HEAD", redirect: "follow" };
  if (method === "GET_RANGE") {
    return {
      method: "GET",
      redirect: "follow",
      headers: {
        Range: "bytes=0-0",
        "User-Agent": "chaka-source-access-check/0.1",
      },
    };
  }
  return {
    method: "GET",
    redirect: "follow",
    headers: {
      Accept: "application/json",
      "User-Agent": "chaka-source-access-check/0.1",
    },
  };
}

function classifyHttpStatus(response) {
  if (response.ok || response.status === 206) return "available";
  if (response.status === 401 || response.status === 403) {
    const server = response.headers.get("server") ?? "";
    const mitigated = response.headers.get("cf-mitigated") ?? "";
    if (server.toLowerCase().includes("cloudflare") || mitigated) return "blocked_server_challenge";
    return "blocked_auth";
  }
  if (response.status === 405) return "method_not_allowed";
  if (response.status >= 500) return "server_error";
  return "unavailable";
}

function printSummary(output) {
  console.log(`Wrote ${path.relative(root, outputPath)}`);
  for (const result of output.results) {
    const suffix = result.http_status ? ` HTTP ${result.http_status}` : "";
    console.log(`${result.dataset_id}: ${result.access_status}${suffix}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
