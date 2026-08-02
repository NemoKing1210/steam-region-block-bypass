import {
  REPO_URL,
  AUTHOR_URL,
  ISSUES_URL,
  CACHE_MINUTES_MAX,
  SCRIPT_VERSION,
  SCRIPT_AUTHOR,
  SCRIPT_LICENSE,
} from '../constants.js';
import { state } from '../state.js';
import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import {
  saveSettings,
  normalizeCacheMinutes,
  normalizeProbeScope,
  normalizeProbeConcurrency,
} from '../settings.js';
import { isRegionBlockedPage, isHostLoggedIn } from '../detect.js';
import { bypassRegionBlock } from '../bypass.js';
import {
  getBlockedAppsCount,
  listBlockedAppsEntries,
  clearBlockedApps,
} from '../blocked-apps.js';
import { buildAppHref } from './suggest.js';

export function observeHeader() {
  const observer = new MutationObserver(() => {
    const existing = document.getElementById('srbb-settings-btn');
    const menu = getAccountMenuBody();
    // Upgrade header fallback → account menu once dropdown appears (logged-in)
    if (existing?.classList.contains('srbb-header-btn') && menu) {
      existing.remove();
      ensureSettingsButton();
      return;
    }
    if (!existing) {
      ensureSettingsButton();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function getAccountMenuBody() {
  return document.querySelector('#account_dropdown .popup_body.popup_menu');
}

function hideAccountDropdown() {
  if (typeof window.HideMenu === 'function') {
    try {
      window.HideMenu('account_pulldown', 'account_dropdown');
      return;
    } catch {
      /* fall through */
    }
  }
  const dropdown = document.getElementById('account_dropdown');
  if (dropdown) {
    dropdown.style.display = 'none';
    dropdown.style.visibility = 'hidden';
  }
}

function onSettingsTriggerClick(e) {
  e.preventDefault();
  e.stopPropagation();
  hideAccountDropdown();
  togglePanel();
}

function injectAccountMenuItem(menu) {
  if (document.getElementById('srbb-settings-btn')) {
    return document.getElementById('srbb-settings-btn');
  }

  const item = document.createElement('a');
  item.id = 'srbb-settings-btn';
  item.className = 'popup_menu_item srbb-menu-item';
  item.href = '#';
  item.title = t('btnTitle');
  item.textContent = t('accountMenuItem');
  item.addEventListener('click', onSettingsTriggerClick);

  // After SteamDB / similar extension links when present; else at end of menu
  const steamDb = menu.querySelector('.steamdb_options_link');
  if (steamDb) menu.insertBefore(item, steamDb.nextSibling);
  else menu.appendChild(item);

  ensurePanel();
  return item;
}

function injectHeaderFallback(host) {
  if (!host || document.getElementById('srbb-settings-btn')) {
    return document.getElementById('srbb-settings-btn');
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'srbb-settings-btn';
  btn.className = 'srbb-header-btn';
  btn.title = t('btnTitle');
  btn.textContent = t('btnText');
  btn.addEventListener('click', onSettingsTriggerClick);

  const sihBtn = host.querySelector('.sih-features-button');
  if (sihBtn) host.insertBefore(btn, sihBtn);
  else host.insertBefore(btn, host.firstChild);

  ensurePanel();
  return btn;
}

export async function ensureSettingsButton() {
  await waitForElement('#global_actions', 20000);

  if (document.getElementById('srbb-settings-btn')) {
    return document.getElementById('srbb-settings-btn');
  }

  const menu = getAccountMenuBody();
  if (menu) return injectAccountMenuItem(menu);

  // Logged-out store header has no account dropdown — keep a compact header control
  return injectHeaderFallback(document.querySelector('#global_actions'));
}

export function ensurePanel() {
  if (document.getElementById('srbb-panel-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'srbb-panel-overlay';
  overlay.className = 'srbb-panel-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'presentation');

  const panel = document.createElement('div');
  panel.id = 'srbb-panel';
  panel.className = 'srbb-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', t('panelTitle'));
  panel.innerHTML = `
    <div class="srbb-panel__header">
      <div>
        <div class="srbb-panel__title-row">
          <div class="srbb-panel__title">${escapeHtml(t('panelTitle'))}</div>
          <span class="srbb-panel__version">v${escapeHtml(SCRIPT_VERSION)}</span>
        </div>
        <div class="srbb-panel__subtitle">${escapeHtml(t('panelSubtitle'))}</div>
      </div>
      <button type="button" class="srbb-panel__close" data-srbb="close" aria-label="${escapeHtml(t('close'))}">×</button>
    </div>

    <div class="srbb-panel__tabs" role="tablist">
      <button type="button" class="srbb-panel__tab is-active" role="tab" data-srbb-tab="general" aria-selected="true">${escapeHtml(t('tabGeneral'))}</button>
      <button type="button" class="srbb-panel__tab" role="tab" data-srbb-tab="search" aria-selected="false">${escapeHtml(t('tabSearch'))}</button>
      <button type="button" class="srbb-panel__tab" role="tab" data-srbb-tab="proxy" aria-selected="false">${escapeHtml(t('tabProxy'))}</button>
      <button type="button" class="srbb-panel__tab" role="tab" data-srbb-tab="about" aria-selected="false">${escapeHtml(t('tabAbout'))}</button>
    </div>

    <div class="srbb-panel__body">
      <div class="srbb-panel__tabpane" data-srbb-pane="general" role="tabpanel">
        <div class="srbb-panel__section">
          <label class="srbb-field">
            <span class="srbb-field__label">${escapeHtml(t('bypassTrigger'))}</span>
            <select id="srbb-auto">
              <option value="auto">${escapeHtml(t('bypassTriggerAuto'))}</option>
              <option value="button">${escapeHtml(t('bypassTriggerButton'))}</option>
            </select>
          </label>
          <p class="srbb-hint">${escapeHtml(t('bypassTriggerHint'))}</p>
        </div>

        <div class="srbb-panel__section">
          <label class="srbb-field">
            <span class="srbb-field__label">${escapeHtml(t('storeCountry'))}</span>
            <input type="text" id="srbb-cc" maxlength="2" placeholder="US / DE / KZ…" autocomplete="off" spellcheck="false" />
          </label>
          <p class="srbb-hint">${escapeHtml(t('storeCountryHint'))}</p>
        </div>

        <div class="srbb-panel__section">
          <label class="srbb-field">
            <span class="srbb-field__label">${escapeHtml(t('cacheMinutes'))}</span>
            <input type="number" id="srbb-cache-minutes" min="0" max="${CACHE_MINUTES_MAX}" step="1" placeholder="60" inputmode="numeric" />
          </label>
          <p class="srbb-hint">${escapeHtml(t('cacheMinutesHint'))}</p>
        </div>
      </div>

      <div class="srbb-panel__tabpane" data-srbb-pane="search" role="tabpanel" hidden>
        <div class="srbb-panel__section srbb-panel__section--row">
          <label class="srbb-switch">
            <input type="checkbox" id="srbb-search-unblocked" />
            <span class="srbb-switch__track"></span>
            <span class="srbb-switch__label">${escapeHtml(t('searchUnblocked'))}</span>
          </label>
          <span class="srbb-pill" id="srbb-search-pill">${escapeHtml(t('off'))}</span>
        </div>
        <p class="srbb-hint srbb-panel__section" style="padding-top:0">${escapeHtml(t('searchUnblockedHint'))}</p>

        <div class="srbb-panel__section srbb-panel__section--row">
          <label class="srbb-switch">
            <input type="checkbox" id="srbb-search-page-unblocked" />
            <span class="srbb-switch__track"></span>
            <span class="srbb-switch__label">${escapeHtml(t('searchPageUnblocked'))}</span>
          </label>
          <span class="srbb-pill" id="srbb-search-page-pill">${escapeHtml(t('off'))}</span>
        </div>
        <p class="srbb-hint srbb-panel__section" style="padding-top:0">${escapeHtml(t('searchPageUnblockedHint'))}</p>

        <div class="srbb-panel__section srbb-panel__section--row">
          <label class="srbb-switch">
            <input type="checkbox" id="srbb-remember-blocked" />
            <span class="srbb-switch__track"></span>
            <span class="srbb-switch__label">${escapeHtml(t('rememberBlockedApps'))}</span>
          </label>
        </div>
        <p class="srbb-hint srbb-panel__section" style="padding-top:0">${escapeHtml(t('rememberBlockedAppsHint'))}</p>

        <div class="srbb-panel__section srbb-panel__section--row">
          <label class="srbb-switch">
            <input type="checkbox" id="srbb-mark-blocked-search" />
            <span class="srbb-switch__track"></span>
            <span class="srbb-switch__label">${escapeHtml(t('markBlockedInSearch'))}</span>
          </label>
        </div>
        <p class="srbb-hint srbb-panel__section" style="padding-top:0">${escapeHtml(t('markBlockedInSearchHint'))}</p>

        <div class="srbb-panel__section srbb-panel__section--row">
          <label class="srbb-switch">
            <input type="checkbox" id="srbb-probe-blocked" />
            <span class="srbb-switch__track"></span>
            <span class="srbb-switch__label">${escapeHtml(t('probeBlockedInSearch'))}</span>
          </label>
        </div>
        <p class="srbb-hint srbb-panel__section" style="padding-top:0">${escapeHtml(t('probeBlockedInSearchHint'))}</p>
        <p class="srbb-hint srbb-panel__section srbb-probe-note" id="srbb-probe-note" style="padding-top:0" hidden></p>

        <div class="srbb-panel__section srbb-probe-fields" id="srbb-probe-fields">
          <label class="srbb-field">
            <span class="srbb-field__label">${escapeHtml(t('probeBlockedScope'))}</span>
            <select id="srbb-probe-scope">
              <option value="both">${escapeHtml(t('probeBlockedScopeBoth'))}</option>
              <option value="suggest">${escapeHtml(t('probeBlockedScopeSuggest'))}</option>
              <option value="search">${escapeHtml(t('probeBlockedScopeSearch'))}</option>
            </select>
          </label>
          <label class="srbb-field">
            <span class="srbb-field__label">${escapeHtml(t('probeBlockedConcurrency'))}</span>
            <select id="srbb-probe-concurrency">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
            </select>
          </label>
          <p class="srbb-hint">${escapeHtml(t('probeBlockedConcurrencyHint'))}</p>
        </div>

        <div class="srbb-panel__section srbb-panel__section--row">
          <span class="srbb-blocked-count" id="srbb-blocked-count"></span>
          <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="view-blocked">${escapeHtml(t('viewBlockedApps'))}</button>
          <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="clear-blocked">${escapeHtml(t('clearBlockedApps'))}</button>
        </div>
        <div class="srbb-blocked-list" id="srbb-blocked-list" hidden></div>
      </div>

      <div class="srbb-panel__tabpane" data-srbb-pane="proxy" role="tabpanel" hidden>
        <div class="srbb-panel__section srbb-panel__section--row">
          <label class="srbb-switch">
            <input type="checkbox" id="srbb-proxy-enabled" />
            <span class="srbb-switch__track"></span>
            <span class="srbb-switch__label">${escapeHtml(t('useProxy'))}</span>
          </label>
          <span class="srbb-pill" id="srbb-proxy-pill">${escapeHtml(t('off'))}</span>
        </div>

        <div class="srbb-panel__section srbb-proxy-fields" id="srbb-proxy-fields">
          <label class="srbb-field">
            <span class="srbb-field__label">${escapeHtml(t('gatewayMode'))}</span>
            <select id="srbb-proxy-mode">
              <option value="gateway">host:port/https://…</option>
              <option value="path">host:port/store.steampowered.com/…</option>
              <option value="query">host:port/?url=…</option>
            </select>
          </label>
          <div class="srbb-grid">
            <label class="srbb-field">
              <span class="srbb-field__label">${escapeHtml(t('host'))}</span>
              <input type="text" id="srbb-proxy-host" placeholder="127.0.0.1" autocomplete="off" spellcheck="false" />
            </label>
            <label class="srbb-field">
              <span class="srbb-field__label">${escapeHtml(t('port'))}</span>
              <input type="text" id="srbb-proxy-port" placeholder="8080" inputmode="numeric" autocomplete="off" spellcheck="false" />
            </label>
          </div>
          <div class="srbb-grid">
            <label class="srbb-field">
              <span class="srbb-field__label">${escapeHtml(t('username'))}</span>
              <input type="text" id="srbb-proxy-user" placeholder="${escapeHtml(t('optional'))}" autocomplete="off" spellcheck="false" />
            </label>
            <label class="srbb-field">
              <span class="srbb-field__label">${escapeHtml(t('password'))}</span>
              <input type="password" id="srbb-proxy-pass" placeholder="${escapeHtml(t('optional'))}" autocomplete="off" />
            </label>
          </div>
          <p class="srbb-hint">
            ${escapeHtml(t('proxyHint'))}
          </p>
        </div>
      </div>

      <div class="srbb-panel__tabpane" data-srbb-pane="about" role="tabpanel" hidden>
        <div class="srbb-about">
          <div class="srbb-about__hero">
            <div class="srbb-about__name">${escapeHtml(t('panelTitle'))}</div>
            <span class="srbb-panel__version">v${escapeHtml(SCRIPT_VERSION)}</span>
          </div>
          <p class="srbb-about__blurb">${escapeHtml(t('aboutBlurb'))}</p>

          <dl class="srbb-about__meta">
            <div class="srbb-about__row">
              <dt>${escapeHtml(t('aboutAuthor'))}</dt>
              <dd>
                <a class="srbb-about__link" href="${AUTHOR_URL}" target="_blank" rel="noopener noreferrer">${escapeHtml(SCRIPT_AUTHOR)}</a>
              </dd>
            </div>
            <div class="srbb-about__row">
              <dt>${escapeHtml(t('aboutLicense'))}</dt>
              <dd>${escapeHtml(SCRIPT_LICENSE)}</dd>
            </div>
          </dl>

          <p class="srbb-about__disclaimer">${escapeHtml(t('aboutDisclaimer'))}</p>

          <div class="srbb-about__actions">
            <a class="srbb-btn srbb-btn--ghost" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('aboutSource'))}</a>
            <a class="srbb-btn srbb-btn--ghost" href="${ISSUES_URL}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('aboutIssues'))}</a>
          </div>
        </div>
      </div>
    </div>

    <div class="srbb-panel__footer">
      <div class="srbb-panel__footer-actions">
        <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="close">${escapeHtml(t('cancel'))}</button>
        <button type="button" class="srbb-btn" data-srbb="save">${escapeHtml(t('save'))}</button>
        <button type="button" class="srbb-btn srbb-btn--green" data-srbb="save-run" id="srbb-save-run">${escapeHtml(t('saveReload'))}</button>
      </div>
    </div>
  `;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) togglePanel(false);
  });
  panel.querySelectorAll('[data-srbb-tab]').forEach((tab) => {
    tab.addEventListener('click', () => switchPanelTab(tab.getAttribute('data-srbb-tab')));
  });
  panel.querySelectorAll('[data-srbb="close"]').forEach((el) =>
    el.addEventListener('click', () => togglePanel(false))
  );
  panel.querySelector('[data-srbb="save"]').addEventListener('click', () => {
    persistPanelForm();
    togglePanel(false);
  });
  panel.querySelector('[data-srbb="save-run"]').addEventListener('click', () => {
    persistPanelForm();
    togglePanel(false);
    if (isRegionBlockedPage() || document.querySelector('.srbb-shell, .srbb-injected')) {
      bypassRegionBlock({ forceRefresh: true });
    } else {
      location.reload();
    }
  });

  const enabled = panel.querySelector('#srbb-proxy-enabled');
  enabled.addEventListener('change', () => syncProxyFieldsState());
  panel.querySelector('#srbb-search-unblocked')?.addEventListener('change', () => {
    saveSettings({ searchUnblocked: panel.querySelector('#srbb-search-unblocked').checked });
  });
  panel.querySelector('#srbb-search-page-unblocked')?.addEventListener('change', () => {
    saveSettings({
      searchPageUnblocked: panel.querySelector('#srbb-search-page-unblocked').checked,
    });
  });
  panel.querySelector('#srbb-remember-blocked')?.addEventListener('change', () => {
    saveSettings({ rememberBlockedApps: panel.querySelector('#srbb-remember-blocked').checked });
    syncBlockedAppsPanel();
    syncProbePanelState();
  });
  panel.querySelector('#srbb-mark-blocked-search')?.addEventListener('change', () => {
    saveSettings({ markBlockedInSearch: panel.querySelector('#srbb-mark-blocked-search').checked });
  });
  panel.querySelector('#srbb-probe-blocked')?.addEventListener('change', () => {
    saveSettings({ probeBlockedInSearch: panel.querySelector('#srbb-probe-blocked').checked });
    syncProbePanelState();
  });
  panel.querySelector('#srbb-probe-scope')?.addEventListener('change', () => {
    saveSettings({ probeBlockedScope: panel.querySelector('#srbb-probe-scope').value });
  });
  panel.querySelector('#srbb-probe-concurrency')?.addEventListener('change', () => {
    saveSettings({
      probeBlockedConcurrency: panel.querySelector('#srbb-probe-concurrency').value,
    });
  });
  panel.querySelector('[data-srbb="clear-blocked"]')?.addEventListener('click', () => {
    clearBlockedApps();
  });
  panel.querySelector('[data-srbb="view-blocked"]')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBlockedAppsList();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.panelOpen) togglePanel(false);
  });
}

export function switchPanelTab(tabId) {
  const panel = document.getElementById('srbb-panel');
  if (!panel || !tabId) return;
  panel.querySelectorAll('[data-srbb-tab]').forEach((tab) => {
    const active = tab.getAttribute('data-srbb-tab') === tabId;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  panel.querySelectorAll('[data-srbb-pane]').forEach((pane) => {
    pane.hidden = pane.getAttribute('data-srbb-pane') !== tabId;
  });
}

export function fillPanelForm() {
  const panel = document.getElementById('srbb-panel');
  if (!panel) return;
  panel.querySelector('#srbb-auto').value = state.settings.autoBypass ? 'auto' : 'button';
  panel.querySelector('#srbb-cc').value = state.settings.countryCode || '';
  panel.querySelector('#srbb-cache-minutes').value = String(
    normalizeCacheMinutes(state.settings.cacheMinutes)
  );
  panel.querySelector('#srbb-proxy-enabled').checked = !!state.settings.proxyEnabled;
  panel.querySelector('#srbb-proxy-mode').value = state.settings.proxyMode || 'gateway';
  panel.querySelector('#srbb-proxy-host').value = state.settings.proxyHost || '';
  panel.querySelector('#srbb-proxy-port').value = state.settings.proxyPort || '';
  panel.querySelector('#srbb-proxy-user').value = state.settings.proxyUser || '';
  panel.querySelector('#srbb-proxy-pass').value = state.settings.proxyPass || '';
  syncProxyFieldsState();
  syncSearchPanelToggle();
  syncBlockedAppsPanel();
  syncProbePanelState();
}

export function syncBlockedAppsPanel() {
  const panel = document.getElementById('srbb-panel');
  if (!panel) return;
  const remember = panel.querySelector('#srbb-remember-blocked');
  const mark = panel.querySelector('#srbb-mark-blocked-search');
  const countEl = panel.querySelector('#srbb-blocked-count');
  const clearBtn = panel.querySelector('[data-srbb="clear-blocked"]');
  const viewBtn = panel.querySelector('[data-srbb="view-blocked"]');
  const listEl = panel.querySelector('#srbb-blocked-list');
  if (remember) remember.checked = !!state.settings.rememberBlockedApps;
  if (mark) mark.checked = !!state.settings.markBlockedInSearch;
  const count = getBlockedAppsCount();
  if (countEl) countEl.textContent = t('blockedAppsCount', { count });
  if (clearBtn) clearBtn.disabled = count === 0;
  if (viewBtn) viewBtn.disabled = count === 0;
  if (listEl && !listEl.hidden) {
    renderBlockedAppsList(listEl);
  }
  if (viewBtn && listEl) {
    viewBtn.textContent = listEl.hidden ? t('viewBlockedApps') : t('hideBlockedApps');
  }
}

export function toggleBlockedAppsList() {
  const panel = document.getElementById('srbb-panel');
  const listEl = panel?.querySelector('#srbb-blocked-list');
  const viewBtn = panel?.querySelector('[data-srbb="view-blocked"]');
  if (!listEl) return;
  if (getBlockedAppsCount() === 0) {
    listEl.hidden = true;
    listEl.innerHTML = '';
    if (viewBtn) {
      viewBtn.disabled = true;
      viewBtn.textContent = t('viewBlockedApps');
    }
    return;
  }
  listEl.hidden = !listEl.hidden;
  if (!listEl.hidden) renderBlockedAppsList(listEl);
  if (viewBtn) {
    viewBtn.textContent = listEl.hidden ? t('viewBlockedApps') : t('hideBlockedApps');
  }
}

export function renderBlockedAppsList(listEl) {
  const entries = listBlockedAppsEntries();
  if (!entries.length) {
    listEl.innerHTML = `<div class="srbb-blocked-list__empty">${escapeHtml(t('blockedAppsEmpty'))}</div>`;
    return;
  }
  listEl.innerHTML = entries
    .map((entry) => {
      const label = entry.name || t('blockedAppUntitled', { id: entry.id });
      const href = buildAppHref(entry.id, entry.name);
      return `
        <a class="srbb-blocked-list__item" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
          <span class="srbb-blocked-list__name">${escapeHtml(label)}</span>
          <span class="srbb-blocked-list__id">${escapeHtml(entry.id)}</span>
        </a>
      `;
    })
    .join('');
}

export function persistPanelForm() {
  const panel = document.getElementById('srbb-panel');
  if (!panel) return;
  saveSettings({
    autoBypass: panel.querySelector('#srbb-auto').value !== 'button',
    countryCode: panel.querySelector('#srbb-cc').value.trim().toUpperCase(),
    cacheMinutes: normalizeCacheMinutes(panel.querySelector('#srbb-cache-minutes').value),
    proxyEnabled: panel.querySelector('#srbb-proxy-enabled').checked,
    proxyMode: panel.querySelector('#srbb-proxy-mode').value,
    proxyHost: panel.querySelector('#srbb-proxy-host').value.trim(),
    proxyPort: panel.querySelector('#srbb-proxy-port').value.trim(),
    proxyUser: panel.querySelector('#srbb-proxy-user').value.trim(),
    proxyPass: panel.querySelector('#srbb-proxy-pass').value,
    searchUnblocked: !!panel.querySelector('#srbb-search-unblocked')?.checked,
    searchPageUnblocked: !!panel.querySelector('#srbb-search-page-unblocked')?.checked,
    rememberBlockedApps: !!panel.querySelector('#srbb-remember-blocked')?.checked,
    markBlockedInSearch: !!panel.querySelector('#srbb-mark-blocked-search')?.checked,
    probeBlockedInSearch: !!panel.querySelector('#srbb-probe-blocked')?.checked,
    probeBlockedScope: panel.querySelector('#srbb-probe-scope')?.value || 'both',
    probeBlockedConcurrency: panel.querySelector('#srbb-probe-concurrency')?.value || 3,
  });
}

export function syncProxyFieldsState() {
  const panel = document.getElementById('srbb-panel');
  if (!panel) return;
  const on = panel.querySelector('#srbb-proxy-enabled').checked;
  panel.querySelector('#srbb-proxy-fields').classList.toggle('is-disabled', !on);
  const pill = panel.querySelector('#srbb-proxy-pill');
  pill.textContent = on ? t('on') : t('off');
  pill.classList.toggle('is-on', on);
}

export function togglePanel(force) {
  ensurePanel();
  const overlay = document.getElementById('srbb-panel-overlay');
  if (!overlay) return;

  state.panelOpen = typeof force === 'boolean' ? force : !state.panelOpen;
  overlay.hidden = !state.panelOpen;
  setBodyScrollLocked(state.panelOpen);

  if (state.panelOpen) {
    fillPanelForm();
  }
}

/** @type {{ y: number, pad: string } | null} */
let scrollLockState = null;

function isEventInsidePanelScroller(target) {
  const panelBody = document.querySelector('#srbb-panel .srbb-panel__body');
  return !!(panelBody && target instanceof Node && panelBody.contains(target));
}

function onModalScrollGuard(e) {
  if (!state.panelOpen) return;
  if (isEventInsidePanelScroller(e.target)) return;
  e.preventDefault();
}

function setBodyScrollLocked(locked) {
  const root = document.documentElement;
  const body = document.body;

  if (locked) {
    if (scrollLockState) return;
    const y = window.scrollY || root.scrollTop || body.scrollTop || 0;
    const pad = Math.max(0, window.innerWidth - root.clientWidth);
    scrollLockState = { y, pad: body.style.paddingRight };
    root.classList.add('srbb-modal-open');
    body.style.paddingRight = pad ? `${pad}px` : scrollLockState.pad;
    body.style.top = `-${y}px`;
    document.addEventListener('wheel', onModalScrollGuard, { passive: false, capture: true });
    document.addEventListener('touchmove', onModalScrollGuard, { passive: false, capture: true });
    return;
  }

  if (!scrollLockState) {
    root.classList.remove('srbb-modal-open');
    return;
  }

  const { y, pad } = scrollLockState;
  scrollLockState = null;
  document.removeEventListener('wheel', onModalScrollGuard, { capture: true });
  document.removeEventListener('touchmove', onModalScrollGuard, { capture: true });
  root.classList.remove('srbb-modal-open');
  body.style.top = '';
  body.style.paddingRight = pad;
  window.scrollTo(0, y);
}

export function waitForElement(selector, timeout = 15000) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeout);
  });
}

export function syncSearchPanelToggle() {
  const panel = document.getElementById('srbb-panel');
  if (!panel) return;
  const cb = panel.querySelector('#srbb-search-unblocked');
  const pill = panel.querySelector('#srbb-search-pill');
  if (cb) cb.checked = !!state.settings.searchUnblocked;
  if (pill) {
    pill.textContent = state.settings.searchUnblocked ? t('on') : t('off');
    pill.classList.toggle('is-on', !!state.settings.searchUnblocked);
  }
  const pageCb = panel.querySelector('#srbb-search-page-unblocked');
  const pagePill = panel.querySelector('#srbb-search-page-pill');
  if (pageCb) pageCb.checked = !!state.settings.searchPageUnblocked;
  if (pagePill) {
    pagePill.textContent = state.settings.searchPageUnblocked ? t('on') : t('off');
    pagePill.classList.toggle('is-on', !!state.settings.searchPageUnblocked);
  }
  syncProbePanelState();
}

export function syncProbePanelState() {
  const panel = document.getElementById('srbb-panel');
  if (!panel) return;
  const enabled = panel.querySelector('#srbb-probe-blocked');
  const fields = panel.querySelector('#srbb-probe-fields');
  const note = panel.querySelector('#srbb-probe-note');
  const scope = panel.querySelector('#srbb-probe-scope');
  const concurrency = panel.querySelector('#srbb-probe-concurrency');
  const on = !!state.settings.probeBlockedInSearch;
  if (enabled) enabled.checked = on;
  if (fields) fields.classList.toggle('is-disabled', !on);
  if (scope) scope.value = normalizeProbeScope(state.settings.probeBlockedScope);
  if (concurrency) {
    concurrency.value = String(normalizeProbeConcurrency(state.settings.probeBlockedConcurrency));
  }
  if (note) {
    let msg = '';
    if (on && !isHostLoggedIn()) msg = t('probeNeedLogin');
    else if (on && !state.settings.rememberBlockedApps) msg = t('probeNeedRemember');
    note.textContent = msg;
    note.hidden = !msg;
  }
}
