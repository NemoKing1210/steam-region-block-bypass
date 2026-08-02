import { state } from './state.js';
import { getSteamStoreLanguage, getStoreCountryCode } from './i18n/index.js';

export function getSearchPageSize(sourceUrl = location.href) {
  try {
    const count = parseInt(new URL(sourceUrl, location.origin).searchParams.get('count') || '', 10);
    if (Number.isFinite(count) && count > 0 && count <= 100) return count;
  } catch {
    /* ignore */
  }
  return 25;
}

/** Current page number from pagination UI (1-based), if present. */

export function getActiveSearchPageFromDom() {
  const pag = document.querySelector('.search_pagination_right');
  if (!pag) return null;
  for (const el of pag.children) {
    if (el.tagName !== 'SPAN') continue;
    const n = parseInt(String(el.textContent || '').trim(), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/**
 * Steam AJAX search uses `start`/`count`. Browser URL often only has `page=N`,
 * which the store HTML endpoint ignores — always derive a real offset.
 */

export function getSearchStartOffset(sourceUrl = location.href) {
  try {
    const url = new URL(sourceUrl, location.origin);
    const start = parseInt(url.searchParams.get('start') || '', 10);
    if (Number.isFinite(start) && start >= 0) return start;
    const page = parseInt(url.searchParams.get('page') || '', 10);
    if (Number.isFinite(page) && page >= 1) {
      return (page - 1) * getSearchPageSize(sourceUrl);
    }
  } catch {
    /* ignore */
  }
  const domPage = getActiveSearchPageFromDom();
  if (domPage && domPage >= 1) return (domPage - 1) * getSearchPageSize(sourceUrl);
  return 0;
}

export function buildTargetUrl(sourceUrl = location.href) {
  const url = new URL(sourceUrl);
  url.searchParams.delete('snr');
  url.searchParams.set('l', getSteamStoreLanguage());
  const cc = getStoreCountryCode();
  if (cc) {
    url.searchParams.set('cc', cc.toLowerCase());
  }
  if (/\/search\/?/i.test(url.pathname)) {
    url.searchParams.set('ignore_preferences', '1');
    const count = getSearchPageSize(url.toString());
    const start = getSearchStartOffset(url.toString());
    url.searchParams.set('count', String(count));
    if (start > 0) {
      url.searchParams.set('start', String(start));
      url.searchParams.set('page', String(Math.floor(start / count) + 1));
    } else {
      url.searchParams.delete('start');
      // Keep explicit page=1 out of the request — Steam treats missing as first page
      if (url.searchParams.get('page') === '1') url.searchParams.delete('page');
    }
  }
  return url.toString();
}

/**
 * Builds the request URL. When proxy is on, routes through a local/remote HTTP gateway
 * (Violentmonkey cannot attach a system SOCKS/HTTP proxy to GM_xmlhttpRequest).
 */

export function buildRequestUrl(targetUrl) {
  if (!state.settings.proxyEnabled || !state.settings.proxyHost.trim()) {
    return targetUrl;
  }

  const base = buildProxyBase();
  const mode = state.settings.proxyMode || 'gateway';

  if (mode === 'path') {
    // e.g. http://127.0.0.1:8080/store.steampowered.com/app/412020/
    return `${base}/${targetUrl.replace(/^https?:\/\//, '')}`;
  }
  if (mode === 'query') {
    return `${base}/?url=${encodeURIComponent(targetUrl)}`;
  }
  // gateway: http://127.0.0.1:8080/https://store.steampowered.com/...
  return `${base}/${targetUrl}`;
}

export function buildProxyBase() {
  let host = state.settings.proxyHost.trim().replace(/\/+$/, '');
  const port = String(state.settings.proxyPort || '').trim();

  if (/^https?:\/\//i.test(host)) {
    if (port && !/:\d+$/.test(host.replace(/^https?:\/\//i, '').split('/')[0])) {
      return `${host}:${port}`;
    }
    return host;
  }

  return port ? `http://${host}:${port}` : `http://${host}`;
}
