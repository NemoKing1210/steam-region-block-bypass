import { LOCALE_ALIASES, LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES } from './meta.js';
import { TRANSLATIONS } from './locales/index.js';

let activeLocale = 'en';

function matchLocale(language) {
  const normalized = String(language || '')
    .trim()
    .replace(/_/g, '-')
    .toLowerCase();
  return (
    LOCALE_ALIASES[normalized] ||
    LOCALE_ALIASES[normalized.split('-')[0]] ||
    null
  );
}

function detectBrowserLocale() {
  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const language of languages) {
    const locale = matchLocale(language);
    if (locale) return locale;
  }
  return 'en';
}

export function configureLocale(preference = 'auto') {
  activeLocale =
    preference === 'auto'
      ? detectBrowserLocale()
      : matchLocale(preference) || 'en';
  return activeLocale;
}

export function getLocale() {
  return activeLocale;
}

export function t(key, vars = {}) {
  const template =
    TRANSLATIONS[activeLocale]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  return Object.entries(vars).reduce(
    (value, [name, replacement]) =>
      String(value).split(`{${name}}`).join(String(replacement)),
    template,
  );
}

export { LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES };
