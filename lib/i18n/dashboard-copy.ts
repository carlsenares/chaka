import type { Locale } from "@/lib/i18n/locales";

type LocalLocale = Exclude<Locale, "en">;

type DashboardCopy = {
  atlasLabel: string;
  screeningLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  metrics: {
    areas: string;
    topScore: string;
    selected: string;
    noneSelected: string;
  };
  priorityRanking: string;
  prioritySettings: string;
  candidateAreas: (count: number) => string;
  adjustWeights: string;
  switchRankingSettings: string;
  openDetailsFor: (name: string) => string;
  rankingMeta: (rank: number, siteId: string, region: string) => string;
  chooseLocalLanguage: string;
  useEnglish: string;
  ethiopianLanguageFlag: string;
  englishFlag: string;
  languageOptions: Record<LocalLocale, { nativeName: string; englishName: string }>;
  openChat: string;
  closeChat: string;
  askMe: string;
  chatTitle: string;
  chatSubtitle: string;
  close: string;
};

const copy: Record<Locale, DashboardCopy> = {
  en: {
    atlasLabel: "Chaka atlas",
    screeningLabel: "Source-derived screening",
    heroTitle: "Find restoration areas in Ethiopia.",
    heroSubtitle:
      "Compare priority areas, check local evidence, and open the details before planning an investment.",
    metrics: {
      areas: "Areas",
      topScore: "Top score",
      selected: "Selected",
      noneSelected: "None",
    },
    priorityRanking: "Priority ranking",
    prioritySettings: "Priority settings",
    candidateAreas: (count) => `${count} candidate areas`,
    adjustWeights: "Adjust what matters most",
    switchRankingSettings: "Switch ranking and settings",
    openDetailsFor: (name) => `Open details for ${name}`,
    rankingMeta: (rank, siteId, region) => `#${rank} · ${siteId} · ${region}`,
    chooseLocalLanguage: "Choose Ethiopian language",
    useEnglish: "Use English",
    ethiopianLanguageFlag: "Ethiopian language",
    englishFlag: "English",
    languageOptions: {
      am: { nativeName: "አማርኛ", englishName: "Amharic" },
      om: { nativeName: "Afaan Oromoo", englishName: "Afaan Oromo" },
      so: { nativeName: "Soomaali", englishName: "Somali" },
      ti: { nativeName: "ትግርኛ", englishName: "Tigrinya" },
      sid: { nativeName: "Sidaamu Afoo", englishName: "Sidamo" },
    },
    openChat: "Open Chaka chat",
    closeChat: "Close Chaka chat",
    askMe: "Ask me",
    chatTitle: "Chaka assistant",
    chatSubtitle: "Grounded in the selected area.",
    close: "Close",
  },
  am: {
    atlasLabel: "የቻካ አትላስ",
    screeningLabel: "ከምንጮች የተገኘ ማጣሪያ",
    heroTitle: "በኢትዮጵያ የመልሶ ማቋቋም ቦታዎችን ያግኙ።",
    heroSubtitle: "የቅድሚያ ቦታዎችን ያነጻጽሩ፣ አካባቢያዊ ማስረጃን ይመልከቱ፣ ከኢንቨስትመንት በፊት ዝርዝሩን ይክፈቱ።",
    metrics: {
      areas: "ቦታዎች",
      topScore: "ከፍተኛ ነጥብ",
      selected: "የተመረጠ",
      noneSelected: "የለም",
    },
    priorityRanking: "የቅድሚያ ደረጃ",
    prioritySettings: "የቅድሚያ ቅንብሮች",
    candidateAreas: (count) => `${count} ተመራጭ ቦታዎች`,
    adjustWeights: "በጣም አስፈላጊውን ያስተካክሉ",
    switchRankingSettings: "ደረጃና ቅንብሮችን ቀይር",
    openDetailsFor: (name) => `የ${name} ዝርዝር ክፈት`,
    rankingMeta: (rank, siteId, region) => `#${rank} · ${siteId} · ${region}`,
    chooseLocalLanguage: "የኢትዮጵያ ቋንቋ ይምረጡ",
    useEnglish: "እንግሊዝኛ ተጠቀም",
    ethiopianLanguageFlag: "የኢትዮጵያ ቋንቋ",
    englishFlag: "እንግሊዝኛ",
    languageOptions: {
      am: { nativeName: "አማርኛ", englishName: "አማርኛ" },
      om: { nativeName: "Afaan Oromoo", englishName: "ኦሮምኛ" },
      so: { nativeName: "Soomaali", englishName: "ሶማሊኛ" },
      ti: { nativeName: "ትግርኛ", englishName: "ትግርኛ" },
      sid: { nativeName: "Sidaamu Afoo", englishName: "ሲዳምኛ" },
    },
    openChat: "የቻካ ውይይትን ክፈት",
    closeChat: "የቻካ ውይይትን ዝጋ",
    askMe: "ጠይቁኝ",
    chatTitle: "የቻካ ረዳት",
    chatSubtitle: "በተመረጠው ቦታ ላይ የተመሠረተ።",
    close: "ዝጋ",
  },
  om: {
    atlasLabel: "Atlaasii Chaka",
    screeningLabel: "Filannoo maddoota irraa argame",
    heroTitle: "Itoophiyaa keessatti iddoowwan deebisanii misoomsuuf barbaadi.",
    heroSubtitle: "Iddoowwan dursa qaban wal bira qabi, ragaa naannoo ilaali, murtoo invastimantii dura bal'inaan bani.",
    metrics: {
      areas: "Iddoowwan",
      topScore: "Qabxii olaanaa",
      selected: "Filatame",
      noneSelected: "Homaa",
    },
    priorityRanking: "Sadarkaa dursaa",
    prioritySettings: "Sirreeffama dursaa",
    candidateAreas: (count) => `${count} iddoowwan filatamoo`,
    adjustWeights: "Waan caalaa barbaachisu sirreessi",
    switchRankingSettings: "Sadarkaa fi sirreeffama jijjiiri",
    openDetailsFor: (name) => `Ibsa ${name} bani`,
    rankingMeta: (rank, siteId, region) => `#${rank} · ${siteId} · ${region}`,
    chooseLocalLanguage: "Afaan Itoophiyaa filadhu",
    useEnglish: "Ingliffa fayyadami",
    ethiopianLanguageFlag: "Afaan Itoophiyaa",
    englishFlag: "Ingliffa",
    languageOptions: {
      am: { nativeName: "አማርኛ", englishName: "Afaan Amaaraa" },
      om: { nativeName: "Afaan Oromoo", englishName: "Afaan Oromoo" },
      so: { nativeName: "Soomaali", englishName: "Afaan Somaalee" },
      ti: { nativeName: "ትግርኛ", englishName: "Afaan Tigiree" },
      sid: { nativeName: "Sidaamu Afoo", englishName: "Afaan Sidaamaa" },
    },
    openChat: "Mari Chaka bani",
    closeChat: "Mari Chaka cufi",
    askMe: "Na gaafadhu",
    chatTitle: "Gargaaraa Chaka",
    chatSubtitle: "Iddoo filatame irratti hundaa'e.",
    close: "Cufi",
  },
  so: {
    atlasLabel: "Atlaska Chaka",
    screeningLabel: "Shaandhayn laga soo qaatay ilo",
    heroTitle: "Ka hel meelaha dib-u-soo-celinta ee Itoobiya.",
    heroSubtitle: "Isbarbar dhig meelaha mudnaanta leh, eeg caddeynta deegaanka, kadib fur faahfaahinta ka hor maalgelinta.",
    metrics: {
      areas: "Goobo",
      topScore: "Dhibcaha sare",
      selected: "La doortay",
      noneSelected: "Midna",
    },
    priorityRanking: "Kala horeynta mudnaanta",
    prioritySettings: "Dejinta mudnaanta",
    candidateAreas: (count) => `${count} goobood oo musharrax ah`,
    adjustWeights: "Hagaaji waxa ugu muhiimsan",
    switchRankingSettings: "Beddel kala horeynta iyo dejinta",
    openDetailsFor: (name) => `Fur faahfaahinta ${name}`,
    rankingMeta: (rank, siteId, region) => `#${rank} · ${siteId} · ${region}`,
    chooseLocalLanguage: "Dooro luqad Itoobiyaan ah",
    useEnglish: "Adeegso Ingiriisi",
    ethiopianLanguageFlag: "Luqad Itoobiyaan ah",
    englishFlag: "Ingiriisi",
    languageOptions: {
      am: { nativeName: "አማርኛ", englishName: "Amxaari" },
      om: { nativeName: "Afaan Oromoo", englishName: "Oromo" },
      so: { nativeName: "Soomaali", englishName: "Soomaali" },
      ti: { nativeName: "ትግርኛ", englishName: "Tigrinya" },
      sid: { nativeName: "Sidaamu Afoo", englishName: "Sidamo" },
    },
    openChat: "Fur wada sheekaysiga Chaka",
    closeChat: "Xir wada sheekaysiga Chaka",
    askMe: "I weydii",
    chatTitle: "Kaaliyaha Chaka",
    chatSubtitle: "Ku saleysan goobta la doortay.",
    close: "Xir",
  },
  ti: {
    atlasLabel: "ናይ Chaka ኣትላስ",
    screeningLabel: "ካብ ምንጭታት ዝመጸ ምጽራይ",
    heroTitle: "ኣብ ኢትዮጵያ ናይ ምምላስ መሬት ቦታታት ድለዩ።",
    heroSubtitle: "ቅድሚ ኢንቨስትመንት ምውሳን፣ ቅድሚያ ዘለዎም ቦታታት ኣወዳድሩ፣ ናይ ከባቢ መርትዖ ርኣዩ፣ ዝርዝር ክፈቱ።",
    metrics: {
      areas: "ቦታታት",
      topScore: "ዝለዓለ ነጥቢ",
      selected: "ዝተመረጸ",
      noneSelected: "የለን",
    },
    priorityRanking: "ደረጃ ቅድሚያ",
    prioritySettings: "ቅንብር ቅድሚያ",
    candidateAreas: (count) => `${count} ተመራጺ ቦታታት`,
    adjustWeights: "ዝያዳ ዘገድስ ኣስተኻኽሉ",
    switchRankingSettings: "ደረጃን ቅንብርን ቀይር",
    openDetailsFor: (name) => `ዝርዝር ${name} ክፈት`,
    rankingMeta: (rank, siteId, region) => `#${rank} · ${siteId} · ${region}`,
    chooseLocalLanguage: "ቋንቋ ኢትዮጵያ ምረጽ",
    useEnglish: "እንግሊዝኛ ተጠቐም",
    ethiopianLanguageFlag: "ቋንቋ ኢትዮጵያ",
    englishFlag: "እንግሊዝኛ",
    languageOptions: {
      am: { nativeName: "አማርኛ", englishName: "ኣምሓርኛ" },
      om: { nativeName: "Afaan Oromoo", englishName: "ኦሮምኛ" },
      so: { nativeName: "Soomaali", englishName: "ሶማልኛ" },
      ti: { nativeName: "ትግርኛ", englishName: "ትግርኛ" },
      sid: { nativeName: "Sidaamu Afoo", englishName: "ሲዳምኛ" },
    },
    openChat: "ውይይት Chaka ክፈት",
    closeChat: "ውይይት Chaka ዕጸው",
    askMe: "ሕተቱኒ",
    chatTitle: "ሓጋዚ Chaka",
    chatSubtitle: "ኣብቲ ዝተመረጸ ቦታ ዝተመርኮሰ።",
    close: "ዕጸው",
  },
  sid: {
    atlasLabel: "Chaka atlaase",
    screeningLabel: "Bue giddonni fulino wonshsha",
    heroTitle: "Itoophiya giddo qixxeessate baala qolte soorrate darga hasiri.",
    heroSubtitle: "Dursi darga mimmiti laali, baala ragaa buuxi, invastimentete albaanni baaxinshsha fani.",
    metrics: {
      areas: "Darguwa",
      topScore: "Roore qabxii",
      selected: "Doorantino",
      noneSelected: "Mitturino",
    },
    priorityRanking: "Dursu diramme",
    prioritySettings: "Dursu qineesso",
    candidateAreas: (count) => `${count} doorantino darga`,
    adjustWeights: "Baala roore hasiissanno qineessi",
    switchRankingSettings: "Dirammenna qineesso soorri",
    openDetailsFor: (name) => `${name} taje fani`,
    rankingMeta: (rank, siteId, region) => `#${rank} · ${siteId} · ${region}`,
    chooseLocalLanguage: "Itoophiya afi doori",
    useEnglish: "Inglize afi horoonsi'ri",
    ethiopianLanguageFlag: "Itoophiya afi",
    englishFlag: "Inglize afi",
    languageOptions: {
      am: { nativeName: "አማርኛ", englishName: "Amaaru afi" },
      om: { nativeName: "Afaan Oromoo", englishName: "Oromu afi" },
      so: { nativeName: "Soomaali", englishName: "Somale afi" },
      ti: { nativeName: "ትግርኛ", englishName: "Tigrinye afi" },
      sid: { nativeName: "Sidaamu Afoo", englishName: "Sidaamu Afoo" },
    },
    openChat: "Chaka hasaawa fani",
    closeChat: "Chaka hasaawa cufi",
    askMe: "Ane xa'mi",
    chatTitle: "Chaka kaa'laancho",
    chatSubtitle: "Doorantino darga irratti hundaa'e.",
    close: "Cufi",
  },
};

export function getDashboardCopy(locale: Locale) {
  return copy[locale] ?? copy.en;
}
