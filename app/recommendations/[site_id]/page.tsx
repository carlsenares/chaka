import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DetailChatLauncher } from "@/components/DetailChatLauncher";
import { EthiopiaPriorityMap } from "@/components/EthiopiaPriorityMap";
import { ExpandableSummaryTiles } from "@/components/ExpandableSummaryTiles";
import { buildAdminPriorityJoin } from "@/lib/ethiopia-admin-priority";
import { getLocale, type Locale } from "@/lib/i18n/locales";
import { localizeSiteDetailResponse, type LocalizedSiteDetail } from "@/lib/i18n/server-localization";
import { getDetailCopy, type DetailCopy } from "@/lib/i18n/ui-copy";
import { getPriorityScoreRange, priorityColor, priorityTextColor } from "@/lib/priority-color";
import { detailToDashboardItem } from "@/lib/site-view-model";
import { getCanonicalSiteDetail, rankSiteDetails } from "@/reasoning";
import { createFallbackIntelligence, generateSiteIntelligence } from "@/reasoning/intelligence";
import { getLocalKnowledgeForSite } from "@/reasoning/local-knowledge";
import type { SiteDetailResponse, SiteIntelligenceResponse } from "@/reasoning/types";

type RecommendationPageProps = {
  params: Promise<{
    site_id: string;
  }>;
  searchParams?: Promise<{
    locale?: string;
  }>;
};

export default async function RecommendationPage({ params, searchParams }: RecommendationPageProps) {
  const { site_id } = await params;
  const detail = getCanonicalSiteDetail(decodeURIComponent(site_id));

  if (!detail) {
    notFound();
  }

  const query = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const locale = getLocale(query.locale ?? cookieStore.get("chaka_locale")?.value);
  const copy = getDetailCopy(locale);
  const localized = (await localizeSiteDetailResponse(detail, locale)).localized;
  const localeSuffix = `?locale=${locale}`;
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
  const officialName = [localized.site_features.woreda, localized.site_features.zone]
    .filter(Boolean)
    .join(", ");
  const localMatches = getLocalKnowledgeForSite(detail, 6);
  const rawIntelligencePreview =
    (await generateSiteIntelligence(detail.site_features.site_id, locale)) ??
    createFallbackIntelligence(detail, localMatches, "local_preview");
  const intelligencePreview = localizeInvestmentFallback(
    rawIntelligencePreview,
    detail,
    localized,
    locale,
  );
  const dashboardItems = ranked.map(detailToDashboardItem);
  const scoreRange = getPriorityScoreRange(
    dashboardItems.map((item) => item.priority_score),
  );
  const adminPriorityJoin = buildAdminPriorityJoin(dashboardItems);
  const selectedPcode = adminPriorityJoin.siteIdToPcode.get(detail.site_features.site_id);
  const priorityScoreColor = priorityColor(detail.recommendation.priority_score, scoreRange);
  const priorityScoreTextColor = priorityTextColor(detail.recommendation.priority_score, scoreRange);
  const recommendationTitle = displayRecommendationTitle(detail, copy, localized.recommendation.recommended_intervention);
  const summaryTiles = [
    { label: copy.opportunity, value: intelligencePreview.investment_summary.opportunity },
    { label: copy.investment, value: intelligencePreview.investment_summary.investment },
    { label: copy.whyHere, value: intelligencePreview.investment_summary.why_here },
    { label: copy.whatCouldChange, value: intelligencePreview.investment_summary.expected_change },
  ];

  return (
    <main className="min-h-screen bg-base px-5 py-6 text-fg sm:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-5">
        <header className="flex flex-col gap-4 border-b border-[#d9d0bd] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="brand-lockup detail-brand-lockup">
              <img className="brand-tree detail-brand-tree" src="/brand/chaka-tree.png" alt="" />
              <span className="brand-wordmark detail-brand-wordmark">chaka</span>
            </div>
            <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-6xl">
              {officialName}
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-muted">
              {localized.site_features.region} / {localized.site_features.zone} /{" "}
              {localized.site_features.woreda}
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link className="rounded-md border border-[#cfc2aa] px-4 py-2 text-sm" href={`/${localeSuffix}`}>
              {copy.dashboard}
            </Link>
            {previous && (
              <Link
                className="rounded-md border border-[#cfc2aa] px-4 py-2 text-sm"
                href={`/recommendations/${encodeURIComponent(previous.site_features.site_id)}${localeSuffix}`}
              >
                {copy.previous}
              </Link>
            )}
            {next && (
              <Link
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white"
                href={`/recommendations/${encodeURIComponent(next.site_features.site_id)}${localeSuffix}`}
              >
                {copy.next}
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
                  <p className="text-sm font-semibold opacity-80">{copy.priorityScore}</p>
                  <p className="mt-2 text-6xl font-semibold text-current">
                    {detail.recommendation.priority_score}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase text-accent">{copy.investmentBrief}</p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {recommendationTitle}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {intelligencePreview.why_this_area}
                  </p>
                  <ExpandableSummaryTiles items={summaryTiles} />
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <InfoCard label={copy.rank} value={String(detail.recommendation.rank ?? copy.unavailable)} />
                    <InfoCard label={copy.risk} value={localized.recommendation.risk_level} />
                    <InfoCard
                      label={copy.dataQuality}
                      value={String(detail.site_features.data_quality_score ?? copy.unavailable)}
                    />
                  </div>
                  <p className="mt-4 border-t border-[#e7deca] pt-3 text-xs leading-5 text-muted">
                    {copy.screeningDisclaimer}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5">
              <p className="text-sm font-semibold uppercase text-accent">{copy.reasoning}</p>
              <h2 className="mt-2 text-2xl font-semibold">
                {copy.whyThisRecommendation}
              </h2>
              <div className="mt-5 grid gap-3">
                {localized.recommendation.main_reasons.map((reason) => (
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
              <h2 className="text-xl font-semibold">{copy.scoreFactorsTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {copy.scoreFactorsDescription}
              </p>
              <div className="mt-4 grid gap-3">
                {detail.model_prediction.top_feature_contributions.map((contribution) => (
                  <details
                    key={`${contribution.feature}-${contribution.direction}`}
                    className="group rounded-md border border-[#d9d0bd] bg-[#fbf7ee] p-3 text-sm"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <span className="font-semibold">{humanFeatureLabel(contribution.feature, copy)}</span>
                      <span className="flex items-center gap-2 text-muted">
                        <span>{factorSignal(contribution.direction, contribution.weight, copy)}</span>
                        <span className="text-xl leading-none transition group-open:rotate-90">›</span>
                      </span>
                    </summary>
                    <p className="mt-3 leading-6 text-muted">
                      {factorExplanation(contribution.feature, contribution.direction, detail, copy, localized)}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d9d0bd] bg-surface p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase text-accent">
                    {copy.localObstacles}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    {copy.fieldCheckTitle}
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
                        <span>{copy.confidence}: {caveat.confidence}</span>
                      </div>
                    </div>
                  );
                })}
                {localMatches.length === 0 && (
                  <div className="rounded-md border border-[#d9d0bd] bg-[#fbf7ee] p-3 text-sm">
                    {copy.noLocalCaveats}
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
              <h2 className="text-xl font-semibold">{copy.siteFacts}</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <Info
                  label={copy.area}
                  value={`${Math.round(candidate?.area_ha ?? detail.site_features.area_ha).toLocaleString()} ${copy.hectareUnit}`}
                />
                <Info label={copy.zone} value={localized.site_features.zone} />
                <Info label={copy.woreda} value={localized.site_features.woreda} />
                <Info label={copy.mainLandCover} value={humanFeatureValue(localized.site_features.land_cover_primary)} />
              </div>
            </section>
          </aside>
        </section>
      </div>
      <DetailChatLauncher
        selectedSiteId={detail.site_features.site_id}
        rankedSites={dashboardItems}
        locale={locale}
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

function localizeInvestmentFallback(
  intelligence: SiteIntelligenceResponse,
  detail: SiteDetailResponse,
  localized: LocalizedSiteDetail,
  locale: Locale,
): SiteIntelligenceResponse {
  if (locale === "en") return intelligence;

  const lowPriority = detail.recommendation.priority_score < 35;
  const place = [localized.site_features.woreda, localized.site_features.zone]
    .filter(Boolean)
    .join(", ");
  const score = detail.recommendation.priority_score;
  const landCover = humanFeatureValue(localized.site_features.land_cover_primary);
  const intervention = localized.recommendation.recommended_intervention;
  const validationFirst =
    detail.recommendation.intervention_code === "field_validation_before_investment";
  const text = investmentFallbackText[locale] ?? investmentFallbackText.en;
  const fallback = text({
    place,
    score,
    landCover,
    intervention,
    validationFirst,
    lowPriority,
  });

  return {
    ...intelligence,
    score_explanation: fallback.score_explanation,
    why_this_area: fallback.why_this_area,
    investment_summary: fallback.investment_summary,
    investment_ideas: intelligence.investment_ideas.map((idea, index) =>
      index === 0
        ? {
            ...idea,
            title: intervention,
            reasoning: fallback.investment_reasoning,
          }
        : idea,
    ),
  };
}

type InvestmentFallbackInput = {
  place: string;
  score: number;
  landCover: string;
  intervention: string;
  validationFirst: boolean;
  lowPriority: boolean;
};

type InvestmentFallbackOutput = Pick<
  SiteIntelligenceResponse,
  "score_explanation" | "why_this_area" | "investment_summary"
> & {
  investment_reasoning: string;
};

const investmentFallbackText: Record<Locale, (input: InvestmentFallbackInput) => InvestmentFallbackOutput> = {
  en: ({ place, score, landCover, intervention, validationFirst, lowPriority }) => ({
    score_explanation: lowPriority
      ? `This area scores ${score}, which makes it a low priority compared with the other mapped areas. The available data does not make it a strong first choice for funding right now.`
      : `This area scores ${score}. It ranks well because land cover, rainfall, soil, access, and community benefit signals look stronger than many other mapped areas.`,
    why_this_area: lowPriority
      ? `${place} is not recommended for investment yet. It may still be worth reviewing if local partners have newer information or a specific community request.`
      : `${place} is a candidate area because the available map and source data point to a possible restoration opportunity.`,
    investment_summary: lowPriority
      ? {
          opportunity: "This area is mainly useful as a place to review later, not as a first funding target.",
          investment: "Do not start a restoration investment here unless local partners bring stronger, newer evidence.",
          why_here: `The current screening shows weak restoration fit for ${place}, especially compared with higher-ranked areas.`,
          expected_change: "The most useful action now would be better local information, not planting or restoration spending.",
        }
      : {
          opportunity: `The opportunity is to improve degraded or pressured ${landCover} land while protecting remaining useful vegetation.`,
          investment: validationFirst
            ? "Start with field validation, then choose the restoration package with local communities. The first spend should confirm land use, tenure, restoration fit, and practical constraints."
            : `${intervention} could be used as the starting package, with the final design chosen with local communities.`,
          why_here: "This area stands out because rainfall, soil, land cover, access, and community benefit signals look comparatively strong.",
          expected_change: "A well-designed investment could improve tree cover, soil protection, water retention, and local livelihood benefits over time.",
        },
    investment_reasoning: lowPriority
      ? "Do not treat this as a funding target yet. Review stronger ranked areas first, unless local partners provide new evidence."
      : `Use ${intervention} as an initial planning idea, then confirm it with people who know the area.`,
  }),
  am: ({ place, score, landCover, intervention, validationFirst, lowPriority }) => ({
    score_explanation: lowPriority
      ? `ይህ ቦታ ${score} ውጤት አግኝቷል፣ ከሌሎች የተመረጡ አካባቢዎች ጋር ሲነጻጸር ዝቅተኛ ቅድሚያ ነው። ያለው መረጃ አሁን ለገንዘብ መጀመሪያ ምርጫ እንዲሆን አያሳይም።`
      : `ይህ ቦታ ${score} ውጤት አግኝቷል። የመሬት ሽፋን፣ ዝናብ፣ አፈር፣ መዳረሻ እና የማህበረሰብ ጥቅም ምልክቶች ከብዙ አካባቢዎች ይልቅ ጠንካራ ስለሚመስሉ ከፍ ብሎ ተደርጎአል።`,
    why_this_area: lowPriority
      ? `${place} እስካሁን ለኢንቨስትመንት አይመከርም። አካባቢያዊ አጋሮች አዲስ መረጃ ወይም የማህበረሰብ ጥያቄ ካላቸው ግን ሊገመገም ይችላል።`
      : `${place} የመልሶ ማቋቋም ዕድል ሊኖርበት እንደሚችል የካርታና የምንጭ መረጃው ስለሚያመለክት እጩ አካባቢ ነው።`,
    investment_summary: lowPriority
      ? {
          opportunity: "ይህ አካባቢ አሁን የመጀመሪያ የገንዘብ ዒላማ ሳይሆን በኋላ ለመገምገም የሚጠቅም ነው።",
          investment: "አካባቢያዊ አጋሮች ጠንካራ እና አዲስ መረጃ ካላቀረቡ በስተቀር እዚህ የመልሶ ማቋቋም ኢንቨስትመንት አትጀምሩ።",
          why_here: `የአሁኑ ማጣሪያ ${place} ከከፍተኛ ደረጃ አካባቢዎች ጋር ሲነጻጸር ደካማ የመልሶ ማቋቋም ተስማሚነት እንዳለው ያሳያል።`,
          expected_change: "አሁን በጣም የሚጠቅመው ተጨማሪ አካባቢያዊ መረጃ ነው፣ እንጂ መትከል ወይም የመልሶ ማቋቋም ወጪ አይደለም።",
        }
      : {
          opportunity: `ዕድሉ የተጎዳ ወይም ጫና ያለበትን ${landCover} መሬት ማሻሻል እና ያለውን ጠቃሚ እፅዋት መጠበቅ ነው።`,
          investment: validationFirst
            ? "በመስክ ማረጋገጫ ጀምሩ፣ ከዚያ የመልሶ ማቋቋም ጥቅልን ከአካባቢ ማህበረሰቦች ጋር ይምረጡ። የመጀመሪያው ወጪ የመሬት አጠቃቀም፣ መብት፣ ተስማሚነት እና ተግባራዊ ገደቦችን ማረጋገጥ አለበት።"
            : `${intervention} እንደ መጀመሪያ ጥቅል ሊጠቀም ይችላል፣ የመጨረሻው ንድፍ ግን ከአካባቢ ማህበረሰቦች ጋር መመረጥ አለበት።`,
          why_here: "ይህ አካባቢ የዝናብ፣ የአፈር፣ የመሬት ሽፋን፣ የመዳረሻ እና የማህበረሰብ ጥቅም ምልክቶች በንጽጽር ጠንካራ ስለሚመስሉ ይለያል።",
          expected_change: "በጥሩ የተዘጋጀ ኢንቨስትመንት የዛፍ ሽፋን፣ የአፈር ጥበቃ፣ የውሃ መያዣ እና የአካባቢ ኑሮ ጥቅሞች በጊዜ ሊሻሻሉ ይችላሉ።",
        },
    investment_reasoning: lowPriority
      ? "ይህን እንደ የገንዘብ ዒላማ አትውሰዱት። አካባቢያዊ አጋሮች አዲስ መረጃ ካላቀረቡ በስተቀር መጀመሪያ ከፍተኛ ደረጃ ያላቸውን አካባቢዎች ይገምግሙ።"
      : `${intervention} እንደ መጀመሪያ የእቅድ ሀሳብ ይጠቀሙ፣ ከዚያም አካባቢውን ከሚያውቁ ሰዎች ጋር ያረጋግጡት።`,
  }),
  om: ({ place, score, landCover, intervention, validationFirst, lowPriority }) => ({
    score_explanation: lowPriority
      ? `Iddoon kun qabxii ${score} argate; kunis naannoo kaaniin wal bira qabamee dursa gadi aanaa isa taasisa. Ragaan jiru yeroo ammaa filannoo jalqabaa maallaqaa hin taasisu.`
      : `Iddoon kun qabxii ${score} argate. Mallattoon uwwisa lafaa, rooba, biyyee, dhaqqabummaa fi faayidaa hawaasaa naannoo hedduu caalaa cimaa fakkaata.`,
    why_this_area: lowPriority
      ? `${place} ammaaf invastimantiif hin gorfamu. Yoo michoonni naannoo ragaa haaraa yookaan gaaffii hawaasaa addaa qaban garuu deebi'ee ilaalamuu danda'a.`
      : `${place} ragaan kaartaa fi maddaa carraa haaromsaa agarsiisuu waan danda'uuf naannoo filatamaa dha.`,
    investment_summary: lowPriority
      ? {
          opportunity: "Naannoon kun amma galma maallaqaa jalqabaa osoo hin taane booda deebi'anii ilaaluuf caalaa gargaara.",
          investment: "Michoonni naannoo ragaa haaraa fi cimaa yoo hin fidne asitti invastimantii haaromsaa hin jalqabin.",
          why_here: `Sakatta'iinsi ammaa ${place} naannoo sadarkaa olii wajjin wal bira qabamee mijataa haaromsaa laafaa akka qabu agarsiisa.`,
          expected_change: "Amma tarkaanfiin barbaachisaan ragaa naannoo fooyya'aa argachuu dha; dhaabuu yookaan baasii haaromsaa miti.",
        }
      : {
          opportunity: `Carraan jiru lafa ${landCover} miidhame yookaan dhiibbaa qabu fooyyessuu fi biqiltuu faayidaa qabu eeguu dha.`,
          investment: validationFirst
            ? "Mirkaneessa dirree jalqabi; ergasii paakeejii haaromsaa hawaasa naannoo waliin fili. Baasiin jalqabaa itti fayyadama lafa, mirga, mijataa haaromsaa fi danqaalee hojii mirkaneessuu qaba."
            : `${intervention} akka paakeejii jalqabaatti fayyadamuun ni danda'ama; dizaayiniin dhumaa garuu hawaasa naannoo waliin filatamuu qaba.`,
          why_here: "Naannoon kun rooba, biyyee, uwwisa lafaa, dhaqqabummaa fi faayidaa hawaasaa irratti mallattoolee wal bira qabamee cimaa qabuun adda ba'a.",
          expected_change: "Invastimantiin sirriitti qophaa'e yeroo keessatti uwwisa mukaa, eegumsa biyyee, qabannaa bishaanii fi faayidaa jireenya naannoo fooyyessuu danda'a.",
        },
    investment_reasoning: lowPriority
      ? "Kana akka galma maallaqaatti hin ilaali. Michoonni naannoo ragaa haaraa yoo hin kennine dura naannoo sadarkaa olaanaa ilaali."
      : `${intervention} akka yaada karoora jalqabaatti fayyadami; ergasii namoota naannoo beekan waliin mirkaneessi.`,
  }),
  so: ({ place, score, landCover, intervention, validationFirst, lowPriority }) => ({
    score_explanation: lowPriority
      ? `Goobtani waxay heshay ${score}, taas oo ka dhigaysa mudnaan hoose marka lala barbardhigo meelaha kale. Xogta jirta hadda kama dhigeyso doorasho koowaad oo maalgelin ah.`
      : `Goobtani waxay heshay ${score}. Calaamadaha daboolka dhulka, roobka, ciidda, helitaanka, iyo faa'iidada bulshada waxay u muuqdaan kuwo ka xoog badan meelo badan.`,
    why_this_area: lowPriority
      ? `${place} weli laguma talinayo maalgelin. Waxaa dib loo eegi karaa haddii lammaanayaasha deegaanka keenaan xog cusub ama codsi bulsho oo gaar ah.`
      : `${place} waa goob musharrax ah sababtoo ah khariidadda iyo xogta ilaha waxay tilmaamayaan fursad soo celin ah.`,
    investment_summary: lowPriority
      ? {
          opportunity: "Goobtani inta badan waxay ku habboon tahay dib-u-eegis dambe, ma aha bartilmaameed maalgelin koowaad.",
          investment: "Ha bilaabin maalgelin soo celin halkan ilaa lammaanayaasha deegaanka keenaan caddeyn cusub oo xooggan.",
          why_here: `Shaandhaynta hadda waxay muujinaysaa in ${place} ku habboonaanta soo celintu daciif tahay marka loo eego meelaha darajadoodu sarreyso.`,
          expected_change: "Tallaabada ugu faa'iidada badan hadda waa xog deegaan oo ka wanaagsan, ma aha beeris ama kharash soo celin.",
        }
      : {
          opportunity: `Fursaddu waa in la hagaajiyo dhulka ${landCover} ee dhaawacmay ama cadaadisku saaran yahay iyadoo la ilaalinayo dhirta waxtarka leh ee hadhay.`,
          investment: validationFirst
            ? "Ku bilow xaqiijin goob, kadibna xulo xirmada soo celinta iyadoo lala shaqeynayo bulshada deegaanka. Kharashka koowaad waa inuu xaqiijiyaa isticmaalka dhulka, xuquuqda, ku habboonaanta, iyo caqabadaha fulinta."
            : `${intervention} waxaa loo adeegsan karaa xirmo bilow ah, iyadoo naqshadda ugu dambeysa lala dooranayo bulshada deegaanka.`,
          why_here: "Goobtani way soo baxaysaa sababtoo ah calaamadaha roobka, ciidda, daboolka dhulka, helitaanka, iyo faa'iidada bulshada ayaa u muuqda kuwo xooggan.",
          expected_change: "Maalgelin si fiican loo naqshadeeyay waxay muddo ka dib hagaajin kartaa daboolka geedaha, ilaalinta ciidda, haynta biyaha, iyo faa'iidooyinka nolosha deegaanka.",
        },
    investment_reasoning: lowPriority
      ? "Ha u qaadan bartilmaameed maalgelin. Marka hore eeg meelaha darajada sare leh, ilaa lammaanayaasha deegaanka keenaan caddeyn cusub."
      : `${intervention} u adeegso fikrad qorshe bilow ah, kadibna ku xaqiiji dadka deegaanka yaqaan.`,
  }),
  ti: ({ place, score, landCover, intervention, validationFirst, lowPriority }) => ({
    score_explanation: lowPriority
      ? `እዚ ቦታ ${score} ውጤት ረኺቡ፣ ምስ ካልኦት ከባቢታት ሲነጻጸር ትሑት ቅድሚያ እዩ። ዘሎ መረዳእታ ሕጂ ናይ መጀመርታ ምርጫ ገንዘብ ኣይገብሮን።`
      : `እዚ ቦታ ${score} ውጤት ረኺቡ። ምልክታት ሽፋን መሬት፣ ዝናብ፣ ሓመድ፣ መብጽሒን ጥቕሚ ማሕበረሰብን ካብ ብዙሓት ከባቢታት ዝሓየለ ይመስል።`,
    why_this_area: lowPriority
      ? `${place} ገና ንኢንቨስትመንት ኣይምከርን። ናይ ከባቢ መሻርኽቲ ሓድሽ መረዳእታ ወይ ፍሉይ ሕቶ ማሕበረሰብ እንተሃልይዎም ግን ክምርመር ይኽእል።`
      : `${place} ናይ ካርታን ምንጭን መረዳእታ ናይ ምሕዳስ ዕድል ከምዘሎ ስለዘመልክት እጩ ቦታ እዩ።`,
    investment_summary: lowPriority
      ? {
          opportunity: "እዚ ከባቢ ሕጂ ናይ መጀመርታ ገንዘብ ዒላማ ዘይኮነ፣ ደሓር ንምግምጋም ዝጠቅም እዩ።",
          investment: "ናይ ከባቢ መሻርኽቲ ዝሓየለን ሓድሽን መረዳእታ እንተዘይኣቕሪቦም ኣብዚ ኢንቨስትመንት ምሕዳስ ኣይትጀምሩ።",
          why_here: `ናይ ሕጂ ምርመራ ${place} ምስ ዝለዓለ ደረጃ ዘለዎም ከባቢታት ሲነጻጸር ደኺም ተስማምዕነት ምሕዳስ ከምዘለዎ የርኢ።`,
          expected_change: "ሕጂ ዝበለጸ ተግባር ዝሓሸ ናይ ከባቢ መረዳእታ ምርካብ እዩ፣ ምትካል ወይ ወጻኢ ምሕዳስ ኣይኮነን።",
        }
      : {
          opportunity: `ዕድሉ ዝተጎድአ ወይ ጸቕጢ ዘለዎ ${landCover} መሬት ምምሕያሽን ዝተረፈ ጠቓሚ ተኽሊ ምሕላውን እዩ።`,
          investment: validationFirst
            ? "ብፍተሻ መስክ ጀምር፣ ድሕሪኡ ናይ ምሕዳስ ጥቕል ምስ ማሕበረሰብ ከባቢ ምረጽ። መጀመርታ ወጻኢ ኣጠቓቕማ መሬት፣ መሰል፣ ተስማምዕነትን ተግባራዊ ገደባትን ከረጋግጽ ኣለዎ።"
            : `${intervention} ከም መጀመርታ ጥቕል ክጥቀም ይኽእል፣ ናይ መወዳእታ ዲዛይን ግን ምስ ማሕበረሰብ ከባቢ ክምረጽ ኣለዎ።`,
          why_here: "እዚ ቦታ ምልክታት ዝናብ፣ ሓመድ፣ ሽፋን መሬት፣ መብጽሒን ጥቕሚ ማሕበረሰብን ብንጽጽር ሓያል ስለዝመስሉ ይፍለ።",
          expected_change: "ብግቡእ ዝተዳለወ ኢንቨስትመንት ሽፋን ኣእዋም፣ ሓለዋ ሓመድ፣ ምትሓዝ ማይን ጥቕሚ መነባብሮ ከባቢን ብጊዜ ከመሓይሽ ይኽእል።",
        },
    investment_reasoning: lowPriority
      ? "እዚ ከም ዒላማ ገንዘብ ኣይትውሰዶ። መሻርኽቲ ከባቢ ሓድሽ መረዳእታ እንተዘይሃቡ መጀመርታ ዝለዓለ ደረጃ ዘለዎም ከባቢታት ርአ።"
      : `${intervention} ከም ናይ መጀመርታ ሓሳብ መደብ ተጠቐም፣ ድሕሪኡ ነቶም ከባቢ ዝፈልጡ ሰባት ኣረጋግጽ።`,
  }),
  sid: ({ place, score, landCover, intervention, validationFirst, lowPriority }) => ({
    score_explanation: lowPriority
      ? `Tini dargi ${score} qixxeesso afidhino; kuni woloota dargubba ledo leellishshanni dursu woroonniiti. Afi'no ragaan xaa mallaqate alba dooro ikkanno gede di'leellishanno.`
      : `Tini dargi ${score} qixxeesso afidhino. Lafu uwwa, rooba, bura, injo nna mannimmate horo malaati roore dargubba baino wolqama lawanno.`,
    why_this_area: lowPriority
      ? `${place} xaa invastimentera dihedamanno. Baala xaadooshshi haaro ragaa woy baxxino mannimmate xa'mo afidhinoha ikkiro galagalte laalamanno dandaanno.`
      : `${place} kaarte nna kaimu ragaan haaroonsote carra nooha lawanno konni daafira doorantino dargaati.`,
    investment_summary: lowPriority
      ? {
          opportunity: "Tini dargi xaa alba mallaqate gawalo ikkikkinni gedensaanni galagalte laaluwa hasiissanno.",
          investment: "Baala xaadooshshi wolqama haaro ragaa abba ikkiro tenne dargira haaroonsote invastimente doogaatto.",
          why_here: `Xaa laalo ${place} roore dirantino dargubba ledo leellishshanni haaroonsote injo laafinoha ikkanno.`,
          expected_change: "Xaa roore hasiissanno loosu baala ragaa lowooshshaati; muura woy haaroonsote mallaqa baasa diiti.",
        }
      : {
          opportunity: `Carraan miidhamino woy xibaarra no ${landCover} lafa lowooshshe nna gatamarino hasiissanno cira suuqishuati.`,
          investment: validationFirst
            ? "Dirre buuxinshinni hanafi; aanchite haaroonsote paquete baala mannimmate ledo doori. Alba baasi lafu horo, assote, haaroonsote injo nna loosu danqa buuxxanno hasiissanno."
            : `${intervention} alba paquete gede horoonsi'ramanno dandaanno; gumulote qorshu baala mannimmate ledo dooramanno hasiissanno.`,
          why_here: "Tini dargi rooba, bura, lafu uwwa, injo nna mannimmate horo malaati wolqama lawanno daafira baxxino.",
          expected_change: "Garunni qixxeessantino invastimente yannate giddo mittu uwwa, burra agara, waha amada nna baala jiro horo lowooshshe dandaanno.",
        },
    investment_reasoning: lowPriority
      ? "Tenne mallaqate gawalo gede adhate. Baala xaadooshshi haaro ragaa afidhinoha ikkikkinni roore dirantino dargubba balaxxe laali."
      : `${intervention} alba qorshu hedo gede horoonsi'ri; aanchite darga afidhino manna ledo buuxi.`,
  }),
};

function displayRecommendationTitle(
  detail: ReturnType<typeof getCanonicalSiteDetail>,
  copy: DetailCopy,
  localizedIntervention?: string,
) {
  if (!detail) return copy.recommendationFallback;

  const recommendation = detail.recommendation;
  if (recommendation.recommended_intervention !== "Field validation before investment") {
    return localizedIntervention ?? recommendation.recommended_intervention;
  }

  if (recommendation.priority_score >= 60) {
    return copy.promisingRestoration;
  }

  if (recommendation.priority_score >= 45) {
    return copy.partnerReview;
  }

  return copy.lowerPriority;
}

function humanFeatureLabel(feature: string, copy: DetailCopy) {
  return copy.factorLabels[feature] ?? feature.replaceAll("_", " ");
}

function factorSignal(direction: string, weight: number, copy: DetailCopy) {
  if (direction === "negative") {
    if (weight >= 0.35) return copy.factorSignals.majorConcern;
    if (weight >= 0.18) return copy.factorSignals.concern;
    return copy.factorSignals.minorConcern;
  }

  if (direction === "positive") {
    if (weight >= 0.35) return copy.factorSignals.strongPoint;
    if (weight >= 0.18) return copy.factorSignals.moderatePoint;
    return copy.factorSignals.supportingSignal;
  }

  return copy.factorSignals.factor;
}

function factorExplanation(
  feature: string,
  direction: "positive" | "negative",
  detail: ReturnType<typeof getCanonicalSiteDetail>,
  copy: DetailCopy,
  localized: LocalizedSiteDetail,
) {
  if (!detail) return copy.factorFallback(copy.supports);

  const site = detail.site_features;
  const recommendation = localized.recommendation;
  const landCover = humanFeatureValue(localized.site_features.land_cover_primary);
  const signal = direction === "positive" ? copy.supports : copy.weakens;

  if (feature === "land_cover_suitability_adjustment") {
    return direction === "negative"
      ? copy.landCoverNegative(landCover)
      : copy.landCoverPositive(landCover, signal);
  }

  if (feature === "carbon_potential_composite") {
    return copy.carbonExplanation(recommendation.carbon_potential);
  }

  if (feature === "biodiversity_benefit_composite") {
    return copy.biodiversityExplanation(recommendation.biodiversity_benefit);
  }

  if (feature === "water_soil_benefit_composite") {
    return copy.waterSoilExplanation(recommendation.water_soil_benefit);
  }

  if (feature === "livelihood_benefit_composite") {
    return copy.livelihoodExplanation(recommendation.livelihood_benefit);
  }

  if (feature === "implementation_feasibility_composite") {
    return copy.feasibilityExplanation(recommendation.implementation_feasibility);
  }

  if (feature === "rainfall_reliability_score") {
    return copy.rainfallExplanation(String(site.rainfall_reliability_score ?? copy.unavailable));
  }

  if (feature === "slope_risk_score") {
    return copy.slopeExplanation(String(site.slope_risk_score ?? copy.unavailable));
  }

  if (feature === "forest_loss_score") {
    return copy.forestLossExplanation(String(site.forest_loss_score ?? copy.unavailable));
  }

  if (feature === "population_pressure_score") {
    return copy.populationExplanation(String(site.population_pressure_score ?? copy.unavailable));
  }

  return copy.factorFallback(signal);
}

function humanFeatureValue(value: string) {
  return value.replaceAll("_", " ");
}
