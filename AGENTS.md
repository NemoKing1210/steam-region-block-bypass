# AGENTS.md — Steam Region Block Bypass

Instructions for AI coding agents working in this repository.

## Project

Userscript that restores Steam store app pages blocked with “unavailable in your region” by refetching as a guest (`GM_xmlhttpRequest` + `anonymous: true`) and injecting the real game layout. Optional guest search (header suggest + opt-in `/search` page). Optional companion: Node HTTP gateway (`proxy-gateway.mjs`) for IP-based locks.

Built with [Vite](https://vitejs.dev/) + [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey).

- **Source:** `src/main.js`
- **Canonical install artifacts (committed):** `steam-region-block-bypass.user.js`, `steam-region-block-bypass.meta.js`
- **Version source of truth:** `package.json` `version` (userscript header + `SCRIPT_VERSION`)
- **Docs:** `README.md`, `CHANGELOG.md`, `DEVELOPMENT.md`, `CONTRIBUTING.md`, `DESIGN.md`
- **License:** MIT

Not affiliated with Valve/Steam. Do not add purchase, activation, or account-login bypass logic. Scope is **viewing** store HTML that Steam already serves to anonymous visitors.

Edit source under `src/`, then run `npm run build` to refresh the root install files. Do not hand-edit the built `.user.js` / `.meta.js`.

## Repository layout

```text
steam-region-block-bypass/
├── src/
│   ├── main.js              # Locale, bootDocument, region:rewrote handler
│   ├── core/                # constants, settings model/storage, bus, debug, cache, blocked apps
│   ├── region/              # urls, detect, request, transplant, inject, queue, fixups, bypass, lifecycle
│   ├── features/search/     # URLs, parse/appdetails, API, render, suggest DOM/header, guest page/state, probe
│   ├── features/settings/   # panel, controls, confirm, pages/*
│   ├── i18n/                # meta, locale index, ten locale files
│   ├── ui/                  # toasts
│   ├── utils/               # dom, html, pool, navigation, scrollLock
│   └── styles/              # tokens, base, panel, region, search, cache, toast, index
├── tests/                   # Node built-in unit tests
├── scripts/
│   ├── copy-dist.mjs
│   ├── verify-artifacts.mjs
│   └── lib/artifacts.mjs
├── .github/workflows/ci.yml
├── dist/                    # Vite output (gitignored)
├── steam-region-block-bypass.user.js
├── steam-region-block-bypass.meta.js
├── proxy-gateway.mjs
├── package.json
├── vite.config.js
├── README.md
├── CHANGELOG.md
├── DEVELOPMENT.md
├── CONTRIBUTING.md
├── DESIGN.md
├── AGENTS.md
└── CLAUDE.md
```

## Architecture (high level)

1. Match `https://store.steampowered.com/*` at `document-idle`.
2. Detect region error (`#error_box` / Oops shell + `REGION_PATTERNS`).
3. `buildTargetUrl(sourceUrl, { lang, cc })` — strip `snr`, set `?l=`, optional `?cc=` (callers resolve settings/cookies).
4. Optional proxy rewrite via `buildRequestUrl()`.
5. Anonymous `GM_xmlhttpRequest` with age-gate + `Steam_Language` cookies (`buildRequestHeaders()`).
6. Parse HTML → `extractStoreRoot()` → `transplantGuestContent()` (live-document swap, head styles, missing bundles, inline scripts). On failure, `rewriteDocumentWithGuest()` is the only full-document fallback.
7. Signed-in app pages: `restoreQueueActions()` rebuilds wishlist/follow/ignore controls; `applyGuestFixups()` restores tag editing/fitting and app stylesheets.
8. Emit `region:rewrote`; `main.js` waits for boot on rewrite, boots features, inserts the banner, then emits `region:injected`.
9. Guest search: header suggest + optional `/search` page refetch; blocked-app registry + signed-in probes. Behaviour and endpoints must stay identical to 1.x.

Settings key: `srbb_settings_v2` (one-time migration from flat `srbb_settings`). Page cache: `srbb_page_cache`. Blocked apps: `srbb_blocked_apps`. There is no global mutable state bag: feature state is module-local, cross-feature reactions use `core/bus.js`.

UI: settings entry in account dropdown `#account_dropdown` (logged-out fallback in `#global_actions`), home-list panel `#srbb-panel` over `#srbb-panel-overlay` with General / Search / Cache / Proxy / About pages, draft editing, and Reset / Cancel / Save / Save & reload. Prefix classes/ids with `srbb-`.

## Conventions

- Vanilla JS ESM modules under `src/`; no frameworks. Import GM APIs from `$` (`vite-plugin-monkey` client).
- Mutable runtime state is module-local; cross-feature reactions use `core/bus.js` events (`settings:*`, `region:rewrote`, `region:injected`).
- Prefer existing patterns: constants in `core/constants.js`, pure models for testable logic, strings in `i18n/locales/`, DOM features in `features/`, shared helpers in `utils/`.
- Transplant into the live document first, keeping the full-document rewrite fallback. Do not reintroduce iframe/blob insert mode.
- Guest requests must stay **anonymous** (no session cookies). Only age-gate / language / optional country cookies in the Cookie header.
- Signed-in probing may use `sessionFetch()` (`anonymous: false`, no Cookie override) for blocked detection only.
- When adding UI strings: update **all ten** locale files in `src/i18n/locales/` with identical keys/placeholders and keep localized `@name` / `@description` in `vite.config.js` aligned when metadata changes.
- Supported UI locales: `en`, `ru`, `zh-CN`, `es`, `pt-BR`, `de`, `fr`, `ja`, `ko`, `pl`.
- Userscript metadata lives in `vite.config.js` — not hand-written in built files.
- After changing source or metadata, run `npm run build` so root artifacts stay in sync.
- Add or update focused tests under `tests/` for pure logic; `npm run ci` runs tests, build, and artifact verification.
- Production builds minify JS/CSS; edit `src/` for readable code.
- **Always bump** `package.json` `version` when shipping user-visible changes.
- **Keep README.md in sync** with features, settings, install flow, and architecture.
  Translated READMEs (`README.ru.md`, `README.zh-CN.md`, `README.es.md`,
  `README.pt-BR.md`, `README.de.md`, `README.fr.md`, `README.ja.md`,
  `README.ko.md`, `README.pl.md`) must be updated in the same PR; keep the
  language switcher and section structure aligned with `README.md`.
- README screenshots live in `docs/screenshots/` and are embedded from
  `raw.githubusercontent.com` URLs. Refresh them (and update every README's
  captions) when the settings panel or guest search UI changes.
- Gateway: ESM Node + `undici`; do not expand into a general-purpose proxy product unless asked.

## Commands

```bash
npm install
npm run dev       # Vite + monkey HMR (dev: userscript)
npm run build     # Production → dist/ + copy to root
npm test          # Node built-in unit tests
npm run ci        # tests + build + verify artifacts
npm run gateway   # optional local proxy gateway
# PORT=8765 UPSTREAM_PROXY=socks5://127.0.0.1:1080 npm run gateway
```

## Releases

1. Bump `version` in `package.json` (SemVer) once per release.
2. Run `npm run build`.
3. Add a Keep a Changelog entry in `CHANGELOG.md`.
4. Update README version badge / docs if user-visible.

### Changelog discipline

- Do **not** add a new version section for every small follow-up while finishing one feature.
- While iterating on the same unreleased work, keep a **single** upcoming version entry.

## Do not

- Commit secrets, proxy credentials, or local `@updateURL` / `@downloadURL` overrides.
- Hand-edit committed `.user.js` / `.meta.js`.
- Nest injected content inside the Steam Oops / `#error_box` shell.
- Execute non-Steam / extension scripts from guest HTML (AlikeGuardian, chrome-extension, etc.).
- Force-push `main` or amend published commits unless the user explicitly asks.
