import { on } from '../core/bus.js';
import { getSettings } from '../core/settings.js';
import { watchStoreNavigation } from '../utils/navigation.js';
import { rememberBlockedAppFromPage } from '../core/blocked-apps.js';
import { isRegionBlockedPage, isSupportedStoreUrl } from './detect.js';
import { bypassRegionBlock, isRegionInjected } from './bypass.js';
import {
  OTHER_SITE_SELECTOR,
  showRegionOffer,
  syncOtherSiteReloadButton,
} from './inject.js';

let bypassedUrl = null;
let currentUrl = null;
let regionSubscribed = false;

function buttonState(url) {
  const region = getSettings().region;
  if (!region.enabled) return { show: false, reloaded: false };
  if (!isSupportedStoreUrl(url)) return { show: false, reloaded: false };
  if (bypassedUrl !== null && url === bypassedUrl) {
    return { show: true, reloaded: !isRegionBlockedPage() };
  }
  if (!isRegionInjected() && isRegionBlockedPage()) {
    return { show: true, reloaded: false };
  }
  return { show: false, reloaded: false };
}

function clearInjectionStateForUrl(url) {
  if (currentUrl === null) {
    currentUrl = url;
    return;
  }
  if (url === currentUrl) return;
  currentUrl = url;
  bypassedUrl = null;
  document.documentElement.classList.remove('srbb-region-injected');
}

function evaluate(url) {
  clearInjectionStateForUrl(url);
  const region = getSettings().region;
  if (!region.enabled) {
    document.querySelector('.srbb-region-banner')?.remove();
    document.querySelector('.srbb-region-offer')?.remove();
    syncOtherSiteReloadButton(false);
    return;
  }
  const { show, reloaded } = buttonState(url);
  syncOtherSiteReloadButton(show, { reloaded });
  if (!show || !isRegionBlockedPage() || isRegionInjected()) return;
  if (getSettings().search.rememberBlocked) rememberBlockedAppFromPage(url);
  if (region.mode === 'manual') {
    showRegionOffer();
    return;
  }
  void bypassRegionBlock();
}

export function refreshOtherSiteButton() {
  if (!document.querySelector(OTHER_SITE_SELECTOR)) return;
  const { show, reloaded } = buttonState(location.href);
  syncOtherSiteReloadButton(show, { reloaded });
}

export function initRegionFeature() {
  currentUrl = location.href;
  evaluate(location.href);
  if (regionSubscribed) return;
  regionSubscribed = true;
  on('settings:region', ({ next } = {}) => {
    if (!next?.showBanner) document.querySelector('.srbb-region-banner')?.remove();
    if (!next?.enabled) {
      document.querySelector('.srbb-region-offer')?.remove();
      syncOtherSiteReloadButton(false);
    }
    evaluate(location.href);
  });
  on('region:injected', (payload) => {
    bypassedUrl = payload?.url || location.href;
    evaluate(location.href);
  });
  watchStoreNavigation((url) => evaluate(url));
}
