import { el } from '../../utils/dom.js';
import { t } from '../../i18n/index.js';

const ICONS = {
  sliders:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9"/></svg>',
  globe:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/></svg>',
  bell:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75v-.7V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>',
  database:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/></svg>',
  swap:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>',
  info:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9-3.75h.008v.008H12V8.25z"/></svg>',
};

export function getIconSvg(name) {
  return ICONS[name] || '';
}

export function createSection({ icon, title }) {
  const section = el('section', 'srbb-panel__section');
  const caption = el('div', 'srbb-panel__section-title');
  caption.setAttribute('role', 'heading');
  caption.setAttribute('aria-level', '2');
  if (icon && ICONS[icon]) {
    const iconHolder = el('span', 'srbb-panel__section-icon');
    iconHolder.setAttribute('aria-hidden', 'true');
    iconHolder.innerHTML = ICONS[icon];
    caption.appendChild(iconHolder);
  }
  caption.appendChild(el('span', '', title));
  section.appendChild(caption);
  return section;
}

export function createHint(text) {
  return el('p', 'srbb-hint', text);
}

export function createField({ label, control, hint }) {
  const field = el('div', 'srbb-field');
  if (label) field.appendChild(el('span', 'srbb-field__label', label));
  if (control) {
    if (label && control instanceof HTMLSelectElement && !control.getAttribute('aria-label')) {
      control.setAttribute('aria-label', label);
    }
    field.appendChild(control);
  }
  if (hint) field.appendChild(el('p', 'srbb-hint', hint));
  return field;
}

function buildSwitch(checked, onChange, label) {
  const switchControl = el('label', 'srbb-switch');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  if (label) input.setAttribute('aria-label', label);
  input.addEventListener('change', () => onChange(input.checked));
  switchControl.append(input, el('span', 'srbb-switch__track'), el('span', 'srbb-switch__label', label));
  return { root: switchControl, input };
}

function syncPill(pill, on) {
  pill.textContent = on ? t('on') : t('off');
  pill.classList.toggle('is-on', on);
}

export function createSwitchRow({ checked, onChange, label }) {
  const row = el('div', 'srbb-panel__section--row');
  const { root, input } = buildSwitch(checked, onChange, label);
  const pill = el('span', 'srbb-pill', '');
  syncPill(pill, checked);
  input.addEventListener('change', () => syncPill(pill, input.checked));
  row.append(root, pill);
  return row;
}

export function createSelect(options, value, onChange) {
  const select = el('select', 'srbb-select');
  for (const option of options) {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    select.appendChild(opt);
  }
  select.value = value;
  select.addEventListener('change', () => onChange(select.value));
  return select;
}

export function createNumberInput({ value, min = 0, max = 120, step = 1, onChange }) {
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'srbb-select';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener('change', () => {
    let next = Math.round(Number(input.value));
    if (!Number.isFinite(next)) next = min;
    next = Math.min(max, Math.max(min, next));
    input.value = String(next);
    onChange(next);
  });
  return input;
}

export function createTextInput({
  value = '',
  placeholder = '',
  maxLength = 253,
  onChange,
  inputMode = 'text',
  type = 'text',
}) {
  const input = document.createElement('input');
  input.type = type === 'password' ? 'password' : 'text';
  input.className = 'srbb-input';
  input.value = value ?? '';
  if (placeholder) input.placeholder = placeholder;
  if (maxLength) input.maxLength = maxLength;
  if (inputMode && inputMode !== 'text') input.inputMode = inputMode;
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('spellcheck', 'false');
  input.addEventListener('change', () => onChange(input.value));
  return input;
}

export function createButton(labelText, onClick, className = '') {
  const button = el('button', `srbb-btn ${className}`.trim(), labelText);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}
