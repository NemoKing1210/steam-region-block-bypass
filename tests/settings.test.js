import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefaults } from '../src/core/constants.js';
import {
  mergeSettings,
  migrateFlatSettings,
  normalizeCountryCode,
  normalizeProbeConcurrency,
  normalizeProbeScope,
  normalizeSettings,
} from '../src/core/settings-model.js';

test('defaults use the nested v2 shape', () => {
  const defaults = getDefaults();
  assert.equal(defaults.language, 'auto');
  assert.equal(defaults.region.mode, 'auto');
  assert.equal(defaults.region.showBanner, true);
  assert.equal(defaults.search.suggestEnabled, true);
  assert.equal(defaults.search.pageEnabled, false);
  assert.equal(defaults.cache.minutes, 60);
  assert.equal(defaults.cache.maxEntries, 30);
  assert.equal(defaults.toasts.position, 'top-right');
});

test('unknown and malformed values fall back to defaults', () => {
  const normalized = normalizeSettings({
    language: 'xx',
    region: {
      enabled: 'yes',
      mode: 'sometimes',
      showBanner: 'yes',
      countryCode: 'deu',
      proxyEnabled: 'true',
      proxyMode: 'nope',
    },
    search: {
      probeScope: 'everywhere',
      probeConcurrency: 99,
    },
    cache: {
      minutes: -3,
      maxEntries: 0,
    },
    toasts: {
      position: 'center',
    },
  });
  const defaults = getDefaults();
  assert.equal(normalized.language, 'auto');
  assert.equal(normalized.region.enabled, true);
  assert.equal(normalized.region.mode, defaults.region.mode);
  assert.equal(normalized.region.showBanner, true);
  assert.equal(normalized.region.countryCode, '');
  assert.equal(normalized.region.proxyEnabled, false);
  assert.equal(normalized.region.proxyMode, defaults.region.proxyMode);
  assert.equal(normalized.search.probeScope, 'both');
  assert.equal(normalized.search.probeConcurrency, 5);
  assert.equal(normalized.cache.minutes, defaults.cache.minutes);
  assert.equal(normalized.cache.maxEntries, defaults.cache.maxEntries);
  assert.equal(normalized.toasts.position, 'top-right');
});

test('country code accepts exactly two letters', () => {
  assert.equal(normalizeCountryCode('de'), 'DE');
  assert.equal(normalizeCountryCode(' USA '), '');
  assert.equal(normalizeCountryCode(42), '');
});

test('probe helpers clamp and validate', () => {
  assert.equal(normalizeProbeScope('suggest'), 'suggest');
  assert.equal(normalizeProbeScope('nope'), 'both');
  assert.equal(normalizeProbeConcurrency(0), 1);
  assert.equal(normalizeProbeConcurrency(99), 5);
  assert.equal(normalizeProbeConcurrency('3'), 3);
});

test('flat v1 settings migrate without dropping known options', () => {
  const migrated = migrateFlatSettings({
    autoBypass: false,
    countryCode: 'kz',
    proxyEnabled: true,
    proxyHost: '127.0.0.1',
    proxyPort: '8765',
    proxyMode: 'query',
    proxyUser: 'user',
    proxyPass: 'pass',
    cacheMinutes: 120,
    cacheMaxEntries: 40,
    cacheAppPages: false,
    cacheSearchPages: true,
    searchUnblocked: false,
    searchPageUnblocked: true,
    rememberBlockedApps: false,
    markBlockedInSearch: false,
    probeBlockedInSearch: false,
    probeBlockedScope: 'search',
    probeBlockedConcurrency: 2,
    toastsEnabled: false,
    toastPosition: 'bottom-left',
    rememberSearchTerm: true,
    srbb_migrated_search_default_on_v1: true,
  });

  assert.equal(migrated.region.mode, 'manual');
  assert.equal(migrated.region.countryCode, 'KZ');
  assert.equal(migrated.region.proxyEnabled, true);
  assert.equal(migrated.region.proxyMode, 'query');
  assert.equal(migrated.cache.minutes, 120);
  assert.equal(migrated.cache.maxEntries, 40);
  assert.equal(migrated.cache.appPages, false);
  assert.equal(migrated.search.suggestEnabled, false);
  assert.equal(migrated.search.pageEnabled, true);
  assert.equal(migrated.search.rememberBlocked, false);
  assert.equal(migrated.search.markBlocked, false);
  assert.equal(migrated.search.probeEnabled, false);
  assert.equal(migrated.search.probeScope, 'search');
  assert.equal(migrated.search.probeConcurrency, 2);
  assert.equal(migrated.toasts.enabled, false);
  assert.equal(migrated.toasts.position, 'bottom-left');
  assert.equal('rememberSearchTerm' in migrated, false);
});

test('mergeSettings deep-merges only the patched section', () => {
  const current = getDefaults();
  current.region.showBanner = false;
  const merged = mergeSettings(
    { search: { pageEnabled: true } },
    current,
  );
  assert.equal(merged.region.showBanner, false);
  assert.equal(merged.search.pageEnabled, true);
  assert.equal(merged.search.suggestEnabled, true);
  assert.equal(merged.cache.minutes, 60);
});
