export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function append(parent, node) {
  parent.appendChild(node);
  return node;
}

export function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function eachNode(collection, callback) {
  if (!collection) return;
  for (let index = 0; index < collection.length; index += 1) {
    callback(collection[index], index);
  }
}

export function toArray(collection) {
  const items = [];
  if (!collection) return items;
  for (let index = 0; index < collection.length; index += 1) {
    items.push(collection[index]);
  }
  return items;
}

export function isOwnUi(node) {
  return (
    node instanceof Element &&
    !!node.closest(
      '.srbb-panel-overlay, .srbb-confirm-overlay, .srbb-toasts, .srbb-settings-btn, .srbb-region-banner, .srbb-region-offer, .srbb-region-status, .srbb-region-loader, .srbb-region-othersite-reload',
    )
  );
}
