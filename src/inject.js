import { getAppIdFromUrl, isHostLoggedIn } from './detect.js';
import { createBanner } from './features/feedback.js';

export function extractGamePageRoot(doc) {
  return (
    doc.querySelector('.game_page_background') ||
    doc.querySelector('#tabletGrid') ||
    doc.querySelector('.page_content_ctn[itemscope]') ||
    doc.querySelector('#game_highlights')?.closest('.page_content_ctn') ||
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

export function clearErrorPageContent(template) {
  template
    .querySelectorAll(
      [
        '.page_header_ctn',
        '#error_box',
        '.srbb-shell',
        '.srbb-status',
        '.srbb-banner',
        '.srbb-injected',
        '.srbb-iframe-wrap',
        '.game_page_background',
        '#tabletGrid',
        '.page_content_ctn',
      ].join(', ')
    )
    .forEach((el) => el.remove());

  // Tag modal lives outside .game_page_background; drop leftovers from a prior inject
  document.querySelectorAll('#app_tagging_modal').forEach((el) => el.remove());

  // Leftover “Oops” blocks that are not inside page_header_ctn
  template.querySelectorAll('.pageheader').forEach((h2) => {
    if (/oops/i.test(h2.textContent || '')) {
      const block = h2.closest('.page_content') || h2.parentElement;
      block?.remove();
    }
  });
}

export function applyAppBodyClasses() {
  const body = document.body;
  body.classList.remove('redeemwalletcode');
  for (const cls of ['app', 'game_bg', 'menu_background_overlap', 'application']) {
    body.classList.add(cls);
  }
}

export function absolutizeUrls(root) {
  root.querySelectorAll('[src], [href], source[srcset]').forEach((el) => {
    for (const attr of ['src', 'href']) {
      const val = el.getAttribute(attr);
      if (!val || val.startsWith('#') || val.startsWith('javascript:') || val.startsWith('data:') || val.startsWith('blob:')) {
        continue;
      }
      try {
        el.setAttribute(attr, new URL(val, 'https://store.steampowered.com/').href);
      } catch {
        /* ignore */
      }
    }
    const srcset = el.getAttribute('srcset');
    if (srcset) {
      try {
        el.setAttribute(
          'srcset',
          srcset
            .split(',')
            .map((part) => {
              const bits = part.trim().split(/\s+/);
              bits[0] = new URL(bits[0], 'https://store.steampowered.com/').href;
              return bits.join(' ');
            })
            .join(', ')
        );
      } catch {
        /* ignore */
      }
    }
  });

  root.querySelectorAll('img[data-src]').forEach((img) => {
    if (!img.getAttribute('src')) {
      try {
        img.setAttribute('src', new URL(img.getAttribute('data-src'), 'https://store.steampowered.com/').href);
      } catch {
        img.setAttribute('src', img.getAttribute('data-src'));
      }
    }
  });
}

/**
 * Error pages only load store.css + error.css.
 * App pages also need game.css, store_game_shared.css, apphub.css, etc.
 * Without those, purchase blocks and columns render as a raw vertical stack.
 */

export function ensureAppPageStylesheets(remoteDoc) {
  const head = document.head || document.documentElement;
  const existing = new Set(
    [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => stylesheetKey(link.href))
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

    // Saved/local relative names → map onto Steam CDN using store.css location
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

  // Guaranteed fallbacks if the guest HTML somehow omits them
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
    const el = document.createElement('link');
    el.rel = 'stylesheet';
    el.type = 'text/css';
    el.href = href;
    el.dataset.srbbStyle = '1';
    head.appendChild(el);
  });

  return toAdd.length;
}

export function stylesheetKey(href) {
  try {
    const u = new URL(href, location.href);
    const file = (u.pathname.split('/').pop() || '').toLowerCase();
    return file || u.href;
  } catch {
    return String(href || '').toLowerCase();
  }
}

export function detectSteamCssBase() {
  const storeLink = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map((l) => l.href)
    .find((h) => /\/css\/v6\/store\.css/i.test(h) || /\/store\.css(\?|$)/i.test(h));
  if (storeLink) {
    return storeLink.replace(/store\.css(\?.*)?$/i, '');
  }
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

export function isExecutableScriptTag(script) {
  const type = (script.getAttribute('type') || 'text/javascript').trim().toLowerCase();
  if (!type || type === 'text/javascript' || type === 'application/javascript' || type === 'text/jscript') {
    return true;
  }
  return false;
}

export function isBlockedScriptSrc(src) {
  return /^(chrome-extension|moz-extension|blob):/i.test(src || '') || /alikeguardian|steamdb\.info\/ext/i.test(src || '');
}

export function isBlockedScriptCode(code) {
  return /alikeguardian|ag_changes|chrome-extension:\/\//i.test(code || '');
}

export function scriptKey(href) {
  try {
    const u = new URL(href, location.href);
    const parts = u.pathname.split('/').filter(Boolean);
    return (parts.slice(-3).join('/') || u.href).toLowerCase();
  } catch {
    return String(href || '').toLowerCase();
  }
}

export function loadExternalScript(href) {
  return new Promise((resolve) => {
    const el = document.createElement('script');
    el.src = href;
    el.async = false;
    el.dataset.srbbScript = '1';
    el.onload = () => resolve();
    el.onerror = () => {
      console.warn('[SRBB] failed to load script', href);
      resolve();
    };
    (document.head || document.documentElement).appendChild(el);
  });
}

export function runInlineScript(code) {
  const el = document.createElement('script');
  el.dataset.srbbScript = '1';
  el.textContent = code;
  (document.body || document.documentElement).appendChild(el);
}

export function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

/**
 * Newly injected app CSS must be applied before Steam widgets measure layout.
 * AdjustVisibleAppTags hides every .app_tag when the container width is still 0.
 */

export async function waitForSrbbStylesheets() {
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
          // Sheet may appear between the check and the listeners
          if (link.sheet) done();
        })
    )
  );
  await waitForPaint();
}

/**
 * Re-run Steam tag fitting (and a visible fallback) after layout settles.
 * Tags ship as display:none; InitAppTagModal → AdjustVisibleAppTags reveals them by width.
 */

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
    if ($tags.length && $tags.filter(':visible').length === 0) {
      $tags.show();
    }
  });
}

fitTags();
setTimeout(fitTags, 100);
setTimeout(fitTags, 400);
})();
`);
}

/** Host store session (header), not the anonymous guest HTML we inject. */

export function stripGuestSignedOutChrome(root) {
  if (!isHostLoggedIn()) return;

  const actions = root.querySelector('#queueActionsCtn') || root.querySelector('.queue_actions_ctn');
  if (actions) {
    actions.querySelectorAll(':scope > p').forEach((p) => {
      if (p.querySelector('a[href*="/login"]')) p.remove();
    });
  }

  root.querySelectorAll('.banner_open_in_steam').forEach((el) => el.remove());
}

/**
 * Error / Oops shells omit app libs (game.js, gamehighlightplayer.js, …).
 * Load any Steam CDN scripts from the guest document that are not already present.
 * Skips the React store application bundles — those are already booted on the host page.
 */

export function upgradeGuestAppTagModalForHostSession(modal) {
  if (!isHostLoggedIn()) return;
  const right = modal.querySelector('.app_tag_modal_right');
  if (!right || right.querySelector('#app_tag_form')) return;
  if (!right.querySelector('a[href*="/login"]')) return;

  // Steam requires new tags in English; match the logged-in store markup.
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
    </div>
  `;
}

export function injectGuestAppTaggingModal(remoteDoc) {
  document.querySelectorAll('#app_tagging_modal').forEach((el) => el.remove());
  const modal = remoteDoc.querySelector('#app_tagging_modal');
  if (!modal) return false;
  const node = document.importNode(modal, true);
  node.querySelectorAll('script').forEach((el) => el.remove());
  absolutizeUrls(node);
  upgradeGuestAppTagModalForHostSession(node);
  (document.body || document.documentElement).appendChild(node);
  return true;
}

/**
 * Page-level bootstraps (GStoreItemData, …) sit in <head>/early <body>, outside
 * .game_page_background. Widget inits live inside the extracted game tree.
 * importNode copies <script> nodes but does not execute them — re-create + append.
 */

export function collectGuestInlineScripts(remoteDoc, wrapper) {
  const codes = [];
  const seen = new Set();

  const push = (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed || seen.has(trimmed) || isBlockedScriptCode(trimmed)) return;
    seen.add(trimmed);
    codes.push(trimmed);
  };

  remoteDoc.querySelectorAll('script:not([src])').forEach((script) => {
    if (!isExecutableScriptTag(script)) return;
    const code = script.textContent || '';
    const isStoreBoot =
      /GStoreItemData|g_bUseOldReviewDisplay|g_rgAppKeywords|g_rgAppData/i.test(code) &&
      !/home_tab_section|InitTopSellersControls|g_rgDelayedLoadImages/i.test(code);
    // Defines window.ShowAppTagModal; lives next to #app_tagging_modal (outside game root)
    const isAppTagInit = /InitAppTagModal\s*\(/i.test(code);
    if (isStoreBoot || isAppTagInit) {
      push(code);
    }
  });

  wrapper.querySelectorAll('script').forEach((script) => {
    if (!isExecutableScriptTag(script)) return;
    if (script.getAttribute('src')) return;
    push(script.textContent || '');
  });

  return codes;
}

export async function injectDirect(remoteGame, remoteDoc, sourceUrl, options = {}) {
  const template = getContentMount();
  clearErrorPageContent(template);
  applyAppBodyClasses();
  ensureAppPageStylesheets(remoteDoc);

  const shell = document.createElement('div');
  shell.className = 'srbb-shell srbb-shell--direct';

  const wrapper = document.createElement('div');
  wrapper.className = 'srbb-injected';

  // Preserve the real Steam wrappers so layout CSS still applies
  if (remoteGame.classList.contains('game_page_background')) {
    wrapper.appendChild(document.importNode(remoteGame, true));
  } else if (remoteGame.id === 'tabletGrid' || remoteGame.classList.contains('tablet_grid')) {
    const bg = document.createElement('div');
    bg.className = 'game_page_background game';
    bg.appendChild(document.importNode(remoteGame, true));
    wrapper.appendChild(bg);
  } else {
    const bg = document.createElement('div');
    bg.className = 'game_page_background game';
    const grid = document.createElement('div');
    grid.id = 'tabletGrid';
    grid.className = 'tablet_grid';
    grid.appendChild(document.importNode(remoteGame, true));
    bg.appendChild(grid);
    wrapper.appendChild(bg);
  }

  const inlineScripts = collectGuestInlineScripts(remoteDoc, wrapper);

  // Drop inert copied scripts + extension junk; Steam JS is re-run below
  wrapper.querySelectorAll('script, .alike_sub, #ag_changes_button, .ag_changes').forEach((el) => el.remove());
  absolutizeUrls(wrapper);
  stripGuestSignedOutChrome(wrapper);
  insertBannerIntoTabletGrid(wrapper, createBanner({ fromCache: !!options.fromCache }));

  shell.appendChild(wrapper);
  template.appendChild(shell);
  injectGuestAppTaggingModal(remoteDoc);

  const title = docTitle(wrapper);
  if (title) document.title = title;
  else if (getAppIdFromUrl(sourceUrl)) {
    /* keep existing title */
  }

  await waitForSrbbStylesheets();
  await ensureAppPageScripts(remoteDoc);
  await waitForPaint();
  // Avoid stacking VisibleAppTags handlers when InitAppTagModal re-runs on Reload
  runInlineScript(`
(function () {
if (typeof $J !== 'undefined') $J(window).off('resize.VisibleAppTags');
})();
`);
  for (const code of inlineScripts) {
    try {
      runInlineScript(code);
    } catch (err) {
      console.warn('[SRBB] injected script error', err);
    }
  }
  fixupSteamWidgets();
}

export function insertBannerIntoTabletGrid(root, banner) {
  const grid =
    root.querySelector?.('#tabletGrid') ||
    root.querySelector?.('.tablet_grid') ||
    (root.id === 'tabletGrid' || root.classList?.contains('tablet_grid') ? root : null);
  if (grid) {
    grid.insertBefore(banner, grid.firstChild);
    return;
  }
  const mount =
    root.querySelector?.('.page_content_ctn') ||
    root.querySelector?.('.game_page_background') ||
    root.body ||
    root;
  mount.insertBefore(banner, mount.firstChild);
}

export function docTitle(root) {
  const name =
    root.querySelector?.('.apphub_AppName')?.textContent ||
    root.querySelector?.('#appHubAppName')?.textContent ||
    root.querySelector?.('.apphub_AppName')?.textContent;
  return name ? `${name.trim()} on Steam` : null;
}

export async function ensureAppPageScripts(remoteDoc) {
  const existing = new Set(
    [...document.querySelectorAll('script[src]')].map((s) => scriptKey(s.src)).filter(Boolean)
  );
  const toLoad = [];

  remoteDoc.querySelectorAll('script[src]').forEach((script) => {
    if (!isExecutableScriptTag(script)) return;
    const raw = script.getAttribute('src');
    if (!raw || isBlockedScriptSrc(raw)) return;

    let href;
    try {
      href = new URL(raw, 'https://store.steampowered.com/').href;
    } catch {
      return;
    }

    if (!/steamstatic\.com|steampowered\.com/i.test(href)) return;
    if (/\/javascript\/applications\//i.test(href)) return;

    const key = scriptKey(href);
    if (!key || existing.has(key)) return;
    existing.add(key);
    toLoad.push(href);
  });

  for (const href of toLoad) {
    await loadExternalScript(href);
  }
  return toLoad.length;
}

/**
 * #app_tagging_modal + InitAppTagModal sit near the footer, outside
 * .game_page_background. ShowAppTagModal is only assigned inside InitAppTagModal.
 * Guest HTML only ships a Sign In panel on the right; restore the tagging form when
 * the host session is already logged in so InitAppTagModal can wire it up.
 */
