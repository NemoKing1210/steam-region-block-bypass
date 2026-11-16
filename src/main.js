import './styles/index.css';
import { emit, on } from './core/bus.js';
import { getSettings } from './core/settings.js';
import { configureLocale } from './i18n/index.js';
import { initSettingsFeature } from './features/settings/index.js';
import { initSearchFeature } from './features/search/index.js';
import { initRegionFeature } from './region/index.js';
import { initToasts } from './ui/toast.js';
import {
  createRegionBanner,
  extractStoreRoot,
  getContentMount,
  insertBannerIntoGrid,
  stripGuestSignedOutChrome,
  waitForBootComplete,
} from './region/inject.js';

let rewroteSubscribed = false;
let languageSubscribed = false;

function bootDocument() {
  initSettingsFeature();
  initRegionFeature();
  initSearchFeature();
  initToasts();
}

function installGlobalSubscriptions() {
  if (!languageSubscribed) {
    languageSubscribed = true;
    on('settings:language', ({ next } = {}) => {
      configureLocale(next || getSettings().language);
    });
  }
  if (rewroteSubscribed) return;
  rewroteSubscribed = true;
  on('region:rewrote', async (payload = {}) => {
    const { transplanted, signedIn, viaProxy, fromCache, url } = payload;
    if (!transplanted) {
      await waitForBootComplete();
      stripGuestSignedOutChrome(document, { signedIn });
    }
    bootDocument();
    document.querySelector('.srbb-region-banner')?.remove();
    if (getSettings().region.showBanner) {
      const root = extractStoreRoot(document) || getContentMount();
      if (root) {
        insertBannerIntoGrid(root, createRegionBanner({ viaProxy, fromCache }));
      }
    }
    emit('region:injected', { url: url || location.href, viaProxy });
  });
}

function init() {
  configureLocale(getSettings().language);
  installGlobalSubscriptions();
  bootDocument();
}

init();
