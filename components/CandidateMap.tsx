"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { priorityColor, type PriorityScoreRange } from "@/lib/priority-color";
import type { SiteDashboardItem } from "@/lib/site-view-model";

type CandidateMapProps = {
  sites: SiteDashboardItem[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
  scoreRange: PriorityScoreRange;
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
}: CandidateMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const layerRef = useRef<Leaflet.GeoJSON | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");

  const featureCollection = useMemo(() => {
    const features = sites
      .flatMap((site) => {
        if (!site.geometry) return [];

        return [
          {
            type: "Feature",
            properties: {
              site_id: site.site_id,
              name: site.name,
              score: site.priority_score,
              rank: site.rank,
            },
            geometry: site.geometry,
          } satisfies Feature<Polygon>,
        ];
      });

    return {
      type: "FeatureCollection",
      features,
    } satisfies FeatureCollection<Polygon>;
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
      style: (feature) => {
        const siteId = String(feature?.properties?.site_id ?? "");
        const score = Number(feature?.properties?.score ?? 0);
        const selected = siteId === selectedSiteId;
        const color = priorityColor(score, scoreRange);

        return {
          color: selected ? "#ffffff" : color,
          fillColor: color,
          fillOpacity: selected ? 0.72 : 0.48,
          opacity: 1,
          weight: selected ? 3 : 1.5,
        };
      },
      onEachFeature: (feature, layerInstance) => {
        const siteId = String(feature.properties?.site_id ?? "");
        const name = String(feature.properties?.name ?? siteId);
        const score = Number(feature.properties?.score ?? 0);

        layerInstance.bindTooltip(`${name} · ${score}`, {
          sticky: true,
          direction: "top",
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
      const bounds = (selectedLayer as Leaflet.Polygon).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [72, 72], maxZoom: 9 });
      }
    }
  }, [featureCollection, onSelectSite, scoreRange, selectedSiteId]);

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-surface shadow-xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h2 className="font-semibold">Candidate polygons</h2>
          <p className="text-xs text-muted">Joined by site_id from candidate_sites.geojson.</p>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs uppercase text-muted">
          {status}
        </span>
      </div>
      <div ref={mapElementRef} className="h-[460px] w-full" />
    </section>
  );
}
