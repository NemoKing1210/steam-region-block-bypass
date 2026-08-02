import { GM_xmlhttpRequest } from '$';
import { ACCEPT_LANG_BY_STEAM } from './constants.js';
import { state } from './state.js';
import { getSteamStoreLanguage, getStoreCountryCode, t } from './i18n/index.js';

export function buildRequestHeaders() {
  const steamLang = getSteamStoreLanguage();
  const headers = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language':
      ACCEPT_LANG_BY_STEAM[steamLang] || navigator.language || 'en-US,en;q=0.9',
  };

  // Age gate + store language + optional country without sending login session
  const cookies = [
    'birthtime=-3338496000',
    'mature_content=1',
    'wants_mature_content=1',
    'lastagecheckage=1-0-1980',
    `Steam_Language=${steamLang}`,
  ];
  if (state.settings.countryCode) {
    const cc = state.settings.countryCode.trim().toUpperCase();
    cookies.push(`steamCountry=${encodeURIComponent(cc + '|0')}`);
  } else {
    const cc = getStoreCountryCode();
    if (cc) cookies.push(`steamCountry=${encodeURIComponent(cc + '|0')}`);
  }
  headers.Cookie = cookies.join('; ');

  return headers;
}

export function gmRequest(url) {
  return new Promise((resolve, reject) => {
    const opts = {
      method: 'GET',
      url,
      anonymous: true,
      timeout: 45000,
      headers: buildRequestHeaders(),
      onload: (res) => resolve(res),
      onerror: (res) => reject(new Error(res && res.statusText ? res.statusText : t('networkError'))),
      ontimeout: () => reject(new Error(t('requestTimeout'))),
    };

    if (state.settings.proxyEnabled && state.settings.proxyUser) {
      opts.user = state.settings.proxyUser;
      opts.password = state.settings.proxyPass || '';
    }

    GM_xmlhttpRequest(opts);
  });
}

/**
 * Account-session request (browser cookies). Never use proxy / guest Cookie override —
 * we need the logged-in store region view to detect locks.
 */

export function gmSessionRequest(url) {
  return new Promise((resolve, reject) => {
    const steamLang = getSteamStoreLanguage();
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      anonymous: false,
      timeout: 25000,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language':
          ACCEPT_LANG_BY_STEAM[steamLang] || navigator.language || 'en-US,en;q=0.9',
      },
      onload: (res) => resolve(res),
      onerror: (res) =>
        reject(new Error(res && res.statusText ? res.statusText : t('networkError'))),
      ontimeout: () => reject(new Error(t('requestTimeout'))),
    });
  });
}
