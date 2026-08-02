import { state } from './state.js';
import { t } from './i18n/index.js';
import { buildTargetUrl, buildRequestUrl } from './url.js';
import { gmRequest } from './gm.js';
import { readPageCache, writePageCache, invalidatePageCache } from './cache.js';
import { isRegionBlockedPage } from './detect.js';
import { getContentMount, extractGamePageRoot, injectDirect } from './inject.js';
import { showLoaderOverlay, hideLoaderOverlay, showStatus } from './features/feedback.js';

export async function bypassRegionBlock(options = {}) {
  const forceRefresh = !!options.forceRefresh;
  const mount = getContentMount();
  if (!mount) return;

  showLoaderOverlay(t('loading'));

  try {
    const targetUrl = buildTargetUrl();
    let html = null;
    let fromCache = false;

    if (!forceRefresh) {
      html = readPageCache(targetUrl);
      fromCache = !!html;
    } else {
      invalidatePageCache(targetUrl);
    }

    if (!html) {
      const requestUrl = buildRequestUrl(targetUrl);
      const response = await gmRequest(requestUrl);

      if (response.status < 200 || response.status >= 400) {
        throw new Error(`HTTP ${response.status}`);
      }

      html = response.responseText || '';
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (isRegionBlockedPage(doc)) {
      if (fromCache) invalidatePageCache(targetUrl);
      showStatus(
        mount,
        'error',
        state.settings.proxyEnabled ? t('stillBlockedProxy') : t('stillBlockedNoProxy')
      );
      return;
    }

    if (doc.querySelector('#agecheck_form, .agegate_birthday_desc, #app_agegate')) {
      if (fromCache) invalidatePageCache(targetUrl);
      showStatus(mount, 'error', t('ageGate'));
      return;
    }

    const remoteGame = extractGamePageRoot(doc);
    if (!remoteGame) {
      if (fromCache) invalidatePageCache(targetUrl);
      showStatus(mount, 'error', t('noContent'));
      return;
    }

    if (!fromCache) {
      writePageCache(targetUrl, html);
    }

    await injectDirect(remoteGame, doc, targetUrl, { fromCache });
    hideLoaderOverlay();
  } catch (err) {
    showStatus(
      mount,
      'error',
      t('failedLoad', { error: err && err.message ? err.message : String(err) })
    );
  }
}

/**
 * Game pages use `.game_page_background > #tabletGrid > .page_content_ctn`.
 * Region-error pages use `.page_header_ctn` (“Oops”) + a bare error box — never nest into that.
 */
