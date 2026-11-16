import { isHostLoggedIn } from './detect.js';

export function stylesheetKey(href) {
  try {
    const url = new URL(href, location.href);
    return (url.pathname.split('/').pop() || '').toLowerCase() || url.href;
  } catch {
    return String(href || '').toLowerCase();
  }
}

export function detectSteamCssBase() {
  const storeLink = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map((link) => link.href)
    .find((href) => /\/css\/v6\/store\.css/i.test(href) || /\/store\.css(\?|$)/i.test(href));
  if (storeLink) return storeLink.replace(/store\.css(\?.*)?$/i, '');
  return 'https://store.fastly.steamstatic.com/public/css/v6/';
}

export function resolveSteamStylesheet(fileName, cssV6Base) {
  const shared = [
    'motiva_sans.css',
    'shared_global.css',
    'buttons.css',
    'shared_responsive.css',
    'jquery-ui-1.7.2.custom.css',
  ];
  if (shared.includes(fileName)) {
    return `https://store.fastly.steamstatic.com/public/shared/css/${fileName}`;
  }
  if (fileName === 'apphub.css') {
    return 'https://community.fastly.steamstatic.com/public/css/skin_1/apphub.css';
  }
  return `${cssV6Base}${fileName}`;
}

export function absolutizeUrls(root) {
  root.querySelectorAll('[src], [href], source[srcset]').forEach((node) => {
    for (const attr of ['src', 'href']) {
      const value = node.getAttribute(attr);
      if (
        !value ||
        value.startsWith('#') ||
        value.startsWith('javascript:') ||
        value.startsWith('data:') ||
        value.startsWith('blob:')
      ) {
        continue;
      }
      try {
        node.setAttribute(attr, new URL(value, 'https://store.steampowered.com/').href);
      } catch {
        /* ignore */
      }
    }
    const srcset = node.getAttribute('srcset');
    if (srcset) {
      try {
        node.setAttribute(
          'srcset',
          srcset
            .split(',')
            .map((part) => {
              const bits = part.trim().split(/\s+/);
              bits[0] = new URL(bits[0], 'https://store.steampowered.com/').href;
              return bits.join(' ');
            })
            .join(', '),
        );
      } catch {
        /* ignore */
      }
    }
  });
}

export function ensureAppPageStylesheets(remoteDoc) {
  const head = document.head || document.documentElement;
  const existing = new Set(
    [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) =>
      stylesheetKey(link.href),
    ),
  );
  const baseFromPage = detectSteamCssBase();
  const toAdd = [];

  remoteDoc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const raw = link.getAttribute('href');
    if (!raw || /^(chrome-extension|moz-extension|blob):/i.test(raw)) return;
    if (/error\.css/i.test(raw)) return;
    let href;
    try {
      href = new URL(raw, 'https://store.steampowered.com/').href;
    } catch {
      return;
    }
    if (!/steamstatic\.com|steampowered\.com/i.test(href) || href.includes('Steam_files')) {
      const name = raw.split('/').pop().split('?')[0];
      if (!name || !/\.css$/i.test(name)) return;
      href = resolveSteamStylesheet(name, baseFromPage);
    }
    const key = stylesheetKey(href);
    if (!key || existing.has(key)) return;
    existing.add(key);
    toAdd.push(href);
  });

  for (const name of [
    'store_game_shared.css',
    'game.css',
    'store_background_shared.css',
    'apphub.css',
    'user_reviews.css',
    'recommended.css',
    'user_reviews_rewards.css',
    'game_mob.css',
  ]) {
    const href = resolveSteamStylesheet(name, baseFromPage);
    const key = stylesheetKey(href);
    if (existing.has(key)) continue;
    existing.add(key);
    toAdd.push(href);
  }

  toAdd.forEach((href) => {
    const node = document.createElement('link');
    node.rel = 'stylesheet';
    node.type = 'text/css';
    node.href = href;
    node.dataset.srbbStyle = '1';
    head.appendChild(node);
  });
  return toAdd.length;
}

function runInlineScript(code) {
  const node = document.createElement('script');
  node.dataset.srbbScript = '1';
  node.textContent = code;
  (document.body || document.documentElement).appendChild(node);
  node.remove();
}

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

async function waitForSrbbStylesheets() {
  const links = [...document.querySelectorAll('link[data-srbb-style="1"]')];
  await Promise.all(
    links.map(
      (link) =>
        new Promise((resolve) => {
          if (link.sheet) {
            resolve();
            return;
          }
          const done = () => resolve();
          link.addEventListener('load', done, { once: true });
          link.addEventListener('error', done, { once: true });
          if (link.sheet) done();
        }),
    ),
  );
  await waitForPaint();
}

export function upgradeGuestAppTagModalForHostSession(modal) {
  if (!isHostLoggedIn()) return;
  const right = modal.querySelector('.app_tag_modal_right');
  if (!right || right.querySelector('#app_tag_form')) return;
  if (!right.querySelector('a[href*="/login"]')) return;
  right.innerHTML = `
    <h2>Tags you've applied to this product:<span class="app_tag_modal_tooltip" data-store-tooltip="These are tags you've applied to this product.">(?)</span></h2>
    <div class="app_tags your_tags"></div>
    <p>Enter a new tag in English:</p>
    <p class="small">Suitable tags should be terms that other users would find useful to browse by.</p>
    <form id="app_tag_form" name="app_tag_form">
      <div class="app_tag_form_ctn">
        <div class="gray_bevel for_text_input fullwidth">
          <input type="text" name="tag" value="" autocomplete="off" placeholder="Enter a tag">
        </div>
        <button class="btnv6_blue_hoverfade btn_medium" type="submit"><span>Add</span></button>
      </div>
    </form>
    <div class="previous_tags_ctn">
      <p>Apply a tag you've used on other products:</p>
      <div class="app_tags previous_tags"></div>
    </div>`;
}

export function injectGuestAppTaggingModal(remoteDoc) {
  document.querySelectorAll('#app_tagging_modal').forEach((node) => node.remove());
  const modal = remoteDoc.querySelector('#app_tagging_modal');
  if (!modal) return false;
  const node = document.importNode(modal, true);
  node.querySelectorAll('script').forEach((script) => script.remove());
  absolutizeUrls(node);
  upgradeGuestAppTagModalForHostSession(node);
  (document.body || document.documentElement).appendChild(node);
  return true;
}

export function fixupSteamWidgets() {
  runInlineScript(`
(function () {
if (typeof $J === 'undefined') return;
function fitTags() {
  if (typeof AdjustVisibleAppTags === 'function') {
    $J('.glance_tags.popular_tags, .popular_tags[data-appid], .your_tags[data-appid]').each(function () {
      AdjustVisibleAppTags($J(this));
    });
  }
  $J(window).trigger('resize');
  $J('.glance_tags.popular_tags').each(function () {
    var $tags = $J(this).children('.app_tag:not(.add_button)');
    if ($tags.length && $tags.filter(':visible').length === 0) $tags.show();
  });
}
fitTags();
setTimeout(fitTags, 100);
setTimeout(fitTags, 400);
})();
`);
}

export async function applyGuestFixups(remoteDoc) {
  ensureAppPageStylesheets(remoteDoc);
  injectGuestAppTaggingModal(remoteDoc);
  await waitForSrbbStylesheets();
  await waitForPaint();
  runInlineScript(`
(function () {
if (typeof $J !== 'undefined') $J(window).off('resize.VisibleAppTags');
})();
`);
  fixupSteamWidgets();
}
