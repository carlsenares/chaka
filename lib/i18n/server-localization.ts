import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import OpenAI from "openai";
import { getLocale, locales, type Locale } from "@/lib/i18n/locales";
import type {
  ProjectBriefObject,
  SiteDetailResponse,
  SiteListResponse,
} from "@/reasoning/types";

const root = process.cwd();
const cacheRoot = path.join(root, "data/i18n");

export type TranslationStatus =
  | "translated"
  | "english_source"
  | "fallback_no_openai_key"
  | "fallback_openai_error";

export type LocalizedSiteSummary = {
  site_id: string;
  locale: Locale;
  target_language: string;
  translation_status: TranslationStatus;
  display_name: string;
  region: string;
  zone: string;
  woreda?: string;
  candidate: {
    name: string;
    region: string;
    zone: string;
    woreda: string;
    candidate_method: string;
    geometry_quality: string;
    source_aoi: string;
    data_coverage_basis: string;
  };
  recommended_intervention: string;
  risk_level: string;
  carbon_potential?: string;
  livelihood_benefit?: string;
};

export type LocalizedSiteDetail = {
  site_id: string;
  locale: Locale;
  target_language: string;
  translation_status: TranslationStatus;
  display_name: string;
  site_features: {
    region: string;
    zone: string;
    woreda: string;
    land_cover_primary: string;
  };
  candidate: {
    name: string;
    region: string;
    zone: string;
    woreda: string;
    candidate_method: string;
    geometry_quality: string;
    source_aoi: string;
    data_coverage_basis: string;
  };
  admin: {
    region: string;
    zone: string;
    woreda: string;
  };
  recommendation: {
    recommended_intervention: string;
    risk_level: string;
    carbon_potential: string;
    biodiversity_benefit: string;
    livelihood_benefit: string;
    water_soil_benefit: string;
    implementation_feasibility: string;
    main_reasons: string[];
    risk_flags: string[];
    field_validation_questions: string[];
  };
  model_prediction: {
    carbon_potential: string;
    biodiversity_benefit: string;
    livelihood_benefit: string;
    water_soil_benefit: string;
    implementation_feasibility: string;
    risk_level: string;
  };
  critic: {
    support_level: string;
    unsupported_claims: string[];
    weak_claims: Array<{
      claim: string;
      reason: string;
    }>;
    recommended_disclaimer: string;
  };
  similar_cases: Array<{
    title: string;
    location: string;
    intervention: string;
    why_similar: string[];
    lesson: string;
  }>;
};

export type LocalizedProjectBrief = {
  site_id: string;
  locale: Locale;
  target_language: string;
  translation_status: TranslationStatus;
  title: string;
  one_sentence_summary: string;
  recommended_actions: string[];
  expected_benefits: {
    climate: string;
    biodiversity: string;
    livelihood: string;
    water_soil: string;
  };
  data_evidence: string[];
  risks: string[];
  next_steps: string[];
  disclaimer: string;
  critic: {
    support_level: string;
    unsupported_claims: string[];
    weak_claims: Array<{
      claim: string;
      reason: string;
    }>;
    recommended_disclaimer: string;
  };
};

export type LocalizedSiteListResponse = SiteListResponse & {
  locale: Locale;
  localized: LocalizedSiteSummary[];
};

export type LocalizedSiteDetailResponse = SiteDetailResponse & {
  locale: Locale;
  localized: LocalizedSiteDetail;
};

export type LocalizedBriefResponse = {
  brief: ProjectBriefObject;
  critic: SiteDetailResponse["critic"];
  locale: Locale;
  localized: LocalizedProjectBrief;
};

export async function localizeSiteListResponse(
  response: SiteListResponse,
  localeInput: string | null | undefined,
): Promise<LocalizedSiteListResponse> {
  const locale = getLocale(localeInput);
  if (locale === "en") {
    return {
      ...response,
      locale,
      localized: response.sites.map((site) => englishSiteSummary(site, locale, "english_source")),
    };
  }

  const cacheKey = cachePath("site-list", locale, response.sites);
  const cached = readCache<LocalizedSiteSummary[]>(cacheKey);
  if (cached) {
    return { ...response, locale, localized: cached };
  }

  const fallback = response.sites.map((site) => englishSiteSummary(site, locale, "fallback_no_openai_key"));
  const apiKey = loadOpenAiKey();
  if (!apiKey) {
    return { ...response, locale, localized: fallback };
  }

  try {
    const client = new OpenAI({
      apiKey,
      timeout: Number(process.env.OPENAI_TRANSLATION_TIMEOUT_MS ?? 20000),
      maxRetries: 0,
    });
    const language = locales[locale];
    const result = await client.responses.create({
      model: process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-5.4-mini",
      input: [
        {
          role: "system",
          content: localizationSystemPrompt(language.targetLanguageName),
        },
        {
          role: "user",
          content: JSON.stringify({
            locale,
            target_language: language.targetLanguageName,
            task: "Localize these restoration site summary display strings for UI rendering.",
            sites: response.sites.map((site) => ({
              site_id: site.site_id,
              display_name: site.name,
              region: site.candidate?.region ?? "",
              zone: site.candidate?.zone ?? "",
              woreda: site.candidate?.woreda ?? site.name,
              candidate: compactCandidateForLocalization(site.candidate),
              recommended_intervention: site.recommended_intervention,
              risk_level: site.risk_level,
              carbon_potential: site.carbon_potential,
              livelihood_benefit: site.livelihood_benefit,
            })),
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "localized_site_summaries",
          strict: true,
          schema: localizedSiteSummariesSchema,
        },
      },
    });
    const parsed = JSON.parse(result.output_text) as { sites: LocalizedSiteSummary[] };
    const localized = parsed.sites.map((site) => ({
      ...site,
      locale,
      target_language: language.targetLanguageName,
      translation_status: "translated" as const,
    }));
    writeCache(cacheKey, localized);
    return { ...response, locale, localized };
  } catch {
    return {
      ...response,
      locale,
      localized: fallback.map((site) => ({ ...site, translation_status: "fallback_openai_error" as const })),
    };
  }
}

export async function localizeSiteDetailResponse(
  detail: SiteDetailResponse,
  localeInput: string | null | undefined,
): Promise<LocalizedSiteDetailResponse> {
  const locale = getLocale(localeInput);
  if (locale === "en") {
    return {
      ...detail,
      locale,
      localized: englishSiteDetail(detail, locale, "english_source"),
    };
  }

  const cacheKey = cachePath("site-detail", locale, compactDetailForLocalization(detail));
  const cached = readCache<LocalizedSiteDetail>(cacheKey);
  if (cached) {
    return { ...detail, locale, localized: cached };
  }

  const fallback = englishSiteDetail(detail, locale, "fallback_no_openai_key");
  const apiKey = loadOpenAiKey();
  if (!apiKey) {
    return { ...detail, locale, localized: fallback };
  }

  try {
    const client = new OpenAI({
      apiKey,
      timeout: Number(process.env.OPENAI_TRANSLATION_TIMEOUT_MS ?? 20000),
      maxRetries: 0,
    });
    const language = locales[locale];
    const result = await client.responses.create({
      model: process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-5.4-mini",
      input: [
        {
          role: "system",
          content: localizationSystemPrompt(language.targetLanguageName),
        },
        {
          role: "user",
          content: JSON.stringify({
            locale,
            target_language: language.targetLanguageName,
            task:
              "Localize this restoration site detail for UI rendering, including area display names, analysis labels, recommendation prose, risk flags, and field checks.",
            site: compactDetailForLocalization(detail),
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "localized_site_detail",
          strict: true,
          schema: localizedSiteDetailSchema,
        },
      },
    });
    const parsed = JSON.parse(result.output_text) as LocalizedSiteDetail;
    const localized: LocalizedSiteDetail = {
      ...parsed,
      locale,
      target_language: language.targetLanguageName,
      translation_status: "translated",
    };
    writeCache(cacheKey, localized);
    return { ...detail, locale, localized };
  } catch {
    return {
      ...detail,
      locale,
      localized: { ...fallback, translation_status: "fallback_openai_error" as const },
    };
  }
}

export async function localizeBriefResponse(
  brief: ProjectBriefObject,
  critic: SiteDetailResponse["critic"],
  localeInput: string | null | undefined,
): Promise<LocalizedBriefResponse> {
  const locale = getLocale(localeInput);
  if (locale === "en") {
    return {
      brief,
      critic,
      locale,
      localized: englishProjectBrief(brief, critic, locale, "english_source"),
    };
  }

  const cacheKey = cachePath("project-brief", locale, { brief, critic });
  const cached = readCache<LocalizedProjectBrief>(cacheKey);
  if (cached) {
    return { brief, critic, locale, localized: cached };
  }

  const fallback = englishProjectBrief(brief, critic, locale, "fallback_no_openai_key");
  const apiKey = loadOpenAiKey();
  if (!apiKey) {
    return { brief, critic, locale, localized: fallback };
  }

  try {
    const client = new OpenAI({
      apiKey,
      timeout: Number(process.env.OPENAI_TRANSLATION_TIMEOUT_MS ?? 20000),
      maxRetries: 0,
    });
    const language = locales[locale];
    const result = await client.responses.create({
      model: process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-5.4-mini",
      input: [
        {
          role: "system",
          content: localizationSystemPrompt(language.targetLanguageName),
        },
        {
          role: "user",
          content: JSON.stringify({
            locale,
            target_language: language.targetLanguageName,
            task:
              "Localize this project brief and evidence critic for UI rendering. Keep evidence source names, numeric values, site IDs, and citation-like strings unchanged.",
            brief,
            critic: compactCriticForLocalization(critic),
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "localized_project_brief",
          strict: true,
          schema: localizedProjectBriefSchema,
        },
      },
    });
    const parsed = JSON.parse(result.output_text) as LocalizedProjectBrief;
    const localized: LocalizedProjectBrief = {
      ...parsed,
      locale,
      target_language: language.targetLanguageName,
      translation_status: "translated",
    };
    writeCache(cacheKey, localized);
    return { brief, critic, locale, localized };
  } catch {
    return {
      brief,
      critic,
      locale,
      localized: { ...fallback, translation_status: "fallback_openai_error" as const },
    };
  }
}

function localizationSystemPrompt(targetLanguage: string) {
  return [
    `You are a UI localization agent for Chaka. Translate user-facing restoration planning text into ${targetLanguage}.`,
    "Preserve canonical site IDs, evidence IDs, filenames, page numbers, numeric scores, units, and JSON field shape exactly.",
    "Area names may be rendered in the target language script when natural, but do not invent administrative names.",
    "Do not translate PDFs or quote source text verbatim. Localize summaries and implications only.",
    "Return only schema-valid JSON.",
  ].join(" ");
}

function compactDetailForLocalization(detail: SiteDetailResponse) {
  return {
    site_id: detail.site_features.site_id,
    display_name: [detail.site_features.woreda, detail.site_features.zone].filter(Boolean).join(", "),
    site_features: {
      region: detail.site_features.region,
      zone: detail.site_features.zone,
      woreda: detail.site_features.woreda,
      land_cover_primary: detail.site_features.land_cover_primary.replaceAll("_", " "),
    },
    candidate: compactCandidateForLocalization(detail.candidate),
    admin: {
      region: detail.site_features.region,
      zone: detail.site_features.zone,
      woreda: detail.site_features.woreda,
    },
    recommendation: {
      recommended_intervention: detail.recommendation.recommended_intervention,
      risk_level: detail.recommendation.risk_level,
      carbon_potential: detail.recommendation.carbon_potential,
      biodiversity_benefit: detail.recommendation.biodiversity_benefit,
      livelihood_benefit: detail.recommendation.livelihood_benefit,
      water_soil_benefit: detail.recommendation.water_soil_benefit,
      implementation_feasibility: detail.recommendation.implementation_feasibility,
      main_reasons: detail.recommendation.main_reasons,
      risk_flags: detail.recommendation.risk_flags,
      field_validation_questions: detail.recommendation.field_validation_questions,
    },
    model_prediction: {
      carbon_potential: detail.model_prediction.carbon_potential,
      biodiversity_benefit: detail.model_prediction.biodiversity_benefit,
      livelihood_benefit: detail.model_prediction.livelihood_benefit,
      water_soil_benefit: detail.model_prediction.water_soil_benefit,
      implementation_feasibility: detail.model_prediction.implementation_feasibility,
      risk_level: detail.model_prediction.risk_level,
    },
    critic: compactCriticForLocalization(detail.critic),
    similar_cases: detail.similar_cases.map((item) => ({
      title: item.title,
      location: item.location,
      intervention: item.intervention,
      why_similar: item.why_similar,
      lesson: item.lesson,
    })),
  };
}

function compactCandidateForLocalization(candidate: SiteDetailResponse["candidate"]) {
  return {
    name: candidate?.name ?? "",
    region: candidate?.region ?? "",
    zone: candidate?.zone ?? "",
    woreda: candidate?.woreda ?? "",
    candidate_method: candidate?.candidate_method ?? "",
    geometry_quality: candidate?.geometry_quality ?? "",
    source_aoi: candidate?.source_aoi ?? "",
    data_coverage_basis: candidate?.data_coverage_basis ?? "",
  };
}

function compactCriticForLocalization(critic: SiteDetailResponse["critic"]) {
  return {
    support_level: critic.support_level,
    unsupported_claims: critic.unsupported_claims,
    weak_claims: critic.weak_claims,
    recommended_disclaimer: critic.recommended_disclaimer,
  };
}

function englishSiteSummary(site: SiteListResponse["sites"][number], locale: Locale, status: TranslationStatus): LocalizedSiteSummary {
  return {
    site_id: site.site_id,
    locale,
    target_language: locales[locale].targetLanguageName,
    translation_status: status,
    display_name: site.name,
    region: site.candidate?.region ?? "",
    zone: site.candidate?.zone ?? "",
    woreda: site.candidate?.woreda ?? site.name,
    candidate: compactCandidateForLocalization(site.candidate),
    recommended_intervention: site.recommended_intervention,
    risk_level: site.risk_level,
    carbon_potential: site.carbon_potential,
    livelihood_benefit: site.livelihood_benefit,
  };
}

function englishSiteDetail(detail: SiteDetailResponse, locale: Locale, status: TranslationStatus): LocalizedSiteDetail {
  const compact = compactDetailForLocalization(detail);
  return {
    site_id: compact.site_id,
    locale,
    target_language: locales[locale].targetLanguageName,
    translation_status: status,
    display_name: compact.display_name,
    site_features: compact.site_features,
    candidate: compact.candidate,
    admin: compact.admin,
    recommendation: compact.recommendation,
    model_prediction: compact.model_prediction,
    critic: compact.critic,
    similar_cases: compact.similar_cases,
  };
}

function englishProjectBrief(
  brief: ProjectBriefObject,
  critic: SiteDetailResponse["critic"],
  locale: Locale,
  status: TranslationStatus,
): LocalizedProjectBrief {
  return {
    site_id: brief.site_id,
    locale,
    target_language: locales[locale].targetLanguageName,
    translation_status: status,
    title: brief.title,
    one_sentence_summary: brief.one_sentence_summary,
    recommended_actions: brief.recommended_actions,
    expected_benefits: brief.expected_benefits,
    data_evidence: brief.data_evidence,
    risks: brief.risks,
    next_steps: brief.next_steps,
    disclaimer: brief.disclaimer ?? "",
    critic: compactCriticForLocalization(critic),
  };
}

function cachePath(kind: string, locale: Locale, payload: unknown) {
  const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 16);
  return path.join(cacheRoot, `${kind}.${locale}.${hash}.json`);
}

function readCache<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeCache(filePath: string, value: unknown) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function loadOpenAiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const envLocal = path.join(root, ".env.local");
  if (!existsSync(envLocal)) return null;
  const content = readFileSync(envLocal, "utf8");
  const match = content.match(/^OPENAI_API_KEY=(.+)$/m);
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? null;
}

const localizedCandidateSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "region",
    "zone",
    "woreda",
    "candidate_method",
    "geometry_quality",
    "source_aoi",
    "data_coverage_basis",
  ],
  properties: {
    name: { type: "string" },
    region: { type: "string" },
    zone: { type: "string" },
    woreda: { type: "string" },
    candidate_method: { type: "string" },
    geometry_quality: { type: "string" },
    source_aoi: { type: "string" },
    data_coverage_basis: { type: "string" },
  },
};

const localizedSiteSummariesSchema = {
  type: "object",
  additionalProperties: false,
  required: ["sites"],
  properties: {
    sites: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "locale",
          "target_language",
          "translation_status",
          "site_id",
          "display_name",
          "region",
          "zone",
          "woreda",
          "candidate",
          "recommended_intervention",
          "risk_level",
          "carbon_potential",
          "livelihood_benefit",
        ],
        properties: {
          locale: { type: "string" },
          target_language: { type: "string" },
          translation_status: { type: "string" },
          site_id: { type: "string" },
          display_name: { type: "string" },
          region: { type: "string" },
          zone: { type: "string" },
          woreda: { type: "string" },
          candidate: localizedCandidateSchema,
          recommended_intervention: { type: "string" },
          risk_level: { type: "string" },
          carbon_potential: { type: "string" },
          livelihood_benefit: { type: "string" },
        },
      },
    },
  },
};

const localizedSiteDetailSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "locale",
    "target_language",
    "translation_status",
    "site_id",
    "display_name",
    "site_features",
    "candidate",
    "admin",
    "recommendation",
    "model_prediction",
    "critic",
    "similar_cases",
  ],
  properties: {
    locale: { type: "string" },
    target_language: { type: "string" },
    translation_status: { type: "string" },
    site_id: { type: "string" },
    display_name: { type: "string" },
    site_features: {
      type: "object",
      additionalProperties: false,
      required: ["region", "zone", "woreda", "land_cover_primary"],
      properties: {
        region: { type: "string" },
        zone: { type: "string" },
        woreda: { type: "string" },
        land_cover_primary: { type: "string" },
      },
    },
    candidate: localizedCandidateSchema,
    admin: {
      type: "object",
      additionalProperties: false,
      required: ["region", "zone", "woreda"],
      properties: {
        region: { type: "string" },
        zone: { type: "string" },
        woreda: { type: "string" },
      },
    },
    recommendation: {
      type: "object",
      additionalProperties: false,
      required: [
        "recommended_intervention",
        "risk_level",
        "carbon_potential",
        "biodiversity_benefit",
        "livelihood_benefit",
        "water_soil_benefit",
        "implementation_feasibility",
        "main_reasons",
        "risk_flags",
        "field_validation_questions",
      ],
      properties: {
        recommended_intervention: { type: "string" },
        risk_level: { type: "string" },
        carbon_potential: { type: "string" },
        biodiversity_benefit: { type: "string" },
        livelihood_benefit: { type: "string" },
        water_soil_benefit: { type: "string" },
        implementation_feasibility: { type: "string" },
        main_reasons: { type: "array", items: { type: "string" } },
        risk_flags: { type: "array", items: { type: "string" } },
        field_validation_questions: { type: "array", items: { type: "string" } },
      },
    },
    model_prediction: {
      type: "object",
      additionalProperties: false,
      required: [
        "carbon_potential",
        "biodiversity_benefit",
        "livelihood_benefit",
        "water_soil_benefit",
        "implementation_feasibility",
        "risk_level",
      ],
      properties: {
        carbon_potential: { type: "string" },
        biodiversity_benefit: { type: "string" },
        livelihood_benefit: { type: "string" },
        water_soil_benefit: { type: "string" },
        implementation_feasibility: { type: "string" },
        risk_level: { type: "string" },
      },
    },
    critic: {
      type: "object",
      additionalProperties: false,
      required: [
        "support_level",
        "unsupported_claims",
        "weak_claims",
        "recommended_disclaimer",
      ],
      properties: {
        support_level: { type: "string" },
        unsupported_claims: { type: "array", items: { type: "string" } },
        weak_claims: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["claim", "reason"],
            properties: {
              claim: { type: "string" },
              reason: { type: "string" },
            },
          },
        },
        recommended_disclaimer: { type: "string" },
      },
    },
    similar_cases: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "location", "intervention", "why_similar", "lesson"],
        properties: {
          title: { type: "string" },
          location: { type: "string" },
          intervention: { type: "string" },
          why_similar: { type: "array", items: { type: "string" } },
          lesson: { type: "string" },
        },
      },
    },
  },
};

const localizedProjectBriefSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "locale",
    "target_language",
    "translation_status",
    "site_id",
    "title",
    "one_sentence_summary",
    "recommended_actions",
    "expected_benefits",
    "data_evidence",
    "risks",
    "next_steps",
    "disclaimer",
    "critic",
  ],
  properties: {
    locale: { type: "string" },
    target_language: { type: "string" },
    translation_status: { type: "string" },
    site_id: { type: "string" },
    title: { type: "string" },
    one_sentence_summary: { type: "string" },
    recommended_actions: { type: "array", items: { type: "string" } },
    expected_benefits: {
      type: "object",
      additionalProperties: false,
      required: ["climate", "biodiversity", "livelihood", "water_soil"],
      properties: {
        climate: { type: "string" },
        biodiversity: { type: "string" },
        livelihood: { type: "string" },
        water_soil: { type: "string" },
      },
    },
    data_evidence: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    next_steps: { type: "array", items: { type: "string" } },
    disclaimer: { type: "string" },
    critic: {
      type: "object",
      additionalProperties: false,
      required: [
        "support_level",
        "unsupported_claims",
        "weak_claims",
        "recommended_disclaimer",
      ],
      properties: {
        support_level: { type: "string" },
        unsupported_claims: { type: "array", items: { type: "string" } },
        weak_claims: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["claim", "reason"],
            properties: {
              claim: { type: "string" },
              reason: { type: "string" },
            },
          },
        },
        recommended_disclaimer: { type: "string" },
      },
    },
  },
};
