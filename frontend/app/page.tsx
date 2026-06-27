"use client";

import { useMemo, useState } from "react";
import { EthiopiaPriorityMap } from "@/components/EthiopiaPriorityMap";
import {
  atlasViewModels,
  rankAreas,
  type AtlasViewModel,
  type DataSourceMode,
  type ObjectiveKey,
  type ObjectiveWeights,
  type RankedAreaViewModel,
  type RegionViewModel,
} from "@/data/atlasViewModel";
import type { PriorityResult } from "@/mapRenderer";
import {
  getPriorityScoreRange,
  priorityColor,
  priorityTextColor,
  priorityTint,
  type PriorityScoreRange,
} from "@/priorityColor";

type Step = "landing" | "region" | "layers" | "loading" | "dashboard" | "detail" | "recommendation" | "export";

const stepLabels = ["Start", "Region", "Weights", "Analysis", "Dashboard", "Detail", "Brief"];

const defaultObjectiveWeights: ObjectiveWeights = {
  biodiversity: 90,
  carbon: 75,
  water: 85,
  livelihood: 80,
};

const objectives: Array<{
  key: ObjectiveKey;
  label: string;
  description: string;
  backendField: string;
}> = [
  {
    key: "biodiversity",
    label: "Biodiversity",
    description: "Habitat connectivity, species value, and ecological uplift.",
    backendField: "biodiversity_weight",
  },
  {
    key: "carbon",
    label: "Carbon Storage",
    description: "Above-ground biomass recovery and long-term sequestration potential.",
    backendField: "carbon_weight",
  },
  {
    key: "water",
    label: "Water Security",
    description: "Watershed regulation, spring protection, and downstream water benefits.",
    backendField: "water_weight",
  },
  {
    key: "livelihood",
    label: "Livelihood Impact",
    description: "Household benefit, implementation feasibility, and community value.",
    backendField: "livelihood_weight",
  },
];

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
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>("demo");
  const [objectiveWeights, setObjectiveWeights] = useState<ObjectiveWeights>(defaultObjectiveWeights);
  const viewModel = atlasViewModels[dataSourceMode];
  const [selectedRegion, setSelectedRegion] = useState(viewModel.regions[1].id);
  const [selectedRankedAreaId, setSelectedRankedAreaId] = useState("maji-bench-forest-edge");
  const [selectedMapAreaId, setSelectedMapAreaId] = useState<string | undefined>("ET1103");

  const region = viewModel.regions.find((item) => item.id === selectedRegion) ?? viewModel.regions[0];
  const areas = useMemo(
    () =>
      rankAreas(
        viewModel.areas.filter((area) => area.regionId === selectedRegion),
        objectiveWeights,
        viewModel.weightsAffectScores,
      ),
    [objectiveWeights, selectedRegion, viewModel],
  );
  const dashboardPriorityResults = useMemo(
    () => buildPriorityResultsForAreas(viewModel.priorityResults, areas),
    [areas, viewModel.priorityResults],
  );
  const priorityScoreRange = useMemo(
    () => getPriorityScoreRange(areas.map((area) => area.priorityScore)),
    [areas],
  );
  const selectedArea = areas.find((area) => area.id === selectedRankedAreaId) ?? areas[0];
  const activeStepIndex = getStepIndex(step);

  function selectRegion(regionId: string) {
    const nextAreas = viewModel.areas
      .filter((area) => area.regionId === regionId)
      .sort((a, b) => a.rank - b.rank);
    const nextArea = nextAreas[0];
    setSelectedRegion(regionId);
    setSelectedRankedAreaId(nextArea?.id ?? selectedRankedAreaId);
    setSelectedMapAreaId(nextArea?.pcode);
  }

  function selectArea(areaId: string) {
    const nextArea = areas.find((area) => area.id === areaId);

    setSelectedRankedAreaId(areaId);
    setSelectedMapAreaId(nextArea?.pcode);
  }

  function updateObjectiveWeight(key: ObjectiveKey, value: number) {
    setObjectiveWeights((current) => ({ ...current, [key]: value }));
  }

  function resetObjectiveWeights() {
    setObjectiveWeights(defaultObjectiveWeights);
  }

  function runAnalysis() {
    setStep("loading");
    window.setTimeout(() => setStep("dashboard"), 900);
  }

  function changeDataSource(mode: DataSourceMode) {
    const nextViewModel = atlasViewModels[mode];
    const nextRegion =
      nextViewModel.regions.find((item) => item.id === selectedRegion)?.id ?? nextViewModel.regions[0].id;
    const nextArea =
      nextViewModel.areas.find((area) => area.id === selectedRankedAreaId && area.regionId === nextRegion) ??
      nextViewModel.areas.find((area) => area.regionId === nextRegion) ??
      nextViewModel.areas[0];

    setDataSourceMode(mode);
    setSelectedRegion(nextRegion);
    setSelectedRankedAreaId(nextArea.id);
    setSelectedMapAreaId(nextArea.pcode);
  }

  return (
    <main className="min-h-screen bg-base text-fg">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <PrototypeBanner notice={viewModel.prototypeNotice} />
        <TopNav
          activeStepIndex={activeStepIndex}
          dataSourceMode={dataSourceMode}
          sourceBadge={viewModel.sourceBadge}
          sourceBadgeTone={viewModel.sourceBadgeTone}
          onChangeDataSource={changeDataSource}
          onReset={() => setStep("landing")}
        />

        {step === "landing" && (
          <Landing
            viewModel={viewModel}
            onStart={() => setStep("region")}
            onJumpToDashboard={() => setStep("dashboard")}
          />
        )}

        {step === "region" && (
          <RegionSelection
            regions={viewModel.regions}
            selectedRegion={selectedRegion}
            onSelect={selectRegion}
            onBack={() => setStep("landing")}
            onNext={() => setStep("layers")}
          />
        )}

        {step === "layers" && (
          <PreferenceSelection
            objectiveWeights={objectiveWeights}
            onWeightChange={updateObjectiveWeight}
            onReset={resetObjectiveWeights}
            onBack={() => setStep("region")}
            onNext={runAnalysis}
          />
        )}

        {step === "loading" && <AnalysisLoading regionName={region.name} />}

        {step === "dashboard" && (
          <Dashboard
            region={region}
            viewModel={viewModel}
            areas={areas}
            selectedArea={selectedArea}
            selectedRankedAreaId={selectedRankedAreaId}
            selectedMapAreaId={selectedMapAreaId}
            priorityResults={dashboardPriorityResults}
            priorityScoreRange={priorityScoreRange}
            objectiveWeights={objectiveWeights}
            onSelectArea={selectArea}
            onSelectMapArea={setSelectedMapAreaId}
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
            objectiveWeights={objectiveWeights}
            onBack={() => setStep("recommendation")}
            onRestart={() => setStep("region")}
          />
        )}
      </div>
    </main>
  );
}

function PrototypeBanner({ notice }: { notice: string }) {
  return (
    <div className="mb-4 rounded-lg border border-[#d9d0bd] bg-[#fff9ed] px-4 py-3 text-sm text-muted">
      {notice}
    </div>
  );
}

function TopNav({
  activeStepIndex,
  dataSourceMode,
  sourceBadge,
  sourceBadgeTone,
  onChangeDataSource,
  onReset,
}: {
  activeStepIndex: number;
  dataSourceMode: DataSourceMode;
  sourceBadge: string;
  sourceBadgeTone: AtlasViewModel["sourceBadgeTone"];
  onChangeDataSource: (mode: DataSourceMode) => void;
  onReset: () => void;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-[#d9d0bd] pb-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-4">
        <button className="w-fit text-left" onClick={onReset}>
          <p className="text-xs font-semibold uppercase text-accent">Restoration decision support</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-fg">Chaka Priority Atlas</h1>
            <SourceBadge label={sourceBadge} tone={sourceBadgeTone} />
          </div>
        </button>
        <DataSourceTabs activeMode={dataSourceMode} onChange={onChangeDataSource} />
      </div>
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

function DataSourceTabs({
  activeMode,
  onChange,
}: {
  activeMode: DataSourceMode;
  onChange: (mode: DataSourceMode) => void;
}) {
  const tabs: Array<{ mode: DataSourceMode; label: string }> = [
    { mode: "demo", label: "Demo (Mock Data)" },
    { mode: "backend", label: "Backend Preview" },
  ];

  return (
    <div className="flex w-full rounded-full border border-[#d9d0bd] bg-white p-1 sm:w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.mode}
          type="button"
          onClick={() => onChange(tab.mode)}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${
            activeMode === tab.mode ? "bg-[#1f6f68] text-white" : "text-muted hover:bg-[#f3eadb]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SourceBadge({ label, tone }: { label: string; tone: AtlasViewModel["sourceBadgeTone"] }) {
  const dotColor = tone === "blue" ? "#2878a8" : "#2f7d4f";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#d9d0bd] bg-white px-3 py-1 text-xs font-semibold text-muted">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
      {label}
    </span>
  );
}

function Landing({
  viewModel,
  onStart,
  onJumpToDashboard,
}: {
  viewModel: AtlasViewModel;
  onStart: () => void;
  onJumpToDashboard: () => void;
}) {
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
        <EthiopiaPriorityMap
          className="shadow-md"
          priorityResults={viewModel.priorityResults}
          resultBadge={`${viewModel.sourceBadge} joined by PCODE`}
          legendNote={`Thin grey outlines show all loaded Admin 2 boundaries. Heatmap colors are ${viewModel.sourceBadge.toLowerCase()} recommendations joined by PCODE.`}
        />
      </div>
    </section>
  );
}

function RegionSelection({
  regions,
  selectedRegion,
  onSelect,
  onBack,
  onNext,
}: {
  regions: RegionViewModel[];
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
      <PageActions onBack={onBack} onNext={onNext} nextLabel="Continue to objective weights" />
    </section>
  );
}

function PreferenceSelection({
  objectiveWeights,
  onWeightChange,
  onReset,
  onBack,
  onNext,
}: {
  objectiveWeights: ObjectiveWeights;
  onWeightChange: (key: ObjectiveKey, value: number) => void;
  onReset: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const backendPayload = toBackendWeights(objectiveWeights);

  return (
    <section className="py-8">
      <SectionHeader
        label="Step 2"
        title="Set restoration objective weights"
        description="Adjust the importance of each restoration objective. The prioritization will update based on your selected preferences."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.72fr]">
        <div className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-3 border-b border-[#e7deca] pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-fg">Preference weights</h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                Values are prototype inputs for client-side mock scoring. Later, the same object can be sent to the prioritization agent.
              </p>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="w-fit rounded-full border border-[#cfc2aa] bg-white px-4 py-2 text-sm font-semibold text-fg transition hover:bg-[#fbf7ee] focus:outline-none focus:ring-2 focus:ring-[#1f6f68] focus:ring-offset-2 focus:ring-offset-base"
            >
              Reset to Recommended
            </button>
          </div>

          <div className="grid gap-6">
            {objectives.map((objective) => (
              <ObjectiveSlider
                key={objective.key}
                objective={objective}
                value={objectiveWeights[objective.key]}
                onChange={(value) => onWeightChange(objective.key, value)}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#d9d0bd] bg-[#fbf7ee] p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-fg">Agent input preview</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                This structure is ready to pass to the backend when live prioritization is connected.
              </p>
            </div>
            <span className="rounded-full bg-[#e7f0eb] px-3 py-1 text-xs font-semibold text-[#1f6f68]">
              Mock scoring
            </span>
          </div>
          <dl className="mt-6 grid gap-3">
            {Object.entries(backendPayload).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-4 rounded-md border border-[#e7deca] bg-white px-4 py-3">
                <dt className="text-sm text-muted">{key}</dt>
                <dd className="text-lg font-semibold text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <PageActions onBack={onBack} onNext={onNext} nextLabel="Run weighted prototype analysis" />
    </section>
  );
}

function ObjectiveSlider({
  objective,
  value,
  onChange,
}: {
  objective: (typeof objectives)[number];
  value: number;
  onChange: (value: number) => void;
}) {
  const inputId = `objective-${objective.key}`;

  return (
    <div className="rounded-md border border-[#e7deca] bg-white p-4 transition hover:border-[#bfd3c6]">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <label htmlFor={inputId} className="font-semibold text-fg">
            {objective.label}
          </label>
          <p className="mt-1 text-sm leading-6 text-muted">{objective.description}</p>
        </div>
        <output
          htmlFor={inputId}
          className="min-w-14 rounded-full bg-[#e7f0eb] px-3 py-1 text-center text-sm font-semibold text-[#1f6f68]"
        >
          {value}
        </output>
      </div>
      <input
        id={inputId}
        className="objective-slider"
        type="range"
        min="0"
        max="100"
        value={value}
        aria-label={`${objective.label} weight`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
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
          {["Applying objective weights", "Scoring candidate areas", "Preparing map overlays"].map((item) => (
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
  viewModel,
  areas,
  selectedArea,
  selectedRankedAreaId,
  selectedMapAreaId,
  priorityResults,
  priorityScoreRange,
  objectiveWeights,
  onSelectArea,
  onSelectMapArea,
  onDetail,
  onBack,
}: {
  region: RegionViewModel;
  viewModel: AtlasViewModel;
  areas: RankedAreaViewModel[];
  selectedArea: RankedAreaViewModel;
  selectedRankedAreaId: string;
  selectedMapAreaId?: string;
  priorityResults: PriorityResult[];
  priorityScoreRange: PriorityScoreRange;
  objectiveWeights: ObjectiveWeights;
  onSelectArea: (areaId: string) => void;
  onSelectMapArea: (pcode: string | undefined) => void;
  onDetail: () => void;
  onBack: () => void;
}) {
  return (
    <section className="py-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader
          label="Dashboard"
          title={`${region.name} restoration priority view`}
          description={viewModel.dashboardDescription(objectiveWeights)}
        />
        <div className="flex gap-3">
          <button className="rounded-full border border-[#cfc2aa] bg-white px-5 py-3 text-sm font-semibold text-fg" onClick={onBack}>
            Edit weights
          </button>
          <button className="rounded-full bg-[#1f6f68] px-5 py-3 text-sm font-semibold text-white" onClick={onDetail}>
            Open rationale
          </button>
        </div>
      </div>

      <EthiopiaPriorityMap
        status="ready"
        priorityResults={priorityResults}
        selectedRankedPcode={selectedArea.pcode}
        selectedMapAreaId={selectedMapAreaId}
        onSelectMapArea={onSelectMapArea}
        priorityScoreRange={priorityScoreRange}
        resultBadge={`${viewModel.sourceBadge} joined by PCODE`}
        resultDescription={
          viewModel.mode === "backend"
            ? "Backend sample recommendations mapped to Admin 2 polygons through a temporary site-to-PCODE adapter."
            : "HDX/OCHA COD-AB Admin 2 fixture · selected polygons follow administrative boundaries."
        }
        legendNote={`Thin grey outlines show all loaded Admin 2 boundaries. Heatmap colors are ${viewModel.sourceBadge.toLowerCase()} recommendations joined by PCODE.`}
      />

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.82fr]">
        <div className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-fg">Ranked candidate areas</h3>
              <p className="text-sm text-muted">
                {viewModel.mode === "backend"
                  ? "AI pipeline sample outputs normalized into the shared frontend model."
                  : "Mock decision-support outputs for live pitch review."}
              </p>
            </div>
            <span className="rounded-full bg-[#fff9ed] px-3 py-1 text-xs text-muted">{viewModel.dashboardDataLabel}</span>
          </div>
          <div className="overflow-hidden rounded-lg border border-[#e7deca]">
            {areas.map((area) => {
              const isSelected = selectedRankedAreaId === area.id;
              const areaColor = priorityColor(area.priorityScore, priorityScoreRange);
              const areaTextColor = priorityTextColor(area.priorityScore, priorityScoreRange);

              return (
                <button
                  key={area.id}
                  onClick={() => onSelectArea(area.id)}
                  className={`grid w-full gap-4 border-b border-[#e7deca] p-4 text-left transition last:border-b-0 hover:bg-[#fbf7ee] md:grid-cols-[70px_1fr_130px] ${
                    isSelected ? "bg-[#eef7f2]" : "bg-white"
                  }`}
                  style={
                    isSelected
                      ? { boxShadow: `inset 0 0 0 1px ${priorityTint(area.priorityScore, priorityScoreRange, 0.38)}` }
                      : {
                          backgroundImage: `linear-gradient(90deg, ${priorityTint(
                            area.priorityScore,
                            priorityScoreRange,
                            0.16,
                          )} 0%, rgba(255,255,255,0) 46%)`,
                        }
                  }
                >
                  <div>
                    <p className="text-xs text-muted">Rank</p>
                    <p className="text-2xl font-semibold text-fg">#{area.weightedRank}</p>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="size-3 rounded-sm" style={{ backgroundColor: areaColor }} />
                      <h4 className="font-semibold text-fg">{area.name}</h4>
                    </div>
                    <p className="mt-1 text-sm text-muted">{area.zone}</p>
                    <p className="mt-2 text-sm text-muted">{area.intervention}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-xs text-muted">Priority score</p>
                    <p
                      className="mt-1 inline-flex min-w-16 justify-center rounded-full px-3 py-1 text-2xl font-semibold"
                      style={{ backgroundColor: areaColor, color: areaTextColor }}
                    >
                      {area.priorityScore}
                    </p>
                    <p className="mt-1 text-xs text-muted">{area.confidence} confidence</p>
                  </div>
                </button>
              );
            })}
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

function ImpactSummary({ area }: { area: RankedAreaViewModel }) {
  return (
    <div className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-fg">Impact indicators</h3>
      <p className="mt-1 text-sm text-muted">Current values come from the selected data source.</p>
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

function AreaDetail({ area, onBack, onNext }: { area: RankedAreaViewModel; onBack: () => void; onNext: () => void }) {
  return (
    <section className="py-8">
      <SectionHeader
        label="Recommendation rationale"
        title={area.name}
        description={`${area.zone}. Ranked #${area.weightedRank} with ${area.confidence.toLowerCase()} confidence.`}
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-[#d9d0bd] bg-surface p-6 shadow-sm">
          <p className="text-sm text-muted">Priority score</p>
          <p className="mt-2 text-6xl font-semibold text-[#1f6f68]">{area.priorityScore}</p>
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

function Recommendation({ area, onBack, onNext }: { area: RankedAreaViewModel; onBack: () => void; onNext: () => void }) {
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
            {area.decisionSummary ??
              "Prioritize a community-led pilot that combines ecological restoration with practical livelihood value. Live versions should include participatory validation, safeguards, benefit-sharing review, and monitoring requirements."}
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
          <p className="mt-3 text-sm leading-6 text-muted">{area.evidenceStatus}</p>
          {area.fieldValidationQuestions.length > 0 && (
            <div className="mt-4 border-t border-[#e7deca] pt-4">
              <p className="text-sm font-semibold text-fg">Field validation questions</p>
              <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted">
                {area.fieldValidationQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <PageActions onBack={onBack} onNext={onNext} nextLabel="Preview project brief" />
    </section>
  );
}

function ExportPreview({
  area,
  region,
  objectiveWeights,
  onBack,
  onRestart,
}: {
  area: RankedAreaViewModel;
  region: RegionViewModel;
  objectiveWeights: ObjectiveWeights;
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
              prototype ranks the area #{area.weightedRank} in {region.name} with a weighted priority score of {area.priorityScore}/100.
            </p>
            <h4 className="mt-6 text-lg font-semibold">Objective weights used</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {objectives.map((objective) => (
                <span key={objective.key} className="rounded-full bg-[#e7f0eb] px-3 py-1 text-sm text-[#1f6f68]">
                  {objective.label}: {objectiveWeights[objective.key]}
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

function buildPriorityResultsForAreas(priorityResults: PriorityResult[], areas: RankedAreaViewModel[]) {
  const resultsByPcode = new Map(priorityResults.map((result) => [result.pcode, result]));

  return areas.flatMap((area) => {
    if (!area.pcode) return [];

    const existingResult = resultsByPcode.get(area.pcode);

    return [
      {
        admin_level: existingResult?.admin_level ?? 2,
        pcode: area.pcode,
        priority_score: area.priorityScore,
        priority_level: toPriorityLevel(area.priorityScore),
        biodiversity_score: area.scores.biodiversity,
        carbon_score: area.scores.carbon,
        water_score: area.scores.water,
        livelihood_score: area.scores.livelihoods,
        estimated_restoration_opportunity: area.hectares,
        rationale:
          area.rationale[0] ??
          existingResult?.rationale ??
          "Recommendation rationale will be populated by the prioritization pipeline.",
        confidence: area.confidence,
        evidence: area.evidenceStatus,
      },
    ] satisfies PriorityResult[];
  });
}

function toPriorityLevel(score: number): PriorityResult["priority_level"] {
  if (score >= 75) return "Highest";
  if (score >= 65) return "High";
  if (score >= 50) return "Medium";
  return "Lower";
}

function toBackendWeights(weights: ObjectiveWeights) {
  return {
    biodiversity_weight: weights.biodiversity,
    carbon_weight: weights.carbon,
    water_weight: weights.water,
    livelihood_weight: weights.livelihood,
  };
}
