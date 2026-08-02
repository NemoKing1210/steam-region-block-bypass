import { GM_setValue } from '$';
import { BLOCKED_APPS_STORAGE_KEY, BLOCKED_APPS_MAX_ENTRIES } from './constants.js';
import { state } from './state.js';
import { syncBlockedAppsPanel } from './features/panel.js';
import { t } from './i18n/index.js';
import { escapeHtml } from './utils/html.js';
import { getAppIdFromUrl } from './detect.js';

export function loadBlockedAppsStore() {
  const raw = GM_getValue(BLOCKED_APPS_STORAGE_KEY, null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw;
}

export function pruneBlockedAppsStore(store) {
  const entries = Object.entries(store).filter(([id, entry]) => {
    return /^[0-9]+$/.test(id) && entry && typeof entry === 'object' && typeof entry.at === 'number';
  });
  entries.sort((a, b) => b[1].at - a[1].at);
  const next = {};
  for (const [id, entry] of entries.slice(0, BLOCKED_APPS_MAX_ENTRIES)) {
    next[id] = entry;
  }
  return next;
}

export function saveBlockedAppsStore(store) {
  GM_setValue(BLOCKED_APPS_STORAGE_KEY, pruneBlockedAppsStore(store));
  invalidateBlockedAppsIndex();
}

export function invalidateBlockedAppsIndex() {
  state.blockedAppsIndex = null;
}

export function getBlockedAppIds() {
  if (!state.blockedAppsIndex) {
    state.blockedAppsIndex = new Set(Object.keys(loadBlockedAppsStore()));
  }
  return state.blockedAppsIndex;
}

export function getBlockedAppsCount() {
  return getBlockedAppIds().size;
}

/** @returns {Array<{id:string,name:string,at:number}>} newest first */

export function listBlockedAppsEntries() {
  const store = pruneBlockedAppsStore(loadBlockedAppsStore());
  return Object.entries(store)
    .map(([id, entry]) => ({
      id,
      name: String(entry?.name || '').trim(),
      at: typeof entry?.at === 'number' ? entry.at : 0,
    }))
    .sort((a, b) => b.at - a.at);
}

export function isBlockedApp(appId) {
  if (!appId) return false;
  return getBlockedAppIds().has(String(appId));
}

export function rememberBlockedApp(appId, name = '') {
  if (!state.settings.rememberBlockedApps || !appId) return;
  const id = String(appId);
  const store = loadBlockedAppsStore();
  const prev = store[id] && typeof store[id] === 'object' ? store[id] : {};
  const cleanName = String(name || prev.name || '').trim();
  store[id] = {
    name: cleanName,
    at: Date.now(),
  };
  saveBlockedAppsStore(store);
  syncBlockedAppsPanel();
}

export function touchBlockedAppName(appId, name = '') {
  if (!state.settings.rememberBlockedApps || !appId) return;
  const id = String(appId);
  const cleanName = String(name || '').trim();
  if (!cleanName) return;
  const store = loadBlockedAppsStore();
  if (!store[id]) return;
  if (store[id].name === cleanName) return;
  store[id] = { ...store[id], name: cleanName, at: Date.now() };
  saveBlockedAppsStore(store);
}

export function clearBlockedApps() {
  GM_setValue(BLOCKED_APPS_STORAGE_KEY, {});
  invalidateBlockedAppsIndex();
  const listEl = document.getElementById('srbb-blocked-list');
  if (listEl) {
    listEl.hidden = true;
    listEl.innerHTML = '';
  }
  syncBlockedAppsPanel();
}

export function getAppNameFromUrl(url = location.href) {
  const match = String(url).match(/\/app\/\d+\/([^/?#]+)/i);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]).replace(/_/g, ' ').trim();
  } catch {
    return match[1].replace(/_/g, ' ').trim();
  }
}

export function rememberBlockedAppFromPage() {
  const appId = getAppIdFromUrl();
  if (!appId) return;
  const name =
    getAppNameFromUrl() ||
    document.querySelector('.apphub_AppName, #appHubAppName')?.textContent?.trim() ||
    '';
  rememberBlockedApp(appId, name);
}

export function prepareSuggestItems(items) {
  if (!state.settings.markBlockedInSearch) return items;
  return items.map((item) => ({
    ...item,
    regionBlocked: isBlockedApp(item.id),
  }));
}

export function buildSuggestBlockedBadgeHtml(item) {
  if (!item.regionBlocked) return '';
  return `<span class="srbb-suggest__blocked-badge">${escapeHtml(t('suggestRegionBlocked'))}</span>`;
}

/** Steam search page size (usually 25). */
