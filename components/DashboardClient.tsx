"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EthiopiaPriorityMap } from "@/components/EthiopiaPriorityMap";
import { ExplainableChatPanel } from "@/components/ExplainableChatPanel";
import { PriorityWeightControls } from "@/components/PriorityWeightControls";
import { buildAdminPriorityJoin } from "@/lib/ethiopia-admin-priority";
import {
  defaultPriorityWeights,
  scoreSite,
  type PriorityWeights,
} from "@/lib/priority-scoring";
import {
  getPriorityScoreRange,
  priorityColor,
  priorityTextColor,
} from "@/lib/priority-color";
import type { SiteDashboardItem } from "@/lib/site-view-model";

type DashboardClientProps = {
  initialSites: SiteDashboardItem[];
};

type SidePanelMode = "ranking" | "weights";

export function DashboardClient({ initialSites }: DashboardClientProps) {
  const [weights, setWeights] = useState<PriorityWeights>(defaultPriorityWeights);
  const [selectedSiteId, setSelectedSiteId] = useState(initialSites[0]?.site_id ?? "");
  const [focusedPcode, setFocusedPcode] = useState<string | undefined>();
  const [sidePanelMode, setSidePanelMode] = useState<SidePanelMode>("ranking");
  const [chatOpen, setChatOpen] = useState(false);
  const [languageMode, setLanguageMode] = useState<"EN" | "AM">("EN");

  const rankedSites = useMemo(() => {
    return initialSites
      .map((site) => {
        const score = scoreSite(site.feature, weights);
        return {
          ...site,
          priority_score: score.priority_score,
          components: score.components,
        };
      })
      .sort((a, b) => b.priority_score - a.priority_score || a.site_id.localeCompare(b.site_id))
      .map((site, index) => ({ ...site, rank: index + 1 }));
  }, [initialSites, weights]);

  const selectedSite =
    rankedSites.find((site) => site.site_id === selectedSiteId) ?? rankedSites[0] ?? null;
  const scoreRange = useMemo(
    () => getPriorityScoreRange(rankedSites.map((site) => site.priority_score)),
    [rankedSites],
  );
  const adminPriorityJoin = useMemo(() => buildAdminPriorityJoin(rankedSites), [rankedSites]);
  const selectedRankedPcode = selectedSite
    ? adminPriorityJoin.siteIdToPcode.get(selectedSite.site_id)
    : undefined;
  function updateWeight(key: keyof PriorityWeights, value: number) {
    setWeights((current) => ({ ...current, [key]: value }));
  }

  function focusSite(site: SiteDashboardItem) {
    setSelectedSiteId(site.site_id);
    setFocusedPcode(adminPriorityJoin.siteIdToPcode.get(site.site_id));
  }

  return (
    <main className="min-h-screen bg-base text-fg">
      <div className="mx-auto grid w-full max-w-[1800px] gap-4 px-4 py-5 sm:px-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-accent">Chaka</p>
            <h1 className="mt-1 text-3xl font-semibold leading-tight sm:text-4xl">
              Find restoration areas in Ethiopia.
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted lg:mr-[320px]">
            Compare priority areas, check local evidence, and open the details before planning an investment.
          </p>
        </header>

        <div className="grid items-start gap-4 pt-2 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.72fr)]">
          <section className="min-h-[calc(100vh-8rem)] overflow-hidden">
            <EthiopiaPriorityMap
              priorityResults={adminPriorityJoin.priorityResults}
              selectedRankedPcode={selectedRankedPcode}
              selectedMapAreaId={focusedPcode}
              onSelectMapArea={(pcode) => {
                setFocusedPcode(pcode);
                const siteId = pcode ? adminPriorityJoin.pcodeToSiteId.get(pcode) : null;
                if (siteId) setSelectedSiteId(siteId);
              }}
              frameless
              focusSelected={Boolean(focusedPcode)}
              showNeighborLabels={false}
              showBasemap
              showDetailsPanel={false}
              priorityScoreRange={scoreRange}
            />
          </section>

          <aside className="relative mt-2 rounded-lg border border-[#d9d0bd] bg-surface/85 p-3 shadow-sm lg:mt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-accent">
                  {sidePanelMode === "ranking" ? "Priority ranking" : "Priority settings"}
                </p>
                <p className="text-sm text-muted">
                  {sidePanelMode === "ranking"
                    ? `${rankedSites.length} candidate areas`
                    : "Adjust what matters most"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Switch ranking and settings"
                className="grid size-10 place-items-center rounded-full border border-[#cfc2aa] bg-[#fbf7ee] text-accent transition hover:bg-[#eef7f2]"
                onClick={() => setSidePanelMode((mode) => (mode === "ranking" ? "weights" : "ranking"))}
              >
                <SliderIcon />
              </button>
            </div>

            {sidePanelMode === "ranking" ? (
              <RankingList
                sites={rankedSites}
                selectedSiteId={selectedSite?.site_id ?? ""}
                scoreRange={scoreRange}
                onFocusSite={focusSite}
                scrollable
              />
            ) : (
              <PriorityWeightControls
                weights={weights}
                onChange={updateWeight}
                onReset={() => setWeights(defaultPriorityWeights)}
                compact
              />
            )}

          </aside>
        </div>
      </div>

      <div className="fixed right-4 top-4 z-[1000] flex items-start gap-24">
        <LanguageToggle value={languageMode} onChange={setLanguageMode} />
        <button
          type="button"
          className="group relative grid size-14 place-items-center rounded-full border border-[#cfc2aa] bg-[#1f6f68] text-lg font-semibold text-white shadow-lg shadow-black/15"
          onClick={() => setChatOpen((open) => !open)}
          aria-label={chatOpen ? "Close Chaka chat" : "Open Chaka chat"}
        >
          C
          {!chatOpen && (
            <span className="absolute right-16 top-2 whitespace-nowrap rounded-2xl border border-[#d9d0bd] bg-surface px-3 py-1.5 text-xs font-semibold text-fg shadow-sm after:absolute after:-right-1 after:top-1/2 after:size-2 after:-translate-y-1/2 after:rotate-45 after:border-r after:border-t after:border-[#d9d0bd] after:bg-surface">
              Ask me
            </span>
          )}
        </button>
      </div>

      {chatOpen && (
        <aside className="fixed bottom-4 right-4 top-24 z-[999] w-[min(420px,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-[#d9d0bd] bg-surface p-4 shadow-2xl shadow-black/20">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-accent">Chaka assistant</p>
              <p className="text-sm text-muted">Grounded in the selected area.</p>
            </div>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-full border border-[#cfc2aa] bg-[#fbf7ee] text-sm font-semibold"
              onClick={() => setChatOpen(false)}
              aria-label="Close chat"
            >
              x
            </button>
          </div>
          <ExplainableChatPanel
            selectedSite={selectedSite}
            rankedSites={rankedSites}
            weights={weights}
            embedded
          />
        </aside>
      )}
    </main>
  );
}

function RankingList({
  sites,
  selectedSiteId,
  scoreRange,
  onFocusSite,
  scrollable,
}: {
  sites: SiteDashboardItem[];
  selectedSiteId: string;
  scoreRange: ReturnType<typeof getPriorityScoreRange>;
  onFocusSite: (site: SiteDashboardItem) => void;
  scrollable: boolean;
}) {
  return (
    <div className={`grid gap-2 ${scrollable ? "max-h-[min(34rem,calc(100vh-15rem))] overflow-y-auto pr-1" : "overflow-visible"}`}>
      {sites.map((site) => {
        const selected = site.site_id === selectedSiteId;
        const color = priorityColor(site.priority_score, scoreRange);
        const textColor = priorityTextColor(site.priority_score, scoreRange);

        return (
          <article
            key={site.site_id}
            className={`relative grid grid-cols-[64px_minmax(0,1fr)_42px] items-center gap-3 rounded-lg border p-2 transition ${
              selected ? "border-[#1f6f68] bg-[#eef7f2]" : "border-[#e7deca] bg-white hover:bg-[#fbf7ee]"
            }`}
          >
            <Link
              href={`/recommendations/${encodeURIComponent(site.site_id)}`}
              className="absolute inset-0 rounded-lg"
              aria-label={`Open details for ${site.name}`}
            />
            <span
              className="grid size-12 place-items-center rounded-md text-lg font-semibold"
              style={{ backgroundColor: color, color: textColor }}
            >
              {site.priority_score}
            </span>
            <button
              type="button"
              className="relative z-10 min-w-0 text-left"
              onClick={() => onFocusSite(site)}
            >
              <span className="block truncate font-semibold text-fg">{site.name}</span>
            </button>
            <span className="grid size-10 place-items-center rounded-full text-3xl font-light leading-none text-accent">
              ›
            </span>
          </article>
        );
      })}
    </div>
  );
}

function SliderIcon() {
  return (
    <span className="grid w-5 gap-1" aria-hidden="true">
      <span className="relative block h-0.5 rounded-full bg-current before:absolute before:left-1 before:top-1/2 before:size-1.5 before:-translate-y-1/2 before:rounded-full before:bg-current" />
      <span className="relative block h-0.5 rounded-full bg-current before:absolute before:right-1 before:top-1/2 before:size-1.5 before:-translate-y-1/2 before:rounded-full before:bg-current" />
      <span className="relative block h-0.5 rounded-full bg-current before:absolute before:left-2 before:top-1/2 before:size-1.5 before:-translate-y-1/2 before:rounded-full before:bg-current" />
    </span>
  );
}

function LanguageToggle({
  value,
  onChange,
}: {
  value: "EN" | "AM";
  onChange: (value: "EN" | "AM") => void;
}) {
  return (
    <button
      type="button"
      className="flex rounded-full border border-[#cfc2aa] bg-surface p-1 text-xs font-semibold shadow-sm"
      onClick={() => onChange(value === "EN" ? "AM" : "EN")}
      aria-label="Toggle language"
    >
      <span className={`rounded-full px-2.5 py-1 ${value === "AM" ? "bg-[#1f6f68] text-white" : "text-muted"}`}>
        AM
      </span>
      <span className={`rounded-full px-2.5 py-1 ${value === "EN" ? "bg-[#1f6f68] text-white" : "text-muted"}`}>
        EN
      </span>
    </button>
  );
}
