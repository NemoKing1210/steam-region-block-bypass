const listeners = new Set();
let installed = false;

function notify() {
  for (const fn of [...listeners]) {
    try {
      fn(location.href);
    } catch {
      /* one bad listener never breaks navigation */
    }
  }
}

function install() {
  if (installed) return;
  installed = true;
  for (const method of ['pushState', 'replaceState']) {
    try {
      const original = history[method];
      if (typeof original !== 'function' || original.__srbbWrapped) continue;
      const wrapped = function (...args) {
        const result = original.apply(this, args);
        notify();
        return result;
      };
      wrapped.__srbbWrapped = true;
      history[method] = wrapped;
    } catch {
      /* history is not patchable here */
    }
  }
  window.addEventListener('popstate', notify);
  window.addEventListener('hashchange', notify);
}

export function watchStoreNavigation(fn) {
  install();
  listeners.add(fn);
  return () => listeners.delete(fn);
}
