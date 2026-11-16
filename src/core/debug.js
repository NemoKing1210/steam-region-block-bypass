/**
 * Structured console diagnostics for Steam Region Block Bypass.
 * Every failure carries a stable SRB-#### code.
 */

export const Codes = {
  BUS_LISTENER: 'SRB-1001',
  SETTINGS_PERSIST: 'SRB-1002',
  SETTINGS_MIGRATE: 'SRB-1003',
  CACHE_READ: 'SRB-1210',
  CACHE_WRITE: 'SRB-1211',
  BLOCKED_PERSIST: 'SRB-1212',
  REGION_REQUEST: 'SRB-1410',
  REGION_RESPONSE: 'SRB-1411',
  REGION_FAILED: 'SRB-1413',
  TRANSPLANT: 'SRB-1414',
  REGION_QUEUE: 'SRB-1415',
  SEARCH_FAILED: 'SRB-1416',
};

const BADGE_STYLE =
  'background:#8a3030;color:#fff;border-radius:2px;padding:1px 6px;font-weight:bold';
const WARN_BADGE_STYLE =
  'background:#6b5416;color:#ffe1a8;border-radius:2px;padding:1px 6px;font-weight:bold';
const CODE_STYLE = 'font-weight:bold';
const INFO_STYLE = 'color:#8f98a0';

export function isVerbose() {
  try {
    if (typeof window !== 'undefined' && window.__SRBB_DEBUG__ === true) return true;
  } catch {
    /* sandbox without window access */
  }
  try {
    return localStorage.getItem('srbb_debug') === '1';
  } catch {
    return false;
  }
}

export function fail(code, message, details, cause) {
  const error = new Error(`[${code}] ${message}`);
  error.code = code;
  if (details !== undefined) error.details = details;
  if (cause !== undefined) error.cause = cause;
  return error;
}

export function previewText(text, maxLength = 120) {
  const value = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function print(printer, badgeStyle, code, message, details) {
  if (details === undefined) {
    printer(`%cSteam Region Block Bypass%c ${code} ${message}`, badgeStyle, CODE_STYLE);
  } else {
    printer(
      `%cSteam Region Block Bypass%c ${code} ${message}`,
      badgeStyle,
      CODE_STYLE,
      details,
    );
  }
}

export function logError(code, message, details) {
  print(console.error, BADGE_STYLE, code, message, details);
}

export function logWarn(code, message, details) {
  print(console.warn, WARN_BADGE_STYLE, code, message, details);
}

export function logInfo(area, message, details) {
  if (!isVerbose()) return;
  if (details === undefined) {
    console.info(`%cSRBB · ${area}%c ${message}`, INFO_STYLE, '');
  } else {
    console.info(`%cSRBB · ${area}%c ${message}`, INFO_STYLE, '', details);
  }
}
