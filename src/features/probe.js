import { state, probeSessionCache } from '../state.js';
import { t } from '../i18n/index.js';
import { mapPool } from '../utils/pool.js';
import { buildTargetUrl } from '../url.js';
import { gmSessionRequest } from '../gm.js';
import { isRegionBlockedPage, isHostLoggedIn, getAppIdFromUrl } from '../detect.js';
import { extractGamePageRoot } from '../inject.js';
import { isBlockedApp, rememberBlockedApp } from '../blocked-apps.js';
import { normalizeProbeScope, normalizeProbeConcurrency } from '../settings.js';
import {
  ensureSearchBanner,
  findLiveSearchResultsRoot,
} from './search-page.js';
import {
  updateSuggestProbeProgress,
  finishSuggestProbe,
  setSuggestItemProbing,
  markSuggestItemBlockedLive,
} from './suggest.js';

export function shouldProbeBlockedScope(scope) {
  if (!state.settings.probeBlockedInSearch) return false;
  if (!state.settings.rememberBlockedApps) return false;
  if (!isHostLoggedIn()) return false;
  const s = normalizeProbeScope(state.settings.probeBlockedScope);
  return s === 'both' || s === scope;
}

export function dedupeProbeApps(apps) {
  const seen = new Set();
  const out = [];
  for (const app of apps) {
    const id = app && app.id != null ? String(app.id) : '';
    if (!/^\d+$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name: String(app.name || '').trim(), row: app.row || null });
  }
  return out;
}

/**
 * @param {Array<{id:string,name?:string,row?:Element|null}>} apps
 * @param {{ isCancelled?: () => boolean, onProgress?: Function, onBlocked?: Function, onItemStart?: Function, onItemDone?: Function }} hooks
 */

export async function probeAppRegionStatus(appId) {
  const targetUrl = buildTargetUrl(`https://store.steampowered.com/app/${appId}/`);
  const response = await gmSessionRequest(targetUrl);
  if (response.status < 200 || response.status >= 400) return 'unknown';
  const doc = new DOMParser().parseFromString(response.responseText || '', 'text/html');
  if (isRegionBlockedPage(doc)) return 'blocked';
  if (doc.querySelector('#agecheck_form, .agegate_birthday_desc, #app_agegate')) {
    return 'agegate';
  }
  if (extractGamePageRoot(doc)) return 'ok';
  return 'unknown';
}

export async function runBlockedProbe(apps, hooks = {}) {
  const queue = dedupeProbeApps(apps).filter((app) => {
    if (isBlockedApp(app.id)) return false;
    if (probeSessionCache.has(app.id)) return false;
    return true;
  });

  const total = queue.length;
  let done = 0;
  let found = 0;

  if (!total) {
    hooks.onProgress?.({ done: 0, total: 0, found: 0 });
    return { found: 0, checked: 0 };
  }

  hooks.onProgress?.({ done: 0, total, found: 0 });

  await mapPool(queue, normalizeProbeConcurrency(state.settings.probeBlockedConcurrency), async (app) => {
    if (hooks.isCancelled?.()) return;
    hooks.onItemStart?.(app);
    try {
      const status = await probeAppRegionStatus(app.id);
      if (hooks.isCancelled?.()) return;
      if (status === 'blocked') {
        rememberBlockedApp(app.id, app.name);
        found += 1;
        hooks.onBlocked?.(app);
      } else {
        probeSessionCache.set(app.id, status);
      }
    } catch {
      /* leave uncached for a later retry */
    } finally {
      done += 1;
      hooks.onItemDone?.(app);
      hooks.onProgress?.({ done, total, found });
    }
  });

  return { found, checked: done };
}

export function decorateBlockedSearchResults(root = document) {
  if (!state.settings.markBlockedInSearch || !getBlockedAppsCount()) return;

  const rows = root.querySelectorAll(
    '#search_resultsRows .search_result_row, a.search_result_row, .search_result_row'
  );
  rows.forEach((row) => {
    const rawDsId = String(row.getAttribute('data-ds-appid') || '')
      .split(',')[0]
      .trim();
    const link =
      row.matches('a[href*="/app/"]') ? row : row.querySelector('a[href*="/app/"]');
    const appId = rawDsId || (link ? getAppIdFromUrl(link.href) : null);
    if (!appId || !isBlockedApp(appId)) return;
    row.classList.add('srbb-search-row--blocked');
    if (row.querySelector('.srbb-blocked-mark')) return;

    const mark = document.createElement('span');
    mark.className = 'srbb-blocked-mark';
    mark.textContent = t('suggestRegionBlocked');
    const title = row.querySelector('.title, .search_name, .search_title, .col.search_name');
    if (title) title.appendChild(mark);
    else row.appendChild(mark);
  });
}

export function collectSearchResultApps(root = document) {
  const rows = root.querySelectorAll(
    '#search_resultsRows .search_result_row, a.search_result_row, .search_result_row'
  );
  const apps = [];
  const seen = Object.create(null);
  rows.forEach((row) => {
    const rawDsId = String(row.getAttribute('data-ds-appid') || '')
      .split(',')[0]
      .trim();
    const link =
      row.matches('a[href*="/app/"]') ? row : row.querySelector('a[href*="/app/"]');
    const appId = rawDsId || (link ? getAppIdFromUrl(link.href) : null);
    if (!appId || seen[appId]) return;
    seen[appId] = true;
    const name =
      row.querySelector('.title, .search_name, .search_title, .col.search_name')?.textContent?.trim() ||
      '';
    apps.push({ id: appId, name, row });
  });
  return apps;
}

export function ensureSearchProbeStatus(mount) {
  let statusEl = document.getElementById('srbb-search-probe');
  if (statusEl) return statusEl;
  const host = mount?.parentElement || mount || findLiveSearchResultsRoot()?.parentElement;
  if (!host) return null;
  statusEl = document.createElement('div');
  statusEl.id = 'srbb-search-probe';
  statusEl.className = 'srbb-search-probe';
  statusEl.hidden = true;
  statusEl.innerHTML = `
    <div class="srbb-search-probe__row">
      <span class="srbb-search-probe__spin" aria-hidden="true"></span>
      <span class="srbb-search-probe__label" id="srbb-search-probe-label"></span>
    </div>
    <div class="srbb-search-probe__track"><div class="srbb-search-probe__fill" id="srbb-search-probe-fill"></div></div>
  `;
  const banner = document.getElementById('srbb-search-banner');
  if (banner) banner.insertAdjacentElement('afterend', statusEl);
  else host.insertAdjacentElement('afterbegin', statusEl);
  return statusEl;
}

export function updateSearchProbeProgress(progress) {
  const bar = document.getElementById('srbb-search-probe');
  const fill = document.getElementById('srbb-search-probe-fill');
  const label = document.getElementById('srbb-search-probe-label');
  if (!bar || !fill || !label) return;
  if (!progress || !progress.total) {
    bar.hidden = true;
    bar.dataset.kind = '';
    return;
  }
  bar.hidden = false;
  bar.dataset.kind = 'loading';
  fill.style.width = `${Math.round((progress.done / progress.total) * 100)}%`;
  label.textContent = t('probeProgress', { done: progress.done, total: progress.total });
}

export function finishSearchProbe(found) {
  const bar = document.getElementById('srbb-search-probe');
  const fill = document.getElementById('srbb-search-probe-fill');
  const label = document.getElementById('srbb-search-probe-label');
  if (!bar || !fill || !label) return;
  if (found > 0) {
    bar.hidden = false;
    bar.dataset.kind = 'done';
    fill.style.width = '100%';
    label.textContent = t('probeFound', { count: found });
    window.setTimeout(() => {
      if (bar.dataset.kind === 'done') bar.hidden = true;
    }, 2800);
  } else {
    bar.hidden = true;
    bar.dataset.kind = '';
  }
}

export async function probeSearchPageBlocked(token) {
  if (!shouldProbeBlockedScope('search')) return;
  const liveRoot = findLiveSearchResultsRoot();
  if (!liveRoot) return;

  ensureSearchBanner(liveRoot.parentElement || liveRoot);
  ensureSearchProbeStatus(liveRoot);

  const apps = collectSearchResultApps(document);
  const result = await runBlockedProbe(apps, {
    isCancelled: () => token !== state.searchPageToken,
    onProgress: (p) => {
      if (token !== state.searchPageToken) return;
      updateSearchProbeProgress(p);
    },
    onItemStart: (app) => {
      if (token !== state.searchPageToken) return;
      app.row?.classList.add('srbb-search-row--probing');
    },
    onItemDone: (app) => {
      if (token !== state.searchPageToken) return;
      app.row?.classList.remove('srbb-search-row--probing');
    },
    onBlocked: (app) => {
      if (token !== state.searchPageToken) return;
      if (app.row && state.settings.markBlockedInSearch && !app.row.querySelector('.srbb-blocked-mark')) {
        const mark = document.createElement('span');
        mark.className = 'srbb-blocked-mark';
        mark.textContent = t('suggestRegionBlocked');
        const title = app.row.querySelector(
          '.title, .search_name, .search_title, .col.search_name'
        );
        if (title) title.appendChild(mark);
        else app.row.appendChild(mark);
        app.row.classList.add('srbb-search-row--blocked');
      }
    },
  });

  if (token !== state.searchPageToken) return;
  decorateBlockedSearchResults();
  finishSearchProbe(result.found);
}

export async function probeSuggestBlocked(items, token) {
  if (!shouldProbeBlockedScope('suggest')) {
    updateSuggestProbeProgress(null);
    return;
  }

  const apps = items
    .filter((item) => item && item.id && String(item.type || '').toLowerCase() !== 'bundle')
    .map((item) => ({ id: item.id, name: item.name }));

  const result = await runBlockedProbe(apps, {
    isCancelled: () => token !== state.suggestToken,
    onProgress: (p) => {
      if (token !== state.suggestToken) return;
      updateSuggestProbeProgress(p);
    },
    onItemStart: (app) => {
      if (token !== state.suggestToken) return;
      setSuggestItemProbing(app.id, true);
    },
    onItemDone: (app) => {
      if (token !== state.suggestToken) return;
      setSuggestItemProbing(app.id, false);
    },
    onBlocked: (app) => {
      if (token !== state.suggestToken) return;
      markSuggestItemBlockedLive(app.id);
    },
  });

  if (token !== state.suggestToken) return;
  finishSuggestProbe(result.found);
  if (result.found > 0 && state.lastSuggestItems.length) {
    state.lastSuggestItems = state.lastSuggestItems.map((item) => ({
      ...item,
      regionBlocked: isBlockedApp(item.id),
    }));
    updateSuggestStats(state.lastSuggestItems);
  }
}
