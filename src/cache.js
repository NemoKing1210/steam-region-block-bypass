import { GM_getValue, GM_setValue } from '$';
import { CACHE_STORAGE_KEY, CACHE_MAX_ENTRIES } from './constants.js';
import { state } from './state.js';
import { normalizeCacheMinutes } from './settings.js';

export function getCacheTtlMs() {
  const minutes = normalizeCacheMinutes(state.settings.cacheMinutes);
  return minutes > 0 ? minutes * 60 * 1000 : 0;
}

export function buildCacheKey(targetUrl) {
  const proxySig = state.settings.proxyEnabled
    ? [state.settings.proxyMode || 'gateway', state.settings.proxyHost.trim(), String(state.settings.proxyPort || '').trim()].join('|')
    : 'direct';
  return `${targetUrl}\n${proxySig}`;
}

export function loadCacheStore() {
  const raw = GM_getValue(CACHE_STORAGE_KEY, null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw;
}

export function pruneCacheStore(store, ttlMs) {
  const now = Date.now();
  const entries = Object.entries(store).filter(([, entry]) => {
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
  for (const [key, entry] of entries.slice(0, CACHE_MAX_ENTRIES)) {
    next[key] = entry;
  }
  return next;
}

export function readPageCache(targetUrl) {
  const ttlMs = getCacheTtlMs();
  if (ttlMs <= 0) return null;

  const key = buildCacheKey(targetUrl);
  let store = loadCacheStore();
  const entry = store[key];
  if (!entry || typeof entry.html !== 'string' || !entry.html) return null;

  if (Date.now() - entry.savedAt >= ttlMs) {
    delete store[key];
    GM_setValue(CACHE_STORAGE_KEY, pruneCacheStore(store, ttlMs));
    return null;
  }
  return entry.html;
}

export function writePageCache(targetUrl, html) {
  const ttlMs = getCacheTtlMs();
  if (ttlMs <= 0 || !html) return;

  const key = buildCacheKey(targetUrl);
  const store = loadCacheStore();
  store[key] = { html, savedAt: Date.now() };
  GM_setValue(CACHE_STORAGE_KEY, pruneCacheStore(store, ttlMs));
}

export function invalidatePageCache(targetUrl) {
  const key = buildCacheKey(targetUrl);
  const store = loadCacheStore();
  if (!(key in store)) return;
  delete store[key];
  GM_setValue(CACHE_STORAGE_KEY, store);
}
