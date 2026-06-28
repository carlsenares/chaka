#!/usr/bin/env python3

import argparse
import hashlib
import json
import math
import shutil
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
import rasterio
from rasterio.mask import mask

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
RAW_DIR = ROOT / "data/raw/esa_cci_biomass"
OUTPUT_PATH = ROOT / "data/features/source_extracts/esa_cci_biomass.json"

BASE_LISTING_URL = "https://data.ceda.ac.uk/neodc/esacci/biomass/data/agb/maps/v7.0/geotiff/{year}/?json"
DATASET_VERSION = "v7.0"
DEFAULT_YEAR = 2024
EXTRACTOR_VERSION = "0.1.0"

PRODUCTS = {
    "agb": {
        "name_token": "AGB",
        "field_prefix": "esa_cci_agb",
        "description": "above-ground biomass",
        "units": "Mg ha-1",
    },
    "agb_sd": {
        "name_token": "AGB_SD",
        "field_prefix": "esa_cci_agb_sd",
        "description": "above-ground biomass standard deviation / uncertainty",
        "units": "Mg ha-1",
    },
}


def main():
    args = parse_args()
    candidates_text = args.candidates.read_text()
    candidates = json.loads(candidates_text)
    candidates_sha256 = hashlib.sha256(candidates_text.encode("utf-8")).hexdigest()
    required_tiles = sorted({tile for feature in candidates["features"] for tile in tiles_for_feature(feature)})
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.raw_dir.mkdir(parents=True, exist_ok=True)

    listing = fetch_listing(args.year, args.timeout_seconds)
    resources = resources_by_tile_and_product(listing)

    if args.dry_run:
        print_plan(args, candidates, required_tiles, resources)
        return

    local_rasters = {}
    failures = []
    for tile in required_tiles:
        for product_key in PRODUCTS:
            resource = resources.get((tile, product_key))
            if not resource:
                failures.append({"tile": tile, "product": product_key, "stage": "resource_lookup", "error": "missing CEDA resource"})
                continue
            try:
                local_rasters[(tile, product_key)] = ensure_tile(args, tile, product_key, resource)
            except Exception as exc:
                failures.append({
                    "tile": tile,
                    "product": product_key,
                    "stage": "download",
                    "url": resource.get("download"),
                    "error": f"{type(exc).__name__}: {exc}",
                })

    rows = [
        extract_feature(feature, required_tiles, local_rasters, failures)
        for feature in candidates["features"]
    ]
    output = {
        "source": source_metadata(args, candidates_sha256, required_tiles, resources),
        "features": rows,
    }
    if failures:
        output["blocker"] = {
            "reason": "One or more ESA CCI Biomass resource lookups or raster downloads failed.",
            "failures": failures,
            "next_action": "Retry later or place the listed CEDA GeoTIFFs under data/raw/esa_cci_biomass/.",
        }

    args.output.write_text(json.dumps(output, indent=2) + "\n")
    print(f"Wrote {relative_path(args.output)}")


def parse_args():
    parser = argparse.ArgumentParser(description="Extract ESA CCI Biomass AGB and uncertainty context for candidate sites.")
    parser.add_argument("--candidates", type=Path, default=CANDIDATES_PATH)
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--year", type=int, default=DEFAULT_YEAR)
    parser.add_argument("--timeout-seconds", type=int, default=120)
    parser.add_argument("--refresh-cache", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def print_plan(args, candidates, required_tiles, resources):
    print("ESA CCI Biomass extraction dry run")
    print(f"Candidate file: {relative_path(args.candidates)}")
    print(f"Output: {relative_path(args.output)}")
    print(f"Year: {args.year}")
    print(f"Candidate sites: {len(candidates['features'])}")
    print(f"Required tiles ({len(required_tiles)}):")
    for tile in required_tiles:
        print(f"  - {tile}")
        for product_key in PRODUCTS:
            resource = resources.get((tile, product_key))
            if resource:
                print(f"    {product_key}: {resource['size']} bytes ({resource['download']})")
            else:
                print(f"    {product_key}: missing")
    print("")
    print("Raw ESA CCI Biomass tiles are cached under data/raw/esa_cci_biomass/ and excluded from git.")
    print("AGB and AGB_SD are context-only; this extractor does not convert biomass to verified carbon.")


def fetch_listing(year, timeout_seconds):
    url = BASE_LISTING_URL.format(year=year)
    request = urllib.request.Request(url, headers={"User-Agent": "chaka-esa-cci-biomass/0.1", "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        return json.loads(response.read().decode("utf-8"))


def resources_by_tile_and_product(listing):
    resources = {}
    for item in listing.get("items", []):
        name = item.get("name") or ""
        if not name.endswith(".tif"):
            continue
        tile = name.split("_", 1)[0]
        product_key = product_key_from_name(name)
        if product_key:
            resources[(tile, product_key)] = item
    return resources


def product_key_from_name(name):
    if "-AGB_SD-" in name:
        return "agb_sd"
    if "-AGB-" in name:
        return "agb"
    return None


def ensure_tile(args, tile, product_key, resource):
    path = local_tile_path(args.raw_dir, args.year, tile, product_key)
    if path.exists() and path.stat().st_size > 0 and not args.refresh_cache:
        with rasterio.open(path):
            pass
        return path

    url = resource["download"]
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    request = urllib.request.Request(url, headers={"User-Agent": "chaka-esa-cci-biomass/0.1"})
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


def extract_feature(feature, required_tiles, local_rasters, failures):
    site_id = feature["properties"]["site_id"]
    row = {
        "site_id": site_id,
        "source_status": "source_derived",
        "source_tiles": [],
        "scoring_policy": "context_only_no_score_override",
    }
    any_values = False
    missing_product = False

    for product_key, product in PRODUCTS.items():
        prefix = product["field_prefix"]
        values = []
        areas = []
        contributing_tiles = []
        for tile in required_tiles:
            raster_path = local_rasters.get((tile, product_key))
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
            row[f"{prefix}_mean_mg_ha"] = round(float(np.mean(merged_values)), 3)
            row[f"{prefix}_median_mg_ha"] = round(float(np.median(merged_values)), 3)
            row[f"{prefix}_p90_mg_ha"] = round(float(np.percentile(merged_values, 90)), 3)
            row[f"{prefix}_total_mg"] = round(float(np.sum(merged_values * merged_areas)), 3)
            row[f"{prefix}_valid_pixel_count"] = int(merged_values.size)
            row[f"{prefix}_tiles"] = contributing_tiles
            row["source_tiles"] = sorted(set(row["source_tiles"]) | set(contributing_tiles))
            any_values = True
        else:
            row[f"{prefix}_mean_mg_ha"] = None
            row[f"{prefix}_median_mg_ha"] = None
            row[f"{prefix}_p90_mg_ha"] = None
            row[f"{prefix}_total_mg"] = None
            row[f"{prefix}_valid_pixel_count"] = 0
            row[f"{prefix}_tiles"] = []
            missing_product = True

    row["esa_cci_agb_relative_uncertainty_mean"] = relative_uncertainty(row)
    if any_values and missing_product:
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
    valid &= band >= 0
    if not np.any(valid):
        return None
    return band[valid], pixel_area_ha(transform)


def relative_uncertainty(row):
    agb = row.get("esa_cci_agb_mean_mg_ha")
    sd = row.get("esa_cci_agb_sd_mean_mg_ha")
    if agb is None or sd is None or agb <= 0:
        return None
    return round(sd / agb, 4)


def tiles_for_feature(feature):
    min_lon, min_lat, max_lon, max_lat = geometry_bounds(feature["geometry"])
    lon_starts = range(floor_to_10(min_lon), floor_to_10(max_lon) + 1, 10)
    lat_tops = range(ceil_to_10(max_lat), ceil_to_10(min_lat) - 1, -10)
    return [format_tile(lat, lon) for lat in lat_tops for lon in lon_starts]


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
    return f"{lat_prefix}{abs(lat_top):02d}{lon_prefix}{abs(lon_start):03d}"


def pixel_area_ha(transform):
    lat_center = transform.f + transform.e / 2
    height_m = abs(transform.e) * 111_320
    width_m = abs(transform.a) * 111_320 * math.cos(math.radians(lat_center))
    return width_m * height_m / 10_000


def source_metadata(args, candidates_sha256, required_tiles, resources):
    return {
        "dataset_id": "esa_cci_biomass",
        "name": "ESA CCI Biomass above-ground biomass",
        "provider": "ESA Climate Change Initiative / CEDA",
        "version": DATASET_VERSION,
        "year": args.year,
        "source_url": "https://catalogue.ceda.ac.uk/uuid/6429d1aafe1e43b9b414e4a5a7f8b903",
        "listing_url": BASE_LISTING_URL.format(year=args.year),
        "extractor_version": EXTRACTOR_VERSION,
        "spatial_resolution": "100m",
        "units": {
            "agb": PRODUCTS["agb"]["units"],
            "agb_sd": PRODUCTS["agb_sd"]["units"],
        },
        "required_tiles": required_tiles,
        "tile_resources": {
            tile: {
                product_key: compact_resource(resources[(tile, product_key)])
                for product_key in PRODUCTS
                if (tile, product_key) in resources
            }
            for tile in required_tiles
        },
        "raw_cache": relative_path(args.raw_dir),
        "candidate_sites_sha256": candidates_sha256,
        "extraction_method": "CEDA JSON listing -> ESA CCI Biomass GeoTIFF tiles -> rasterio polygon mask over candidate polygons; summarizes AGB and AGB_SD separately.",
        "scoring_policy": "context_only_no_score_override",
        "note": "AGB is above-ground biomass, not verified project carbon. Convert to carbon only with an explicit factor and source.",
    }


def compact_resource(resource):
    return {
        "name": resource.get("name"),
        "size": resource.get("size"),
        "last_modified": resource.get("last_modified"),
        "md5": resource.get("md5"),
        "download": resource.get("download"),
    }


def local_tile_path(raw_dir, year, tile, product_key):
    token = PRODUCTS[product_key]["name_token"]
    return raw_dir / str(year) / f"{tile}_ESACCI-BIOMASS-L4-{token}-MERGED-100m-{year}-fv7.0.tif"


def relative_path(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    main()
