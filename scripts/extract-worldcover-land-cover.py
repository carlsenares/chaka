#!/usr/bin/env python3

import json
import math
import sys
import urllib.request
from collections import Counter
from pathlib import Path

import rasterio
from rasterio.mask import mask

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
RAW_DIR = ROOT / "data/raw/esa_worldcover"
OUTPUT_PATH = ROOT / "data/features/source_extracts/worldcover_land_cover.json"

BASE_URL = "https://esa-worldcover.s3.amazonaws.com/v200/2021/map"
TILE_TEMPLATE = "ESA_WorldCover_10m_2021_v200_{lat}{lon}_Map.tif"

WORLD_COVER_CLASSES = {
    10: ("tree_cover", "Tree cover"),
    20: ("shrubland", "Shrubland"),
    30: ("grassland", "Grassland"),
    40: ("cropland", "Cropland"),
    50: ("built_up", "Built-up"),
    60: ("bare_sparse_vegetation", "Bare / sparse vegetation"),
    70: ("snow_ice", "Snow and ice"),
    80: ("water", "Permanent water bodies"),
    90: ("herbaceous_wetland", "Herbaceous wetland"),
    95: ("mangroves", "Mangroves"),
    100: ("moss_lichen", "Moss and lichen"),
}

MIX_KEYS = ["tree_cover", "cropland", "grassland", "built_up", "water", "other"]


def main():
    candidates = json.loads(CANDIDATES_PATH.read_text())
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    needed_tiles = sorted(tile_id for feature in candidates["features"] for tile_id in tiles_for_feature(feature))
    for tile_id in sorted(set(needed_tiles)):
        ensure_tile(tile_id)

    rows = [extract_feature(feature) for feature in candidates["features"]]

    output = {
        "source": {
            "dataset_id": "esa_worldcover",
            "name": "ESA WorldCover 2021 v200",
            "source_url": "https://esa-worldcover.org/en/data-access",
            "access_url_template": f"{BASE_URL}/{TILE_TEMPLATE}",
            "spatial_resolution": "10m",
            "classes": {str(code): label for code, (_, label) in WORLD_COVER_CLASSES.items()},
            "extraction_method": "rasterio mask over candidate polygons; pixel counts by ESA WorldCover class",
            "note": "Source-derived land-cover extraction. Candidate cells are small enough that intersecting tiles are cached locally.",
        },
        "features": rows,
    }

    OUTPUT_PATH.write_text(json.dumps(output, indent=2) + "\n")
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")


def tiles_for_feature(feature):
    bounds = geometry_bounds(feature["geometry"])
    min_lon, min_lat, max_lon, max_lat = bounds
    lon_starts = range(floor_to_tile(min_lon), floor_to_tile(max_lon) + 1, 3)
    lat_starts = range(floor_to_tile(min_lat), floor_to_tile(max_lat) + 1, 3)
    return [format_tile(lat, lon) for lat in lat_starts for lon in lon_starts]


def ensure_tile(tile_id):
    local_path = RAW_DIR / TILE_TEMPLATE.format(lat=tile_id[:3], lon=tile_id[3:])
    if local_path.exists() and local_path.stat().st_size > 0:
        with rasterio.open(local_path):
            pass
        return local_path

    url = f"{BASE_URL}/{local_path.name}"
    print(f"Downloading {url}", file=sys.stderr)
    temp_path = local_path.with_suffix(local_path.suffix + ".tmp")
    try:
        urllib.request.urlretrieve(url, temp_path)
        with rasterio.open(temp_path):
            pass
        temp_path.replace(local_path)
    finally:
        if temp_path.exists():
            temp_path.unlink()
    return local_path


def extract_feature(feature):
    counts = Counter()
    valid_pixels = 0

    for tile_id in tiles_for_feature(feature):
        tile_path = ensure_tile(tile_id)
        with rasterio.open(tile_path) as dataset:
            try:
                data, _ = mask(dataset, [feature["geometry"]], crop=True, filled=True, nodata=0)
            except ValueError:
                continue

        band = data[0]
        for value, count in zip(*unique_counts(band)):
            value = int(value)
            if value == 0:
                continue
            counts[value] += int(count)
            valid_pixels += int(count)

    if valid_pixels == 0:
        return {
            "site_id": feature["properties"]["site_id"],
            "land_cover_primary": None,
            "land_cover_mix": {key: None for key in MIX_KEYS},
            "worldcover_class_fractions": {},
            "valid_pixel_count": 0,
            "source_status": "no_valid_pixels",
        }

    class_fractions = {
        str(code): round(count / valid_pixels, 6) for code, count in sorted(counts.items())
    }
    mix = mix_from_counts(counts, valid_pixels)
    primary_class = counts.most_common(1)[0][0]

    return {
        "site_id": feature["properties"]["site_id"],
        "land_cover_primary": land_cover_primary(primary_class, mix),
        "land_cover_mix": mix,
        "worldcover_primary_class": primary_class,
        "worldcover_primary_label": WORLD_COVER_CLASSES.get(primary_class, ("other", "Other"))[1],
        "worldcover_class_fractions": class_fractions,
        "valid_pixel_count": valid_pixels,
        "source_status": "source_derived",
    }


def mix_from_counts(counts, valid_pixels):
    grouped = {key: 0 for key in MIX_KEYS}
    for code, count in counts.items():
        key = WORLD_COVER_CLASSES.get(code, ("other", "Other"))[0]
        if key == "shrubland":
            key = "other"
        elif key == "bare_sparse_vegetation":
            key = "other"
        elif key == "herbaceous_wetland":
            key = "other"
        elif key == "mangroves":
            key = "tree_cover"
        elif key == "moss_lichen":
            key = "other"
        elif key == "snow_ice":
            key = "other"

        grouped[key if key in grouped else "other"] += count

    return {key: round(grouped[key] / valid_pixels, 6) for key in MIX_KEYS}


def land_cover_primary(primary_class, mix):
    if primary_class == 40 and mix["tree_cover"] >= 0.08:
        return "cropland_tree_mosaic"
    if primary_class == 40:
        return "cropland_dominant"
    if primary_class == 10 and mix["cropland"] >= 0.15:
        return "forest_agriculture_edge"
    if primary_class == 10:
        return "tree_cover_dominant"
    if primary_class == 30:
        return "grassland_dominant"
    if primary_class == 20:
        return "shrubland_dominant"
    if primary_class == 60:
        return "bare_sparse_vegetation"
    if primary_class == 50:
        return "built_up_dominant"
    if primary_class == 80:
        return "water_dominant"
    return "mixed_other"


def unique_counts(array):
    import numpy as np

    return np.unique(array, return_counts=True)


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


def floor_to_tile(value):
    return math.floor(value / 3) * 3


def format_tile(lat, lon):
    lat_prefix = "N" if lat >= 0 else "S"
    lon_prefix = "E" if lon >= 0 else "W"
    return f"{lat_prefix}{abs(lat):02d}{lon_prefix}{abs(lon):03d}"


if __name__ == "__main__":
    main()
