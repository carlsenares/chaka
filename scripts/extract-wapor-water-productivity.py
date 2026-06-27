#!/usr/bin/env python3

import argparse
import json
import math
import urllib.request
from pathlib import Path

import numpy as np
import rasterio
from rasterio.mask import mask

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
RAW_DIR = ROOT / "data/raw/wapor"
OUTPUT_PATH = ROOT / "data/features/source_extracts/wapor_water_productivity.json"

WORKSPACE = "WAPOR-3"
API_BASE = f"https://data.apps.fao.org/gismgr/api/v2/catalog/workspaces/{WORKSPACE}"
DEFAULT_YEARS = [2023, 2024, 2025]
PRODUCTS = {
    "aeti": {
        "mapset": "L2-AETI-A",
        "field": "wapor_aeti_mm",
        "mean_field": "wapor_aeti_annual_mean_mm",
        "label": "Actual EvapoTranspiration and Interception",
    },
    "tbp": {
        "mapset": "L2-TBP-A",
        "field": "wapor_total_biomass_production_kg_ha",
        "mean_field": "wapor_total_biomass_production_mean_kg_ha",
        "label": "Total Biomass Production",
    },
    "gbwp": {
        "mapset": "L2-GBWP-A",
        "field": "wapor_gross_biomass_water_productivity_kg_m3",
        "mean_field": "wapor_gross_biomass_water_productivity_mean_kg_m3",
        "label": "Gross Biomass Water Productivity",
    },
    "nbwp": {
        "mapset": "L2-NBWP-A",
        "field": "wapor_net_biomass_water_productivity_kg_m3",
        "mean_field": "wapor_net_biomass_water_productivity_mean_kg_m3",
        "label": "Net Biomass Water Productivity",
    },
}


def main():
    args = parse_args()
    candidates = json.loads(args.candidates.read_text())
    features = candidates["features"]
    if args.site_id:
        features = [feature for feature in features if feature["properties"]["site_id"] == args.site_id]
    if args.limit:
        features = features[: args.limit]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.raw_dir.mkdir(parents=True, exist_ok=True)
    years = parse_years(args.years)

    if args.dry_run:
        print_plan(args, candidates, features, years)
        return

    product_metadata = {key: load_product_metadata(product, args.raw_dir) for key, product in PRODUCTS.items()}
    rasters = {
        key: load_raster_index(product, years, args.raw_dir)
        for key, product in PRODUCTS.items()
    }
    rows = extract_features(features, rasters, product_metadata, years)
    if args.limit or args.site_id:
        processed_ids = {row["site_id"] for row in rows}
        for feature in candidates["features"]:
            site_id = feature["properties"]["site_id"]
            if site_id not in processed_ids:
                rows.append(not_processed_feature(site_id))
    output = {
        "source": source_metadata(args, years, product_metadata),
        "features": rows,
    }
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    print(f"Wrote {relative_path(args.output)}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract FAO WaPOR v3 annual water/productivity context for candidate sites."
    )
    parser.add_argument("--candidates", type=Path, default=CANDIDATES_PATH)
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--years", default=",".join(str(year) for year in DEFAULT_YEARS))
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--site-id", default=None)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def parse_years(value):
    years = []
    for part in str(value).split(","):
        part = part.strip()
        if not part:
            continue
        years.append(int(part))
    if not years:
        raise SystemExit("--years must include at least one year")
    return sorted(set(years))


def print_plan(args, candidates, features, years):
    print("WaPOR water/productivity extraction dry run")
    print(f"Candidate file: {relative_path(args.candidates)}")
    print(f"Output: {relative_path(args.output)}")
    print(f"Workspace: {WORKSPACE}")
    print(f"Years: {', '.join(str(year) for year in years)}")
    print(f"Candidate sites to process: {len(features)} of {len(candidates['features'])}")
    print("Products:")
    for product in PRODUCTS.values():
        print(f"  - {product['mapset']}: {product['label']}")
    print("")
    print("The extractor uses GDAL /vsicurl/ range reads against official FAO Cloud Optimized GeoTIFF URLs.")
    print("It caches only product/raster metadata under data/raw/wapor/metadata; raw rasters are not downloaded.")


def load_product_metadata(product, raw_dir):
    cache_path = metadata_cache_path(raw_dir, product["mapset"], "metadata")
    if cache_path.exists() and cache_path.stat().st_size > 0:
        return json.loads(cache_path.read_text())
    payload = fetch_json(f"{API_BASE}/mapsets/{product['mapset']}")
    response = payload["response"]
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(response, indent=2) + "\n")
    return response


def load_raster_index(product, years, raw_dir):
    cache_path = metadata_cache_path(raw_dir, product["mapset"], "rasters")
    if cache_path.exists() and cache_path.stat().st_size > 0:
        items = json.loads(cache_path.read_text())
    else:
        items = fetch_raster_items(product, cache_path)

    by_year = {}
    for item in items:
        year = raster_year(item)
        if year in years:
            by_year[year] = item
    missing = [year for year in years if year not in by_year]
    if missing:
        items = fetch_raster_items(product, cache_path)
        by_year = {}
        for item in items:
            year = raster_year(item)
            if year in years:
                by_year[year] = item
        missing = [year for year in years if year not in by_year]
    if missing:
        raise SystemExit(f"WaPOR {product['mapset']} is missing requested years: {missing}")
    return by_year


def fetch_raster_items(product, cache_path):
    payload = fetch_json(f"{API_BASE}/mapsets/{product['mapset']}/rasters?size=100&sort=code:desc")
    items = payload["response"]["items"]
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(items, indent=2) + "\n")
    return items


def fetch_json(url):
    request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "chaka-wapor/0.1"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def raster_year(item):
    for dimension in item.get("dimensions", []):
        member = dimension.get("member") or {}
        if member.get("year"):
            return int(member["year"])
    return int(item["code"].split(".")[-1])


def extract_feature(feature, rasters, product_metadata, years):
    site_id = feature["properties"]["site_id"]
    row = {"site_id": site_id}
    valid_counts = []
    missing_products = []

    for product_key, product in PRODUCTS.items():
        yearly_values = {}
        product_valid_counts = []
        for year in years:
            raster = rasters[product_key][year]
            summary = summarize_raster(feature, raster["downloadUrl"], product_metadata[product_key])
            if summary["status"] != "source_derived":
                missing_products.append(f"{product['mapset']}:{year}:{summary['status']}")
                yearly_values[str(year)] = None
                product_valid_counts.append(0)
                valid_counts.append(0)
                continue
            yearly_values[str(year)] = summary["mean"]
            product_valid_counts.append(summary["valid_pixel_count"])
            valid_counts.append(summary["valid_pixel_count"])
        row[f"{product['field']}_by_year"] = yearly_values
        row[product["mean_field"]] = mean_nullable(yearly_values.values())
        row[f"{product['field']}_valid_pixel_count_min"] = min(product_valid_counts) if product_valid_counts else 0
        row[f"{product['field']}_valid_pixel_count_max"] = max(product_valid_counts) if product_valid_counts else 0

    row["wapor_productivity_context_score"] = productivity_context_score(
        row["wapor_total_biomass_production_mean_kg_ha"],
        row["wapor_gross_biomass_water_productivity_mean_kg_m3"],
        row["wapor_net_biomass_water_productivity_mean_kg_m3"],
    )
    row["wapor_valid_pixel_count_min"] = min(valid_counts) if valid_counts else 0
    row["wapor_valid_pixel_count_max"] = max(valid_counts) if valid_counts else 0
    row["source_status"] = "source_derived" if not missing_products else "partial_source_derived"
    if missing_products:
        row["missing_products"] = missing_products
    return row


def extract_features(features, rasters, product_metadata, years):
    rows_by_site = {
        feature["properties"]["site_id"]: initial_feature(feature["properties"]["site_id"])
        for feature in features
    }
    valid_counts_by_site = {feature["properties"]["site_id"]: [] for feature in features}
    missing_by_site = {feature["properties"]["site_id"]: [] for feature in features}

    for product_key, product in PRODUCTS.items():
        for year in years:
            raster = rasters[product_key][year]
            path = f"/vsicurl/{raster['downloadUrl']}"
            scale = float(product_metadata[product_key].get("scale") if product_metadata[product_key].get("scale") is not None else 1.0)
            offset = float(product_metadata[product_key].get("offset") if product_metadata[product_key].get("offset") is not None else 0.0)
            with rasterio.open(path) as dataset:
                for feature in features:
                    site_id = feature["properties"]["site_id"]
                    summary = summarize_dataset(feature, dataset, scale, offset)
                    field_by_year = rows_by_site[site_id][f"{product['field']}_by_year"]
                    if summary["status"] != "source_derived":
                        missing_by_site[site_id].append(f"{product['mapset']}:{year}:{summary['status']}")
                        field_by_year[str(year)] = None
                        rows_by_site[site_id][f"{product['field']}_valid_counts"].append(0)
                        valid_counts_by_site[site_id].append(0)
                        continue
                    field_by_year[str(year)] = summary["mean"]
                    rows_by_site[site_id][f"{product['field']}_valid_counts"].append(summary["valid_pixel_count"])
                    valid_counts_by_site[site_id].append(summary["valid_pixel_count"])

    rows = []
    for feature in features:
        site_id = feature["properties"]["site_id"]
        row = rows_by_site[site_id]
        for product in PRODUCTS.values():
            counts = row.pop(f"{product['field']}_valid_counts")
            row[product["mean_field"]] = mean_nullable(row[f"{product['field']}_by_year"].values())
            row[f"{product['field']}_valid_pixel_count_min"] = min(counts) if counts else 0
            row[f"{product['field']}_valid_pixel_count_max"] = max(counts) if counts else 0
        row["wapor_productivity_context_score"] = productivity_context_score(
            row["wapor_total_biomass_production_mean_kg_ha"],
            row["wapor_gross_biomass_water_productivity_mean_kg_m3"],
            row["wapor_net_biomass_water_productivity_mean_kg_m3"],
        )
        valid_counts = valid_counts_by_site[site_id]
        row["wapor_valid_pixel_count_min"] = min(valid_counts) if valid_counts else 0
        row["wapor_valid_pixel_count_max"] = max(valid_counts) if valid_counts else 0
        row["source_status"] = "source_derived" if not missing_by_site[site_id] else "partial_source_derived"
        if missing_by_site[site_id]:
            row["missing_products"] = missing_by_site[site_id]
        rows.append(row)
    return rows


def initial_feature(site_id):
    row = {"site_id": site_id}
    for product in PRODUCTS.values():
        row[f"{product['field']}_by_year"] = {}
        row[f"{product['field']}_valid_counts"] = []
    return row


def not_processed_feature(site_id):
    row = {"site_id": site_id}
    for product in PRODUCTS.values():
        row[f"{product['field']}_by_year"] = {}
        row[product["mean_field"]] = None
        row[f"{product['field']}_valid_pixel_count_min"] = 0
        row[f"{product['field']}_valid_pixel_count_max"] = 0
    row["wapor_productivity_context_score"] = None
    row["wapor_valid_pixel_count_min"] = 0
    row["wapor_valid_pixel_count_max"] = 0
    row["source_status"] = "not_processed_limit"
    return row


def summarize_raster(feature, url, metadata):
    path = f"/vsicurl/{url}"
    scale = float(metadata.get("scale") if metadata.get("scale") is not None else 1.0)
    offset = float(metadata.get("offset") if metadata.get("offset") is not None else 0.0)
    try:
        with rasterio.open(path) as dataset:
            data, _ = mask(dataset, [feature["geometry"]], crop=True, filled=False, all_touched=True)
            nodata = dataset.nodata
    except ValueError:
        return {"status": "no_intersection", "mean": None, "valid_pixel_count": 0}

    band = data[0].astype("float64")
    values = np.asarray(band.filled(np.nan), dtype="float64")
    valid = ~np.ma.getmaskarray(band) & np.isfinite(values)
    if nodata is not None:
        valid &= values != nodata
    if not np.any(valid):
        return {"status": "no_valid_pixels", "mean": None, "valid_pixel_count": 0}

    scaled = values[valid] * scale + offset
    scaled = scaled[np.isfinite(scaled)]
    if scaled.size == 0:
        return {"status": "no_valid_pixels", "mean": None, "valid_pixel_count": 0}
    return {
        "status": "source_derived",
        "mean": round(float(np.mean(scaled)), 3),
        "valid_pixel_count": int(scaled.size),
    }


def summarize_dataset(feature, dataset, scale, offset):
    try:
        data, _ = mask(dataset, [feature["geometry"]], crop=True, filled=False, all_touched=True)
        nodata = dataset.nodata
    except ValueError:
        return {"status": "no_intersection", "mean": None, "valid_pixel_count": 0}

    band = data[0].astype("float64")
    values = np.asarray(band.filled(np.nan), dtype="float64")
    valid = ~np.ma.getmaskarray(band) & np.isfinite(values)
    if nodata is not None:
        valid &= values != nodata
    if not np.any(valid):
        return {"status": "no_valid_pixels", "mean": None, "valid_pixel_count": 0}

    scaled = values[valid] * scale + offset
    scaled = scaled[np.isfinite(scaled)]
    if scaled.size == 0:
        return {"status": "no_valid_pixels", "mean": None, "valid_pixel_count": 0}
    return {
        "status": "source_derived",
        "mean": round(float(np.mean(scaled)), 3),
        "valid_pixel_count": int(scaled.size),
    }


def mean_nullable(values):
    numbers = [float(value) for value in values if value is not None and math.isfinite(float(value))]
    if not numbers:
        return None
    return round(float(np.mean(numbers)), 3)


def productivity_context_score(tbp, gbwp, nbwp):
    if tbp is None and gbwp is None and nbwp is None:
        return None
    score = 0
    if tbp is not None:
        # Broad screening scale: 0 below 1 t/ha/year, 60+ around 12 t/ha/year.
        score += min(60, max(0, (float(tbp) - 1000) / 11000 * 60))
    if gbwp is not None:
        score += min(20, max(0, float(gbwp) / 3 * 20))
    if nbwp is not None:
        score += min(20, max(0, float(nbwp) / 3 * 20))
    return int(round(max(0, min(100, score))))


def source_metadata(args, years, product_metadata):
    return {
        "dataset_id": "wapor_water_productivity",
        "name": "FAO WaPOR v3 annual water/productivity context",
        "provider": "FAO WaPOR",
        "workspace": WORKSPACE,
        "api_base_url": API_BASE,
        "source_url": "https://data.apps.fao.org/wapor/",
        "years": years,
        "products": {
            key: {
                "mapset": product["mapset"],
                "label": product["label"],
                "measure_unit": product_metadata[key].get("measureUnit"),
                "scale": product_metadata[key].get("scale"),
                "offset": product_metadata[key].get("offset"),
                "spatial_resolution": "100 m",
            }
            for key, product in PRODUCTS.items()
        },
        "raw_metadata_cache": relative_path(args.raw_dir / "metadata"),
        "extraction_method": "rasterio /vsicurl/ polygon mask over official FAO WaPOR v3 L2 annual Cloud Optimized GeoTIFFs; product scale/offset applied before summarization",
        "note": "Water/productivity context only. This is not carbon stock, biodiversity evidence, or proof of implementation feasibility.",
    }


def metadata_cache_path(raw_dir, mapset, name):
    return raw_dir / "metadata" / f"{mapset}_{name}.json"


def relative_path(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    main()
