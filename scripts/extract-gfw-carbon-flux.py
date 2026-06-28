#!/usr/bin/env python3

import argparse
import json
import math
import shutil
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
import rasterio
from rasterio.mask import mask

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
RAW_DIR = ROOT / "data/raw/gfw_carbon_flux"
OUTPUT_PATH = ROOT / "data/features/source_extracts/gfw_carbon_flux.json"
WRI_PACKAGE_SHOW = "https://datasets.wri.org/api/3/action/package_show"

DATASETS = {
    "gross_removals": {
        "package_id": "490d4774-ee8d-4cee-b04a-cf2103aa254f",
        "dataset_slug": "gfw-forest-carbon-gross-removals",
        "field_prefix": "gfw_carbon_gross_removals",
        "unit": "Mg_CO2e_ha-1",
    },
    "gross_emissions": {
        "package_id": "281e5565-82c1-43fb-9070-be6017c53e73",
        "dataset_slug": "gfw-forest-carbon-gross-emissions",
        "field_prefix": "gfw_carbon_gross_emissions",
        "unit": "Mg_CO2e_ha-1",
    },
    "net_flux": {
        "package_id": "2fdaa6b5-006f-4d15-8e30-832350644378",
        "dataset_slug": "gfw-forest-carbon-net-flux",
        "field_prefix": "gfw_carbon_net_flux",
        "unit": "Mg_CO2e_ha-1",
    },
}

EXTRACTOR_VERSION = "0.1.0"


def main():
    args = parse_args()
    candidates = json.loads(args.candidates.read_text())
    required_tiles = sorted({tile for feature in candidates["features"] for tile in tiles_for_feature(feature)})
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.raw_dir.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        print_plan(args, candidates, required_tiles)
        return

    dataset_resources = {}
    failures = []
    for dataset_key, config in DATASETS.items():
        if dataset_key not in args.datasets:
            continue
        try:
            dataset_resources[dataset_key] = fetch_dataset_resources(config, args)
        except Exception as exc:
            failures.append({
                "dataset": dataset_key,
                "stage": "metadata",
                "error": f"{type(exc).__name__}: {exc}",
            })

    local_rasters = {}
    for dataset_key, resources in dataset_resources.items():
        for tile in required_tiles:
            url = resources.get(tile)
            if not url:
                failures.append({"dataset": dataset_key, "tile": tile, "stage": "resource_lookup", "error": "missing tile resource"})
                continue
            try:
                local_rasters[(dataset_key, tile)] = ensure_tile(args, dataset_key, tile, url)
            except Exception as exc:
                failures.append({
                    "dataset": dataset_key,
                    "tile": tile,
                    "stage": "download",
                    "url": url,
                    "error": f"{type(exc).__name__}: {exc}",
                })

    rows = [
        extract_feature(feature, args.datasets, required_tiles, local_rasters, failures)
        for feature in candidates["features"]
    ]
    output = {
        "source": source_metadata(args, required_tiles, dataset_resources),
        "features": rows,
    }
    if failures:
        output["blocker"] = {
            "reason": "One or more GFW carbon flux metadata or raster tile requests failed.",
            "failures": failures,
            "next_action": "Confirm WRI data-api tile access, accepted terms, or provide cached GeoTIFF tiles under data/raw/gfw_carbon_flux/.",
        }

    args.output.write_text(json.dumps(output, indent=2) + "\n")
    print(f"Wrote {relative_path(args.output)}")


def parse_args():
    parser = argparse.ArgumentParser(description="Extract GFW forest carbon flux context for candidate sites.")
    parser.add_argument("--candidates", type=Path, default=CANDIDATES_PATH)
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--datasets", nargs="+", choices=sorted(DATASETS), default=sorted(DATASETS))
    parser.add_argument("--timeout-seconds", type=int, default=60)
    parser.add_argument("--refresh-cache", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def print_plan(args, candidates, required_tiles):
    print("GFW forest carbon flux extraction dry run")
    print(f"Candidate file: {relative_path(args.candidates)}")
    print(f"Output: {relative_path(args.output)}")
    print(f"Candidate sites: {len(candidates['features'])}")
    print(f"Datasets: {', '.join(args.datasets)}")
    print(f"Required tiles ({len(required_tiles)}):")
    for tile in required_tiles:
        print(f"  - {tile}")
    print("")
    print("Raw GeoTIFF tiles are cached under data/raw/gfw_carbon_flux/ and excluded from git.")
    print("If WRI data-api returns 403, the extractor writes a blocked artifact rather than silently inventing values.")


def fetch_dataset_resources(config, args):
    params = urllib.parse.urlencode({"id": config["package_id"]})
    url = f"{WRI_PACKAGE_SHOW}?{params}"
    payload = load_json_url(url, args.timeout_seconds)
    result = payload.get("result") or {}
    resources = {}
    for resource in result.get("resources") or []:
        name = resource.get("name")
        resource_url = resource.get("url")
        if name and resource_url and resource.get("format") == "TIF":
            resources[name] = resource_url
    return resources


def ensure_tile(args, dataset_key, tile, url):
    path = local_tile_path(args.raw_dir, dataset_key, tile)
    if path.exists() and path.stat().st_size > 0 and not args.refresh_cache:
        with rasterio.open(path):
            pass
        return path

    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    request = urllib.request.Request(url, headers={"User-Agent": "chaka-gfw-carbon-flux/0.1"})
    try:
        print(f"Downloading {url}", file=sys.stderr)
        with urllib.request.urlopen(request, timeout=args.timeout_seconds) as response, temp_path.open("wb") as target:
            shutil.copyfileobj(response, target)
        with rasterio.open(temp_path):
            pass
        temp_path.replace(path)
    finally:
        if temp_path.exists():
            temp_path.unlink()
    return path


def extract_feature(feature, dataset_keys, required_tiles, local_rasters, failures):
    site_id = feature["properties"]["site_id"]
    row = {
        "site_id": site_id,
        "source_status": "source_derived",
        "source_tiles": [],
        "scoring_policy": "context_only_no_score_override",
    }
    any_values = False
    missing_dataset = False

    for dataset_key in dataset_keys:
        config = DATASETS[dataset_key]
        prefix = config["field_prefix"]
        values = []
        areas = []
        contributing_tiles = []
        for tile in required_tiles:
            raster_path = local_rasters.get((dataset_key, tile))
            if not raster_path:
                continue
            extracted = extract_values(feature, raster_path)
            if extracted is None:
                continue
            tile_values, pixel_area_ha = extracted
            if tile_values.size == 0:
                continue
            values.append(tile_values)
            areas.append(np.full(tile_values.shape, pixel_area_ha, dtype="float64"))
            contributing_tiles.append(tile)

        if values:
            merged_values = np.concatenate(values).astype("float64")
            merged_areas = np.concatenate(areas).astype("float64")
            row[f"{prefix}_mean_mg_co2e_ha"] = round(float(np.mean(merged_values)), 3)
            row[f"{prefix}_median_mg_co2e_ha"] = round(float(np.median(merged_values)), 3)
            row[f"{prefix}_total_mg_co2e"] = round(float(np.sum(merged_values * merged_areas)), 3)
            row[f"{prefix}_valid_pixel_count"] = int(merged_values.size)
            row[f"{prefix}_tiles"] = contributing_tiles
            row["source_tiles"] = sorted(set(row["source_tiles"]) | set(contributing_tiles))
            any_values = True
        else:
            row[f"{prefix}_mean_mg_co2e_ha"] = None
            row[f"{prefix}_median_mg_co2e_ha"] = None
            row[f"{prefix}_total_mg_co2e"] = None
            row[f"{prefix}_valid_pixel_count"] = 0
            row[f"{prefix}_tiles"] = []
            missing_dataset = True

    if any_values and missing_dataset:
        row["source_status"] = "partial_source_derived"
    elif not any_values:
        row["source_status"] = "blocked_download" if failures else "no_valid_pixels"
    return row


def extract_values(feature, raster_path):
    try:
        with rasterio.open(raster_path) as dataset:
            data, _ = mask(dataset, [feature["geometry"]], crop=True, filled=False, all_touched=True)
            transform = dataset.transform
            nodata = dataset.nodata
    except ValueError:
        return None

    band = np.asarray(data[0].astype("float64").filled(np.nan), dtype="float64")
    valid = ~np.ma.getmaskarray(data[0]) & np.isfinite(band)
    if nodata is not None:
        valid &= band != float(nodata)
    if not np.any(valid):
        return None
    return band[valid], pixel_area_ha(transform)


def tiles_for_feature(feature):
    min_lon, min_lat, max_lon, max_lat = geometry_bounds(feature["geometry"])
    lon_starts = range(floor_to_10(min_lon), floor_to_10(max_lon) + 1, 10)
    lat_tops = range(ceil_to_10(max_lat), ceil_to_10(min_lat) - 1, -10)
    return [format_tile(lat_top, lon_start) for lat_top in lat_tops for lon_start in lon_starts]


def geometry_bounds(geometry):
    coords = []

    def visit(value):
        if isinstance(value[0], (int, float)):
            coords.append(value)
            return
        for child in value:
            visit(child)

    visit(geometry["coordinates"])
    lons = [coord[0] for coord in coords]
    lats = [coord[1] for coord in coords]
    return min(lons), min(lats), max(lons), max(lats)


def floor_to_10(value):
    return math.floor(value / 10) * 10


def ceil_to_10(value):
    return math.ceil(value / 10) * 10


def format_tile(lat_top, lon_start):
    lat_prefix = "N" if lat_top >= 0 else "S"
    lon_prefix = "E" if lon_start >= 0 else "W"
    return f"{abs(lat_top):02d}{lat_prefix}_{abs(lon_start):03d}{lon_prefix}"


def pixel_area_ha(transform):
    lat_center = transform.f + transform.e / 2
    height_m = abs(transform.e) * 111_320
    width_m = abs(transform.a) * 111_320 * math.cos(math.radians(lat_center))
    return width_m * height_m / 10_000


def source_metadata(args, required_tiles, dataset_resources):
    return {
        "dataset_id": "gfw_carbon_flux",
        "name": "Global Forest Watch forest carbon flux layers",
        "provider": "World Resources Institute / Global Forest Watch",
        "source_url": "https://datasets.wri.org/",
        "extractor_version": EXTRACTOR_VERSION,
        "datasets": {
            key: {
                "dataset_slug": DATASETS[key]["dataset_slug"],
                "package_id": DATASETS[key]["package_id"],
                "unit": DATASETS[key]["unit"],
                "tile_resource_count": len(dataset_resources.get(key, {})),
            }
            for key in args.datasets
        },
        "required_tiles": required_tiles,
        "raw_cache": relative_path(args.raw_dir),
        "extraction_method": "WRI CKAN package metadata -> tile GeoTIFF URLs -> rasterio polygon mask over candidate polygons; values summarized as mean/median Mg CO2e ha-1 and polygon total Mg CO2e.",
        "scoring_policy": "context_only_no_score_override",
        "note": "These are modeled forest carbon flux layers. Keep gross removals, gross emissions, and net flux separate. Do not use as verified project carbon accounting.",
    }


def load_json_url(url, timeout_seconds):
    request = urllib.request.Request(url, headers={"User-Agent": "chaka-gfw-carbon-flux/0.1", "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        return json.loads(response.read().decode("utf-8"))


def local_tile_path(raw_dir, dataset_key, tile):
    return raw_dir / dataset_key / f"{DATASETS[dataset_key]['dataset_slug']}_{tile}.tif"


def relative_path(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    main()
