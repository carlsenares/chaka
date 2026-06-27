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
RAW_DIR = ROOT / "data/raw/worldpop"
OUTPUT_PATH = ROOT / "data/features/source_extracts/worldpop_population.json"

DEFAULT_YEAR = 2020
DEFAULT_URL = "https://data.worldpop.org/GIS/Population/Global_2000_2020/2020/ETH/eth_ppp_2020_UNadj.tif"
DEFAULT_FILENAME = "eth_ppp_2020_UNadj.tif"


def main():
    args = parse_args()
    candidates = json.loads(args.candidates.read_text())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        print_plan(args, candidates)
        return

    raster_path = ensure_raster(args)
    rows = [extract_feature(feature, raster_path) for feature in candidates["features"]]
    output = {
        "source": source_metadata(args, raster_path),
        "features": rows,
    }
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    print(f"Wrote {relative_path(args.output)}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract source-derived WorldPop population pressure scores for candidate sites."
    )
    parser.add_argument("--candidates", type=Path, default=CANDIDATES_PATH)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--year", type=int, default=DEFAULT_YEAR)
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--raw-path", type=Path, default=RAW_DIR / DEFAULT_FILENAME)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def print_plan(args, candidates):
    print("WorldPop population extraction dry run")
    print(f"Candidate file: {relative_path(args.candidates)}")
    print(f"Output: {relative_path(args.output)}")
    print(f"Year: {args.year}")
    print(f"Source URL: {args.url}")
    print(f"Local raster: {relative_path(args.raw_path)}")
    print(f"Raster status: {'present' if args.raw_path.exists() and args.raw_path.stat().st_size > 0 else 'missing'}")
    print(f"Candidate sites: {len(candidates['features'])}")
    print("")
    print("The official WorldPop server does not support GDAL range reads for this file.")
    print("The extractor downloads and caches the full GeoTIFF locally before extracting site summaries.")


def ensure_raster(args):
    if args.raw_path.exists() and args.raw_path.stat().st_size > 0:
        return args.raw_path

    print(f"Downloading {args.url}", file=sys.stderr)
    urllib.request.urlretrieve(args.url, args.raw_path)
    return args.raw_path


def extract_feature(feature, raster_path):
    props = feature["properties"]
    area_km2 = float(props["area_ha"]) / 100.0

    with rasterio.open(raster_path) as dataset:
        try:
            data, _ = mask(dataset, [feature["geometry"]], crop=True, filled=False, all_touched=True)
        except ValueError:
            return empty_feature(props["site_id"], "no_intersection")
        nodata = dataset.nodata

    band = data[0].astype("float64")
    valid = ~np.ma.getmaskarray(band)
    values = np.asarray(band.filled(np.nan), dtype="float64")
    valid = valid & np.isfinite(values) & (values >= 0)
    if nodata is not None:
        valid = valid & (values != nodata)

    if not np.any(valid):
        return empty_feature(props["site_id"], "no_valid_pixels")

    population_sum = float(np.sum(values[valid]))
    density = population_sum / area_km2 if area_km2 > 0 else None
    return {
        "site_id": props["site_id"],
        "worldpop_population_sum": round(population_sum, 3),
        "worldpop_population_density_per_km2": round(density, 3) if density is not None else None,
        "population_pressure_score": population_pressure_score(density),
        "worldpop_valid_pixel_count": int(np.count_nonzero(valid)),
        "source_status": "source_derived",
    }


def empty_feature(site_id, status):
    return {
        "site_id": site_id,
        "worldpop_population_sum": None,
        "worldpop_population_density_per_km2": None,
        "population_pressure_score": None,
        "worldpop_valid_pixel_count": 0,
        "source_status": status,
    }


def population_pressure_score(density):
    if density is None or not math.isfinite(density):
        return None
    # Interpretable rural screening proxy: low below 25 people/km2, high above 225 people/km2.
    return int(round(max(0, min(100, (density - 25) / 200 * 100))))


def source_metadata(args, raster_path):
    return {
        "dataset_id": "worldpop_population",
        "name": f"WorldPop Ethiopia UN-adjusted population counts {args.year}",
        "provider": "WorldPop, University of Southampton",
        "source_url": "https://hub.worldpop.org/geodata/listing?id=29",
        "access_url": args.url,
        "license": "WorldPop open data; cite WorldPop dataset metadata for derived use.",
        "year": args.year,
        "spatial_resolution": "3 arc-seconds, approximately 100m at the equator",
        "units": "estimated people per pixel",
        "raw_raster": relative_path(raster_path),
        "source_file_size_bytes": raster_path.stat().st_size,
        "extraction_method": "rasterio polygon mask over WorldPop population-count GeoTIFF; population density normalized to a 0-100 pressure score",
        "note": "Population pressure is a livelihood/context proxy. It does not prove community willingness, tenure, or implementation feasibility.",
    }


def relative_path(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    main()
