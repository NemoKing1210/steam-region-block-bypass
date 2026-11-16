import { BLOCKED_APPS_MAX_ENTRIES } from './constants.js';

export function pruneBlockedAppsStore(store) {
  const entries = Object.entries(store || {}).filter(([id, entry]) => {
    return (
      /^[0-9]+$/.test(id) &&
      entry &&
      typeof entry === 'object' &&
      typeof entry.at === 'number'
    );
  });
  entries.sort((a, b) => b[1].at - a[1].at);
  const next = {};
  for (const [id, entry] of entries.slice(0, BLOCKED_APPS_MAX_ENTRIES)) {
    next[id] = {
      name: String(entry.name || '').trim(),
      at: entry.at,
    };
  }
  return next;
}

export function parseAppIdFromUrl(url = '') {
  const match = String(url).match(/\/app\/(\d+)/i);
  return match ? match[1] : null;
}

export function getAppNameFromUrl(url = '') {
  const match = String(url).match(/\/app\/\d+\/([^/?#]+)/i);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]).replace(/_/g, ' ').trim();
  } catch {
    return match[1].replace(/_/g, ' ').trim();
  }
}

export function blockedAppsStorageStats(store) {
  const count = Object.keys(store || {}).length;
  let bytes = 0;
  try {
    bytes = new TextEncoder().encode(JSON.stringify(store || {})).length;
  } catch {
    bytes = count * 48;
  }
  return { count, bytes };
}
