import type { Locale } from "@/lib/i18n/locales";
import type { PriorityWeights } from "@/lib/priority-scoring";

export type WeightControlsCopy = {
  title: string;
  description: string;
  reset: string;
  objectives: Record<keyof PriorityWeights, { label: string; description: string }>;
};

export type ChatCopy = {
  suggestedQuestions: string[];
  eyebrow: string;
  title: string;
  description: string;
  sourceBadge: string;
  emptyState: string;
  userLabel: string;
  assistantLabel: string;
  inputLabel: string;
  placeholder: (siteId?: string) => string;
  requestError: string;
  sendError: string;
  sending: string;
  submit: string;
};

export type DetailCopy = {
  areaDetail: string;
  dashboard: string;
  previous: string;
  next: string;
  opportunity: string;
  investment: string;
  whyHere: string;
  whatCouldChange: string;
  priorityScore: string;
  investmentBrief: string;
  rank: string;
  risk: string;
  dataQuality: string;
  screeningDisclaimer: string;
  reasoning: string;
  whyThisRecommendation: string;
  scoreFactorsTitle: string;
  scoreFactorsDescription: string;
  localObstacles: string;
  fieldCheckTitle: string;
  noLocalCaveats: string;
  confidence: string;
  siteFacts: string;
  area: string;
  zone: string;
  woreda: string;
  mainLandCover: string;
  hectareUnit: string;
  unavailable: string;
  recommendationFallback: string;
  promisingRestoration: string;
  partnerReview: string;
  lowerPriority: string;
  factorLabels: Record<string, string>;
  factorSignals: {
    majorConcern: string;
    concern: string;
    minorConcern: string;
    strongPoint: string;
    moderatePoint: string;
    supportingSignal: string;
    factor: string;
  };
  factorFallback: (signal: string) => string;
  landCoverNegative: (landCover: string) => string;
  landCoverPositive: (landCover: string, signal: string) => string;
  carbonExplanation: (rating: string) => string;
  biodiversityExplanation: (rating: string) => string;
  waterSoilExplanation: (rating: string) => string;
  livelihoodExplanation: (rating: string) => string;
  feasibilityExplanation: (rating: string) => string;
  rainfallExplanation: (score: string) => string;
  slopeExplanation: (score: string) => string;
  forestLossExplanation: (score: string) => string;
  populationExplanation: (score: string) => string;
  supports: string;
  weakens: string;
};

type UiCopy = {
  weights: WeightControlsCopy;
  chat: ChatCopy;
  detail: DetailCopy;
};

const enDetail: DetailCopy = {
  areaDetail: "Area detail",
  dashboard: "Dashboard",
  previous: "Previous",
  next: "Next",
  opportunity: "Opportunity",
  investment: "Investment",
  whyHere: "Why here",
  whatCouldChange: "What could change",
  priorityScore: "Priority score",
  investmentBrief: "Investment brief",
  rank: "Rank",
  risk: "Risk",
  dataQuality: "Data quality",
  screeningDisclaimer:
    "Screening result only. Confirm land use, tenure, implementation constraints, and local priorities before committing funding.",
  reasoning: "Reasoning",
  whyThisRecommendation: "Why this recommendation",
  scoreFactorsTitle: "What shaped the score",
  scoreFactorsDescription: "Open each factor to see what it means for this area.",
  localObstacles: "Local obstacles and sources",
  fieldCheckTitle: "What to check before funding",
  noLocalCaveats: "No local PDF caveats have been matched to this site yet.",
  confidence: "confidence",
  siteFacts: "Site facts",
  area: "Area",
  zone: "Zone",
  woreda: "Woreda",
  mainLandCover: "Main land cover",
  hectareUnit: "ha",
  unavailable: "n/a",
  recommendationFallback: "Restoration planning note",
  promisingRestoration: "Promising restoration area with field checks",
  partnerReview: "Candidate area for partner review",
  lowerPriority: "Lower-priority area for later review",
  factorLabels: {
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
  },
  factorSignals: {
    majorConcern: "Major concern",
    concern: "Concern",
    minorConcern: "Minor concern",
    strongPoint: "Strong point",
    moderatePoint: "Moderate point",
    supportingSignal: "Supporting signal",
    factor: "Factor",
  },
  factorFallback: (signal) =>
    `This factor ${signal} the score based on the available site data. It should be treated as screening context and checked locally before funding.`,
  landCoverNegative: (landCover) =>
    `The current land cover is ${landCover}. That makes this area less suitable for the proposed restoration work than places with more compatible farm, grassland, or forest-edge conditions.`,
  landCoverPositive: (landCover, signal) =>
    `The current land cover is ${landCover}. That appears compatible with restoration work, so it ${signal} the area as an investment candidate.`,
  carbonExplanation: (rating) =>
    `Carbon storage potential is rated ${rating}. This reflects signals such as tree cover, vegetation condition, soil carbon, and restoration fit. A stronger carbon signal means the area may store more carbon over time if restoration succeeds.`,
  biodiversityExplanation: (rating) =>
    `Benefit for nature is rated ${rating}. This considers whether restoration could protect or improve habitat value, but it still needs local species and land-use checks before making biodiversity claims.`,
  waterSoilExplanation: (rating) =>
    `Water and soil benefit is rated ${rating}. Rainfall, slope, erosion risk, and soil signals suggest whether restoration could help keep soil in place and improve water retention.`,
  livelihoodExplanation: (rating) =>
    `Community benefit is rated ${rating}. This uses nearby population, access, and land-use pressure as signs that restoration could matter for households if the design fits local needs.`,
  feasibilityExplanation: (rating) =>
    `Ease of getting started is rated ${rating}. Access, safeguard risk, land cover, and field validation needs affect whether a project can realistically begin here.`,
  rainfallExplanation: (score) =>
    `Rainfall reliability is ${score}/100. More reliable rainfall makes tree establishment and soil restoration more realistic.`,
  slopeExplanation: (score) =>
    `Erosion risk is ${score}/100. Higher risk can make soil and water work more valuable, but field teams should confirm the exact hotspots.`,
  forestLossExplanation: (score) =>
    `Recent forest-loss signal is ${score}/100. This can indicate a restoration opportunity, but it does not prove every parcel is available or degraded.`,
  populationExplanation: (score) =>
    `Nearby community need is ${score}/100. This can make livelihood benefits more relevant, but investment design must be agreed with local users.`,
  supports: "supports",
  weakens: "weakens",
};

const copy: Record<Locale, UiCopy> = {
  en: {
    weights: {
      title: "Priority weights",
      description: "Recomputes the ranking from the canonical feature payload.",
      reset: "Reset",
      objectives: {
        carbon: {
          label: "Carbon",
          description: "Restoration opportunity, ESA biomass stock context, uncertainty, and rainfall feasibility.",
        },
        biodiversity: {
          label: "Biodiversity",
          description: "Habitat structure, restoration uplift, observation context, and pressure.",
        },
        water_soil: {
          label: "Water and soil",
          description: "Rainfall reliability, erosion risk, soil carbon, and soil pH suitability.",
        },
        livelihood: {
          label: "Livelihood",
          description: "Population pressure, road access, and settlement proximity context.",
        },
        feasibility: {
          label: "Feasibility",
          description: "Access, safeguard risk, and data quality; also gates the final score.",
        },
      },
    },
    chat: {
      suggestedQuestions: [
        "Why is this area ranked this way?",
        "What local evidence matters most?",
        "What should an NGO verify before investing?",
      ],
      eyebrow: "Grounded chat",
      title: "Explain this recommendation",
      description: "Ask about score drivers, local evidence, caveats, field checks, or comparisons.",
      sourceBadge: "OpenAI",
      emptyState:
        "The assistant receives the selected site, current ranking context, local evidence cards, and source-grounding rules. It should not invent data or change scores.",
      userLabel: "Question",
      assistantLabel: "Answer",
      inputLabel: "Ask a question",
      placeholder: (siteId) => (siteId ? `Ask about ${siteId}` : "Select a site first"),
      requestError: "Explanation request failed.",
      sendError: "Explanation failed.",
      sending: "Explaining...",
      submit: "Explain",
    },
    detail: enDetail,
  },
  am: {
    weights: {
      title: "የቅድሚያ ክብደቶች",
      description: "ደረጃውን ከተረጋገጠው የባህሪ መረጃ እንደገና ያሰላል።",
      reset: "ዳግም አስጀምር",
      objectives: {
        carbon: {
          label: "ካርቦን",
          description: "የመልሶ ማቋቋም ዕድል፣ የባዮማስ አውድ፣ እርግጠኝነት እና የዝናብ ተፈጻሚነት።",
        },
        biodiversity: {
          label: "ብዝሃ ሕይወት",
          description: "የመኖሪያ አወቃቀር፣ የመልሶ ማቋቋም ጥቅም፣ ምልከታ እና ጫና።",
        },
        water_soil: {
          label: "ውሃ እና አፈር",
          description: "የዝናብ እርግጠኝነት፣ የመሸርሸር አደጋ፣ የአፈር ካርቦን እና የአፈር pH ተስማሚነት።",
        },
        livelihood: {
          label: "ኑሮ",
          description: "የሕዝብ ጫና፣ የመንገድ መዳረሻ እና የሰፈር ቅርበት።",
        },
        feasibility: {
          label: "ተፈጻሚነት",
          description: "መዳረሻ፣ የጥበቃ አደጋ እና የመረጃ ጥራት፤ የመጨረሻ ውጤትንም ይገድባል።",
        },
      },
    },
    chat: {
      suggestedQuestions: [
        "ይህ ቦታ ለምን በዚህ ደረጃ ነው?",
        "የትኛው አካባቢያዊ ማስረጃ በጣም አስፈላጊ ነው?",
        "NGO ከመዋዕለ ንዋይ በፊት ምን ማረጋገጥ አለበት?",
      ],
      eyebrow: "በማስረጃ የተመሠረተ ውይይት",
      title: "ይህን ምክር ያብራሩ",
      description: "ስለ የውጤት ምክንያቶች፣ አካባቢያዊ ማስረጃ፣ ጥንቃቄዎች እና የመስክ ፍተሻዎች ይጠይቁ።",
      sourceBadge: "OpenAI",
      emptyState: "ረዳቱ የተመረጠውን ቦታ፣ የደረጃ አውድ፣ አካባቢያዊ ማስረጃ እና የምንጭ ህጎችን ይቀበላል። መረጃ መፍጠር ወይም ውጤቶችን መቀየር የለበትም።",
      userLabel: "ጥያቄ",
      assistantLabel: "መልስ",
      inputLabel: "ጥያቄ ይጠይቁ",
      placeholder: (siteId) => (siteId ? `${siteId} ስለሚመለከት ይጠይቁ` : "መጀመሪያ ቦታ ይምረጡ"),
      requestError: "የማብራሪያ ጥያቄው አልተሳካም።",
      sendError: "ማብራሪያው አልተሳካም።",
      sending: "በማብራራት ላይ...",
      submit: "አብራራ",
    },
    detail: {
      ...enDetail,
      areaDetail: "የቦታ ዝርዝር",
      dashboard: "ዳሽቦርድ",
      previous: "ቀዳሚ",
      next: "ቀጣይ",
      opportunity: "ዕድል",
      investment: "ኢንቨስትመንት",
      whyHere: "ለምን እዚህ",
      whatCouldChange: "ምን ሊቀየር ይችላል",
      priorityScore: "የቅድሚያ ውጤት",
      investmentBrief: "የኢንቨስትመንት አጭር መግለጫ",
      rank: "ደረጃ",
      risk: "አደጋ",
      dataQuality: "የመረጃ ጥራት",
      screeningDisclaimer: "ይህ የቅድመ-ግምገማ ውጤት ብቻ ነው። ገንዘብ ከመመደብ በፊት የመሬት አጠቃቀም፣ መብት፣ የትግበራ ገደቦች እና አካባቢያዊ ቅድሚያዎችን ያረጋግጡ።",
      reasoning: "ምክንያት",
      whyThisRecommendation: "ይህ ምክር ለምን",
      scoreFactorsTitle: "ውጤቱን የቀረጹ ነገሮች",
      scoreFactorsDescription: "እያንዳንዱን ምክንያት ክፈቱ እና ለዚህ ቦታ ምን ማለት እንደሆነ ይመልከቱ።",
      localObstacles: "አካባቢያዊ እንቅፋቶችና ምንጮች",
      fieldCheckTitle: "ከገንዘብ በፊት ምን መፈተሽ አለበት",
      noLocalCaveats: "ለዚህ ቦታ የተዛመዱ የአካባቢ PDF ጥንቃቄዎች እስካሁን የሉም።",
      confidence: "እርግጠኝነት",
      siteFacts: "የቦታ እውነታዎች",
      area: "ስፋት",
      zone: "ዞን",
      woreda: "ወረዳ",
      mainLandCover: "ዋና የመሬት ሽፋን",
    },
  },
  om: {
    weights: {
      title: "Ulfaatina dursaa",
      description: "Sadarkaa deebi'ee ragaa amala mirkanaa'e irraa shallaga.",
      reset: "Deebisi",
      objectives: {
        carbon: {
          label: "Kaaboonii",
          description: "Carraa haaromsaa, haala biomass, mirkanaa'ina dhabuu fi mijataa roobaa.",
        },
        biodiversity: {
          label: "Heddummina lubbu qabeeyyii",
          description: "Caaseffama bakka jireenyaa, bu'aa haaromsaa, ragaa ilaalchaa fi dhiibbaa.",
        },
        water_soil: {
          label: "Bishaanii fi biyyee",
          description: "Amanamummaa roobaa, balaa nyaatamuu biyyee, kaarboonii biyyee fi mijataa pH biyyee.",
        },
        livelihood: {
          label: "Jireenya hawaasaa",
          description: "Dhiibbaa uummataa, karaa dhaqqabummaa fi dhiyeenya qubsumaa.",
        },
        feasibility: {
          label: "Raawwatamummaa",
          description: "Dhaqqabummaa, balaa eegumsaa fi qulqullina ragaa; qabxii dhumaas ni daangeessa.",
        },
      },
    },
    chat: {
      suggestedQuestions: [
        "Iddoon kun maaliif akkana sadarkeefame?",
        "Ragaan naannoo kamtu caalaa barbaachisaa dha?",
        "NGOn tokko invastimantii dura maal mirkaneessuu qaba?",
      ],
      eyebrow: "Mari ragaan deeggarame",
      title: "Gorsa kana ibsi",
      description: "Sababoota qabxii, ragaa naannoo, of eeggannoo, sakatta'iinsa dirree yookaan wal bira qabuu gaafadhu.",
      sourceBadge: "OpenAI",
      emptyState: "Gargaaraan kun iddoo filatame, haala sadarkaa, ragaa naannoo fi seera madda ragaa fudhata. Odeeffannoo uumuu yookaan qabxii jijjiiruu hin qabu.",
      userLabel: "Gaaffii",
      assistantLabel: "Deebii",
      inputLabel: "Gaaffii gaafadhu",
      placeholder: (siteId) => (siteId ? `${siteId} irratti gaafadhu` : "Dursa iddoo fili"),
      requestError: "Gaaffiin ibsaa hin milkoofne.",
      sendError: "Ibsi hin milkoofne.",
      sending: "Ibsaa jira...",
      submit: "Ibsi",
    },
    detail: {
      ...enDetail,
      areaDetail: "Ibsa iddoo",
      dashboard: "Daashboordii",
      previous: "Kan duraa",
      next: "Kan itti aanu",
      opportunity: "Carraa",
      investment: "Invastimantii",
      whyHere: "Maaliif as",
      whatCouldChange: "Wanti jijjiiramuu danda'u",
      priorityScore: "Qabxii dursaa",
      investmentBrief: "Cuunfaa invastimantii",
      rank: "Sadarkaa",
      risk: "Balaa",
      dataQuality: "Qulqullina ragaa",
      screeningDisclaimer: "Kun bu'aa sakatta'iinsa jalqabaa qofa. Maallaqa murteessuu dura itti fayyadama lafa, mirga, danqaalee hojii fi dursa naannoo mirkaneessi.",
      reasoning: "Sababoota",
      whyThisRecommendation: "Gorsi kun maaliif",
      scoreFactorsTitle: "Waan qabxii kana uume",
      scoreFactorsDescription: "Tokkoon tokkoon sababaa baniitii hiika isaa iddoo kanaaf ilaali.",
      localObstacles: "Danqaalee fi maddoota naannoo",
      fieldCheckTitle: "Maallaqa dura waan sakatta'amuu qabu",
      noLocalCaveats: "Of eeggannoon PDF naannoo iddoo kanaan wal qabatu hanga ammaatti hin jiru.",
      confidence: "amantaa",
      siteFacts: "Dhugaa iddoo",
      area: "Bal'ina",
      zone: "Godina",
      woreda: "Aanaa",
      mainLandCover: "Uwwisa lafaa guddaa",
    },
  },
  so: {
    weights: {
      title: "Miisaanka mudnaanta",
      description: "Waxay dib uga xisaabisaa kala horeynta xogta astaamaha rasmiga ah.",
      reset: "Dib u celi",
      objectives: {
        carbon: {
          label: "Kaarboon",
          description: "Fursadda soo celinta, macnaha kaydka biomass, hubanti la'aanta, iyo ku habboonaanta roobka.",
        },
        biodiversity: {
          label: "Kala duwanaanshaha noolaha",
          description: "Qaab-dhismeedka hoyga, faa'iidada soo celinta, macnaha indha-indheynta, iyo cadaadiska.",
        },
        water_soil: {
          label: "Biyo iyo ciid",
          description: "Kalsoonida roobka, halista nabaad-guurka, kaarboonka ciidda, iyo ku habboonaanta pH ciidda.",
        },
        livelihood: {
          label: "Nolol",
          description: "Cadaadiska dadka, marin waddo, iyo u dhowaanshaha degsiimooyinka.",
        },
        feasibility: {
          label: "Suurtagalnimada",
          description: "Helitaan, halista ilaalinta, iyo tayada xogta; waxay sidoo kale xaddidaa dhibcaha ugu dambeeya.",
        },
      },
    },
    chat: {
      suggestedQuestions: [
        "Maxaa goobtan sidan loogu kala hormariyay?",
        "Caddeynta deegaanka ee ugu muhiimsan waa maxay?",
        "NGO maxay xaqiijinaysaa ka hor maalgelinta?",
      ],
      eyebrow: "Sheeko caddeyn ku dhisan",
      title: "Sharax taladan",
      description: "Weydii darawallada dhibcaha, caddeynta deegaanka, digniinaha, hubinta goobta, ama isbarbardhigga.",
      sourceBadge: "OpenAI",
      emptyState: "Kaaliyuhu wuxuu helaa goobta la doortay, macnaha kala horeynta, caddeynta deegaanka, iyo xeerarka ilaha. Ma abuuri karo xog cusub mana beddeli karo dhibcaha.",
      userLabel: "Su'aal",
      assistantLabel: "Jawaab",
      inputLabel: "Weydii su'aal",
      placeholder: (siteId) => (siteId ? `Weydii ${siteId}` : "Marka hore dooro goob"),
      requestError: "Codsiga sharaxaadda wuu fashilmay.",
      sendError: "Sharaxaadda way fashilantay.",
      sending: "Waa la sharxayaa...",
      submit: "Sharax",
    },
    detail: {
      ...enDetail,
      areaDetail: "Faahfaahinta goobta",
      dashboard: "Dashboard",
      previous: "Hore",
      next: "Xiga",
      opportunity: "Fursad",
      investment: "Maalgelin",
      whyHere: "Maxaa halkan",
      whatCouldChange: "Waxa isbeddeli kara",
      priorityScore: "Dhibcaha mudnaanta",
      investmentBrief: "Kooban maalgelin",
      rank: "Darajo",
      risk: "Khatar",
      dataQuality: "Tayada xogta",
      screeningDisclaimer: "Tani waa natiijo shaandhayn oo keliya. Xaqiiji isticmaalka dhulka, xuquuqda, caqabadaha fulinta, iyo mudnaanta deegaanka ka hor maalgelin.",
      reasoning: "Sababeyn",
      whyThisRecommendation: "Sababta taladan",
      scoreFactorsTitle: "Waxa sameeyay dhibcaha",
      scoreFactorsDescription: "Fur qodob kasta si aad u aragto waxa uu uga dhigan yahay goobtan.",
      localObstacles: "Caqabadaha iyo ilaha deegaanka",
      fieldCheckTitle: "Waxa la hubiyo ka hor maalgelinta",
      noLocalCaveats: "Weli ma jiraan digniino PDF deegaan oo la xiriira goobtan.",
      confidence: "kalsooni",
      siteFacts: "Xaqiiqooyinka goobta",
      area: "Baaxad",
      zone: "Aag",
      woreda: "Degmo",
      mainLandCover: "Daboolka dhulka ugu weyn",
    },
  },
  ti: {
    weights: {
      title: "ክብደት ቅድሚያ",
      description: "ነቲ ደረጃ ካብ ዝተረጋገጸ መረዳእታ ባህርያት ዳግማይ ይሕሰቦ።",
      reset: "ዳግማይ ጀምር",
      objectives: {
        carbon: {
          label: "ካርቦን",
          description: "ዕድል ምሕዳስ፣ ናይ ባዮማስ ኣውድ፣ ዘይርጉጽነትን ተፈጻምነት ዝናብን።",
        },
        biodiversity: {
          label: "ብዝሒ ህይወት",
          description: "ቅርጺ መንበሪ፣ ምሕዳስ ዝህቦ ጥቕሚ፣ ናይ ምዕዛብ ኣውድን ጸቕጥን።",
        },
        water_soil: {
          label: "ማይን ሓመድን",
          description: "እምነት ዝናብ፣ ሓደጋ ምሕጻብ ሓመድ፣ ካርቦን ሓመድን pH ሓመድን።",
        },
        livelihood: {
          label: "መነባብሮ",
          description: "ጸቕጢ ህዝቢ፣ መገዲ መብጽሒን ቅርበት ሰፈርን።",
        },
        feasibility: {
          label: "ተፈጻምነት",
          description: "መብጽሒ፣ ሓደጋ ድሕነትን ጽሬት መረዳእታን፤ ነቲ ውጤት መወዳእታ እውን ይውስን።",
        },
      },
    },
    chat: {
      suggestedQuestions: [
        "እዚ ቦታ ስለምንታይ ከምዚ ተሰሪዑ?",
        "ኣየናይ ናይ ከባቢ መርትዖ ዝያዳ ይጠቅም?",
        "NGO ቅድሚ ኢንቨስትመንት እንታይ ክረጋገጽ ኣለዎ?",
      ],
      eyebrow: "ብመርትዖ ዝተመርኮሰ ውይይት",
      title: "ነዚ ምኽሪ ኣብርህ",
      description: "ብዛዕባ መንቀሳቐሲ ውጤት፣ ናይ ከባቢ መርትዖ፣ ጥንቃቐታት፣ ፍተሻ መስክ ወይ ምውድዳር ሕተት።",
      sourceBadge: "OpenAI",
      emptyState: "እቲ ሓጋዚ ዝተመረጸ ቦታ፣ ናይ ደረጃ ኣውድ፣ ናይ ከባቢ መርትዖን ሕግታት ምንጭን ይቕበል። መረዳእታ ክፈጥር ወይ ውጤታት ክቕይር ኣይግባእን።",
      userLabel: "ሕቶ",
      assistantLabel: "መልሲ",
      inputLabel: "ሕቶ ሕተት",
      placeholder: (siteId) => (siteId ? `ብዛዕባ ${siteId} ሕተት` : "መጀመርታ ቦታ ምረጽ"),
      requestError: "ሕቶ መብርሂ ኣይተዓወተን።",
      sendError: "መብርሂ ኣይተዓወተን።",
      sending: "ይብርህ ኣሎ...",
      submit: "ኣብርህ",
    },
    detail: {
      ...enDetail,
      areaDetail: "ዝርዝር ቦታ",
      dashboard: "ዳሽቦርድ",
      previous: "ቅድሚኡ",
      next: "ቀጻሊ",
      opportunity: "ዕድል",
      investment: "ኢንቨስትመንት",
      whyHere: "ስለምንታይ ኣብዚ",
      whatCouldChange: "ክቕየር ዝኽእል",
      priorityScore: "ውጤት ቅድሚያ",
      investmentBrief: "ሓጺር መግለጺ ኢንቨስትመንት",
      rank: "ደረጃ",
      risk: "ሓደጋ",
      dataQuality: "ጽሬት መረዳእታ",
      screeningDisclaimer: "እዚ ውጤት መጀመርታ ምርመራ ጥራይ እዩ። ቅድሚ ገንዘብ ምውሳን ኣጠቓቕማ መሬት፣ መሰል፣ ገደባት ትግበራን ቅድሚያ ከባቢን ኣረጋግጽ።",
      reasoning: "ምኽንያት",
      whyThisRecommendation: "ስለምንታይ እዚ ምኽሪ",
      scoreFactorsTitle: "ነቲ ውጤት ዝቀረጹ",
      scoreFactorsDescription: "ነፍሲ ወከፍ ምኽንያት ክፈት፣ ንዚ ቦታ እንታይ ማለት ከምዝኾነ ርአ።",
      localObstacles: "ናይ ከባቢ እንቅፋታትን ምንጭታትን",
      fieldCheckTitle: "ቅድሚ ገንዘብ እንታይ ክፍተሽ ኣለዎ",
      noLocalCaveats: "ንዚ ቦታ ዝተዛመደ ናይ ከባቢ PDF ጥንቃቐ ገና የለን።",
      confidence: "እምነት",
      siteFacts: "ሓቅታት ቦታ",
      area: "ስፍሓት",
      zone: "ዞን",
      woreda: "ወረዳ",
      mainLandCover: "ቀንዲ ሽፋን መሬት",
    },
  },
  sid: {
    weights: {
      title: "Dursu kaalate",
      description: "Diramme qajeelto baala ragaan qoltenni galagalte shallaga.",
      reset: "Galagalchi",
      objectives: {
        carbon: {
          label: "Karboone",
          description: "Haaroonsote carra, biomassete aana, buuxamootu dadhabbi nna roobu garunni.",
        },
        biodiversity: {
          label: "Lubbote babbaxino",
          description: "Dargu mine loosama, haaroonsote horo, laalote aana nna xibaarra.",
        },
        water_soil: {
          label: "Waha nna bura",
          description: "Roobu amano, burra hoonqote bala, burri karboone nna burri pH garunni.",
        },
        livelihood: {
          label: "Jiro",
          description: "Mannimmate xibaarra, doogu injo nna qarri dargu shiqishsha.",
        },
        feasibility: {
          label: "Loosamanno gede",
          description: "Injo, agaro bala nna daatu qara; gumulote qixxeesso ikka daangessanno.",
        },
      },
    },
    chat: {
      suggestedQuestions: [
        "Tini dargi hiittoonni diramantino?",
        "Hiitte baala ragaan roore hasiissanno?",
        "NGO invastimente albaanni maala buuxxanno?",
      ],
      eyebrow: "Ragaan kaima hasaawa",
      title: "Tenne hedote xawisi",
      description: "Qixxeessote sababa, baala ragaa, agarte, dirre buuxinsha woy mimmiti laalote xa'mi.",
      sourceBadge: "OpenAI",
      emptyState: "Kaa'laancho doorantino darga, diramme aana, baala ragaa nna kaima seerra adhitanno. Haaro daata kalaqate woy qixxeesso soorrate dinosiisanno.",
      userLabel: "Xa'mo",
      assistantLabel: "Dawaro",
      inputLabel: "Xa'mo xa'mi",
      placeholder: (siteId) => (siteId ? `${siteId} aana xa'mi` : "Balaxxe darga doori"),
      requestError: "Xawishshu xa'mo dibbejje.",
      sendError: "Xawishshu dibbejje.",
      sending: "Xawishsha...",
      submit: "Xawisi",
    },
    detail: {
      ...enDetail,
      areaDetail: "Dargu xawishsha",
      dashboard: "Dashboard",
      previous: "Balaxxe",
      next: "Aantanno",
      opportunity: "Carra",
      investment: "Invastimente",
      whyHere: "Maalira tenne",
      whatCouldChange: "Soorramanno gede",
      priorityScore: "Dursu qixxeesso",
      investmentBrief: "Invastimentete xaphooma",
      rank: "Diramme",
      risk: "Bala",
      dataQuality: "Daatu qara",
      screeningDisclaimer: "Tini kayinni balaxxe laalote guma callaati. Mallaqaan albaanni lafu horo, assote, loosu danqa nna baala dursa buuxi.",
      reasoning: "Sababa",
      whyThisRecommendation: "Tini hedo maalira",
      scoreFactorsTitle: "Qixxeesso kalaqino",
      scoreFactorsDescription: "Mitto mitton sababa fani nna dargu hiittoonniati laali.",
      localObstacles: "Baala danqa nna kaima",
      fieldCheckTitle: "Mallaqaan albaanni buuxxanno",
      noLocalCaveats: "Tini dargi ledo xaadino baala PDF agaro xa'mo ale diino.",
      confidence: "ammano",
      siteFacts: "Dargu dhugooma",
      area: "Baalaxa",
      zone: "Zoone",
      woreda: "Woreda",
      mainLandCover: "Qara lafu uwwa",
    },
  },
};

export function getWeightControlsCopy(locale: Locale) {
  return copy[locale]?.weights ?? copy.en.weights;
}

export function getChatCopy(locale: Locale) {
  return copy[locale]?.chat ?? copy.en.chat;
}

export function getDetailCopy(locale: Locale) {
  return copy[locale]?.detail ?? copy.en.detail;
}
