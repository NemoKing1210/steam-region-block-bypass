import { REGION_REQUEST_TIMEOUT_MS } from '../core/constants.js';
import { Codes, fail, logError, logInfo } from '../core/debug.js';
import { t } from '../i18n/index.js';
import { showToast } from '../ui/toast.js';
import { toArray } from '../utils/dom.js';
import { getCookie, getStoreCountryCode } from './request.js';
import { getStorePageId, isHostLoggedIn } from './detect.js';

const QUEUE_SNR = '1_5_9_';
const IMG_SELECTED =
  'https://store.fastly.steamstatic.com/public/images/v6/ico/ico_selected.png';
const IMG_ARROW_DOWN =
  'https://store.fastly.steamstatic.com/public/images/v6/btn_arrow_down_padded.png';
const IMG_SEL_BRIGHT =
  'https://store.fastly.steamstatic.com/public/images/v6/ico/ico_selected_bright.png';
const IMG_UNSEL_BRIGHT =
  'https://store.fastly.steamstatic.com/public/images/v6/ico/ico_unselected_bright.png';

const SESSION_RE = /g_sessionID\s*=\s*"([^"]+)"/;
const ACCOUNT_RE = /g_AccountID\s*=\s*(\d+)/;
const DYNAMIC_INIT_RE = /GDynamicStore\.Init\(\s*(\d+)/;

export function parseLiveSession(root = document) {
  let sessionId = '';
  let accountId = 0;
  const scripts = root.querySelectorAll?.('script:not([src])') ?? [];
  for (let index = 0; index < scripts.length; index += 1) {
    const code = scripts[index].textContent || '';
    if (!sessionId) {
      const match = code.match(SESSION_RE);
      if (match) sessionId = match[1];
    }
    if (!accountId) {
      const match = code.match(ACCOUNT_RE) || code.match(DYNAMIC_INIT_RE);
      const parsed = match ? Number.parseInt(match[1], 10) : 0;
      if (parsed > 0) accountId = parsed;
    }
    if (sessionId && accountId) break;
  }
  if (!sessionId) sessionId = getCookie('sessionid');
  return { sessionId, accountId };
}

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Math.max(REGION_REQUEST_TIMEOUT_MS, 0),
  );
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

function storePost(path, params) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) body.append(key, String(value));
  return fetchWithTimeout(`https://store.steampowered.com${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: body.toString(),
  }).then(async (response) => {
    if (!response.ok) {
      throw fail(Codes.REGION_QUEUE, `queue POST ${path} HTTP ${response.status}`, {
        status: response.status,
      });
    }
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  });
}

async function fetchQueueState(accountId, appid) {
  const state = { onWishlist: false, ignored: false, ignoreReason: 0 };
  if (!accountId) return state;
  const cc = getStoreCountryCode();
  const url = `https://store.steampowered.com/dynamicstore/userdata/?id=${accountId}${cc ? `&cc=${cc}` : ''}`;
  try {
    const response = await fetchWithTimeout(url, { credentials: 'same-origin' });
    if (!response.ok) throw fail(Codes.REGION_QUEUE, `queue state HTTP ${response.status}`);
    const data = await response.json();
    const wishlist = data?.rgWishlist;
    if (Array.isArray(wishlist)) {
      state.onWishlist = wishlist.some((id) => String(id) === String(appid));
    } else if (wishlist && typeof wishlist === 'object') {
      state.onWishlist =
        Object.prototype.hasOwnProperty.call(wishlist, appid) ||
        Object.prototype.hasOwnProperty.call(wishlist, Number(appid));
    }
    const ignored = data?.rgIgnoredApps;
    if (ignored && typeof ignored === 'object') {
      const key = Object.prototype.hasOwnProperty.call(ignored, appid)
        ? appid
        : Object.prototype.hasOwnProperty.call(ignored, Number(appid))
          ? Number(appid)
          : null;
      if (key !== null) {
        state.ignored = true;
        const reason = Number(ignored[key]?.ignored_reason ?? ignored[key]?.reason ?? 0);
        state.ignoreReason = reason === 2 ? 2 : 0;
      }
    }
  } catch (error) {
    logInfo('region', 'queue state fetch failed, keeping defaults', {
      error: String(error?.message || error),
    });
  }
  return state;
}

function buildQueueHtml() {
  return `
    <div id="add_to_wishlist_area">
      <a class="btnv6_blue_hoverfade btn_medium add_to_wishlist" href="javascript:void(0)">
        <span>${t('queueAddToWishlist')}</span>
      </a>
    </div>
    <div id="add_to_wishlist_area_success" style="display: none; position: relative;">
      <a href="javascript:void(0)" class="btnv6_blue_hoverfade btn_medium queue_btn_active add_to_wishlist" id="view_wishlist_btn">
        <span><img src="${IMG_SELECTED}" border="0"> ${t('queueOnWishlist')}</span>
      </a>
      <div id="wishlistDropDown" class="queue_control_button queue_btn_menu">
        <div class="queue_menu_arrow queue_btn_active btn_medium">
          <span><img src="${IMG_ARROW_DOWN}"></span>
        </div>
        <div class="queue_menu_flyout">
          <div class="queue_menu_flyout_content">
            <div class="queue_menu_option">
              <div class="queue_menu_option_label">
                <a href="https://store.steampowered.com/wishlist/" class="option_title">${t('queueManageWishlist')}</a>
              </div>
            </div>
            <div class="queue_menu_option">
              <div class="queue_menu_option_label">
                <a href="javascript:void(0)" class="option_title" data-srbb-queue-remove>${t('queueRemoveWishlist')}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="wishlist_added_temp_notice" style="display: none;">${t('queueAddedNotice')}</div>
    </div>
    <div id="add_to_wishlist_area_fail" style="display: none;"><b>${t('queueOops')}</b></div>
    <div id="queueBtnFollow" class="queue_control_button queue_btn_follow" style="flex-grow: 0;">
      <button class="btnv6_blue_hoverfade btn_medium queue_btn_inactive" data-panel='{"focusable":true,"clickOnActivate":true}' role="button" type="button" data-srbb-queue-follow>
        <span>${t('queueFollow')}</span>
      </button>
      <button class="btnv6_blue_hoverfade btn_medium queue_btn_active" data-panel='{"focusable":true,"clickOnActivate":true}' role="button" type="button" style="display: none;" data-srbb-queue-unfollow>
        <span><img src="${IMG_SELECTED}" border="0"> ${t('queueFollowing')}</span>
      </button>
    </div>
    <div id="ignoreBtn" style="position: relative; display: flex;">
      <div class="queue_control_button queue_btn_ignore">
        <button class="btnv6_blue_hoverfade btn_medium queue_btn_inactive" data-panel='{"focusable":true,"clickOnActivate":true}' role="button" type="button" data-srbb-queue-ignore>
          <span>${t('queueIgnore')}</span>
        </button>
        <button class="btnv6_blue_hoverfade btn_medium queue_btn_active" data-panel='{"focusable":true,"clickOnActivate":true}' role="button" type="button" style="display: none;" data-srbb-queue-unignore>
          <span><img src="${IMG_SELECTED}" border="0"> ${t('queueIgnored')}</span>
        </button>
      </div>
      <div id="queue_btn_ignore_menu" class="queue_control_button queue_btn_menu">
        <button class="queue_menu_arrow btn_medium queue_btn_inactive" id="queue_ignore_menu_arrow" aria-haspopup="menu" aria-expanded="false" aria-controls="ignore_menu_flyout" type="button">
          <span><img alt="${t('queueIgnoreOptions')}" src="${IMG_ARROW_DOWN}"></span>
        </button>
        <div class="queue_menu_flyout" id="ignore_menu_flyout" role="menu">
          <div class="queue_menu_flyout_content">
            <button class="queue_menu_option" role="menuitem" id="queue_ignore_menu_option_not_interested" type="button">
              <div>
                <img class="queue_ignore_menu_option_image selected" src="${IMG_SEL_BRIGHT}">
                <img class="queue_ignore_menu_option_image unselected" src="${IMG_UNSEL_BRIGHT}">
              </div>
              <div class="queue_menu_option_label">
                <div class="option_title">${t('queueIgnoreDefault')}</div>
                <div class="option_subtitle">${t('queueIgnoreDefaultSub')}</div>
              </div>
            </button>
            <button class="queue_menu_option" role="menuitem" id="queue_ignore_menu_option_owned_elsewhere" type="button">
              <div>
                <img class="queue_ignore_menu_option_image selected" src="${IMG_SEL_BRIGHT}">
                <img class="queue_ignore_menu_option_image unselected" src="${IMG_UNSEL_BRIGHT}">
              </div>
              <div class="queue_menu_option_label">
                <div class="option_title">${t('queuePlayedElsewhere')}</div>
                <div class="option_subtitle">${t('queuePlayedElsewhereSub')}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

function buildQueueTail() {
  return `
    <div class="expand_to_fill"></div>
    <a href="https://store.steampowered.com/explore/?snr=${QUEUE_SNR}" class="btnv6_blue_hoverfade btn_medium right responsive_hidden">
      <span>${t('queueViewQueue')}&nbsp;&nbsp;&nbsp;<i class="ico16 arrow_next"></i></span>
    </a>`;
}

function setWishlist(container, on) {
  const area = container.querySelector('#add_to_wishlist_area');
  const success = container.querySelector('#add_to_wishlist_area_success');
  const failArea = container.querySelector('#add_to_wishlist_area_fail');
  if (area) area.style.display = on ? 'none' : '';
  if (success) success.style.display = on ? '' : 'none';
  if (failArea) failArea.style.display = 'none';
}

function setFollow(container, on) {
  const follow = container.querySelector('[data-srbb-queue-follow]');
  const unfollow = container.querySelector('[data-srbb-queue-unfollow]');
  if (follow) follow.style.display = on ? 'none' : '';
  if (unfollow) unfollow.style.display = on ? '' : 'none';
}

function setIgnored(container, ignored, reason = 0) {
  const ignore = container.querySelector('[data-srbb-queue-ignore]');
  const unignore = container.querySelector('[data-srbb-queue-unignore]');
  if (ignore) ignore.style.display = ignored ? 'none' : '';
  if (unignore) unignore.style.display = ignored ? '' : 'none';
  const menu = container.querySelector('#queue_btn_ignore_menu');
  const arrow = container.querySelector('#queue_ignore_menu_arrow');
  menu?.classList.remove('not_interested', 'owned_elsewhere');
  arrow?.classList.remove('queue_btn_active', 'queue_btn_inactive');
  if (ignored) {
    menu?.classList.add(reason === 2 ? 'owned_elsewhere' : 'not_interested');
    arrow?.classList.add('queue_btn_active');
  } else {
    arrow?.classList.add('queue_btn_inactive');
  }
}

function reportActionError(action, appid, error) {
  logError(Codes.REGION_QUEUE, `queue ${action} failed`, {
    appid,
    error: String(error?.message || error),
  });
  showToast({
    kind: 'error',
    title: t('queueActionFailed'),
    message: t('queueActionFailedDesc'),
    id: 'srbb-queue-action',
  });
}

function guardBusy(button) {
  if (button.dataset.srbbBusy === '1') return false;
  button.dataset.srbbBusy = '1';
  return true;
}

function wireQueueActions(container, { appid, sessionId }) {
  let ignoreReason = 0;
  const base = { sessionid: sessionId, appid };

  const wishAdd = container.querySelector('#add_to_wishlist_area > a');
  const wishRemove = container.querySelector('#view_wishlist_btn');
  const wishRemoveLink = container.querySelector('[data-srbb-queue-remove]');
  const wishFail = container.querySelector('#add_to_wishlist_area_fail');
  const wishNotice = container.querySelector('.wishlist_added_temp_notice');

  const doWishlist = async (button, remove) => {
    if (!guardBusy(button)) return;
    try {
      await storePost(remove ? '/api/removefromwishlist' : '/api/addtowishlist', base);
      setWishlist(container, !remove);
      if (!remove && wishNotice) {
        wishNotice.style.display = '';
        setTimeout(() => {
          wishNotice.style.display = 'none';
        }, 3000);
      }
    } catch (error) {
      if (wishFail) wishFail.style.display = '';
      reportActionError(remove ? 'remove-wishlist' : 'add-wishlist', appid, error);
    } finally {
      delete button.dataset.srbbBusy;
    }
  };
  wishAdd?.addEventListener('click', (event) => {
    event.preventDefault();
    void doWishlist(wishAdd, false);
  });
  const doRemove = (event) => {
    event.preventDefault();
    void doWishlist(event.currentTarget, true);
  };
  wishRemove?.addEventListener('click', doRemove);
  wishRemoveLink?.addEventListener('click', doRemove);

  const doFollow = async (button, unfollow) => {
    if (!guardBusy(button)) return;
    try {
      await storePost('/explore/followgame/', unfollow ? { ...base, unfollow: 1 } : base);
      setFollow(container, !unfollow);
    } catch (error) {
      reportActionError(unfollow ? 'unfollow' : 'follow', appid, error);
    } finally {
      delete button.dataset.srbbBusy;
    }
  };
  container
    .querySelector('[data-srbb-queue-follow]')
    ?.addEventListener('click', (event) => void doFollow(event.currentTarget, false));
  container
    .querySelector('[data-srbb-queue-unfollow]')
    ?.addEventListener('click', (event) => void doFollow(event.currentTarget, true));

  const doIgnore = async (button, remove, reason = 0) => {
    if (!guardBusy(button)) return;
    try {
      await storePost(
        '/recommended/ignorerecommendation/',
        remove
          ? { ...base, snr: QUEUE_SNR, remove: 1 }
          : { ...base, snr: QUEUE_SNR, ignore_reason: reason },
      );
      if (!remove) ignoreReason = reason;
      setIgnored(container, !remove, ignoreReason);
      container.querySelector('#queue_ignore_menu_arrow')?.setAttribute('aria-expanded', 'false');
    } catch (error) {
      reportActionError(remove ? 'unignore' : 'ignore', appid, error);
    } finally {
      delete button.dataset.srbbBusy;
    }
  };
  container
    .querySelector('[data-srbb-queue-ignore]')
    ?.addEventListener('click', (event) => void doIgnore(event.currentTarget, false, 0));
  container
    .querySelector('[data-srbb-queue-unignore]')
    ?.addEventListener('click', (event) => void doIgnore(event.currentTarget, true));
  container
    .querySelector('#queue_ignore_menu_option_not_interested')
    ?.addEventListener('click', (event) => {
      const active = container.querySelector('[data-srbb-queue-unignore]');
      if (active && active.style.display !== 'none' && ignoreReason === 0) {
        void doIgnore(active, true);
      } else {
        void doIgnore(event.currentTarget, false, 0);
      }
    });
  container
    .querySelector('#queue_ignore_menu_option_owned_elsewhere')
    ?.addEventListener('click', (event) => {
      const active = container.querySelector('[data-srbb-queue-unignore]');
      if (active && active.style.display !== 'none' && ignoreReason === 2) {
        void doIgnore(active, true);
      } else {
        void doIgnore(event.currentTarget, false, 2);
      }
    });

  const arrow = container.querySelector('#queue_ignore_menu_arrow');
  const flyout = container.querySelector('#ignore_menu_flyout > div');
  arrow?.addEventListener('click', () => {
    const expanded = arrow.getAttribute('aria-expanded') === 'true';
    arrow.setAttribute('aria-expanded', String(!expanded));
    if (!expanded) flyout?.querySelector('.queue_menu_option')?.focus({ preventScroll: true });
  });
  flyout?.addEventListener('focusout', (event) => {
    if (!flyout.contains(event.relatedTarget)) arrow?.setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('click', (event) => {
    if (arrow?.getAttribute('aria-expanded') !== 'true') return;
    if (!container.querySelector('#ignoreBtn')?.contains(event.target)) {
      arrow.setAttribute('aria-expanded', 'false');
    }
  });

  return {
    applyState(state) {
      setWishlist(container, state.onWishlist);
      setIgnored(container, state.ignored, state.ignoreReason);
      ignoreReason = state.ignoreReason;
    },
  };
}

export function restoreQueueActions() {
  try {
    const page = getStorePageId();
    if (!page || page.kind !== 'app') return false;
    if (!isHostLoggedIn()) return false;
    const container = document.querySelector('#queueActionsCtn');
    if (!container || container.dataset.srbbQueueRestored === '1') return false;
    if (container.querySelector('#add_to_wishlist_area')) return false;
    if (!container.querySelector('a[href*="/login"]')) return false;
    const { sessionId, accountId } = parseLiveSession();
    if (!sessionId) {
      logInfo('region', 'queue restore skipped: no live session found');
      return false;
    }
    const template = document.createElement('template');
    template.innerHTML = buildQueueHtml().trim();
    const shareBtn = container.querySelector('#shareBtn');
    container.querySelectorAll(':scope > p').forEach((node) => {
      if (node.querySelector('a[href*="/login"]')) node.remove();
    });
    toArray(template.content.children).forEach((node) =>
      container.insertBefore(node, shareBtn),
    );
    const tail = document.createElement('template');
    tail.innerHTML = buildQueueTail().trim();
    toArray(tail.content.children).forEach((node) => container.appendChild(node));
    if (!document.getElementById('queueCtn')) {
      container.closest('.queue_ctn')?.setAttribute('id', 'queueCtn');
    }
    container.setAttribute('data-panel', '{"flow-children":"column"}');
    container.dataset.srbbQueueRestored = '1';
    const wired = wireQueueActions(container, { appid: page.id, sessionId });
    if (accountId) {
      void fetchQueueState(accountId, page.id).then((state) => {
        if (container.isConnected) wired.applyState(state);
      });
    }
    logInfo('region', 'queue actions restored', { appid: page.id });
    return true;
  } catch (error) {
    logError(Codes.REGION_QUEUE, 'queue restore skipped', {
      error: String(error?.message || error),
    });
    return false;
  }
}
