#!/usr/bin/env python3

import argparse
import gzip
import json
import math
import shutil
import sys
import urllib.request
from pathlib import Path

import numpy as np
import rasterio
from rasterio.mask import mask

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
RAW_DIR = ROOT / "data/raw/chirps"
OUTPUT_PATH = ROOT / "data/features/source_extracts/chirps_rainfall.json"

BASE_URL = "https://data.chc.ucsb.edu/products/CHIRPS-2.0/africa_monthly/tifs"
FILENAME_TEMPLATE = "chirps-v2.0.{year}.{month:02d}.tif.gz"
NODATA_FALLBACK = -9999


def main():
    args = parse_args()
    if args.start_year > args.end_year:
        raise SystemExit("--start-year must be <= --end-year")

    candidates = json.loads(CANDIDATES_PATH.read_text())
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    periods = [
        (year, month)
        for year in range(args.start_year, args.end_year + 1)
        for month in range(1, 13)
    ]

    local_rasters = {}
    missing = []
    for year, month in periods:
        try:
            local_rasters[(year, month)] = ensure_raster(year, month)
        except Exception as exc:
            missing.append({"year": year, "month": month, "error": str(exc)})

    if missing:
        write_blocker_output(candidates, args, periods, missing)
        raise SystemExit(
            f"Blocked: {len(missing)} CHIRPS monthly files could not be fetched. "
            f"Wrote scaffold details to {OUTPUT_PATH.relative_to(ROOT)}"
        )

    rows = [
        extract_feature(feature, local_rasters, periods)
        for feature in candidates["features"]
    ]

    output = {
        "source": source_metadata(args, periods),
        "features": rows,
    }

    OUTPUT_PATH.write_text(json.dumps(output, indent=2) + "\n")
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract source-derived monthly/annual CHIRPS rainfall means for candidate sites."
    )
    parser.add_argument("--start-year", type=int, default=2021)
    parser.add_argument("--end-year", type=int, default=2025)
    return parser.parse_args()


def ensure_raster(year, month):
    gz_path = RAW_DIR / FILENAME_TEMPLATE.format(year=year, month=month)
    tif_path = gz_path.with_suffix("")
    if tif_path.exists() and tif_path.stat().st_size > 0:
        return tif_path

    if not gz_path.exists() or gz_path.stat().st_size == 0:
        url = f"{BASE_URL}/{gz_path.name}"
        print(f"Downloading {url}", file=sys.stderr)
        urllib.request.urlretrieve(url, gz_path)

    with gzip.open(gz_path, "rb") as source, tif_path.open("wb") as target:
        shutil.copyfileobj(source, target)

    return tif_path


def extract_feature(feature, local_rasters, periods):
    monthly_values = {}
    annual_totals = {}
    valid_pixel_counts = {}

    for year, month in periods:
        mean_mm, valid_pixels = mean_rainfall_for_geometry(
            local_rasters[(year, month)], feature["geometry"]
        )
        monthly_values[(year, month)] = mean_mm
        valid_pixel_counts[(year, month)] = valid_pixels

    for year in sorted({year for year, _ in periods}):
        values = [monthly_values[(year, month)] for month in range(1, 13)]
        annual_totals[year] = sum(values) if all(value is not None for value in values) else None

    valid_annual_totals = [
        value for value in annual_totals.values() if value is not None and math.isfinite(value)
    ]
    valid_months = {
        key: value
        for key, value in monthly_values.items()
        if value is not None and math.isfinite(value)
    }

    if not valid_annual_totals:
        return {
            "site_id": feature["properties"]["site_id"],
            "rainfall_mean_mm": None,
            "rainfall_annual_mean_mm": None,
            "rainfall_monthly_mean_mm": {f"{month:02d}": None for month in range(1, 13)},
            "rainfall_reliability_score": None,
            "chirps_valid_month_count": 0,
            "chirps_valid_pixel_count_min": 0,
            "source_status": "no_valid_pixels",
        }

    monthly_climatology = {
        f"{month:02d}": rounded_mean(
            valid_months[(year, month)]
            for year in sorted({year for year, _ in periods})
            if (year, month) in valid_months
        )
        for month in range(1, 13)
    }
    annual_mean = round(float(np.mean(valid_annual_totals)), 3)

    return {
        "site_id": feature["properties"]["site_id"],
        "rainfall_mean_mm": annual_mean,
        "rainfall_annual_mean_mm": annual_mean,
        "rainfall_annual_totals_mm": {
            str(year): round(value, 3) if value is not None else None
            for year, value in sorted(annual_totals.items())
        },
        "rainfall_monthly_mean_mm": monthly_climatology,
        "rainfall_reliability_score": rainfall_reliability(valid_annual_totals),
        "chirps_valid_month_count": len(valid_months),
        "chirps_valid_pixel_count_min": min(valid_pixel_counts.values()),
        "chirps_valid_pixel_count_max": max(valid_pixel_counts.values()),
        "source_status": "source_derived",
    }


def mean_rainfall_for_geometry(raster_path, geometry):
    with rasterio.open(raster_path) as dataset:
        try:
            data, _ = mask(dataset, [geometry], crop=True, filled=False, all_touched=True)
        except ValueError:
            return None, 0
        nodata = dataset.nodata if dataset.nodata is not None else NODATA_FALLBACK

    band = data[0].astype("float64")
    valid = ~np.ma.getmaskarray(band)
    values = np.asarray(band.filled(np.nan), dtype="float64")
    valid = valid & np.isfinite(values) & (values != nodata) & (values > NODATA_FALLBACK)
    if not np.any(valid):
        return None, 0

    return round(float(np.mean(values[valid])), 3), int(np.count_nonzero(valid))


def rounded_mean(values):
    clean = [value for value in values if value is not None and math.isfinite(value)]
    if not clean:
        return None
    return round(float(np.mean(clean)), 3)


def rainfall_reliability(annual_totals):
    if len(annual_totals) < 2:
        return None

    mean = float(np.mean(annual_totals))
    if mean <= 0:
        return None

    coefficient_of_variation = float(np.std(annual_totals, ddof=0) / mean)
    return round(max(0.0, min(1.0, 1.0 - coefficient_of_variation)), 3)


def write_blocker_output(candidates, args, periods, missing):
    output = {
        "source": source_metadata(args, periods),
        "features": [
            {
                "site_id": feature["properties"]["site_id"],
                "rainfall_mean_mm": None,
                "rainfall_annual_mean_mm": None,
                "rainfall_monthly_mean_mm": {f"{month:02d}": None for month in range(1, 13)},
                "rainfall_reliability_score": None,
                "source_status": "blocked_source_unavailable",
            }
            for feature in candidates["features"]
        ],
        "blocker": {
            "reason": "One or more official CHIRPS monthly GeoTIFF files could not be downloaded.",
            "missing_files": missing,
            "next_action": "Verify the CHIRPS monthly Africa endpoint, or rerun with a year range whose monthly files exist.",
        },
    }
    OUTPUT_PATH.write_text(json.dumps(output, indent=2) + "\n")


def source_metadata(args, periods):
    return {
        "dataset_id": "chirps_v2_africa_monthly",
        "name": "CHIRPS v2.0 Africa Monthly Rainfall",
        "source_url": "https://www.chc.ucsb.edu/data/chirps",
        "access_url_template": f"{BASE_URL}/{FILENAME_TEMPLATE}",
        "spatial_resolution": "0.05 degree",
        "units": "millimeters per month",
        "year_range": [args.start_year, args.end_year],
        "month_count": len(periods),
        "extraction_method": "rasterio mask over candidate polygons; monthly mean rainfall per site, annual totals from monthly means",
        "note": "Official no-auth CHIRPS monthly Africa GeoTIFFs from the UCSB Climate Hazards Center. Raw rasters are cached locally under data/raw/chirps and excluded from git.",
    }


if __name__ == "__main__":
    main()
