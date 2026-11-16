const MODAL_CLASS = 'srbb-modal-open';

let depth = 0;
let saved = null;

export function lockPageScroll() {
  depth += 1;
  if (depth > 1 || saved) return;
  const root = document.documentElement;
  if (root.classList.contains(MODAL_CLASS)) return;
  const body = document.body;
  const y = window.scrollY || root.scrollTop || body.scrollTop || 0;
  const pad = Math.max(0, window.innerWidth - root.clientWidth);
  saved = { y, pad: body.style.paddingRight };
  root.classList.add(MODAL_CLASS);
  if (pad) body.style.paddingRight = `${pad}px`;
  body.style.top = `-${y}px`;
}

export function unlockPageScroll() {
  depth = Math.max(0, depth - 1);
  if (depth > 0 || !saved) return;
  const root = document.documentElement;
  const body = document.body;
  const { y, pad } = saved;
  saved = null;
  root.classList.remove(MODAL_CLASS);
  body.style.top = '';
  body.style.paddingRight = pad;
  window.scrollTo(0, y);
}
