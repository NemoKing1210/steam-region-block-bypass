import {
  CACHE_MINUTES_MAX,
  CACHE_MAX_ENTRIES_CAP,
} from '../constants.js';
import { state } from '../state.js';
import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import {
  normalizeCacheMinutes,
  normalizeCacheMaxEntries,
  saveSettings,
} from '../settings.js';
import {
  buildCacheMeterHtml,
  buildCacheTabBadgeHtml,
  buildCacheListHtml,
  paintCacheMeter,
  paintCacheList,
  getCacheUsageStats,
  clearPageCache,
  removePageCacheEntry,
  pruneDisabledCacheCategories,
} from '../cache.js';
import { clearBlockedApps, getBlockedAppsCount, listBlockedAppsEntries } from '../blocked-apps.js';
import { buildAppHref } from './suggest.js';
import { showToast, toastSettingChanged } from './toast.js';

export function buildCacheTabButtonHtml() {
  return `<button type="button" class="srbb-panel__tab" role="tab" data-srbb-tab="cache" aria-selected="false">${escapeHtml(t('tabCache'))}${buildCacheTabBadgeHtml()}</button>`;
}

export function buildBlockedAppsListHtml() {
  const entries = listBlockedAppsEntries();
  const count = entries.length;
  const countLabel = escapeHtml(t('blockedAppsCount', { count }));
  if (!entries.length) {
    return `<div class="srbb-blocked-list" data-srbb-blocked-list>
      <div class="srbb-blocked-list__empty">${escapeHtml(t('blockedAppsEmpty'))}</div>
    </div>`;
  }
  const rows = entries
    .map((entry) => {
      const label = entry.name || t('blockedAppUntitled', { id: entry.id });
      const href = buildAppHref(entry.id, entry.name);
      return `
        <a class="srbb-blocked-list__item" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
          <span class="srbb-blocked-list__name">${escapeHtml(label)}</span>
          <span class="srbb-blocked-list__id">${escapeHtml(entry.id)}</span>
        </a>`;
    })
    .join('');
  return `<div class="srbb-blocked-list" data-srbb-blocked-list>
    <div class="srbb-blocked-list__count">${countLabel}</div>
    ${rows}
  </div>`;
}

export function paintBlockedAppsList(root) {
  const current = root?.querySelector?.('[data-srbb-blocked-list]');
  if (!current) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = buildBlockedAppsListHtml().trim();
  const next = wrap.firstElementChild;
  if (next) current.replaceWith(next);
}

export function buildCachePaneHtml() {
  return `
      <div class="srbb-panel__tabpane" data-srbb-pane="cache" role="tabpanel" hidden>
        <div class="srbb-panel__section">
          <div class="srbb-panel__section-title">${escapeHtml(t('sectionCache'))}</div>
          <p class="srbb-hint" style="padding-top:0">${escapeHtml(t('sectionCacheHint'))}</p>
          ${buildCacheMeterHtml()}
        </div>

        <div class="srbb-panel__section">
          <div class="srbb-panel__section-title">${escapeHtml(t('sectionCacheDuration'))}</div>
          <label class="srbb-field">
            <span class="srbb-field__label">${escapeHtml(t('cacheMinutes'))}</span>
            <input type="number" id="srbb-cache-minutes" min="0" max="${CACHE_MINUTES_MAX}" step="1" placeholder="60" inputmode="numeric" />
          </label>
          <p class="srbb-hint">${escapeHtml(t('cacheMinutesHint'))}</p>
        </div>

        <div class="srbb-panel__section">
          <div class="srbb-panel__section-title">${escapeHtml(t('sectionCacheLimit'))}</div>
          <label class="srbb-field">
            <span class="srbb-field__label">${escapeHtml(t('cacheMaxEntries'))}</span>
            <input type="number" id="srbb-cache-max-entries" min="1" max="${CACHE_MAX_ENTRIES_CAP}" step="1" placeholder="30" inputmode="numeric" />
          </label>
          <p class="srbb-hint">${escapeHtml(t('cacheMaxEntriesHint'))}</p>
        </div>

        <div class="srbb-panel__section">
          <div class="srbb-panel__section-title">${escapeHtml(t('sectionCacheSources'))}</div>
          <p class="srbb-hint" style="padding-top:0">${escapeHtml(t('sectionCacheSourcesHint'))}</p>
          <div class="srbb-panel__section srbb-panel__section--row" style="padding-left:0;padding-right:0">
            <label class="srbb-switch">
              <input type="checkbox" id="srbb-cache-app-pages" />
              <span class="srbb-switch__track"></span>
              <span class="srbb-switch__label">${escapeHtml(t('cacheAppPages'))}</span>
            </label>
          </div>
          <p class="srbb-hint" style="padding-top:0">${escapeHtml(t('cacheAppPagesHint'))}</p>
          <div class="srbb-panel__section srbb-panel__section--row" style="padding-left:0;padding-right:0">
            <label class="srbb-switch">
              <input type="checkbox" id="srbb-cache-search-pages" />
              <span class="srbb-switch__track"></span>
              <span class="srbb-switch__label">${escapeHtml(t('cacheSearchPages'))}</span>
            </label>
          </div>
          <p class="srbb-hint" style="padding-top:0">${escapeHtml(t('cacheSearchPagesHint'))}</p>
        </div>

        <div class="srbb-panel__section">
          <div class="srbb-panel__section-title">${escapeHtml(t('sectionCacheContents'))}</div>
          <p class="srbb-hint" style="padding-top:0">${escapeHtml(t('sectionCacheContentsHint'))}</p>
          ${buildCacheListHtml()}
        </div>

        <div class="srbb-panel__section">
          <div class="srbb-panel__section-title">${escapeHtml(t('sectionCacheBlocked'))}</div>
          <p class="srbb-hint" style="padding-top:0">${escapeHtml(t('sectionCacheBlockedHint'))}</p>
          ${buildBlockedAppsListHtml()}
        </div>

        <div class="srbb-panel__section">
          <div class="srbb-panel__section-title">${escapeHtml(t('sectionCacheClear'))}</div>
          <div class="srbb-cache-clear-actions">
            <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="clear-page-cache">${escapeHtml(t('clearPageCache'))}</button>
            <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="clear-blocked-cache">${escapeHtml(t('clearBlockedApps'))}</button>
            <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="clear-all-cache">${escapeHtml(t('clearAllCache'))}</button>
          </div>
          <p class="srbb-hint">${escapeHtml(t('sectionCacheClearHint'))}</p>
        </div>
      </div>`;
}

function readCacheDraft(panel) {
  return {
    cacheAppPages: !!panel.querySelector('#srbb-cache-app-pages')?.checked,
    cacheSearchPages: !!panel.querySelector('#srbb-cache-search-pages')?.checked,
  };
}

function previewCacheMeterFromDraft(panel) {
  const draft = readCacheDraft(panel);
  paintCacheMeter(panel, getCacheUsageStats(draft));
}

export function refreshCachePane(panel) {
  if (!panel) return;
  paintCacheMeter(panel);
  paintCacheList(panel);
  paintBlockedAppsList(panel);
  syncCacheClearButtons(panel);
}

export function syncCacheClearButtons(panel) {
  if (!panel) return;
  const stats = getCacheUsageStats();
  const pageBtn = panel.querySelector('[data-srbb="clear-page-cache"]');
  const blockedBtn = panel.querySelector('[data-srbb="clear-blocked-cache"]');
  const allBtn = panel.querySelector('[data-srbb="clear-all-cache"]');
  const pageCount = stats.pageCount || 0;
  const blockedCount = getBlockedAppsCount();
  if (pageBtn) pageBtn.disabled = pageCount === 0;
  if (blockedBtn) blockedBtn.disabled = blockedCount === 0;
  if (allBtn) allBtn.disabled = pageCount === 0 && blockedCount === 0;
}

export function fillCachePane(panel) {
  if (!panel) return;
  const minutes = panel.querySelector('#srbb-cache-minutes');
  const maxEntries = panel.querySelector('#srbb-cache-max-entries');
  const appPages = panel.querySelector('#srbb-cache-app-pages');
  const searchPages = panel.querySelector('#srbb-cache-search-pages');
  if (minutes) minutes.value = String(normalizeCacheMinutes(state.settings.cacheMinutes));
  if (maxEntries) {
    maxEntries.value = String(normalizeCacheMaxEntries(state.settings.cacheMaxEntries));
  }
  if (appPages) appPages.checked = state.settings.cacheAppPages !== false;
  if (searchPages) searchPages.checked = state.settings.cacheSearchPages !== false;
  refreshCachePane(panel);
}

export function readCachePaneSettings(panel) {
  if (!panel) return {};
  return {
    cacheMinutes: normalizeCacheMinutes(panel.querySelector('#srbb-cache-minutes')?.value),
    cacheMaxEntries: normalizeCacheMaxEntries(
      panel.querySelector('#srbb-cache-max-entries')?.value
    ),
    cacheAppPages: !!panel.querySelector('#srbb-cache-app-pages')?.checked,
    cacheSearchPages: !!panel.querySelector('#srbb-cache-search-pages')?.checked,
  };
}

export function applyCachePaneOnSave(panel) {
  const next = readCachePaneSettings(panel);
  pruneDisabledCacheCategories(next);
  return next;
}

export function bindCachePane(panel) {
  if (!panel || panel.dataset.srbbCacheBound === '1') return;
  panel.dataset.srbbCacheBound = '1';

  for (const id of ['#srbb-cache-app-pages', '#srbb-cache-search-pages']) {
    panel.querySelector(id)?.addEventListener('change', () => {
      previewCacheMeterFromDraft(panel);
      const draft = readCacheDraft(panel);
      const key = id === '#srbb-cache-app-pages' ? 'cacheAppPages' : 'cacheSearchPages';
      const label = key === 'cacheAppPages' ? t('cacheAppPages') : t('cacheSearchPages');
      saveSettings({ [key]: draft[key] });
      pruneDisabledCacheCategories();
      refreshCachePane(panel);
      toastSettingChanged(label, draft[key], { id: `srbb-setting-${key}` });
    });
  }

  panel.addEventListener('click', (e) => {
    const removeBtn = e.target.closest?.('[data-srbb="cache-remove"]');
    if (removeBtn) {
      e.preventDefault();
      const raw = removeBtn.getAttribute('data-srbb-cache-key');
      let key = '';
      try {
        key = raw ? decodeURIComponent(raw) : '';
      } catch {
        key = raw || '';
      }
      if (key && removePageCacheEntry(key)) {
        refreshCachePane(panel);
        showToast({
          title: t('toastCacheEntryRemoved'),
          kind: 'success',
          id: 'srbb-cache-entry-removed',
        });
      }
      return;
    }

    const clearPages = e.target.closest?.('[data-srbb="clear-page-cache"]');
    if (clearPages) {
      e.preventDefault();
      const removed = clearPageCache();
      refreshCachePane(panel);
      showToast({
        title: t('toastPageCacheCleared'),
        message: t('toastCacheRemovedCount', { count: removed }),
        kind: 'success',
        id: 'srbb-page-cache-cleared',
      });
      return;
    }

    const clearBlocked = e.target.closest?.('[data-srbb="clear-blocked-cache"]');
    if (clearBlocked) {
      e.preventDefault();
      const count = getBlockedAppsCount();
      clearBlockedApps();
      refreshCachePane(panel);
      showToast({
        title: t('toastBlockedCleared'),
        message: t('toastCacheRemovedCount', { count }),
        kind: 'success',
        id: 'srbb-blocked-cleared',
      });
      return;
    }

    const clearAll = e.target.closest?.('[data-srbb="clear-all-cache"]');
    if (clearAll) {
      e.preventDefault();
      const pagesRemoved = clearPageCache();
      const blockedCount = getBlockedAppsCount();
      clearBlockedApps();
      const total = pagesRemoved + blockedCount;
      refreshCachePane(panel);
      showToast({
        title: t('toastAllCacheCleared'),
        message: t('toastCacheRemovedCount', { count: total }),
        kind: 'success',
        id: 'srbb-all-cache-cleared',
      });
    }
  });
}
