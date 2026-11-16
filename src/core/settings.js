import { GM_getValue, GM_setValue } from '$';
import { Codes, logError, logInfo } from './debug.js';
import {
  LEGACY_SETTINGS_KEY,
  SETTINGS_KEY,
  getDefaults,
} from './constants.js';
import {
  mergeSettings,
  migrateFlatSettings,
  normalizeSettings,
} from './settings-model.js';

function readValue(key) {
  try {
    return GM_getValue(key, null);
  } catch {
    return null;
  }
}

export function loadSettings() {
  let raw = readValue(SETTINGS_KEY);
  if (!raw || typeof raw !== 'object') {
    const legacy = readValue(LEGACY_SETTINGS_KEY);
    if (legacy && typeof legacy === 'object') {
      const migrated = migrateFlatSettings(legacy);
      try {
        GM_setValue(SETTINGS_KEY, migrated);
        logInfo('settings', 'migrated flat settings to v2');
      } catch (error) {
        logError(Codes.SETTINGS_MIGRATE, 'failed to persist migrated settings', {
          error: String(error?.message || error),
        });
      }
      return migrated;
    }
    return getDefaults();
  }
  return normalizeSettings(raw);
}

let settings = loadSettings();

export function getSettings() {
  return settings;
}

export function saveSettings(patch) {
  settings = mergeSettings(patch, settings);
  try {
    GM_setValue(SETTINGS_KEY, settings);
  } catch (error) {
    logError(Codes.SETTINGS_PERSIST, 'failed to persist settings', {
      error: String(error?.message || error),
    });
  }
  return settings;
}

export function resetSettings() {
  settings = getDefaults();
  try {
    GM_setValue(SETTINGS_KEY, settings);
  } catch (error) {
    logError(Codes.SETTINGS_PERSIST, 'failed to persist reset settings', {
      error: String(error?.message || error),
    });
  }
  return settings;
}
