#!/usr/bin/env python3

import argparse
import datetime as dt
import hashlib
import json
import math
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
RAW_DIR = ROOT / "data/raw/gbif_biodiversity"
OUTPUT_PATH = ROOT / "data/features/source_extracts/gbif_biodiversity.json"

GBIF_SEARCH_URL = "https://api.gbif.org/v1/occurrence/search"
EBIRD_EOD_DATASET_KEY = "4fa7b334-ce0d-4e88-aaae-2e0c138d049e"
BALE_PLANTS_DATASET_KEY = "c7346e49-7056-4f1e-ac64-bde1286f5cec"
ALLOWED_LICENSES = {"CC0_1_0", "CC_BY_4_0", "CC_BY_NC_4_0"}
ALLOWED_BASIS = {"HUMAN_OBSERVATION", "MACHINE_OBSERVATION", "PRESERVED_SPECIMEN", "MATERIAL_SAMPLE"}
SOURCE_DERIVED_MIN_OCCURRENCES = 20
SOURCE_DERIVED_MIN_SPECIES = 5
EXTRACTOR_VERSION = "0.1.0"


def main():
    args = parse_args()
    candidates_text = args.candidates.read_text()
    candidates = json.loads(candidates_text)
    candidates_sha256 = hashlib.sha256(candidates_text.encode("utf-8")).hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.raw_dir.mkdir(parents=True, exist_ok=True)
    run_date = dt.date.today().isoformat()
    extracted_at_utc = dt.datetime.now(dt.timezone.utc).isoformat()

    features = candidates["features"]
    if args.site_id:
        features = [feature for feature in features if feature["properties"]["site_id"] == args.site_id]
    if args.limit:
        features = features[: args.limit]

    if args.dry_run:
        print_plan(args, candidates, features, run_date)
        return

    rows = []
    failures = []
    for index, feature in enumerate(features):
        site_id = feature["properties"]["site_id"]
        print(f"Fetching GBIF biodiversity context for {site_id} ({index + 1}/{len(features)})", file=sys.stderr)
        try:
            raw_records, unfiltered_count, query_meta = fetch_site_records(feature, args, run_date)
            rows.append(summarize_site(feature, raw_records, unfiltered_count, query_meta, args))
        except Exception as exc:
            failures.append({"site_id": site_id, "error": f"{type(exc).__name__}: {exc}"})
            rows.append(blocked_feature(site_id, feature["properties"]["area_ha"], "blocked_source_unavailable"))
        if index < len(features) - 1:
            time.sleep(args.throttle_seconds)

    if args.limit or args.site_id:
        processed_ids = {row["site_id"] for row in rows}
        for feature in candidates["features"]:
            site_id = feature["properties"]["site_id"]
            if site_id not in processed_ids:
                rows.append(blocked_feature(site_id, feature["properties"]["area_ha"], "not_processed_limit"))

    output = {
        "source": source_metadata(args, run_date, extracted_at_utc, candidates_sha256),
        "features": rows,
    }
    if failures:
        output["blocker"] = {
            "reason": "One or more GBIF occurrence searches failed.",
            "failures": failures,
            "next_action": "Retry later, use --site-id to isolate failures, or switch to authenticated GBIF downloads for larger AOIs.",
        }

    args.output.write_text(json.dumps(output, indent=2) + "\n")
    if failures and len(failures) == len(features):
        raise SystemExit(f"Blocked: all GBIF searches failed. Wrote {relative_path(args.output)}")
    print(f"Wrote {relative_path(args.output)}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract GBIF occurrence biodiversity context for candidate sites."
    )
    parser.add_argument("--candidates", type=Path, default=CANDIDATES_PATH)
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--start-date", default="2000-01-01")
    parser.add_argument("--max-coordinate-uncertainty-m", type=float, default=5000.0)
    parser.add_argument("--page-limit", type=int, default=300)
    parser.add_argument("--max-records-per-site", type=int, default=10000)
    parser.add_argument("--timeout-seconds", type=int, default=45)
    parser.add_argument("--throttle-seconds", type=float, default=0.35)
    parser.add_argument("--retry-count", type=int, default=3)
    parser.add_argument("--refresh-cache", action="store_true")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--site-id", default=None)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def print_plan(args, candidates, features, run_date):
    print("GBIF biodiversity extraction dry run")
    print(f"Candidate file: {relative_path(args.candidates)}")
    print(f"Output: {relative_path(args.output)}")
    print(f"Candidate sites to process: {len(features)} of {len(candidates['features'])}")
    print(f"Date filter: {args.start_date},{run_date}")
    print(f"Max coordinate uncertainty: {args.max_coordinate_uncertainty_m} m")
    print(f"Allowed licenses: {', '.join(sorted(ALLOWED_LICENSES))}")
    print(f"Raw cache: {relative_path(args.raw_dir)}")
    if features:
        params = base_query_params(features[0], args, run_date, filtered=True)
        print("Example query:")
        print(f"{GBIF_SEARCH_URL}?{urllib.parse.urlencode(params, doseq=True)}")


def fetch_site_records(feature, args, run_date):
    unfiltered_count = fetch_count(base_query_params(feature, args, run_date, filtered=False), args)
    params = base_query_params(feature, args, run_date, filtered=True)
    query_url = build_url(params)
    query_meta = {
        "gbif_query_hash": hashlib.sha256(query_url.encode("utf-8")).hexdigest()[:24],
        "gbif_query_url": query_url,
    }
    records = []
    offset = 0
    while True:
        if offset >= args.max_records_per_site:
            raise RuntimeError(f"GBIF search exceeded max records per site ({args.max_records_per_site}); use async download mode")
        page_params = {**params, "limit": args.page_limit, "offset": offset}
        payload = fetch_json(page_params, args)
        records.extend(payload.get("results", []))
        if payload.get("endOfRecords", True):
            break
        offset += args.page_limit
    return records, unfiltered_count, query_meta


def fetch_count(params, args):
    payload = fetch_json({**params, "limit": 0, "offset": 0}, args)
    return int(payload.get("count") or 0)


def fetch_json(params, args):
    url = build_url(params)
    cache_dir = args.raw_dir / "search" / hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]
    cache_path = cache_dir / "response.json"
    if cache_path.exists() and cache_path.stat().st_size > 0 and not args.refresh_cache:
        return json.loads(cache_path.read_text())

    cache_dir.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={
        "User-Agent": "chaka-gbif-biodiversity/0.1",
        "Accept": "application/json",
    })
    for attempt in range(args.retry_count):
        try:
            with urllib.request.urlopen(request, timeout=args.timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
            cache_path.write_text(json.dumps(payload, indent=2) + "\n")
            (cache_dir / "manifest.json").write_text(json.dumps({"url": url, "retrieved_at_utc": dt.datetime.now(dt.timezone.utc).isoformat()}, indent=2) + "\n")
            return payload
        except urllib.error.HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == args.retry_count - 1:
                raise
        except urllib.error.URLError:
            if attempt == args.retry_count - 1:
                raise
        time.sleep(2 ** attempt)
    raise RuntimeError("GBIF request failed after retries")


def build_url(params):
    return f"{GBIF_SEARCH_URL}?{urllib.parse.urlencode(params, doseq=True)}"


def base_query_params(feature, args, run_date, filtered):
    params = {
        "hasCoordinate": "true",
        "hasGeospatialIssue": "false",
        "occurrenceStatus": "PRESENT",
        "country": "ET",
        "geometry": geometry_to_wkt(feature["geometry"]),
        "eventDate": f"{args.start_date},{run_date}",
    }
    if filtered:
        params["coordinateUncertaintyInMeters"] = f"0,{int(args.max_coordinate_uncertainty_m)}"
        params["license"] = list(sorted(ALLOWED_LICENSES))
        params["basisOfRecord"] = list(sorted(ALLOWED_BASIS))
    return params


def summarize_site(feature, records, unfiltered_count, query_meta, args):
    site_id = feature["properties"]["site_id"]
    area_km2 = float(feature["properties"]["area_ha"]) / 100
    species_keys = {record.get("speciesKey") for record in records if record.get("speciesKey")}
    eod_records = [record for record in records if record.get("datasetKey") == EBIRD_EOD_DATASET_KEY]
    eod_species = {record.get("speciesKey") for record in eod_records if record.get("speciesKey")}
    bale_plant_records = [record for record in records if record.get("datasetKey") == BALE_PLANTS_DATASET_KEY]
    bale_plant_species = {record.get("speciesKey") for record in bale_plant_records if record.get("speciesKey")}
    plant_species = {record.get("speciesKey") for record in records if record.get("kingdomKey") == 6 or record.get("kingdom") == "Plantae"}
    threatened_records = [record for record in records if threat_rank(record.get("iucnRedListCategory")) >= threat_rank("NT")]
    recent_records = [record for record in records if is_recent(record.get("eventDate"))]
    uncertainties = [float(record["coordinateUncertaintyInMeters"]) for record in records if is_number(record.get("coordinateUncertaintyInMeters"))]
    basis_counts = Counter(record.get("basisOfRecord") or "UNKNOWN" for record in records)
    license_counts = Counter(record.get("license") or "UNKNOWN" for record in records)
    dataset_counts = Counter(record.get("datasetKey") or "UNKNOWN" for record in records)
    taxon_counts = Counter(record.get("species") or record.get("scientificName") or "UNKNOWN" for record in records)
    bias_risk = sampling_bias_risk(len(records), len(species_keys), dataset_counts, uncertainties, recent_records)
    context_score = biodiversity_context_score(len(records), len(species_keys), len(plant_species), len(eod_species), bias_risk)

    return {
        "site_id": site_id,
        **query_meta,
        "occurrence_count": len(records),
        "unfiltered_occurrence_count": unfiltered_count,
        "rejected_or_filtered_occurrence_count": max(0, unfiltered_count - len(records)),
        "species_count": len(species_keys),
        "eod_ebird_occurrence_count": len(eod_records),
        "eod_ebird_species_count": len(eod_species),
        "bale_plant_occurrence_count": len(bale_plant_records),
        "bale_plant_species_count": len(bale_plant_species),
        "plant_species_count": len(plant_species),
        "threatened_or_near_threatened_species_count": len({record.get("speciesKey") for record in threatened_records if record.get("speciesKey")}),
        "recent_occurrence_count_5y": len(recent_records),
        "observation_density_per_km2": round(len(records) / area_km2, 3) if area_km2 > 0 else None,
        "basis_counts": dict(sorted(basis_counts.items())),
        "license_counts": dict(sorted(license_counts.items())),
        "dataset_counts_top": top_datasets(records, dataset_counts),
        "top_taxa": [{"taxon": key, "count": count} for key, count in taxon_counts.most_common(10)],
        "coordinate_uncertainty_median_m": percentile(uncertainties, 50),
        "coordinate_uncertainty_p90_m": percentile(uncertainties, 90),
        "sampling_bias_risk_score": bias_risk,
        "biodiversity_context_score": context_score,
        "source_status": "source_derived" if len(records) >= SOURCE_DERIVED_MIN_OCCURRENCES and len(species_keys) >= SOURCE_DERIVED_MIN_SPECIES else "insufficient_records",
    }


def blocked_feature(site_id, area_ha, status):
    return {
        "site_id": site_id,
        "gbif_query_hash": None,
        "gbif_query_url": None,
        "occurrence_count": 0,
        "unfiltered_occurrence_count": 0,
        "rejected_or_filtered_occurrence_count": 0,
        "species_count": 0,
        "eod_ebird_occurrence_count": 0,
        "eod_ebird_species_count": 0,
        "bale_plant_occurrence_count": 0,
        "bale_plant_species_count": 0,
        "plant_species_count": 0,
        "threatened_or_near_threatened_species_count": 0,
        "recent_occurrence_count_5y": 0,
        "observation_density_per_km2": 0 if area_ha else None,
        "basis_counts": {},
        "license_counts": {},
        "dataset_counts_top": [],
        "top_taxa": [],
        "coordinate_uncertainty_median_m": None,
        "coordinate_uncertainty_p90_m": None,
        "sampling_bias_risk_score": 100,
        "biodiversity_context_score": None,
        "source_status": status,
    }


def top_datasets(records, dataset_counts):
    examples = {}
    for record in records:
        key = record.get("datasetKey") or "UNKNOWN"
        if key in examples:
            continue
        examples[key] = {
            "dataset_key": key,
            "dataset_title": record.get("datasetTitle") or record.get("datasetName") or None,
            "publishing_org_key": record.get("publishingOrgKey") or None,
            "license": record.get("license") or None,
        }
    return [
        {
            **examples.get(key, {"dataset_key": key, "dataset_title": None, "publishing_org_key": None, "license": None}),
            "count": count,
        }
        for key, count in dataset_counts.most_common(5)
    ]


def sampling_bias_risk(record_count, species_count, dataset_counts, uncertainties, recent_records):
    risk = 100
    if record_count >= 20:
        risk -= 25
    if species_count >= 5:
        risk -= 25
    if recent_records:
        risk -= 10
    if uncertainties and percentile(uncertainties, 90) <= 1000:
        risk -= 10
    if record_count > 0:
        dominant_share = dataset_counts.most_common(1)[0][1] / record_count
        if dominant_share > 0.8:
            risk += 15
    return int(max(0, min(100, risk)))


def biodiversity_context_score(record_count, species_count, plant_species_count, bird_species_count, bias_risk):
    if record_count < SOURCE_DERIVED_MIN_OCCURRENCES or species_count < SOURCE_DERIVED_MIN_SPECIES:
        return None
    raw = min(60, species_count * 4) + min(20, plant_species_count * 3) + min(20, bird_species_count * 2)
    capped = min(raw, max(0, 100 - bias_risk / 2))
    return int(round(capped))


def is_recent(event_date):
    if not event_date:
        return False
    try:
        year = int(str(event_date)[:4])
    except ValueError:
        return False
    return year >= dt.date.today().year - 5


def threat_rank(category):
    ranks = {"LC": 0, "NT": 1, "VU": 2, "EN": 3, "CR": 4, "EW": 5, "EX": 6}
    return ranks.get(str(category or "").upper(), -1)


def percentile(values, percent):
    if not values:
        return None
    ordered = sorted(values)
    index = (len(ordered) - 1) * percent / 100
    lower = math.floor(index)
    upper = math.ceil(index)
    if lower == upper:
        return round(ordered[int(index)], 3)
    return round(ordered[lower] * (upper - index) + ordered[upper] * (index - lower), 3)


def is_number(value):
    try:
        return value is not None and math.isfinite(float(value))
    except (TypeError, ValueError):
        return False


def geometry_to_wkt(geometry):
    if geometry["type"] == "Polygon":
        rings = [ring_to_wkt(ring) for ring in geometry["coordinates"]]
        return f"POLYGON({', '.join(rings)})"
    if geometry["type"] == "MultiPolygon":
        polygons = []
        for polygon in geometry["coordinates"]:
            polygons.append(f"({', '.join(ring_to_wkt(ring) for ring in polygon)})")
        return f"MULTIPOLYGON({', '.join(polygons)})"
    raise ValueError(f"Unsupported geometry type: {geometry['type']}")


def ring_to_wkt(ring):
    coords = list(ring)
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    return f"({', '.join(f'{lon} {lat}' for lon, lat in coords)})"


def source_metadata(args, run_date, extracted_at_utc, candidates_sha256):
    return {
        "dataset_id": "gbif_biodiversity",
        "name": "GBIF occurrence biodiversity context",
        "extractor_version": EXTRACTOR_VERSION,
        "extracted_at_utc": extracted_at_utc,
        "candidate_sites_sha256": candidates_sha256,
        "source_url": "https://www.gbif.org/occurrence/search",
        "api_url": GBIF_SEARCH_URL,
        "raw_cache": relative_path(args.raw_dir),
        "filters": {
            "hasCoordinate": True,
            "hasGeospatialIssue": False,
            "occurrenceStatus": "PRESENT",
            "country": "ET",
            "eventDate": [args.start_date, run_date],
            "coordinateUncertaintyInMeters": [0, args.max_coordinate_uncertainty_m],
            "licenses": sorted(ALLOWED_LICENSES),
            "basisOfRecord": sorted(ALLOWED_BASIS),
        },
        "tagged_subsets": {
            "eod_ebird_dataset_key": EBIRD_EOD_DATASET_KEY,
            "bale_plants_dataset_key": BALE_PLANTS_DATASET_KEY,
        },
        "source_status_thresholds": {
            "source_derived_min_occurrences": SOURCE_DERIVED_MIN_OCCURRENCES,
            "source_derived_min_species": SOURCE_DERIVED_MIN_SPECIES,
        },
        "extraction_method": "GBIF occurrence search API by candidate WKT polygon with cached paginated responses",
        "note": "Biodiversity observation context only. Absence of records is not evidence of species absence or low biodiversity.",
    }


def relative_path(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    main()
