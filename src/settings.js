import { GM_getValue, GM_setValue } from '$';
import {
  STORAGE_KEY,
  SEARCH_DEFAULT_ON_FLAG,
  DEFAULT_SETTINGS,
  CACHE_MINUTES_MAX,
  CACHE_MAX_ENTRIES_CAP,
  PROBE_CONCURRENCY_MAX,
} from './constants.js';
import { state, setSettings } from './state.js';
import { syncSearchPanelToggle } from './features/panel.js';
import { syncSearchGuestMode } from './features/suggest.js';
import { isSearchPage, scheduleGuestSearchReload } from './features/search-page.js';
import { normalizeToastPosition, syncToastContainer } from './features/toast.js';

export function loadSettings() {
  let raw = GM_getValue(STORAGE_KEY, null);
  raw = migrateSearchDefaultOn(raw);
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const merged = { ...DEFAULT_SETTINGS, ...raw };
  delete merged.rememberSearchTerm;
  merged.cacheMinutes = normalizeCacheMinutes(merged.cacheMinutes);
  merged.cacheMaxEntries = normalizeCacheMaxEntries(merged.cacheMaxEntries);
  merged.cacheAppPages = merged.cacheAppPages !== false;
  merged.cacheSearchPages = merged.cacheSearchPages !== false;
  merged.probeBlockedScope = normalizeProbeScope(merged.probeBlockedScope);
  merged.probeBlockedConcurrency = normalizeProbeConcurrency(merged.probeBlockedConcurrency);
  merged.toastPosition = normalizeToastPosition(merged.toastPosition);
  merged.toastsEnabled = merged.toastsEnabled !== false;
  return merged;
}

export function migrateSearchDefaultOn(raw) {
  if (GM_getValue(SEARCH_DEFAULT_ON_FLAG, false)) return raw;
  GM_setValue(SEARCH_DEFAULT_ON_FLAG, true);
  if (!raw || typeof raw !== 'object') return raw;
  if (raw.searchUnblocked === true) return raw;
  const next = { ...raw, searchUnblocked: true };
  GM_setValue(STORAGE_KEY, next);
  return next;
}

export function saveSettings(next) {
  const prevSearch = state.settings.searchUnblocked;
  const prevSearchPage = state.settings.searchPageUnblocked;
  state.settings = { ...state.settings, ...next };
  state.settings.cacheMinutes = normalizeCacheMinutes(state.settings.cacheMinutes);
  state.settings.cacheMaxEntries = normalizeCacheMaxEntries(state.settings.cacheMaxEntries);
  state.settings.cacheAppPages = state.settings.cacheAppPages !== false;
  state.settings.cacheSearchPages = state.settings.cacheSearchPages !== false;
  state.settings.probeBlockedScope = normalizeProbeScope(state.settings.probeBlockedScope);
  state.settings.probeBlockedConcurrency = normalizeProbeConcurrency(state.settings.probeBlockedConcurrency);
  state.settings.toastPosition = normalizeToastPosition(state.settings.toastPosition);
  state.settings.toastsEnabled = state.settings.toastsEnabled !== false;
  GM_setValue(STORAGE_KEY, state.settings);
  setSettings(state.settings);
  if ('toastPosition' in next || 'toastsEnabled' in next) {
    syncToastContainer();
  }
  const searchChanged =
    ('searchUnblocked' in next && prevSearch !== state.settings.searchUnblocked) ||
    ('searchPageUnblocked' in next && prevSearchPage !== state.settings.searchPageUnblocked);
  if (searchChanged) {
    syncSearchGuestMode();
    syncSearchPanelToggle();
    if (state.settings.searchPageUnblocked && isSearchPage()) {
      state.searchPageLoadedHref = '';
      state.searchPageLoadedStart = -1;
      scheduleGuestSearchReload({ immediate: true });
    }
  }
}

export function normalizeCacheMinutes(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) return DEFAULT_SETTINGS.cacheMinutes;
  return Math.min(n, CACHE_MINUTES_MAX);
}

export function normalizeCacheMaxEntries(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 1) return DEFAULT_SETTINGS.cacheMaxEntries;
  return Math.min(n, CACHE_MAX_ENTRIES_CAP);
}

export function normalizeProbeScope(value) {
  return value === 'suggest' || value === 'search' || value === 'both'
    ? value
    : DEFAULT_SETTINGS.probeBlockedScope;
}

export function normalizeProbeConcurrency(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_SETTINGS.probeBlockedConcurrency;
  return Math.min(PROBE_CONCURRENCY_MAX, Math.max(1, n));
}

setSettings(loadSettings());
