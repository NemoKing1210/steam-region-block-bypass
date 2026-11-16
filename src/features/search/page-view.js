import {
  getSteamStoreLanguage,
  getStoreCountryCode,
} from '../../region/request.js';
import { buildSearchPageSkeletonHtml } from './render.js';

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
      /* treat as HTML */
    }
  }
  return raw;
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

export function getSearchRequestMeta() {
  return {
    lang: getSteamStoreLanguage(),
    cc: getStoreCountryCode(),
  };
}

export function ensureSearchStatus(liveRoot, message, kind) {
  let statusEl = document.getElementById('srbb-search-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'srbb-search-status';
    statusEl.className = 'srbb-search-status';
    liveRoot.insertAdjacentElement('beforebegin', statusEl);
  }
  statusEl.textContent = message;
  statusEl.dataset.kind = kind;
  return statusEl;
}
