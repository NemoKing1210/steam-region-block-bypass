import test from 'node:test';
import assert from 'node:assert/strict';
import {
  blockedAppsStorageStats,
  getAppNameFromUrl,
  parseAppIdFromUrl,
  pruneBlockedAppsStore,
} from '../src/core/blocked-apps-model.js';

test('blocked app ids and names are parsed from store URLs', () => {
  assert.equal(
    parseAppIdFromUrl('https://store.steampowered.com/app/620/Portal_2/'),
    '620',
  );
  assert.equal(
    getAppNameFromUrl('https://store.steampowered.com/app/620/Portal_2/'),
    'Portal 2',
  );
  assert.equal(
    getAppNameFromUrl('https://store.steampowered.com/app/620/'),
    '',
  );
  assert.equal(parseAppIdFromUrl('https://store.steampowered.com/bundle/1/'), null);
});

test('blocked store prunes malformed ids and keeps the newest entries', () => {
  const store = {
    '10': { name: 'Ten', at: 10 },
    '20': { name: 'Twenty', at: 20 },
    abc: { name: 'Bad', at: 30 },
    '30': { name: 'Bad date', at: 'today' },
    '40': { name: '  Forty  ', at: 40 },
  };
  const pruned = pruneBlockedAppsStore(store);
  // Integer-like object keys are always enumerated in ascending numeric order.
  assert.deepEqual(Object.keys(pruned), ['10', '20', '40']);
  assert.equal(pruned['40'].name, 'Forty');
});

test('blocked storage stats count entries and UTF-8 bytes', () => {
  const stats = blockedAppsStorageStats({ '10': { name: 'Test', at: 1 } });
  assert.equal(stats.count, 1);
  assert.ok(stats.bytes > 0);
});
