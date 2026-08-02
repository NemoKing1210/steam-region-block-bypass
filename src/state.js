/** @type {import('./constants.js').DEFAULT_SETTINGS extends infer T ? T & Record<string, unknown> : never} */
export const state = {
  settings: null,
  panelOpen: false,
  suggestToken: 0,
  suggestDebounceTimer: null,
  activeSuggestIndex: -1,
  searchPageToken: 0,
  searchPageDebounceTimer: null,
  searchPageLoadedHref: '',
  searchPageLoadedStart: -1,
  searchPageLoading: false,
  searchResultsFingerprint: '',
  searchResultsRefreshTimer: null,
  searchResultsObserverHooked: false,
  historyHooked: false,
  blockedAppsIndex: null,
  lastSuggestItems: [],
};

export function setSettings(next) {
  state.settings = next;
}

/** Session cache of probed app IDs that were not region-blocked: id → status */
export const probeSessionCache = new Map();
/** @type {Map<string, object | null>} */
export const suggestMetaCache = new Map();
