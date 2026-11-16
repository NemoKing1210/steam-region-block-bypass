import { SUGGEST_RESULT_COUNT } from '../../core/constants.js';
import { buildTargetUrl } from '../../region/urls.js';

function ccParam(cc) {
  return String(cc || '').toLowerCase();
}

export function buildSuggestUrl(term, { lang = 'english', cc = '' } = {}) {
  const url = new URL('https://store.steampowered.com/search/suggest');
  url.searchParams.set('f', 'jsonfull');
  url.searchParams.set('term', String(term || ''));
  url.searchParams.set('realm', '1');
  url.searchParams.set('require_type', 'game,software');
  url.searchParams.set('l', lang);
  url.searchParams.set('origin', 'https://store.steampowered.com');
  url.searchParams.set('cc', ccParam(cc));
  return url.toString();
}

export function buildStoreSearchUrl(term, { lang = 'english', cc = '' } = {}) {
  const url = new URL('https://store.steampowered.com/api/storesearch/');
  url.searchParams.set('term', String(term || ''));
  url.searchParams.set('l', lang);
  url.searchParams.set('cc', ccParam(cc));
  return url.toString();
}

export function buildSearchResultsMetaUrl(
  term,
  { lang = 'english', cc = '', count = SUGGEST_RESULT_COUNT } = {},
) {
  const url = new URL('https://store.steampowered.com/search/results/');
  url.searchParams.set('term', String(term || ''));
  url.searchParams.set('count', String(count));
  url.searchParams.set('start', '0');
  url.searchParams.set('infinite', '1');
  url.searchParams.set('ignore_preferences', '1');
  url.searchParams.set('l', lang);
  url.searchParams.set('cc', ccParam(cc));
  return url.toString();
}

export function buildAppDetailsUrl(appId, { lang = 'english', cc = '' } = {}) {
  const url = new URL('https://store.steampowered.com/api/appdetails');
  url.searchParams.set('appids', String(appId));
  url.searchParams.set('l', lang);
  url.searchParams.set('cc', ccParam(cc));
  return url.toString();
}

export function buildAppReviewsUrl(appId, { lang = 'english' } = {}) {
  const url = new URL(`https://store.steampowered.com/appreviews/${appId}`);
  url.searchParams.set('json', '1');
  url.searchParams.set('language', lang);
  url.searchParams.set('purchase_type', 'all');
  url.searchParams.set('filter_offtopic_activity', '0');
  url.searchParams.set('num_per_page', '0');
  return url.toString();
}

/**
 * Full `/search` guest URL with the explicit `start`/`count` offset Steam's
 * HTML endpoint expects. `page=` alone is not enough for AJAX pagination.
 */
export function buildGuestSearchFetchUrl(
  sourceUrl,
  { lang = 'english', cc = '', start = 0, count = 25 } = {},
) {
  const target = buildTargetUrl(sourceUrl, { lang, cc });
  const url = new URL(target);
  url.searchParams.set('ignore_preferences', '1');
  url.searchParams.set('count', String(count));
  if (start > 0) {
    url.searchParams.set('start', String(start));
    url.searchParams.set('page', String(Math.floor(start / count) + 1));
  } else {
    url.searchParams.delete('start');
    if (url.searchParams.get('page') === '1') url.searchParams.delete('page');
  }
  return url.toString();
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

export function buildBlockedAppCapsule(appId) {
  return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/capsule_231x87.jpg`;
}
