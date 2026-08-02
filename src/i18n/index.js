import { MESSAGES } from './translations.js';
import { STEAM_LANG_BY_LOCALE, SUPPORTED_LOCALES } from '../constants.js';
import { state } from '../state.js';

export { MESSAGES };

export function detectLocale() {
  const candidates = [
    ...(navigator.languages || []),
    navigator.language || 'en',
  ].filter(Boolean);
  for (const raw of candidates) {
    const tag = String(raw).replace(/_/g, '-');
    const lower = tag.toLowerCase();
    const exact = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === lower);
    if (exact) return exact;
    if (lower.startsWith('zh')) return 'zh-CN';
    if (lower.startsWith('pt')) return 'pt-BR';
    const primary = lower.split('-')[0];
    const byPrimary = SUPPORTED_LOCALES.find(
      (l) => l.toLowerCase().split('-')[0] === primary,
    );
    if (byPrimary) return byPrimary;
  }
  return 'en';
}

/**
 * @param {string} key
 * @param {Record<string, string | number>} [vars]
 */
export function t(key, vars) {
  const dict = MESSAGES[LOCALE] || MESSAGES.en;
  let str = dict[key] ?? MESSAGES.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      str = str.replaceAll('{' + name + '}', String(value));
    }
  }
  return str;
}

export const LOCALE = detectLocale();

export function getCookie(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + escaped + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1].trim()) : '';
}

/**
 * Store page language for guest fetch: Steam_Language cookie, else UI/browser fallback.
 * @returns {string}
 */
export function getSteamStoreLanguage() {
  const fromCookie = getCookie('Steam_Language');
  if (fromCookie) return fromCookie;
  return STEAM_LANG_BY_LOCALE[LOCALE] || 'english';
}

/** Settings override, else steamCountry cookie / page hints, else US. */
export function getStoreCountryCode() {
  if (state.settings.countryCode) {
    return state.settings.countryCode.trim().toUpperCase();
  }

  const fromCookie = getCookie('steamCountry');
  if (fromCookie) {
    const cc = decodeURIComponent(fromCookie).split('|')[0]?.trim();
    if (/^[A-Za-z]{2}$/.test(cc)) return cc.toUpperCase();
  }

  const ccMatch = document.documentElement.innerHTML.match(
    /[?&]cc=([A-Za-z]{2})\b/,
  );
  if (ccMatch) return ccMatch[1].toUpperCase();

  return 'US';
}
