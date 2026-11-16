import { getSettings } from '../core/settings.js';
import { emit } from '../core/bus.js';
import { Codes, fail, logError, logInfo } from '../core/debug.js';
import { t } from '../i18n/index.js';
import {
  buildRequestUrl,
  buildTargetUrl,
  guestFetch,
  getSteamStoreLanguage,
  getStoreCountryCode,
} from './request.js';
import { isHostLoggedIn, isRegionBlockedPage } from './detect.js';
import {
  extractStoreRoot,
  getContentMount,
  hideRegionLoader,
  rewriteDocumentWithGuest,
  showRegionLoader,
  showRegionStatus,
} from './inject.js';
import { transplantGuestContent } from './transplant.js';
import { applyGuestFixups } from './fixups.js';
import { restoreQueueActions } from './queue.js';
import {
  invalidatePageCache,
  readPageCache,
  writePageCache,
} from '../core/page-cache.js';

let running = false;

export function isRegionBypassActive() {
  return running;
}

export function isRegionInjected() {
  return document.documentElement.classList.contains('srbb-region-injected');
}

export async function bypassRegionBlock(options = {}) {
  if (running) return;
  const region = getSettings().region;
  if (!region.enabled) return;
  const forceRefresh = !!options.forceRefresh;
  const mount = getContentMount();
  if (!mount) return;
  running = true;
  showRegionLoader();
  try {
    const lang = getSteamStoreLanguage();
    const cc = getStoreCountryCode(region);
    const targetUrl = buildTargetUrl(location.href, { lang, cc });
    let html = null;
    let fromCache = false;
    if (!forceRefresh) {
      html = readPageCache(targetUrl);
      fromCache = !!html;
    } else {
      invalidatePageCache(targetUrl);
    }

    if (!html) {
      const response = await guestFetch(buildRequestUrl(targetUrl, region), region);
      if (response.status < 200 || response.status >= 400) {
        throw fail(Codes.REGION_REQUEST, `guest request HTTP ${response.status}`, {
          status: response.status,
        });
      }
      html = response.responseText || '';
    }

    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (isRegionBlockedPage(doc)) {
      if (fromCache) invalidatePageCache(targetUrl);
      showRegionStatus(
        mount,
        'error',
        region.proxyEnabled ? t('stillBlockedProxy') : t('stillBlockedNoProxy'),
        { onRetry: () => bypassRegionBlock() },
      );
      return;
    }
    if (doc.querySelector('#agecheck_form, .agegate_birthday_desc, #app_agegate')) {
      if (fromCache) invalidatePageCache(targetUrl);
      showRegionStatus(mount, 'error', t('ageGate'), {
        onRetry: () => bypassRegionBlock(),
      });
      return;
    }

    const remoteRoot = extractStoreRoot(doc);
    if (!remoteRoot) {
      if (fromCache) invalidatePageCache(targetUrl);
      throw fail(Codes.REGION_RESPONSE, t('noContent'));
    }

    const viaProxy = !!(region.proxyEnabled && region.proxyHost.trim());
    const signedIn = isHostLoggedIn();
    let transplanted = false;
    try {
      await transplantGuestContent(doc, remoteRoot);
      transplanted = true;
    } catch (error) {
      logInfo('region', 'transplant failed, falling back to rewrite', {
        error: String(error?.message || error),
      });
      transplanted = false;
      rewriteDocumentWithGuest(html);
    }
    if (transplanted) {
      if (signedIn) restoreQueueActions();
      try {
        await applyGuestFixups(doc);
      } catch (error) {
        logInfo('region', 'guest fixups failed, keeping transplanted page', {
          error: String(error?.message || error),
        });
      }
    }

    if (!fromCache) writePageCache(targetUrl, html);
    document.documentElement.classList.add('srbb-region-injected');
    hideRegionLoader();
    emit('region:rewrote', {
      url: location.href,
      viaProxy,
      signedIn,
      transplanted,
      fromCache,
    });
  } catch (error) {
    const detail =
      error?.details?.status ??
      error?.details?.statusText ??
      String(error?.message || error).replace(/^\[SRB-\d{4}\]\s*/, '');
    logError(Codes.REGION_FAILED, 'region bypass failed', {
      error: String(error?.message || error),
    });
    showRegionStatus(mount, 'error', t('failedLoad', { error: detail }), {
      onRetry: () => bypassRegionBlock(),
    });
  } finally {
    running = false;
  }
}
