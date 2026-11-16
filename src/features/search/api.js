import { getSettings } from '../../core/settings.js';
import { Codes, fail } from '../../core/debug.js';
import { isBlockedApp, loadBlockedAppsStore } from '../../core/blocked-apps.js';
import { t } from '../../i18n/index.js';
import { mapPool } from '../../utils/pool.js';
import {
  getSteamStoreLanguage,
  getStoreCountryCode,
  guestFetch,
} from '../../region/request.js';
import { buildRequestUrl } from '../../region/urls.js';
import {
  emptySuggestItemFields,
  isSuggestItemSparse,
  mapAppDetailsToSuggestFields,
  mapAppReviewsToSuggestFields,
  mergeSuggestItemMeta,
  mergeSuggestSearchFields,
  mergeSuggestStoreExtras,
  normalizeSuggestItems,
  parseJsonResponse,
  parseSearchResultItems,
  trimSuggestItems,
  unionSuggestItems,
} from './parse.js';
import {
  buildAppDetailsUrl,
  buildAppReviewsUrl,
  buildBlockedAppCapsule,
  buildSearchResultsMetaUrl,
  buildStoreSearchUrl,
  buildSuggestUrl,
} from './urls.js';

const suggestMetaCache = new Map();

function guestMeta() {
  return {
    lang: getSteamStoreLanguage(),
    cc: getStoreCountryCode(),
  };
}

export async function requestGuestJson(targetUrl) {
  const region = getSettings().region;
  const response = await guestFetch(buildRequestUrl(targetUrl, region), region);
  if (response.status < 200 || response.status >= 400) {
    throw fail(Codes.SEARCH_FAILED, `search request HTTP ${response.status}`, {
      status: response.status,
    });
  }
  const parsed = parseJsonResponse(response.responseText || '');
  if (parsed === null) throw new Error(t('noContent'));
  return parsed;
}

export async function fetchSearchResultItems(term) {
  const meta = guestMeta();
  const requestUrl = buildSearchResultsMetaUrl(term, meta);
  const region = getSettings().region;
  const response = await guestFetch(buildRequestUrl(requestUrl, region), region);
  if (response.status < 200 || response.status >= 400) {
    throw fail(Codes.SEARCH_FAILED, `search results HTTP ${response.status}`, {
      status: response.status,
    });
  }
  const parsed = parseJsonResponse(response.responseText || '');
  const html =
    parsed && typeof parsed === 'object' && typeof parsed.results_html === 'string'
      ? parsed.results_html
      : response.responseText || '';
  return parseSearchResultItems(html);
}

export function suggestMetaCacheKey(appId) {
  const meta = guestMeta();
  return `${appId}:${meta.cc}:${meta.lang}`;
}

export async function fetchSuggestItemMeta(appId) {
  const id = String(appId);
  if (!/^\d+$/.test(id)) return null;

  const cacheKey = suggestMetaCacheKey(id);
  if (suggestMetaCache.has(cacheKey)) {
    const cached = suggestMetaCache.get(cacheKey);
    if (cached === null || (cached && cached.releaseDate)) return cached;
    if (cached && (cached.priceLabel || cached.isFree || cached.platforms)) return cached;
  }

  try {
    const meta = guestMeta();
    const [detailsParsed, reviewsParsed] = await Promise.all([
      requestGuestJson(buildAppDetailsUrl(id, meta)).catch(() => null),
      requestGuestJson(buildAppReviewsUrl(id, meta)).catch(() => null),
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

export function collectBlockedSuggestMatches(term) {
  const search = getSettings().search;
  if (!search.markBlocked && !search.rememberBlocked) return [];
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

/**
 * Fetch and rank guest suggestions. Returns the intermediate result sets so
 * the header can keep the exact merge/trim/probe behaviour of the old script.
 */
export async function fetchSuggestItems(term, { isCancelled } = {}) {
  const meta = guestMeta();
  let items = [];
  let storeItems = [];
  let searchItems = [];
  const blockedMatches = collectBlockedSuggestMatches(term);

  const [storeParsed, searchParsed] = await Promise.all([
    requestGuestJson(buildStoreSearchUrl(term, meta)).catch(() => null),
    fetchSearchResultItems(term).catch(() => null),
  ]);
  if (isCancelled?.()) return null;

  if (storeParsed) storeItems = normalizeSuggestItems(storeParsed.items || []);
  if (Array.isArray(searchParsed)) searchItems = searchParsed;

  // storesearch ranking keeps region-restricted titles in natural relevance
  // order; /search/results fills the rest.
  items = unionSuggestItems(storeItems, searchItems, blockedMatches);

  if (!items.length) {
    const suggestParsed = await requestGuestJson(buildSuggestUrl(term, meta));
    if (isCancelled?.()) return null;
    items = normalizeSuggestItems(
      Array.isArray(suggestParsed) ? suggestParsed : suggestParsed.items,
    );
    items = unionSuggestItems(items, blockedMatches);
  }

  if (!items.length) {
    return { empty: true, items: [], storeItems, searchItems, blockedMatches };
  }

  items = mergeSuggestSearchFields(items, searchItems);
  items = mergeSuggestStoreExtras(items, storeItems);
  items = await enrichSparseSuggestItems(items, { isCancelled });
  if (isCancelled?.()) return null;

  items = trimSuggestItems(
    items,
    blockedMatches.map((item) => item.id).concat(storeItems.map((item) => item.id)),
  );
  return { empty: false, items, storeItems, searchItems, blockedMatches };
}
