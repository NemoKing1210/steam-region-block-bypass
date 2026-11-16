import {
  CACHE_MAX_ENTRIES,
  CACHE_MAX_ENTRIES_CAP,
  CACHE_MINUTES_MAX,
} from './constants.js';

export function normalizeCacheMinutes(value, fallback = 60) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, CACHE_MINUTES_MAX);
}

export function normalizeCacheMaxEntries(value, fallback = CACHE_MAX_ENTRIES) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, CACHE_MAX_ENTRIES_CAP);
}

export function cacheTtlMs(cache = {}) {
  const minutes = normalizeCacheMinutes(cache.minutes);
  return minutes > 0 ? minutes * 60 * 1000 : 0;
}

export function cacheMaxEntries(cache = {}) {
  return normalizeCacheMaxEntries(cache.maxEntries);
}

export function buildCacheKey(targetUrl, region = {}) {
  const proxySig = region.proxyEnabled
    ? [
        region.proxyMode || 'gateway',
        String(region.proxyHost || '').trim(),
        String(region.proxyPort || '').trim(),
      ].join('|')
    : 'direct';
  return `${targetUrl}\n${proxySig}`;
}

export function cacheUrlFromKey(key) {
  return String(key || '').split('\n')[0] || '';
}

export function detectPageCacheKind(targetUrl) {
  const raw = String(targetUrl || '');
  try {
    const path = new URL(raw).pathname;
    if (/\/search/i.test(path)) return 'search';
  } catch {
    if (/\/search/i.test(raw)) return 'search';
  }
  return 'pages';
}

export function cacheCategoryForKey(key, entry) {
  if (entry?.kind === 'search' || entry?.kind === 'pages') return entry.kind;
  return detectPageCacheKind(cacheUrlFromKey(key));
}

export function isCacheCategoryEnabled(category, cache = {}) {
  if (category === 'blocked') return true;
  if (category === 'pages') return cache.appPages !== false;
  if (category === 'search') return cache.searchPages !== false;
  return true;
}

export function pruneCacheStore(store, ttlMs, maxEntries = CACHE_MAX_ENTRIES) {
  const now = Date.now();
  const limit = normalizeCacheMaxEntries(maxEntries);
  const entries = Object.entries(store || {}).filter(([, entry]) => {
    return (
      entry &&
      typeof entry === 'object' &&
      typeof entry.html === 'string' &&
      entry.html.length > 0 &&
      typeof entry.savedAt === 'number' &&
      (ttlMs <= 0 || now - entry.savedAt < ttlMs)
    );
  });
  entries.sort((a, b) => b[1].savedAt - a[1].savedAt);
  const next = {};
  for (const [key, entry] of entries.slice(0, limit)) next[key] = entry;
  return next;
}

export function cacheMeterPct(part, denom) {
  if (!denom) return 0;
  return Math.max(0, Math.min(100, (part / denom) * 100));
}

export function cacheFillPct(usedBytes, limitBytes) {
  return Math.round(cacheMeterPct(usedBytes, limitBytes));
}

export function cacheFillTone(pct) {
  const n = Math.max(0, Math.min(100, Number(pct) || 0));
  if (n >= 90) return 'high';
  if (n >= 70) return 'mid';
  return 'low';
}
