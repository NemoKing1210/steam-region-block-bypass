import { REGION_PATTERNS } from './constants.js';

export function isRegionBlockedPage(root = document) {
  const errorEl = root.querySelector('#error_box .error, #error_box');
  if (errorEl) {
    const text = errorEl.textContent || '';
    if (REGION_PATTERNS.some((re) => re.test(text))) return true;
  }
  // Error landing without #error_box (localized Oops shell)
  const oops = root.querySelector('.pageheader');
  if (oops && /oops/i.test(oops.textContent || '')) {
    const bodyText = root.querySelector('.page_header_ctn, #error_box, .page_content')?.textContent || '';
    if (REGION_PATTERNS.some((re) => re.test(bodyText))) return true;
  }
  return false;
}

export function getAppIdFromUrl(url = location.href) {
  const match = String(url).match(/\/app\/(\d+)/i);
  return match ? match[1] : null;
}

export function isHostLoggedIn() {
  if (
    document.querySelector(
      '#account_pulldown, #account_dropdown, #header_notification_area, #global_actions .user_avatar, #global_actions .playerAvatar'
    )
  ) {
    return true;
  }
  if (document.querySelector('#global_actions a[href*="steamcommunity.com/profiles/"], #global_actions a[href*="steamcommunity.com/id/"]')) {
    return true;
  }
  return false;
}

/**
 * Guest app HTML assumes an anonymous viewer (“Sign in to add…”, “You're not signed in!”).
 * Drop that chrome when the host store session is already logged in.
 */
