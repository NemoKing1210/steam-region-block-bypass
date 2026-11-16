import { on } from '../core/bus.js';
import { getSettings } from '../core/settings.js';
import { normalizeToastPosition } from '../core/settings-model.js';
import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

export const TOAST_KINDS = ['success', 'error', 'info', 'warning'];

const MAX_TOASTS = 4;
const DEFAULT_DURATION = 3200;
const EXIT_MS = 220;

const active = new Map();
let seq = 0;
let subscribed = false;

const ICONS = {
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9.25" stroke="currentColor" stroke-width="1.6"/><path d="M7.8 12.2 10.6 15l5.6-6.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9.25" stroke="currentColor" stroke-width="1.6"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  warning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.2 21.5 20H2.5L12 3.2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 10v5.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.1" fill="currentColor"/></svg>`,
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9.25" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="8" r="1.15" fill="currentColor"/></svg>`,
};

function normalizeKind(value) {
  return TOAST_KINDS.includes(value) ? value : 'info';
}

function ensureContainer() {
  let root = document.getElementById('srbb-toasts');
  if (!root) {
    root = document.createElement('div');
    root.id = 'srbb-toasts';
    root.className = 'srbb-toasts';
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-relevant', 'additions');
    document.body.appendChild(root);
  }
  syncToastContainer();
  return root;
}

export function syncToastContainer() {
  const root = document.getElementById('srbb-toasts');
  if (!root) return;
  root.dataset.position = normalizeToastPosition(getSettings().toasts.position);
}

export function initToasts() {
  syncToastContainer();
  if (subscribed) return;
  subscribed = true;
  on('settings:toasts', syncToastContainer);
}

export function showToast(options = {}) {
  const title = String(options.title ?? '').trim();
  if (!title) return null;

  const enabled = getSettings().toasts?.enabled !== false;
  if (!enabled && !options.force) return null;

  const kind = normalizeKind(options.kind ?? options.type);
  const duration =
    typeof options.duration === 'number' && Number.isFinite(options.duration)
      ? Math.max(0, options.duration)
      : DEFAULT_DURATION;
  const key = options.id ?? options.key;
  const id = key ? String(key) : `srbb-toast-${++seq}`;

  if (active.has(id)) dismissToast(id, { immediate: true });

  const root = ensureContainer();
  trimStack(root);

  const node = document.createElement('div');
  node.className = 'srbb-toast';
  node.dataset.kind = kind;
  node.dataset.toastId = id;
  node.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  const message = options.message != null ? String(options.message).trim() : '';
  node.innerHTML = `
    <span class="srbb-toast__icon">${ICONS[kind]}</span>
    <div class="srbb-toast__body">
      <div class="srbb-toast__title">${escapeHtml(title)}</div>
      ${message ? `<div class="srbb-toast__message">${escapeHtml(message)}</div>` : ''}
    </div>
    <button type="button" class="srbb-toast__close" aria-label="${escapeHtml(t('closeToast'))}">×</button>
    ${duration > 0 ? '<div class="srbb-toast__progress" aria-hidden="true"><span></span></div>' : ''}
  `;

  const isBottom = (root.dataset.position || '').startsWith('bottom');
  if (isBottom) root.appendChild(node);
  else root.insertBefore(node, root.firstChild);

  const entry = {
    el: node,
    timer: null,
    raf: 0,
    started: 0,
    remaining: duration,
    duration,
    paused: false,
  };
  active.set(id, entry);

  node.querySelector('.srbb-toast__close')?.addEventListener('click', (event) => {
    event.stopPropagation();
    dismissToast(id);
  });
  node.addEventListener('click', () => {
    if (typeof options.onClick === 'function') options.onClick();
    dismissToast(id);
  });

  if (duration > 0) {
    node.addEventListener('mouseenter', () => pauseTimer(id));
    node.addEventListener('mouseleave', () => resumeTimer(id));
    startTimer(id);
  }

  requestAnimationFrame(() => node.classList.add('is-visible'));
  return id;
}

export function toastSettingChanged(title, enabled, opts = {}) {
  return showToast({
    title,
    message: enabled ? t('toastSettingOn') : t('toastSettingOff'),
    kind: 'success',
    id: opts.id,
    force: opts.force,
  });
}

export function dismissToast(id, opts = {}) {
  const entry = active.get(id);
  if (!entry) return;
  clearEntryTimers(entry);
  active.delete(id);

  if (opts.immediate) {
    entry.el.remove();
    return;
  }
  entry.el.classList.remove('is-visible');
  entry.el.classList.add('is-leaving');
  window.setTimeout(() => entry.el.remove(), EXIT_MS);
}

export function dismissAllToasts(opts = {}) {
  for (const id of [...active.keys()]) dismissToast(id, opts);
}

function trimStack(root) {
  while (active.size >= MAX_TOASTS) {
    const oldestId = [...active.keys()][0];
    if (!oldestId) break;
    dismissToast(oldestId, { immediate: true });
  }
  while (root.children.length >= MAX_TOASTS) {
    root.lastElementChild?.remove();
  }
}

function clearEntryTimers(entry) {
  if (entry.timer) {
    clearTimeout(entry.timer);
    entry.timer = null;
  }
  if (entry.raf) {
    cancelAnimationFrame(entry.raf);
    entry.raf = 0;
  }
}

function startTimer(id) {
  const entry = active.get(id);
  if (!entry || entry.duration <= 0) return;
  entry.paused = false;
  entry.started = performance.now();
  const bar = entry.el.querySelector('.srbb-toast__progress > span');
  if (bar) {
    bar.style.transition = 'none';
    bar.style.transform = `scaleX(${entry.remaining / entry.duration})`;
    void bar.offsetWidth;
    bar.style.transition = `transform ${entry.remaining}ms linear`;
    bar.style.transform = 'scaleX(0)';
  }
  entry.timer = setTimeout(() => dismissToast(id), entry.remaining);
}

function pauseTimer(id) {
  const entry = active.get(id);
  if (!entry || entry.paused || entry.duration <= 0) return;
  entry.paused = true;
  const elapsed = performance.now() - entry.started;
  entry.remaining = Math.max(0, entry.remaining - elapsed);
  clearEntryTimers(entry);
  const bar = entry.el.querySelector('.srbb-toast__progress > span');
  if (bar) {
    const ratio = entry.duration ? entry.remaining / entry.duration : 0;
    bar.style.transition = 'none';
    bar.style.transform = `scaleX(${ratio})`;
  }
}

function resumeTimer(id) {
  const entry = active.get(id);
  if (!entry || !entry.paused || entry.duration <= 0) return;
  if (entry.remaining <= 0) {
    dismissToast(id);
    return;
  }
  startTimer(id);
}
