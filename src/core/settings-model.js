import {
  CACHE_MAX_ENTRIES_CAP,
  CACHE_MINUTES_MAX,
  getDefaults,
  PROBE_CONCURRENCY_MAX,
  TOAST_POSITIONS,
} from './constants.js';
import { SUPPORTED_LOCALES } from '../i18n/meta.js';

const REGION_MODES = ['auto', 'manual'];
const PROXY_MODES = ['gateway', 'path', 'query'];
const PROBE_SCOPES = ['suggest', 'search', 'both'];

export function normalizeLocale(value, fallback = 'auto') {
  if (value === 'auto' || SUPPORTED_LOCALES.includes(value)) return value;
  return fallback;
}

function text(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

export function normalizeCountryCode(value) {
  if (typeof value !== 'string') return '';
  const cc = value.trim();
  return /^[A-Za-z]{2}$/.test(cc) ? cc.toUpperCase() : '';
}

export function normalizeRegion(raw, fallback = getDefaults().region) {
  return {
    enabled: raw?.enabled !== false,
    mode: REGION_MODES.includes(raw?.mode) ? raw.mode : fallback.mode,
    showBanner: raw?.showBanner !== false,
    countryCode: normalizeCountryCode(raw?.countryCode),
    proxyEnabled: raw?.proxyEnabled === true,
    proxyMode: PROXY_MODES.includes(raw?.proxyMode) ? raw.proxyMode : fallback.proxyMode,
    proxyHost: text(raw?.proxyHost, 253).trim(),
    proxyPort: text(raw?.proxyPort, 8).trim(),
    proxyUser: text(raw?.proxyUser, 128),
    proxyPass: text(raw?.proxyPass, 256),
  };
}

export function normalizeCacheMinutes(value, fallback = getDefaults().cache.minutes) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, CACHE_MINUTES_MAX);
}

export function normalizeCacheMaxEntries(
  value,
  fallback = getDefaults().cache.maxEntries,
) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, CACHE_MAX_ENTRIES_CAP);
}

export function normalizeSearch(raw, fallback = getDefaults().search) {
  return {
    suggestEnabled: raw?.suggestEnabled !== false,
    pageEnabled: raw?.pageEnabled === true,
    rememberBlocked: raw?.rememberBlocked !== false,
    markBlocked: raw?.markBlocked !== false,
    probeEnabled: raw?.probeEnabled !== false,
    probeScope: normalizeProbeScope(raw?.probeScope, fallback.probeScope),
    probeConcurrency: normalizeProbeConcurrency(
      raw?.probeConcurrency,
      fallback.probeConcurrency,
    ),
  };
}

export function normalizeProbeScope(value, fallback = 'both') {
  return PROBE_SCOPES.includes(value) ? value : fallback;
}

export function normalizeProbeConcurrency(value, fallback = 3) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(PROBE_CONCURRENCY_MAX, Math.max(1, n));
}

export function normalizeCache(raw, fallback = getDefaults().cache) {
  return {
    minutes: normalizeCacheMinutes(raw?.minutes, fallback.minutes),
    maxEntries: normalizeCacheMaxEntries(raw?.maxEntries, fallback.maxEntries),
    appPages: raw?.appPages !== false,
    searchPages: raw?.searchPages !== false,
  };
}

export function normalizeToastPosition(value, fallback = 'top-right') {
  return TOAST_POSITIONS.includes(value) ? value : fallback;
}

export function normalizeToasts(raw, fallback = getDefaults().toasts) {
  return {
    enabled: raw?.enabled !== false,
    position: normalizeToastPosition(raw?.position, fallback.position),
  };
}

export function normalizeSettings(raw = getDefaults()) {
  const fallback = getDefaults();
  return {
    language: normalizeLocale(raw?.language, fallback.language),
    region: normalizeRegion(raw?.region, fallback.region),
    search: normalizeSearch(raw?.search, fallback.search),
    cache: normalizeCache(raw?.cache, fallback.cache),
    toasts: normalizeToasts(raw?.toasts, fallback.toasts),
  };
}

/**
 * Convert the flat v1 settings object into the nested v2 shape.
 * Unknown legacy keys are intentionally dropped.
 */
export function migrateFlatSettings(raw) {
  const defaults = getDefaults();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
  return normalizeSettings({
    language: 'auto',
    region: {
      enabled: true,
      mode: raw.autoBypass === false ? 'manual' : 'auto',
      showBanner: true,
      countryCode: raw.countryCode,
      proxyEnabled: raw.proxyEnabled,
      proxyMode: raw.proxyMode,
      proxyHost: raw.proxyHost,
      proxyPort: raw.proxyPort,
      proxyUser: raw.proxyUser,
      proxyPass: raw.proxyPass,
    },
    search: {
      suggestEnabled: raw.searchUnblocked,
      pageEnabled: raw.searchPageUnblocked,
      rememberBlocked: raw.rememberBlockedApps,
      markBlocked: raw.markBlockedInSearch,
      probeEnabled: raw.probeBlockedInSearch,
      probeScope: raw.probeBlockedScope,
      probeConcurrency: raw.probeBlockedConcurrency,
    },
    cache: {
      minutes: raw.cacheMinutes,
      maxEntries: raw.cacheMaxEntries,
      appPages: raw.cacheAppPages,
      searchPages: raw.cacheSearchPages,
    },
    toasts: {
      enabled: raw.toastsEnabled,
      position: raw.toastPosition,
    },
  });
}

export function mergeSettings(patch, current = getDefaults()) {
  const source = patch && typeof patch === 'object' ? patch : {};
  return normalizeSettings({
    language: source.language ?? current.language,
    region: { ...current.region, ...(source.region || {}) },
    search: { ...current.search, ...(source.search || {}) },
    cache: { ...current.cache, ...(source.cache || {}) },
    toasts: { ...current.toasts, ...(source.toasts || {}) },
  });
}
