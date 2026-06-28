"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Languages, SlidersHorizontal, X } from "lucide-react";
import { EthiopiaPriorityMap } from "@/components/EthiopiaPriorityMap";
import { ExplainableChatPanel } from "@/components/ExplainableChatPanel";
import { PriorityWeightControls } from "@/components/PriorityWeightControls";
import {
  aggregateSitesByAdminArea,
  buildAdminPriorityJoin,
} from "@/lib/ethiopia-admin-priority";
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
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import { getLocale, localLanguageOptions, type Locale } from "@/lib/i18n/locales";
import type { SiteDashboardItem } from "@/lib/site-view-model";

type DashboardClientProps = {
  initialSites: SiteDashboardItem[];
};

type SidePanelMode = "ranking" | "weights";

export function DashboardClient({ initialSites }: DashboardClientProps) {
  const [weights, setWeights] = useState<PriorityWeights>(defaultPriorityWeights);
  const [selectedSiteId, setSelectedSiteId] = useState(initialSites[0]?.site_id ?? "");
  const [sidePanelMode, setSidePanelMode] = useState<SidePanelMode>("ranking");
  const [chatOpen, setChatOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");
  const dashboardCopy = getDashboardCopy(locale);

  useEffect(() => {
    const queryLocale = new URLSearchParams(window.location.search).get("locale");
    const nextLocale = getLocale(queryLocale ?? window.localStorage.getItem("chaka-locale"));
    setLocale(nextLocale);
    if (queryLocale) {
      window.localStorage.setItem("chaka-locale", nextLocale);
      document.cookie = `chaka_locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  function updateLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    window.localStorage.setItem("chaka-locale", nextLocale);
    document.cookie = `chaka_locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
  }

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
  const rankedAdminAreas = useMemo(() => aggregateSitesByAdminArea(rankedSites), [rankedSites]);
  const selectedAdminArea =
    rankedAdminAreas.find((site) => site.site_id === selectedSite?.site_id) ?? rankedAdminAreas[0] ?? null;
  const scoreRange = useMemo(
    () => getPriorityScoreRange(rankedAdminAreas.map((site) => site.priority_score)),
    [rankedAdminAreas],
  );
  const adminPriorityJoin = useMemo(() => buildAdminPriorityJoin(rankedAdminAreas), [rankedAdminAreas]);
  const selectedRankedPcode = selectedAdminArea
    ? adminPriorityJoin.siteIdToPcode.get(selectedAdminArea.site_id)
    : undefined;
  const topSite = rankedAdminAreas[0] ?? null;
  function updateWeight(key: keyof PriorityWeights, value: number) {
    setWeights((current) => ({ ...current, [key]: value }));
  }

  function focusSite(site: SiteDashboardItem) {
    setSelectedSiteId(site.site_id);
  }

  return (
    <main className="app-shell text-fg">
      <div className="mx-auto grid w-full max-w-[1840px] gap-4 px-3 py-3 sm:px-5 lg:px-6">
        <header className="dashboard-header grid gap-4 px-4 py-4 pr-20 sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-5xl">
            <div className="brand-lockup">
              <img className="brand-tree brand-tree-sm" src="/brand/chaka-tree.png" alt="" />
              <span className="brand-wordmark">chaka</span>
            </div>
            <h1 className="headline-balance mt-2 text-3xl font-semibold leading-[1.02] tracking-[-0.02em] text-[var(--chaka-ink)] sm:text-4xl lg:text-5xl">
              {dashboardCopy.heroTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 sm:text-base" style={{ color: "#53645b" }}>
              {dashboardCopy.heroSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[430px]">
            <HeaderMetric label={dashboardCopy.metrics.areas} value={rankedAdminAreas.length.toString()} />
            <HeaderMetric label={dashboardCopy.metrics.topScore} value={topSite?.priority_score.toString() ?? "0"} />
            <HeaderMetric
              label={dashboardCopy.metrics.selected}
              value={selectedAdminArea?.site_id ?? dashboardCopy.metrics.noneSelected}
              compact
            />
          </div>
        </header>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.68fr)_minmax(360px,0.62fr)]">
          <section className="map-frame min-h-[calc(100vh-9.5rem)] overflow-hidden">
            <EthiopiaPriorityMap
              priorityResults={adminPriorityJoin.priorityResults}
              selectedRankedPcode={selectedRankedPcode}
              selectedMapAreaId={selectedRankedPcode}
              onSelectMapArea={(pcode) => {
                const siteId = pcode ? adminPriorityJoin.pcodeToSiteId.get(pcode) : null;
                if (siteId) setSelectedSiteId(siteId);
              }}
              frameless
              focusSelected={Boolean(selectedRankedPcode)}
              showNeighborLabels={false}
              showBasemap
              showDetailsPanel={false}
              priorityScoreRange={scoreRange}
              resultBadge="Area-level screening"
              resultDescription="Administrative areas colored by the highest-ranked candidate site currently mapped inside each area."
              legendNote="Area colors are screening summaries. Open a row to inspect the candidate site and evidence."
            />
          </section>

          <aside className="decision-panel relative p-3 lg:sticky lg:top-4">
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-[var(--chaka-line)] px-1 pb-3">
              <div>
                <p className="eyebrow">
	                  {sidePanelMode === "ranking" ? dashboardCopy.priorityRanking : dashboardCopy.prioritySettings}
	                </p>
	                <p className="mt-1 text-sm text-muted">
	                  {sidePanelMode === "ranking"
	                    ? dashboardCopy.candidateAreas(rankedAdminAreas.length)
	                    : dashboardCopy.adjustWeights}
	                </p>
	              </div>
              <button
                type="button"
                aria-label={dashboardCopy.switchRankingSettings}
                className="panel-action grid size-10 shrink-0 place-items-center rounded-full"
                onClick={() => setSidePanelMode((mode) => (mode === "ranking" ? "weights" : "ranking"))}
              >
                <SlidersHorizontal aria-hidden="true" size={19} strokeWidth={2.25} />
              </button>
            </div>

	            {sidePanelMode === "ranking" ? (
		              <RankingList
		                sites={rankedAdminAreas}
		                selectedSiteId={selectedAdminArea?.site_id ?? ""}
		                scoreRange={scoreRange}
		                onFocusSite={focusSite}
	                copy={dashboardCopy}
                  locale={locale}
                scrollable
              />
            ) : (
              <PriorityWeightControls
                weights={weights}
                onChange={updateWeight}
                onReset={() => setWeights(defaultPriorityWeights)}
                locale={locale}
                compact
              />
            )}

          </aside>
        </div>
      </div>

      <div className="fixed right-5 top-5 z-[1000] sm:right-6 sm:top-6">
        <LanguageToggle value={locale} onChange={updateLocale} copy={dashboardCopy} />
      </div>
      <div className="fixed bottom-5 right-5 z-[1000] sm:bottom-6 sm:right-6">
        <button
          type="button"
          className="chat-launcher group relative grid size-14 place-items-center rounded-full text-white"
          onClick={() => setChatOpen((open) => !open)}
          aria-label={chatOpen ? dashboardCopy.closeChat : dashboardCopy.openChat}
        >
          {!chatOpen && (
            <span className="floating-control absolute right-16 top-2 hidden whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-fg after:absolute after:-right-1 after:top-1/2 after:size-2 after:-translate-y-1/2 after:rotate-45 after:border-r after:border-t after:border-[var(--chaka-line)] after:bg-[var(--chaka-paper)] sm:block">
              {dashboardCopy.askMe}
            </span>
          )}
        </button>
      </div>

      {chatOpen && (
        <aside className="chat-panel fixed bottom-4 right-4 top-24 z-[999] w-[min(430px,calc(100vw-2rem))] overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="eyebrow">{dashboardCopy.chatTitle}</p>
              <p className="text-sm text-muted">{dashboardCopy.chatSubtitle}</p>
            </div>
            <button
              type="button"
              className="panel-action grid size-9 place-items-center rounded-full"
              onClick={() => setChatOpen(false)}
              aria-label={dashboardCopy.closeChat}
            >
              <X aria-hidden="true" size={17} strokeWidth={2.4} />
            </button>
          </div>
          <ExplainableChatPanel
            selectedSite={selectedSite}
            rankedSites={rankedSites}
            weights={weights}
            locale={locale}
            embedded
          />
        </aside>
      )}
    </main>
  );
}

function HeaderMetric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--chaka-line)] bg-white/70 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className={`mt-1 truncate font-semibold text-fg ${compact ? "text-sm" : "text-xl tabular-nums"}`}>
        {value}
      </p>
    </div>
  );
}

function RankingList({
  sites,
  selectedSiteId,
  scoreRange,
  onFocusSite,
  copy,
  locale,
  scrollable,
}: {
  sites: SiteDashboardItem[];
  selectedSiteId: string;
  scoreRange: ReturnType<typeof getPriorityScoreRange>;
  onFocusSite: (site: SiteDashboardItem) => void;
  copy: ReturnType<typeof getDashboardCopy>;
  locale: Locale;
  scrollable: boolean;
}) {
  return (
    <div className={`grid gap-2 ${scrollable ? "ranking-scroll max-h-[min(35rem,calc(100vh-16rem))] overflow-y-auto pr-1" : "overflow-visible"}`}>
      {sites.map((site) => {
        const selected = site.site_id === selectedSiteId;
        const color = priorityColor(site.priority_score, scoreRange);
        const textColor = priorityTextColor(site.priority_score, scoreRange);

        return (
          <article
            key={site.site_id}
            tabIndex={0}
            role="button"
            onClick={() => onFocusSite(site)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onFocusSite(site);
              }
            }}
            className={`ranking-card relative grid grid-cols-[58px_minmax(0,1fr)_34px] items-center gap-3 p-2.5 no-underline ${
              selected ? "ranking-card-selected" : ""
            }`}
            aria-label={site.name}
          >
            <span
              className="score-tile grid size-12 place-items-center rounded-lg text-lg font-semibold"
              style={{ backgroundColor: color, color: textColor }}
            >
              {site.priority_score}
            </span>
            <div className="min-w-0 text-left">
              <span className="block truncate text-sm font-semibold text-fg">{site.name}</span>
              <span className="mt-0.5 block truncate text-xs font-medium text-muted">
                {copy.rankingMeta(site.rank, site.site_id, site.region)}
              </span>
            </div>
            <Link
              href={`/recommendations/${encodeURIComponent(site.site_id)}?locale=${locale}`}
              className="grid size-8 place-items-center rounded-full text-accent"
              aria-label={copy.openDetailsFor(site.name)}
              onClick={(event) => event.stopPropagation()}
            >
              <ArrowUpRight aria-hidden="true" size={17} strokeWidth={2.25} />
            </Link>
          </article>
        );
      })}
    </div>
  );
}

function LanguageToggle({
  value,
  onChange,
  copy,
}: {
  value: Locale;
  onChange: (value: Locale) => void;
  copy: ReturnType<typeof getDashboardCopy>;
}) {
  const [open, setOpen] = useState(false);
  const selectedLocalLocale = value === "en" ? "am" : value;

  return (
    <div className="relative">
      <div className="floating-control flex items-center gap-1 rounded-full p-1">
        <button
          type="button"
          className={`grid size-8 place-items-center rounded-full transition ${
            value !== "en" ? "bg-[#1f6f68] shadow-sm" : "opacity-55"
          }`}
          onClick={() => {
            if (value === "en") onChange("am");
            setOpen((current) => !current);
          }}
          aria-label={copy.chooseLocalLanguage}
          aria-expanded={open}
        >
          <Languages className="sr-only" aria-hidden="true" />
          <EthiopiaFlag className="size-6 rounded-full" label={copy.ethiopianLanguageFlag} />
        </button>
        <button
          type="button"
          className={`grid size-8 place-items-center rounded-full transition ${
            value === "en" ? "bg-[#1f6f68] shadow-sm" : "opacity-55"
          }`}
          onClick={() => {
            onChange("en");
            setOpen(false);
          }}
          aria-label={copy.useEnglish}
        >
          <BritainFlag className="size-6 rounded-full" label={copy.englishFlag} />
        </button>
      </div>

      {open && (
        <div className="floating-control absolute right-0 top-12 w-56 rounded-xl p-2">
          {localLanguageOptions.map((locale) => {
            const option = copy.languageOptions[locale];
            const selected = selectedLocalLocale === locale;

            return (
              <button
                key={locale}
                type="button"
                className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
                  selected ? "bg-[#eef7f2] text-fg" : "text-muted hover:bg-[#fbf7ee]"
                }`}
                onClick={() => {
                  onChange(locale);
                  setOpen(false);
                }}
              >
                <span>
                  <span className="block font-semibold">{option.nativeName}</span>
                  <span className="text-xs">{option.englishName}</span>
                </span>
                <span className="text-base font-semibold text-accent">{selected ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EthiopiaFlag({ className, label }: { className?: string; label: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" role="img" aria-label={label}>
      <defs>
        <clipPath id="ethiopia-flag-circle">
          <circle cx="60" cy="60" r="58" />
        </clipPath>
      </defs>
      <g clipPath="url(#ethiopia-flag-circle)">
        <rect width="120" height="40" fill="#078930" />
        <rect y="40" width="120" height="40" fill="#fcd116" />
        <rect y="80" width="120" height="40" fill="#da121a" />
        <circle cx="60" cy="60" r="25" fill="#0f47af" />
        <path d="M60 38 66 57h20L70 69l6 19-16-12-16 12 6-19-16-12h20z" fill="#fcd116" />
        <path d="M60 45 64 58h14L67 66l4 13-11-8-11 8 4-13-11-8h14z" fill="#0f47af" />
      </g>
      <circle cx="60" cy="60" r="58" fill="none" stroke="#ffffff" strokeWidth="4" />
    </svg>
  );
}

function BritainFlag({ className, label }: { className?: string; label: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" role="img" aria-label={label}>
      <defs>
        <clipPath id="britain-flag-circle">
          <circle cx="60" cy="60" r="58" />
        </clipPath>
      </defs>
      <g clipPath="url(#britain-flag-circle)">
        <rect width="120" height="120" fill="#012169" />
        <path d="M-8 0 120 128M128 0 0 128" stroke="#fff" strokeWidth="24" />
        <path d="M-8 0 120 128M128 0 0 128" stroke="#c8102e" strokeWidth="12" />
        <path d="M60 0v120M0 60h120" stroke="#fff" strokeWidth="38" />
        <path d="M60 0v120M0 60h120" stroke="#c8102e" strokeWidth="22" />
      </g>
      <circle cx="60" cy="60" r="58" fill="none" stroke="#ffffff" strokeWidth="4" />
    </svg>
  );
}
