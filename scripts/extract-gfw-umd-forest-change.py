#!/usr/bin/env python3

import argparse
import json
import math
import sys
import urllib.request
from pathlib import Path

import numpy as np
import rasterio
from rasterio.mask import mask

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
RAW_DIR = ROOT / "data/raw/gfw_umd_forest_change"
OUTPUT_PATH = ROOT / "data/features/source_extracts/gfw_umd_forest_change.json"

VERSION = "GFC-2025-v1.13"
BASE_URL = f"https://storage.googleapis.com/earthenginepartners-hansen/{VERSION}"
LAYERS = ["treecover2000", "lossyear", "datamask"]
TILE_TEMPLATE = "Hansen_GFC-2025-v1.13_{layer}_{tile}.tif"


def main():
    args = parse_args()
    candidates = json.loads(args.candidates.read_text())
    required_tiles = sorted({tile for feature in candidates["features"] for tile in tiles_for_feature(feature)})
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.raw_dir.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        print_plan(args, required_tiles, candidates)
        return

    local_rasters = {
        (layer, tile): ensure_tile(args, layer, tile)
        for tile in required_tiles
        for layer in LAYERS
    }
    rows = [
        extract_feature(feature, local_rasters, args.tree_cover_threshold, args.recent_loss_start_year)
        for feature in candidates["features"]
    ]
    output = {
        "source": source_metadata(args, required_tiles),
        "features": rows,
    }
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    print(f"Wrote {relative_path(args.output)}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract Hansen/GFW/UMD tree-cover and loss proxies for Chaka candidate sites."
    )
    parser.add_argument("--candidates", type=Path, default=CANDIDATES_PATH)
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--tree-cover-threshold", type=int, default=30)
    parser.add_argument("--recent-loss-start-year", type=int, default=2019)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def print_plan(args, required_tiles, candidates):
    print("GFW/UMD forest-change extraction dry run")
    print(f"Candidate file: {relative_path(args.candidates)}")
    print(f"Output: {relative_path(args.output)}")
    print(f"Version: {VERSION}")
    print(f"Tree-cover threshold: {args.tree_cover_threshold}%")
    print(f"Recent loss start year: {args.recent_loss_start_year}")
    print(f"Candidate sites: {len(candidates['features'])}")
    print(f"Required Hansen tiles ({len(required_tiles)}):")
    for tile in required_tiles:
        print(f"  - {tile}")
        for layer in LAYERS:
            path = local_tile_path(args.raw_dir, layer, tile)
            status = "present" if path.exists() and path.stat().st_size > 0 else "missing"
            print(f"    {layer}: {status} ({tile_url(layer, tile)})")
    print("")
    print("Raw Hansen tiles are cached under data/raw/gfw_umd_forest_change/ and excluded from git.")


def ensure_tile(args, layer, tile):
    path = local_tile_path(args.raw_dir, layer, tile)
    if path.exists() and path.stat().st_size > 0:
        with rasterio.open(path):
            pass
        return path

    url = tile_url(layer, tile)
    print(f"Downloading {url}", file=sys.stderr)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    try:
        urllib.request.urlretrieve(url, temp_path)
        with rasterio.open(temp_path):
            pass
        temp_path.replace(path)
    finally:
        if temp_path.exists():
            temp_path.unlink()
    return path


def extract_feature(feature, local_rasters, tree_cover_threshold, recent_loss_start_year):
    tree_values = []
    loss_values = []
    valid_pixel_counts = []
    pixel_area_ha_values = []
    contributing_tiles = []

    for tile in tiles_for_feature(feature):
        tile_values = extract_from_tile(
            feature,
            local_rasters[("treecover2000", tile)],
            local_rasters[("lossyear", tile)],
            local_rasters[("datamask", tile)],
        )
        if tile_values is None:
            continue
        treecover, lossyear, pixel_area_ha = tile_values
        if treecover.size == 0:
            continue
        tree_values.append(treecover)
        loss_values.append(lossyear)
        valid_pixel_counts.append(treecover.size)
        pixel_area_ha_values.append(np.full(treecover.shape, pixel_area_ha, dtype="float64"))
        contributing_tiles.append(tile)

    site_id = feature["properties"]["site_id"]
    if not tree_values:
        return empty_feature(site_id, tree_cover_threshold, recent_loss_start_year, "no_valid_pixels", contributing_tiles)

    treecover = np.concatenate(tree_values).astype("float64")
    lossyear = np.concatenate(loss_values).astype("float64")
    pixel_area_ha = np.concatenate(pixel_area_ha_values)
    forest_mask = treecover >= tree_cover_threshold
    loss_mask = forest_mask & (lossyear > 0)
    recent_loss_code = max(1, recent_loss_start_year - 2000)
    recent_loss_mask = loss_mask & (lossyear >= recent_loss_code)

    baseline_area = float(np.sum(pixel_area_ha[forest_mask]))
    loss_area = float(np.sum(pixel_area_ha[loss_mask]))
    recent_loss_area = float(np.sum(pixel_area_ha[recent_loss_mask]))
    loss_pct = (loss_area / baseline_area * 100) if baseline_area > 0 else 0.0
    recent_loss_pct = (recent_loss_area / baseline_area * 100) if baseline_area > 0 else 0.0
    mean_treecover = float(np.mean(treecover))
    forest_fraction = float(np.count_nonzero(forest_mask) / treecover.size)

    return {
        "site_id": site_id,
        "forest_loss_score": forest_loss_score(loss_pct, recent_loss_pct, baseline_area),
        "tree_cover_context_score": tree_cover_context_score(mean_treecover, forest_fraction),
        "treecover2000_mean_pct": round(mean_treecover, 3),
        "treecover2000_forest_pixel_fraction": round(forest_fraction, 6),
        "baseline_tree_cover_area_ha": round(baseline_area, 3),
        "loss_area_ha_total": round(loss_area, 3),
        "loss_area_ha_recent": round(recent_loss_area, 3),
        "loss_pct_of_baseline": round(loss_pct, 3),
        "recent_loss_pct_of_baseline": round(recent_loss_pct, 3),
        "tree_cover_threshold_pct": tree_cover_threshold,
        "recent_loss_start_year": recent_loss_start_year,
        "gfw_valid_pixel_count": int(sum(valid_pixel_counts)),
        "source_tiles": contributing_tiles,
        "source_status": "source_derived",
    }


def extract_from_tile(feature, treecover_path, lossyear_path, datamask_path):
    try:
        with rasterio.open(treecover_path) as tree_dataset:
            tree_data, _ = mask(tree_dataset, [feature["geometry"]], crop=True, filled=False, all_touched=True)
            tree_transform = tree_dataset.transform
        with rasterio.open(lossyear_path) as loss_dataset:
            loss_data, _ = mask(loss_dataset, [feature["geometry"]], crop=True, filled=False, all_touched=True)
        with rasterio.open(datamask_path) as mask_dataset:
            datamask_data, _ = mask(mask_dataset, [feature["geometry"]], crop=True, filled=False, all_touched=True)
    except ValueError:
        return None

    treecover = np.asarray(tree_data[0].astype("float64").filled(np.nan), dtype="float64")
    lossyear = np.asarray(loss_data[0].astype("float64").filled(0), dtype="float64")
    datamask = np.asarray(datamask_data[0].astype("float64").filled(0), dtype="float64")
    valid = (
        ~np.ma.getmaskarray(tree_data[0])
        & ~np.ma.getmaskarray(loss_data[0])
        & ~np.ma.getmaskarray(datamask_data[0])
        & np.isfinite(treecover)
        & (datamask == 1)
        & (treecover >= 0)
        & (treecover <= 100)
    )
    if not np.any(valid):
        return None

    return treecover[valid], lossyear[valid], pixel_area_ha(tree_transform)


def empty_feature(site_id, tree_cover_threshold, recent_loss_start_year, status, source_tiles):
    return {
        "site_id": site_id,
        "forest_loss_score": None,
        "tree_cover_context_score": None,
        "treecover2000_mean_pct": None,
        "treecover2000_forest_pixel_fraction": None,
        "baseline_tree_cover_area_ha": None,
        "loss_area_ha_total": None,
        "loss_area_ha_recent": None,
        "loss_pct_of_baseline": None,
        "recent_loss_pct_of_baseline": None,
        "tree_cover_threshold_pct": tree_cover_threshold,
        "recent_loss_start_year": recent_loss_start_year,
        "gfw_valid_pixel_count": 0,
        "source_tiles": source_tiles,
        "source_status": status,
    }


def forest_loss_score(loss_pct, recent_loss_pct, baseline_area_ha):
    # Higher means stronger recent/historical tree-cover disturbance signal for restoration screening.
    baseline_weight = max(0.0, min(1.0, baseline_area_ha / 100.0))
    raw_score = max(0, min(100, loss_pct * 2.5 + recent_loss_pct * 5))
    return int(round(raw_score * baseline_weight))


def tree_cover_context_score(mean_treecover, forest_fraction):
    return int(round(max(0, min(100, mean_treecover * 0.7 + forest_fraction * 100 * 0.3))))


def tiles_for_feature(feature):
    min_lon, min_lat, max_lon, max_lat = geometry_bounds(feature["geometry"])
    lon_starts = range(floor_to_10(min_lon), floor_to_10(max_lon) + 1, 10)
    lat_tops = range(ceil_to_10(max_lat), ceil_to_10(min_lat) - 1, -10)
    return [format_hansen_tile(lat_top, lon_start) for lat_top in lat_tops for lon_start in lon_starts]


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


def format_hansen_tile(lat_top, lon_start):
    lat_prefix = "N" if lat_top >= 0 else "S"
    lon_prefix = "E" if lon_start >= 0 else "W"
    return f"{abs(lat_top):02d}{lat_prefix}_{abs(lon_start):03d}{lon_prefix}"


def pixel_area_ha(transform):
    lat_center = transform.f + transform.e / 2
    height_m = abs(transform.e) * 111_320
    width_m = abs(transform.a) * 111_320 * math.cos(math.radians(lat_center))
    return width_m * height_m / 10_000


def source_metadata(args, required_tiles):
    return {
        "dataset_id": "gfw_umd_forest_change",
        "name": "Hansen Global Forest Change",
        "version": VERSION,
        "provider": "University of Maryland / Global Forest Watch",
        "source_url": f"{BASE_URL}/download.html",
        "access_url_template": f"{BASE_URL}/{TILE_TEMPLATE}",
        "spatial_resolution": "approximately 30m",
        "tree_cover_threshold_pct": args.tree_cover_threshold,
        "recent_loss_start_year": args.recent_loss_start_year,
        "required_tiles": required_tiles,
        "raw_cache": relative_path(args.raw_dir),
        "extraction_method": "rasterio polygon mask over Hansen treecover2000, lossyear, and datamask tiles; baseline tree-cover area uses configurable tree-cover threshold; forest_loss_score down-weights loss percentages when baseline tree-cover area is below 100 ha",
        "note": "Tree-cover loss is a disturbance signal for woody vegetation at least about 5m tall. It is not direct carbon loss, confirmed deforestation, or field-verified degradation.",
    }


def tile_url(layer, tile):
    return f"{BASE_URL}/{TILE_TEMPLATE.format(layer=layer, tile=tile)}"


def local_tile_path(raw_dir, layer, tile):
    return raw_dir / TILE_TEMPLATE.format(layer=layer, tile=tile)


def relative_path(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    main()
