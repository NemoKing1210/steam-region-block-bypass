import { on } from '../../core/bus.js';
import { t } from '../../i18n/index.js';
import { registerPage, togglePanel } from './panel.js';
import { generalPage } from './pages/general.js';
import { searchPage } from './pages/search.js';
import { cachePage } from './pages/cache.js';
import { proxyPage } from './pages/proxy.js';
import { aboutPage } from './pages/about.js';

registerPage(generalPage);
registerPage(searchPage);
registerPage(cachePage);
registerPage(proxyPage);
registerPage(aboutPage);

const BUTTON_ID = 'srbb-settings-btn';
let headerObserver = null;
let subscribed = false;
let ensuring = null;

function waitForElement(selector, timeout = 20000) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeout);
  });
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

function onSettingsTriggerClick(event) {
  event.preventDefault();
  event.stopPropagation();
  hideAccountDropdown();
  togglePanel();
}

function injectAccountMenuItem(menu) {
  const existing = document.getElementById(BUTTON_ID);
  if (existing) return existing;

  const item = document.createElement('a');
  item.id = BUTTON_ID;
  item.className = 'popup_menu_item srbb-menu-item srbb-settings-btn';
  item.href = '#';
  item.title = t('accountMenuItem');
  item.textContent = t('accountMenuItem');
  item.addEventListener('click', onSettingsTriggerClick);

  const steamDb = menu.querySelector('.steamdb_options_link');
  if (steamDb) menu.insertBefore(item, steamDb.nextSibling);
  else menu.appendChild(item);
  return item;
}

function injectHeaderFallback(host) {
  const existing = document.getElementById(BUTTON_ID);
  if (existing) return existing;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = BUTTON_ID;
  button.className = 'srbb-header-btn srbb-settings-btn';
  button.title = t('btnTitle');
  button.textContent = t('btnText');
  button.addEventListener('click', onSettingsTriggerClick);

  const sihButton = host.querySelector('.sih-features-button');
  if (sihButton) host.insertBefore(button, sihButton);
  else host.insertBefore(button, host.firstChild);
  return button;
}

export function ensureSettingsButton() {
  const existing = document.getElementById(BUTTON_ID);
  if (existing) return Promise.resolve(existing);
  if (ensuring) return ensuring;
  ensuring = waitForElement('#global_actions')
    .then((host) => {
      if (!host) return null;
      const present = document.getElementById(BUTTON_ID);
      if (present) return present;
      const menu = getAccountMenuBody();
      if (menu) return injectAccountMenuItem(menu);
      return injectHeaderFallback(host);
    })
    .finally(() => {
      ensuring = null;
    });
  return ensuring;
}

export function observeHeader() {
  headerObserver?.disconnect();
  const observer = new MutationObserver(() => {
    const existing = document.getElementById(BUTTON_ID);
    const menu = getAccountMenuBody();
    if (existing?.classList.contains('srbb-header-btn') && menu) {
      existing.remove();
      void ensureSettingsButton();
      return;
    }
    if (!existing && document.querySelector('#global_actions')) {
      void ensureSettingsButton();
    }
  });
  headerObserver = observer;
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function syncEntryLabels() {
  const entry = document.getElementById(BUTTON_ID);
  if (!entry) return;
  if (entry.classList.contains('srbb-menu-item')) {
    entry.title = t('accountMenuItem');
    entry.textContent = t('accountMenuItem');
  } else {
    entry.title = t('btnTitle');
    entry.textContent = t('btnText');
  }
}

export function initSettingsFeature() {
  void ensureSettingsButton();
  observeHeader();
  if (subscribed) return;
  subscribed = true;
  on('settings:language', syncEntryLabels);
  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand(t('menuSettings'), () => togglePanel(true));
  }
}
