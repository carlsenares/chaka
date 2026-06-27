#!/usr/bin/env python3

import argparse
import json
import shutil
import sys
import urllib.request
import zipfile
from collections import Counter
from pathlib import Path

import numpy as np
import rasterio
from rasterio.mask import mask
from rasterio.warp import transform_geom

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
RAW_DIR = ROOT / "data/raw/ghsl"
OUTPUT_PATH = ROOT / "data/features/source_extracts/ghsl_settlement.json"

DEFAULT_YEAR = 2020
DEFAULT_VERSION = "R2023A"
DEFAULT_FILENAME = "GHS_SMOD_E2020_GLOBE_R2023A_54009_1000_V1_0.zip"
DEFAULT_URL = (
    "https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_SMOD_GLOBE_R2023A/"
    "GHS_SMOD_E2020_GLOBE_R2023A_54009_1000/V1-0/"
    "GHS_SMOD_E2020_GLOBE_R2023A_54009_1000_V1_0.zip"
)
DEFAULT_TIF = "GHS_SMOD_E2020_GLOBE_R2023A_54009_1000_V1_0.tif"

CLASS_LABELS = {
    10: "water",
    11: "very_low_density_rural",
    12: "low_density_rural",
    13: "rural_cluster",
    21: "suburban_or_peri_urban",
    22: "semi_dense_urban_cluster",
    23: "dense_urban_cluster",
    30: "urban_centre",
}


def main():
    args = parse_args()
    candidates = json.loads(args.candidates.read_text())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.raw_dir.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        print_plan(args, candidates)
        return

    zip_path = ensure_zip(args)
    tif_member = find_tif_member(zip_path, args.tif_member)
    raster_path = f"/vsizip/{zip_path}/{tif_member}"
    rows = [extract_feature(feature, raster_path) for feature in candidates["features"]]
    output = {
        "source": source_metadata(args, zip_path, tif_member),
        "features": rows,
    }
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    print(f"Wrote {relative_path(args.output)}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract GHSL settlement model context for candidate sites."
    )
    parser.add_argument("--candidates", type=Path, default=CANDIDATES_PATH)
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--zip-name", default=DEFAULT_FILENAME)
    parser.add_argument("--tif-member", default=DEFAULT_TIF)
    parser.add_argument("--year", type=int, default=DEFAULT_YEAR)
    parser.add_argument("--version", default=DEFAULT_VERSION)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def print_plan(args, candidates):
    zip_path = args.raw_dir / args.zip_name
    print("GHSL settlement extraction dry run")
    print(f"Candidate file: {relative_path(args.candidates)}")
    print(f"Output: {relative_path(args.output)}")
    print(f"Year: {args.year}")
    print(f"Version: {args.version}")
    print(f"Source URL: {args.url}")
    print(f"Local zip: {relative_path(zip_path)}")
    print(f"Zip status: {'present' if zip_path.exists() and zip_path.stat().st_size > 0 else 'missing'}")
    print(f"Candidate sites: {len(candidates['features'])}")
    print("")
    print("The extractor downloads the official GHSL SMOD zip if missing and reads the GeoTIFF from the zip cache.")


def ensure_zip(args):
    zip_path = args.raw_dir / args.zip_name
    if zip_path.exists() and zip_path.stat().st_size > 0:
        validate_zip(zip_path, args.tif_member)
        return zip_path

    print(f"Downloading {args.url}", file=sys.stderr)
    temp_path = zip_path.with_name(f"{zip_path.stem}.tmp{zip_path.suffix}")
    try:
        with urllib.request.urlopen(args.url, timeout=90) as response, temp_path.open("wb") as target:
            shutil.copyfileobj(response, target)
        validate_zip(temp_path, args.tif_member)
        temp_path.replace(zip_path)
    finally:
        if temp_path.exists():
            temp_path.unlink()
    return zip_path


def validate_zip(zip_path, tif_member):
    with zipfile.ZipFile(zip_path) as archive:
        names = set(archive.namelist())
    if tif_member not in names:
        raise SystemExit(f"GHSL zip {relative_path(zip_path)} does not contain {tif_member}")
    with rasterio.open(f"/vsizip/{zip_path}/{tif_member}"):
        pass


def find_tif_member(zip_path, preferred_member):
    with zipfile.ZipFile(zip_path) as archive:
        names = archive.namelist()
    if preferred_member in names:
        return preferred_member
    tif_members = [name for name in names if name.lower().endswith(".tif")]
    if len(tif_members) == 1:
        return tif_members[0]
    raise SystemExit(f"Could not select GHSL GeoTIFF from {relative_path(zip_path)}")


def extract_feature(feature, raster_path):
    props = feature["properties"]
    with rasterio.open(raster_path) as dataset:
        geometry = transform_geom("EPSG:4326", dataset.crs, feature["geometry"], precision=6)
        try:
            data, _ = mask(dataset, [geometry], crop=True, filled=False, all_touched=True)
        except ValueError:
            return empty_feature(props["site_id"], "no_intersection")
        nodata = dataset.nodata

    band = data[0].astype("float64")
    values = np.asarray(band.filled(np.nan), dtype="float64")
    valid = ~np.ma.getmaskarray(band) & np.isfinite(values)
    if nodata is not None:
        valid = valid & (values != nodata)
    valid = valid & np.isin(values, list(CLASS_LABELS))

    if not np.any(valid):
        return empty_feature(props["site_id"], "no_valid_pixels")

    class_values = values[valid].astype("int16")
    counts = Counter(int(value) for value in class_values)
    total = int(np.count_nonzero(valid))
    fractions = {
        CLASS_LABELS[class_code]: round(counts.get(class_code, 0) / total, 6)
        for class_code in sorted(CLASS_LABELS)
    }
    urban_centre_fraction = fractions["urban_centre"]
    dense_settlement_fraction = fractions["semi_dense_urban_cluster"] + fractions["dense_urban_cluster"] + fractions["urban_centre"]
    rural_or_low_density_fraction = (
        fractions["very_low_density_rural"] +
        fractions["low_density_rural"] +
        fractions["rural_cluster"]
    )
    settlement_context_score = round(
        urban_centre_fraction * 100 +
        fractions["dense_urban_cluster"] * 85 +
        fractions["semi_dense_urban_cluster"] * 70 +
        fractions["suburban_or_peri_urban"] * 45 +
        fractions["rural_cluster"] * 25 +
        fractions["low_density_rural"] * 10
    )
    return {
        "site_id": props["site_id"],
        "ghsl_smod_class_fractions": fractions,
        "ghsl_urban_centre_fraction": round(urban_centre_fraction, 6),
        "ghsl_dense_settlement_fraction": round(dense_settlement_fraction, 6),
        "ghsl_rural_or_low_density_fraction": round(rural_or_low_density_fraction, 6),
        "ghsl_settlement_context_score": int(max(0, min(100, settlement_context_score))),
        "ghsl_valid_pixel_count": total,
        "source_status": "source_derived",
    }


def empty_feature(site_id, status):
    return {
        "site_id": site_id,
        "ghsl_smod_class_fractions": {},
        "ghsl_urban_centre_fraction": None,
        "ghsl_dense_settlement_fraction": None,
        "ghsl_rural_or_low_density_fraction": None,
        "ghsl_settlement_context_score": None,
        "ghsl_valid_pixel_count": 0,
        "source_status": status,
    }


def source_metadata(args, zip_path, tif_member):
    return {
        "dataset_id": "ghsl_settlement",
        "name": f"GHSL Settlement Model {args.year}",
        "provider": "European Commission Joint Research Centre",
        "source_url": "https://human-settlement.emergency.copernicus.eu/ghs_smod2023.php",
        "access_url": args.url,
        "version": args.version,
        "year": args.year,
        "product": "GHS-SMOD global settlement model",
        "spatial_resolution": "1 km",
        "crs": "ESRI:54009 World Mollweide",
        "license": "European Commission reuse terms; verify redistribution terms before committing raw data.",
        "raw_zip": relative_path(zip_path),
        "source_file_size_bytes": zip_path.stat().st_size,
        "tif_member": tif_member,
        "class_labels": CLASS_LABELS,
        "extraction_method": "rasterio polygon mask over reprojected candidate geometries; settlement classes summarized as class fractions and a context score",
        "note": "Settlement model context only. It cross-checks WorldPop and OSM signals and does not prove access, tenure, or community willingness.",
    }


def relative_path(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    main()
