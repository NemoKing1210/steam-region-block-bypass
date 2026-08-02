import { SUGGEST_RESULT_COUNT } from '../constants.js';
import { state, suggestMetaCache } from '../state.js';
import { t, getSteamStoreLanguage, getStoreCountryCode } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { mapPool } from '../utils/pool.js';
import { buildRequestUrl } from '../url.js';
import { gmRequest } from '../gm.js';
import {
  isBlockedApp,
  touchBlockedAppName,
  prepareSuggestItems,
  buildSuggestBlockedBadgeHtml,
  loadBlockedAppsStore,
} from '../blocked-apps.js';
import { ensureSettingsButton, togglePanel, switchPanelTab } from './panel.js';
import {
  isSearchPage,
  hookHistoryForSearch,
  observeSearchResultsChanges,
  scheduleSearchResultsRefresh,
  scheduleGuestSearchReload,
  findLiveSearchResultsRoot,
} from './search-page.js';
import { probeSuggestBlocked } from './probe.js';

export function initSearchUnblocked() {
  observeSearchHeader();
  hookHistoryForSearch();
  observeSearchResultsChanges();
  syncSearchGuestMode();
  if (isSearchPage()) {
    if (state.settings.searchPageUnblocked) {
      scheduleGuestSearchReload();
    } else {
      scheduleSearchResultsRefresh({ immediate: true });
    }
  }
}

export function observeSearchHeader() {
  const observer = new MutationObserver(() => {
    mountSearchControls();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  mountSearchControls();
}

export function getSearchForm() {
  return document.querySelector('form[role="search"][action*="/search"]');
}

export function getSearchInput(form = getSearchForm()) {
  return form?.querySelector('input[name="term"]') || null;
}

export function getSearchMount(form = getSearchForm()) {
  if (!form) return null;
  return (
    form.closest('div')?.parentElement ||
    form.parentElement ||
    null
  );
}

export function mountSearchControls() {
  const form = getSearchForm();
  if (!form) return;

  const mount = getSearchMount(form);
  if (mount) mount.classList.add('srbb-search-mount');

  ensureSuggestDropdown(mount);
  bindSearchInput(form);
  syncSearchGuestMode();
}

export function ensureSuggestDropdown(mount) {
  if (!mount || document.getElementById('srbb-suggest')) return;

  const panel = document.createElement('div');
  panel.id = 'srbb-suggest';
  panel.className = 'srbb-suggest';
  panel.hidden = true;
  panel.setAttribute('role', 'listbox');
  panel.innerHTML = `
    <div class="srbb-suggest__notice" id="srbb-suggest-notice">
      <div class="srbb-suggest__notice-text">${escapeHtml(t('suggestGuestNotice'))}</div>
      <button type="button" class="srbb-suggest__notice-btn" data-srbb="suggest-settings">${escapeHtml(t('suggestGuestSettings'))}</button>
    </div>
    <div class="srbb-suggest__inner"></div>
    <div class="srbb-suggest__probe" id="srbb-suggest-probe" hidden>
      <div class="srbb-suggest__probe-track"><div class="srbb-suggest__probe-fill" id="srbb-suggest-probe-fill"></div></div>
      <div class="srbb-suggest__probe-label" id="srbb-suggest-probe-label"></div>
    </div>
    <div class="srbb-suggest__stats" id="srbb-suggest-stats" hidden>
      <span class="srbb-suggest__stat srbb-suggest__stat--available" id="srbb-suggest-stat-available"></span>
      <span class="srbb-suggest__stat srbb-suggest__stat--blocked" id="srbb-suggest-stat-blocked"></span>
    </div>
  `;
  mount.appendChild(panel);

  panel.querySelector('[data-srbb="suggest-settings"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openSearchSettings();
  });

  panel.addEventListener('mousedown', (e) => {
    // Keep focus in the search field, but allow the state.settings control to work
    if (e.target.closest('[data-srbb="suggest-settings"]')) return;
    e.preventDefault();
  });
}

export function openSearchSettings() {
  hideSuggestDropdown();
  void ensureSettingsButton().then(() => {
    togglePanel(true);
    switchPanelTab('search');
  });
}

export function hideSuggestStats() {
  const stats = document.getElementById('srbb-suggest-stats');
  if (stats) stats.hidden = true;
}

export function setSuggestStats(available, blocked) {
  const stats = document.getElementById('srbb-suggest-stats');
  const availableEl = document.getElementById('srbb-suggest-stat-available');
  const blockedEl = document.getElementById('srbb-suggest-stat-blocked');
  if (!stats || !availableEl || !blockedEl) return;
  availableEl.textContent = t('suggestStatAvailable', { count: available });
  blockedEl.textContent = t('suggestStatBlocked', { count: blocked });
  stats.hidden = false;
}

export function updateSuggestStats(items) {
  if (!items || !items.length) {
    hideSuggestStats();
    return;
  }
  let blocked = 0;
  for (const item of items) {
    if (item.regionBlocked || isBlockedApp(item.id)) blocked += 1;
  }
  setSuggestStats(items.length - blocked, blocked);
}

export function refreshSuggestStatsFromDom() {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return;
  const rows = [...panel.querySelectorAll('.srbb-suggest__item')];
  if (!rows.length) {
    hideSuggestStats();
    return;
  }
  const blocked = rows.filter((el) => el.classList.contains('srbb-suggest__item--blocked')).length;
  setSuggestStats(rows.length - blocked, blocked);
}

export function updateSuggestProbeProgress(progress) {
  const bar = document.getElementById('srbb-suggest-probe');
  const fill = document.getElementById('srbb-suggest-probe-fill');
  const label = document.getElementById('srbb-suggest-probe-label');
  if (!bar || !fill || !label) return;

  if (!progress || !progress.total) {
    bar.hidden = true;
    return;
  }

  bar.hidden = false;
  const pct = Math.round((progress.done / progress.total) * 100);
  fill.style.width = `${pct}%`;
  label.textContent = t('probeProgress', { done: progress.done, total: progress.total });
}

export function finishSuggestProbe(found) {
  const bar = document.getElementById('srbb-suggest-probe');
  const fill = document.getElementById('srbb-suggest-probe-fill');
  const label = document.getElementById('srbb-suggest-probe-label');
  if (!bar || !fill || !label) return;
  if (found > 0) {
    bar.hidden = false;
    fill.style.width = '100%';
    label.textContent = t('probeFound', { count: found });
    window.setTimeout(() => {
      if (label.textContent === t('probeFound', { count: found })) {
        bar.hidden = true;
      }
    }, 2200);
  } else {
    bar.hidden = true;
  }
}

export function findSuggestItemByAppId(appId) {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return null;
  const id = String(appId);
  return (
    [...panel.querySelectorAll('.srbb-suggest__item[data-srbb-app-id]')].find(
      (el) => el.getAttribute('data-srbb-app-id') === id
    ) || null
  );
}

export function setSuggestItemProbing(appId, probing) {
  const el = findSuggestItemByAppId(appId);
  if (!el) return;
  el.classList.toggle('srbb-suggest__item--probing', !!probing);
  const spin = el.querySelector('.srbb-suggest__probe-spin');
  if (spin) spin.hidden = !probing;
}

export function markSuggestItemBlockedLive(appId) {
  const el = findSuggestItemByAppId(appId);
  if (!el) return;
  el.classList.add('srbb-suggest__item--blocked');
  const titleRow = el.querySelector('.srbb-suggest__title-row');
  if (titleRow && !titleRow.querySelector('.srbb-suggest__blocked-badge')) {
    const badge = document.createElement('span');
    badge.className = 'srbb-suggest__blocked-badge';
    badge.textContent = t('suggestRegionBlocked');
    titleRow.appendChild(badge);
  }
  const id = String(appId);
  if (state.lastSuggestItems.length) {
    state.lastSuggestItems = state.lastSuggestItems.map((item) =>
      String(item.id) === id ? { ...item, regionBlocked: true } : item
    );
    updateSuggestStats(state.lastSuggestItems);
  } else {
    refreshSuggestStatsFromDom();
  }
}

export function clearSearchInput(input) {
  if (!input) return;
  input.value = '';
  if (state.suggestDebounceTimer) {
    window.clearTimeout(state.suggestDebounceTimer);
    state.suggestDebounceTimer = null;
  }
  state.suggestToken += 1;
  hideSuggestDropdown();
}

export function bindSearchInput(form) {
  if (!form || form.dataset.srbbBound === '1') return;
  const input = getSearchInput(form);
  if (!input) return;
  form.dataset.srbbBound = '1';

  input.addEventListener('input', () => {
    handleSuggestInput(input);
  });
  input.addEventListener('focus', () => {
    if (state.settings.searchUnblocked) handleSuggestInput(input, { fromFocus: true });
  });
  input.addEventListener('blur', () => {
    window.setTimeout(() => hideSuggestDropdown(), 150);
  });
  input.addEventListener('keydown', (e) => handleSearchKeydown(e, input));

  form.addEventListener('submit', (e) => {
    if (!state.settings.searchUnblocked) return;
    e.preventDefault();
    e.stopPropagation();
    const term = input.value.trim();
    const url = new URL('https://store.steampowered.com/search/');
    if (term) url.searchParams.set('term', term);
    url.searchParams.set('l', getSteamStoreLanguage());
    url.searchParams.set('cc', getStoreCountryCode().toLowerCase());
    url.searchParams.set('ignore_preferences', '1');
    hideSuggestDropdown();
    location.href = url.toString();
  });
}

export function syncSearchGuestMode() {
  const suggestOn = !!state.settings.searchUnblocked;
  const pageOn = !!state.settings.searchPageUnblocked;
  document.documentElement.classList.toggle('srbb-search-guest', suggestOn);
  document.documentElement.classList.toggle('srbb-search-page-guest', pageOn);
  document.getElementById('srbb-search-toggle')?.remove();

  if (!suggestOn) {
    hideSuggestDropdown();
  }

  if (!pageOn) {
    const hadGuestPage =
      !!state.searchPageLoadedHref ||
      !!state.searchPageDebounceTimer ||
      !!document.getElementById('srbb-search-banner') ||
      !!document.getElementById('srbb-search-skel') ||
      !!document.getElementById('srbb-search-probe');
    if (hadGuestPage) {
      state.searchPageToken += 1;
      state.searchPageLoadedHref = '';
      state.searchPageLoadedStart = -1;
      state.searchResultsFingerprint = '';
      state.searchPageLoading = false;
      if (state.searchPageDebounceTimer) {
        window.clearTimeout(state.searchPageDebounceTimer);
        state.searchPageDebounceTimer = null;
      }
    }
    document.getElementById('srbb-search-banner')?.remove();
    document.getElementById('srbb-search-skel')?.remove();
    document.getElementById('srbb-search-status')?.remove();
    document.getElementById('srbb-search-probe')?.remove();
    const liveRoot = findLiveSearchResultsRoot();
    if (liveRoot) liveRoot.hidden = false;
  }
}

export function buildSuggestUrl(term) {
  const url = new URL('https://store.steampowered.com/search/suggest');
  url.searchParams.set('f', 'jsonfull');
  url.searchParams.set('term', term);
  url.searchParams.set('realm', '1');
  url.searchParams.set('require_type', 'game,software');
  url.searchParams.set('l', getSteamStoreLanguage());
  url.searchParams.set('origin', 'https://store.steampowered.com');
  url.searchParams.set('cc', getStoreCountryCode().toLowerCase());
  return url.toString();
}

export function buildStoreSearchUrl(term) {
  const url = new URL('https://store.steampowered.com/api/storesearch/');
  url.searchParams.set('term', term);
  url.searchParams.set('l', getSteamStoreLanguage());
  url.searchParams.set('cc', getStoreCountryCode().toLowerCase());
  return url.toString();
}

export function buildSearchResultsMetaUrl(term, count = SUGGEST_RESULT_COUNT) {
  const url = new URL('https://store.steampowered.com/search/results/');
  url.searchParams.set('term', term);
  url.searchParams.set('count', String(count));
  url.searchParams.set('start', '0');
  url.searchParams.set('infinite', '1');
  url.searchParams.set('ignore_preferences', '1');
  url.searchParams.set('l', getSteamStoreLanguage());
  url.searchParams.set('cc', getStoreCountryCode().toLowerCase());
  return url.toString();
}

export function parseReviewTooltip(tooltipHtml) {
  const text = String(tooltipHtml || '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"');
  const parts = text
    .split(/<br\s*\/?>/i)
    .map((part) => part.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
  const summary = parts[0] || '';
  const detail = parts[1] || '';
  const percentMatch = detail.match(/(\d+)\s*%/);
  return {
    summary,
    percent: percentMatch ? percentMatch[1] : '',
    detail: detail || summary,
  };
}

export function emptySuggestItemFields() {
  return {
    priceLabel: '',
    priceOriginal: '',
    discountPct: 0,
    isFree: false,
    platforms: null,
    metascore: '',
    controllerSupport: '',
    releaseDate: '',
    reviewSummary: '',
    reviewPercent: '',
    reviewTone: '',
    reviewDetail: '',
  };
}

export function parseSearchResultRowType(row) {
  const href = String(row.getAttribute('href') || '');
  if (/\/bundle\//i.test(href) || row.hasAttribute('data-ds-bundleid')) return 'bundle';
  if (/\/sub\//i.test(href) || row.hasAttribute('data-ds-packageid')) return 'bundle';
  if (row.hasAttribute('data-ds-appid')) return 'game';
  return 'app';
}

export function parseSearchResultRowPrice(row) {
  let priceLabel = '';
  let priceOriginal = '';
  let discountPct = 0;
  let isFree = false;

  const discountBlock = row.querySelector('.discount_block, .search_discount_block');
  const finalEl = row.querySelector('.discount_final_price, .search_price');
  const originalEl = row.querySelector('.discount_original_price');
  priceLabel = (finalEl?.textContent || '').replace(/\s+/g, ' ').trim();
  priceOriginal = (originalEl?.textContent || '').replace(/\s+/g, ' ').trim();

  if (discountBlock) {
    const rawDiscount = discountBlock.getAttribute('data-discount');
    const parsedDiscount = Number(rawDiscount);
    if (Number.isFinite(parsedDiscount) && parsedDiscount > 0) {
      discountPct = parsedDiscount;
    }
    const priceFinal = Number(discountBlock.getAttribute('data-price-final'));
    if (Number.isFinite(priceFinal) && priceFinal === 0) {
      isFree = true;
    }
  }

  if (!priceLabel) {
    const freeEl = row.querySelector('.search_price.free, .discount_final_price.free');
    if (freeEl) {
      priceLabel = (freeEl.textContent || '').replace(/\s+/g, ' ').trim() || t('suggestFree');
      isFree = true;
    }
  }

  if (priceLabel && /free/i.test(priceLabel)) {
    isFree = true;
    priceLabel = t('suggestFree');
  }

  return { priceLabel, priceOriginal, discountPct, isFree };
}

export function parseSearchResultRowPlatforms(row) {
  const platRoot = row.querySelector('.search_platforms');
  if (!platRoot) return null;
  const platforms = {
    windows: !!platRoot.querySelector('.platform_img.win, .win'),
    mac: !!platRoot.querySelector('.platform_img.mac, .mac'),
    linux: !!platRoot.querySelector('.platform_img.linux, .linux'),
  };
  if (!platforms.windows && !platforms.mac && !platforms.linux) return null;
  return platforms;
}

export function parseSearchResultRowReviews(row) {
  const reviewEl = row.querySelector('.search_review_summary');
  if (!reviewEl) {
    return {
      reviewSummary: '',
      reviewPercent: '',
      reviewTone: '',
      reviewDetail: '',
    };
  }

  let reviewTone = '';
  if (reviewEl.classList.contains('positive')) reviewTone = 'positive';
  else if (reviewEl.classList.contains('mixed')) reviewTone = 'mixed';
  else if (reviewEl.classList.contains('negative')) reviewTone = 'negative';

  const parsed = parseReviewTooltip(reviewEl.getAttribute('data-tooltip-html') || '');
  return {
    reviewSummary: parsed.summary,
    reviewPercent: parsed.percent,
    reviewTone,
    reviewDetail: parsed.detail,
  };
}

export function parseSearchResultItems(html) {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  const items = [];
  const seen = Object.create(null);

  doc.querySelectorAll('a.search_result_row[data-ds-appid]').forEach((row) => {
    const rawId = String(row.getAttribute('data-ds-appid') || '')
      .split(',')[0]
      .trim();
    if (!rawId || seen[rawId]) return;
    seen[rawId] = true;

    const name = (row.querySelector('.title')?.textContent || '').trim();
    if (!name) return;

    const img = row.querySelector('.search_capsule img, img')?.getAttribute('src') || '';
    const price = parseSearchResultRowPrice(row);
    const reviews = parseSearchResultRowReviews(row);

    items.push({
      id: rawId,
      name,
      type: parseSearchResultRowType(row),
      img,
      ...emptySuggestItemFields(),
      ...price,
      platforms: parseSearchResultRowPlatforms(row),
      releaseDate: (row.querySelector('.search_released')?.textContent || '').trim(),
      ...reviews,
    });
  });

  return items;
}

export async function fetchSearchResultItems(term) {
  const requestUrl = buildRequestUrl(buildSearchResultsMetaUrl(term, SUGGEST_RESULT_COUNT));
  const response = await gmRequest(requestUrl);
  if (response.status < 200 || response.status >= 400) {
    throw new Error(`HTTP ${response.status}`);
  }
  const parsed = parseJsonResponse(response.responseText || '');
  const html =
    parsed && typeof parsed === 'object' && typeof parsed.results_html === 'string'
      ? parsed.results_html
      : response.responseText || '';
  return parseSearchResultItems(html);
}

export function mergeSuggestStoreExtras(items, storeItems) {
  if (!storeItems?.length || !items.length) return items;
  const byId = Object.create(null);
  storeItems.forEach((item) => {
    byId[item.id] = item;
  });
  return items.map((item) => {
    const extra = byId[item.id];
    if (!extra) return item;
    return {
      ...item,
      type: item.type || extra.type,
      img: item.img || extra.img,
      priceLabel: extra.priceLabel || item.priceLabel,
      priceOriginal: extra.priceOriginal || item.priceOriginal,
      discountPct: extra.discountPct || item.discountPct,
      isFree: extra.isFree || item.isFree,
      platforms: extra.platforms || item.platforms,
      metascore: extra.metascore || item.metascore,
      controllerSupport: extra.controllerSupport || item.controllerSupport,
    };
  });
}

export function mergeSuggestSearchFields(items, searchItems) {
  if (!searchItems?.length || !items.length) return items;
  const byId = Object.create(null);
  searchItems.forEach((item) => {
    byId[item.id] = item;
  });
  return items.map((item) => {
    const extra = byId[item.id];
    if (!extra) return item;
    return {
      ...item,
      type: extra.type || item.type,
      img: item.img || extra.img,
      priceLabel: item.priceLabel || extra.priceLabel,
      priceOriginal: item.priceOriginal || extra.priceOriginal,
      discountPct: item.discountPct || extra.discountPct,
      isFree: item.isFree || extra.isFree,
      platforms: item.platforms || extra.platforms,
      releaseDate: extra.releaseDate || item.releaseDate || '',
      reviewSummary: extra.reviewSummary || item.reviewSummary || '',
      reviewPercent: extra.reviewPercent || item.reviewPercent || '',
      reviewTone: extra.reviewTone || item.reviewTone || '',
      reviewDetail: extra.reviewDetail || item.reviewDetail || '',
    };
  });
}

export function mergeSuggestItemMeta(item, extra) {
  if (!extra) return item;
  return {
    ...item,
    name: item.name || extra.name || item.name,
    type: item.type || extra.type,
    img: item.img || extra.img,
    priceLabel: item.priceLabel || extra.priceLabel,
    priceOriginal: item.priceOriginal || extra.priceOriginal,
    discountPct: item.discountPct || extra.discountPct,
    isFree: item.isFree || extra.isFree,
    platforms: item.platforms || extra.platforms,
    metascore: item.metascore || extra.metascore,
    controllerSupport: item.controllerSupport || extra.controllerSupport,
    releaseDate: item.releaseDate || extra.releaseDate || '',
    reviewSummary: item.reviewSummary || extra.reviewSummary || '',
    reviewPercent: item.reviewPercent || extra.reviewPercent || '',
    reviewTone: item.reviewTone || extra.reviewTone || '',
    reviewDetail: item.reviewDetail || extra.reviewDetail || '',
  };
}

export function isSuggestItemSparse(item) {
  if (!item?.id) return false;
  if (String(item.type || '').toLowerCase() === 'bundle') return false;
  return (
    (!item.priceLabel && !item.isFree) ||
    !item.releaseDate ||
    !item.reviewSummary ||
    !item.platforms
  );
}

export function buildAppDetailsUrl(appId) {
  const url = new URL('https://store.steampowered.com/api/appdetails');
  url.searchParams.set('appids', String(appId));
  url.searchParams.set('l', getSteamStoreLanguage());
  url.searchParams.set('cc', getStoreCountryCode().toLowerCase());
  return url.toString();
}

export function buildAppReviewsUrl(appId) {
  const url = new URL(`https://store.steampowered.com/appreviews/${appId}`);
  url.searchParams.set('json', '1');
  url.searchParams.set('language', getSteamStoreLanguage());
  url.searchParams.set('purchase_type', 'all');
  url.searchParams.set('filter_offtopic_activity', '0');
  url.searchParams.set('num_per_page', '0');
  return url.toString();
}

export function suggestMetaCacheKey(appId) {
  return `${appId}:${getStoreCountryCode()}:${getSteamStoreLanguage()}`;
}

export function formatReleaseDateFromAppDetails(release) {
  if (!release || typeof release !== 'object') return '';
  const date = String(release.date || '').trim();
  if (date) return date;
  if (release.coming_soon) return t('suggestComingSoon');
  return '';
}

export function mapAppDetailsToSuggestFields(appId, data) {
  if (!data || typeof data !== 'object') return null;

  const platforms =
    data.platforms && typeof data.platforms === 'object'
      ? {
          windows: !!data.platforms.windows,
          mac: !!data.platforms.mac,
          linux: !!data.platforms.linux,
        }
      : null;

  let priceLabel = '';
  let priceOriginal = '';
  let discountPct = 0;
  let isFree = !!data.is_free;
  const price = data.price_overview;
  if (price && typeof price === 'object') {
    if (typeof price.final_formatted === 'string' && price.final_formatted.trim()) {
      priceLabel = price.final_formatted.trim();
    } else if (typeof price.final === 'number') {
      priceLabel = formatMoneyAmount(price.final, price.currency || '');
    }
    if (typeof price.initial_formatted === 'string' && price.initial_formatted.trim()) {
      priceOriginal = price.initial_formatted.trim();
    } else if (typeof price.initial === 'number' && price.initial > (price.final || 0)) {
      priceOriginal = formatMoneyAmount(price.initial, price.currency || '');
    }
    if (typeof price.discount_percent === 'number' && price.discount_percent > 0) {
      discountPct = price.discount_percent;
    }
    if (typeof price.final === 'number' && price.final === 0) {
      isFree = true;
      priceLabel = priceLabel || t('suggestFree');
    }
  } else if (isFree) {
    priceLabel = t('suggestFree');
  }

  const img =
    data.capsule_image ||
    data.capsule_imagev5 ||
    data.header_image ||
    buildBlockedAppCapsule(appId);

  const metascore =
    data.metacritic && data.metacritic.score != null ? String(data.metacritic.score) : '';

  return {
    id: String(appId),
    name: String(data.name || '').trim(),
    type: String(data.type || 'game').toLowerCase(),
    img,
    priceLabel,
    priceOriginal,
    discountPct,
    isFree,
    platforms,
    metascore,
    controllerSupport: String(data.controller_support || '').toLowerCase(),
    releaseDate: formatReleaseDateFromAppDetails(data.release_date),
    reviewSummary: '',
    reviewPercent: '',
    reviewTone: '',
    reviewDetail: '',
  };
}

export function mapAppReviewsToSuggestFields(parsed) {
  const summary = parsed && parsed.query_summary;
  if (!summary || !summary.total_reviews) {
    return {
      reviewSummary: '',
      reviewPercent: '',
      reviewTone: '',
      reviewDetail: '',
    };
  }

  const total = Number(summary.total_reviews) || 0;
  const positive = Number(summary.total_positive) || 0;
  const percent = total > 0 ? String(Math.round((positive / total) * 100)) : '';
  const reviewSummary = String(summary.review_score_desc || '').trim();
  const score = Number(summary.review_score);
  let reviewTone = '';
  if (Number.isFinite(score) && score > 0) {
    if (score >= 6) reviewTone = 'positive';
    else if (score === 5) reviewTone = 'mixed';
    else reviewTone = 'negative';
  }

  const reviewDetail = percent
    ? `${percent}% of the ${total.toLocaleString()} user reviews for this game are positive.`
    : reviewSummary;

  return {
    reviewSummary,
    reviewPercent: percent,
    reviewTone,
    reviewDetail,
  };
}

export async function fetchSuggestItemMeta(appId) {
  const id = String(appId);
  if (!/^\d+$/.test(id)) return null;

  const cacheKey = suggestMetaCacheKey(id);
  if (suggestMetaCache.has(cacheKey)) {
    const cached = suggestMetaCache.get(cacheKey);
    // Incomplete reviews-only entries are not cached; null means hard miss.
    if (cached === null || (cached && cached.releaseDate)) return cached;
    if (cached && (cached.priceLabel || cached.isFree || cached.platforms)) return cached;
  }

  try {
    const [detailsParsed, reviewsParsed] = await Promise.all([
      requestGuestJson(buildAppDetailsUrl(id)).catch(() => null),
      requestGuestJson(buildAppReviewsUrl(id)).catch(() => null),
    ]);

    const entry = detailsParsed && detailsParsed[id];
    const fromDetails =
      entry && entry.success && entry.data ? mapAppDetailsToSuggestFields(id, entry.data) : null;
    const fromReviews = mapAppReviewsToSuggestFields(reviewsParsed);

    if (!fromDetails && !fromReviews.reviewSummary) {
      suggestMetaCache.set(cacheKey, null);
      return null;
    }

    const merged = {
      ...(fromDetails || {
        id,
        name: '',
        type: 'game',
        img: buildBlockedAppCapsule(id),
        ...emptySuggestItemFields(),
      }),
      ...fromReviews,
    };
    // Only cache when appdetails succeeded — otherwise retry next time for release/price.
    if (fromDetails) suggestMetaCache.set(cacheKey, merged);
    return merged;
  } catch {
    suggestMetaCache.set(cacheKey, null);
    return null;
  }
}

export async function enrichSparseSuggestItems(items, { isCancelled } = {}) {
  if (!items?.length) return items || [];

  const targets = items
    .filter(isSuggestItemSparse)
    .sort((a, b) => {
      const rank = (item) =>
        (!item.releaseDate ? 4 : 0) +
        (isBlockedApp(item.id) ? 2 : 0) +
        (!item.priceLabel && !item.isFree ? 1 : 0);
      return rank(b) - rank(a);
    })
    .slice(0, 12);
  if (!targets.length) return items;

  const byId = Object.create(null);
  await mapPool(targets, 3, async (item) => {
    if (isCancelled?.()) return;
    const meta = await fetchSuggestItemMeta(item.id);
    if (meta) byId[item.id] = meta;
  });

  if (isCancelled?.()) return items;

  return items.map((item) => mergeSuggestItemMeta(item, byId[item.id]));
}

export function unionSuggestItems(...lists) {
  const seen = Object.create(null);
  const out = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (!item?.id || seen[item.id]) continue;
      seen[item.id] = true;
      out.push(item);
    }
  }
  return out;
}

export function buildBlockedAppCapsule(appId) {
  return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/capsule_231x87.jpg`;
}

export function collectBlockedSuggestMatches(term) {
  if (!state.settings.markBlockedInSearch && !state.settings.rememberBlockedApps) return [];
  const q = String(term || '')
    .trim()
    .toLowerCase();
  if (q.length < 2) return [];

  const store = loadBlockedAppsStore();
  const matches = [];
  for (const [id, entry] of Object.entries(store)) {
    const name = String(entry && entry.name ? entry.name : '').trim();
    const hay = `${name} ${id}`.toLowerCase();
    if (!hay.includes(q)) continue;
    matches.push({
      id: String(id),
      name: name || `App ${id}`,
      type: 'game',
      img: buildBlockedAppCapsule(id),
      ...emptySuggestItemFields(),
    });
  }
  return matches;
}

export function trimSuggestItems(items, mustKeepIds) {
  if (items.length <= SUGGEST_RESULT_COUNT) return items;
  const mustKeep = mustKeepIds instanceof Set ? mustKeepIds : new Set(mustKeepIds || []);
  const kept = items.slice(0, SUGGEST_RESULT_COUNT);
  const keptIds = new Set(kept.map((item) => item.id));
  for (const item of items.slice(SUGGEST_RESULT_COUNT)) {
    if (!mustKeep.has(item.id) || keptIds.has(item.id)) continue;
    kept.push(item);
    keptIds.add(item.id);
  }
  return kept;
}

export function parseJsonResponse(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;
  const jsonStart = trimmed.search(/[\[{]/);
  if (jsonStart < 0) return null;
  try {
    return JSON.parse(trimmed.slice(jsonStart));
  } catch {
    return null;
  }
}

export function formatMoneyAmount(amount, currency) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '';
  const value = amount / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value} ${currency || ''}`.trim();
  }
}

export function getSuggestTypeLabel(type) {
  const key = {
    game: 'suggestTypeGame',
    app: 'suggestTypeApp',
    software: 'suggestTypeSoftware',
    dlc: 'suggestTypeDlc',
    bundle: 'suggestTypeBundle',
  }[String(type || '').toLowerCase()];
  return key ? t(key) : String(type || '');
}

export function normalizeSuggestItem(item) {
  if (!item || typeof item !== 'object') return null;
  const id = item.id ?? item.appid;
  const name = item.name || '';
  if (!id || !name) return null;

  const type = String(item.type || 'game').toLowerCase();
  const img = item.small_cap || item.img || item.tiny_image || '';

  const platforms =
    item.platforms && typeof item.platforms === 'object'
      ? {
          windows: !!item.platforms.windows,
          mac: !!item.platforms.mac,
          linux: !!item.platforms.linux,
        }
      : null;

  const metascore = String(item.metascore || '').trim();
  const controllerSupport = String(item.controller_support || '').toLowerCase();

  let priceLabel = '';
  let priceOriginal = '';
  let discountPct = 0;
  let isFree = false;

  const price = item.price;
  if (price && typeof price === 'object') {
    const currency = price.currency || '';
    const final = price.final;
    const initial = price.initial;
    if (typeof final === 'number') {
      if (final === 0 && (!initial || initial === 0)) {
        isFree = true;
        priceLabel = t('suggestFree');
      } else {
        priceLabel = formatMoneyAmount(final, currency);
        if (typeof initial === 'number' && initial > final && initial > 0) {
          priceOriginal = formatMoneyAmount(initial, currency);
          discountPct = Math.round((1 - final / initial) * 100);
        }
      }
    }
  } else if (typeof price === 'string' && price.trim()) {
    priceLabel = price.trim();
    if (/free/i.test(priceLabel)) isFree = true;
  }

  return {
    id: String(id),
    name,
    type,
    img,
    priceLabel,
    priceOriginal,
    discountPct,
    isFree,
    platforms,
    metascore,
    controllerSupport,
    releaseDate: '',
    reviewSummary: '',
    reviewPercent: '',
    reviewTone: '',
    reviewDetail: '',
  };
}

export function normalizeSuggestItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeSuggestItem).filter(Boolean);
}

export async function requestGuestJson(targetUrl) {
  const requestUrl = buildRequestUrl(targetUrl);
  const response = await gmRequest(requestUrl);
  if (response.status < 200 || response.status >= 400) {
    throw new Error(`HTTP ${response.status}`);
  }
  const parsed = parseJsonResponse(response.responseText || '');
  if (parsed === null) {
    throw new Error(t('noContent'));
  }
  return parsed;
}

export function buildAppHref(appId, name = '') {
  const slug =
    String(name)
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_') || 'app';
  return `https://store.steampowered.com/app/${appId}/${slug}/`;
}

export function handleSuggestInput(input, options = {}) {
  if (!state.settings.searchUnblocked) return;
  const term = input.value.trim();
  if (!term) {
    if (state.suggestDebounceTimer) {
      window.clearTimeout(state.suggestDebounceTimer);
      state.suggestDebounceTimer = null;
    }
    state.suggestToken += 1;
    if (options.fromFocus) {
      showSuggestMessage(t('suggestEmpty'));
      showSuggestDropdown();
    } else {
      hideSuggestDropdown();
    }
    return;
  }

  if (state.suggestDebounceTimer) window.clearTimeout(state.suggestDebounceTimer);
  state.suggestDebounceTimer = window.setTimeout(() => {
    fetchGuestSuggestions(term);
  }, 550);
}

export async function fetchGuestSuggestions(term) {
  const token = ++state.suggestToken;
  updateSuggestProbeProgress(null);
  showSuggestSkeleton(Math.min(8, SUGGEST_RESULT_COUNT));

  try {
    let items = [];
    let storeItems = [];
    let searchItems = [];
    const blockedMatches = collectBlockedSuggestMatches(term);

    const [storeParsed, searchParsed] = await Promise.all([
      requestGuestJson(buildStoreSearchUrl(term)).catch(() => null),
      fetchSearchResultItems(term).catch(() => null),
    ]);
    if (token !== state.suggestToken) return;

    if (storeParsed) {
      storeItems = normalizeSuggestItems(storeParsed.items || []);
    }
    if (Array.isArray(searchParsed)) {
      searchItems = searchParsed;
    }

    // storesearch ranking keeps region-restricted titles in natural relevance order;
    // /search/results fills the rest (Steam often hides unavailable apps from that HTML)
    items = unionSuggestItems(storeItems, searchItems, blockedMatches);

    if (!items.length) {
      const suggestParsed = await requestGuestJson(buildSuggestUrl(term));
      if (token !== state.suggestToken) return;
      items = normalizeSuggestItems(
        Array.isArray(suggestParsed) ? suggestParsed : suggestParsed.items
      );
      items = unionSuggestItems(items, blockedMatches);
    }

    if (!items.length) {
      showSuggestMessage(t('suggestNoResults'));
      return;
    }

    items = mergeSuggestSearchFields(items, searchItems);
    items = mergeSuggestStoreExtras(items, storeItems);
    items = await enrichSparseSuggestItems(items, {
      isCancelled: () => token !== state.suggestToken,
    });
    if (token !== state.suggestToken) return;
    items = trimSuggestItems(
      items,
      blockedMatches.map((item) => item.id).concat(storeItems.map((item) => item.id))
    );

    items.forEach((item) => {
      if (isBlockedApp(item.id)) touchBlockedAppName(item.id, item.name);
    });
    state.lastSuggestItems = items;
    renderSuggestItems(prepareSuggestItems(items));
    void probeSuggestBlocked(items, token);
  } catch (err) {
    if (token !== state.suggestToken) return;
    showSuggestMessage(
      t('suggestFailed', { error: err && err.message ? err.message : String(err) })
    );
  }
}

export function buildSuggestPriceHtml(item) {
  if (!item.priceLabel && !item.isFree) return '';
  const parts = [];
  if (item.discountPct > 0) {
    parts.push(`<span class="srbb-suggest__discount">-${item.discountPct}%</span>`);
  }
  if (item.priceOriginal) {
    parts.push(`<span class="srbb-suggest__price-old">${escapeHtml(item.priceOriginal)}</span>`);
  }
  if (item.priceLabel) {
    parts.push(
      `<span class="srbb-suggest__price${item.isFree ? ' srbb-suggest__price--free' : ''}">${escapeHtml(item.priceLabel)}</span>`
    );
  }
  return `<div class="srbb-suggest__prices">${parts.join('')}</div>`;
}

export function buildSuggestPlatformsHtml(item) {
  if (!item.platforms) return '';
  const chips = [];
  if (item.platforms.windows) {
    chips.push('<span class="srbb-suggest__plat" title="Windows">Win</span>');
  }
  if (item.platforms.mac) {
    chips.push('<span class="srbb-suggest__plat" title="macOS">Mac</span>');
  }
  if (item.platforms.linux) {
    chips.push('<span class="srbb-suggest__plat" title="Linux">Linux</span>');
  }
  if (!chips.length) return '';
  return `<div class="srbb-suggest__platforms">${chips.join('')}</div>`;
}

export function buildSuggestFactsHtml(item) {
  const parts = [];
  if (item.reviewSummary) {
    const toneClass = item.reviewTone ? ` srbb-suggest__review--${item.reviewTone}` : '';
    const label =
      item.reviewPercent
        ? t('suggestReviews', { summary: item.reviewSummary, percent: item.reviewPercent })
        : item.reviewSummary;
    const title = item.reviewDetail || item.reviewSummary;
    parts.push(
      `<span class="srbb-suggest__review${toneClass}" title="${escapeHtml(title)}">${escapeHtml(label)}</span>`
    );
  }
  if (!parts.length) return '';
  return `<div class="srbb-suggest__facts">${parts.join('')}</div>`;
}

export function buildSuggestDetailsHtml(item) {
  return `
    <div class="srbb-suggest__details">
      ${buildSuggestPriceHtml(item)}
      ${
        item.releaseDate
          ? `<span class="srbb-suggest__release">${escapeHtml(item.releaseDate)}</span>`
          : ''
      }
      ${buildSuggestPlatformsHtml(item)}
    </div>
  `;
}

export function buildSuggestExtrasHtml(item) {
  const chips = [];
  const typeLabel = getSuggestTypeLabel(item.type);
  if (typeLabel) {
    chips.push(`<span class="srbb-suggest__chip">${escapeHtml(typeLabel)}</span>`);
  }
  if (item.metascore) {
    chips.push(
      `<span class="srbb-suggest__chip srbb-suggest__chip--score">${escapeHtml(t('suggestMetascore', { score: item.metascore }))}</span>`
    );
  }
  if (item.controllerSupport === 'full') {
    chips.push(
      `<span class="srbb-suggest__chip">${escapeHtml(t('suggestControllerFull'))}</span>`
    );
  } else if (item.controllerSupport === 'partial') {
    chips.push(
      `<span class="srbb-suggest__chip">${escapeHtml(t('suggestControllerPartial'))}</span>`
    );
  }
  if (!chips.length) return '';
  return `<div class="srbb-suggest__chips">${chips.join('')}</div>`;
}

export function renderSuggestItemHtml(item, index) {
  const href = buildAppHref(item.id, item.name);
  const img = item.img || '';
  const blockedClass = item.regionBlocked ? ' srbb-suggest__item--blocked' : '';
  return `
    <a class="srbb-suggest__item${blockedClass}" role="option" data-srbb-suggest-index="${index}" data-srbb-app-id="${escapeHtml(String(item.id))}" href="${escapeHtml(href)}">
      ${img ? `<img class="srbb-suggest__img" alt="" src="${escapeHtml(img)}" loading="lazy" />` : ''}
      <div class="srbb-suggest__meta">
        <div class="srbb-suggest__title-row">
          <div class="srbb-suggest__name">${escapeHtml(item.name)}</div>
          <span class="srbb-suggest__probe-spin" hidden aria-hidden="true"></span>
          ${buildSuggestBlockedBadgeHtml(item)}
        </div>
        ${buildSuggestDetailsHtml(item)}
        ${buildSuggestFactsHtml(item)}
        <div class="srbb-suggest__footer">
          ${buildSuggestExtrasHtml(item)}
          <span class="srbb-suggest__id">${escapeHtml(t('suggestAppId', { id: item.id }))}</span>
        </div>
      </div>
    </a>
  `;
}

export function renderSuggestItems(items) {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return;

  state.activeSuggestIndex = -1;
  const inner = panel.querySelector('.srbb-suggest__inner');
  if (!inner) return;

  panel.removeAttribute('aria-busy');
  panel.removeAttribute('aria-label');
  inner.innerHTML = items.map((item, index) => renderSuggestItemHtml(item, index)).join('');

  inner.querySelectorAll('.srbb-suggest__item').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      setActiveSuggestItem(Number(el.dataset.srbbSuggestIndex));
    });
  });

  updateSuggestStats(items);
  showSuggestDropdown();
}

export function showSuggestSkeleton(count = 5) {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return;
  const inner = panel.querySelector('.srbb-suggest__inner');
  if (!inner) return;
  state.activeSuggestIndex = -1;
  const rows = Array.from({ length: count }, () => `
    <div class="srbb-suggest__skel" aria-hidden="true">
      <div class="srbb-skel srbb-suggest__skel-img"></div>
      <div class="srbb-suggest__skel-meta">
        <div class="srbb-skel srbb-suggest__skel-line srbb-suggest__skel-line--title"></div>
        <div class="srbb-skel srbb-suggest__skel-line srbb-suggest__skel-line--sub"></div>
        <div class="srbb-skel srbb-suggest__skel-line srbb-suggest__skel-line--facts"></div>
        <div class="srbb-suggest__skel-chips">
          <div class="srbb-skel srbb-suggest__skel-chip"></div>
          <div class="srbb-skel srbb-suggest__skel-chip"></div>
          <div class="srbb-skel srbb-suggest__skel-chip srbb-suggest__skel-chip--short"></div>
        </div>
      </div>
    </div>
  `).join('');
  inner.innerHTML = rows;
  panel.setAttribute('aria-busy', 'true');
  panel.setAttribute('aria-label', t('suggestLoading'));
  hideSuggestStats();
  showSuggestDropdown();
}

export function showSuggestMessage(message) {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return;
  const inner = panel.querySelector('.srbb-suggest__inner');
  if (!inner) return;
  state.activeSuggestIndex = -1;
  panel.removeAttribute('aria-busy');
  panel.removeAttribute('aria-label');
  inner.innerHTML = `<div class="srbb-suggest__message">${escapeHtml(message)}</div>`;
  hideSuggestStats();
  showSuggestDropdown();
}

export function showSuggestDropdown() {
  const panel = document.getElementById('srbb-suggest');
  if (!panel || !state.settings.searchUnblocked) return;
  panel.hidden = false;
  panel.classList.add('is-open');
}

export function hideSuggestDropdown() {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return;
  panel.hidden = true;
  panel.classList.remove('is-open');
  panel.removeAttribute('aria-busy');
  panel.removeAttribute('aria-label');
  state.activeSuggestIndex = -1;
  panel.querySelectorAll('.srbb-suggest__item.is-active').forEach((el) => {
    el.classList.remove('is-active');
  });
  updateSuggestProbeProgress(null);
}

export function setActiveSuggestItem(index) {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return;
  const items = [...panel.querySelectorAll('.srbb-suggest__item')];
  if (!items.length) return;
  state.activeSuggestIndex = Math.max(0, Math.min(index, items.length - 1));
  items.forEach((el, i) => el.classList.toggle('is-active', i === state.activeSuggestIndex));
}

export function handleSearchKeydown(e, input) {
  if (e.key === 'Escape') {
    const panel = document.getElementById('srbb-suggest');
    const suggestOpen = !!(panel && !panel.hidden);
    if (suggestOpen) {
      e.preventDefault();
      hideSuggestDropdown();
      return;
    }
    if (input.value) {
      e.preventDefault();
      clearSearchInput(input);
      return;
    }
    input.blur();
    return;
  }

  if (!state.settings.searchUnblocked) return;
  const panel = document.getElementById('srbb-suggest');
  if (!panel || panel.hidden) return;

  const items = [...panel.querySelectorAll('.srbb-suggest__item')];
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setActiveSuggestItem(state.activeSuggestIndex + 1);
    showSuggestDropdown();
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    setActiveSuggestItem(state.activeSuggestIndex <= 0 ? items.length - 1 : state.activeSuggestIndex - 1);
    showSuggestDropdown();
    return;
  }
  if (e.key === 'Enter' && state.activeSuggestIndex >= 0) {
    e.preventDefault();
    const target = items[state.activeSuggestIndex];
    if (target?.href) location.href = target.href;
  }
}
