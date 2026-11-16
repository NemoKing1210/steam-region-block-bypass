import { GM_getValue, GM_setValue } from '$';
import { CACHE_SOFT_LIMIT_BYTES, CACHE_STORAGE_KEY } from './constants.js';
import { getSettings } from './settings.js';
import {
  buildCacheKey,
  cacheCategoryForKey,
  cacheFillPct,
  cacheFillTone,
  cacheMaxEntries,
  cacheMeterPct,
  cacheTtlMs,
  cacheUrlFromKey,
  detectPageCacheKind,
  isCacheCategoryEnabled,
  normalizeCacheMaxEntries,
  pruneCacheStore,
} from './page-cache-model.js';
import { getBlockedAppsStorageStats } from './blocked-apps.js';
import { t } from '../i18n/index.js';
import { escapeAttr, escapeHtml } from '../utils/html.js';

export const CACHE_CATEGORIES = [
  { id: 'pages', settingKey: 'appPages', labelKey: 'cacheCatPages', swatch: 'pages' },
  { id: 'search', settingKey: 'searchPages', labelKey: 'cacheCatSearch', swatch: 'search' },
  { id: 'blocked', settingKey: null, labelKey: 'cacheCatBlocked', swatch: 'blocked' },
];

const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

function cacheSettings() {
  return getSettings().cache;
}

export function getCacheTtlMs() {
  return cacheTtlMs(cacheSettings());
}

export function getCacheMaxEntries() {
  return cacheMaxEntries(cacheSettings());
}

export function loadCacheStore() {
  try {
    const raw = GM_getValue(CACHE_STORAGE_KEY, null);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return raw;
  } catch {
    return {};
  }
}

function persistCacheStore(store) {
  try {
    GM_setValue(CACHE_STORAGE_KEY, store);
  } catch {
    /* storage unavailable */
  }
}

function utf8Bytes(value) {
  const str = String(value || '');
  if (textEncoder) return textEncoder.encode(str).length;
  return str.length;
}

export function pageCacheEntryByteSize(key, entry) {
  return utf8Bytes(key) + utf8Bytes(entry?.html);
}

export function readPageCache(targetUrl) {
  const ttlMs = getCacheTtlMs();
  if (ttlMs <= 0) return null;
  const kind = detectPageCacheKind(targetUrl);
  if (!isCacheCategoryEnabled(kind, cacheSettings())) return null;

  const key = buildCacheKey(targetUrl, getSettings().region);
  const store = loadCacheStore();
  const entry = store[key];
  if (!entry || typeof entry.html !== 'string' || !entry.html) return null;
  if (Date.now() - entry.savedAt >= ttlMs) {
    delete store[key];
    persistCacheStore(pruneCacheStore(store, ttlMs));
    return null;
  }
  return entry.html;
}

export function writePageCache(targetUrl, html) {
  const ttlMs = getCacheTtlMs();
  if (ttlMs <= 0 || !html) return;
  const kind = detectPageCacheKind(targetUrl);
  if (!isCacheCategoryEnabled(kind, cacheSettings())) return;

  const key = buildCacheKey(targetUrl, getSettings().region);
  const store = loadCacheStore();
  store[key] = { html, savedAt: Date.now(), kind };
  persistCacheStore(pruneCacheStore(store, ttlMs));
}

export function invalidatePageCache(targetUrl) {
  const key = buildCacheKey(targetUrl, getSettings().region);
  const store = loadCacheStore();
  if (!(key in store)) return;
  delete store[key];
  persistCacheStore(store);
}

export function pruneDisabledCacheCategories(settingsOverride) {
  const cache = settingsOverride?.cache || settingsOverride || cacheSettings();
  const store = loadCacheStore();
  let removed = 0;
  for (const [key, entry] of Object.entries(store)) {
    const cat = cacheCategoryForKey(key, entry);
    if (isCacheCategoryEnabled(cat, cache)) continue;
    delete store[key];
    removed += 1;
  }
  if (removed) persistCacheStore(pruneCacheStore(store, getCacheTtlMs()));
  return removed;
}

export function clearPageCache() {
  const count = Object.keys(loadCacheStore()).length;
  persistCacheStore({});
  return count;
}

export function removePageCacheEntry(key) {
  const store = loadCacheStore();
  if (!(key in store)) return false;
  delete store[key];
  persistCacheStore(store);
  return true;
}

export function describePageCacheEntry(key) {
  const urlPart = cacheUrlFromKey(key);
  try {
    const url = new URL(urlPart);
    const appMatch = url.pathname.match(/\/app\/(\d+)/i);
    const path = `${url.pathname}${url.search}` || '/';
    if (appMatch) return { label: t('cacheEntryApp', { id: appMatch[1] }), path };
    if (/\/search/i.test(url.pathname)) {
      const term = url.searchParams.get('term') || url.searchParams.get('q') || '';
      if (term) return { label: t('cacheEntrySearchTerm', { term }), path };
      return { label: t('cacheEntrySearch'), path };
    }
    const short = path.length > 64 ? `${path.slice(0, 61)}…` : path;
    return { label: short, path };
  } catch {
    const short = urlPart.length > 64 ? `${urlPart.slice(0, 61)}…` : urlPart;
    return { label: short || t('cacheEntryUnknown'), path: urlPart };
  }
}

export function formatCacheAge(savedAt) {
  const ms = Math.max(0, Date.now() - (Number(savedAt) || 0));
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return t('cacheAgeJustNow');
  if (mins < 60) return t('cacheAgeMinutes', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 48) return t('cacheAgeHours', { count: hours });
  return t('cacheAgeDays', { count: Math.floor(hours / 24) });
}

export function formatCacheBytes(n) {
  const bytes = Math.max(0, Number(n) || 0);
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function listPageCacheEntries() {
  const ttl = getCacheTtlMs();
  const store = pruneCacheStore(
    loadCacheStore(),
    ttl <= 0 ? Number.POSITIVE_INFINITY : ttl,
    getCacheMaxEntries(),
  );
  return Object.entries(store)
    .map(([key, entry]) => {
      const desc = describePageCacheEntry(key);
      const savedAt = typeof entry?.savedAt === 'number' ? entry.savedAt : 0;
      return {
        key,
        kind: cacheCategoryForKey(key, entry),
        label: desc.label,
        path: desc.path,
        bytes: pageCacheEntryByteSize(key, entry),
        savedAt,
        ageLabel: formatCacheAge(savedAt),
      };
    })
    .sort((a, b) => b.savedAt - a.savedAt);
}

function resolveCacheSettings(settingsOverride) {
  return settingsOverride?.cache || settingsOverride || cacheSettings();
}

export function getCacheUsageStats(settingsOverride) {
  const cache = resolveCacheSettings(settingsOverride);
  const ttl = cacheTtlMs(cache);
  const store = pruneCacheStore(
    loadCacheStore(),
    ttl <= 0 ? Number.POSITIVE_INFINITY : ttl,
    normalizeCacheMaxEntries(cache.maxEntries),
  );
  const byCat = Object.fromEntries(
    CACHE_CATEGORIES.map((category) => [category.id, { bytes: 0, count: 0 }]),
  );

  for (const [key, entry] of Object.entries(store)) {
    const cat = cacheCategoryForKey(key, entry);
    const bucket = byCat[cat] || byCat.pages;
    bucket.bytes += pageCacheEntryByteSize(key, entry);
    bucket.count += 1;
  }

  const blocked = getBlockedAppsStorageStats();
  byCat.blocked.bytes += blocked.bytes;
  byCat.blocked.count += blocked.count;

  const usedBytes = CACHE_CATEGORIES.reduce(
    (sum, meta) => sum + (byCat[meta.id]?.bytes || 0),
    0,
  );
  const limitBytes = CACHE_SOFT_LIMIT_BYTES;
  const freeBytes = Math.max(0, limitBytes - usedBytes);
  const totalCount = CACHE_CATEGORIES.reduce(
    (sum, meta) => sum + (byCat[meta.id]?.count || 0),
    0,
  );

  return {
    freeBytes,
    usedBytes,
    limitBytes,
    totalCount,
    pageCount: (byCat.pages?.count || 0) + (byCat.search?.count || 0),
    categories: CACHE_CATEGORIES.map((meta) => ({
      id: meta.id,
      labelKey: meta.labelKey,
      swatch: meta.swatch,
      settingKey: meta.settingKey,
      bytes: byCat[meta.id]?.bytes || 0,
      count: byCat[meta.id]?.count || 0,
      enabled: isCacheCategoryEnabled(meta.id, cache),
    })),
  };
}

export function cacheFillPercent(stats) {
  const s = stats || getCacheUsageStats();
  return cacheFillPct(s.usedBytes, s.limitBytes);
}

export function buildCacheTabBadgeHtml(stats) {
  const pct = cacheFillPercent(stats);
  const tone = cacheFillTone(pct);
  return `<span class="srbb-panel__tab-badge srbb-panel__tab-badge--${tone}" data-srbb-cache-tab-badge aria-label="${escapeAttr(
    t('cacheTabFillAria', { pct }),
  )}">${escapeHtml(t('cacheBarPct', { pct }))}</span>`;
}

export function paintCacheTabBadge(root, stats) {
  const badge = root?.querySelector?.('[data-srbb-cache-tab-badge]');
  if (!badge) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = buildCacheTabBadgeHtml(stats).trim();
  if (wrap.firstElementChild) badge.replaceWith(wrap.firstElementChild);
}

export function buildCacheMeterHtml(stats) {
  const s = stats || getCacheUsageStats();
  const denom = Math.max(s.usedBytes, s.limitBytes, 1);
  const fillPct = cacheFillPct(s.usedBytes, s.limitBytes);
  const tone = cacheFillTone(fillPct);
  const freePct = cacheMeterPct(s.freeBytes, denom);
  const activeCats = s.categories.filter((category) => category.bytes > 0);
  const ariaParts = activeCats
    .map((category) => `${t(category.labelKey)} ${formatCacheBytes(category.bytes)}`)
    .concat([`${t('cacheBarFree')} ${formatCacheBytes(s.freeBytes)}`]);
  const aria = t('cacheBarAriaCats', {
    pct: fillPct,
    detail: ariaParts.join(', '),
  });

  const segs = activeCats
    .map((category) => {
      const width = cacheMeterPct(category.bytes, denom);
      if (width <= 0) return '';
      return `<span class="srbb-cache-meter__seg srbb-cache-meter__seg--${escapeAttr(
        category.swatch,
      )}" style="width:${width}%" title="${escapeAttr(
        `${t(category.labelKey)}: ${formatCacheBytes(category.bytes)}`,
      )}"></span>`;
    })
    .join('');

  const legendRows = s.categories
    .map((category) => {
      const off = category.enabled ? '' : ' is-off';
      const disabledMark = category.enabled
        ? ''
        : `<span class="srbb-cache-meter__off">${escapeHtml(t('cacheCatOff'))}</span>`;
      return `
        <li class="srbb-cache-meter__row${off}">
          <span class="srbb-cache-meter__swatch srbb-cache-meter__swatch--${escapeAttr(category.swatch)}"></span>
          <span class="srbb-cache-meter__name">${escapeHtml(t(category.labelKey))}${disabledMark}</span>
          <span class="srbb-cache-meter__meta">
            <span class="srbb-cache-meter__count">${escapeHtml(
              t('cacheBarCatCount', { count: category.count }),
            )}</span>
            <span class="srbb-cache-meter__size">${escapeHtml(
              formatCacheBytes(category.bytes),
            )}</span>
          </span>
        </li>`;
    })
    .join('');

  return `
    <div class="srbb-cache-meter" data-srbb-cache-meter>
      <div class="srbb-cache-meter__head">
        <div class="srbb-cache-meter__pct srbb-cache-meter__pct--${tone}">
          <span class="srbb-cache-meter__pct-value">${escapeHtml(
            t('cacheBarPct', { pct: fillPct }),
          )}</span>
          <span class="srbb-cache-meter__pct-caption">${escapeHtml(t('cacheBarFilled'))}</span>
        </div>
        <div class="srbb-cache-meter__used-wrap">
          <span class="srbb-cache-meter__used">${escapeHtml(
            t('cacheBarUsed', {
              used: formatCacheBytes(s.usedBytes),
              limit: formatCacheBytes(s.limitBytes),
            }),
          )}</span>
          <span class="srbb-cache-meter__entries">${escapeHtml(
            t('cacheBarEntries', { count: s.totalCount }),
          )}</span>
        </div>
      </div>
      <div class="srbb-cache-meter__bar" role="img" aria-label="${escapeAttr(aria)}">
        ${segs}
        <span class="srbb-cache-meter__seg srbb-cache-meter__seg--free" style="width:${freePct}%"></span>
      </div>
      <ul class="srbb-cache-meter__legend">
        ${legendRows}
        <li class="srbb-cache-meter__row srbb-cache-meter__row--free">
          <span class="srbb-cache-meter__swatch srbb-cache-meter__swatch--free"></span>
          <span class="srbb-cache-meter__name">${escapeHtml(t('cacheBarFree'))}</span>
          <span class="srbb-cache-meter__meta">
            <span class="srbb-cache-meter__size">${escapeHtml(formatCacheBytes(s.freeBytes))}</span>
          </span>
        </li>
      </ul>
      <p class="srbb-hint srbb-cache-meter__hint">${escapeHtml(t('cacheBarHint'))}</p>
    </div>`;
}

export function paintCacheMeter(root, stats) {
  const s = stats || getCacheUsageStats();
  const current = root?.querySelector?.('[data-srbb-cache-meter]');
  if (current) {
    const wrap = document.createElement('div');
    wrap.innerHTML = buildCacheMeterHtml(s).trim();
    if (wrap.firstElementChild) current.replaceWith(wrap.firstElementChild);
  }
  paintCacheTabBadge(root, s);
}

export function buildCacheListHtml() {
  const entries = listPageCacheEntries();
  if (!entries.length) {
    return `<div class="srbb-cache-list" data-srbb-cache-list>
      <div class="srbb-cache-list__empty">${escapeHtml(t('cacheListEmpty'))}</div>
    </div>`;
  }
  const rows = entries
    .map((entry) => {
      const kindLabel =
        entry.kind === 'search' ? t('cacheCatSearch') : t('cacheCatPages');
      const keyAttr = encodeURIComponent(entry.key);
      return `
        <div class="srbb-cache-list__item" data-srbb-cache-key="${escapeAttr(keyAttr)}">
          <div class="srbb-cache-list__main">
            <span class="srbb-cache-list__kind srbb-cache-list__kind--${escapeAttr(
              entry.kind,
            )}">${escapeHtml(kindLabel)}</span>
            <span class="srbb-cache-list__label" title="${escapeAttr(
              entry.path,
            )}">${escapeHtml(entry.label)}</span>
          </div>
          <div class="srbb-cache-list__meta">
            <span>${escapeHtml(formatCacheBytes(entry.bytes))}</span>
            <span>${escapeHtml(entry.ageLabel)}</span>
            <button type="button" class="srbb-btn srbb-btn--ghost srbb-cache-list__remove" data-srbb="cache-remove" data-srbb-cache-key="${escapeAttr(
              keyAttr,
            )}" title="${escapeAttr(t('cacheRemoveEntry'))}">×</button>
          </div>
        </div>`;
    })
    .join('');
  return `<div class="srbb-cache-list" data-srbb-cache-list>${rows}</div>`;
}

export function paintCacheList(root) {
  const current = root?.querySelector?.('[data-srbb-cache-list]');
  if (!current) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = buildCacheListHtml().trim();
  if (wrap.firstElementChild) current.replaceWith(wrap.firstElementChild);
}
