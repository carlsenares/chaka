"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { Feature, FeatureCollection, Geometry, Point } from "geojson";
import { priorityColor, priorityOutlineColor, type PriorityScoreRange } from "@/lib/priority-color";
import type { SiteDashboardItem } from "@/lib/site-view-model";

type CandidateMapProps = {
  sites: SiteDashboardItem[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
  scoreRange: PriorityScoreRange;
  frameless?: boolean;
  className?: string;
};

const ethiopiaBounds: Leaflet.LatLngBoundsExpression = [
  [3.1, 32.7],
  [14.9, 48.3],
];

export function CandidateMap({
  sites,
  selectedSiteId,
  onSelectSite,
  scoreRange,
  frameless = false,
  className = "",
}: CandidateMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const layerRef = useRef<Leaflet.GeoJSON | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");

  const featureCollection = useMemo(() => {
    const features = sites
      .flatMap((site) => {
        const geometry = site.geometry ?? centroidToPoint(site.centroid);
        if (!geometry) return [];

        return [
          {
            type: "Feature",
            properties: {
              site_id: site.site_id,
              name: site.name,
              score: site.priority_score,
              rank: site.rank,
              geometry_source: site.geometry ? "polygon" : "centroid",
            },
            geometry,
          } satisfies Feature<Geometry>,
        ];
      });

    return {
      type: "FeatureCollection",
      features,
    } satisfies FeatureCollection<Geometry>;
  }, [sites]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapElementRef.current || mapRef.current) return;

      const L = await import("leaflet");
      if (cancelled || !mapElementRef.current) return;

      leafletRef.current = L;
      const map = L.map(mapElementRef.current, {
        center: [8.9, 39.4],
        zoom: 6,
        minZoom: 5,
        maxZoom: 13,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      map.fitBounds(ethiopiaBounds, { padding: [18, 18] });
      mapRef.current = map;
      window.setTimeout(() => map.invalidateSize(), 150);
    }

    initMap();

    return () => {
      cancelled = true;
      layerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    layerRef.current?.remove();

    if (featureCollection.features.length === 0) {
      setStatus("empty");
      return;
    }

    const layer = L.geoJSON(featureCollection, {
      pointToLayer: (feature, latLng) => {
        const siteId = String(feature?.properties?.site_id ?? "");
        const score = Number(feature?.properties?.score ?? 0);
        const selected = siteId === selectedSiteId;
        const color = priorityColor(score, scoreRange);
        const outline = priorityOutlineColor(score, scoreRange);

        return L.circleMarker(latLng, {
          radius: selected ? 10 : 7,
          color: selected ? "#ffffff" : outline,
          fillColor: color,
          fillOpacity: selected ? 0.9 : 0.72,
          opacity: 1,
          weight: selected ? 3.4 : 1.4,
        });
      },
      style: (feature) => {
        const siteId = String(feature?.properties?.site_id ?? "");
        const score = Number(feature?.properties?.score ?? 0);
        const selected = siteId === selectedSiteId;
        const color = priorityColor(score, scoreRange);
        const outline = priorityOutlineColor(score, scoreRange);

        return {
          color: selected ? "#ffffff" : outline,
          fillColor: color,
          fillOpacity: selected ? 0.78 : 0.54,
          opacity: 1,
          weight: selected ? 3.4 : 1.4,
        };
      },
      onEachFeature: (feature, layerInstance) => {
        const siteId = String(feature.properties?.site_id ?? "");
        const name = String(feature.properties?.name ?? siteId);
        const score = Number(feature.properties?.score ?? 0);
        const source = feature.properties?.geometry_source === "centroid" ? "centroid" : "polygon";

        layerInstance.bindTooltip(`${name} · score ${score} · ${source}`, {
          sticky: true,
          direction: "top",
          className: "priority-map-tooltip",
        });
        layerInstance.on("click", () => onSelectSite(siteId));
      },
    }).addTo(map);

    layerRef.current = layer;
    setStatus("ready");

    const selectedLayer = layer
      .getLayers()
      .find((candidateLayer) => {
        const feature = (candidateLayer as Leaflet.Layer & { feature?: Feature }).feature;
        return feature?.properties?.site_id === selectedSiteId;
      });

    if (selectedLayer) {
      const bounds = getLayerBounds(selectedLayer, L);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [72, 72], maxZoom: 9 });
      }
    }
  }, [featureCollection, onSelectSite, scoreRange, selectedSiteId]);

  return (
    <section className={`${frameless ? "h-full overflow-hidden bg-base" : "overflow-hidden rounded-lg border border-white/10 bg-surface shadow-xl shadow-black/20"} ${className}`}>
      {!frameless && (
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <h2 className="font-semibold">Candidate sites</h2>
            <p className="text-xs text-muted">Rendered by site_id from candidate geometry or centroid.</p>
          </div>
          <span className="rounded-md bg-white/10 px-2 py-1 text-xs uppercase text-muted">
            {status}
          </span>
        </div>
      )}
      <div className="relative">
        {frameless && (
          <div className="floating-control absolute left-4 top-4 z-[500] rounded-full px-3 py-1.5 text-xs font-semibold uppercase text-accent">
            {status === "ready" ? `${featureCollection.features.length} candidate sites` : status}
          </div>
        )}
        <div
          ref={mapElementRef}
          className={frameless ? "min-h-[calc(100vh-9.5rem)] w-full" : "h-[460px] w-full"}
        />
      </div>
    </section>
  );
}

function centroidToPoint(centroid: SiteDashboardItem["centroid"]): Point | null {
  if (!centroid) return null;
  const [lat, lon] = centroid;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    type: "Point",
    coordinates: [lon, lat],
  };
}

function getLayerBounds(layer: Leaflet.Layer, L: typeof Leaflet): Leaflet.LatLngBounds {
  if ("getBounds" in layer && typeof layer.getBounds === "function") {
    return layer.getBounds();
  }

  if ("getLatLng" in layer && typeof layer.getLatLng === "function") {
    return L.latLngBounds([layer.getLatLng()]);
  }

  return L.latLngBounds([]);
}
