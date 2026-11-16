import { SUGGEST_RESULT_COUNT } from '../../core/constants.js';
import { getSettings } from '../../core/settings.js';
import {
  isBlockedApp,
  prepareSuggestItems,
  touchBlockedAppName,
} from '../../core/blocked-apps.js';
import { t } from '../../i18n/index.js';
import { getSteamStoreLanguage, getStoreCountryCode } from '../../region/request.js';
import { fetchSuggestItems } from './api.js';
import {
  buildSuggestMessageHtml,
  buildSuggestSkeletonHtml,
  renderSuggestItemHtml,
} from './render.js';
import { probeSuggestBlocked } from './probe.js';
import { ensureSettingsButton } from '../settings/index.js';
import { switchPanelPage, togglePanel } from '../settings/panel.js';
import {
  ensureSuggestDropdown,
  getSearchForm,
  getSearchInput,
  getSearchMount,
} from './suggest-dom.js';

let suggestToken = 0;
let suggestDebounceTimer = null;
let activeSuggestIndex = -1;
let lastSuggestItems = [];

export function getSuggestToken() {
  return suggestToken;
}

export function getLastSuggestItems() {
  return lastSuggestItems;
}

export function openSearchSettings() {
  hideSuggestDropdown();
  void ensureSettingsButton().then(() => {
    togglePanel(true);
    switchPanelPage('search');
  });
}

export function mountSearchControls() {
  const form = getSearchForm();
  if (!form) return;
  const mount = getSearchMount(form);
  if (mount) mount.classList.add('srbb-search-mount');
  ensureSuggestDropdown(mount, openSearchSettings);
  bindSearchInput(form);
}

export function hideSuggestStats() {
  const stats = document.getElementById('srbb-suggest-stats');
  if (stats) stats.hidden = true;
}

export function setSuggestStats(available, blocked) {
  const stats = document.getElementById('srbb-suggest-stats');
  const availableEl = document.getElementById('srbb-suggest-stat-available');
  const blockedEl = document.getElementById('srbb-suggest-stat-blocked');
  if (!stats || !availableEl || !blockedEl) return;
  availableEl.textContent = t('suggestStatAvailable', { count: available });
  blockedEl.textContent = t('suggestStatBlocked', { count: blocked });
  stats.hidden = false;
}

export function updateSuggestStats(items) {
  if (!items || !items.length) {
    hideSuggestStats();
    return;
  }
  let blocked = 0;
  for (const item of items) {
    if (item.regionBlocked || isBlockedApp(item.id)) blocked += 1;
  }
  setSuggestStats(items.length - blocked, blocked);
}

export function refreshSuggestStatsFromDom() {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return;
  const rows = [...panel.querySelectorAll('.srbb-suggest__item')];
  if (!rows.length) {
    hideSuggestStats();
    return;
  }
  const blocked = rows.filter((el) =>
    el.classList.contains('srbb-suggest__item--blocked'),
  ).length;
  setSuggestStats(rows.length - blocked, blocked);
}

export function updateSuggestProbeProgress(progress) {
  const bar = document.getElementById('srbb-suggest-probe');
  const fill = document.getElementById('srbb-suggest-probe-fill');
  const label = document.getElementById('srbb-suggest-probe-label');
  if (!bar || !fill || !label) return;

  if (!progress || !progress.total) {
    bar.hidden = true;
    return;
  }
  bar.hidden = false;
  const pct = Math.round((progress.done / progress.total) * 100);
  fill.style.width = `${pct}%`;
  label.textContent = t('probeProgress', {
    done: progress.done,
    total: progress.total,
  });
}

export function finishSuggestProbe(found) {
  const bar = document.getElementById('srbb-suggest-probe');
  const fill = document.getElementById('srbb-suggest-probe-fill');
  const label = document.getElementById('srbb-suggest-probe-label');
  if (!bar || !fill || !label) return;
  if (found > 0) {
    bar.hidden = false;
    fill.style.width = '100%';
    label.textContent = t('probeFound', { count: found });
    window.setTimeout(() => {
      if (label.textContent === t('probeFound', { count: found })) bar.hidden = true;
    }, 2200);
  } else {
    bar.hidden = true;
  }
}

export function findSuggestItemByAppId(appId) {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return null;
  const id = String(appId);
  return (
    [...panel.querySelectorAll('.srbb-suggest__item[data-srbb-app-id]')].find(
      (el) => el.getAttribute('data-srbb-app-id') === id,
    ) || null
  );
}

export function setSuggestItemProbing(appId, probing) {
  const el = findSuggestItemByAppId(appId);
  if (!el) return;
  el.classList.toggle('srbb-suggest__item--probing', !!probing);
  const spin = el.querySelector('.srbb-suggest__probe-spin');
  if (spin) spin.hidden = !probing;
}

export function markSuggestItemBlockedLive(appId) {
  const el = findSuggestItemByAppId(appId);
  if (!el) return;
  el.classList.add('srbb-suggest__item--blocked');
  const titleRow = el.querySelector('.srbb-suggest__title-row');
  if (titleRow && !titleRow.querySelector('.srbb-suggest__blocked-badge')) {
    const badge = document.createElement('span');
    badge.className = 'srbb-suggest__blocked-badge';
    badge.textContent = t('suggestRegionBlocked');
    titleRow.appendChild(badge);
  }
  const id = String(appId);
  if (lastSuggestItems.length) {
    lastSuggestItems = lastSuggestItems.map((item) =>
      String(item.id) === id ? { ...item, regionBlocked: true } : item,
    );
    updateSuggestStats(lastSuggestItems);
  } else {
    refreshSuggestStatsFromDom();
  }
}

export function clearSearchInput(input) {
  if (!input) return;
  input.value = '';
  if (suggestDebounceTimer) {
    window.clearTimeout(suggestDebounceTimer);
    suggestDebounceTimer = null;
  }
  suggestToken += 1;
  hideSuggestDropdown();
}

export function bindSearchInput(form) {
  if (!form || form.dataset.srbbBound === '1') return;
  const input = getSearchInput(form);
  if (!input) return;
  form.dataset.srbbBound = '1';

  input.addEventListener('input', () => {
    handleSuggestInput(input);
  });
  input.addEventListener('focus', () => {
    if (getSettings().search.suggestEnabled) {
      handleSuggestInput(input, { fromFocus: true });
    }
  });
  input.addEventListener('blur', () => {
    window.setTimeout(() => hideSuggestDropdown(), 150);
  });
  input.addEventListener('keydown', (event) => handleSearchKeydown(event, input));

  form.addEventListener('submit', (event) => {
    if (!getSettings().search.suggestEnabled) return;
    event.preventDefault();
    event.stopPropagation();
    const term = input.value.trim();
    const url = new URL('https://store.steampowered.com/search/');
    if (term) url.searchParams.set('term', term);
    url.searchParams.set('l', getSteamStoreLanguage());
    url.searchParams.set('cc', getStoreCountryCode().toLowerCase());
    url.searchParams.set('ignore_preferences', '1');
    hideSuggestDropdown();
    location.href = url.toString();
  });
}

export function handleSuggestInput(input, options = {}) {
  if (!getSettings().search.suggestEnabled) return;
  const term = input.value.trim();
  if (!term) {
    if (suggestDebounceTimer) {
      window.clearTimeout(suggestDebounceTimer);
      suggestDebounceTimer = null;
    }
    suggestToken += 1;
    if (options.fromFocus) {
      showSuggestMessage(t('suggestEmpty'));
      showSuggestDropdown();
    } else {
      hideSuggestDropdown();
    }
    return;
  }

  if (suggestDebounceTimer) window.clearTimeout(suggestDebounceTimer);
  suggestDebounceTimer = window.setTimeout(() => {
    void fetchGuestSuggestions(term);
  }, 550);
}

export async function fetchGuestSuggestions(term) {
  const token = ++suggestToken;
  updateSuggestProbeProgress(null);
  showSuggestSkeleton(Math.min(8, SUGGEST_RESULT_COUNT));

  try {
    const result = await fetchSuggestItems(term, {
      isCancelled: () => token !== suggestToken,
    });
    if (!result || token !== suggestToken) return;
    if (result.empty) {
      showSuggestMessage(t('suggestNoResults'));
      return;
    }

    const items = result.items;
    items.forEach((item) => {
      if (isBlockedApp(item.id)) touchBlockedAppName(item.id, item.name);
    });
    lastSuggestItems = items;
    renderSuggestItems(prepareSuggestItems(items));
    void probeSuggestBlocked(items, {
      isCancelled: () => token !== suggestToken,
      onProgress: (progress) => {
        if (token !== suggestToken) return;
        updateSuggestProbeProgress(progress);
      },
      onItemStart: (app) => {
        if (token !== suggestToken) return;
        setSuggestItemProbing(app.id, true);
      },
      onItemDone: (app) => {
        if (token !== suggestToken) return;
        setSuggestItemProbing(app.id, false);
      },
      onBlocked: (app) => {
        if (token !== suggestToken) return;
        markSuggestItemBlockedLive(app.id);
      },
      onCancel: () => {
        if (token === suggestToken) updateSuggestProbeProgress(null);
      },
    }).then((probeResult) => {
      if (!probeResult || token !== suggestToken) return;
      finishSuggestProbe(probeResult.found);
      if (probeResult.found > 0 && lastSuggestItems.length) {
        lastSuggestItems = lastSuggestItems.map((item) => ({
          ...item,
          regionBlocked: isBlockedApp(item.id),
        }));
        updateSuggestStats(lastSuggestItems);
      }
    });
  } catch (error) {
    if (token !== suggestToken) return;
    showSuggestMessage(
      t('suggestFailed', {
        error: error && error.message ? error.message : String(error),
      }),
    );
  }
}

export function renderSuggestItems(items) {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return;
  activeSuggestIndex = -1;
  const inner = panel.querySelector('.srbb-suggest__inner');
  if (!inner) return;

  panel.removeAttribute('aria-busy');
  panel.removeAttribute('aria-label');
  inner.innerHTML = items.map((item, index) => renderSuggestItemHtml(item, index)).join('');
  inner.querySelectorAll('.srbb-suggest__item').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      setActiveSuggestItem(Number(el.dataset.srbbSuggestIndex));
    });
  });
  updateSuggestStats(items);
  showSuggestDropdown();
}

export function showSuggestSkeleton(count = 5) {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return;
  const inner = panel.querySelector('.srbb-suggest__inner');
  if (!inner) return;
  activeSuggestIndex = -1;
  inner.innerHTML = buildSuggestSkeletonHtml(count);
  panel.setAttribute('aria-busy', 'true');
  panel.setAttribute('aria-label', t('suggestLoading'));
  hideSuggestStats();
  showSuggestDropdown();
}

export function showSuggestMessage(message) {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return;
  const inner = panel.querySelector('.srbb-suggest__inner');
  if (!inner) return;
  activeSuggestIndex = -1;
  panel.removeAttribute('aria-busy');
  panel.removeAttribute('aria-label');
  inner.innerHTML = buildSuggestMessageHtml(message);
  hideSuggestStats();
  showSuggestDropdown();
}

export function showSuggestDropdown() {
  const panel = document.getElementById('srbb-suggest');
  if (!panel || !getSettings().search.suggestEnabled) return;
  panel.hidden = false;
  panel.classList.add('is-open');
}

export function hideSuggestDropdown() {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return;
  panel.hidden = true;
  panel.classList.remove('is-open');
  panel.removeAttribute('aria-busy');
  panel.removeAttribute('aria-label');
  activeSuggestIndex = -1;
  panel.querySelectorAll('.srbb-suggest__item.is-active').forEach((el) => {
    el.classList.remove('is-active');
  });
  updateSuggestProbeProgress(null);
}

export function setActiveSuggestItem(index) {
  const panel = document.getElementById('srbb-suggest');
  if (!panel) return;
  const items = [...panel.querySelectorAll('.srbb-suggest__item')];
  if (!items.length) return;
  activeSuggestIndex = Math.max(0, Math.min(index, items.length - 1));
  items.forEach((el, i) =>
    el.classList.toggle('is-active', i === activeSuggestIndex),
  );
}

export function handleSearchKeydown(event, input) {
  if (event.key === 'Escape') {
    const panel = document.getElementById('srbb-suggest');
    const suggestOpen = !!(panel && !panel.hidden);
    if (suggestOpen) {
      event.preventDefault();
      hideSuggestDropdown();
      return;
    }
    if (input.value) {
      event.preventDefault();
      clearSearchInput(input);
      return;
    }
    input.blur();
    return;
  }

  if (!getSettings().search.suggestEnabled) return;
  const panel = document.getElementById('srbb-suggest');
  if (!panel || panel.hidden) return;
  const items = [...panel.querySelectorAll('.srbb-suggest__item')];
  if (!items.length) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setActiveSuggestItem(activeSuggestIndex + 1);
    showSuggestDropdown();
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    setActiveSuggestItem(activeSuggestIndex <= 0 ? items.length - 1 : activeSuggestIndex - 1);
    showSuggestDropdown();
    return;
  }
  if (event.key === 'Enter' && activeSuggestIndex >= 0) {
    event.preventDefault();
    const target = items[activeSuggestIndex];
    if (target?.href) location.href = target.href;
  }
}

export function resetSuggestState() {
  suggestToken += 1;
  if (suggestDebounceTimer) {
    window.clearTimeout(suggestDebounceTimer);
    suggestDebounceTimer = null;
  }
  activeSuggestIndex = -1;
  lastSuggestItems = [];
}
