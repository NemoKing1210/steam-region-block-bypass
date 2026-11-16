import { el } from '../../utils/dom.js';
import { t } from '../../i18n/index.js';
import { createButton } from './controls.js';

let activeClose = null;

export function confirmDialog({
  title,
  message = '',
  confirmLabel,
  cancelLabel = t('cancel'),
  tone = 'danger',
} = {}) {
  activeClose?.(false);
  return new Promise((resolve) => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const overlay = el('div', 'srbb-confirm-overlay');
    overlay.setAttribute('role', 'presentation');

    const dialog = el('div', 'srbb-confirm');
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-modal', 'true');
    if (title) dialog.setAttribute('aria-label', title);
    if (title) dialog.appendChild(el('div', 'srbb-confirm__title', title));
    if (message) dialog.appendChild(el('div', 'srbb-confirm__message', message));

    const actions = el('div', 'srbb-confirm__actions');
    const cancelButton = createButton(cancelLabel, () => close(false), 'srbb-btn--ghost');
    const confirmButton = createButton(
      confirmLabel,
      () => close(true),
      tone === 'primary' ? '' : 'srbb-btn--danger',
    );
    actions.append(cancelButton, confirmButton);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    function close(value) {
      if (activeClose === close) activeClose = null;
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.remove();
      resolve(value);
      previouslyFocused?.focus?.();
    }
    activeClose = close;

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close(false);
      }
    }

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close(false);
    });
    document.addEventListener('keydown', onKeyDown, true);
    (tone === 'danger' ? cancelButton : confirmButton).focus();
  });
}
