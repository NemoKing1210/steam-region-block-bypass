import {
  SCRIPT_VERSION,
  getDefaults,
} from '../../core/constants.js';
import { configureLocale } from '../../i18n/index.js';
import { emit, on } from '../../core/bus.js';
import { getSettings, saveSettings } from '../../core/settings.js';
import { t } from '../../i18n/index.js';
import {
  buildCacheTabBadgeHtml,
  clearPageCache,
  getCacheUsageStats,
  pruneDisabledCacheCategories,
  removePageCacheEntry,
} from '../../core/page-cache.js';
import {
  clearBlockedApps,
  getBlockedAppsCount,
} from '../../core/blocked-apps.js';
import { bypassRegionBlock } from '../../region/bypass.js';
import { el } from '../../utils/dom.js';
import { lockPageScroll, unlockPageScroll } from '../../utils/scrollLock.js';
import { showToast } from '../../ui/toast.js';
import { confirmDialog } from './confirm.js';
import { getIconSvg } from './controls.js';

const pages = new Map();
let activePageId = null;
let panelOpen = false;
let draft = null;
let escapeListenerInstalled = false;
let guardInstalled = false;
let languageSubscribed = false;
let blockedSubscribed = false;

export function getScriptVersion() {
  return SCRIPT_VERSION;
}

export function registerPage(page) {
  if (!page?.id || typeof page.renderInto !== 'function') return;
  pages.set(page.id, page);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildHomeView() {
  const home = el('div', 'srbb-panel__view srbb-panel__home');
  const list = el('nav', 'srbb-panel__nav');
  list.setAttribute('aria-label', t('menuSettings'));

  for (const [id, page] of pages) {
    const item = el('button', 'srbb-panel__nav-item');
    item.type = 'button';

    if (page.icon && getIconSvg(page.icon)) {
      const icon = el('span', 'srbb-panel__nav-icon');
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = getIconSvg(page.icon);
      item.appendChild(icon);
    }

    const text = el('span', 'srbb-panel__nav-text');
    text.appendChild(el('span', 'srbb-panel__nav-title', t(page.titleKey)));
    if (page.descKey) {
      text.appendChild(el('span', 'srbb-panel__nav-desc', t(page.descKey)));
    }
    item.appendChild(text);

    if (id === 'cache') {
      const badge = el('span', 'srbb-panel__nav-badge');
      badge.innerHTML = buildCacheTabBadgeHtml(getCacheUsageStats(draft));
      item.appendChild(badge);
    }
    item.appendChild(el('span', 'srbb-panel__nav-chevron', '›'));
    item.addEventListener('click', () => switchPanelPage(id));
    list.appendChild(item);
  }

  home.appendChild(list);
  return home;
}

function buildPageView(id) {
  const page = pages.get(id);
  if (!page) return buildHomeView();

  const view = el('div', 'srbb-panel__view srbb-panel__page');
  const crumb = el('div', 'srbb-panel__crumb');
  const back = el('button', 'srbb-panel__back', `‹ ${t('panelBack')}`);
  back.type = 'button';
  back.setAttribute('aria-label', t('panelBack'));
  back.addEventListener('click', showHome);
  crumb.append(back, el('span', 'srbb-panel__crumb-title', t(page.titleKey)));
  view.appendChild(crumb);

  const content = el('div', 'srbb-panel__page-content');
  page.renderInto(content, draft);
  view.appendChild(content);
  return view;
}

function mountView(body, view, direction) {
  body.dataset.srbbDir = direction;
  body.replaceChildren(view);
  body.scrollTop = 0;
}

function renderCurrentView() {
  const overlay = document.getElementById('srbb-panel-overlay');
  if (!overlay || !draft) return;
  const body = overlay.querySelector('.srbb-panel__body');
  const view = activePageId ? buildPageView(activePageId) : buildHomeView();
  mountView(body, view, activePageId ? 'fwd' : 'back');
}

export function showHome() {
  activePageId = null;
  renderCurrentView();
}

export function switchPanelPage(id) {
  const overlay = document.getElementById('srbb-panel-overlay');
  if (!overlay || !pages.has(id) || !draft || id === activePageId) return;
  activePageId = id;
  renderCurrentView();
}

export function refreshPanelDraft() {
  if (!draft) return;
  draft = clone(getSettings());
  renderCurrentView();
}

function changedSection(name, previous, next) {
  return JSON.stringify(previous[name]) !== JSON.stringify(next[name]);
}

function persistPanelForm() {
  if (!draft) return;
  const previous = getSettings();
  const saved = saveSettings({
    language: draft.language,
    region: draft.region,
    search: draft.search,
    cache: draft.cache,
    toasts: draft.toasts,
  });
  configureLocale(saved.language);

  if (changedSection('language', previous, saved)) {
    emit('settings:language', {
      previous: previous.language,
      next: saved.language,
    });
  }
  for (const section of ['region', 'search', 'cache', 'toasts']) {
    if (!changedSection(section, previous, saved)) continue;
    if (section === 'cache') pruneDisabledCacheCategories(saved);
    emit(`settings:${section}`, {
      previous: previous[section],
      next: saved[section],
    });
  }
  showToast({
    type: 'success',
    title: t('toastSettingsSaved'),
    key: 'srbb-settings-saved',
  });
}

function isCacheTabOpen() {
  return activePageId === 'cache';
}

function repaintCache() {
  renderCurrentView();
}

function wireCacheActions(overlay) {
  overlay.addEventListener('click', (event) => {
    const remove = event.target.closest?.('[data-srbb-action="cache-remove"]');
    if (remove) {
      event.preventDefault();
      const raw = remove.getAttribute('data-srbb-cache-key');
      let key = '';
      try {
        key = raw ? decodeURIComponent(raw) : '';
      } catch {
        key = raw || '';
      }
      if (key && removePageCacheEntry(key)) {
        showToast({
          type: 'success',
          title: t('toastCacheEntryRemoved'),
          key: 'srbb-cache-entry-removed',
        });
        if (isCacheTabOpen()) repaintCache();
      }
      return;
    }

    if (event.target.closest?.('[data-srbb-action="clear-page-cache"]')) {
      event.preventDefault();
      const removed = clearPageCache();
      showToast({
        type: 'success',
        title: t('toastPageCacheCleared'),
        message: t('toastCacheRemovedCount', { count: removed }),
        key: 'srbb-page-cache-cleared',
      });
      if (isCacheTabOpen()) repaintCache();
      return;
    }

    if (event.target.closest?.('[data-srbb-action="clear-blocked-apps"]')) {
      event.preventDefault();
      const count = getBlockedAppsCount();
      clearBlockedApps();
      showToast({
        type: 'success',
        title: t('toastBlockedCleared'),
        message: t('toastCacheRemovedCount', { count }),
        key: 'srbb-blocked-cleared',
      });
      if (isCacheTabOpen()) repaintCache();
      return;
    }

    if (event.target.closest?.('[data-srbb-action="clear-all-cache"]')) {
      event.preventDefault();
      const pagesRemoved = clearPageCache();
      const blockedCount = getBlockedAppsCount();
      clearBlockedApps();
      showToast({
        type: 'success',
        title: t('toastAllCacheCleared'),
        message: t('toastCacheRemovedCount', {
          count: pagesRemoved + blockedCount,
        }),
        key: 'srbb-all-cache-cleared',
      });
      if (isCacheTabOpen()) repaintCache();
    }
  });
}

function ensurePanel() {
  if (document.getElementById('srbb-panel-overlay')) return;

  const overlay = el('div', 'srbb-panel-overlay');
  overlay.id = 'srbb-panel-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'presentation');

  const panel = el('div', 'srbb-panel');
  panel.id = 'srbb-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', t('panelTitle'));

  const header = el('div', 'srbb-panel__header');
  const titleBlock = el('div');
  const titleRow = el('div', 'srbb-panel__title-row');
  const title = el('div', 'srbb-panel__title', t('panelTitle'));
  title.dataset.srbbI18n = 'panelTitle';
  titleRow.appendChild(title);
  titleRow.appendChild(el('span', 'srbb-panel__version', `v${SCRIPT_VERSION}`));
  titleBlock.appendChild(titleRow);
  const subtitle = el('div', 'srbb-panel__subtitle', t('panelSubtitle'));
  subtitle.dataset.srbbI18n = 'panelSubtitle';
  titleBlock.appendChild(subtitle);
  header.appendChild(titleBlock);
  const closeButton = el('button', 'srbb-panel__close', '×');
  closeButton.type = 'button';
  closeButton.dataset.srbbAction = 'close';
  closeButton.setAttribute('aria-label', t('close'));
  closeButton.dataset.srbbI18nAria = 'close';
  header.appendChild(closeButton);

  const body = el('div', 'srbb-panel__body');

  const footer = el('div', 'srbb-panel__footer');
  const footerActions = el('div', 'srbb-panel__footer-actions');
  const resetButton = el('button', 'srbb-btn srbb-btn--danger', t('reset'));
  resetButton.type = 'button';
  resetButton.dataset.srbbAction = 'reset';
  resetButton.dataset.srbbI18n = 'reset';
  resetButton.style.marginRight = 'auto';
  const cancelButton = el('button', 'srbb-btn srbb-btn--ghost', t('cancel'));
  cancelButton.type = 'button';
  cancelButton.dataset.srbbAction = 'close';
  cancelButton.dataset.srbbI18n = 'cancel';
  const saveButton = el('button', 'srbb-btn', t('save'));
  saveButton.type = 'button';
  saveButton.dataset.srbbAction = 'save';
  saveButton.dataset.srbbI18n = 'save';
  const saveReloadButton = el('button', 'srbb-btn srbb-btn--green', t('saveReload'));
  saveReloadButton.type = 'button';
  saveReloadButton.dataset.srbbAction = 'save-reload';
  saveReloadButton.dataset.srbbI18n = 'saveReload';
  footerActions.append(resetButton, cancelButton, saveButton, saveReloadButton);
  footer.appendChild(footerActions);

  panel.append(header, body, footer);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  wireCacheActions(overlay);
  syncPanelLabels();
  if (!languageSubscribed) {
    languageSubscribed = true;
    on('settings:language', () => {
      syncPanelLabels();
      if (panelOpen) renderCurrentView();
    });
  }
  if (!blockedSubscribed) {
    blockedSubscribed = true;
    on('blocked:changed', () => {
      if (panelOpen && activePageId === 'cache') renderCurrentView();
    });
  }

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      togglePanel(false);
      return;
    }
    if (event.target.closest?.('[data-srbb-action="close"]')) {
      togglePanel(false);
      return;
    }
    if (event.target.closest?.('[data-srbb-action="save"]')) {
      persistPanelForm();
      togglePanel(false);
      return;
    }
    if (event.target.closest?.('[data-srbb-action="save-reload"]')) {
      persistPanelForm();
      togglePanel(false);
      if (
        getSettings().region.enabled &&
        document.documentElement.classList.contains('srbb-region-injected')
      ) {
        void bypassRegionBlock({ forceRefresh: true });
      } else {
        location.reload();
      }
      return;
    }
    if (event.target.closest?.('[data-srbb-action="reset"]')) {
      void confirmDialog({
        title: t('reset'),
        message: t('resetConfirm'),
        confirmLabel: t('reset'),
      }).then((confirmed) => {
        if (!confirmed || !draft) return;
        draft = getDefaults();
        renderCurrentView();
      });
    }
  });
}

function syncPanelLabels() {
  const overlay = document.getElementById('srbb-panel-overlay');
  if (!overlay) return;
  overlay.querySelectorAll('[data-srbb-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.srbbI18n);
  });
  overlay.querySelectorAll('[data-srbb-i18n-aria]').forEach((node) => {
    node.setAttribute('aria-label', t(node.dataset.srbbI18nAria));
  });
  overlay.querySelector('.srbb-panel')?.setAttribute('aria-label', t('panelTitle'));
}

function installEscapeClose() {
  if (escapeListenerInstalled) return;
  escapeListenerInstalled = true;
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !panelOpen) return;
    if (activePageId) showHome();
    else togglePanel(false);
  });
}

function isEventInsidePanelScroller(target) {
  const body = document.querySelector('#srbb-panel-overlay .srbb-panel__body');
  return !!(body && target instanceof Node && body.contains(target));
}

function onModalScrollGuard(event) {
  if (!panelOpen || isEventInsidePanelScroller(event.target)) return;
  event.preventDefault();
}

function setBodyScrollLocked(locked) {
  if (locked) {
    lockPageScroll();
    if (guardInstalled) return;
    guardInstalled = true;
    document.addEventListener('wheel', onModalScrollGuard, { passive: false, capture: true });
    document.addEventListener('touchmove', onModalScrollGuard, { passive: false, capture: true });
    return;
  }
  unlockPageScroll();
  if (!guardInstalled) return;
  guardInstalled = false;
  document.removeEventListener('wheel', onModalScrollGuard, { capture: true });
  document.removeEventListener('touchmove', onModalScrollGuard, { capture: true });
}

export function togglePanel(force) {
  ensurePanel();
  const overlay = document.getElementById('srbb-panel-overlay');
  if (!overlay) return;
  installEscapeClose();

  panelOpen = typeof force === 'boolean' ? force : !panelOpen;
  overlay.hidden = !panelOpen;
  document.getElementById('srbb-settings-btn')?.classList.toggle('is-open', panelOpen);
  setBodyScrollLocked(panelOpen);

  if (panelOpen) {
    draft = clone(getSettings());
    activePageId = null;
    syncPanelLabels();
    renderCurrentView();
  } else {
    draft = null;
  }
}
