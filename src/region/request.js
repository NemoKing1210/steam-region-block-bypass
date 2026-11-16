import { GM_xmlhttpRequest } from '$';
import {
  ACCEPT_LANG_BY_STEAM,
  REGION_REQUEST_TIMEOUT_MS,
  REGION_SESSION_TIMEOUT_MS,
  STEAM_LANG_BY_LOCALE,
} from '../core/constants.js';
import { Codes, fail } from '../core/debug.js';
import { getSettings } from '../core/settings.js';
import { getLocale } from '../i18n/index.js';
import {
  buildRequestHeaders,
  buildRequestUrl,
  buildTargetUrl,
} from './urls.js';

export function getCookie(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1].trim()) : '';
}

export function getSteamStoreLanguage() {
  const fromCookie = getCookie('Steam_Language');
  if (fromCookie) return fromCookie;
  return STEAM_LANG_BY_LOCALE[getLocale()] || 'english';
}

export function getStoreCountryCode(region = getSettings().region) {
  if (region?.countryCode && /^[A-Za-z]{2}$/.test(region.countryCode.trim())) {
    return region.countryCode.trim().toUpperCase();
  }
  const fromCookie = getCookie('steamCountry');
  if (fromCookie) {
    const cc = decodeURIComponent(fromCookie).split('|')[0]?.trim();
    if (/^[A-Za-z]{2}$/.test(cc)) return cc.toUpperCase();
  }
  const ccMatch = document.documentElement.innerHTML.match(/[?&]cc=([A-Za-z]{2})\b/);
  if (ccMatch) return ccMatch[1].toUpperCase();
  return 'US';
}

export { buildRequestUrl, buildTargetUrl };

export function guestFetch(url, region = getSettings().region) {
  return new Promise((resolve, reject) => {
    if (typeof GM_xmlhttpRequest !== 'function') {
      reject(fail(Codes.REGION_REQUEST, 'GM_xmlhttpRequest is unavailable'));
      return;
    }
    const opts = {
      method: 'GET',
      url,
      anonymous: true,
      timeout: REGION_REQUEST_TIMEOUT_MS,
      headers: buildRequestHeaders({
        lang: getSteamStoreLanguage(),
        cc: getStoreCountryCode(region),
        browserLang: navigator.language,
      }),
      onload: (res) => resolve(res),
      onerror: (res) =>
        reject(
          fail(Codes.REGION_REQUEST, 'guest request failed', {
            status: res?.status,
            statusText: res?.statusText,
          }),
        ),
      ontimeout: () => reject(fail(Codes.REGION_REQUEST, 'guest request timed out', { url })),
    };
    if (region?.proxyEnabled && region?.proxyUser) {
      opts.user = region.proxyUser;
      opts.password = region.proxyPass || '';
    }
    GM_xmlhttpRequest(opts);
  });
}

export function sessionFetch(url) {
  return new Promise((resolve, reject) => {
    if (typeof GM_xmlhttpRequest !== 'function') {
      reject(fail(Codes.REGION_REQUEST, 'GM_xmlhttpRequest is unavailable'));
      return;
    }
    const steamLang = getSteamStoreLanguage();
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      anonymous: false,
      timeout: REGION_SESSION_TIMEOUT_MS,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language':
          ACCEPT_LANG_BY_STEAM[steamLang] || navigator.language || 'en-US,en;q=0.9',
      },
      onload: (res) => resolve(res),
      onerror: (res) =>
        reject(
          fail(Codes.REGION_REQUEST, 'session request failed', {
            status: res?.status,
            statusText: res?.statusText,
          }),
        ),
      ontimeout: () => reject(fail(Codes.REGION_REQUEST, 'session request timed out', { url })),
    });
  });
}
