#!/usr/bin/env python3

import argparse
import datetime as dt
import hashlib
import json
import math
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path.cwd()
CANDIDATES_PATH = ROOT / "data/processed/candidate_sites.geojson"
RAW_DIR = ROOT / "data/raw/osm"
OUTPUT_PATH = ROOT / "data/features/source_extracts/osm_access.json"

DEFAULT_OVERPASS_URL = "https://overpass-api.de/api/interpreter"
DEFAULT_GEOFABRIK_PBF = RAW_DIR / "ethiopia-latest.osm.pbf"
DEFAULT_GEOFABRIK_URL = "https://download.geofabrik.de/africa/ethiopia-latest.osm.pbf"
DEFAULT_BUFFER_DEGREES = 0.05
MAX_BBOX_SPAN_DEGREES = 0.2
DEFAULT_TIMEOUT_SECONDS = 45
DEFAULT_THROTTLE_SECONDS = 2.0

ROAD_CLASS_WEIGHT = {
    "motorway": 1.0,
    "trunk": 1.0,
    "primary": 0.95,
    "secondary": 0.85,
    "tertiary": 0.75,
    "unclassified": 0.65,
    "residential": 0.6,
    "service": 0.45,
    "track": 0.35,
    "path": 0.25,
    "footway": 0.2,
}

SETTLEMENT_PLACE_VALUES = {
    "city",
    "town",
    "village",
    "hamlet",
    "isolated_dwelling",
    "neighbourhood",
    "suburb",
}


def main():
    args = parse_args()
    socket.setdefaulttimeout(args.timeout_seconds)
    candidates = json.loads(CANDIDATES_PATH.read_text())
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        if args.source_mode == "geofabrik":
            print_geofabrik_plan(candidates, args)
            return
        for feature in candidates["features"][: args.limit or len(candidates["features"])]:
            site_id = feature["properties"]["site_id"]
            print(f"{site_id}: bbox={format_bbox(bbox_for_feature(feature, args.buffer_degrees))}")
            print(build_query(bbox_for_feature(feature, args.buffer_degrees)))
        return

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    if args.source_mode == "geofabrik":
        output = extract_geofabrik(candidates, args)
        OUTPUT_PATH.write_text(json.dumps(output, indent=2) + "\n")
        print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")
        return

    rows = []
    blockers = []
    features = candidates["features"][: args.limit] if args.limit else candidates["features"]
    for index, feature in enumerate(features):
        site_id = feature["properties"]["site_id"]
        print(f"Fetching OSM access for {site_id} ({index + 1}/{len(features)})", file=sys.stderr)
        try:
            payload = fetch_site_payload(feature, args)
        except Exception as exc:
            blockers.append({"site_id": site_id, "error": str(exc)})
            rows.append(blocked_feature(site_id, "blocked_source_unavailable"))
        else:
            rows.append(extract_feature(feature, payload, args.buffer_degrees))

        if index < len(features) - 1:
            time.sleep(args.throttle_seconds)

    if args.limit and args.limit < len(candidates["features"]):
        processed_ids = {feature["properties"]["site_id"] for feature in features}
        for feature in candidates["features"]:
            site_id = feature["properties"]["site_id"]
            if site_id not in processed_ids:
                rows.append(blocked_feature(site_id, "not_processed_limit"))

    output = {
        "source": source_metadata(args, len(features)),
        "features": rows,
    }
    if blockers:
        output["blocker"] = {
            "reason": "One or more bounded Overpass API requests failed; values are null for affected sites.",
            "failures": blockers,
            "next_action": "Retry later, lower --limit, increase --throttle-seconds, or switch --overpass-url to another public Overpass endpoint.",
        }

    OUTPUT_PATH.write_text(json.dumps(output, indent=2) + "\n")
    if blockers and len(blockers) == len(features):
        raise SystemExit(
            f"Blocked: all Overpass requests failed. Wrote blocker details to {OUTPUT_PATH.relative_to(ROOT)}"
        )
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Extract bounded OSM/Overpass road and settlement access proxies for Chaka candidate sites."
    )
    parser.add_argument("--source-mode", choices=["overpass", "geofabrik"], default="overpass")
    parser.add_argument("--overpass-url", default=DEFAULT_OVERPASS_URL)
    parser.add_argument("--pbf-path", type=Path, default=DEFAULT_GEOFABRIK_PBF)
    parser.add_argument("--geofabrik-url", default=DEFAULT_GEOFABRIK_URL)
    parser.add_argument("--snapshot-date", default=None, help="Optional source snapshot date for local Geofabrik PBF provenance.")
    parser.add_argument("--buffer-degrees", type=float, default=DEFAULT_BUFFER_DEGREES)
    parser.add_argument("--timeout-seconds", type=int, default=DEFAULT_TIMEOUT_SECONDS)
    parser.add_argument("--throttle-seconds", type=float, default=DEFAULT_THROTTLE_SECONDS)
    parser.add_argument("--limit", type=int, default=None, help="Process only the first N sites.")
    parser.add_argument("--refresh-cache", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="Print bounded Overpass queries without network access.")
    return parser.parse_args()


def print_geofabrik_plan(candidates, args):
    features = candidates["features"][: args.limit] if args.limit else candidates["features"]
    print("OSM Geofabrik extraction dry run")
    print(f"Source mode: geofabrik")
    print(f"Expected PBF: {relative_path(args.pbf_path)}")
    print(f"Reference URL: {args.geofabrik_url}")
    print(f"PBF status: {'present' if args.pbf_path.exists() and args.pbf_path.stat().st_size > 0 else 'missing'}")
    print(f"Candidate sites: {len(features)}")
    for feature in features:
        site_id = feature["properties"]["site_id"]
        print(f"{site_id}: bbox={format_bbox(bbox_for_feature(feature, args.buffer_degrees))}")
    print("")
    print("Place a Geofabrik Ethiopia .osm.pbf at the expected path, then run:")
    print("  npm run data:osm:geofabrik")


def extract_geofabrik(candidates, args):
    if not args.pbf_path.exists() or args.pbf_path.stat().st_size == 0:
        raise SystemExit(
            f"Blocked: missing local Geofabrik PBF at {relative_path(args.pbf_path)}. "
            "Run npm run data:osm:geofabrik:dry-run for the expected source path."
        )

    pbf_sha256 = file_sha256(args.pbf_path)
    features = candidates["features"][: args.limit] if args.limit else candidates["features"]
    rows = []
    for index, feature in enumerate(features):
        site_id = feature["properties"]["site_id"]
        print(f"Extracting Geofabrik OSM access for {site_id} ({index + 1}/{len(features)})", file=sys.stderr)
        payload = read_geofabrik_payload(feature, args)
        rows.append(extract_feature(feature, payload, args.buffer_degrees))

    if args.limit and args.limit < len(candidates["features"]):
        processed_ids = {feature["properties"]["site_id"] for feature in features}
        for feature in candidates["features"]:
            site_id = feature["properties"]["site_id"]
            if site_id not in processed_ids:
                rows.append(blocked_feature(site_id, "not_processed_limit"))

    return {
        "source": geofabrik_source_metadata(args, len(features), pbf_sha256, candidates),
        "features": rows,
    }


def read_geofabrik_payload(feature, args):
    bbox = bbox_for_feature(feature, args.buffer_degrees)
    validate_bbox(bbox)
    elements = []
    elements.extend(read_ogr_layer(args.pbf_path, "lines", bbox, "highway IS NOT NULL", ogr_line_to_osm_way))
    place_filter = "place IN ('city','town','village','hamlet','isolated_dwelling','neighbourhood','suburb')"
    elements.extend(read_ogr_layer(args.pbf_path, "points", bbox, place_filter, ogr_point_to_osm_node))
    area_filter = "place IN ('city','town','village','hamlet','neighbourhood','suburb') OR landuse = 'residential'"
    elements.extend(read_ogr_layer(args.pbf_path, "multipolygons", bbox, area_filter, ogr_area_to_osm_relation))
    return {"elements": elements}


def read_ogr_layer(pbf_path, layer, bbox, where, convert_feature):
    min_lon, min_lat, max_lon, max_lat = bbox
    command = [
        "ogr2ogr",
        "-f",
        "GeoJSON",
        "/vsistdout/",
        str(pbf_path),
        layer,
        "-spat",
        f"{min_lon:.8f}",
        f"{min_lat:.8f}",
        f"{max_lon:.8f}",
        f"{max_lat:.8f}",
        "-where",
        where,
    ]
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
    except FileNotFoundError as exc:
        raise SystemExit("Blocked: ogr2ogr is required for Geofabrik .osm.pbf extraction.") from exc
    except subprocess.CalledProcessError as exc:
        message = exc.stderr.strip() or exc.stdout.strip() or str(exc)
        raise RuntimeError(f"ogr2ogr failed for OSM layer {layer}: {message}") from exc

    if not result.stdout.strip():
        return []
    collection = json.loads(result.stdout)
    return [
        converted
        for converted in (convert_feature(feature) for feature in collection.get("features", []))
        if converted is not None
    ]


def ogr_line_to_osm_way(feature):
    props = feature.get("properties") or {}
    highway = props.get("highway")
    if not highway:
        return None
    geometry = feature.get("geometry") or {}
    coordinates = flatten_line_coordinates(geometry)
    if len(coordinates) < 2:
        return None
    return {
        "type": "way",
        "tags": compact_tags({"highway": highway, "name": props.get("name")}),
        "geometry": [{"lon": lon, "lat": lat} for lon, lat in coordinates],
    }


def ogr_point_to_osm_node(feature):
    props = feature.get("properties") or {}
    place = props.get("place")
    geometry = feature.get("geometry") or {}
    coordinates = geometry.get("coordinates")
    if place not in SETTLEMENT_PLACE_VALUES or not coordinates:
        return None
    return {
        "type": "node",
        "lon": coordinates[0],
        "lat": coordinates[1],
        "tags": compact_tags({"place": place, "name": props.get("name"), "population": props.get("population")}),
    }


def ogr_area_to_osm_relation(feature):
    props = feature.get("properties") or {}
    place = props.get("place")
    landuse = props.get("landuse")
    if place not in SETTLEMENT_PLACE_VALUES and landuse != "residential":
        return None
    geometry = feature.get("geometry") or {}
    coordinates = flatten_polygon_coordinates(geometry)
    if not coordinates:
        return None
    return {
        "type": "relation",
        "tags": compact_tags({"place": place, "landuse": landuse, "name": props.get("name"), "population": props.get("population")}),
        "geometry": [{"lon": lon, "lat": lat} for lon, lat in coordinates],
    }


def fetch_site_payload(feature, args):
    site_id = feature["properties"]["site_id"]
    bbox = bbox_for_feature(feature, args.buffer_degrees)
    validate_bbox(bbox)
    query = build_query(bbox)
    cache_path = RAW_DIR / f"{site_id.lower()}-{query_hash(query)}.json"

    if cache_path.exists() and cache_path.stat().st_size > 0 and not args.refresh_cache:
        return json.loads(cache_path.read_text())

    request = urllib.request.Request(
        args.overpass_url,
        data=urllib.parse.urlencode({"data": query}).encode("utf-8"),
        headers={
            "User-Agent": "chaka-ethiopia-restoration-mvp/0.1 (bounded OSM access extraction)",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=args.timeout_seconds) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"Overpass HTTP {exc.code}: {exc.reason}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Overpass request failed: {exc.reason}") from exc

    cache_path.write_text(json.dumps(payload, indent=2) + "\n")
    return payload


def build_query(bbox):
    bbox_text = format_bbox(bbox)
    return f"""
[out:json][timeout:25];
(
  way["highway"]({bbox_text});
  node["place"~"^(city|town|village|hamlet|isolated_dwelling|neighbourhood|suburb)$"]({bbox_text});
  way["place"~"^(city|town|village|hamlet|neighbourhood|suburb)$"]({bbox_text});
  relation["place"~"^(city|town|village|hamlet|neighbourhood|suburb)$"]({bbox_text});
  way["landuse"="residential"]({bbox_text});
  relation["landuse"="residential"]({bbox_text});
);
out body geom;
""".strip()


def extract_feature(feature, payload, buffer_degrees):
    props = feature["properties"]
    site_id = props["site_id"]
    lon = float(props["centroid_lon"])
    lat = float(props["centroid_lat"])
    bbox = bbox_for_feature(feature, buffer_degrees)
    elements = payload.get("elements", [])

    roads = [element for element in elements if element.get("type") == "way" and "highway" in element.get("tags", {})]
    settlements = [
        element
        for element in elements
        if element.get("tags", {}).get("place") in SETTLEMENT_PLACE_VALUES
        or element.get("tags", {}).get("landuse") == "residential"
    ]

    nearest_road = nearest_road_summary(lon, lat, roads)
    nearest_settlement = nearest_settlement_summary(lon, lat, settlements)
    residential_area_km2 = round(
        sum(approx_polygon_area_km2(element, lat) for element in settlements if element.get("tags", {}).get("landuse") == "residential"),
        4,
    )
    mapped_population = sum(parse_population(element.get("tags", {}).get("population")) for element in settlements)
    place_node_count = sum(1 for element in settlements if element.get("type") == "node")

    return {
        "site_id": site_id,
        "road_access_score": road_access_score(nearest_road),
        "settlement_proximity_score": settlement_proximity_score(nearest_settlement),
        "population_pressure_proxy_score": population_pressure_proxy_score(place_node_count, residential_area_km2, mapped_population),
        "nearest_road_distance_km": nearest_road["distance_km"],
        "nearest_road_highway": nearest_road["highway"],
        "nearest_road_name": nearest_road["name"],
        "nearest_settlement_distance_km": nearest_settlement["distance_km"],
        "nearest_settlement_type": nearest_settlement["type"],
        "nearest_settlement_name": nearest_settlement["name"],
        "osm_road_way_count": len(roads),
        "osm_settlement_element_count": len(settlements),
        "osm_place_node_count": place_node_count,
        "osm_residential_area_km2": residential_area_km2,
        "osm_mapped_population_sum": mapped_population or None,
        "overpass_bbox": {
            "south": round(bbox[1], 6),
            "west": round(bbox[0], 6),
            "north": round(bbox[3], 6),
            "east": round(bbox[2], 6),
        },
        "source_status": "source_derived",
    }


def nearest_road_summary(lon, lat, roads):
    best = None
    for road in roads:
        geometry = road.get("geometry") or []
        if len(geometry) < 2:
            continue
        distance = min(
            point_to_segment_distance_km(
                lon,
                lat,
                geometry[index]["lon"],
                geometry[index]["lat"],
                geometry[index + 1]["lon"],
                geometry[index + 1]["lat"],
            )
            for index in range(len(geometry) - 1)
        )
        highway = road.get("tags", {}).get("highway")
        weighted_distance = distance / ROAD_CLASS_WEIGHT.get(highway, 0.5)
        if best is None or weighted_distance < best["weighted_distance"]:
            best = {
                "distance_km": round(distance, 3),
                "weighted_distance": weighted_distance,
                "highway": highway,
                "name": road.get("tags", {}).get("name"),
            }

    return best or {"distance_km": None, "weighted_distance": None, "highway": None, "name": None}


def nearest_settlement_summary(lon, lat, settlements):
    best = None
    for settlement in settlements:
        points = element_points(settlement)
        if not points:
            continue
        distance = min(haversine_km(lon, lat, point[0], point[1]) for point in points)
        tags = settlement.get("tags", {})
        summary = {
            "distance_km": round(distance, 3),
            "type": tags.get("place") or tags.get("landuse"),
            "name": tags.get("name"),
        }
        if best is None or distance < best["distance_km"]:
            best = summary

    return best or {"distance_km": None, "type": None, "name": None}


def element_points(element):
    if element.get("type") == "node":
        return [(element.get("lon"), element.get("lat"))]
    if "center" in element:
        return [(element["center"].get("lon"), element["center"].get("lat"))]
    return [(point.get("lon"), point.get("lat")) for point in element.get("geometry", [])]


def road_access_score(nearest_road):
    distance = nearest_road["distance_km"]
    if distance is None:
        return 0
    highway = nearest_road["highway"]
    if distance <= 0.5:
        base = 90
    elif distance <= 1:
        base = 82
    elif distance <= 3:
        base = 68
    elif distance <= 5:
        base = 52
    elif distance <= 8:
        base = 34
    else:
        base = 18
    adjustment = round((ROAD_CLASS_WEIGHT.get(highway, 0.5) - 0.6) * 25)
    return clamp_score(base + adjustment)


def settlement_proximity_score(nearest_settlement):
    distance = nearest_settlement["distance_km"]
    if distance is None:
        return 0
    if distance <= 1:
        return 88
    if distance <= 3:
        return 72
    if distance <= 5:
        return 56
    if distance <= 8:
        return 38
    return 20


def population_pressure_proxy_score(place_node_count, residential_area_km2, mapped_population):
    score = min(45, place_node_count * 9) + min(35, residential_area_km2 * 8)
    if mapped_population:
        score += min(20, math.log10(mapped_population + 1) * 5)
    return clamp_score(round(score))


def blocked_feature(site_id, status):
    return {
        "site_id": site_id,
        "road_access_score": None,
        "settlement_proximity_score": None,
        "population_pressure_proxy_score": None,
        "nearest_road_distance_km": None,
        "nearest_road_highway": None,
        "nearest_settlement_distance_km": None,
        "nearest_settlement_type": None,
        "osm_road_way_count": None,
        "osm_settlement_element_count": None,
        "source_status": status,
    }


def source_metadata(args, processed_count):
    return {
        "dataset_id": "osm_access",
        "source_mode": "overpass",
        "name": "OpenStreetMap road and settlement access proxies via Overpass API",
        "source_url": "https://www.openstreetmap.org/copyright",
        "access_url": args.overpass_url,
        "license": "OpenStreetMap data is available under the Open Database License (ODbL).",
        "attribution": "Contains information from OpenStreetMap, which is made available under the Open Database License.",
        "extraction_method": "bounded Overpass API queries around each candidate polygon bbox; road and settlement proximity computed from returned OSM geometries",
        "processed_site_count": processed_count,
        "buffer_degrees": args.buffer_degrees,
        "throttle_seconds": args.throttle_seconds,
        "raw_cache": str(RAW_DIR.relative_to(ROOT)),
        "note": "OSM completeness varies by location. Scores are source-derived mapped-access proxies, not community feasibility or field validation.",
    }


def geofabrik_source_metadata(args, processed_count, pbf_sha256, candidates):
    return {
        "dataset_id": "osm_access",
        "source_mode": "geofabrik_pbf",
        "name": "OpenStreetMap Ethiopia extract via Geofabrik",
        "source_url": "https://www.openstreetmap.org/copyright",
        "access_url": args.geofabrik_url,
        "license": "OpenStreetMap data is available under the Open Database License (ODbL).",
        "attribution": "Contains information from OpenStreetMap, which is made available under the Open Database License.",
        "extraction_method": "local Geofabrik Ethiopia .osm.pbf read through GDAL/OGR; bounded per-site road and settlement proximity computed from OSM geometries",
        "processed_site_count": processed_count,
        "buffer_degrees": args.buffer_degrees,
        "raw_pbf": relative_path(args.pbf_path),
        "source_file_size_bytes": args.pbf_path.stat().st_size,
        "source_file_sha256": pbf_sha256,
        "source_snapshot_date": args.snapshot_date,
        "candidate_site_hash": candidate_site_hash(candidates),
        "extractor_version": "osm_access_geofabrik_v0.1",
        "scoring_version": "osm_access_scores_v0.1",
        "processed_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "note": "OSM completeness varies by location. Scores are source-derived mapped-access proxies, not community feasibility or field validation.",
    }


def flatten_line_coordinates(geometry):
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates") or []
    if geometry_type == "LineString":
        return [(point[0], point[1]) for point in coordinates]
    if geometry_type == "MultiLineString":
        points = []
        for line in coordinates:
            points.extend((point[0], point[1]) for point in line)
        return points
    return []


def flatten_polygon_coordinates(geometry):
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates") or []
    if geometry_type == "Polygon" and coordinates:
        return [(point[0], point[1]) for point in coordinates[0]]
    if geometry_type == "MultiPolygon" and coordinates:
        largest_ring = []
        for polygon in coordinates:
            if polygon and len(polygon[0]) > len(largest_ring):
                largest_ring = polygon[0]
        return [(point[0], point[1]) for point in largest_ring]
    return []


def compact_tags(tags):
    return {key: value for key, value in tags.items() if value not in (None, "")}


def bbox_for_feature(feature, buffer_degrees):
    min_lon, min_lat, max_lon, max_lat = geometry_bounds(feature["geometry"])
    return (
        min_lon - buffer_degrees,
        min_lat - buffer_degrees,
        max_lon + buffer_degrees,
        max_lat + buffer_degrees,
    )


def validate_bbox(bbox):
    min_lon, min_lat, max_lon, max_lat = bbox
    if max_lon <= min_lon or max_lat <= min_lat:
        raise ValueError("invalid bbox")
    if max_lon - min_lon > MAX_BBOX_SPAN_DEGREES or max_lat - min_lat > MAX_BBOX_SPAN_DEGREES:
        raise ValueError("bbox span exceeds safety bound")


def format_bbox(bbox):
    min_lon, min_lat, max_lon, max_lat = bbox
    return f"{min_lat:.6f},{min_lon:.6f},{max_lat:.6f},{max_lon:.6f}"


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


def point_to_segment_distance_km(lon, lat, lon1, lat1, lon2, lat2):
    px, py = project_km(lon, lat, lat)
    x1, y1 = project_km(lon1, lat1, lat)
    x2, y2 = project_km(lon2, lat2, lat)
    dx = x2 - x1
    dy = y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(px - x1, py - y1)
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    nearest_x = x1 + t * dx
    nearest_y = y1 + t * dy
    return math.hypot(px - nearest_x, py - nearest_y)


def haversine_km(lon1, lat1, lon2, lat2):
    if lon2 is None or lat2 is None:
        return math.inf
    radius = 6371.0088
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * radius * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def approx_polygon_area_km2(element, ref_lat):
    geometry = element.get("geometry") or []
    if len(geometry) < 4:
        return 0.0
    points = [project_km(point["lon"], point["lat"], ref_lat) for point in geometry]
    if points[0] != points[-1]:
        return 0.0
    area = 0.0
    for index in range(len(points) - 1):
        x1, y1 = points[index]
        x2, y2 = points[index + 1]
        area += x1 * y2 - x2 * y1
    return abs(area) / 2


def project_km(lon, lat, ref_lat):
    return (
        lon * 111.320 * math.cos(math.radians(ref_lat)),
        lat * 110.574,
    )


def parse_population(value):
    if not value:
        return 0
    digits = "".join(char for char in str(value) if char.isdigit())
    return int(digits) if digits else 0


def clamp_score(value):
    return max(0, min(100, int(value)))


def query_hash(query):
    return hashlib.sha256(query.encode("utf-8")).hexdigest()[:12]


def file_sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def candidate_site_hash(candidates):
    payload = json.dumps(candidates, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def relative_path(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    main()
