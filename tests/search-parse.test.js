import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMoneyAmount,
  mergeSuggestItemMeta,
  mergeSuggestSearchFields,
  mergeSuggestStoreExtras,
  normalizeSuggestItems,
  parseJsonResponse,
  parseReviewTooltip,
  parseSearchResultItems,
  trimSuggestItems,
  unionSuggestItems,
} from '../src/features/search/parse.js';

class FakeClassList {
  constructor(classes = []) {
    this.classes = new Set(classes);
  }
  contains(name) {
    return this.classes.has(name);
  }
}

class FakeNode {
  constructor({ text = '', attrs = {}, classes = [], queries = {} } = {}) {
    this.textContent = text;
    this.attrs = attrs;
    this.classList = new FakeClassList(classes);
    this.queries = queries;
  }
  getAttribute(name) {
    return this.attrs[name] ?? null;
  }
  hasAttribute(name) {
    return Object.hasOwn(this.attrs, name);
  }
  querySelector(selector) {
    return this.queries[selector] ?? null;
  }
}

function buildFixture() {
  const title = new FakeNode({ text: 'Portal 2' });
  const img = new FakeNode({ attrs: { src: 'https://cdn.example/portal.jpg' } });
  const discount = new FakeNode({
    attrs: { 'data-discount': '75', 'data-price-final': '249' },
  });
  const finalPrice = new FakeNode({ text: '$2.49' });
  const originalPrice = new FakeNode({ text: '$9.99' });
  const released = new FakeNode({ text: 'Nov 2011' });
  const platforms = new FakeNode({
    queries: {
      '.platform_img.win, .win': new FakeNode(),
      '.platform_img.mac, .mac': new FakeNode(),
      '.platform_img.linux, .linux': null,
    },
  });
  const review = new FakeNode({
    classes: ['positive'],
    attrs: {
      'data-tooltip-html':
        'Overwhelmingly Positive&lt;br&gt;98% of the 1,000 user reviews are positive.',
    },
  });
  const row = new FakeNode({
    attrs: {
      'data-ds-appid': '620',
      href: 'https://store.steampowered.com/app/620/Portal_2/',
    },
    queries: {
      '.title': title,
      '.search_capsule img, img': img,
      '.discount_block, .search_discount_block': discount,
      '.discount_final_price, .search_price': finalPrice,
      '.discount_original_price': originalPrice,
      '.search_price.free, .discount_final_price.free': null,
      '.search_platforms': platforms,
      '.search_review_summary': review,
      '.search_released': released,
    },
  });
  return {
    querySelectorAll(selector) {
      return selector === 'a.search_result_row[data-ds-appid]' ? [row] : [];
    },
  };
}

test('search results parse price, platforms, reviews, and release dates', () => {
  const previous = globalThis.DOMParser;
  globalThis.DOMParser = class {
    parseFromString() {
      return buildFixture();
    }
  };
  try {
    const items = parseSearchResultItems('<html></html>');
    assert.equal(items.length, 1);
    const item = items[0];
    assert.equal(item.id, '620');
    assert.equal(item.name, 'Portal 2');
    assert.equal(item.type, 'game');
    assert.equal(item.img, 'https://cdn.example/portal.jpg');
    assert.equal(item.priceLabel, '$2.49');
    assert.equal(item.priceOriginal, '$9.99');
    assert.equal(item.discountPct, 75);
    assert.equal(item.isFree, false);
    assert.deepEqual(item.platforms, { windows: true, mac: true, linux: false });
    assert.equal(item.releaseDate, 'Nov 2011');
    assert.equal(item.reviewSummary, 'Overwhelmingly Positive');
    assert.equal(item.reviewPercent, '98');
    assert.equal(item.reviewTone, 'positive');
  } finally {
    globalThis.DOMParser = previous;
  }
});

test('tooltip parsing decodes entities and extracts the percentage', () => {
  assert.deepEqual(
    parseReviewTooltip('Mostly Positive&lt;br&gt;75% of the 200 reviews are positive.'),
    {
      summary: 'Mostly Positive',
      percent: '75',
      detail: '75% of the 200 reviews are positive.',
    },
  );
});

test('suggest items normalise prices and preserve ids', () => {
  const items = normalizeSuggestItems([
    {
      id: 10,
      name: 'Ten',
      type: 'game',
      small_cap: 'cap.jpg',
      platforms: { windows: true, mac: false, linux: true },
      price: { final: 500, initial: 1000, currency: 'USD' },
    },
    {
      appid: '20',
      name: 'Twenty',
      price: { final: 0, initial: 0, currency: 'USD' },
    },
    { id: 30 },
  ]);
  assert.equal(items.length, 2);
  assert.equal(items[0].id, '10');
  assert.equal(items[0].discountPct, 50);
  assert.equal(items[0].priceOriginal, formatMoneyAmount(1000, 'USD'));
  assert.equal(items[1].id, '20');
  assert.equal(items[1].isFree, true);
});

test('merge order keeps storesearch prices and search metadata', () => {
  const base = [
    {
      id: '1',
      name: 'One',
      type: 'app',
      img: '',
      priceLabel: '',
      releaseDate: '',
      reviewSummary: '',
    },
  ];
  const search = [
    {
      id: '1',
      type: 'game',
      img: 'search.jpg',
      priceLabel: '$5',
      releaseDate: '2020',
      reviewSummary: 'Positive',
      reviewPercent: '90',
      reviewTone: 'positive',
      reviewDetail: 'detail',
    },
  ];
  const store = [
    { id: '1', type: 'game', img: 'store.jpg', priceLabel: '$4', isFree: false },
  ];
  const withSearch = mergeSuggestSearchFields(base, search);
  assert.equal(withSearch[0].img, 'search.jpg');
  assert.equal(withSearch[0].priceLabel, '$5');
  const withStore = mergeSuggestStoreExtras(withSearch, store);
  assert.equal(withStore[0].priceLabel, '$4');
  assert.equal(withStore[0].img, 'search.jpg');
  assert.equal(withStore[0].reviewSummary, 'Positive');

  const mergedMeta = mergeSuggestItemMeta(withStore[0], {
    priceLabel: '$1',
    releaseDate: '2021',
  });
  assert.equal(mergedMeta.priceLabel, '$4');
  assert.equal(mergedMeta.releaseDate, '2020');
});

test('union and trim keep ranking order and mandatory blocked ids', () => {
  const items = unionSuggestItems(
    [{ id: '1' }, { id: '2' }],
    [{ id: '2' }, { id: '3' }],
  );
  assert.deepEqual(items.map((item) => item.id), ['1', '2', '3']);

  const many = Array.from({ length: 30 }, (_, index) => ({ id: String(index) }));
  const trimmed = trimSuggestItems(many, ['29']);
  assert.equal(trimmed.length, 26);
  assert.equal(trimmed.at(-1).id, '29');
});

test('JSON responses tolerate Steam anti-XSSI prefixes', () => {
  assert.deepEqual(parseJsonResponse(')]}\'\n{"items":[]}'), { items: [] });
  assert.equal(parseJsonResponse('not json'), null);
});
