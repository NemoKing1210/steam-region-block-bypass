import { state } from '../state.js';
import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { buildTargetUrl, buildRequestUrl, getSearchStartOffset } from '../url.js';
import { gmRequest } from '../gm.js';
import { readPageCache, writePageCache, invalidatePageCache } from '../cache.js';
import { getContentMount } from '../inject.js';
import {
  getBlockedAppsCount,
} from '../blocked-apps.js';
import { getAppIdFromUrl } from '../detect.js';
import {
  buildStoreSearchUrl,
  normalizeSuggestItems,
  unionSuggestItems,
  enrichSparseSuggestItems,
  requestGuestJson,
  buildAppHref,
  openSearchSettings,
  collectBlockedSuggestMatches,
  buildBlockedAppCapsule,
} from './suggest.js';
import {
  decorateBlockedSearchResults,
  collectSearchResultApps,
  ensureSearchProbeStatus,
  updateSearchProbeProgress,
  finishSearchProbe,
  probeSearchPageBlocked,
  shouldProbeBlockedScope,
} from './probe.js';

export function isSearchPage(url = location.href) {
  try {
    const path = new URL(url, location.origin).pathname.replace(/\/+$/, '') || '/';
    return path === '/search';
  } catch {
    return false;
  }
}

export function hookHistoryForSearch() {
  if (state.historyHooked) return;
  state.historyHooked = true;

  const onUrlChange = () => {
    if (!isSearchPage()) return;
    if (state.settings.searchPageUnblocked) {
      scheduleGuestSearchReload();
    } else {
      scheduleSearchResultsRefresh();
    }
  };

  const wrap = (fn) =>
    function (...args) {
      const ret = fn.apply(this, args);
      onUrlChange();
      return ret;
    };

  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
  window.addEventListener('popstate', onUrlChange);
}

export function getSearchResultsFingerprint() {
  const ids = collectSearchResultApps(document)
    .map((app) => app.id)
    .join(',');
  return `${location.href}#${ids}`;
}

export function observeSearchResultsChanges() {
  if (state.searchResultsObserverHooked) return;
  state.searchResultsObserverHooked = true;

  const isSearchResultsMutation = (mutation) => {
    const target = mutation.target;
    if (!(target instanceof Element)) return false;
    if (
      target.id === 'search_resultsRows' ||
      target.id === 'search_result_container' ||
      target.id === 'search_results' ||
      target.classList?.contains('search_pagination') ||
      target.closest?.(
        '#search_resultsRows, #search_result_container, #search_results, .search_pagination'
      )
    ) {
      return true;
    }
    for (const node of mutation.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (
        node.id === 'search_resultsRows' ||
        node.id === 'search_result_container' ||
        node.classList?.contains('search_result_row') ||
        node.classList?.contains('search_pagination') ||
        node.querySelector?.(
          '#search_resultsRows, .search_result_row, .search_pagination'
        )
      ) {
        return true;
      }
    }
    return false;
  };

  const observer = new MutationObserver((mutations) => {
    if (!isSearchPage() || state.searchPageLoading) return;
    if (!mutations.some(isSearchResultsMutation)) return;
    scheduleSearchResultsRefresh();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export function scheduleSearchResultsRefresh(options = {}) {
  if (!isSearchPage()) return;
  if (state.searchResultsRefreshTimer) window.clearTimeout(state.searchResultsRefreshTimer);
  state.searchResultsRefreshTimer = window.setTimeout(() => {
    state.searchResultsRefreshTimer = null;
    refreshSearchResultsBlockedState();
  }, options.immediate ? 0 : 280);
}

export function refreshSearchResultsBlockedState() {
  if (!isSearchPage() || state.searchPageLoading) return;

  // Steam AJAX pagination updates the URL and/or replaces result rows without a full reload.
  // Prefer a guest refetch when that mode is on and the page offset moved.
  if (state.settings.searchPageUnblocked) {
    const start = getSearchStartOffset();
    if (location.href !== state.searchPageLoadedHref || start !== state.searchPageLoadedStart) {
      scheduleGuestSearchReload();
      return;
    }
  }

  const fingerprint = getSearchResultsFingerprint();
  if (fingerprint === state.searchResultsFingerprint) return;
  state.searchResultsFingerprint = fingerprint;

  decorateBlockedSearchResults();
  if (shouldProbeBlockedScope('search')) {
    const token = ++state.searchPageToken;
    void probeSearchPageBlocked(token);
  }
}

/**
 * Guest /search fetch URL. Uses the full store search page with an explicit
 * `start`/`count` offset (Steam's `page=` alone is not enough).
 */

export function buildGuestSearchFetchUrl(sourceUrl = location.href) {
  return buildTargetUrl(sourceUrl);
}

/**
 * `/search/results?infinite=1` returns JSON `{ results_html }`; full `/search`
 * returns a normal HTML document. Normalize both to parseable HTML.
 */

export function normalizeGuestSearchHtml(responseText) {
  const raw = String(responseText || '');
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed);
      if (data && typeof data.results_html === 'string') {
        return `<div id="search_results"><div id="search_resultsRows">${data.results_html}</div></div>`;
      }
    } catch {
      /* fall through — treat as HTML */
    }
  }
  return raw;
}

export function scheduleGuestSearchReload(options = {}) {
  if (!state.settings.searchPageUnblocked || !isSearchPage()) return;
  const forceRefresh = !!options.forceRefresh;
  const start = getSearchStartOffset();
  if (
    !forceRefresh &&
    location.href === state.searchPageLoadedHref &&
    start === state.searchPageLoadedStart
  ) {
    return;
  }
  if (state.searchPageDebounceTimer) window.clearTimeout(state.searchPageDebounceTimer);
  state.searchPageDebounceTimer = window.setTimeout(() => {
    loadGuestSearchPage(options);
  }, options.immediate ? 0 : 200);
}

export function extractSearchResultsRoot(doc) {
  const rows = doc.querySelector('#search_resultsRows');
  if (rows) {
    return rows.closest('#search_results') || rows.closest('#search_result_container') || rows.parentElement;
  }
  return (
    doc.querySelector('#search_results') ||
    doc.querySelector('#search_result_container') ||
    doc.querySelector('#search_results_ctn') ||
    doc.querySelector('.search_results') ||
    null
  );
}

export function findLiveSearchResultsRoot() {
  const rows = document.querySelector('#search_resultsRows');
  if (rows) {
    return (
      rows.closest('#search_results') ||
      rows.closest('#search_result_container') ||
      rows.parentElement
    );
  }
  return (
    document.querySelector('#search_results') ||
    document.querySelector('#search_result_container') ||
    document.querySelector('#search_results_ctn') ||
    document.querySelector('.search_results') ||
    null
  );
}

export function getSearchTermFromLocation() {
  try {
    return new URL(location.href).searchParams.get('term') || '';
  } catch {
    return '';
  }
}

export function buildInjectedSearchRowHtml(item) {
  const href = buildAppHref(item.id, item.name);
  const img = item.img || buildBlockedAppCapsule(item.id);
  const release = item.releaseDate
    ? `<div class="search_released responsive_secondrow">${escapeHtml(item.releaseDate)}</div>`
    : '<div class="search_released responsive_secondrow"></div>';
  const price = item.priceLabel
    ? `<div class="search_price_discount_combined responsive_secondrow"><div class="discount_block search_discount_block"><div class="discount_prices"><div class="discount_final_price">${escapeHtml(item.priceLabel)}</div></div></div></div>`
    : '<div class="search_price_discount_combined responsive_secondrow"></div>';
  return `
    <a href="${escapeHtml(href)}" data-ds-appid="${escapeHtml(String(item.id))}" data-ds-itemkey="App_${escapeHtml(String(item.id))}" class="search_result_row ds_collapse_flag srbb-search-row--injected">
      <div class="search_capsule"><img src="${escapeHtml(img)}" alt=""></div>
      <div class="responsive_search_name_combined">
        <div class="search_name ellipsis"><span class="title">${escapeHtml(item.name)}</span></div>
        ${release}
        ${price}
      </div>
    </a>
  `;
}

export async function injectHiddenSearchHits(token) {
  // storesearch only covers the first page — don't mix those hits into page 2+
  if (getSearchStartOffset() > 0) return;

  const term = getSearchTermFromLocation().trim();
  if (!term) return;

  const rowsHost = document.querySelector('#search_resultsRows');
  if (!rowsHost) return;

  const rowById = new Map();
  collectSearchResultApps(rowsHost).forEach((app) => {
    if (app?.id && app.row) rowById.set(String(app.id), app.row);
  });

  let storeItems = [];
  try {
    const storeParsed = await requestGuestJson(buildStoreSearchUrl(term));
    if (token !== state.searchPageToken) return;
    storeItems = normalizeSuggestItems(storeParsed?.items || []);
  } catch {
    /* keep blocked-only injection */
  }

  const blockedMatches = collectBlockedSuggestMatches(term);
  // storesearch first so hidden titles keep Steam's relevance ranking
  const ranked = unionSuggestItems(storeItems, blockedMatches);
  let missing = ranked.filter((item) => item?.id && !rowById.has(String(item.id)));
  if (!missing.length) return;

  missing = await enrichSparseSuggestItems(missing, {
    isCancelled: () => token !== state.searchPageToken,
  });
  if (token !== state.searchPageToken) return;

  for (const item of missing) {
    if (token !== state.searchPageToken) return;
    const id = String(item.id);
    const wrap = document.createElement('div');
    wrap.innerHTML = buildInjectedSearchRowHtml(item).trim();
    const row = wrap.firstElementChild;
    if (!row) continue;

    const itemRank = ranked.findIndex((entry) => String(entry.id) === id);
    let inserted = false;
    for (let j = itemRank + 1; j < ranked.length; j += 1) {
      const anchor = rowById.get(String(ranked[j].id));
      if (anchor && anchor.parentNode === rowsHost) {
        rowsHost.insertBefore(row, anchor);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      let prev = null;
      for (let j = itemRank - 1; j >= 0; j -= 1) {
        const candidate = rowById.get(String(ranked[j].id));
        if (candidate && candidate.parentNode === rowsHost) {
          prev = candidate;
          break;
        }
      }
      if (prev) {
        prev.after(row);
      } else {
        const firstExisting = rowsHost.querySelector('a.search_result_row, .search_result_row');
        if (firstExisting) rowsHost.insertBefore(row, firstExisting);
        else rowsHost.appendChild(row);
      }
    }
    rowById.set(id, row);
  }
}

export function ensureSearchBanner(mount) {
  if (!mount || document.getElementById('srbb-search-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'srbb-search-banner';
  banner.className = 'srbb-search-banner';
  banner.innerHTML = `
    <span class="srbb-search-banner__badge">${escapeHtml(t('badge'))}</span>
    <span class="srbb-search-banner__text">${escapeHtml(t('searchPageBanner'))}</span>
    <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="search-settings">${escapeHtml(t('searchPageBannerSettings'))}</button>
    <button type="button" class="srbb-btn srbb-btn--ghost srbb-search-banner__reload" data-srbb="search-reload">${escapeHtml(t('reload'))}</button>
  `;
  banner.querySelector('[data-srbb="search-reload"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    loadGuestSearchPage({ forceRefresh: true });
  });
  banner.querySelector('[data-srbb="search-settings"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openSearchSettings();
  });
  mount.insertAdjacentElement('beforebegin', banner);
}

export function buildSearchPageSkeletonHtml(count = 8) {
  const rows = Array.from({ length: count }, (_, i) => {
    const wTitle = 42 + ((i * 17) % 38);
    const wMeta = 28 + ((i * 11) % 30);
    return `
      <div class="srbb-search-skel__row" aria-hidden="true">
        <div class="srbb-skel srbb-search-skel__cap"></div>
        <div class="srbb-search-skel__body">
          <div class="srbb-skel srbb-search-skel__title" style="width:${wTitle}%"></div>
          <div class="srbb-skel srbb-search-skel__meta" style="width:${wMeta}%"></div>
        </div>
        <div class="srbb-skel srbb-search-skel__price"></div>
      </div>
    `;
  }).join('');
  return `
    <div class="srbb-search-skel" aria-busy="true" aria-label="${escapeHtml(t('state.searchPageLoading'))}">
      ${rows}
    </div>
  `;
}

export function showSearchPageSkeleton(liveRoot) {
  if (!liveRoot) return null;
  document.getElementById('srbb-search-status')?.remove();
  let skel = document.getElementById('srbb-search-skel');
  if (!skel) {
    skel = document.createElement('div');
    skel.id = 'srbb-search-skel';
    liveRoot.insertAdjacentElement('beforebegin', skel);
  }
  skel.className = 'srbb-search-skel-wrap';
  skel.dataset.kind = 'loading';
  skel.innerHTML = buildSearchPageSkeletonHtml();
  skel.hidden = false;
  liveRoot.hidden = true;
  return skel;
}

export function clearSearchPageSkeleton(liveRoot) {
  document.getElementById('srbb-search-skel')?.remove();
  if (liveRoot) liveRoot.hidden = false;
}

export async function loadGuestSearchPage(options = {}) {
  if (!state.settings.searchPageUnblocked || !isSearchPage()) return;

  const forceRefresh = !!options.forceRefresh;
  if (forceRefresh) {
    state.searchPageLoadedHref = '';
    state.searchPageLoadedStart = -1;
  }
  const token = ++state.searchPageToken;
  state.searchPageLoading = true;
  const mount = findLiveSearchResultsRoot() || getContentMount();
  if (!mount) {
    if (token === state.searchPageToken) state.searchPageLoading = false;
    return;
  }

  ensureSearchBanner(mount.parentElement || mount);

  const liveRoot = findLiveSearchResultsRoot() || mount;
  showSearchPageSkeleton(liveRoot);

  try {
    const targetUrl = buildGuestSearchFetchUrl();
    const loadedStart = getSearchStartOffset();
    let html = null;
    let fromCache = false;

    if (!forceRefresh) {
      html = readPageCache(targetUrl);
      fromCache = !!html;
    } else {
      invalidatePageCache(targetUrl);
    }

    if (!html) {
      const requestUrl = buildRequestUrl(targetUrl);
      const response = await gmRequest(requestUrl);
      if (token !== state.searchPageToken) return;

      if (response.status < 200 || response.status >= 400) {
        throw new Error(`HTTP ${response.status}`);
      }
      html = response.responseText || '';
    }

    html = normalizeGuestSearchHtml(html);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (token !== state.searchPageToken) return;

    const remoteRoot = extractSearchResultsRoot(doc);
    if (!remoteRoot) {
      if (fromCache) invalidatePageCache(targetUrl);
      clearSearchPageSkeleton(liveRoot);
      let statusEl = document.getElementById('srbb-search-status');
      if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'srbb-search-status';
        statusEl.className = 'srbb-search-status';
        liveRoot.insertAdjacentElement('beforebegin', statusEl);
      }
      statusEl.textContent = t('searchPageNoContent');
      statusEl.dataset.kind = 'error';
      state.searchPageLoadedHref = location.href;
      state.searchPageLoadedStart = loadedStart;
      state.searchResultsFingerprint = getSearchResultsFingerprint();
      return;
    }

    if (!fromCache) {
      writePageCache(targetUrl, html);
    }

    const currentRoot = findLiveSearchResultsRoot() || liveRoot;
    if (!currentRoot) {
      clearSearchPageSkeleton(null);
      return;
    }

    document.getElementById('srbb-search-skel')?.remove();
    document.getElementById('srbb-search-status')?.remove();
    currentRoot.hidden = false;
    currentRoot.replaceWith(document.importNode(remoteRoot, true));
    ensureSearchBanner(findLiveSearchResultsRoot()?.parentElement || mount.parentElement);
    await injectHiddenSearchHits(token);
    if (token !== state.searchPageToken) return;
    decorateBlockedSearchResults();
    // Mark before probe/DOM tweaks so MutationObserver remounts do not re-fetch
    state.searchPageLoadedHref = location.href;
    state.searchPageLoadedStart = loadedStart;
    state.searchResultsFingerprint = getSearchResultsFingerprint();
    void probeSearchPageBlocked(token);
  } catch (err) {
    if (token !== state.searchPageToken) return;
    clearSearchPageSkeleton(liveRoot);
    let statusEl = document.getElementById('srbb-search-status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'srbb-search-status';
      statusEl.className = 'srbb-search-status';
      liveRoot.insertAdjacentElement('beforebegin', statusEl);
    }
    statusEl.textContent = t('failedLoad', {
      error: err && err.message ? err.message : String(err),
    });
    statusEl.dataset.kind = 'error';
  } finally {
    if (token === state.searchPageToken) state.searchPageLoading = false;
  }
}

/* ─── Header button + state.settings panel ─── */
