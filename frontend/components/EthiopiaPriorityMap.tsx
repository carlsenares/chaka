"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type { FeatureCollection, Geometry, Position } from "geojson";
import {
  getAdminHierarchy,
  getAreaSqKm,
  getPriorityLabel,
  joinPriorityResultsToBoundaries,
  type AdminBoundaryProperties,
  type JoinedPriorityFeature,
  type PriorityResult,
} from "@/mapRenderer";
import {
  PRIORITY_GRADIENT_CSS,
  getPriorityScoreRange,
  priorityColor,
  priorityOutlineColor,
  priorityTextColor,
  type PriorityScoreRange,
} from "@/priorityColor";

type MapMode = "map" | "satellite";
type GeoDataStatus = "ready" | "loading" | "empty" | "error";
type PanelMode = "ranked" | "browsed";

type EthiopiaPriorityMapProps = {
  priorityResults: PriorityResult[];
  selectedRankedPcode?: string;
  selectedMapAreaId?: string;
  onSelectMapArea?: (pcode: string | undefined) => void;
  status?: GeoDataStatus;
  resultBadge?: string;
  resultDescription?: string;
  legendNote?: string;
  priorityScoreRange?: PriorityScoreRange;
  showDetailsPanel?: boolean;
  className?: string;
};

const ETHIOPIA_BOUNDS: Leaflet.LatLngBoundsExpression = [
  [3.1, 32.7],
  [14.9, 48.3],
];

const ETHIOPIA_CENTER = { lat: 9.145, lng: 40.4897 };
const WORLD_MASK_RING: Leaflet.LatLngExpression[] = [
  [-89.9, -179.9],
  [-89.9, 179.9],
  [89.9, 179.9],
  [89.9, -179.9],
];
const NEIGHBOR_COUNTRY_LABELS = [
  { name: "Sudan", position: [13.2, 34.8] },
  { name: "South Sudan", position: [6.9, 32.9] },
  { name: "Kenya", position: [3.2, 38.4] },
  { name: "Somalia", position: [6.3, 47.0] },
  { name: "Eritrea", position: [14.8, 39.2] },
  { name: "Djibouti", position: [11.7, 42.7] },
] satisfies Array<{ name: string; position: [number, number] }>;

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
  priorityResults,
  selectedRankedPcode,
  selectedMapAreaId,
  onSelectMapArea,
  status = "ready",
  resultBadge = "Results joined by PCODE",
  resultDescription = "HDX/OCHA COD-AB Admin 2 fixture · selected polygons follow administrative boundaries.",
  legendNote = "Thin grey outlines show all loaded Admin 2 boundaries. Heatmap colors are recommendations joined by PCODE.",
  priorityScoreRange,
  showDetailsPanel = true,
  className = "",
}: EthiopiaPriorityMapProps) {
  const [adminBoundaries, setAdminBoundaries] =
    useState<FeatureCollection<Geometry, AdminBoundaryProperties> | null>(null);
  const [admin0Boundary, setAdmin0Boundary] = useState<FeatureCollection<Geometry> | null>(null);
  const [boundaryStatus, setBoundaryStatus] = useState<GeoDataStatus>("loading");
  const joinedBoundaries = useMemo(() => {
    if (!adminBoundaries) {
      return { type: "FeatureCollection", features: [] } as ReturnType<typeof joinPriorityResultsToBoundaries>;
    }

    return joinPriorityResultsToBoundaries(adminBoundaries, priorityResults as PriorityResult[]);
  }, [adminBoundaries, priorityResults]);
  const priorityFeatures = useMemo(
    () => joinedBoundaries.features.filter((feature) => feature.properties.recommendation),
    [joinedBoundaries],
  );
  const [mode, setMode] = useState<MapMode>("map");
  const [internalSelectedMapAreaId, setInternalSelectedMapAreaId] = useState<string | undefined>();
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const tileLayerRef = useRef<Leaflet.TileLayer | null>(null);
  const focusMaskLayerRef = useRef<Leaflet.Polygon | null>(null);
  const countryLabelLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<Leaflet.GeoJSON | null>(null);
  const selectedLabelMarkerRef = useRef<Leaflet.Marker | null>(null);

  const effectiveSelectedMapAreaId = onSelectMapArea
    ? selectedMapAreaId
    : selectedMapAreaId ?? internalSelectedMapAreaId;
  const selectedRankedFeature = useMemo(
    () =>
      joinedBoundaries.features.find((feature) => feature.properties.join_pcode === selectedRankedPcode) ??
      priorityFeatures[0],
    [joinedBoundaries, priorityFeatures, selectedRankedPcode],
  );
  const selectedMapFeature = useMemo(
    () =>
      joinedBoundaries.features.find((feature) => feature.properties.join_pcode === effectiveSelectedMapAreaId) ??
      selectedRankedFeature,
    [effectiveSelectedMapAreaId, joinedBoundaries, selectedRankedFeature],
  );
  const panelFeature = selectedMapFeature;
  const selectedMapPcodeForStyle = selectedMapFeature?.properties.join_pcode;
  const rankedPcodeForMode = selectedRankedFeature?.properties.join_pcode;
  const effectivePanelMode: PanelMode =
    selectedMapPcodeForStyle && selectedMapPcodeForStyle !== rankedPcodeForMode ? "browsed" : "ranked";
  const effectiveStatus = status === "ready" ? boundaryStatus : status;
  const fallbackPriorityScoreRange = useMemo(
    () => getPriorityScoreRange(priorityResults.map((result) => result.priority_score)),
    [priorityResults],
  );
  const effectivePriorityScoreRange = priorityScoreRange ?? fallbackPriorityScoreRange;

  const flyToFeature = (feature: JoinedPriorityFeature) => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    const featureLayer = L.geoJSON(feature);
    map.flyToBounds(featureLayer.getBounds(), {
      padding: [44, 44],
      duration: 0.7,
      maxZoom: 9,
    });
  };

  function selectMapFeature(feature: JoinedPriorityFeature, shouldZoom = true) {
    const pcode = feature.properties.join_pcode;
    setInternalSelectedMapAreaId(pcode);
    onSelectMapArea?.(pcode);

    if (shouldZoom) {
      flyToFeature(feature);
    }
  }

  useEffect(
    () => {
      if (!selectedMapFeature) return;
      flyToFeature(selectedMapFeature);
    },
    [selectedMapFeature?.properties.join_pcode],
  );

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
      map.createPane("ethiopiaContextMaskPane");
      const maskPane = map.getPane("ethiopiaContextMaskPane");
      if (maskPane) {
        maskPane.style.zIndex = "330";
        maskPane.style.pointerEvents = "none";
      }

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
        selectedLabelMarkerRef.current?.remove();
        focusMaskLayerRef.current?.remove();
        countryLabelLayerRef.current?.remove();
        mapRef.current.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
        focusMaskLayerRef.current = null;
        countryLabelLayerRef.current = null;
        boundaryLayerRef.current = null;
        selectedLabelMarkerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadBoundaries() {
      try {
        setBoundaryStatus("loading");
        const response = await fetch("/ethiopia_admin_boundaries.geojson");
        const admin0Response = await fetch("/ethiopia_admin0_boundary.geojson");
        if (!response.ok) throw new Error(`Boundary fetch failed: ${response.status}`);
        if (!admin0Response.ok) throw new Error(`Admin 0 boundary fetch failed: ${admin0Response.status}`);
        const data = (await response.json()) as FeatureCollection<Geometry, AdminBoundaryProperties>;
        const admin0Data = (await admin0Response.json()) as FeatureCollection<Geometry>;
        if (cancelled) return;

        setAdminBoundaries(data);
        setAdmin0Boundary(admin0Data);
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

    focusMaskLayerRef.current?.remove();
    countryLabelLayerRef.current?.remove();
    focusMaskLayerRef.current = null;
    countryLabelLayerRef.current = null;

    if (effectiveStatus !== "ready" || !admin0Boundary) return;

    const ethiopiaRings = getBoundaryOuterRings(admin0Boundary);
    if (ethiopiaRings.length === 0) return;

    focusMaskLayerRef.current = L.polygon([WORLD_MASK_RING, ...ethiopiaRings], {
      pane: "ethiopiaContextMaskPane",
      stroke: false,
      fillColor: mode === "satellite" ? "#d4d7d1" : "#f0f1eb",
      fillOpacity: mode === "satellite" ? 0.58 : 0.48,
      interactive: false,
      className: mode === "satellite" ? "ethiopia-context-mask satellite" : "ethiopia-context-mask",
    }).addTo(map);

    const labelLayer = L.layerGroup();
    labelLayer.addLayer(
      L.geoJSON(admin0Boundary, {
        interactive: false,
        style: {
          color: mode === "satellite" ? "#d9eadf" : "#24533c",
          fill: false,
          opacity: mode === "satellite" ? 0.82 : 0.72,
          weight: mode === "satellite" ? 2 : 1.5,
          className: "ethiopia-country-outline",
        },
      }),
    );
    labelLayer.addLayer(
      L.marker([ETHIOPIA_CENTER.lat, ETHIOPIA_CENTER.lng], {
        interactive: false,
        keyboard: false,
        zIndexOffset: 560,
        icon: L.divIcon({
          className: "ethiopia-country-label-wrapper",
          html: '<span class="ethiopia-country-label">Ethiopia</span>',
        }),
      }),
    );

    NEIGHBOR_COUNTRY_LABELS.forEach((label) => {
      labelLayer.addLayer(
        L.marker(label.position, {
          interactive: false,
          keyboard: false,
          zIndexOffset: 420,
          icon: L.divIcon({
            className: "neighbor-country-label-wrapper",
            html: `<span class="neighbor-country-label">${escapeHtml(label.name)}</span>`,
          }),
        }),
      );
    });

    labelLayer.addTo(map);
    countryLabelLayerRef.current = labelLayer;
    boundaryLayerRef.current?.bringToFront();

    return () => {
      focusMaskLayerRef.current?.remove();
      countryLabelLayerRef.current?.remove();
      focusMaskLayerRef.current = null;
      countryLabelLayerRef.current = null;
    };
  }, [admin0Boundary, effectiveStatus, mode]);

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
        return getBoundaryStyle(
          feature as JoinedPriorityFeature,
          selectedMapPcodeForStyle,
          effectivePriorityScoreRange,
        );
      },
      onEachFeature: (feature, layer) => {
        const joinedFeature = feature as JoinedPriorityFeature;
        const recommendation = joinedFeature.properties.recommendation;
        const layerWithStyle = layer as Leaflet.Path;

        layer.on("mouseover", () => {
          layerWithStyle.setStyle(
            getBoundaryStyle(
              joinedFeature,
              selectedMapPcodeForStyle,
              effectivePriorityScoreRange,
              true,
            ),
          );
        });
        layer.on("mouseout", () => {
          layerWithStyle.setStyle(
            getBoundaryStyle(
              joinedFeature,
              selectedMapPcodeForStyle,
              effectivePriorityScoreRange,
            ),
          );
        });
        layer.on("click", () => selectMapFeature(joinedFeature));

        layer.bindTooltip(
          recommendation
            ? `<strong>${joinedFeature.properties.adm2_name}</strong><br/><span style="display:inline-block;width:0.7rem;height:0.7rem;border-radius:0.18rem;background:${priorityColor(
                recommendation.priority_score,
                effectivePriorityScoreRange,
              )};margin-right:0.35rem;"></span>${getPriorityLabel(recommendation.priority_level)} · score ${recommendation.priority_score}`
            : `<strong>${joinedFeature.properties.adm2_name}</strong><br/>Admin boundary · no prototype recommendation`,
          { sticky: true, className: "priority-map-tooltip" },
        );
      },
    }).addTo(map);

    boundaryLayerRef.current.bringToFront();
    boundaryLayerRef.current.eachLayer((layer) => {
      const feature = (layer as Leaflet.Layer & { feature?: JoinedPriorityFeature }).feature;
      if (feature?.properties.join_pcode === selectedMapPcodeForStyle && "bringToFront" in layer) {
        (layer as Leaflet.Path).bringToFront();
      }
    });
  }, [effectivePriorityScoreRange, effectiveStatus, joinedBoundaries, selectedMapPcodeForStyle]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    selectedLabelMarkerRef.current?.remove();
    selectedLabelMarkerRef.current = null;

    if (effectiveStatus !== "ready" || !selectedMapFeature) return;

    const selectedLayer = L.geoJSON(selectedMapFeature);
    const center = selectedLayer.getBounds().getCenter();
    const recommendation = selectedMapFeature.properties.recommendation;
    const labelColor = recommendation
      ? priorityOutlineColor(recommendation.priority_score, effectivePriorityScoreRange)
      : "#243f32";

    selectedLabelMarkerRef.current = L.marker(center, {
      interactive: false,
      keyboard: false,
      zIndexOffset: 900,
      icon: L.divIcon({
        className: "priority-selected-label-wrapper",
        html: `<span class="priority-selected-label" style="color:${labelColor}">${escapeHtml(
          selectedMapFeature.properties.adm2_name,
        )}</span>`,
      }),
    }).addTo(map);

    return () => {
      selectedLabelMarkerRef.current?.remove();
      selectedLabelMarkerRef.current = null;
    };
  }, [effectivePriorityScoreRange, effectiveStatus, selectedMapFeature]);

  return (
    <section className={`overflow-hidden rounded-lg border border-[#d9d0bd] bg-[#fffdf7] shadow-sm ${className}`}>
      <div className="flex flex-col gap-4 border-b border-[#e7deca] bg-[#fbf7ee] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold uppercase text-accent">Ethiopia admin boundary map</p>
            <span className="rounded-full border border-[#d9d0bd] bg-white px-2.5 py-1 text-xs text-muted">
              {resultBadge}
            </span>
          </div>
          <h3 className="mt-1 text-xl font-semibold text-fg">Restoration opportunity overlays</h3>
          <p className="mt-1 text-sm text-muted">{resultDescription}</p>
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

      <div className={`grid min-h-[600px] ${showDetailsPanel ? "lg:grid-cols-[1fr_360px]" : ""}`}>
        <div className="relative min-h-[500px] overflow-hidden bg-[#edf2e7]">
          <div ref={mapElementRef} className="h-full min-h-[500px] w-full" aria-label="Interactive Leaflet map of Ethiopia administrative boundaries" />

          <MapStateOverlay status={effectiveStatus} hasFeatures={joinedBoundaries.features.length > 0} />

          {effectiveStatus === "ready" && joinedBoundaries.features.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 z-[500] flex flex-col gap-3 rounded-lg border border-[#d9d0bd] bg-white/90 p-4 shadow-sm backdrop-blur md:left-auto md:w-72">
              <p className="text-xs font-semibold uppercase text-muted">Priority legend</p>
              <div className="h-3 rounded-full border border-[#d9d0bd]" style={{ background: PRIORITY_GRADIENT_CSS }} />
              <div className="flex items-center justify-between text-xs font-semibold text-muted">
                <span>High</span>
                <span>Restoration Priority</span>
                <span>Low</span>
              </div>
              <div className="grid gap-2 text-sm text-fg">
                <LegendItem color="#1B5E20" label="Highest restoration priority" />
                <LegendItem color="#FDD835" label="Medium priority" />
                <LegendItem color="#E53935" label="Lowest priority" />
              </div>
              <p className="text-xs leading-5 text-muted">
                Colors indicate AI-computed restoration priority, normalized across displayed scores.
              </p>
              <p className="border-t border-[#eee4d3] pt-3 text-xs leading-5 text-muted">
                {legendNote}
              </p>
            </div>
          )}
        </div>

        {showDetailsPanel && (
          <aside className="border-t border-[#e7deca] bg-[#fffdf7] p-5 lg:border-l lg:border-t-0">
            {panelFeature && effectiveStatus === "ready" ? (
              <PriorityAreaPanel
                feature={panelFeature}
                mode={effectivePanelMode}
                priorityScoreRange={effectivePriorityScoreRange}
              />
            ) : (
              <FutureDataPanel status={effectiveStatus} />
            )}
          </aside>
        )}
      </div>
    </section>
  );
}

function getBoundaryStyle(
  feature: JoinedPriorityFeature,
  selectedMapPcode?: string,
  priorityScoreRange: PriorityScoreRange = { min: 0, max: 100 },
  hover = false,
): Leaflet.PathOptions {
  const recommendation = feature.properties.recommendation;
  const isMapSelection = feature.properties.join_pcode === selectedMapPcode;

  if (!recommendation) {
    return {
      color: isMapSelection ? "#4f6d5f" : "#8f8a7f",
      fillColor: isMapSelection ? "#dceadf" : "#f7f1df",
      fillOpacity: isMapSelection ? 0.34 : hover ? 0.14 : 0.02,
      opacity: isMapSelection ? 0.96 : 0.56,
      weight: isMapSelection ? 4.2 : hover ? 1.2 : 0.7,
      className: isMapSelection ? "priority-boundary-active" : "priority-boundary",
    };
  }

  const color = priorityColor(recommendation.priority_score, priorityScoreRange);
  const outlineColor = priorityOutlineColor(recommendation.priority_score, priorityScoreRange);

  return {
    color: isMapSelection ? outlineColor : color,
    fillColor: color,
    fillOpacity: isMapSelection ? (hover ? 0.7 : 0.66) : hover ? 0.42 : 0.29,
    opacity: 1,
    weight: isMapSelection ? (hover ? 5 : 4.6) : hover ? 2.3 : 1.5,
    className: isMapSelection ? "priority-boundary-active" : "priority-boundary",
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getBoundaryOuterRings(boundaries: FeatureCollection<Geometry>) {
  return boundaries.features.flatMap((feature) => geometryToOuterRings(feature.geometry));
}

function geometryToOuterRings(geometry: Geometry): Leaflet.LatLngExpression[][] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates[0] ? [positionRingToLatLngRing(geometry.coordinates[0])] : [];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((polygon) =>
      polygon[0] ? [positionRingToLatLngRing(polygon[0])] : [],
    );
  }

  return [];
}

function positionRingToLatLngRing(ring: Position[]) {
  return ring.map(([lng, lat]) => [lat, lng] as [number, number]);
}

function PriorityAreaPanel({
  feature,
  mode,
  priorityScoreRange,
}: {
  feature: JoinedPriorityFeature;
  mode: PanelMode;
  priorityScoreRange: PriorityScoreRange;
}) {
  const recommendation = feature.properties.recommendation;
  const hierarchy = getAdminHierarchy(feature.properties);
  const panelLabel = mode === "browsed" ? "Browsed administrative unit" : "Selected ranked recommendation";

  if (!recommendation) {
    return (
      <div className="rounded-lg border border-dashed border-[#cfc2aa] bg-[#fbf7ee] p-5">
        <p className="text-sm font-semibold text-fg">{panelLabel}</p>
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
          <p className="text-xs font-semibold uppercase text-accent">{panelLabel}</p>
          <h4 className="mt-1 text-2xl font-semibold text-fg">{feature.properties.adm2_name}</h4>
          <p className="mt-2 text-sm leading-6 text-muted">{hierarchy.join(" → ")}</p>
          <p className="mt-1 text-xs text-muted">PCODE: {feature.properties.join_pcode}</p>
        </div>
        <div
          className="rounded-lg border border-[#d9d0bd] px-3 py-2 text-center"
          style={{
            backgroundColor: priorityColor(recommendation.priority_score, priorityScoreRange),
            color: priorityTextColor(recommendation.priority_score, priorityScoreRange),
          }}
        >
          <p className="text-xs opacity-80">Score</p>
          <p className="text-2xl font-semibold text-current">{recommendation.priority_score}</p>
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

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-3 rounded-sm" style={{ backgroundColor: color }} />
      <span>{label}</span>
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
