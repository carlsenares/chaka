"use client";

import { useMemo, useState } from "react";
import { EthiopiaPriorityMap } from "@/components/EthiopiaPriorityMap";
import { layers, portfolioMetrics, regions, restorationAreas } from "@/mockData";

type Step = "landing" | "region" | "layers" | "loading" | "dashboard" | "detail" | "recommendation" | "export";

const stepLabels = ["Start", "Region", "Layers", "Analysis", "Dashboard", "Detail", "Brief"];

const scoreLabels = {
  biodiversity: "Biodiversity uplift",
  carbon: "Carbon storage potential",
  water: "Water impact",
  soil: "Soil stability",
  livelihoods: "Livelihood benefit",
  forestLoss: "Forest-loss risk",
};

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [selectedRegion, setSelectedRegion] = useState(regions[1].id);
  const [selectedLayers, setSelectedLayers] = useState(layers.map((layer) => layer.id));
  const [selectedAreaId, setSelectedAreaId] = useState("maji-bench-forest-edge");

  const region = regions.find((item) => item.id === selectedRegion) ?? regions[0];
  const areas = useMemo(
    () =>
      restorationAreas
        .filter((area) => area.regionId === selectedRegion)
        .sort((a, b) => a.rank - b.rank),
    [selectedRegion],
  );
  const selectedArea = areas.find((area) => area.id === selectedAreaId) ?? areas[0];
  const activeStepIndex = getStepIndex(step);

  function selectRegion(regionId: string) {
    const nextAreas = restorationAreas
      .filter((area) => area.regionId === regionId)
      .sort((a, b) => a.rank - b.rank);
    setSelectedRegion(regionId);
    setSelectedAreaId(nextAreas[0]?.id ?? selectedAreaId);
  }

  function selectArea(areaId: string) {
    setSelectedAreaId(areaId);
  }

  function toggleLayer(layerId: string) {
    setSelectedLayers((current) =>
      current.includes(layerId) ? current.filter((id) => id !== layerId) : [...current, layerId],
    );
  }

  function runAnalysis() {
    setStep("loading");
    window.setTimeout(() => setStep("dashboard"), 900);
  }

  return (
    <main className="min-h-screen bg-base text-fg">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <PrototypeBanner />
        <TopNav activeStepIndex={activeStepIndex} onReset={() => setStep("landing")} />

        {step === "landing" && (
          <Landing onStart={() => setStep("region")} onJumpToDashboard={() => setStep("dashboard")} />
        )}

        {step === "region" && (
          <RegionSelection
            selectedRegion={selectedRegion}
            onSelect={selectRegion}
            onBack={() => setStep("landing")}
            onNext={() => setStep("layers")}
          />
        )}

        {step === "layers" && (
          <LayerSelection
            selectedLayers={selectedLayers}
            onToggle={toggleLayer}
            onBack={() => setStep("region")}
            onNext={runAnalysis}
          />
        )}

        {step === "loading" && <AnalysisLoading regionName={region.name} />}

        {step === "dashboard" && (
          <Dashboard
            region={region}
            areas={areas}
            selectedArea={selectedArea}
            selectedAreaId={selectedAreaId}
            selectedLayers={selectedLayers}
            onSelectArea={selectArea}
            onDetail={() => setStep("detail")}
            onBack={() => setStep("layers")}
          />
        )}

        {step === "detail" && (
          <AreaDetail area={selectedArea} onBack={() => setStep("dashboard")} onNext={() => setStep("recommendation")} />
        )}

        {step === "recommendation" && (
          <Recommendation area={selectedArea} onBack={() => setStep("detail")} onNext={() => setStep("export")} />
        )}

        {step === "export" && (
          <ExportPreview
            area={selectedArea}
            region={region}
            selectedLayers={selectedLayers}
            onBack={() => setStep("recommendation")}
            onRestart={() => setStep("region")}
          />
        )}
      </div>
    </main>
  );
}

function PrototypeBanner() {
  return (
    <div className="mb-4 rounded-lg border border-[#d9d0bd] bg-[#fff9ed] px-4 py-3 text-sm text-muted">
      Prototype data only. Rankings, impact values, and map overlays are mock outputs designed to be replaced by live ingestion and agent pipelines.
    </div>
  );
}

function TopNav({ activeStepIndex, onReset }: { activeStepIndex: number; onReset: () => void }) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-[#d9d0bd] pb-5 lg:flex-row lg:items-center lg:justify-between">
      <button className="w-fit text-left" onClick={onReset}>
        <p className="text-xs font-semibold uppercase text-accent">Restoration decision support</p>
        <h1 className="text-2xl font-semibold text-fg">Chaka Priority Atlas</h1>
      </button>
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {stepLabels.map((label, index) => (
          <span
            key={label}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
              index <= activeStepIndex
                ? "border-[#1f6f68] bg-[#e7f0eb] text-[#1f6f68]"
                : "border-[#d9d0bd] bg-white text-muted"
            }`}
          >
            {label}
          </span>
        ))}
      </nav>
    </header>
  );
}

function Landing({ onStart, onJumpToDashboard }: { onStart: () => void; onJumpToDashboard: () => void }) {
  return (
    <section className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[0.92fr_1.08fr]">
      <div className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase text-accent">AI4GOOD Ethiopia restoration prototype</p>
        <h2 className="text-4xl font-semibold leading-tight text-fg sm:text-6xl">
          Prioritize restoration areas by ecological and livelihood impact.
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          Chaka helps restoration teams compare candidate areas using biodiversity, carbon, water,
          soil, forest-loss, and livelihood evidence. It supports expert review; it does not replace it.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button className="rounded-full bg-[#1f6f68] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#185b55]" onClick={onStart}>
            Start prioritization
          </button>
          <button className="rounded-full border border-[#cfc2aa] bg-white px-6 py-3 font-semibold text-fg transition hover:bg-[#fbf7ee]" onClick={onJumpToDashboard}>
            View map dashboard
          </button>
        </div>
      </div>
      <div className="space-y-4">
        <EthiopiaPriorityMap className="shadow-md" />
      </div>
    </section>
  );
}

function RegionSelection({
  selectedRegion,
  onSelect,
  onBack,
  onNext,
}: {
  selectedRegion: string;
  onSelect: (regionId: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className="py-8">
      <SectionHeader
        label="Step 1"
        title="Choose a decision geography"
        description="Select the region to screen. These cards currently use mock summaries and are structured for future admin-boundary results."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {regions.map((region) => (
          <button
            key={region.id}
            onClick={() => onSelect(region.id)}
            className={`rounded-lg border p-6 text-left shadow-sm transition ${
              selectedRegion === region.id ? "border-[#1f6f68] bg-[#eef7f2]" : "border-[#d9d0bd] bg-surface hover:bg-[#fbf7ee]"
            }`}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-fg">{region.name}</h3>
                <p className="mt-3 leading-7 text-muted">{region.description}</p>
              </div>
              <span className="rounded-full border border-[#d9d0bd] bg-white px-3 py-1 text-xs text-muted">
                {selectedRegion === region.id ? "Selected" : "Compare"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Watersheds" value={String(region.stats.watersheds)} />
              <MetricCard label="Forest loss" value={region.stats.forestLoss} />
              <MetricCard label="Households" value={region.stats.households} />
            </div>
            <p className="mt-5 rounded-md bg-[#fff9ed] px-4 py-3 text-sm text-muted">{region.signal}</p>
          </button>
        ))}
      </div>
      <PageActions onBack={onBack} onNext={onNext} nextLabel="Continue to evidence layers" />
    </section>
  );
}

function LayerSelection({
  selectedLayers,
  onToggle,
  onBack,
  onNext,
}: {
  selectedLayers: string[];
  onToggle: (layerId: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className="py-8">
      <SectionHeader
        label="Step 2"
        title="Select evidence layers"
        description="Layer selections are passed through client state today and can later map directly to ingestion and scoring pipeline inputs."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {layers.map((layer) => {
          const active = selectedLayers.includes(layer.id);
          return (
            <button
              key={layer.id}
              onClick={() => onToggle(layer.id)}
              className={`min-h-44 rounded-lg border p-5 text-left shadow-sm transition ${
                active ? "border-[#1f6f68] bg-[#eef7f2]" : "border-[#d9d0bd] bg-surface opacity-75 hover:opacity-100"
              }`}
            >
              <span className={`mb-5 inline-flex size-8 items-center justify-center rounded-full border text-sm ${active ? "border-[#1f6f68] text-[#1f6f68]" : "border-[#cfc2aa] text-muted"}`}>
                {active ? "On" : "+"}
              </span>
              <h3 className="text-lg font-semibold text-fg">{layer.name}</h3>
              <p className="mt-2 text-xs font-semibold uppercase text-accent">{layer.source}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{layer.description}</p>
            </button>
          );
        })}
      </div>
      <PageActions
        onBack={onBack}
        onNext={onNext}
        nextLabel={`Run prototype analysis with ${selectedLayers.length} layers`}
        disabled={selectedLayers.length === 0}
      />
    </section>
  );
}

function AnalysisLoading({ regionName }: { regionName: string }) {
  return (
    <section className="flex flex-1 items-center justify-center py-20">
      <div className="w-full max-w-2xl rounded-lg border border-[#d9d0bd] bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-7 flex size-20 items-center justify-center rounded-full border border-[#d9d0bd] bg-[#eef7f2]">
          <div className="size-10 animate-spin rounded-full border-2 border-[#1f6f68] border-t-transparent" />
        </div>
        <p className="text-sm font-semibold uppercase text-accent">Preparing prototype outputs</p>
        <h2 className="mt-3 text-3xl font-semibold text-fg">Ranking restoration opportunities in {regionName}</h2>
        <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          {["Checking evidence layers", "Scoring candidate areas", "Preparing map overlays"].map((item) => (
            <div key={item} className="rounded-md border border-[#e7deca] bg-[#fbf7ee] px-4 py-3 text-sm text-muted">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Dashboard({
  region,
  areas,
  selectedArea,
  selectedAreaId,
  selectedLayers,
  onSelectArea,
  onDetail,
  onBack,
}: {
  region: (typeof regions)[number];
  areas: typeof restorationAreas;
  selectedArea: (typeof restorationAreas)[number];
  selectedAreaId: string;
  selectedLayers: string[];
  onSelectArea: (areaId: string) => void;
  onDetail: () => void;
  onBack: () => void;
}) {
  return (
    <section className="py-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader
          label="Dashboard"
          title={`${region.name} restoration priority view`}
          description={`${selectedLayers.length} selected evidence layers are shown as prototype decision-support outputs, ready to be replaced by live pipeline results.`}
        />
        <div className="flex gap-3">
          <button className="rounded-full border border-[#cfc2aa] bg-white px-5 py-3 text-sm font-semibold text-fg" onClick={onBack}>
            Edit layers
          </button>
          <button className="rounded-full bg-[#1f6f68] px-5 py-3 text-sm font-semibold text-white" onClick={onDetail}>
            Open rationale
          </button>
        </div>
      </div>

      <EthiopiaPriorityMap status="ready" />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.82fr]">
        <div className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-fg">Ranked candidate areas</h3>
              <p className="text-sm text-muted">Mock decision-support outputs for live pitch review.</p>
            </div>
            <span className="rounded-full bg-[#fff9ed] px-3 py-1 text-xs text-muted">Prototype data</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-[#e7deca]">
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => onSelectArea(area.id)}
                className={`grid w-full gap-4 border-b border-[#e7deca] p-4 text-left last:border-b-0 md:grid-cols-[70px_1fr_130px] ${
                  selectedArea.id === area.id ? "bg-[#eef7f2]" : "bg-white hover:bg-[#fbf7ee]"
                }`}
              >
                <div>
                  <p className="text-xs text-muted">Rank</p>
                  <p className="text-2xl font-semibold text-fg">#{area.rank}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-fg">{area.name}</h4>
                  <p className="mt-1 text-sm text-muted">{area.zone}</p>
                  <p className="mt-2 text-sm text-muted">{area.intervention}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-xs text-muted">Priority score</p>
                  <p className="text-3xl font-semibold text-[#1f6f68]">{area.score}</p>
                  <p className="text-xs text-muted">{area.confidence} confidence</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <ImpactSummary area={selectedArea} />
          <PipelineStatesPreview />
        </div>
      </div>
    </section>
  );
}

function ImpactSummary({ area }: { area: (typeof restorationAreas)[number] }) {
  return (
    <div className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-fg">Impact indicators</h3>
      <p className="mt-1 text-sm text-muted">Current values are mock scores for interface testing.</p>
      <div className="mt-5 grid gap-4">
        <ScoreBar label="Biodiversity uplift" value={area.scores.biodiversity} />
        <ScoreBar label="Carbon storage potential" value={area.scores.carbon} />
        <ScoreBar label="Water impact" value={area.scores.water} />
        <ScoreBar label="Livelihood benefit" value={area.scores.livelihoods} />
      </div>
    </div>
  );
}

function PipelineStatesPreview() {
  return (
    <div className="rounded-lg border border-[#d9d0bd] bg-[#fbf7ee] p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-fg">Future data states</h3>
      <div className="mt-4 grid gap-3 text-sm text-muted">
        <p><span className="font-semibold text-fg">Loading:</span> waiting for geospatial features from ingestion.</p>
        <p><span className="font-semibold text-fg">Empty:</span> no areas match selected region or evidence filters.</p>
        <p><span className="font-semibold text-fg">Error:</span> map shell remains available while data retries.</p>
      </div>
    </div>
  );
}

function AreaDetail({ area, onBack, onNext }: { area: (typeof restorationAreas)[number]; onBack: () => void; onNext: () => void }) {
  return (
    <section className="py-8">
      <SectionHeader
        label="Recommendation rationale"
        title={area.name}
        description={`${area.zone}. Ranked #${area.rank} with ${area.confidence.toLowerCase()} prototype confidence.`}
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-[#d9d0bd] bg-surface p-6 shadow-sm">
          <p className="text-sm text-muted">Priority score</p>
          <p className="mt-2 text-6xl font-semibold text-[#1f6f68]">{area.score}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <MetricCard label="Area" value={area.hectares} />
            <MetricCard label="Households" value={area.households} />
            <MetricCard label="Pilot" value={area.timeline} />
            <MetricCard label="Budget" value={area.investment} />
          </div>
        </div>
        <div className="rounded-lg border border-[#d9d0bd] bg-surface p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-fg">Why this area ranks highly</h3>
          <div className="mt-5 grid gap-4">
            {area.rationale.map((item, index) => (
              <div key={item} className="flex gap-4 rounded-md border border-[#e7deca] bg-[#fbf7ee] p-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e7f0eb] text-sm text-[#1f6f68]">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-muted">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ScoreBreakdown scores={area.scores} />
      <PageActions onBack={onBack} onNext={onNext} nextLabel="View intervention package" />
    </section>
  );
}

function Recommendation({ area, onBack, onNext }: { area: (typeof restorationAreas)[number]; onBack: () => void; onNext: () => void }) {
  return (
    <section className="py-8">
      <SectionHeader
        label="Intervention package"
        title={area.intervention}
        description="A suggested restoration approach for expert review, budget discussion, and field validation."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="rounded-lg border border-[#d9d0bd] bg-surface p-6 shadow-sm lg:col-span-2">
          <h3 className="text-2xl font-semibold text-fg">Suggested package</h3>
          <p className="mt-4 leading-7 text-muted">
            Prioritize a community-led pilot that combines ecological restoration with practical
            livelihood value. Live versions should include participatory validation, safeguards,
            benefit-sharing review, and monitoring requirements.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {area.outputs.map((output) => (
              <div key={output} className="rounded-md border border-[#e7deca] bg-[#fbf7ee] p-4 text-sm text-fg">
                {output}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[#d9d0bd] bg-surface p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-fg">Evidence status</h3>
          <p className="mt-3 text-sm leading-6 text-muted">
            Current recommendation text is mock data. Future outputs should include source coverage,
            model confidence, uncertainty, and validation notes.
          </p>
        </div>
      </div>
      <PageActions onBack={onBack} onNext={onNext} nextLabel="Preview project brief" />
    </section>
  );
}

function ExportPreview({
  area,
  region,
  selectedLayers,
  onBack,
  onRestart,
}: {
  area: (typeof restorationAreas)[number];
  region: (typeof regions)[number];
  selectedLayers: string[];
  onBack: () => void;
  onRestart: () => void;
}) {
  return (
    <section className="py-8">
      <SectionHeader
        label="Export preview"
        title="Project brief preview"
        description="A concise summary format for partner review. Values shown are prototype-only."
      />
      <div className="mt-8 rounded-lg border border-[#d9d0bd] bg-surface p-5 text-fg shadow-sm sm:p-8">
        <div className="border-b border-[#e7deca] pb-5">
          <p className="text-sm font-semibold uppercase text-accent">Chaka Priority Atlas</p>
          <h3 className="mt-2 text-3xl font-semibold">{area.name}</h3>
          <p className="mt-2 text-muted">{region.name} | {area.zone} | {area.hectares}</p>
        </div>
        <div className="grid gap-6 py-6 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h4 className="text-lg font-semibold">Decision summary</h4>
            <p className="mt-3 leading-7 text-muted">
              Review {area.intervention.toLowerCase()} as a candidate restoration package. This
              prototype ranks the area #{area.rank} in {region.name} with a priority score of {area.score}/100.
            </p>
            <h4 className="mt-6 text-lg font-semibold">Evidence layers used</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedLayers.map((layerId) => (
                <span key={layerId} className="rounded-full bg-[#e7f0eb] px-3 py-1 text-sm text-[#1f6f68]">
                  {layers.find((layer) => layer.id === layerId)?.source}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            <MetricCard label="Recommended budget" value={area.investment} />
            <MetricCard label="Pilot timeline" value={area.timeline} />
            <MetricCard label="Confidence" value={area.confidence} />
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button className="rounded-full border border-[#cfc2aa] bg-white px-5 py-3 font-semibold text-fg" onClick={onBack}>
          Back
        </button>
        <button className="rounded-full bg-[#1f6f68] px-5 py-3 font-semibold text-white" onClick={onRestart}>
          Compare another region
        </button>
      </div>
    </section>
  );
}

function SectionHeader({ label, title, description }: { label: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase text-accent">{label}</p>
      <h2 className="mt-2 text-3xl font-semibold leading-tight text-fg sm:text-5xl">{title}</h2>
      <p className="mt-4 leading-7 text-muted">{description}</p>
    </div>
  );
}

function PageActions({
  onBack,
  onNext,
  nextLabel,
  disabled = false,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
      <button className="rounded-full border border-[#cfc2aa] bg-white px-5 py-3 font-semibold text-fg" onClick={onBack}>
        Back
      </button>
      <button
        className="rounded-full bg-[#1f6f68] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onNext}
        disabled={disabled}
      >
        {nextLabel}
      </button>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e7deca] bg-white p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-fg">{value}</p>
    </div>
  );
}

function ScoreBreakdown({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="mt-5 rounded-lg border border-[#d9d0bd] bg-surface p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-fg">Evidence score breakdown</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(scores).map(([key, value]) => (
          <ScoreBar key={key} label={scoreLabels[key as keyof typeof scoreLabels]} value={value} />
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-fg">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e5dcc9]">
        <div className="h-full rounded-full bg-[#1f6f68]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function getStepIndex(step: Step) {
  const map: Record<Step, number> = {
    landing: 0,
    region: 1,
    layers: 2,
    loading: 3,
    dashboard: 4,
    detail: 5,
    recommendation: 5,
    export: 6,
  };

  return map[step];
}
