import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCacheKey,
  cacheCategoryForKey,
  cacheFillPct,
  cacheFillTone,
  cacheMaxEntries,
  cacheMeterPct,
  cacheTtlMs,
  cacheUrlFromKey,
  detectPageCacheKind,
  isCacheCategoryEnabled,
  pruneCacheStore,
} from '../src/core/page-cache-model.js';

test('cache key includes the proxy signature', () => {
  const direct = buildCacheKey('https://store.steampowered.com/app/10/', {});
  assert.equal(direct, 'https://store.steampowered.com/app/10/\ndirect');
  const proxied = buildCacheKey('https://store.steampowered.com/app/10/', {
    proxyEnabled: true,
    proxyMode: 'query',
    proxyHost: ' 127.0.0.1 ',
    proxyPort: '8765',
  });
  assert.equal(
    proxied,
    'https://store.steampowered.com/app/10/\nquery|127.0.0.1|8765',
  );
  assert.equal(cacheUrlFromKey(proxied), 'https://store.steampowered.com/app/10/');
});

test('search URLs map to the search cache category', () => {
  assert.equal(
    detectPageCacheKind('https://store.steampowered.com/search/?term=portal'),
    'search',
  );
  assert.equal(
    detectPageCacheKind('https://store.steampowered.com/app/10/'),
    'pages',
  );
  assert.equal(cacheCategoryForKey('x', { kind: 'search' }), 'search');
  assert.equal(cacheCategoryForKey('https://store.steampowered.com/search/'), 'search');
  assert.equal(isCacheCategoryEnabled('pages', { appPages: false }), false);
  assert.equal(isCacheCategoryEnabled('search', { searchPages: false }), false);
  assert.equal(isCacheCategoryEnabled('blocked', { searchPages: false }), true);
});

test('TTL and max-entry helpers clamp values', () => {
  assert.equal(cacheTtlMs({ minutes: 60 }), 3_600_000);
  assert.equal(cacheTtlMs({ minutes: 0 }), 0);
  assert.equal(cacheMaxEntries({ maxEntries: 0 }), 30);
  assert.equal(cacheMaxEntries({ maxEntries: 1000 }), 100);
});

test('pruneCacheStore drops expired and malformed entries and keeps newest', () => {
  const now = Date.now();
  const store = {
    a: { html: '<a>', savedAt: now - 1000, kind: 'pages' },
    b: { html: '<b>', savedAt: now - 2000, kind: 'pages' },
    c: { html: '<c>', savedAt: now - 10 * 60 * 1000, kind: 'pages' },
    d: { html: '', savedAt: now, kind: 'pages' },
    e: { html: '<e>', savedAt: 'now', kind: 'pages' },
  };
  const pruned = pruneCacheStore(store, 5 * 60 * 1000, 1);
  assert.deepEqual(Object.keys(pruned), ['a']);
});

test('meter helpers clamp and tone thresholds', () => {
  assert.equal(cacheMeterPct(5, 10), 50);
  assert.equal(cacheMeterPct(20, 10), 100);
  assert.equal(cacheMeterPct(1, 0), 0);
  assert.equal(cacheFillPct(4, 10), 40);
  assert.equal(cacheFillTone(10), 'low');
  assert.equal(cacheFillTone(70), 'mid');
  assert.equal(cacheFillTone(95), 'high');
});
