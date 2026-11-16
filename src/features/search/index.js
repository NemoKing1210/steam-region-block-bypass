import { on } from '../../core/bus.js';
import { getSettings } from '../../core/settings.js';
import { watchStoreNavigation } from '../../utils/navigation.js';
import {
  hideSuggestDropdown,
  mountSearchControls,
  resetSuggestState,
} from './header.js';
import {
  clearGuestSearchPageState,
  observeSearchResultsChanges,
  scheduleGuestSearchReload,
  scheduleSearchResultsRefresh,
  stopSearchResultsObserver,
} from './page.js';
import { isSearchPage } from './page-state.js';

let headerObserver = null;
let subscribed = false;
let navigationWatched = false;
let initialized = false;

function restartHeaderObserver() {
  headerObserver?.disconnect();
  const observer = new MutationObserver(() => {
    mountSearchControls();
  });
  headerObserver = observer;
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export function syncSearchGuestMode() {
  const search = getSettings().search;
  document.documentElement.classList.toggle('srbb-search-guest', search.suggestEnabled);
  document.documentElement.classList.toggle(
    'srbb-search-page-guest',
    search.pageEnabled,
  );

  if (!search.suggestEnabled) {
    document.getElementById('srbb-suggest')?.remove();
    hideSuggestDropdown();
    resetSuggestState();
  }
  if (!search.pageEnabled) clearGuestSearchPageState();
}

function initialSearchPageSync() {
  if (!isSearchPage()) return;
  if (getSettings().search.pageEnabled) {
    scheduleGuestSearchReload();
  } else {
    scheduleSearchResultsRefresh({ immediate: true });
  }
}

export function initSearchFeature() {
  restartHeaderObserver();
  mountSearchControls();
  if (initialized) stopSearchResultsObserver();
  observeSearchResultsChanges();
  syncSearchGuestMode();
  initialSearchPageSync();
  initialized = true;

  if (!navigationWatched) {
    navigationWatched = true;
    watchStoreNavigation(() => {
      if (isSearchPage()) {
        if (getSettings().search.pageEnabled) scheduleGuestSearchReload();
        else scheduleSearchResultsRefresh();
      } else {
        hideSuggestDropdown();
      }
    });
  }

  if (subscribed) return;
  subscribed = true;
  on('settings:search', ({ previous, next } = {}) => {
    if (!previous || !next) return;
    syncSearchGuestMode();
    if (next.suggestEnabled && !previous.suggestEnabled) {
      mountSearchControls();
    }
    if (previous.pageEnabled !== next.pageEnabled) {
      if (!next.pageEnabled) clearGuestSearchPageState();
      else if (isSearchPage()) scheduleGuestSearchReload({ immediate: true });
    }
    if (
      isSearchPage() &&
      (previous.markBlocked !== next.markBlocked ||
        previous.rememberBlocked !== next.rememberBlocked ||
        previous.probeEnabled !== next.probeEnabled ||
        previous.probeScope !== next.probeScope)
    ) {
      scheduleSearchResultsRefresh();
    }
  });
  on('region:injected', () => {
    restartHeaderObserver();
    mountSearchControls();
    if (isSearchPage() && getSettings().search.pageEnabled) {
      scheduleGuestSearchReload({ immediate: true });
    }
  });
}
