import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProxyBase,
  buildRequestHeaders,
  buildRequestUrl,
  buildTargetUrl,
} from '../src/region/urls.js';
import {
  buildAppDetailsUrl,
  buildAppReviewsUrl,
  buildGuestSearchFetchUrl,
  buildSearchResultsMetaUrl,
  buildStoreSearchUrl,
  buildSuggestUrl,
} from '../src/features/search/urls.js';

test('buildTargetUrl strips snr and sets language and country', () => {
  const result = buildTargetUrl(
    'https://store.steampowered.com/app/10/?snr=1_5_9__205&l=english',
    { lang: 'russian', cc: 'KZ' },
  );
  const url = new URL(result);
  assert.equal(url.searchParams.get('snr'), null);
  assert.equal(url.searchParams.get('l'), 'russian');
  assert.equal(url.searchParams.get('cc'), 'kz');
});

test('buildTargetUrl keeps the page intact when no options are supplied', () => {
  const result = buildTargetUrl('https://store.steampowered.com/app/10/');
  assert.equal(result, 'https://store.steampowered.com/app/10/');
});

test('proxy URL builders support gateway, path, and query modes', () => {
  assert.equal(
    buildProxyBase({ proxyHost: '127.0.0.1', proxyPort: '8765' }),
    'http://127.0.0.1:8765',
  );
  assert.equal(
    buildProxyBase({ proxyHost: 'https://proxy.example/', proxyPort: '443' }),
    'https://proxy.example:443',
  );
  const target = 'https://store.steampowered.com/app/10/';
  assert.equal(
    buildRequestUrl(target, {
      proxyEnabled: true,
      proxyMode: 'gateway',
      proxyHost: '127.0.0.1',
      proxyPort: '8765',
    }),
    `http://127.0.0.1:8765/${target}`,
  );
  assert.equal(
    buildRequestUrl(target, {
      proxyEnabled: true,
      proxyMode: 'path',
      proxyHost: '127.0.0.1',
      proxyPort: '8765',
    }),
    'http://127.0.0.1:8765/store.steampowered.com/app/10/',
  );
  assert.equal(
    buildRequestUrl(target, {
      proxyEnabled: true,
      proxyMode: 'query',
      proxyHost: '127.0.0.1',
      proxyPort: '8765',
    }),
    `http://127.0.0.1:8765/?url=${encodeURIComponent(target)}`,
  );
});

test('guest headers contain only age-gate, language, and country cookies', () => {
  const headers = buildRequestHeaders({ lang: 'german', cc: 'DE' });
  assert.match(headers['Accept-Language'], /^de-DE/);
  assert.match(headers.Cookie, /Steam_Language=german/);
  assert.match(headers.Cookie, /steamCountry=DE%7C0/);
  assert.doesNotMatch(headers.Cookie, /sessionid|steamLoginSecure/);
});

test('search endpoints preserve the legacy parameters', () => {
  const suggest = new URL(buildSuggestUrl('portal', { lang: 'russian', cc: 'KZ' }));
  assert.equal(suggest.pathname, '/search/suggest');
  assert.equal(suggest.searchParams.get('f'), 'jsonfull');
  assert.equal(suggest.searchParams.get('require_type'), 'game,software');
  assert.equal(suggest.searchParams.get('l'), 'russian');
  assert.equal(suggest.searchParams.get('cc'), 'kz');

  const store = new URL(buildStoreSearchUrl('portal', { lang: 'english', cc: 'US' }));
  assert.equal(store.pathname, '/api/storesearch/');
  assert.equal(store.searchParams.get('term'), 'portal');

  const results = new URL(
    buildSearchResultsMetaUrl('portal', { lang: 'english', cc: 'US', count: 25 }),
  );
  assert.equal(results.pathname, '/search/results/');
  assert.equal(results.searchParams.get('count'), '25');
  assert.equal(results.searchParams.get('start'), '0');
  assert.equal(results.searchParams.get('infinite'), '1');
  assert.equal(results.searchParams.get('ignore_preferences'), '1');
});

test('guest search fetch URL derives start/page from the requested offset', () => {
  const first = new URL(
    buildGuestSearchFetchUrl('https://store.steampowered.com/search/?term=portal', {
      lang: 'english',
      cc: 'US',
      start: 0,
      count: 25,
    }),
  );
  assert.equal(first.searchParams.get('start'), null);
  assert.equal(first.searchParams.get('count'), '25');

  const third = new URL(
    buildGuestSearchFetchUrl(
      'https://store.steampowered.com/search/?term=portal&page=3',
      { lang: 'english', cc: 'US', start: 50, count: 25 },
    ),
  );
  assert.equal(third.searchParams.get('start'), '50');
  assert.equal(third.searchParams.get('page'), '3');
});

test('appdetails and appreviews URLs carry language and country', () => {
  const details = new URL(
    buildAppDetailsUrl('620', { lang: 'french', cc: 'FR' }),
  );
  assert.equal(details.pathname, '/api/appdetails');
  assert.equal(details.searchParams.get('appids'), '620');
  assert.equal(details.searchParams.get('l'), 'french');
  assert.equal(details.searchParams.get('cc'), 'fr');

  const reviews = new URL(buildAppReviewsUrl('620', { lang: 'french' }));
  assert.equal(reviews.pathname, '/appreviews/620');
  assert.equal(reviews.searchParams.get('json'), '1');
  assert.equal(reviews.searchParams.get('num_per_page'), '0');
});
