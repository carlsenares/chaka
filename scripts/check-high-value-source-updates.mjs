#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputPath = path.join(root, "data/catalog/high_value_source_status.json");

const userAgent = "chaka-source-update-scanner/0.1";
const requestTimeoutMs = Number(process.env.SOURCE_UPDATE_TIMEOUT_MS ?? 12000);

const sources = [
  {
    dataset_id: "gfw_forest_carbon_gross_removals",
    name: "GFW forest carbon gross removals",
    role: "carbon_flux_context",
    priority: "high",
    api: "wri_ckan",
    package_id: "490d4774-ee8d-4cee-b04a-cf2103aa254f",
    expected_tile_id: "10N_030E",
    scoring_classification: "context_or_future_scoring",
    caveat:
      "Modeled forest carbon removals. Keep separate from carbon stock and divide cumulative removals by the stated period only when explicitly presenting annualized values.",
  },
  {
    dataset_id: "gfw_forest_carbon_gross_emissions",
    name: "GFW forest carbon gross emissions",
    role: "carbon_flux_context",
    priority: "high",
    api: "wri_ckan",
    package_id: "281e5565-82c1-43fb-9070-be6017c53e73",
    expected_tile_id: "10N_030E",
    scoring_classification: "context_or_future_scoring",
    caveat:
      "Modeled forest carbon emissions. Use for carbon-risk context, not direct project carbon accounting.",
  },
  {
    dataset_id: "gfw_forest_carbon_net_flux",
    name: "GFW forest carbon net flux",
    role: "carbon_flux_context",
    priority: "high",
    api: "wri_ckan",
    package_id: "2fdaa6b5-006f-4d15-8e30-832350644378",
    expected_tile_id: "10N_030E",
    scoring_classification: "context_or_future_scoring",
    caveat:
      "Modeled net forest carbon flux. Do not mix with gross removals or emissions without naming the transformation.",
  },
  {
    dataset_id: "nhm_biodiversity_intactness_index",
    name: "Natural History Museum Biodiversity Intactness Index v2.1.1",
    role: "modeled_biodiversity_condition",
    priority: "medium_high",
    api: "nhm_ckan",
    package_id: "bii-developed-by-nhm-v2-1-1-limited-release",
    scoring_classification: "context_only_until_bias_review",
    caveat:
      "Modeled biodiversity intactness at coarse resolution. Use as ecosystem-condition context, not direct species evidence.",
  },
  {
    dataset_id: "gbif_ethiopia_occurrences",
    name: "GBIF Ethiopia georeferenced occurrences",
    role: "observed_biodiversity_context",
    priority: "high",
    api: "gbif_count",
    url: "https://api.gbif.org/v1/occurrence/search?country=ET&hasCoordinate=true&limit=0",
    scoring_classification: "context_only_until_sampling_bias_handled",
    caveat:
      "Raw occurrence counts are sampling effort, not biodiversity quality. Use filters and bias correction before scoring.",
  },
  {
    dataset_id: "wosis_latest_soil_observations",
    name: "WoSIS latest measured soil observations",
    role: "observed_soil_anchor",
    priority: "medium_high",
    api: "wosis_wfs",
    url:
      "https://maps.isric.org/mapserv?map=/map/wosis_latest.map&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetCapabilities",
    scoring_classification: "validation_anchor",
    caveat:
      "Measured soil observations are sparse and uneven. Use as confidence/validation context for SoilGrids, not full-coverage scoring.",
  },
  {
    dataset_id: "kba_world_database",
    name: "World Database of Key Biodiversity Areas",
    role: "conservation_priority_safeguard",
    priority: "high",
    api: "manual_access",
    url: "https://www.keybiodiversityareas.org/request-gis-data",
    scoring_classification: "blocked_until_license_or_partner_access",
    caveat:
      "High-value biodiversity safeguard layer, but GIS access and redistribution terms require manual approval.",
  },
  {
    dataset_id: "iucn_red_list_spatial",
    name: "IUCN Red List spatial data",
    role: "threatened_species_context",
    priority: "high",
    api: "manual_access",
    url: "https://www.iucnredlist.org/resources/spatial-data-download",
    scoring_classification: "blocked_until_terms_accepted",
    caveat:
      "Range maps are not observations. Refine by habitat/elevation/land cover before using in scoring.",
  },
  {
    dataset_id: "nasa_gedi_l4b_agbd",
    name: "NASA GEDI L4B gridded aboveground biomass density",
    role: "carbon_stock_anchor",
    priority: "high",
    api: "manual_or_earthdata",
    url:
      "https://www.earthdata.nasa.gov/data/catalog/ornl-cloud-gedi-l4b-gridded-biomass-v2-1-2299-2.1",
    scoring_classification: "use_later_with_earthdata_access",
    caveat:
      "Useful biomass anchor with uncertainty, but access/product handling should preserve standard-error bands and quality metadata.",
  },
  {
    dataset_id: "esa_cci_biomass_v7",
    name: "ESA CCI Biomass v7.0",
    role: "wall_to_wall_carbon_stock",
    priority: "high",
    api: "esa_ceda_listing",
    year: 2024,
    expected_tile_id: "N10E030",
    url: "https://data.ceda.ac.uk/neodc/esacci/biomass/data/agb/maps/v7.0/geotiff/2024/?json",
    scoring_classification: "context_or_future_scoring",
    caveat:
      "Wall-to-wall above-ground biomass with uncertainty. This is biomass stock context, not verified project carbon; convert to carbon only with an explicit factor and source.",
  },
];

async function main() {
  const checked_at_utc = new Date().toISOString();
  const results = [];

  for (const source of sources) {
    try {
      results.push(await checkSource(source));
    } catch (error) {
      results.push({
        ...baseResult(source),
        status: "check_failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const output = {
    generated_at_utc: checked_at_utc,
    scanner_version: "0.1.0",
    purpose:
      "Tracks high-value source freshness and access status for future scoring/context ingestion.",
    interpretation:
      "This does not mean every source is safe to score directly. Use scoring_classification and caveat before integrating.",
    sources: results,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${path.relative(root, outputPath)}`);
}

async function checkSource(source) {
  if (source.api === "wri_ckan") return checkWriCkan(source);
  if (source.api === "nhm_ckan") return checkNhmCkan(source);
  if (source.api === "gbif_count") return checkGbifCount(source);
  if (source.api === "wosis_wfs") return checkHeadOrGet(source, "xml_or_text");
  if (source.api === "manual_access") return checkManualAccess(source);
  if (source.api === "esa_ceda_listing") return checkEsaCedaListing(source);
  if (source.api === "manual_or_earthdata" || source.api === "manual_or_ceda") {
    return checkManualOrPortal(source);
  }
  return {
    ...baseResult(source),
    status: "manual_review",
    note: "No automated checker configured.",
  };
}

async function checkWriCkan(source) {
  const url = `https://datasets.wri.org/api/3/action/package_show?id=${source.package_id}`;
  const payload = await fetchJson(url);
  const result = payload.result;
  const matchingTile = (result.resources ?? []).find(
    (resource) => resource.name === source.expected_tile_id,
  );
  const tileAccess = matchingTile?.url
    ? await probeDownload(matchingTile.url)
    : { status: "missing_tile_resource" };

  return {
    ...baseResult(source),
    status: payload.success ? "metadata_ok" : "metadata_failed",
    provider_metadata_modified: result.metadata_modified ?? null,
    license_title: result.license_title ?? null,
    package_name: result.name ?? null,
    resource_count: Array.isArray(result.resources) ? result.resources.length : null,
    expected_tile_id: source.expected_tile_id,
    expected_tile_resource_found: Boolean(matchingTile),
    tile_download_probe: tileAccess,
    source_url: `https://datasets.wri.org/datasets/${result.name}`,
  };
}

async function checkNhmCkan(source) {
  const url = `https://data.nhm.ac.uk/api/3/action/package_show?id=${source.package_id}`;
  const payload = await fetchJson(url);
  const result = payload.result;
  const resource = (result.resources ?? [])[0];
  const downloadProbe = resource?.url ? await probeDownload(resource.url) : null;

  return {
    ...baseResult(source),
    status: payload.success ? "metadata_ok" : "metadata_failed",
    provider_metadata_modified: result.metadata_modified ?? null,
    license_title: result.license_title ?? null,
    package_name: result.name ?? null,
    resource_count: Array.isArray(result.resources) ? result.resources.length : null,
    primary_resource_name: resource?.name ?? null,
    primary_resource_size_bytes: resource?.size ?? null,
    download_probe: downloadProbe,
    source_url: "https://data.nhm.ac.uk/dataset/bii-developed-by-nhm-v2-1-1-limited-release",
  };
}

async function checkGbifCount(source) {
  const payload = await fetchJson(source.url);
  return {
    ...baseResult(source),
    status: "metadata_ok",
    source_url: source.url,
    count: payload.count ?? null,
    end_of_records: payload.endOfRecords ?? null,
  };
}

async function checkManualAccess(source) {
  const probe = await probeDownload(source.url, { method: "GET" });
  return {
    ...baseResult(source),
    status: "manual_or_license_required",
    source_url: source.url,
    access_probe: probe,
  };
}

async function checkEsaCedaListing(source) {
  const payload = await fetchJson(source.url);
  const items = payload.items ?? [];
  const agb = items.find((item) =>
    item.name === `${source.expected_tile_id}_ESACCI-BIOMASS-L4-AGB-MERGED-100m-${source.year}-fv7.0.tif`
  );
  const agbSd = items.find((item) =>
    item.name === `${source.expected_tile_id}_ESACCI-BIOMASS-L4-AGB_SD-MERGED-100m-${source.year}-fv7.0.tif`
  );

  return {
    ...baseResult(source),
    status: agb && agbSd ? "metadata_ok" : "missing_expected_resources",
    source_url: "https://catalogue.ceda.ac.uk/uuid/6429d1aafe1e43b9b414e4a5a7f8b903",
    listing_url: source.url,
    year: source.year,
    expected_tile_id: source.expected_tile_id,
    expected_tile_resource_found: Boolean(agb && agbSd),
    agb_resource: agb ? compactCedaResource(agb) : null,
    agb_sd_resource: agbSd ? compactCedaResource(agbSd) : null,
    agb_download_probe: agb?.download ? await probeDownload(agb.download) : null,
    agb_sd_download_probe: agbSd?.download ? await probeDownload(agbSd.download) : null,
  };
}

async function checkManualOrPortal(source) {
  const probe = await probeDownload(source.url, { method: "GET" });
  return {
    ...baseResult(source),
    status: "portal_metadata_only",
    source_url: source.url,
    access_probe: probe,
  };
}

function compactCedaResource(resource) {
  return {
    name: resource.name,
    size: resource.size,
    last_modified: resource.last_modified,
    md5: resource.md5,
  };
}

async function checkHeadOrGet(source) {
  const probe = await probeDownload(source.url, { method: "GET" });
  return {
    ...baseResult(source),
    status: probe.ok ? "metadata_ok" : "metadata_failed",
    source_url: source.url,
    access_probe: probe,
  };
}

function baseResult(source) {
  return {
    dataset_id: source.dataset_id,
    name: source.name,
    role: source.role,
    priority: source.priority,
    scoring_classification: source.scoring_classification,
    caveat: source.caveat,
  };
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      Accept: "application/json",
      "User-Agent": userAgent,
    },
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

async function probeDownload(url, options = {}) {
  const method = options.method ?? "GET";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        "User-Agent": userAgent,
        Range: "bytes=0-1",
      },
    }).finally(() => clearTimeout(timeout));
    return {
      ok: response.ok,
      status_code: response.status,
      content_type: response.headers.get("content-type"),
      content_length: response.headers.get("content-length"),
      status:
        response.ok
          ? "reachable"
          : response.status === 401 || response.status === 403
            ? "download_blocked_or_requires_terms"
            : "unreachable",
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      ok: false,
      status: "probe_failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
