import Link from "next/link";
import { notFound } from "next/navigation";
import { EthiopiaPriorityMap } from "@/components/EthiopiaPriorityMap";
import { ExpandableSummaryTiles } from "@/components/ExpandableSummaryTiles";
import { FloatingExplainableChat } from "@/components/FloatingExplainableChat";
import { buildAdminPriorityJoin } from "@/lib/ethiopia-admin-priority";
import { defaultPriorityWeights } from "@/lib/priority-scoring";
import { getPriorityScoreRange, priorityColor, priorityTextColor } from "@/lib/priority-color";
import { detailToDashboardItem } from "@/lib/site-view-model";
import { getCanonicalSiteDetail, rankSiteDetails } from "@/reasoning";
import { createFallbackIntelligence } from "@/reasoning/intelligence";
import { getLocalKnowledgeForSite } from "@/reasoning/local-knowledge";

type RecommendationPageProps = {
  params: Promise<{
    site_id: string;
  }>;
};

export default async function RecommendationPage({ params }: RecommendationPageProps) {
  const { site_id } = await params;
  const detail = getCanonicalSiteDetail(decodeURIComponent(site_id));

  if (!detail) {
    notFound();
  }

  const ranked = rankSiteDetails();
  const currentIndex = ranked.findIndex(
    (item) => item.site_features.site_id === detail.site_features.site_id,
  );
  const previous = currentIndex > 0 ? ranked[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < ranked.length - 1
      ? ranked[currentIndex + 1]
      : null;
  const candidate = detail.candidate;
  const officialName = [detail.site_features.woreda, detail.site_features.zone]
    .filter(Boolean)
    .join(", ");
  const localMatches = getLocalKnowledgeForSite(detail, 6);
  const intelligencePreview = createFallbackIntelligence(detail, localMatches, "local_preview");
  const dashboardItems = ranked.map(detailToDashboardItem);
  const selectedDashboardItem =
    dashboardItems.find((item) => item.site_id === detail.site_features.site_id) ?? null;
  const scoreRange = getPriorityScoreRange(
    dashboardItems.map((item) => item.priority_score),
  );
  const adminPriorityJoin = buildAdminPriorityJoin(dashboardItems);
  const selectedPcode = adminPriorityJoin.siteIdToPcode.get(detail.site_features.site_id);
  const priorityScoreColor = priorityColor(detail.recommendation.priority_score, scoreRange);
  const priorityScoreTextColor = priorityTextColor(detail.recommendation.priority_score, scoreRange);
  const recommendationTitle = displayRecommendationTitle(detail);
  const summaryTiles = [
    { label: "Opportunity", value: intelligencePreview.investment_summary.opportunity },
    { label: "Investment", value: intelligencePreview.investment_summary.investment },
    { label: "Why here", value: intelligencePreview.investment_summary.why_here },
    { label: "What could change", value: intelligencePreview.investment_summary.expected_change },
  ];

  return (
    <main className="min-h-screen bg-base px-5 py-6 text-fg sm:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-5">
        <header className="flex flex-col gap-4 border-b border-[#d9d0bd] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-accent">Area detail</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-6xl">
              {officialName}
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-muted">
              {detail.site_features.region} / {detail.site_features.zone} /{" "}
              {detail.site_features.woreda}
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link className="rounded-md border border-[#cfc2aa] px-4 py-2 text-sm" href="/">
              Dashboard
            </Link>
            {previous && (
              <Link
                className="rounded-md border border-[#cfc2aa] px-4 py-2 text-sm"
                href={`/recommendations/${encodeURIComponent(previous.site_features.site_id)}`}
              >
                Previous
              </Link>
            )}
            {next && (
              <Link
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white"
                href={`/recommendations/${encodeURIComponent(next.site_features.site_id)}`}
              >
                Next
              </Link>
            )}
          </nav>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-5">
            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                <div
                  className="rounded-lg border border-[#d9d0bd] p-4 text-center"
                  style={{ backgroundColor: priorityScoreColor, color: priorityScoreTextColor }}
                >
                  <p className="text-sm font-semibold opacity-80">Priority score</p>
                  <p className="mt-2 text-6xl font-semibold text-current">
                    {detail.recommendation.priority_score}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase text-accent">Investment brief</p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {recommendationTitle}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {intelligencePreview.why_this_area}
                  </p>
                  <ExpandableSummaryTiles items={summaryTiles} />
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <InfoCard label="Rank" value={String(detail.recommendation.rank ?? "n/a")} />
                    <InfoCard label="Risk" value={detail.recommendation.risk_level} />
                    <InfoCard
                      label="Data quality"
                      value={String(detail.site_features.data_quality_score ?? "n/a")}
                    />
                  </div>
                  <p className="mt-4 border-t border-[#e7deca] pt-3 text-xs leading-5 text-muted">
                    Screening result only. Confirm land use, tenure, implementation constraints,
                    and local priorities before committing funding.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5">
              <p className="text-sm font-semibold uppercase text-accent">Reasoning</p>
              <h2 className="mt-2 text-2xl font-semibold">
                Why this recommendation
              </h2>
              <div className="mt-5 grid gap-3">
                {detail.recommendation.main_reasons.map((reason) => (
                  <p
                    key={reason}
                    className="rounded-md border border-[#d9d0bd] bg-[#fbf7ee] p-3 text-sm leading-6 text-muted"
                  >
                    {reason}
                  </p>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5">
              <h2 className="text-xl font-semibold">What shaped the score</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Open each factor to see what it means for this area.
              </p>
              <div className="mt-4 grid gap-3">
                {detail.model_prediction.top_feature_contributions.map((contribution) => (
                  <details
                    key={`${contribution.feature}-${contribution.direction}`}
                    className="group rounded-md border border-[#d9d0bd] bg-[#fbf7ee] p-3 text-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <span className="font-semibold">{humanFeatureLabel(contribution.feature)}</span>
                      <span className="flex items-center gap-2 text-muted">
                        <span>{factorSignal(contribution.direction, contribution.weight)}</span>
                        <span className="text-xl leading-none transition group-open:rotate-90">›</span>
                      </span>
                    </summary>
                    <p className="mt-3 leading-6 text-muted">
                      {factorExplanation(contribution.feature, contribution.direction, detail)}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase text-accent">
                    Local obstacles and sources
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    What to check before funding
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">
                {intelligencePreview.score_explanation}
              </p>
              <div className="mt-5 grid gap-3">
                {(intelligencePreview.local_caveats.length ? intelligencePreview.local_caveats : []).map((caveat, index) => {
                  const match = localMatches[index];
                  const pdfHref = match
                    ? `/api/local-knowledge/pdf/${encodeURIComponent(match.card.source_id)}#page=${match.card.citation.page}`
                    : null;
                  return (
                    <div
                      key={caveat.citation}
                      className="rounded-md border border-[#d9d0bd] bg-[#fbf7ee] p-3 text-sm"
                    >
                      <p className="leading-6">{caveat.caveat}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                        {match && pdfHref ? (
                          <a
                            href={pdfHref}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#cfc2aa] bg-white px-3 py-1 font-semibold text-accent transition hover:bg-[#eef7f2]"
                          >
                            {caveat.source}, page {match.card.citation.page}
                          </a>
                        ) : (
                          <span className="rounded-full border border-[#cfc2aa] bg-white px-3 py-1 font-semibold text-accent">
                            {caveat.citation}
                          </span>
                        )}
                        <span>confidence: {caveat.confidence}</span>
                      </div>
                    </div>
                  );
                })}
                {localMatches.length === 0 && (
                  <div className="rounded-md border border-[#d9d0bd] bg-[#fbf7ee] p-3 text-sm">
                    No local PDF caveats have been matched to this site yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="grid h-fit gap-5 lg:sticky lg:top-5">
            <EthiopiaPriorityMap
              priorityResults={adminPriorityJoin.priorityResults}
              selectedRankedPcode={selectedPcode}
              selectedMapAreaId={selectedPcode}
              priorityScoreRange={scoreRange}
              showDetailsPanel={false}
              showHeader={false}
            />
            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Site facts</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <Info
                  label="Area"
                  value={`${Math.round(candidate?.area_ha ?? detail.site_features.area_ha).toLocaleString()} ha`}
                />
                <Info label="Zone" value={detail.site_features.zone} />
                <Info label="Woreda" value={detail.site_features.woreda} />
                <Info label="Main land cover" value={humanFeatureValue(detail.site_features.land_cover_primary)} />
              </div>
            </section>
          </aside>
        </section>
      </div>
      <FloatingExplainableChat
        selectedSite={selectedDashboardItem}
        rankedSites={dashboardItems}
        weights={defaultPriorityWeights}
        panelSubtitle={`Grounded in ${detail.site_features.woreda}.`}
      />
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[#d9d0bd] pb-2">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#e7deca] bg-[#fbf7ee] p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-fg">{value}</p>
    </div>
  );
}

function displayRecommendationTitle(detail: ReturnType<typeof getCanonicalSiteDetail>) {
  if (!detail) return "Restoration planning note";

  const recommendation = detail.recommendation;
  if (recommendation.recommended_intervention !== "Field validation before investment") {
    return recommendation.recommended_intervention;
  }

  if (recommendation.priority_score >= 60) {
    return "Promising restoration area with field checks";
  }

  if (recommendation.priority_score >= 45) {
    return "Candidate area for partner review";
  }

  return "Lower-priority area for later review";
}

function humanFeatureLabel(feature: string) {
  const labels: Record<string, string> = {
    carbon_potential_composite: "Carbon storage potential",
    biodiversity_benefit_composite: "Benefit for nature",
    water_soil_benefit_composite: "Water and soil benefit",
    livelihood_benefit_composite: "Benefit for nearby communities",
    implementation_feasibility_composite: "Ease of getting started",
    land_cover_suitability_adjustment: "Fit with current land use",
    rainfall_reliability_score: "Rainfall reliability",
    vegetation_index_score: "Current vegetation condition",
    soil_organic_carbon_score: "Soil carbon",
    slope_risk_score: "Erosion risk",
    access_score: "Access for field teams",
    population_pressure_score: "Nearby community need",
    forest_loss_score: "Recent forest loss",
    safeguard_risk_score: "Safeguard sensitivity",
  };

  return labels[feature] ?? feature.replaceAll("_", " ");
}

function factorSignal(direction: string, weight: number) {
  if (direction === "negative") {
    if (weight >= 0.35) return "Major concern";
    if (weight >= 0.18) return "Concern";
    return "Minor concern";
  }

  if (direction === "positive") {
    if (weight >= 0.35) return "Strong point";
    if (weight >= 0.18) return "Moderate point";
    return "Supporting signal";
  }

  return "Factor";
}

function factorExplanation(
  feature: string,
  direction: "positive" | "negative",
  detail: ReturnType<typeof getCanonicalSiteDetail>,
) {
  if (!detail) return "This factor is part of the area screening.";

  const site = detail.site_features;
  const recommendation = detail.recommendation;
  const landCover = humanFeatureValue(site.land_cover_primary);
  const signal = direction === "positive" ? "supports" : "weakens";

  if (feature === "land_cover_suitability_adjustment") {
    return direction === "negative"
      ? `The current land cover is ${landCover}. That makes this area less suitable for the proposed restoration work than places with more compatible farm, grassland, or forest-edge conditions.`
      : `The current land cover is ${landCover}. That appears compatible with restoration work, so it ${signal} the area as an investment candidate.`;
  }

  if (feature === "carbon_potential_composite") {
    return `Carbon storage potential is rated ${recommendation.carbon_potential}. This reflects signals such as tree cover, vegetation condition, soil carbon, and restoration fit. A stronger carbon signal means the area may store more carbon over time if restoration succeeds.`;
  }

  if (feature === "biodiversity_benefit_composite") {
    return `Benefit for nature is rated ${recommendation.biodiversity_benefit}. This considers whether restoration could protect or improve habitat value, but it still needs local species and land-use checks before making biodiversity claims.`;
  }

  if (feature === "water_soil_benefit_composite") {
    return `Water and soil benefit is rated ${recommendation.water_soil_benefit}. Rainfall, slope, erosion risk, and soil signals suggest whether restoration could help keep soil in place and improve water retention.`;
  }

  if (feature === "livelihood_benefit_composite") {
    return `Community benefit is rated ${recommendation.livelihood_benefit}. This uses nearby population, access, and land-use pressure as signs that restoration could matter for households if the design fits local needs.`;
  }

  if (feature === "implementation_feasibility_composite") {
    return `Ease of getting started is rated ${recommendation.implementation_feasibility}. Access, safeguard risk, land cover, and field validation needs affect whether a project can realistically begin here.`;
  }

  if (feature === "rainfall_reliability_score") {
    return `Rainfall reliability is ${site.rainfall_reliability_score ?? "unknown"}/100. More reliable rainfall makes tree establishment and soil restoration more realistic.`;
  }

  if (feature === "slope_risk_score") {
    return `Erosion risk is ${site.slope_risk_score ?? "unknown"}/100. Higher risk can make soil and water work more valuable, but field teams should confirm the exact hotspots.`;
  }

  if (feature === "forest_loss_score") {
    return `Recent forest-loss signal is ${site.forest_loss_score ?? "unknown"}/100. This can indicate a restoration opportunity, but it does not prove every parcel is available or degraded.`;
  }

  if (feature === "population_pressure_score") {
    return `Nearby community need is ${site.population_pressure_score ?? "unknown"}/100. This can make livelihood benefits more relevant, but investment design must be agreed with local users.`;
  }

  return `This factor ${signal} the score based on the available site data. It should be treated as screening context and checked locally before funding.`;
}

function humanFeatureValue(value: string) {
  return value.replaceAll("_", " ");
}
