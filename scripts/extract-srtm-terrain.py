#!/usr/bin/env python3

import argparse
import json
import math
import sys
import zipfile
from pathlib import Path

import numpy as np
import rasterio
from rasterio.features import geometry_mask
from rasterio.mask import geometry_window
from rasterio.windows import Window

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
RAW_DIR = ROOT / "data/raw/srtm"
OUTPUT_PATH = ROOT / "data/features/source_extracts/srtm_terrain.json"

EARTHDATA_NOTE = (
    "Official NASA/USGS SRTMGL1 access normally requires NASA Earthdata or "
    "Google Earth Engine authentication. This script will not use unofficial "
    "mirrors or fabricate terrain values."
)


def main():
    args = parse_args()
    candidates = json.loads(args.candidates.read_text())
    required_tiles = sorted(
        {tile for feature in candidates["features"] for tile in tiles_for_feature(feature)}
    )

    if args.dry_run:
        print_plan(required_tiles, args.raw_dir, args.candidates)
        return 0

    tile_paths = {tile: find_tile_path(args.raw_dir, tile) for tile in required_tiles}
    missing_tiles = [tile for tile, path in tile_paths.items() if path is None]
    if missing_tiles:
        print_blocker(missing_tiles, args.raw_dir)
        return 2

    args.output.parent.mkdir(parents=True, exist_ok=True)
    rows = [
        extract_feature(feature, tile_paths)
        for feature in candidates["features"]
    ]
    output = {
        "source": {
            "dataset_id": "srtm_dem",
            "name": "SRTM 1 Arc-Second Global DEM (SRTMGL1)",
            "provider": "NASA/USGS",
            "source_url": "https://lpdaac.usgs.gov/products/srtmgl1v003/",
            "registry_source_url": "https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003",
            "spatial_resolution": "1 arc-second, approximately 30m",
            "access_method": "local official SRTMGL1 .hgt or .hgt.zip tiles",
            "raw_tile_dir": relative_path(args.raw_dir),
            "required_tiles": required_tiles,
            "extraction_method": (
                "rasterio windowed polygon mask over SRTM elevation; slope derived "
                "from elevation gradients with longitude cell width adjusted by latitude"
            ),
            "note": "Source-derived only when official SRTM tiles are supplied locally.",
        },
        "features": rows,
    }
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    print(f"Wrote {relative_path(args.output)}")
    return 0


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract source-derived SRTM elevation and slope summaries for candidate sites."
    )
    parser.add_argument("--candidates", type=Path, default=CANDIDATES_PATH)
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List required official SRTM tile names and exit without writing output.",
    )
    return parser.parse_args()


def print_plan(required_tiles, raw_dir, candidates_path):
    print("SRTM terrain extraction dry run")
    print(f"Candidate file: {relative_path(candidates_path)}")
    print(f"Required official SRTMGL1 tiles ({len(required_tiles)}):")
    for tile in required_tiles:
        status = "present" if find_tile_path(raw_dir, tile) else "missing"
        print(f"  - {tile}.hgt or {tile}.hgt.zip: {status}")
    print("")
    print(EARTHDATA_NOTE)
    print(f"Place official tiles under {relative_path(raw_dir)}/, then run without --dry-run.")


def print_blocker(missing_tiles, raw_dir):
    print("Blocked: missing official SRTMGL1 source tiles.", file=sys.stderr)
    print(EARTHDATA_NOTE, file=sys.stderr)
    print(f"Expected local directory: {relative_path(raw_dir)}/", file=sys.stderr)
    print("Missing tiles:", file=sys.stderr)
    for tile in missing_tiles:
        print(f"  - {tile}.hgt or {tile}.hgt.zip", file=sys.stderr)
    print("No terrain JSON was written.", file=sys.stderr)


def find_tile_path(raw_dir, tile):
    for path in [raw_dir / f"{tile}.hgt", raw_dir / f"{tile}.HGT"]:
        if path.exists() and path.stat().st_size > 0:
            return path

    for path in [raw_dir / f"{tile}.hgt.zip", raw_dir / f"{tile}.HGT.zip", raw_dir / f"{tile}.zip"]:
        member = zip_member(path, tile)
        if member:
            return f"/vsizip/{path}/{member}"
    return None


def zip_member(path, tile):
    if not path.exists() or path.stat().st_size == 0:
        return None
    try:
        with zipfile.ZipFile(path) as archive:
            for member in archive.namelist():
                if Path(member).name.lower() == f"{tile.lower()}.hgt":
                    return member
    except zipfile.BadZipFile:
        return None
    return None


def extract_feature(feature, tile_paths):
    elevation_values = []
    slope_values = []
    contributing_tiles = []

    for tile in tiles_for_feature(feature):
        path = tile_paths[tile]
        with rasterio.open(str(path)) as dataset:
            values = extract_from_dataset(dataset, feature["geometry"])
        if values is None:
            continue
        elevation, slope = values
        if elevation.size:
            elevation_values.append(elevation)
            slope_values.append(slope)
            contributing_tiles.append(tile)

    site_id = feature["properties"]["site_id"]
    if not elevation_values:
        return {
            "site_id": site_id,
            "elevation_mean_m": None,
            "elevation_min_m": None,
            "elevation_max_m": None,
            "slope_mean_deg": None,
            "slope_p75_deg": None,
            "slope_p90_deg": None,
            "slope_risk_score": None,
            "valid_pixel_count": 0,
            "source_tiles": contributing_tiles,
            "source_status": "no_valid_pixels",
        }

    elevation = np.concatenate(elevation_values)
    slope = np.concatenate(slope_values)
    slope_mean = float(np.mean(slope))
    return {
        "site_id": site_id,
        "elevation_mean_m": round(float(np.mean(elevation)), 2),
        "elevation_min_m": round(float(np.min(elevation)), 2),
        "elevation_max_m": round(float(np.max(elevation)), 2),
        "slope_mean_deg": round(slope_mean, 2),
        "slope_p75_deg": round(float(np.percentile(slope, 75)), 2),
        "slope_p90_deg": round(float(np.percentile(slope, 90)), 2),
        "slope_risk_score": slope_risk_score(slope_mean),
        "valid_pixel_count": int(elevation.size),
        "source_tiles": contributing_tiles,
        "source_status": "source_derived",
    }


def extract_from_dataset(dataset, geometry):
    try:
        window = geometry_window(dataset, [geometry], pad_x=1, pad_y=1)
    except ValueError:
        return None

    window = clamp_window(window.round_offsets().round_lengths(), dataset.width, dataset.height)
    if window.width < 3 or window.height < 3:
        return None

    elevation = dataset.read(1, window=window).astype("float64")
    transform = dataset.window_transform(window)
    inside_mask = geometry_mask(
        [geometry],
        out_shape=elevation.shape,
        transform=transform,
        invert=True,
        all_touched=False,
    )
    valid_mask = inside_mask & np.isfinite(elevation)
    if dataset.nodata is not None:
        valid_mask &= elevation != dataset.nodata
    valid_mask &= elevation > -1000

    if not np.any(valid_mask):
        return None

    filled_elevation = np.array(elevation, copy=True)
    if np.any(~valid_mask):
        replacement = float(np.mean(elevation[valid_mask]))
        filled_elevation[~valid_mask] = replacement
    slope = slope_degrees(filled_elevation, transform)
    valid_mask &= np.isfinite(slope)
    if not np.any(valid_mask):
        return None

    return elevation[valid_mask], slope[valid_mask]


def clamp_window(window, width, height):
    col_off = max(0, int(window.col_off))
    row_off = max(0, int(window.row_off))
    col_end = min(width, int(window.col_off + window.width))
    row_end = min(height, int(window.row_off + window.height))
    return Window(col_off, row_off, col_end - col_off, row_end - row_off)


def slope_degrees(elevation, transform):
    lat_center = transform.f + transform.e * (elevation.shape[0] / 2)
    y_resolution_m = abs(transform.e) * 111_320
    x_resolution_m = abs(transform.a) * 111_320 * math.cos(math.radians(lat_center))
    gradient_y, gradient_x = np.gradient(elevation, y_resolution_m, x_resolution_m)
    return np.degrees(np.arctan(np.hypot(gradient_x, gradient_y)))


def slope_risk_score(slope_mean_deg):
    # Interpretable erosion-risk proxy: low below 5 deg, high above 25 deg.
    return int(round(max(0, min(100, (slope_mean_deg - 5) / 20 * 100))))


def tiles_for_feature(feature):
    min_lon, min_lat, max_lon, max_lat = geometry_bounds(feature["geometry"])
    lon_starts = degree_starts(min_lon, max_lon)
    lat_starts = degree_starts(min_lat, max_lat)
    return [format_hgt_tile(lat, lon) for lat in lat_starts for lon in lon_starts]


def degree_starts(min_value, max_value):
    end = math.floor(max_value)
    if max_value > min_value and float(max_value).is_integer():
        end -= 1
    return range(math.floor(min_value), end + 1)


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


def format_hgt_tile(lat, lon):
    lat_prefix = "N" if lat >= 0 else "S"
    lon_prefix = "E" if lon >= 0 else "W"
    return f"{lat_prefix}{abs(lat):02d}{lon_prefix}{abs(lon):03d}"


def relative_path(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    raise SystemExit(main())
