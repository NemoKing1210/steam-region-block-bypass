# AGENTS.md — Steam Region Block Bypass

Instructions for AI coding agents working in this repository.

## Project

Userscript that restores Steam store app pages blocked with “unavailable in your region” by refetching as a guest (`GM_xmlhttpRequest` + `anonymous: true`) and injecting the real game layout. Optional guest search (header suggest + opt-in `/search` page). Optional companion: Node HTTP gateway (`proxy-gateway.mjs`) for IP-based locks.

Built with [Vite](https://vitejs.dev/) + [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey).

- **Source:** `src/main.js`
- **Canonical install artifacts (committed):** `steam-region-block-bypass.user.js`, `steam-region-block-bypass.meta.js`
- **Version source of truth:** `package.json` `version` (userscript header + `SCRIPT_VERSION`)
- **Docs:** `README.md`, `CHANGELOG.md`, `DEVELOPMENT.md`, `CONTRIBUTING.md`
- **License:** MIT

Not affiliated with Valve/Steam. Do not add purchase, activation, or account-login bypass logic. Scope is **viewing** store HTML that Steam already serves to anonymous visitors.

Edit source under `src/`, then run `npm run build` to refresh the root install files. Do not hand-edit the built `.user.js` / `.meta.js`.

## Repository layout

```text
steam-region-block-bypass/
├── src/
│   ├── main.js              # Bootstrap / init
│   ├── constants.js         # Keys, DEFAULT_SETTINGS, lang maps, REGION_PATTERNS
│   ├── state.js             # Mutable runtime bag (settings, search tokens, caches)
│   ├── settings.js          # load/save/migrate settings
│   ├── cache.js             # srbb_page_cache
│   ├── blocked-apps.js      # srbb_blocked_apps registry
│   ├── gm.js                # anonymous + session GM_xmlhttpRequest
│   ├── detect.js            # region-block detection, host login
│   ├── url.js               # buildTargetUrl / proxy URL helpers
│   ├── bypass.js            # bypassRegionBlock orchestrator
│   ├── inject.js            # DOM inject pipeline
│   ├── i18n/                # MESSAGES + locale / Steam lang helpers
│   ├── utils/               # html, pool
│   ├── styles/              # CSS (injected via vite-plugin-monkey)
│   └── features/            # panel, feedback, suggest, search-page, probe
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
├── AGENTS.md
└── CLAUDE.md
```

## Architecture (high level)

1. Match `https://store.steampowered.com/*` at `document-idle`.
2. Detect region error (`#error_box` / Oops shell + `REGION_PATTERNS`).
3. `buildTargetUrl()` — strip `snr`, set `?l=` from `getSteamStoreLanguage()`, optional `?cc=`.
4. Optional proxy rewrite via `buildRequestUrl()`.
5. Anonymous `GM_xmlhttpRequest` with age-gate + `Steam_Language` cookies (`buildRequestHeaders()`).
6. Parse HTML → `extractGamePageRoot()` → `injectDirect()` (clear Oops shell, load missing app CSS/JS, re-run guest inline scripts, banner).
7. Guest search: header suggest + optional `/search` page refetch; blocked-app registry + account probes.

Settings key: `srbb_settings`. Page cache: `srbb_page_cache`. Blocked apps: `srbb_blocked_apps`.

UI: Steam-styled button in `#global_actions`, panel `#srbb-panel`. Prefix classes/ids with `srbb-`.

## Conventions

- Vanilla JS ESM modules under `src/`; no frameworks. Import GM APIs from `$` (`vite-plugin-monkey` client).
- Mutable runtime state lives in `state.js` (`state.settings`, search tokens, etc.).
- Prefer existing patterns: constants in `constants.js`, strings in `i18n/`, DOM features in `features/`.
- Direct DOM inject only — do not reintroduce iframe/blob insert mode unless explicitly requested.
- Guest requests must stay **anonymous** (no session cookies). Only age-gate / language / optional country cookies in the Cookie header.
- When adding UI strings: update **all** locales in `src/i18n/translations.js` and keep localized `@name` / `@description` in `vite.config.js` aligned when metadata changes.
- Supported UI locales: `en`, `ru`, `zh-CN`, `es`, `pt-BR`, `de`, `fr`, `ja`, `ko`, `pl`.
- Userscript metadata lives in `vite.config.js` — not hand-written in built files.
- After changing source or metadata, run `npm run build` so root artifacts stay in sync.
- Production builds minify JS/CSS; edit `src/` for readable code.
- **Always bump** `package.json` `version` when shipping user-visible changes.
- **Keep README.md in sync** with features, settings, install flow, and architecture.
- Gateway: ESM Node + `undici`; do not expand into a general-purpose proxy product unless asked.

## Commands

```bash
npm install
npm run dev       # Vite + monkey HMR (dev: userscript)
npm run build     # Production → dist/ + copy to root
npm run ci        # build + verify artifacts
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
