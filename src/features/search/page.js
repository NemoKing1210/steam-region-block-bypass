import { getSettings } from '../../core/settings.js';
import { Codes, fail, logError } from '../../core/debug.js';
import {
  invalidatePageCache,
  readPageCache,
  writePageCache,
} from '../../core/page-cache.js';
import { t } from '../../i18n/index.js';
import { escapeHtml } from '../../utils/html.js';
import { getContentMount } from '../../region/inject.js';
import {
  buildRequestUrl,
  guestFetch,
} from '../../region/request.js';
import {
  collectBlockedSuggestMatches,
  enrichSparseSuggestItems,
  requestGuestJson,
} from './api.js';
import { normalizeSuggestItems, unionSuggestItems } from './parse.js';
import {
  buildGuestSearchFetchUrl,
  buildStoreSearchUrl,
} from './urls.js';
import { buildInjectedSearchRowHtml } from './render.js';
import {
  decorateBlockedSearchResults,
  collectSearchResultApps,
  probeSearchPageBlocked,
  shouldProbeBlockedScope,
} from './probe.js';
import { openSearchSettings } from './header.js';
import {
  extractSearchResultsRoot,
  findLiveSearchResultsRoot,
  getSearchPageSize,
  getSearchStartOffset,
  getSearchTermFromLocation,
  isSearchPage,
} from './page-state.js';
import {
  clearSearchPageSkeleton,
  ensureSearchStatus,
  getSearchRequestMeta,
  normalizeGuestSearchHtml,
  showSearchPageSkeleton,
} from './page-view.js';

let searchPageToken = 0;
let searchPageDebounceTimer = null;
let searchPageLoadedHref = '';
let searchPageLoadedStart = -1;
let searchPageLoading = false;
let searchResultsFingerprint = '';
let searchResultsRefreshTimer = null;
let searchResultsObserver = null;

export function getSearchResultsFingerprint() {
  const ids = collectSearchResultApps(document)
    .map((app) => app.id)
    .join(',');
  return `${location.href}#${ids}`;
}

function isSearchResultsMutation(mutation) {
  const target = mutation.target;
  if (!(target instanceof Element)) return false;
  if (
    target.id === 'search_resultsRows' ||
    target.id === 'search_result_container' ||
    target.id === 'search_results' ||
    target.classList?.contains('search_pagination') ||
    target.closest?.(
      '#search_resultsRows, #search_result_container, #search_results, .search_pagination',
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
        '#search_resultsRows, .search_result_row, .search_pagination',
      )
    ) {
      return true;
    }
  }
  return false;
}

export function stopSearchResultsObserver() {
  searchResultsObserver?.disconnect();
  searchResultsObserver = null;
}

export function observeSearchResultsChanges() {
  if (searchResultsObserver) return;
  const observer = new MutationObserver((mutations) => {
    if (!isSearchPage() || searchPageLoading) return;
    if (!mutations.some(isSearchResultsMutation)) return;
    scheduleSearchResultsRefresh();
  });
  searchResultsObserver = observer;
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export function scheduleSearchResultsRefresh(options = {}) {
  if (!isSearchPage()) return;
  if (searchResultsRefreshTimer) window.clearTimeout(searchResultsRefreshTimer);
  searchResultsRefreshTimer = window.setTimeout(
    () => {
      searchResultsRefreshTimer = null;
      refreshSearchResultsBlockedState();
    },
    options.immediate ? 0 : 280,
  );
}

export function refreshSearchResultsBlockedState() {
  if (!isSearchPage() || searchPageLoading) return;

  if (getSettings().search.pageEnabled) {
    const start = getSearchStartOffset();
    if (location.href !== searchPageLoadedHref || start !== searchPageLoadedStart) {
      scheduleGuestSearchReload();
      return;
    }
  }

  const fingerprint = getSearchResultsFingerprint();
  if (fingerprint === searchResultsFingerprint) return;
  searchResultsFingerprint = fingerprint;

  decorateBlockedSearchResults();
  if (shouldProbeBlockedScope('search')) {
    const token = ++searchPageToken;
    void probeSearchPageBlocked({
      isCancelled: () => token !== searchPageToken,
      getLiveRoot: findLiveSearchResultsRoot,
      ensureBanner: ensureSearchBanner,
    });
  }
}

export function scheduleGuestSearchReload(options = {}) {
  if (!getSettings().search.pageEnabled || !isSearchPage()) return;
  const forceRefresh = !!options.forceRefresh;
  const start = getSearchStartOffset();
  if (
    !forceRefresh &&
    location.href === searchPageLoadedHref &&
    start === searchPageLoadedStart
  ) {
    return;
  }
  if (searchPageDebounceTimer) window.clearTimeout(searchPageDebounceTimer);
  searchPageDebounceTimer = window.setTimeout(
    () => {
      void loadGuestSearchPage(options);
    },
    options.immediate ? 0 : 200,
  );
}

export async function injectHiddenSearchHits(token) {
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
    const storeParsed = await requestGuestJson(
      buildStoreSearchUrl(term, getSearchRequestMeta()),
    );
    if (token !== searchPageToken) return;
    storeItems = normalizeSuggestItems(storeParsed?.items || []);
  } catch {
    /* keep blocked-only injection */
  }

  const blockedMatches = collectBlockedSuggestMatches(term);
  const ranked = unionSuggestItems(storeItems, blockedMatches);
  let missing = ranked.filter((item) => item?.id && !rowById.has(String(item.id)));
  if (!missing.length) return;

  missing = await enrichSparseSuggestItems(missing, {
    isCancelled: () => token !== searchPageToken,
  });
  if (token !== searchPageToken) return;

  for (const item of missing) {
    if (token !== searchPageToken) return;
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
      if (prev) prev.after(row);
      else {
        const firstExisting = rowsHost.querySelector(
          'a.search_result_row, .search_result_row',
        );
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
  banner.querySelector('[data-srbb="search-reload"]')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void loadGuestSearchPage({ forceRefresh: true });
  });
  banner.querySelector('[data-srbb="search-settings"]')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openSearchSettings();
  });
  mount.insertAdjacentElement('beforebegin', banner);
}

export function clearGuestSearchPageState() {
  const hadGuestPage =
    !!searchPageLoadedHref ||
    !!searchPageDebounceTimer ||
    !!document.getElementById('srbb-search-banner') ||
    !!document.getElementById('srbb-search-skel') ||
    !!document.getElementById('srbb-search-probe');
  if (hadGuestPage) {
    searchPageToken += 1;
    searchPageLoadedHref = '';
    searchPageLoadedStart = -1;
    searchResultsFingerprint = '';
    searchPageLoading = false;
    if (searchPageDebounceTimer) {
      window.clearTimeout(searchPageDebounceTimer);
      searchPageDebounceTimer = null;
    }
  }
  document.getElementById('srbb-search-banner')?.remove();
  document.getElementById('srbb-search-skel')?.remove();
  document.getElementById('srbb-search-status')?.remove();
  document.getElementById('srbb-search-probe')?.remove();
  const liveRoot = findLiveSearchResultsRoot();
  if (liveRoot) liveRoot.hidden = false;
}

export async function loadGuestSearchPage(options = {}) {
  if (!getSettings().search.pageEnabled || !isSearchPage()) return;

  const forceRefresh = !!options.forceRefresh;
  if (forceRefresh) {
    searchPageLoadedHref = '';
    searchPageLoadedStart = -1;
  }
  const token = ++searchPageToken;
  searchPageLoading = true;
  const mount = findLiveSearchResultsRoot() || getContentMount();
  if (!mount) {
    if (token === searchPageToken) searchPageLoading = false;
    return;
  }

  ensureSearchBanner(mount.parentElement || mount);
  const liveRoot = findLiveSearchResultsRoot() || mount;
  showSearchPageSkeleton(liveRoot);

  try {
    const targetUrl = buildGuestSearchFetchUrl(location.href, {
      ...getSearchRequestMeta(),
      start: getSearchStartOffset(),
      count: getSearchPageSize(),
    });
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
      const region = getSettings().region;
      const response = await guestFetch(buildRequestUrl(targetUrl, region), region);
      if (token !== searchPageToken) return;
      if (response.status < 200 || response.status >= 400) {
        throw fail(Codes.SEARCH_FAILED, `search page HTTP ${response.status}`, {
          status: response.status,
        });
      }
      html = response.responseText || '';
    }

    html = normalizeGuestSearchHtml(html);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (token !== searchPageToken) return;

    const remoteRoot = extractSearchResultsRoot(doc);
    if (!remoteRoot) {
      if (fromCache) invalidatePageCache(targetUrl);
      clearSearchPageSkeleton(liveRoot);
      ensureSearchStatus(liveRoot, t('searchPageNoContent'), 'error');
      searchPageLoadedHref = location.href;
      searchPageLoadedStart = loadedStart;
      searchResultsFingerprint = getSearchResultsFingerprint();
      return;
    }

    if (!fromCache) writePageCache(targetUrl, html);

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
    if (token !== searchPageToken) return;
    decorateBlockedSearchResults();
    // Mark before probe/DOM tweaks so MutationObserver remounts do not re-fetch.
    searchPageLoadedHref = location.href;
    searchPageLoadedStart = loadedStart;
    searchResultsFingerprint = getSearchResultsFingerprint();
    void probeSearchPageBlocked({
      isCancelled: () => token !== searchPageToken,
      getLiveRoot: findLiveSearchResultsRoot,
      ensureBanner: ensureSearchBanner,
    });
  } catch (error) {
    if (token !== searchPageToken) return;
    clearSearchPageSkeleton(liveRoot);
    ensureSearchStatus(
      liveRoot,
      t('failedLoad', {
        error: String(error?.message || error).replace(/^\[SRB-\d{4}\]\s*/, ''),
      }),
      'error',
    );
    logError(Codes.SEARCH_FAILED, 'guest search page failed', {
      error: String(error?.message || error),
    });
  } finally {
    if (token === searchPageToken) searchPageLoading = false;
  }
}
