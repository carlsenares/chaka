export const locales = {
  en: {
    code: "en",
    shortLabel: "EN",
    nativeName: "English",
    englishName: "English",
    targetLanguageName: "English",
  },
  am: {
    code: "am",
    shortLabel: "AM",
    nativeName: "አማርኛ",
    englishName: "Amharic",
    targetLanguageName: "Amharic / አማርኛ",
  },
  om: {
    code: "om",
    shortLabel: "OM",
    nativeName: "Afaan Oromoo",
    englishName: "Afaan Oromo",
    targetLanguageName: "Afaan Oromo / Afaan Oromoo",
  },
  so: {
    code: "so",
    shortLabel: "SO",
    nativeName: "Soomaali",
    englishName: "Somali",
    targetLanguageName: "Somali / Soomaali",
  },
  ti: {
    code: "ti",
    shortLabel: "TI",
    nativeName: "ትግርኛ",
    englishName: "Tigrinya",
    targetLanguageName: "Tigrinya / ትግርኛ",
  },
  sid: {
    code: "sid",
    shortLabel: "SID",
    nativeName: "Sidaamu Afoo",
    englishName: "Sidamo",
    targetLanguageName: "Sidamo / Sidaamu Afoo",
  },
} as const;

export type Locale = keyof typeof locales;

export const localLanguageOptions = ["am", "om", "so", "ti", "sid"] as const;

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && value in locales);
}

export function getLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : "en";
}
