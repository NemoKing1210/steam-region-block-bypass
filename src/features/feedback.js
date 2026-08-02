import { state } from '../state.js';
import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { bypassRegionBlock } from '../bypass.js';
import { getContentMount } from '../inject.js';
import { togglePanel } from './panel.js';

export function createBanner(options = {}) {
  const banner = document.createElement('div');
  banner.className = 'srbb-banner';
  const details = [
    escapeHtml(t('bannerBody')),
    state.settings.proxyEnabled ? escapeHtml(t('viaProxy')) : '',
    options.fromCache ? escapeHtml(t('viaCache')) : '',
    state.settings.countryCode ? `cc=${state.settings.countryCode.toUpperCase()}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

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
          <span class="srbb-banner__badge">${escapeHtml(t('bannerBlockedBadge'))}</span>
          <strong class="srbb-banner__title">${escapeHtml(t('bannerTitle'))}</strong>
        </div>
        <div class="srbb-banner__text">${details}</div>
      </div>
    </div>
    <div class="srbb-banner__actions">
      <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="reload">${escapeHtml(t('reload'))}</button>
    </div>
  `;
  banner.querySelector('[data-srbb="reload"]')?.addEventListener('click', () =>
    bypassRegionBlock({ forceRefresh: true })
  );
  return banner;
}

export function showBypassOffer() {
  const mount = getContentMount();
  if (!mount) return;
  showStatus(mount, 'offer', t('bypassOffer'));
}

export function showLoaderOverlay(message) {
  document.getElementById('srbb-loader')?.remove();
  document.querySelectorAll('.srbb-status').forEach((el) => el.remove());

  const overlay = document.createElement('div');
  overlay.id = 'srbb-loader';
  overlay.className = 'srbb-loader';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('aria-busy', 'true');
  overlay.innerHTML = `
    <div class="srbb-loader__veil" aria-hidden="true"></div>
    <div class="srbb-loader__card">
      <div class="srbb-loader__badge">${escapeHtml(t('badge'))}</div>
      <div class="srbb-loader__spinner" aria-hidden="true"></div>
      <div class="srbb-loader__title">${escapeHtml(message)}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));
}

export function hideLoaderOverlay() {
  const overlay = document.getElementById('srbb-loader');
  if (!overlay || overlay.dataset.leaving === '1') return;
  overlay.dataset.leaving = '1';
  overlay.classList.remove('is-visible');
  overlay.classList.add('is-leaving');
  const remove = () => overlay.remove();
  overlay.addEventListener('transitionend', remove, { once: true });
  setTimeout(remove, 320);
}

export function showStatus(mount, kind, message) {
  hideLoaderOverlay();
  let box = mount.querySelector(':scope > .srbb-status, .srbb-status');
  if (!box || !mount.contains(box)) {
    box = document.createElement('div');
    box.className = 'srbb-status';
    const errorBox = mount.querySelector('#error_box');
    if (errorBox) errorBox.insertAdjacentElement('afterend', box);
    else {
      const header = mount.querySelector('.page_header_ctn');
      if (header) header.insertAdjacentElement('afterend', box);
      else mount.prepend(box);
    }
  }
  box.dataset.kind = kind;
  const primaryAction =
    kind === 'offer'
      ? `<button type="button" class="srbb-btn srbb-btn--green" data-srbb="bypass">${escapeHtml(t('bypassNow'))}</button>`
      : kind === 'error'
        ? `<button type="button" class="srbb-btn" data-srbb="retry">${escapeHtml(t('retry'))}</button>`
        : '';
  box.innerHTML = `
    <div class="srbb-status__row">
      <span class="srbb-status__msg">${escapeHtml(message)}</span>
      <div class="srbb-status__actions">
        ${primaryAction}
        <button type="button" class="srbb-btn srbb-btn--ghost" data-srbb="open-settings">${escapeHtml(t('settings'))}</button>
      </div>
    </div>
  `;
  box.querySelector('[data-srbb="bypass"]')?.addEventListener('click', () => bypassRegionBlock());
  box.querySelector('[data-srbb="retry"]')?.addEventListener('click', () => bypassRegionBlock());
  box.querySelector('[data-srbb="open-settings"]')?.addEventListener('click', () => togglePanel(true));
}
