"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PriorityWeightSliders, PriorityWeightsSummary } from "@/components/PriorityWeightControls";
import type { DataSourceMode, ObjectiveKey, ObjectiveWeights } from "@/data/atlasViewModel";
import { defaultObjectiveWeights, toBackendWeights } from "@/data/prioritizationConfig";
import { usePriorityWeights } from "@/hooks/usePriorityWeights";

export default function ChangePriorityWeightsPage() {
  return (
    <Suspense fallback={<ChangePriorityWeightsLoading />}>
      <ChangePriorityWeightsContent />
    </Suspense>
  );
}

function ChangePriorityWeightsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceParam = searchParams.get("source");
  const dataSourceMode: DataSourceMode = sourceParam === "backend" ? "backend" : "demo";
  const { objectiveWeights, setObjectiveWeights } = usePriorityWeights();
  const [draftWeights, setDraftWeights] = useState<ObjectiveWeights>(objectiveWeights);
  const backendPayload = useMemo(() => toBackendWeights(draftWeights), [draftWeights]);

  useEffect(() => {
    setDraftWeights(objectiveWeights);
  }, [objectiveWeights]);

  function updateDraftWeight(key: ObjectiveKey, value: number) {
    setDraftWeights((current) => ({ ...current, [key]: value }));
  }

  function resetDraftWeights() {
    setDraftWeights(defaultObjectiveWeights);
  }

  function reprioritize() {
    setObjectiveWeights(draftWeights);
    // TODO: Replace local persistence with POST /prioritization when the backend endpoint is ready.
    router.push(`/?source=${dataSourceMode}`);
  }

  return (
    <main className="min-h-screen bg-base px-5 py-6 text-fg sm:px-8">
      <div className="grid w-full gap-5">
        <header className="border-b border-[#dfe7dc] pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#dfe7dc] bg-white px-3 py-1 text-xs font-semibold text-muted">
              {dataSourceMode === "backend" ? "Backend Preview" : "Demo (Mock Data)"}
            </span>
            <span className="rounded-full border border-[#dfe7dc] bg-[#f8faf7] px-3 py-1 text-xs font-semibold text-muted">
              Configuration
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">Change Priority Weights</h1>
          <p className="mt-4 max-w-3xl leading-7 text-muted">
            Adjust how strongly each restoration objective influences the prioritization. After updating the weights,
            the ranked restoration opportunities will be recalculated.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-lg border border-[#dfe7dc] bg-surface p-5 shadow-[0_1px_4px_rgb(34_54_42_/_0.05)] sm:p-6">
            <div className="mb-6 flex flex-col gap-3 border-b border-[#e8eee6] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Restoration objective weights</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Values range from 0 to 100 and will become prioritization-agent request parameters.
                </p>
              </div>
              <button
                type="button"
                onClick={resetDraftWeights}
                className="w-fit rounded-full border border-[#b9cabb] bg-white px-4 py-2 text-sm font-semibold text-fg transition hover:bg-[#edf5ee] focus:outline-none focus:ring-2 focus:ring-[#236b44] focus:ring-offset-2 focus:ring-offset-base"
              >
                Reset to Recommended
              </button>
            </div>

            <PriorityWeightSliders objectiveWeights={draftWeights} onWeightChange={updateDraftWeight} />
          </section>

          <aside className="grid h-fit gap-5 lg:sticky lg:top-5">
            <PriorityWeightsSummary objectiveWeights={draftWeights} />

            <section className="rounded-lg border border-[#dfe7dc] bg-[#f8faf7] p-5 shadow-[0_1px_4px_rgb(34_54_42_/_0.05)]">
              <h2 className="text-lg font-semibold">Future backend payload</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                This preview shows the values that will later be sent to the prioritization endpoint.
              </p>
              <dl className="mt-4 grid gap-2">
                {Object.entries(backendPayload).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-[#dfe7dc] bg-white px-3 py-2">
                    <dt className="text-xs text-muted">{key}</dt>
                    <dd className="text-sm font-semibold text-fg">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={reprioritize}
                className="rounded-full bg-[#236b44] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d5838]"
              >
                Re-prioritize
              </button>
              <Link
                href={`/?source=${dataSourceMode}`}
                className="rounded-full border border-[#b9cabb] bg-white px-5 py-3 text-center text-sm font-semibold text-fg transition hover:bg-[#edf5ee]"
              >
                Back to Dashboard
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ChangePriorityWeightsLoading() {
  return (
    <main className="min-h-screen bg-base px-5 py-6 text-fg sm:px-8">
      <div className="w-full rounded-lg border border-[#dfe7dc] bg-surface p-6 text-sm text-muted shadow-[0_1px_4px_rgb(34_54_42_/_0.05)]">
        Loading priority weight controls...
      </div>
    </main>
  );
}
