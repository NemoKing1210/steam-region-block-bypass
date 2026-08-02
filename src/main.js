import { GM_setValue, GM_registerMenuCommand } from '$';
import './styles/main.css';
import './settings.js';
import { t } from './i18n/index.js';
import { state } from './state.js';
import { ensureSettingsButton, observeHeader, togglePanel } from './features/panel.js';
import { initSearchUnblocked } from './features/suggest.js';
import { isRegionBlockedPage } from './detect.js';
import { rememberBlockedAppFromPage } from './blocked-apps.js';
import { bypassRegionBlock } from './bypass.js';
import { showBypassOffer } from './features/feedback.js';

function init() {
  try {
    GM_setValue('srbb_search_term', '');
  } catch {
    /* ignore */
  }
  GM_registerMenuCommand(t('menuSettings'), () => {
    ensureSettingsButton().then(() => togglePanel(true));
  });

  ensureSettingsButton();
  observeHeader();
  initSearchUnblocked();

  if (isRegionBlockedPage()) {
    rememberBlockedAppFromPage();
    if (state.settings.autoBypass) {
      bypassRegionBlock();
    } else {
      showBypassOffer();
    }
    return;
  }
}

init();
