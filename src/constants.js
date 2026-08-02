import pkg from '../package.json' with { type: 'json' };

export const REPO_URL =
  'https://github.com/NemoKing1210/steam-region-block-bypass';
export const AUTHOR_URL = 'https://github.com/NemoKing1210';
export const ISSUES_URL =
  'https://github.com/NemoKing1210/steam-region-block-bypass/issues';
export const SCRIPT_AUTHOR = pkg.author;
export const SCRIPT_VERSION = pkg.version;
export const SCRIPT_LICENSE = pkg.license;
export const STORAGE_KEY = 'srbb_settings';
export const CACHE_STORAGE_KEY = 'srbb_page_cache';
export const BLOCKED_APPS_STORAGE_KEY = 'srbb_blocked_apps';
/** One-time upgrade: guest search used to default off */
export const SEARCH_DEFAULT_ON_FLAG = 'srbb_migrated_search_default_on_v1';
/** Soft cap so GM storage does not grow without bound */
export const CACHE_MAX_ENTRIES = 30;
export const BLOCKED_APPS_MAX_ENTRIES = 500;
export const PROBE_CONCURRENCY_MAX = 5;
/** How many guest suggest rows to fetch/show from /search/results */
export const SUGGEST_RESULT_COUNT = 25;
/** Upper bound for the settings field (7 days) */
export const CACHE_MINUTES_MAX = 10080;

export const DEFAULT_SETTINGS = {
  proxyEnabled: false,
  proxyHost: '',
  proxyPort: '',
  proxyUser: '',
  proxyPass: '',
  /** gateway | path | query */
  proxyMode: 'gateway',
  countryCode: '',
  autoBypass: true, // true = replace immediately; false = show button
  /** Guest HTML TTL in minutes; 0 disables caching */
  cacheMinutes: 60,
  /** Guest search: anonymous suggest dropdown in the header */
  searchUnblocked: true,
  /** Guest /search page: anonymous refetch + inject (opt-in; off by default) */
  searchPageUnblocked: false,
  /** Remember app IDs when Steam shows a region block */
  rememberBlockedApps: true,
  /** Highlight remembered blocked apps in guest search */
  markBlockedInSearch: true,
  /** Probe search results with account cookies to detect region locks */
  probeBlockedInSearch: true,
  /** suggest | search | both */
  probeBlockedScope: 'both',
  /** Parallel account probes (1–5) */
  probeBlockedConcurrency: 3,
  /** Floating toast notifications for setting changes etc. */
  toastsEnabled: true,
  /** top-right | top-left | bottom-right | bottom-left */
  toastPosition: 'top-right',
};

export const SUPPORTED_LOCALES = [
  'en',
  'ru',
  'zh-CN',
  'es',
  'pt-BR',
  'de',
  'fr',
  'ja',
  'ko',
  'pl',
];

/** UI locale → Steam store language cookie / `?l=` value */
export const STEAM_LANG_BY_LOCALE = {
  en: 'english',
  ru: 'russian',
  'zh-CN': 'schinese',
  es: 'spanish',
  'pt-BR': 'brazilian',
  de: 'german',
  fr: 'french',
  ja: 'japanese',
  ko: 'koreana',
  pl: 'polish',
};

/** Steam_Language → Accept-Language header */
export const ACCEPT_LANG_BY_STEAM = {
  english: 'en-US,en;q=0.9',
  russian: 'ru-RU,ru;q=0.9,en;q=0.8',
  schinese: 'zh-CN,zh;q=0.9,en;q=0.8',
  tchinese: 'zh-TW,zh;q=0.9,en;q=0.8',
  spanish: 'es-ES,es;q=0.9,en;q=0.8',
  latam: 'es-419,es;q=0.9,en;q=0.8',
  brazilian: 'pt-BR,pt;q=0.9,en;q=0.8',
  portuguese: 'pt-PT,pt;q=0.9,en;q=0.8',
  german: 'de-DE,de;q=0.9,en;q=0.8',
  french: 'fr-FR,fr;q=0.9,en;q=0.8',
  japanese: 'ja-JP,ja;q=0.9,en;q=0.8',
  koreana: 'ko-KR,ko;q=0.9,en;q=0.8',
  polish: 'pl-PL,pl;q=0.9,en;q=0.8',
  italian: 'it-IT,it;q=0.9,en;q=0.8',
  dutch: 'nl-NL,nl;q=0.9,en;q=0.8',
  turkish: 'tr-TR,tr;q=0.9,en;q=0.8',
  thai: 'th-TH,th;q=0.9,en;q=0.8',
  ukrainian: 'uk-UA,uk;q=0.9,en;q=0.8',
  vietnamese: 'vi-VN,vi;q=0.9,en;q=0.8',
  indonesian: 'id-ID,id;q=0.9,en;q=0.8',
};

export const REGION_PATTERNS = [
  /unavailable in your region/i,
  /not available in your (?:country|region)/i,
  /недоступн[аоы].*(?:регион|стране|вашем регионе)/i,
  /в вашем регионе недоступн/i,
  /este artículo no está disponible en tu región/i,
  /cet article n'est pas disponible dans votre région/i,
];
