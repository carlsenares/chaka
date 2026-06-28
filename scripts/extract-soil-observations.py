#!/usr/bin/env python3

import argparse
import csv
import hashlib
import io
import json
import math
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
SOILGRIDS_PATH = ROOT / "data/features/source_extracts/soilgrids_soil.json"
RAW_DIR = ROOT / "data/raw/soil_observations"
OUTPUT_PATH = ROOT / "data/features/source_extracts/soil_observations.json"

WOSIS_WFS_URL = "https://maps.isric.org/mapserv"
WOSIS_LAYERS = {
    "orgc": "wosis_latest_orgc",
    "ph_h2o": "wosis_latest_phaq",
    "sand": "wosis_latest_sand",
    "silt": "wosis_latest_silt",
    "clay": "wosis_latest_clay",
}
AFSIS_URLS = {
    "georeferences": "https://afsis.s3.amazonaws.com/2009-2013/Georeferences/georeferences.csv",
    "icraf": "https://afsis.s3.amazonaws.com/2009-2013/Wet_Chemistry/ICRAF/Wet_Chemistry_ICRAF.csv",
    "cropnuts": "https://afsis.s3.amazonaws.com/2009-2013/Wet_Chemistry/CROPNUTS/Wet_Chemistry_CROPNUTS.csv",
    "rres": "https://afsis.s3.amazonaws.com/2009-2013/Wet_Chemistry/RRES/Wet_Chemistry_RRES.csv",
}

OBSERVED_FIELDS = [
    "observed_soc_0_30cm_g_kg_mean",
    "observed_ph_h2o_0_30cm_mean",
    "observed_sand_pct_mean",
    "observed_silt_pct_mean",
    "observed_clay_pct_mean",
]


def main():
    args = parse_args()
    candidates = json.loads(args.candidates.read_text())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.raw_dir.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        print_plan(args, candidates)
        return

    failures = []
    observations = []
    if args.source_mode in ("all", "wosis"):
        try:
            observations.extend(fetch_wosis_observations(candidates, args))
        except Exception as exc:
            failures.append({"source": "wosis_latest", "error": f"{type(exc).__name__}: {exc}"})

    if args.source_mode in ("all", "afsis"):
        try:
            observations.extend(fetch_afsis_observations(args))
        except Exception as exc:
            failures.append({"source": "afsis_phase1", "error": f"{type(exc).__name__}: {exc}"})

    soilgrids_by_site = load_soilgrids_by_site(args.soilgrids)
    rows = [
        summarize_candidate(feature, observations, soilgrids_by_site, args.buffer_km, failures, expected_source_count(args))
        for feature in candidates["features"]
    ]
    output = {
        "source": source_metadata(args),
        "features": rows,
    }
    if failures:
        output["blocker"] = {
            "reason": "One or more soil observation sources could not be fetched.",
            "partial_failures": failures,
            "next_action": "Retry with --refresh-cache, narrow --source-mode, or inspect source service availability.",
        }

    args.output.write_text(json.dumps(output, indent=2) + "\n")
    if failures and len(failures) == expected_source_count(args):
        raise SystemExit(f"Blocked: no soil observation sources available. Wrote {relative_path(args.output)}")
    print(f"Wrote {relative_path(args.output)}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract nearby WoSIS/AfSIS measured soil observations for candidate-site context."
    )
    parser.add_argument("--candidates", type=Path, default=CANDIDATES_PATH)
    parser.add_argument("--soilgrids", type=Path, default=SOILGRIDS_PATH)
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--buffer-km", type=float, default=25.0)
    parser.add_argument("--source-mode", choices=["all", "wosis", "afsis"], default="all")
    parser.add_argument("--timeout-seconds", type=int, default=45)
    parser.add_argument("--throttle-seconds", type=float, default=1.0)
    parser.add_argument("--refresh-cache", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def print_plan(args, candidates):
    print("Soil observation extraction dry run")
    print(f"Candidate file: {relative_path(args.candidates)}")
    print(f"Output: {relative_path(args.output)}")
    print(f"Source mode: {args.source_mode}")
    print(f"Observation radius: {args.buffer_km} km")
    print(f"Candidate sites: {len(candidates['features'])}")
    if args.source_mode in ("all", "wosis"):
        print("WoSIS layers:")
        for layer in WOSIS_LAYERS.values():
            print(f"  - {layer}")
    if args.source_mode in ("all", "afsis"):
        print("AfSIS CSVs:")
        for url in AFSIS_URLS.values():
            print(f"  - {url}")


def fetch_wosis_observations(candidates, args):
    observations = []
    expanded_bboxes = [expand_bbox(geometry_bounds(feature["geometry"]), args.buffer_km) for feature in candidates["features"]]
    merged_bbox = (
        min(bbox[0] for bbox in expanded_bboxes),
        min(bbox[1] for bbox in expanded_bboxes),
        max(bbox[2] for bbox in expanded_bboxes),
        max(bbox[3] for bbox in expanded_bboxes),
    )
    for field, layer in WOSIS_LAYERS.items():
        url = wosis_url(layer, merged_bbox)
        payload = load_json_url(url, args.raw_dir / "wosis", args.refresh_cache, args.timeout_seconds)
        for feature in payload.get("features", []):
            observation = wosis_observation(feature, field)
            if observation:
                observations.append(observation)
        time.sleep(args.throttle_seconds)
    return observations


def wosis_url(layer, bbox):
    params = {
        "map": "/map/wosis_latest.map",
        "SERVICE": "WFS",
        "VERSION": "1.0.0",
        "REQUEST": "GetFeature",
        "TYPENAME": layer,
        "OUTPUTFORMAT": "geojson",
        "BBOX": ",".join(f"{value:.6f}" for value in bbox),
        "MAXFEATURES": "10000",
    }
    return f"{WOSIS_WFS_URL}?{urllib.parse.urlencode(params)}"


def wosis_observation(feature, field):
    geometry = feature.get("geometry") or {}
    coords = geometry.get("coordinates") or []
    properties = feature.get("properties") or {}
    value = parse_float(properties.get("value_avg"))
    if len(coords) < 2 or value is None:
        return None
    upper_depth = parse_float(properties.get("upper_depth"))
    lower_depth = parse_float(properties.get("lower_depth"))
    if not overlaps_topsoil(upper_depth, lower_depth):
        return None
    return {
        "source": "wosis",
        "source_id": str(properties.get("layer_id") or properties.get("profile_code") or ""),
        "profile_id": str(properties.get("profile_id") or ""),
        "dataset_id": properties.get("dataset_id"),
        "lon": float(coords[0]),
        "lat": float(coords[1]),
        "upper_depth_cm": upper_depth,
        "lower_depth_cm": lower_depth,
        field: value,
    }


def fetch_afsis_observations(args):
    georeferences = load_csv_url(AFSIS_URLS["georeferences"], args.raw_dir / "afsis", args.refresh_cache, args.timeout_seconds)
    chemistry = {}
    for lab in ["icraf", "cropnuts", "rres"]:
        for row in load_csv_url(AFSIS_URLS[lab], args.raw_dir / "afsis", args.refresh_cache, args.timeout_seconds):
            ssn = row.get("SSN")
            if not ssn:
                continue
            chemistry.setdefault(ssn, {}).update(afsis_values(row, lab))

    observations = []
    for row in georeferences:
        ssn = row.get("SSN")
        if row.get("Public") != "True" or row.get("Country") != "Ethiopia" or row.get("Depth") != "top":
            continue
        values = chemistry.get(ssn)
        lon = parse_float(row.get("Longitude"))
        lat = parse_float(row.get("Latitude"))
        if not values or lon is None or lat is None:
            continue
        observations.append({
            "source": "afsis",
            "source_id": ssn,
            "profile_id": ssn,
            "dataset_id": "AFSIS Phase I",
            "lon": lon,
            "lat": lat,
            "upper_depth_cm": 0,
            "lower_depth_cm": 20,
            **values,
        })
    return observations


def afsis_values(row, lab):
    if lab == "icraf":
        return {
            "sand": parse_float(row.get("Psa asand")),
            "silt": parse_float(row.get("Psa asilt")),
            "clay": parse_float(row.get("Psa aclay")),
            "orgc": percent_to_g_kg(parse_float(row.get("Total carbon"))),
        }
    if lab == "cropnuts":
        return {"ph_h2o": parse_float(row.get("PH"))}
    if lab == "rres":
        return {
            "ph_h2o": parse_float(row.get("pH")),
            "orgc": percent_to_g_kg(parse_float(row.get("C % Org")) or parse_float(row.get("%C"))),
        }
    return {}


def summarize_candidate(feature, observations, soilgrids_by_site, radius_km, failures, expected_sources):
    props = feature["properties"]
    site_id = props["site_id"]
    lon = float(props["centroid_lon"])
    lat = float(props["centroid_lat"])
    nearby = []
    for observation in observations:
        distance = haversine_km(lon, lat, observation["lon"], observation["lat"])
        if distance <= radius_km:
            nearby.append({**observation, "distance_km": distance})

    by_profile = {item["profile_id"] for item in nearby if item.get("profile_id")}
    counts = {
        "total": len(nearby),
        "wosis": sum(1 for item in nearby if item["source"] == "wosis"),
        "afsis": sum(1 for item in nearby if item["source"] == "afsis"),
    }
    row = {
        "site_id": site_id,
        "source_status": source_status(nearby, failures, expected_sources),
        "soil_observation_count_total": counts["total"],
        "soil_observation_count_wosis": counts["wosis"],
        "soil_observation_count_afsis": counts["afsis"],
        "soil_observation_profile_count": len(by_profile),
        "soil_observation_nearest_distance_km": round(min((item["distance_km"] for item in nearby), default=0), 3) if nearby else None,
        "soil_observation_radius_km": radius_km,
        "observed_soc_0_30cm_g_kg_mean": depth_weighted_profile_mean(nearby, "orgc"),
        "observed_ph_h2o_0_30cm_mean": depth_weighted_profile_mean(nearby, "ph_h2o"),
        "observed_sand_pct_mean": depth_weighted_profile_mean(nearby, "sand"),
        "observed_silt_pct_mean": depth_weighted_profile_mean(nearby, "silt"),
        "observed_clay_pct_mean": depth_weighted_profile_mean(nearby, "clay"),
        "soil_observation_support_score": support_score(nearby, radius_km),
        "soilgrids_soc_delta_g_kg": None,
        "soilgrids_ph_delta": None,
        "nearest_observations": nearest_observation_summaries(nearby),
    }

    soilgrids = soilgrids_by_site.get(site_id, {})
    if row["observed_soc_0_30cm_g_kg_mean"] is not None and soilgrids.get("soilgrids_soc_0_30cm_g_kg_mean") is not None:
        row["soilgrids_soc_delta_g_kg"] = round(row["observed_soc_0_30cm_g_kg_mean"] - soilgrids["soilgrids_soc_0_30cm_g_kg_mean"], 3)
    if row["observed_ph_h2o_0_30cm_mean"] is not None and soilgrids.get("soilgrids_ph_h2o_0_30cm_mean") is not None:
        row["soilgrids_ph_delta"] = round(row["observed_ph_h2o_0_30cm_mean"] - soilgrids["soilgrids_ph_h2o_0_30cm_mean"], 3)
    return row


def source_status(observations, failures, expected_sources):
    if failures and len(failures) >= expected_sources:
        return "blocked_source_unavailable"
    if failures:
        return "partial_source_derived"
    return "source_derived" if observations else "no_observations"


def support_score(observations, radius_km):
    if not observations:
        return 0
    profile_count = len({item["profile_id"] for item in observations if item.get("profile_id")})
    nearest = min(item["distance_km"] for item in observations)
    count_component = min(60, profile_count * 12)
    distance_component = max(0, 40 * (1 - nearest / radius_km))
    return int(round(min(100, count_component + distance_component)))


def nearest_observation_summaries(observations):
    grouped = {}
    for item in observations:
        key = (item.get("source"), item.get("source_id"), round(item["distance_km"], 6))
        if key not in grouped:
            grouped[key] = {
            "source": item["source"],
            "source_id": item["source_id"],
            "dataset_id": item.get("dataset_id"),
            "distance_km": round(item["distance_km"], 3),
            "lon": round(item["lon"], 5),
            "lat": round(item["lat"], 5),
                "fields": set(),
            }
        grouped[key]["fields"].update(field for field in ["orgc", "ph_h2o", "sand", "silt", "clay"] if item.get(field) is not None)

    summaries = []
    for item in sorted(grouped.values(), key=lambda value: value["distance_km"])[:5]:
        summaries.append({**item, "fields": sorted(item["fields"])})
    return summaries


def load_json_url(url, cache_dir, refresh, timeout):
    path = cache_path(cache_dir, url, ".json")
    if path.exists() and path.stat().st_size > 0 and not refresh:
        return json.loads(path.read_text())
    cache_dir.mkdir(parents=True, exist_ok=True)
    print(f"Fetching {url}", file=sys.stderr)
    request = urllib.request.Request(url, headers={"User-Agent": "chaka-soil-observations/0.1"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        payload = json.loads(response.read().decode("utf-8"))
    path.write_text(json.dumps(payload, indent=2) + "\n")
    return payload


def load_csv_url(url, cache_dir, refresh, timeout):
    path = cache_path(cache_dir, url, ".csv")
    if path.exists() and path.stat().st_size > 0 and not refresh:
        text = path.read_text()
    else:
        cache_dir.mkdir(parents=True, exist_ok=True)
        print(f"Fetching {url}", file=sys.stderr)
        request = urllib.request.Request(url, headers={"User-Agent": "chaka-soil-observations/0.1"})
        with urllib.request.urlopen(request, timeout=timeout) as response:
            text = response.read().decode("utf-8-sig", errors="replace")
        path.write_text(text)
    return list(csv.DictReader(io.StringIO(text)))


def cache_path(cache_dir, key, suffix):
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()[:24]
    return cache_dir / f"{digest}{suffix}"


def load_soilgrids_by_site(path):
    if not path.exists():
        return {}
    artifact = json.loads(path.read_text())
    return {row["site_id"]: row for row in artifact.get("features", [])}


def source_metadata(args):
    return {
        "dataset_id": "soil_observations",
        "name": "WoSIS latest and AfSIS Phase I nearby soil observations",
        "sources": {
            "wosis_latest": {
                "access_url_template": "https://maps.isric.org/mapserv?map=/map/wosis_latest.map&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME={layer}&OUTPUTFORMAT=geojson&BBOX={bbox}&MAXFEATURES=10000",
                "layers": list(WOSIS_LAYERS.values()),
            },
            "afsis_phase1": {"access_urls": list(AFSIS_URLS.values())},
        },
        "observation_radius_km": args.buffer_km,
        "depth_target_cm": "0-30",
        "raw_cache": relative_path(args.raw_dir),
        "extraction_method": "bounded point-observation lookup; distance-filtered candidate summaries using candidate centroids",
        "note": "Nearby observations support SoilGrids interpretation but are not field validation of candidate sites.",
    }


def expected_source_count(args):
    return (1 if args.source_mode in ("all", "wosis") else 0) + (1 if args.source_mode in ("all", "afsis") else 0)


def overlaps_topsoil(upper, lower):
    if upper is None or lower is None:
        return True
    return upper < 30 and lower > 0


def depth_weighted_profile_mean(observations, field):
    profile_values = []
    by_profile = {}
    for item in observations:
        if item.get(field) is None or not math.isfinite(item[field]):
            continue
        by_profile.setdefault(item.get("profile_id") or item.get("source_id"), []).append(item)

    for items in by_profile.values():
        weighted_sum = 0
        weight_total = 0
        for item in items:
            weight = topsoil_overlap_cm(item.get("upper_depth_cm"), item.get("lower_depth_cm"))
            if weight <= 0:
                continue
            weighted_sum += item[field] * weight
            weight_total += weight
        if weight_total > 0:
            profile_values.append(weighted_sum / weight_total)

    return round(sum(profile_values) / len(profile_values), 3) if profile_values else None


def topsoil_overlap_cm(upper, lower):
    upper = 0 if upper is None else upper
    lower = 30 if lower is None else lower
    return max(0, min(lower, 30) - max(upper, 0))


def percent_to_g_kg(value):
    return round(value * 10, 3) if value is not None else None


def parse_float(value):
    try:
        if value in (None, "", "NULL", "NA"):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def expand_bbox(bbox, buffer_km):
    min_lon, min_lat, max_lon, max_lat = bbox
    mid_lat = (min_lat + max_lat) / 2
    lat_delta = buffer_km / 111.32
    lon_delta = buffer_km / (111.32 * max(0.1, math.cos(math.radians(mid_lat))))
    return min_lon - lon_delta, min_lat - lat_delta, max_lon + lon_delta, max_lat + lat_delta


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


def haversine_km(lon1, lat1, lon2, lat2):
    radius_km = 6371.0088
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    return 2 * radius_km * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def relative_path(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    main()
