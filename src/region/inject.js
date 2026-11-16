import { REGION_BOOT_TIMEOUT_MS } from '../core/constants.js';
import { el, toArray } from '../utils/dom.js';
import { t } from '../i18n/index.js';
import { getSettings } from '../core/settings.js';
import { bypassRegionBlock } from './bypass.js';

export function extractStoreRoot(doc) {
  return (
    doc.querySelector?.('.game_page_background') ||
    doc.querySelector?.('#tabletGrid') ||
    doc.querySelector?.('.page_content_ctn[itemscope]') ||
    doc.querySelector?.('#game_highlights')?.closest('.page_content_ctn') ||
    null
  );
}

export function getContentMount() {
  return (
    document.querySelector('#responsive_page_template_content') ||
    document.querySelector('.responsive_page_content') ||
    document.querySelector('#error_box')?.closest('.page_content')?.parentElement ||
    document.body
  );
}

export function rewriteDocumentWithGuest(html) {
  const keep = toArray(document.querySelectorAll('style')).filter((node) =>
    node.textContent?.includes('--srbb-'),
  );
  document.open();
  document.write(html);
  document.close();
  const head = document.head || document.documentElement;
  keep.forEach((node) => head.appendChild(node.cloneNode(true)));
}

export function waitForBootComplete(timeoutMs = REGION_BOOT_TIMEOUT_MS) {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
      return;
    }
    const done = () => resolve();
    window.addEventListener('load', done, { once: true });
    setTimeout(done, Math.max(timeoutMs, 0));
  });
}

export function stripGuestSignedOutChrome(root, { signedIn = false } = {}) {
  if (!signedIn) return;
  const actions = root.querySelector('#queueActionsCtn') || root.querySelector('.queue_actions_ctn');
  actions?.querySelectorAll(':scope > p').forEach((node) => {
    if (node.querySelector('a[href*="/login"]')) node.remove();
  });
  root.querySelectorAll('.banner_open_in_steam').forEach((node) => node.remove());
}

export function createRegionBanner({ viaProxy = false, fromCache = false } = {}) {
  const region = getSettings().region;
  const details = [
    t('bannerBody'),
    viaProxy ? t('viaProxy') : '',
    fromCache ? t('viaCache') : '',
    region.countryCode ? `cc=${region.countryCode.toUpperCase()}` : '',
  ].filter(Boolean);

  const banner = el('div', 'srbb-banner srbb-region-banner');
  banner.setAttribute('role', 'status');
  banner.innerHTML = `
    <div class="srbb-banner__main">
      <span class="srbb-banner__icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 3.2 21.5 20H2.5L12 3.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M12 10v5.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="12" cy="17.6" r="1.1" fill="currentColor"/>
        </svg>
      </span>
      <div class="srbb-banner__copy">
        <div class="srbb-banner__title-row">
          <span class="srbb-banner__badge">${t('bannerBlockedBadge')}</span>
          <strong class="srbb-banner__title">${t('bannerTitle')}</strong>
        </div>
        <div class="srbb-banner__text">${details.join(' · ')}</div>
      </div>
    </div>
    <div class="srbb-banner__actions">
      <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="reload">${t('reload')}</button>
    </div>`;
  banner
    .querySelector('[data-srbb="reload"]')
    ?.addEventListener('click', () => bypassRegionBlock({ forceRefresh: true }));
  return banner;
}

export const OTHER_SITE_SELECTOR = '.apphub_OtherSiteInfo';
const OTHER_SITE_BUTTON_CLASS = 'srbb-region-othersite-reload';

function createOtherSiteButton(reloaded) {
  const button = el(
    'a',
    `btnv6_blue_hoverfade btn_medium ${OTHER_SITE_BUTTON_CLASS}`,
  );
  button.href = 'javascript:void(0)';
  button.tabIndex = 0;
  button.setAttribute('role', 'button');
  button.title = reloaded ? t('bannerBody') : t('bypassOffer');
  button.innerHTML = `<span>${reloaded ? t('reload') : t('bypassNow')}</span>`;
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void bypassRegionBlock();
  });
  button.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void bypassRegionBlock();
    }
  });
  return button;
}

export function syncOtherSiteReloadButton(visible, { reloaded = false } = {}) {
  const label = reloaded ? t('reload') : t('bypassNow');
  const hint = reloaded ? t('bannerBody') : t('bypassOffer');
  const panels = document.querySelectorAll(OTHER_SITE_SELECTOR);
  if (!visible) {
    document.querySelectorAll(`.${OTHER_SITE_BUTTON_CLASS}`).forEach((node) => node.remove());
    return false;
  }
  if (!panels.length) return false;
  panels.forEach((panel) => {
    const existing = panel.querySelector(`:scope > .${OTHER_SITE_BUTTON_CLASS}`);
    if (existing) {
      const text = existing.querySelector('span');
      if (text && text.textContent !== label) text.textContent = label;
      if (existing.title !== hint) existing.title = hint;
      return;
    }
    panel.appendChild(createOtherSiteButton(reloaded));
  });
  return true;
}

export function insertBannerIntoGrid(root, banner) {
  const scope = root?.querySelector ? root : document;
  const grid =
    scope.querySelector?.('#tabletGrid') ||
    scope.querySelector?.('.tablet_grid') ||
    (root?.id === 'tabletGrid' || root?.classList?.contains('tablet_grid') ? root : null);
  if (grid) {
    grid.insertBefore(banner, grid.firstChild);
    return;
  }
  const mount =
    scope.querySelector?.('.page_content_ctn') ||
    scope.querySelector?.('.game_page_background') ||
    scope.body ||
    scope.documentElement ||
    scope;
  mount.insertBefore(banner, mount.firstChild);
}

export function showRegionLoader() {
  hideRegionLoader();
  document.querySelectorAll('.srbb-status, .srbb-region-offer').forEach((node) => node.remove());
  const overlay = el('div', 'srbb-loader srbb-region-loader');
  overlay.id = 'srbb-region-loader';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('aria-busy', 'true');
  overlay.innerHTML = `
    <div class="srbb-loader__veil" aria-hidden="true"></div>
    <div class="srbb-loader__card">
      <div class="srbb-loader__badge">${t('badge')}</div>
      <div class="srbb-loader__spinner" aria-hidden="true"></div>
      <div class="srbb-loader__title">${t('loading')}</div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));
}

export function hideRegionLoader() {
  document.getElementById('srbb-region-loader')?.remove();
}

export function showRegionStatus(mount, kind, message, { onRetry = null } = {}) {
  document.querySelectorAll('.srbb-status, .srbb-region-offer').forEach((node) => node.remove());
  hideRegionLoader();
  const box = el('div', `srbb-status srbb-region-status srbb-region-status--${kind}`);
  box.dataset.kind = kind;
  box.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  const retryButton =
    kind === 'offer'
      ? `<button type="button" class="srbb-btn srbb-btn--green" data-srbb="bypass">${t('bypassNow')}</button>`
      : onRetry
        ? `<button type="button" class="srbb-btn" data-srbb="retry">${t('retry')}</button>`
        : '';
  box.innerHTML = `
    <div class="srbb-status__row">
      <span class="srbb-status__msg">${message}</span>
      <div class="srbb-status__actions">
        ${retryButton}
        <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="open-settings">${t('settings')}</button>
      </div>
    </div>`;
  box
    .querySelector('[data-srbb="bypass"]')
    ?.addEventListener('click', () => bypassRegionBlock());
  box.querySelector('[data-srbb="retry"]')?.addEventListener('click', onRetry);
  box.querySelector('[data-srbb="open-settings"]')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('srbb:open-settings'));
  });

  const errorBox = mount.querySelector('#error_box');
  if (errorBox) errorBox.insertAdjacentElement('afterend', box);
  else {
    const header = mount.querySelector('.page_header_ctn');
    if (header) header.insertAdjacentElement('afterend', box);
    else mount.prepend(box);
  }
}

export function showRegionOffer() {
  const mount = getContentMount();
  if (!mount || mount.querySelector('.srbb-region-offer')) return;
  showRegionStatus(mount, 'offer', t('bypassOffer'));
}
