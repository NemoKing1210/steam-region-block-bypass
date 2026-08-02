import { GM_getValue, GM_setValue } from '$';
import { CACHE_STORAGE_KEY, CACHE_SOFT_LIMIT_BYTES } from './constants.js';
import { state } from './state.js';
import { normalizeCacheMinutes, normalizeCacheMaxEntries } from './settings.js';
import { getBlockedAppsStorageStats } from './blocked-apps.js';
import { t } from './i18n/index.js';
import { escapeAttr, escapeHtml } from './utils/html.js';

/** Soft-budget breakdown + per-source toggles (blocked has no toggle). */
export const CACHE_CATEGORIES = [
  { id: 'pages', settingKey: 'cacheAppPages', labelKey: 'cacheCatPages', swatch: 'pages' },
  { id: 'search', settingKey: 'cacheSearchPages', labelKey: 'cacheCatSearch', swatch: 'search' },
  { id: 'blocked', settingKey: null, labelKey: 'cacheCatBlocked', swatch: 'blocked' },
];

const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

export function getCacheTtlMs() {
  const minutes = normalizeCacheMinutes(state.settings.cacheMinutes);
  return minutes > 0 ? minutes * 60 * 1000 : 0;
}

export function getCacheMaxEntries() {
  return normalizeCacheMaxEntries(state.settings.cacheMaxEntries);
}

export function buildCacheKey(targetUrl) {
  const proxySig = state.settings.proxyEnabled
    ? [state.settings.proxyMode || 'gateway', state.settings.proxyHost.trim(), String(state.settings.proxyPort || '').trim()].join('|')
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

/**
 * @param {string} category
 * @param {Record<string, unknown>} [settingsOverride]
 */
export function isCacheCategoryEnabled(category, settingsOverride) {
  const s = settingsOverride || state.settings;
  if (category === 'blocked') return true;
  if (category === 'pages') return s.cacheAppPages !== false;
  if (category === 'search') return s.cacheSearchPages !== false;
  return true;
}

export function loadCacheStore() {
  const raw = GM_getValue(CACHE_STORAGE_KEY, null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw;
}

function utf8Bytes(value) {
  const str = String(value || '');
  if (textEncoder) return textEncoder.encode(str).length;
  return str.length;
}

export function pageCacheEntryByteSize(key, entry) {
  return utf8Bytes(key) + utf8Bytes(entry?.html);
}

export function pruneCacheStore(store, ttlMs, maxEntries = getCacheMaxEntries()) {
  const now = Date.now();
  const limit = normalizeCacheMaxEntries(maxEntries);
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
  for (const [key, entry] of entries.slice(0, limit)) {
    next[key] = entry;
  }
  return next;
}

export function readPageCache(targetUrl) {
  const ttlMs = getCacheTtlMs();
  if (ttlMs <= 0) return null;

  const kind = detectPageCacheKind(targetUrl);
  if (!isCacheCategoryEnabled(kind)) return null;

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

  const kind = detectPageCacheKind(targetUrl);
  if (!isCacheCategoryEnabled(kind)) return;

  const key = buildCacheKey(targetUrl);
  const store = loadCacheStore();
  store[key] = { html, savedAt: Date.now(), kind };
  GM_setValue(CACHE_STORAGE_KEY, pruneCacheStore(store, ttlMs));
}

export function invalidatePageCache(targetUrl) {
  const key = buildCacheKey(targetUrl);
  const store = loadCacheStore();
  if (!(key in store)) return;
  delete store[key];
  GM_setValue(CACHE_STORAGE_KEY, store);
}

/** Drop page-cache entries whose category toggle is off. */
export function pruneDisabledCacheCategories(settingsOverride) {
  const store = loadCacheStore();
  let removed = 0;
  for (const [key, entry] of Object.entries(store)) {
    const cat = cacheCategoryForKey(key, entry);
    if (isCacheCategoryEnabled(cat, settingsOverride)) continue;
    delete store[key];
    removed += 1;
  }
  if (removed) {
    GM_setValue(CACHE_STORAGE_KEY, pruneCacheStore(store, getCacheTtlMs()));
  }
  return removed;
}

export function clearPageCache() {
  const store = loadCacheStore();
  const count = Object.keys(store).length;
  GM_setValue(CACHE_STORAGE_KEY, {});
  return count;
}

export function removePageCacheEntry(key) {
  const store = loadCacheStore();
  if (!(key in store)) return false;
  delete store[key];
  GM_setValue(CACHE_STORAGE_KEY, store);
  return true;
}

/**
 * @returns {Array<{key:string,kind:string,label:string,path:string,bytes:number,savedAt:number,ageLabel:string}>}
 */
export function listPageCacheEntries() {
  const ttlMs = getCacheTtlMs();
  const store = pruneCacheStore(loadCacheStore(), ttlMs <= 0 ? Number.POSITIVE_INFINITY : ttlMs);
  return Object.entries(store)
    .map(([key, entry]) => {
      const kind = cacheCategoryForKey(key, entry);
      const desc = describePageCacheEntry(key);
      const savedAt = typeof entry?.savedAt === 'number' ? entry.savedAt : 0;
      return {
        key,
        kind,
        label: desc.label,
        path: desc.path,
        bytes: pageCacheEntryByteSize(key, entry),
        savedAt,
        ageLabel: formatCacheAge(savedAt),
      };
    })
    .sort((a, b) => b.savedAt - a.savedAt);
}

export function describePageCacheEntry(key) {
  const urlPart = cacheUrlFromKey(key);
  try {
    const u = new URL(urlPart);
    const appMatch = u.pathname.match(/\/app\/(\d+)/i);
    const path = `${u.pathname}${u.search}` || '/';
    if (appMatch) {
      return { label: t('cacheEntryApp', { id: appMatch[1] }), path };
    }
    const searchMatch = u.pathname.match(/\/search/i);
    if (searchMatch) {
      const term = u.searchParams.get('term') || u.searchParams.get('q') || '';
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
  const days = Math.floor(hours / 24);
  return t('cacheAgeDays', { count: days });
}

export function formatCacheBytes(n) {
  const bytes = Math.max(0, Number(n) || 0);
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * @param {Record<string, unknown>} [settingsOverride] draft toggles for live meter preview
 */
export function getCacheUsageStats(settingsOverride) {
  const ttlMs = getCacheTtlMs();
  const store = pruneCacheStore(
    loadCacheStore(),
    ttlMs <= 0 ? Number.POSITIVE_INFINITY : ttlMs,
    getCacheMaxEntries()
  );
  const byCat = Object.fromEntries(CACHE_CATEGORIES.map((c) => [c.id, { bytes: 0, count: 0 }]));

  for (const [key, entry] of Object.entries(store)) {
    const cat = cacheCategoryForKey(key, entry);
    const bucket = byCat[cat] || byCat.pages;
    bucket.bytes += pageCacheEntryByteSize(key, entry);
    bucket.count += 1;
  }

  const blocked = getBlockedAppsStorageStats();
  byCat.blocked.bytes += blocked.bytes;
  byCat.blocked.count += blocked.count;

  const usedBytes = CACHE_CATEGORIES.reduce((sum, meta) => sum + (byCat[meta.id]?.bytes || 0), 0);
  const limitBytes = CACHE_SOFT_LIMIT_BYTES;
  const freeBytes = Math.max(0, limitBytes - usedBytes);
  const totalCount = CACHE_CATEGORIES.reduce((sum, meta) => sum + (byCat[meta.id]?.count || 0), 0);

  const categories = CACHE_CATEGORIES.map((meta) => {
    const row = byCat[meta.id] || { bytes: 0, count: 0 };
    return {
      id: meta.id,
      labelKey: meta.labelKey,
      swatch: meta.swatch,
      settingKey: meta.settingKey,
      bytes: row.bytes,
      count: row.count,
      enabled: isCacheCategoryEnabled(meta.id, settingsOverride),
    };
  });

  return {
    freeBytes,
    usedBytes,
    limitBytes,
    totalCount,
    pageCount: (byCat.pages?.count || 0) + (byCat.search?.count || 0),
    categories,
  };
}

export function cacheMeterPct(part, denom) {
  if (!denom) return 0;
  return Math.max(0, Math.min(100, (part / denom) * 100));
}

export function cacheFillPct(stats) {
  const s = stats || getCacheUsageStats();
  return Math.round(cacheMeterPct(s.usedBytes, s.limitBytes));
}

export function cacheFillTone(pct) {
  const n = Math.max(0, Math.min(100, Number(pct) || 0));
  if (n >= 90) return 'high';
  if (n >= 70) return 'mid';
  return 'low';
}

export function buildCacheTabBadgeHtml(stats) {
  const s = stats || getCacheUsageStats();
  const pct = cacheFillPct(s);
  const tone = cacheFillTone(pct);
  const label = t('cacheBarPct', { pct });
  const aria = t('cacheTabFillAria', { pct });
  return `<span class="srbb-panel__tab-badge srbb-panel__tab-badge--${tone}" data-srbb-cache-tab-badge aria-label="${escapeAttr(aria)}">${escapeHtml(label)}</span>`;
}

export function paintCacheTabBadge(root, stats) {
  const badge = root?.querySelector?.('[data-srbb-cache-tab-badge]');
  if (!badge) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = buildCacheTabBadgeHtml(stats).trim();
  const next = wrap.firstElementChild;
  if (next) badge.replaceWith(next);
}

export function buildCacheMeterHtml(stats) {
  const s = stats || getCacheUsageStats();
  const denom = Math.max(s.usedBytes, s.limitBytes, 1);
  const fillPct = cacheFillPct(s);
  const tone = cacheFillTone(fillPct);
  const pctLabel = t('cacheBarPct', { pct: fillPct });
  const freePct = cacheMeterPct(s.freeBytes, denom);

  const activeCats = s.categories.filter((c) => c.bytes > 0);
  const ariaParts = activeCats
    .map((c) => `${t(c.labelKey)} ${formatCacheBytes(c.bytes)}`)
    .concat([`${t('cacheBarFree')} ${formatCacheBytes(s.freeBytes)}`]);
  const aria = t('cacheBarAriaCats', {
    pct: fillPct,
    detail: ariaParts.join(', '),
  });

  const segs = activeCats
    .map((c) => {
      const w = cacheMeterPct(c.bytes, denom);
      if (w <= 0) return '';
      return `<span class="srbb-cache-meter__seg srbb-cache-meter__seg--${escapeAttr(c.swatch)}" style="width:${w}%" title="${escapeAttr(
        `${t(c.labelKey)}: ${formatCacheBytes(c.bytes)}`
      )}"></span>`;
    })
    .join('');

  const legendRows = s.categories
    .map((c) => {
      const label = t(c.labelKey);
      const off = c.enabled ? '' : ' is-off';
      const size = formatCacheBytes(c.bytes);
      const countLabel = t('cacheBarCatCount', { count: c.count });
      const disabledMark = c.enabled
        ? ''
        : `<span class="srbb-cache-meter__off">${escapeHtml(t('cacheCatOff'))}</span>`;
      return `
        <li class="srbb-cache-meter__row${off}">
          <span class="srbb-cache-meter__swatch srbb-cache-meter__swatch--${escapeAttr(c.swatch)}"></span>
          <span class="srbb-cache-meter__name">${escapeHtml(label)}${disabledMark}</span>
          <span class="srbb-cache-meter__meta">
            <span class="srbb-cache-meter__count">${escapeHtml(countLabel)}</span>
            <span class="srbb-cache-meter__size">${escapeHtml(size)}</span>
          </span>
        </li>`;
    })
    .join('');

  const freeRow = `
    <li class="srbb-cache-meter__row srbb-cache-meter__row--free">
      <span class="srbb-cache-meter__swatch srbb-cache-meter__swatch--free"></span>
      <span class="srbb-cache-meter__name">${escapeHtml(t('cacheBarFree'))}</span>
      <span class="srbb-cache-meter__meta">
        <span class="srbb-cache-meter__size">${escapeHtml(formatCacheBytes(s.freeBytes))}</span>
      </span>
    </li>`;

  return `
    <div class="srbb-cache-meter" data-srbb-cache-meter>
      <div class="srbb-cache-meter__head">
        <div class="srbb-cache-meter__pct srbb-cache-meter__pct--${tone}">
          <span class="srbb-cache-meter__pct-value">${escapeHtml(pctLabel)}</span>
          <span class="srbb-cache-meter__pct-caption">${escapeHtml(t('cacheBarFilled'))}</span>
        </div>
        <div class="srbb-cache-meter__used-wrap">
          <span class="srbb-cache-meter__used">${escapeHtml(
            t('cacheBarUsed', {
              used: formatCacheBytes(s.usedBytes),
              limit: formatCacheBytes(s.limitBytes),
            })
          )}</span>
          <span class="srbb-cache-meter__entries">${escapeHtml(
            t('cacheBarEntries', { count: s.totalCount })
          )}</span>
        </div>
      </div>
      <div class="srbb-cache-meter__bar" role="img" aria-label="${escapeAttr(aria)}">
        ${segs}
        <span class="srbb-cache-meter__seg srbb-cache-meter__seg--free" style="width:${freePct}%"></span>
      </div>
      <ul class="srbb-cache-meter__legend">
        ${legendRows}
        ${freeRow}
      </ul>
      <p class="srbb-hint srbb-cache-meter__hint">${escapeHtml(t('cacheBarHint'))}</p>
    </div>
  `;
}

export function paintCacheMeter(root, stats) {
  const s = stats || getCacheUsageStats();
  const current = root?.querySelector?.('[data-srbb-cache-meter]');
  if (current) {
    const wrap = document.createElement('div');
    wrap.innerHTML = buildCacheMeterHtml(s).trim();
    const next = wrap.firstElementChild;
    if (next) current.replaceWith(next);
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
            <span class="srbb-cache-list__kind srbb-cache-list__kind--${escapeAttr(entry.kind)}">${escapeHtml(kindLabel)}</span>
            <span class="srbb-cache-list__label" title="${escapeAttr(entry.path)}">${escapeHtml(entry.label)}</span>
          </div>
          <div class="srbb-cache-list__meta">
            <span>${escapeHtml(formatCacheBytes(entry.bytes))}</span>
            <span>${escapeHtml(entry.ageLabel)}</span>
            <button type="button" class="srbb-btn srbb-btn--ghost srbb-cache-list__remove" data-srbb="cache-remove" data-srbb-cache-key="${escapeAttr(keyAttr)}" title="${escapeAttr(t('cacheRemoveEntry'))}">×</button>
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
  const next = wrap.firstElementChild;
  if (next) current.replaceWith(next);
}
