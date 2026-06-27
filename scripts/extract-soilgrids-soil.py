#!/usr/bin/env python3

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
import rasterio
from rasterio.mask import mask
from rasterio.warp import transform_geom

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
RAW_DIR = ROOT / "data/raw/soilgrids"
OUTPUT_PATH = ROOT / "data/features/source_extracts/soilgrids_soil.json"

BASE_URL = "https://files.isric.org/soilgrids/latest/data"
VSICURL_TEMPLATE = (
    "/vsicurl?max_retry=3&retry_delay=1&list_dir=no&url="
    f"{BASE_URL}/{{property}}/{{property}}_{{depth}}cm_mean.vrt"
)
DEPTH_INTERVALS = [
    ("0-5", 5),
    ("5-15", 10),
    ("15-30", 15),
]
PROPERTIES = {
    "soc": {
        "output_key": "soilgrids_soc_g_kg",
        "score_key": "soil_organic_carbon_score",
        "conversion_factor": 10.0,
        "unit": "g/kg",
    },
    "phh2o": {
        "output_key": "soilgrids_ph_h2o",
        "score_key": "soil_ph_suitability_score",
        "conversion_factor": 10.0,
        "unit": "pH",
    },
}


def main():
    args = parse_args()
    candidates = json.loads(CANDIDATES_PATH.read_text())
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    try:
        datasets = open_source_datasets()
        if args.dry_run:
            close_datasets(datasets)
            print("Dry run opened SoilGrids VRTs successfully.")
            return

        rows = [extract_feature(feature, datasets) for feature in candidates["features"]]
        close_datasets(datasets)
        output = {
            "source": source_metadata(),
            "features": rows,
        }
        OUTPUT_PATH.write_text(json.dumps(output, indent=2) + "\n")
        print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")
    except Exception as exc:
        write_blocker_output(candidates, exc)
        raise SystemExit(
            f"Blocked: SoilGrids extraction failed. "
            f"Wrote blocker details to {OUTPUT_PATH.relative_to(ROOT)}"
        ) from exc


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract bounded SoilGrids topsoil SOC and pH proxies for candidate sites."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Open the required remote VRTs, but do not read polygons or write output.",
    )
    return parser.parse_args()


def open_source_datasets():
    datasets = {}
    for property_name in PROPERTIES:
        for depth, _ in DEPTH_INTERVALS:
            url = source_url(property_name, depth)
            print(f"Opening {url}", file=sys.stderr)
            datasets[(property_name, depth)] = rasterio.open(url)
    return datasets


def close_datasets(datasets):
    for dataset in datasets.values():
        dataset.close()


def extract_feature(feature, datasets):
    site_id = feature["properties"]["site_id"]
    row = {
        "site_id": site_id,
        "soil_organic_carbon_score": None,
        "soil_ph_suitability_score": None,
        "soilgrids_soc_0_30cm_g_kg_mean": None,
        "soilgrids_ph_h2o_0_30cm_mean": None,
        "soilgrids_depth_means": {},
        "soilgrids_valid_pixel_count_min": 0,
        "soilgrids_valid_pixel_count_max": 0,
        "source_status": "source_derived",
    }

    all_counts = []
    for property_name, config in PROPERTIES.items():
        depth_means = {}
        weighted_values = []
        weighted_depths = []

        for depth, thickness_cm in DEPTH_INTERVALS:
            dataset = datasets[(property_name, depth)]
            mean_value, valid_pixels = polygon_mean(dataset, feature["geometry"], config)
            depth_means[depth] = {
                "mean": mean_value,
                "unit": config["unit"],
                "valid_pixel_count": valid_pixels,
            }
            all_counts.append(valid_pixels)
            if mean_value is not None:
                weighted_values.append(mean_value * thickness_cm)
                weighted_depths.append(thickness_cm)

        row["soilgrids_depth_means"][property_name] = depth_means
        topsoil_mean = (
            round(float(sum(weighted_values) / sum(weighted_depths)), 3)
            if weighted_depths
            else None
        )

        if property_name == "soc":
            row["soilgrids_soc_0_30cm_g_kg_mean"] = topsoil_mean
            row["soil_organic_carbon_score"] = soc_score(topsoil_mean)
        elif property_name == "phh2o":
            row["soilgrids_ph_h2o_0_30cm_mean"] = topsoil_mean
            row["soil_ph_suitability_score"] = ph_suitability_score(topsoil_mean)

    valid_counts = [count for count in all_counts if count > 0]
    if valid_counts:
        row["soilgrids_valid_pixel_count_min"] = min(valid_counts)
        row["soilgrids_valid_pixel_count_max"] = max(valid_counts)
    else:
        row["source_status"] = "no_valid_pixels"

    return row


def polygon_mean(dataset, geometry, config):
    projected_geometry = transform_geom("EPSG:4326", dataset.crs, geometry, precision=3)
    try:
        data, _ = mask(dataset, [projected_geometry], crop=True, filled=False, all_touched=True)
    except ValueError:
        return None, 0

    band = data[0].astype("float64")
    values = np.asarray(band.filled(np.nan), dtype="float64")
    mask_array = np.ma.getmaskarray(band)
    valid = ~mask_array & np.isfinite(values)
    if dataset.nodata is not None:
        valid = valid & (values != dataset.nodata)
    valid = valid & (values > -30000)

    if not np.any(valid):
        return None, 0

    converted = values[valid] / config["conversion_factor"]
    return round(float(np.mean(converted)), 3), int(np.count_nonzero(valid))


def soc_score(value):
    if value is None or not math.isfinite(value):
        return None
    # Topsoil SOC quality proxy: 5 g/kg is poor, 30 g/kg is strong for MVP ranking.
    return round(clamp((value - 5.0) / 25.0) * 100.0)


def ph_suitability_score(value):
    if value is None or not math.isfinite(value):
        return None
    # Restoration suitability proxy centered around near-neutral pH, with broad tolerance.
    if value <= 4.5 or value >= 9.0:
        return 0
    if value <= 6.5:
        return round(clamp((value - 4.5) / 2.0) * 100.0)
    return round(clamp((9.0 - value) / 2.5) * 100.0)


def clamp(value):
    return max(0.0, min(1.0, value))


def source_url(property_name, depth):
    return VSICURL_TEMPLATE.format(property=property_name, depth=depth)


def https_url(property_name, depth):
    return f"{BASE_URL}/{property_name}/{property_name}_{depth}cm_mean.vrt"


def source_metadata():
    return {
        "dataset_id": "soilgrids_2_0_topsoil",
        "name": "SoilGrids 2.0 topsoil soil properties",
        "source_url": "https://docs.isric.org/globaldata/soilgrids/WebDav.html",
        "access_url_template": f"{BASE_URL}/{{property}}/{{property}}_{{depth}}cm_mean.vrt",
        "properties": {
            "soc": {
                "description": "Soil organic carbon content in fine earth fraction",
                "mapped_unit": "dg/kg",
                "conversion_factor": 10,
                "conventional_unit": "g/kg",
            },
            "phh2o": {
                "description": "Soil pH in water",
                "mapped_unit": "pH x 10",
                "conversion_factor": 10,
                "conventional_unit": "pH",
            },
        },
        "depth_intervals_cm": [depth for depth, _ in DEPTH_INTERVALS],
        "topsoil_aggregation": "0-30 cm thickness-weighted mean from 0-5, 5-15, and 15-30 cm SoilGrids mean rasters",
        "spatial_resolution": "250m",
        "extraction_method": "rasterio mask over candidate polygons using SoilGrids WebDAV VRTs via GDAL /vsicurl; all_touched=True",
        "score_methods": {
            "soil_organic_carbon_score": "Linear 0-100 score from 5 to 30 g/kg topsoil SOC, clamped.",
            "soil_ph_suitability_score": "Triangular 0-100 suitability score: 100 at pH 6.5, 0 at pH <= 4.5 or >= 9.0.",
        },
        "accessed_vrts": [
            https_url(property_name, depth)
            for property_name in PROPERTIES
            for depth, _ in DEPTH_INTERVALS
        ],
        "note": "Official no-auth ISRIC SoilGrids WebDAV VRT access. Full global rasters are not downloaded; GDAL reads bounded windows for each candidate polygon.",
    }


def write_blocker_output(candidates, exc):
    output = {
        "source": source_metadata(),
        "features": [
            {
                "site_id": feature["properties"]["site_id"],
                "soil_organic_carbon_score": None,
                "soil_ph_suitability_score": None,
                "soilgrids_soc_0_30cm_g_kg_mean": None,
                "soilgrids_ph_h2o_0_30cm_mean": None,
                "soilgrids_depth_means": {},
                "source_status": "blocked_source_unavailable",
            }
            for feature in candidates["features"]
        ],
        "blocker": {
            "reason": "Could not safely complete bounded extraction from official ISRIC SoilGrids WebDAV VRTs.",
            "error": f"{type(exc).__name__}: {exc}",
            "next_action": "Verify network/GDAL access to https://files.isric.org/soilgrids/latest/data/ and rerun scripts/extract-soilgrids-soil.py.",
        },
    }
    OUTPUT_PATH.write_text(json.dumps(output, indent=2) + "\n")


if __name__ == "__main__":
    main()
