import { GM_getValue, GM_setValue } from '$';
import {
  BLOCKED_APPS_STORAGE_KEY,
} from './constants.js';
import {
  blockedAppsStorageStats,
  getAppNameFromUrl,
  parseAppIdFromUrl,
  pruneBlockedAppsStore,
} from './blocked-apps-model.js';
import { getSettings } from './settings.js';
import { getStorePageId } from '../region/detect.js';
import { emit } from './bus.js';
import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

let blockedAppsIndex = null;

export function loadBlockedAppsStore() {
  try {
    const raw = GM_getValue(BLOCKED_APPS_STORAGE_KEY, null);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return pruneBlockedAppsStore(raw);
  } catch {
    return {};
  }
}

export function getBlockedAppsStorageStats() {
  return blockedAppsStorageStats(loadBlockedAppsStore());
}

function saveBlockedAppsStore(store) {
  try {
    GM_setValue(BLOCKED_APPS_STORAGE_KEY, pruneBlockedAppsStore(store));
  } catch {
    /* storage unavailable */
  }
  blockedAppsIndex = null;
  emit('blocked:changed');
}

export function getBlockedAppIds() {
  if (!blockedAppsIndex) {
    blockedAppsIndex = new Set(Object.keys(loadBlockedAppsStore()));
  }
  return blockedAppsIndex;
}

export function getBlockedAppsCount() {
  return getBlockedAppIds().size;
}

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
  if (!getSettings().search.rememberBlocked || !appId) return;
  const id = String(appId);
  const store = loadBlockedAppsStore();
  const prev = store[id] && typeof store[id] === 'object' ? store[id] : {};
  store[id] = {
    name: String(name || prev.name || '').trim(),
    at: Date.now(),
  };
  saveBlockedAppsStore(store);
}

export function touchBlockedAppName(appId, name = '') {
  if (!getSettings().search.rememberBlocked || !appId) return;
  const id = String(appId);
  const cleanName = String(name || '').trim();
  if (!cleanName) return;
  const store = loadBlockedAppsStore();
  if (!store[id] || store[id].name === cleanName) return;
  store[id] = { ...store[id], name: cleanName, at: Date.now() };
  saveBlockedAppsStore(store);
}

export function clearBlockedApps() {
  try {
    GM_setValue(BLOCKED_APPS_STORAGE_KEY, {});
  } catch {
    /* storage unavailable */
  }
  blockedAppsIndex = null;
  emit('blocked:changed');
}

export { getAppNameFromUrl };

export function rememberBlockedAppFromPage(url = location.href) {
  const page = getStorePageId(url);
  if (!page || page.kind !== 'app') return;
  const name =
    getAppNameFromUrl(url) ||
    document.querySelector('.apphub_AppName, #appHubAppName')?.textContent?.trim() ||
    '';
  rememberBlockedApp(page.id, name);
}

export function prepareSuggestItems(items) {
  if (!getSettings().search.markBlocked) return items;
  return items.map((item) => ({
    ...item,
    regionBlocked: isBlockedApp(item.id),
  }));
}

export function buildSuggestBlockedBadgeHtml(item) {
  if (!item.regionBlocked) return '';
  return `<span class="srbb-suggest__blocked-badge">${escapeHtml(
    t('suggestRegionBlocked'),
  )}</span>`;
}

export function appIdFromUrl(url = location.href) {
  return parseAppIdFromUrl(url);
}
