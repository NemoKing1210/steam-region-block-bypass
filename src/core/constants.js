import pkg from '../../package.json' with { type: 'json' };

export const REPO_URL =
  'https://github.com/NemoKing1210/steam-region-block-bypass';
export const AUTHOR_URL = 'https://github.com/NemoKing1210';
export const ISSUES_URL =
  'https://github.com/NemoKing1210/steam-region-block-bypass/issues';
export const SCRIPT_NAME = 'Steam Region Block Bypass';
export const SCRIPT_AUTHOR = pkg.author;
export const SCRIPT_VERSION = pkg.version;
export const SCRIPT_LICENSE = pkg.license;

export const SETTINGS_KEY = 'srbb_settings_v2';
export const LEGACY_SETTINGS_KEY = 'srbb_settings';
export const CACHE_STORAGE_KEY = 'srbb_page_cache';
export const BLOCKED_APPS_STORAGE_KEY = 'srbb_blocked_apps';

export const CACHE_MAX_ENTRIES = 30;
export const CACHE_MAX_ENTRIES_CAP = 100;
export const CACHE_MINUTES_MAX = 10080;
export const CACHE_SOFT_LIMIT_BYTES = 10 * 1024 * 1024;
export const BLOCKED_APPS_MAX_ENTRIES = 500;
export const PROBE_CONCURRENCY_MAX = 5;
export const SUGGEST_RESULT_COUNT = 25;

export const REGION_REQUEST_TIMEOUT_MS = 45000;
export const REGION_SESSION_TIMEOUT_MS = 25000;
export const REGION_BOOT_TIMEOUT_MS = 30000;
export const REGION_ASSET_TIMEOUT_MS = 10000;

export const TOAST_POSITIONS = [
  'top-right',
  'top-left',
  'bottom-right',
  'bottom-left',
];

export const DEFAULT_SETTINGS = {
  language: 'auto',
  region: {
    enabled: true,
    mode: 'auto',
    showBanner: true,
    countryCode: '',
    proxyEnabled: false,
    proxyMode: 'gateway',
    proxyHost: '',
    proxyPort: '',
    proxyUser: '',
    proxyPass: '',
  },
  search: {
    suggestEnabled: true,
    pageEnabled: false,
    rememberBlocked: true,
    markBlocked: true,
    probeEnabled: true,
    probeScope: 'both',
    probeConcurrency: 3,
  },
  cache: {
    minutes: 60,
    maxEntries: CACHE_MAX_ENTRIES,
    appPages: true,
    searchPages: true,
  },
  toasts: {
    enabled: true,
    position: 'top-right',
  },
};

export function getDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

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
