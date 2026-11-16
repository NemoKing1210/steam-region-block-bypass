import { t } from '../../i18n/index.js';
import { escapeHtml } from '../../utils/html.js';

export function getSearchForm() {
  return document.querySelector('form[role="search"][action*="/search"]');
}

export function getSearchInput(form = getSearchForm()) {
  return form?.querySelector('input[name="term"]') || null;
}

export function getSearchMount(form = getSearchForm()) {
  if (!form) return null;
  return form.closest('div')?.parentElement || form.parentElement || null;
}

export function ensureSuggestDropdown(mount, onOpenSettings) {
  if (!mount || document.getElementById('srbb-suggest')) return;

  const panel = document.createElement('div');
  panel.id = 'srbb-suggest';
  panel.className = 'srbb-suggest';
  panel.hidden = true;
  panel.setAttribute('role', 'listbox');
  panel.innerHTML = `
    <div class="srbb-suggest__notice" id="srbb-suggest-notice">
      <div class="srbb-suggest__notice-text">${escapeHtml(t('suggestGuestNotice'))}</div>
      <button type="button" class="srbb-suggest__notice-btn" data-srbb="suggest-settings">${escapeHtml(t('suggestGuestSettings'))}</button>
    </div>
    <div class="srbb-suggest__inner"></div>
    <div class="srbb-suggest__probe" id="srbb-suggest-probe" hidden>
      <div class="srbb-suggest__probe-track"><div class="srbb-suggest__probe-fill" id="srbb-suggest-probe-fill"></div></div>
      <div class="srbb-suggest__probe-label" id="srbb-suggest-probe-label"></div>
    </div>
    <div class="srbb-suggest__stats" id="srbb-suggest-stats" hidden>
      <span class="srbb-suggest__stat srbb-suggest__stat--available" id="srbb-suggest-stat-available"></span>
      <span class="srbb-suggest__stat srbb-suggest__stat--blocked" id="srbb-suggest-stat-blocked"></span>
    </div>
  `;
  mount.appendChild(panel);

  panel.querySelector('[data-srbb="suggest-settings"]')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onOpenSettings?.();
  });
  panel.addEventListener('mousedown', (event) => {
    if (event.target.closest('[data-srbb="suggest-settings"]')) return;
    event.preventDefault();
  });
}
