"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { FeatureCollection, Geometry } from "geojson";
import priorityResults from "@/mock_priority_results.json";
import {
  getAdminHierarchy,
  getAreaSqKm,
  getPriorityColor,
  getPriorityLabel,
  joinPriorityResultsToBoundaries,
  type AdminBoundaryProperties,
  type JoinedPriorityFeature,
  type PriorityResult,
} from "@/mapRenderer";

type MapMode = "map" | "satellite";
type GeoDataStatus = "ready" | "loading" | "empty" | "error";

type EthiopiaPriorityMapProps = {
  selectedPcode?: string;
  onSelectPcode?: (pcode: string) => void;
  status?: GeoDataStatus;
  className?: string;
};

const ETHIOPIA_BOUNDS: Leaflet.LatLngBoundsExpression = [
  [3.1, 32.7],
  [14.9, 48.3],
];

const ETHIOPIA_CENTER = { lat: 9.145, lng: 40.4897 };

const BASEMAPS = {
  map: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },
} satisfies Record<MapMode, { url: string; attribution: string }>;

export function EthiopiaPriorityMap({
  selectedPcode,
  onSelectPcode,
  status = "ready",
  className = "",
}: EthiopiaPriorityMapProps) {
  const [adminBoundaries, setAdminBoundaries] =
    useState<FeatureCollection<Geometry, AdminBoundaryProperties> | null>(null);
  const [boundaryStatus, setBoundaryStatus] = useState<GeoDataStatus>("loading");
  const joinedBoundaries = useMemo(() => {
    if (!adminBoundaries) {
      return { type: "FeatureCollection", features: [] } as ReturnType<typeof joinPriorityResultsToBoundaries>;
    }

    return joinPriorityResultsToBoundaries(adminBoundaries, priorityResults as PriorityResult[]);
  }, [adminBoundaries]);
  const priorityFeatures = useMemo(
    () => joinedBoundaries.features.filter((feature) => feature.properties.recommendation),
    [joinedBoundaries],
  );
  const [mode, setMode] = useState<MapMode>("map");
  const [internalSelectedPcode, setInternalSelectedPcode] = useState(selectedPcode);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const tileLayerRef = useRef<Leaflet.TileLayer | null>(null);
  const boundaryLayerRef = useRef<Leaflet.GeoJSON | null>(null);

  const activePcode = selectedPcode ?? internalSelectedPcode;
  const activeFeature = useMemo(
    () =>
      joinedBoundaries.features.find((feature) => feature.properties.join_pcode === activePcode) ??
      priorityFeatures[0],
    [activePcode, priorityFeatures],
  );
  const effectiveStatus = status === "ready" ? boundaryStatus : status;

  function selectFeature(feature: JoinedPriorityFeature, shouldZoom = true) {
    if (!feature.properties.recommendation) return;

    const pcode = feature.properties.join_pcode;
    setInternalSelectedPcode(pcode);
    onSelectPcode?.(pcode);

    if (shouldZoom) {
      const map = mapRef.current;
      const L = leafletRef.current;
      if (!map || !L) return;

      const featureLayer = L.geoJSON(feature);
      map.flyToBounds(featureLayer.getBounds(), {
        padding: [44, 44],
        duration: 0.7,
        maxZoom: 9,
      });
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapElementRef.current || mapRef.current) return;

      const L = await import("leaflet");
      if (cancelled || !mapElementRef.current) return;

      leafletRef.current = L;
      const map = L.map(mapElementRef.current, {
        center: [ETHIOPIA_CENTER.lat, ETHIOPIA_CENTER.lng],
        zoom: 6,
        minZoom: 5,
        maxZoom: 14,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      map.fitBounds(ETHIOPIA_BOUNDS, { padding: [18, 18] });
      mapRef.current = map;
      tileLayerRef.current = L.tileLayer(BASEMAPS[mode].url, {
        attribution: BASEMAPS[mode].attribution,
        maxZoom: 19,
      }).addTo(map);

      window.setTimeout(() => map.invalidateSize(), 150);
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
        boundaryLayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadBoundaries() {
      try {
        setBoundaryStatus("loading");
        const response = await fetch("/ethiopia_admin_boundaries.geojson");
        if (!response.ok) throw new Error(`Boundary fetch failed: ${response.status}`);
        const data = (await response.json()) as FeatureCollection<Geometry, AdminBoundaryProperties>;
        if (cancelled) return;

        setAdminBoundaries(data);
        setBoundaryStatus(data.features.length > 0 ? "ready" : "empty");
      } catch {
        if (!cancelled) setBoundaryStatus("error");
      }
    }

    loadBoundaries();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!internalSelectedPcode && priorityFeatures[0]) {
      setInternalSelectedPcode(priorityFeatures[0].properties.join_pcode);
    }
  }, [internalSelectedPcode, priorityFeatures]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.removeFrom(map);
    }

    tileLayerRef.current = L.tileLayer(BASEMAPS[mode].url, {
      attribution: BASEMAPS[mode].attribution,
      maxZoom: 19,
    }).addTo(map);
  }, [mode]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (boundaryLayerRef.current) {
      boundaryLayerRef.current.removeFrom(map);
    }

    if (effectiveStatus !== "ready" || joinedBoundaries.features.length === 0) return;

    boundaryLayerRef.current = L.geoJSON(joinedBoundaries, {
      style: (feature) => {
        return getBoundaryStyle(feature as JoinedPriorityFeature, activeFeature?.properties.join_pcode);
      },
      onEachFeature: (feature, layer) => {
        const joinedFeature = feature as JoinedPriorityFeature;
        const recommendation = joinedFeature.properties.recommendation;
        const layerWithStyle = layer as Leaflet.Path;

        layer.on("mouseover", () => {
          layerWithStyle.setStyle(getBoundaryStyle(joinedFeature, activeFeature?.properties.join_pcode, true));
        });
        layer.on("mouseout", () => {
          layerWithStyle.setStyle(getBoundaryStyle(joinedFeature, activeFeature?.properties.join_pcode));
        });
        layer.on("click", () => selectFeature(joinedFeature));

        layer.bindTooltip(
          recommendation
            ? `<strong>${joinedFeature.properties.adm2_name}</strong><br/>${getPriorityLabel(recommendation.priority_level)} · score ${recommendation.priority_score}`
            : `<strong>${joinedFeature.properties.adm2_name}</strong><br/>Admin boundary · no prototype recommendation`,
          { sticky: true, className: "priority-map-tooltip" },
        );
      },
    }).addTo(map);

    boundaryLayerRef.current.bringToFront();
  }, [activeFeature?.properties.join_pcode, effectiveStatus, joinedBoundaries]);

  return (
    <section className={`overflow-hidden rounded-lg border border-[#d9d0bd] bg-[#fffdf7] shadow-sm ${className}`}>
      <div className="flex flex-col gap-4 border-b border-[#e7deca] bg-[#fbf7ee] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold uppercase text-accent">Ethiopia admin boundary map</p>
            <span className="rounded-full border border-[#d9d0bd] bg-white px-2.5 py-1 text-xs text-muted">
              Mock results joined by PCODE
            </span>
          </div>
          <h3 className="mt-1 text-xl font-semibold text-fg">Restoration opportunity overlays</h3>
          <p className="mt-1 text-sm text-muted">
            HDX/OCHA COD-AB Admin 2 fixture · selected polygons follow administrative boundaries.
          </p>
        </div>

        <div className="flex w-full rounded-full border border-[#d9d0bd] bg-white p-1 md:w-auto">
          <button
            type="button"
            onClick={() => setMode("map")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition md:flex-none ${
              mode === "map" ? "bg-[#1f6f68] text-white" : "text-muted hover:bg-[#f3eadb]"
            }`}
          >
            2D map
          </button>
          <button
            type="button"
            onClick={() => setMode("satellite")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition md:flex-none ${
              mode === "satellite" ? "bg-[#1f6f68] text-white" : "text-muted hover:bg-[#f3eadb]"
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      <div className="grid min-h-[600px] lg:grid-cols-[1fr_360px]">
        <div className="relative min-h-[500px] overflow-hidden bg-[#edf2e7]">
          <div ref={mapElementRef} className="h-full min-h-[500px] w-full" aria-label="Interactive Leaflet map of Ethiopia administrative boundaries" />

          <MapStateOverlay status={effectiveStatus} hasFeatures={joinedBoundaries.features.length > 0} />

          {effectiveStatus === "ready" && joinedBoundaries.features.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 z-[500] flex flex-col gap-3 rounded-lg border border-[#d9d0bd] bg-white/90 p-4 shadow-sm backdrop-blur md:left-auto md:w-72">
              <p className="text-xs font-semibold uppercase text-muted">Priority legend</p>
              {["Highest", "High", "Medium", "Lower"].map((level) => (
                <div key={level} className="flex items-center gap-2 text-sm text-fg">
                  <span className="size-3 rounded-sm" style={{ backgroundColor: getPriorityColor(level as never) }} />
                  {getPriorityLabel(level as never)}
                </div>
              ))}
              <p className="border-t border-[#eee4d3] pt-3 text-xs leading-5 text-muted">
                Thin grey outlines show all loaded Admin 2 boundaries. Green/yellow fills are prototype recommendations joined by PCODE.
              </p>
            </div>
          )}
        </div>

        <aside className="border-t border-[#e7deca] bg-[#fffdf7] p-5 lg:border-l lg:border-t-0">
          {activeFeature && effectiveStatus === "ready" ? (
            <PriorityAreaPanel feature={activeFeature} />
          ) : (
            <FutureDataPanel status={effectiveStatus} />
          )}
        </aside>
      </div>
    </section>
  );
}

function getBoundaryStyle(feature: JoinedPriorityFeature, activePcode?: string, hover = false): Leaflet.PathOptions {
  const recommendation = feature.properties.recommendation;
  const isActive = feature.properties.join_pcode === activePcode;

  if (!recommendation) {
    return {
      color: "#8f8a7f",
      fillColor: "#f7f1df",
      fillOpacity: hover ? 0.08 : 0.02,
      opacity: 0.56,
      weight: hover ? 1.2 : 0.7,
    };
  }

  const color = getPriorityColor(recommendation.priority_level);

  return {
    color,
    fillColor: color,
    fillOpacity: hover ? 0.42 : isActive ? 0.38 : 0.31,
    opacity: 1,
    weight: isActive ? 3.2 : hover ? 2.3 : 1.7,
    className: isActive ? "priority-boundary-active" : "priority-boundary",
  };
}

function PriorityAreaPanel({ feature }: { feature: JoinedPriorityFeature }) {
  const recommendation = feature.properties.recommendation;
  const hierarchy = getAdminHierarchy(feature.properties);

  if (!recommendation) {
    return (
      <div className="rounded-lg border border-dashed border-[#cfc2aa] bg-[#fbf7ee] p-5">
        <p className="text-sm font-semibold text-fg">Administrative boundary</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {hierarchy.join(" → ")} has no prototype recommendation attached.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Selected administrative unit</p>
          <h4 className="mt-1 text-2xl font-semibold text-fg">{feature.properties.adm2_name}</h4>
          <p className="mt-2 text-sm leading-6 text-muted">{hierarchy.join(" → ")}</p>
          <p className="mt-1 text-xs text-muted">PCODE: {feature.properties.join_pcode}</p>
        </div>
        <div className="rounded-lg border border-[#d9d0bd] bg-[#fbf7ee] px-3 py-2 text-center">
          <p className="text-xs text-muted">Score</p>
          <p className="text-2xl font-semibold text-fg">{recommendation.priority_score}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <InfoTile label="Admin level" value={`Admin ${recommendation.admin_level}`} />
        <InfoTile label="Area" value={getAreaSqKm(feature.properties)} />
        <InfoTile label="Opportunity" value={recommendation.estimated_restoration_opportunity} />
        <InfoTile label="Confidence" value={recommendation.confidence} />
      </div>

      <div className="mt-5 grid gap-3">
        <ImpactBar label="Biodiversity impact" value={recommendation.biodiversity_score} />
        <ImpactBar label="Carbon potential" value={recommendation.carbon_score} />
        <ImpactBar label="Water impact" value={recommendation.water_score} />
        <ImpactBar label="Livelihood benefit" value={recommendation.livelihood_score} />
      </div>

      <div className="mt-5 rounded-lg border border-[#e3d8c4] bg-[#fbf7ee] p-4">
        <p className="text-sm font-semibold text-fg">Recommendation rationale</p>
        <p className="mt-2 text-sm leading-6 text-muted">{recommendation.rationale}</p>
      </div>

      <div className="mt-4 rounded-lg border border-[#d8e5dc] bg-[#f1f7f2] p-4">
        <p className="text-sm font-semibold text-fg">Evidence status</p>
        <p className="mt-2 text-sm leading-6 text-muted">{recommendation.evidence}</p>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e7deca] bg-white p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-fg">{value}</p>
    </div>
  );
}

function ImpactBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-fg">{value}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e5dcc9]">
        <div className="h-full rounded-full bg-[#1f6f68]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function MapStateOverlay({ status, hasFeatures }: { status: GeoDataStatus; hasFeatures: boolean }) {
  if (status === "ready" && hasFeatures) return null;

  const stateCopy = {
    loading: {
      title: "Loading administrative boundaries",
      body: "Priority areas will appear after the boundary GeoJSON and recommendation results are joined by PCODE.",
    },
    empty: {
      title: "No priority areas available",
      body: "No recommendation PCODEs matched the currently loaded administrative boundaries.",
    },
    error: {
      title: "Map data could not be loaded",
      body: "The real basemap remains available. Boundary and recommendation layers can retry independently.",
    },
    ready: {
      title: "No administrative boundaries available",
      body: "No Admin boundary GeoJSON features were passed to the renderer.",
    },
  } satisfies Record<GeoDataStatus, { title: string; body: string }>;

  return (
    <div className="absolute inset-4 z-[600] flex items-center justify-center rounded-lg border border-dashed border-[#cfc2aa] bg-white/85 p-6 text-center backdrop-blur-sm">
      <div className="max-w-sm">
        {status === "loading" && <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-[#1f6f68] border-t-transparent" />}
        <h4 className="text-lg font-semibold text-fg">{stateCopy[status].title}</h4>
        <p className="mt-2 text-sm leading-6 text-muted">{stateCopy[status].body}</p>
      </div>
    </div>
  );
}

function FutureDataPanel({ status }: { status: GeoDataStatus }) {
  return (
    <div className="rounded-lg border border-dashed border-[#cfc2aa] bg-[#fbf7ee] p-5">
      <p className="text-sm font-semibold text-fg">Future data panel</p>
      <p className="mt-2 text-sm leading-6 text-muted">
        Current status: {status}. The map renderer expects recommendation outputs with admin level,
        PCODE, impact metrics, rationale, confidence, and evidence fields.
      </p>
    </div>
  );
}
