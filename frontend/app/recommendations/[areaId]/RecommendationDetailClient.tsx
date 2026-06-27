"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EthiopiaPriorityMap } from "@/components/EthiopiaPriorityMap";
import type { DataSourceMode } from "@/data/atlasViewModel";
import { findRecommendationArea, getRecommendationWorkspace } from "@/data/recommendationViewModel";
import { scoreLabels } from "@/data/prioritizationConfig";
import { usePriorityWeights } from "@/hooks/usePriorityWeights";
import { getPriorityScoreRange, priorityColor, priorityTextColor } from "@/priorityColor";

export function RecommendationDetailClient({ areaId }: { areaId: string }) {
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>("demo");
  const { objectiveWeights } = usePriorityWeights();
  const decodedAreaId = decodeURIComponent(areaId);

  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get("source");
    if (source === "demo" || source === "backend") {
      setDataSourceMode(source);
    }
  }, []);

  const { viewModel, rankedAreas, priorityResults } = useMemo(
    () => getRecommendationWorkspace(dataSourceMode, objectiveWeights),
    [dataSourceMode, objectiveWeights],
  );
  const area = findRecommendationArea(rankedAreas, decodedAreaId);
  const region = area ? viewModel.regions.find((item) => item.id === area.regionId) : undefined;
  const priorityScoreRange = useMemo(
    () => getPriorityScoreRange(rankedAreas.map((item) => item.priorityScore)),
    [rankedAreas],
  );
  const currentIndex = area ? rankedAreas.findIndex((item) => item.id === area.id) : -1;
  const previousArea = currentIndex > 0 ? rankedAreas[currentIndex - 1] : undefined;
  const nextArea = currentIndex >= 0 && currentIndex < rankedAreas.length - 1 ? rankedAreas[currentIndex + 1] : undefined;

  if (!area) {
    return (
      <main className="min-h-screen bg-base px-5 py-8 text-fg sm:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-[#d9d0bd] bg-surface p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase text-accent">Recommendation not found</p>
          <h1 className="mt-2 text-3xl font-semibold">No matching area for {decodedAreaId}</h1>
          <p className="mt-3 leading-7 text-muted">
            The selected recommendation is not available in the current data source. Return to the dashboard and choose a
            candidate from the ranked list.
          </p>
          <Link
            href={`/?source=${dataSourceMode}`}
            className="mt-6 inline-flex rounded-full bg-[#1f6f68] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const rationale = toStringList(area.rationale, [
    "This recommendation is available in the current ranked candidate set. Detailed rationale will be expanded as pipeline evidence is connected.",
  ]);
  const recommendedActions = toStringList(area.recommendedActions ?? area.outputs, [
    area.intervention,
    "Confirm local feasibility with implementation partners.",
  ]);
  const nextSteps = toStringList(area.nextSteps);
  const risks = toStringList(area.risks);
  const fieldValidationQuestions = toStringList(area.fieldValidationQuestions);
  const scoreColor = priorityColor(area.priorityScore, priorityScoreRange);
  const scoreTextColor = priorityTextColor(area.priorityScore, priorityScoreRange);

  return (
    <main className="min-h-screen bg-base px-5 py-6 text-fg sm:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-5">
        <header className="flex flex-col gap-4 border-b border-[#d9d0bd] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#d9d0bd] bg-white px-3 py-1 text-xs font-semibold text-muted">
                {viewModel.sourceBadge}
              </span>
              <span className="rounded-full border border-[#d9d0bd] bg-[#fff9ed] px-3 py-1 text-xs font-semibold text-muted">
                Rank #{area.weightedRank}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">{area.name}</h1>
            <p className="mt-3 max-w-3xl leading-7 text-muted">
              {region?.name ?? "Ethiopia"} · {area.zone} · {area.hectares}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/?source=${dataSourceMode}`}
              className="rounded-full border border-[#cfc2aa] bg-white px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-[#fbf7ee]"
            >
              Back to Dashboard
            </Link>
            {previousArea && (
              <Link
                href={`/recommendations/${encodeURIComponent(previousArea.id)}?source=${dataSourceMode}`}
                className="rounded-full border border-[#cfc2aa] bg-white px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-[#fbf7ee]"
              >
                Previous
              </Link>
            )}
            {nextArea && (
              <Link
                href={`/recommendations/${encodeURIComponent(nextArea.id)}?source=${dataSourceMode}`}
                className="rounded-full bg-[#1f6f68] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#185b55]"
              >
                Next
              </Link>
            )}
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-5">
            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                <div
                  className="rounded-lg border border-[#d9d0bd] p-4 text-center"
                  style={{ backgroundColor: scoreColor, color: scoreTextColor }}
                >
                  <p className="text-sm font-semibold opacity-85">Priority score</p>
                  <p className="mt-2 text-6xl font-semibold text-current">{area.priorityScore}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase text-accent">AI-generated brief</p>
                  <p className="mt-3 text-lg leading-8 text-fg">
                    {area.decisionSummary ??
                      `Review ${area.intervention.toLowerCase()} for ${area.name}. The area is ranked #${area.weightedRank} in the selected data source and should be validated with local experts before implementation.`}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MetricCard label="Confidence" value={area.confidence} />
                    <MetricCard label="Intervention" value={area.intervention} />
                    <MetricCard label="Data source" value={viewModel.sourceName} />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
              <h2 className="text-2xl font-semibold">Recommendation rationale</h2>
              <div className="mt-5 grid gap-3">
                {rationale.map((item, index) => (
                  <div key={item} className="flex gap-4 rounded-md border border-[#e7deca] bg-[#fbf7ee] p-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e7f0eb] text-sm font-semibold text-[#1f6f68]">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-muted">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
              <h2 className="text-2xl font-semibold">Key drivers</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <ScoreBar label="Biodiversity impact" value={area.scores.biodiversity} />
                <ScoreBar label="Carbon storage potential" value={area.scores.carbon} />
                <ScoreBar label="Water security impact" value={area.scores.water} />
                <ScoreBar label="Livelihood impact" value={area.scores.livelihoods} />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(area.scores).map(([key, value]) => (
                  <ScoreBar key={key} label={scoreLabels[key as keyof typeof scoreLabels]} value={value} />
                ))}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
                <h2 className="text-xl font-semibold">Recommended next actions</h2>
                <ActionList items={recommendedActions} />
                {nextSteps.length > 0 && <ActionList heading="Implementation sequence" items={nextSteps} />}
              </div>
              <div className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
                <h2 className="text-xl font-semibold">Limitations and assumptions</h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {area.disclaimer ??
                    "This recommendation is a prototype decision-support output. Field validation, local governance review, safeguards, and implementation feasibility checks are required before investment decisions."}
                </p>
                {risks.length > 0 && <ActionList heading="Risks to review" items={risks} />}
              </div>
            </section>

            <section className="rounded-lg border border-[#d8e5dc] bg-[#f1f7f2] p-5">
              <h2 className="text-xl font-semibold">Confidence / evidence status</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                {area.evidenceStatus ?? "Evidence status is pending for this recommendation."}
              </p>
              {fieldValidationQuestions.length > 0 && (
                <ActionList heading="Field validation questions" items={fieldValidationQuestions} />
              )}
            </section>
          </div>

          <aside className="grid h-fit gap-5 lg:sticky lg:top-5">
            <EthiopiaPriorityMap
              className="h-fit"
              status="ready"
              priorityResults={priorityResults}
              selectedRankedPcode={area.pcode}
              selectedMapAreaId={area.pcode}
              priorityScoreRange={priorityScoreRange}
              showDetailsPanel={false}
              resultBadge={`${viewModel.sourceBadge} joined by PCODE`}
              resultDescription="Focused recommendation map. The selected administrative polygon is highlighted with the same priority color used on the dashboard."
              legendNote={`Detail view for ${area.name}. Thin grey outlines show context boundaries.`}
            />

            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Administrative hierarchy</h2>
              <div className="mt-4 grid gap-3">
                <MetricCard label="Country" value="Ethiopia" />
                <MetricCard label="Region" value={region?.name ?? "Region pending"} />
                <MetricCard label="Zone / Woreda" value={area.zone} />
                <MetricCard label="PCODE" value={area.pcode ?? "PCODE pending"} />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e7deca] bg-white p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-fg">{value}</p>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string | undefined; value: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-3 text-sm">
        <span className="text-muted">{label ?? "Indicator"}</span>
        <span className="font-semibold text-fg">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e5dcc9]">
        <div className="h-full rounded-full bg-[#1f6f68]" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
      </div>
    </div>
  );
}

function ActionList({ heading, items }: { heading?: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className={heading ? "mt-5" : "mt-4"}>
      {heading && <p className="text-sm font-semibold text-fg">{heading}</p>}
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
        {items.map((item) => (
          <li key={item} className="rounded-md border border-[#e7deca] bg-[#fbf7ee] px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function toStringList(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;

  const cleaned = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);

  return cleaned.length > 0 ? cleaned : fallback;
}
