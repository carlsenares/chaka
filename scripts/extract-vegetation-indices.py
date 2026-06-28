#!/usr/bin/env python3

import argparse
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import rasterio
import requests
from rasterio.mask import mask
from rasterio.warp import transform_geom

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
OUTPUT_PATH = ROOT / "data/features/source_extracts/vegetation_indices.json"
RAW_DIR = ROOT / "data/raw/vegetation"

EARTH_SEARCH_URL = "https://earth-search.aws.element84.com/v1/search"
PLANETARY_COMPUTER_SEARCH_URL = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
PLANETARY_COMPUTER_SIGN_URL = "https://planetarycomputer.microsoft.com/api/sas/v1/sign"

SENTINEL_COLLECTION = "sentinel-2-l2a"
LANDSAT_COLLECTION = "landsat-c2-l2"
SENTINEL_SCL_EXCLUDE = {0, 1, 3, 8, 9, 10, 11}
LANDSAT_QA_EXCLUDE_BITS = [0, 1, 3, 4, 5]


def main():
    args = parse_args()
    candidates = json.loads(args.candidates.read_text())
    features = candidates["features"]
    if args.site_id:
        features = [feature for feature in features if feature["properties"]["site_id"] == args.site_id]
    if args.limit:
        features = features[: args.limit]

    if args.dry_run:
        print_plan(args, candidates, features)
        return

    guard_partial_canonical_output(args)

    rows = [extract_feature(feature, args) for feature in features]
    if args.limit or args.site_id:
        processed_ids = {row["site_id"] for row in rows}
        for feature in candidates["features"]:
            site_id = feature["properties"]["site_id"]
            if site_id not in processed_ids:
                rows.append(not_processed_feature(site_id))

    output = {
        "source": source_metadata(args),
        "features": rows,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    print(f"Wrote {relative_path(args.output)}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract source-derived Sentinel-2/Landsat vegetation indices for candidate sites."
    )
    parser.add_argument("--candidates", type=Path, default=CANDIDATES_PATH)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR)
    parser.add_argument("--current-start", default="2026-03-01")
    parser.add_argument("--current-end", default="2026-06-27")
    parser.add_argument("--trend-years", default="2021,2022,2023,2024,2025")
    parser.add_argument("--trend-month-start", type=int, default=3)
    parser.add_argument("--trend-month-end", type=int, default=6)
    parser.add_argument("--max-sentinel-scenes", type=int, default=2)
    parser.add_argument("--max-landsat-scenes-per-year", type=int, default=1)
    parser.add_argument("--include-landsat-trend", action="store_true")
    parser.add_argument("--cloud-cover", type=float, default=60)
    parser.add_argument("--min-valid-pixels", type=int, default=10)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--site-id", default=None)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def print_plan(args, candidates, features):
    print("Vegetation indices extraction dry run")
    print(f"Candidate file: {relative_path(args.candidates)}")
    print(f"Output: {relative_path(args.output)}")
    print(f"Candidate sites to process: {len(features)} of {len(candidates['features'])}")
    print(f"Sentinel-2 current window: {args.current_start} to {args.current_end}")
    print(f"Landsat trend enabled: {args.include_landsat_trend}")
    if args.include_landsat_trend:
        print(f"Landsat trend years: {', '.join(str(year) for year in parse_years(args.trend_years))}")
        print(f"Trend months: {args.trend_month_start:02d} to {args.trend_month_end:02d}")
    print(f"Maximum Sentinel-2 scenes/site: {args.max_sentinel_scenes}")
    print(f"Maximum Landsat scenes/site/year: {args.max_landsat_scenes_per_year}")
    print("")
    print("The extractor reads public COG assets through STAC. It writes a small derived JSON artifact only.")


def extract_feature(feature, args):
    site_id = feature["properties"]["site_id"]
    bbox = bbox_for_feature(feature)
    sentinel_items = search_sentinel_items(bbox, args)
    sentinel_summaries = [summarize_sentinel_scene(feature, item, args.min_valid_pixels) for item in sentinel_items]
    sentinel_summaries = [summary for summary in sentinel_summaries if summary["source_status"] == "source_derived"]

    landsat_by_year = {}
    landsat_scene_count_by_year = {}
    landsat_errors = []
    if args.include_landsat_trend:
        trend_years = parse_years(args.trend_years)
        for year in trend_years:
            items = search_landsat_items(bbox, year, args)
            summaries = []
            for item in items:
                summary = summarize_landsat_scene(feature, item, args.min_valid_pixels)
                if summary["source_status"] == "source_derived":
                    summaries.append(summary)
                elif summary.get("error"):
                    landsat_errors.append(f"{year}:{summary['error']}")
            landsat_by_year[str(year)] = median_nullable([summary["ndvi"] for summary in summaries])
            landsat_scene_count_by_year[str(year)] = len(summaries)

    ndvi_current = median_nullable([summary["ndvi"] for summary in sentinel_summaries])
    evi_current = median_nullable([summary["evi"] for summary in sentinel_summaries])
    trend = ndvi_trend(landsat_by_year)
    valid_counts = [summary["valid_pixel_count"] for summary in sentinel_summaries]

    row = {
        "site_id": site_id,
        "ndvi_current": round_nullable(ndvi_current, 3),
        "evi_current": round_nullable(evi_current, 3),
        "ndvi_trend_5y": round_nullable(trend, 3),
        "sentinel2_scene_count": len(sentinel_summaries),
        "sentinel2_candidate_scene_count": len(sentinel_items),
        "sentinel2_valid_pixel_count_min": min(valid_counts) if valid_counts else 0,
        "sentinel2_valid_pixel_count_max": max(valid_counts) if valid_counts else 0,
        "sentinel2_scene_ids": [summary["scene_id"] for summary in sentinel_summaries],
        "landsat_ndvi_by_year": landsat_by_year,
        "landsat_scene_count_by_year": landsat_scene_count_by_year,
        "source_status": vegetation_source_status(ndvi_current, evi_current, trend),
    }
    if landsat_errors:
        row["landsat_errors"] = sorted(set(landsat_errors))[:8]
    if not sentinel_summaries:
        row["note"] = "No Sentinel-2 scenes met the valid-pixel threshold after SCL masking."
    if trend is None:
        row["trend_note"] = "Landsat annual NDVI trend was not run or could not be computed for both first and last valid trend years."
    return row


def search_sentinel_items(bbox, args):
    payload = {
        "collections": [SENTINEL_COLLECTION],
        "bbox": bbox,
        "datetime": f"{as_rfc3339(args.current_start, start=True)}/{as_rfc3339(args.current_end, start=False)}",
        "limit": max(args.max_sentinel_scenes, 1),
        "query": {"eo:cloud_cover": {"lt": args.cloud_cover}},
        "sortby": [{"field": "properties.eo:cloud_cover", "direction": "asc"}],
    }
    items = post_json(EARTH_SEARCH_URL, payload).get("features", [])
    return items[: args.max_sentinel_scenes]


def search_landsat_items(bbox, year, args):
    payload = {
        "collections": [LANDSAT_COLLECTION],
        "bbox": bbox,
        "datetime": f"{year}-{args.trend_month_start:02d}-01T00:00:00Z/{year}-{args.trend_month_end:02d}-{last_day(year, args.trend_month_end):02d}T23:59:59Z",
        "limit": max(args.max_landsat_scenes_per_year, 1),
        "query": {
            "eo:cloud_cover": {"lt": args.cloud_cover},
            "platform": {"in": ["landsat-8", "landsat-9"]},
        },
        "sortby": [{"field": "properties.eo:cloud_cover", "direction": "asc"}],
    }
    items = post_json(PLANETARY_COMPUTER_SEARCH_URL, payload).get("features", [])
    return items[: args.max_landsat_scenes_per_year]


def summarize_sentinel_scene(feature, item, min_valid_pixels):
    try:
        red = read_masked_asset(feature, item["assets"]["red"]["href"])
        nir = read_masked_asset(feature, item["assets"]["nir"]["href"])
        blue = read_masked_asset(feature, item["assets"]["blue"]["href"])
    except ValueError as error:
        return scene_error(item["id"], "no_asset_overlap", error)
    valid = red["valid"] & nir["valid"] & blue["valid"]
    if "scl" in item["assets"]:
        try:
            scl = read_masked_asset(feature, item["assets"]["scl"]["href"], indexes=1)
        except ValueError:
            scl = None
        if scl and scl["data"].shape == red["data"].shape:
            valid &= scl["valid"] & ~np.isin(scl["data"], list(SENTINEL_SCL_EXCLUDE))
    red_reflectance = red["data"].astype("float64") / 10000.0
    nir_reflectance = nir["data"].astype("float64") / 10000.0
    blue_reflectance = blue["data"].astype("float64") / 10000.0
    return summarize_indices(
        item["id"],
        red_reflectance,
        nir_reflectance,
        blue_reflectance,
        valid,
        min_valid_pixels,
    )


def summarize_landsat_scene(feature, item, min_valid_pixels):
    assets = item["assets"]
    red_href = sign_pc_href(assets["red"]["href"])
    nir_href = sign_pc_href(assets["nir08"]["href"])
    qa_href = sign_pc_href(assets["qa_pixel"]["href"])
    try:
        red = read_masked_asset(feature, red_href)
        nir = read_masked_asset(feature, nir_href)
        qa = read_masked_asset(feature, qa_href)
    except ValueError as error:
        return scene_error(item["id"], "no_asset_overlap", error)
    valid = red["valid"] & nir["valid"] & qa["valid"] & qa_pixel_clear_mask(qa["data"])
    red_reflectance = red["data"].astype("float64") * 0.0000275 - 0.2
    nir_reflectance = nir["data"].astype("float64") * 0.0000275 - 0.2
    return summarize_indices(item["id"], red_reflectance, nir_reflectance, None, valid, min_valid_pixels)


def summarize_indices(scene_id, red, nir, blue, valid, min_valid_pixels):
    reflectance_valid = valid & np.isfinite(red) & np.isfinite(nir) & (red > 0) & (nir > 0)
    ndvi = safe_divide(nir - red, nir + red)
    ndvi_valid = reflectance_valid & np.isfinite(ndvi) & (ndvi >= -1) & (ndvi <= 1)
    if int(np.count_nonzero(ndvi_valid)) < min_valid_pixels:
        return {"scene_id": scene_id, "source_status": "insufficient_valid_pixels", "valid_pixel_count": int(np.count_nonzero(ndvi_valid))}

    summary = {
        "scene_id": scene_id,
        "ndvi": float(np.median(ndvi[ndvi_valid])),
        "valid_pixel_count": int(np.count_nonzero(ndvi_valid)),
        "source_status": "source_derived",
    }
    if blue is not None:
        evi = 2.5 * safe_divide(nir - red, nir + 6 * red - 7.5 * blue + 1)
        evi_valid = ndvi_valid & np.isfinite(evi) & (evi >= -0.2) & (evi <= 1.0)
        summary["evi"] = float(np.median(evi[evi_valid])) if np.any(evi_valid) else None
    return summary


def scene_error(scene_id, status, error):
    return {
        "scene_id": scene_id,
        "source_status": status,
        "valid_pixel_count": 0,
        "error": str(error),
    }


def read_masked_asset(feature, href, indexes=1):
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif,.TIF"):
        with rasterio.open(href) as dataset:
            geom = transform_geom("EPSG:4326", dataset.crs, feature["geometry"])
            data, _ = mask(dataset, [geom], crop=True, indexes=indexes, filled=False)
            array = np.ma.getdata(data)
            mask_array = np.ma.getmaskarray(data)
            if array.ndim == 3:
                array = array[0]
                mask_array = mask_array[0]
            valid = ~mask_array
            if dataset.nodata is not None:
                valid &= array != dataset.nodata
            return {"data": array, "valid": valid}


def sign_pc_href(href):
    response = requests.get(PLANETARY_COMPUTER_SIGN_URL, params={"href": href}, timeout=60)
    response.raise_for_status()
    return response.json()["href"]


def qa_pixel_clear_mask(qa):
    qa = qa.astype("uint16")
    clear = np.ones(qa.shape, dtype=bool)
    for bit in LANDSAT_QA_EXCLUDE_BITS:
        clear &= (qa & (1 << bit)) == 0
    return clear


def post_json(url, payload):
    response = requests.post(url, json=payload, headers={"Accept": "application/geo+json"}, timeout=60)
    response.raise_for_status()
    return response.json()


def bbox_for_feature(feature):
    coordinates = []
    collect_coordinates(feature["geometry"]["coordinates"], coordinates)
    lons = [coordinate[0] for coordinate in coordinates]
    lats = [coordinate[1] for coordinate in coordinates]
    return [min(lons), min(lats), max(lons), max(lats)]


def collect_coordinates(value, coordinates):
    if isinstance(value, list) and value and isinstance(value[0], (int, float)):
        coordinates.append(value)
        return
    for item in value:
        collect_coordinates(item, coordinates)


def parse_years(value):
    return [int(part.strip()) for part in str(value).split(",") if part.strip()]


def ndvi_trend(values_by_year):
    valid = [(int(year), value) for year, value in values_by_year.items() if value is not None]
    if len(valid) < 2:
        return None
    valid.sort()
    return valid[-1][1] - valid[0][1]


def median_nullable(values):
    values = [value for value in values if value is not None and math.isfinite(float(value))]
    if not values:
        return None
    return float(np.median(values))


def round_nullable(value, places):
    if value is None:
        return None
    return round(float(value), places)


def safe_divide(numerator, denominator):
    return np.divide(numerator, denominator, out=np.full_like(numerator, np.nan, dtype="float64"), where=denominator != 0)


def as_rfc3339(value, start):
    dt = datetime.fromisoformat(value).replace(tzinfo=timezone.utc)
    if not start:
        dt = dt.replace(hour=23, minute=59, second=59)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def last_day(year, month):
    if month == 12:
        next_month = datetime(year + 1, 1, 1)
    else:
        next_month = datetime(year, month + 1, 1)
    return (next_month - timedelta(days=1)).day


def not_processed_feature(site_id):
    return {
        "site_id": site_id,
        "ndvi_current": None,
        "evi_current": None,
        "ndvi_trend_5y": None,
        "sentinel2_scene_count": 0,
        "sentinel2_candidate_scene_count": 0,
        "sentinel2_valid_pixel_count_min": 0,
        "sentinel2_valid_pixel_count_max": 0,
        "sentinel2_scene_ids": [],
        "landsat_ndvi_by_year": {},
        "landsat_scene_count_by_year": {},
        "source_status": "not_processed_limit",
    }


def vegetation_source_status(ndvi_current, evi_current, trend):
    if ndvi_current is not None and evi_current is not None and trend is not None:
        return "source_derived"
    if ndvi_current is not None or evi_current is not None or trend is not None:
        return "partial_source_derived"
    return "no_valid_observations"


def guard_partial_canonical_output(args):
    if not (args.limit or args.site_id):
        return
    if args.output.resolve() != OUTPUT_PATH.resolve():
        return
    raise SystemExit(
        "Refusing to overwrite the canonical vegetation extract during a partial run; "
        "pass --output to write a debug artifact."
    )


def source_metadata(args):
    return {
        "dataset_id": "vegetation_indices",
        "name": "Sentinel-2/Landsat vegetation indices",
        "providers": ["Element84 Earth Search", "Microsoft Planetary Computer", "ESA/Copernicus", "USGS/NASA"],
        "sentinel2_collection": SENTINEL_COLLECTION,
        "landsat_collection": LANDSAT_COLLECTION,
        "sentinel2_stac_url": "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a",
        "landsat_stac_url": "https://planetarycomputer.microsoft.com/api/stac/v1/collections/landsat-c2-l2",
        "current_window": {"start": args.current_start, "end": args.current_end},
        "trend_years": parse_years(args.trend_years),
        "trend_month_window": [args.trend_month_start, args.trend_month_end],
        "landsat_trend_enabled": args.include_landsat_trend,
        "cloud_cover_lt": args.cloud_cover,
        "max_sentinel_scenes": args.max_sentinel_scenes,
        "max_landsat_scenes_per_year": args.max_landsat_scenes_per_year,
        "extraction_method": "STAC search plus rasterio polygon masks over public COG spectral assets; Sentinel-2 SCL and Landsat QA_PIXEL masks remove clouds/shadows/snow/fill.",
        "scoring_policy": "Overrides placeholder NDVI/EVI feature fields when source-derived or partial-source-derived values are available.",
    }


def relative_path(path):
    try:
        return str(Path(path).resolve().relative_to(ROOT))
    except ValueError:
        return str(Path(path).resolve())


if __name__ == "__main__":
    main()
