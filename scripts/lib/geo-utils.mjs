export function bboxForGeometry(geometry) {
  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  forEachCoordinate(geometry, ([lon, lat]) => {
    bbox[0] = Math.min(bbox[0], lon);
    bbox[1] = Math.min(bbox[1], lat);
    bbox[2] = Math.max(bbox[2], lon);
    bbox[3] = Math.max(bbox[3], lat);
  });
  return bbox;
}

export function bboxForFeatures(features) {
  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const feature of features) {
    const featureBbox = bboxForGeometry(feature.geometry);
    bbox[0] = Math.min(bbox[0], featureBbox[0]);
    bbox[1] = Math.min(bbox[1], featureBbox[1]);
    bbox[2] = Math.max(bbox[2], featureBbox[2]);
    bbox[3] = Math.max(bbox[3], featureBbox[3]);
  }
  return bbox;
}

export function centroidForGeometry(geometry) {
  let lonSum = 0;
  let latSum = 0;
  let count = 0;

  forEachCoordinate(geometry, ([lon, lat]) => {
    lonSum += lon;
    latSum += lat;
    count += 1;
  });

  return [round(lonSum / count, 6), round(latSum / count, 6)];
}

export function squareCell(centerLon, centerLat, sizeDegrees) {
  const half = sizeDegrees / 2;
  return {
    type: "Polygon",
    coordinates: [
      [
        [round(centerLon - half, 6), round(centerLat - half, 6)],
        [round(centerLon + half, 6), round(centerLat - half, 6)],
        [round(centerLon + half, 6), round(centerLat + half, 6)],
        [round(centerLon - half, 6), round(centerLat + half, 6)],
        [round(centerLon - half, 6), round(centerLat - half, 6)],
      ],
    ],
  };
}

export function pointInFeature(point, feature) {
  return pointInGeometry(point, feature.geometry);
}

export function pointInGeometry(point, geometry) {
  if (geometry.type === "Polygon") {
    return pointInPolygon(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
  }

  return false;
}

export function areaHaForGeometry(geometry) {
  const areaSquareMeters =
    geometry.type === "Polygon"
      ? areaSquareMetersForPolygon(geometry.coordinates)
      : geometry.coordinates.reduce((sum, polygon) => sum + areaSquareMetersForPolygon(polygon), 0);

  return round(areaSquareMeters / 10000, 1);
}

export function round(value, places = 6) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function forEachCoordinate(geometry, visit) {
  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) {
      for (const coordinate of ring) visit(coordinate);
    }
    return;
  }

  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        for (const coordinate of ring) visit(coordinate);
      }
    }
  }
}

function pointInPolygon([lon, lat], rings) {
  if (!pointInRing([lon, lat], rings[0])) return false;
  return !rings.slice(1).some((ring) => pointInRing([lon, lat], ring));
}

function pointInRing([lon, lat], ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function areaSquareMetersForPolygon(rings) {
  const outer = Math.abs(areaSquareMetersForRing(rings[0]));
  const holes = rings.slice(1).reduce((sum, ring) => sum + Math.abs(areaSquareMetersForRing(ring)), 0);
  return Math.max(0, outer - holes);
}

function areaSquareMetersForRing(ring) {
  const earthRadiusMeters = 6378137;
  let area = 0;

  for (let i = 0; i < ring.length - 1; i += 1) {
    const [lon1, lat1] = ring[i].map(toRadians);
    const [lon2, lat2] = ring[i + 1].map(toRadians);
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  return (area * earthRadiusMeters * earthRadiusMeters) / 2;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}
