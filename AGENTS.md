# AGENTS.md

Instructions for coding agents working in this repository.

## Project

**Steam Region Block Bypass** — Tampermonkey/Violentmonkey userscript that restores Steam store app pages blocked with “unavailable in your region” by refetching as a guest (`GM_xmlhttpRequest` + `anonymous: true`) and injecting the real game layout into the page.

Optional companion: a small Node HTTP gateway (`proxy-gateway.mjs`) for IP-based locks.

Not affiliated with Valve/Steam. Do not add purchase, activation, or account-login bypass logic. Scope is **viewing** store HTML that Steam already serves to anonymous visitors.

## Layout

| Path | Role |
|------|------|
| `steam-region-block-bypass.user.js` | Canonical userscript (install / `@downloadURL` / `@updateURL`) |
| `steam-region-block-bypass.meta.js` | Metadata-only mirror for update checks — keep in sync with the userscript header |
| `proxy-gateway.mjs` | Optional local HTTP relay (`npm run gateway`) |
| `package.json` | Gateway deps + version (keep aligned with `@version`) |
| `README.md` | Human install / usage docs |
| `CHANGELOG.md` | Keep a Changelog + SemVer |

No build step, bundler, or test suite. Edit the `.user.js` file directly.

## Architecture (userscript)

IIFE, `'use strict'`, no modules. Key flows:

1. Detect region error (`#error_box` / Oops shell + `REGION_PATTERNS`).
2. `buildTargetUrl()` — strip `snr`, set `?l=` from `getSteamStoreLanguage()`, optional `?cc=`.
3. Optional proxy rewrite via `buildRequestUrl()`.
4. Anonymous `GM_xmlhttpRequest` with age-gate + `Steam_Language` cookies (`buildRequestHeaders()`).
5. Parse HTML → `extractGamePageRoot()` → `injectDirect()` (clear Oops shell, load missing app CSS/JS, re-run guest inline scripts, banner).

Settings key: `srbb_settings` (`GM_getValue` / `GM_setValue`). Defaults in `DEFAULT_SETTINGS`.

UI: Steam-styled button in `#global_actions`, panel `#srbb-panel`, CSS via `GM_addStyle`. Prefix classes/ids with `srbb-`.

## Conventions

- Prefer small, focused changes. Match existing naming (`srbb_*`, `t('key')`, camelCase helpers).
- Keep the userscript self-contained (no npm imports inside `.user.js`).
- Direct DOM inject only — do not reintroduce iframe/blob insert mode unless explicitly requested.
- Guest requests must stay **anonymous** (no session cookies). Only age-gate / language / optional country cookies in the Cookie header.
- Page HTML cache lives in `srbb_page_cache` (TTL from `settings.cacheMinutes`, default 60; `0` disables). Banner Reload / Save & Reload force a fresh fetch.
- When adding UI strings: update **all** locales in the `I18N` / `MESSAGES` map and keep `@name` / `@description` locale tags aligned when user-facing metadata changes.
- Supported UI locales: `en`, `ru`, `zh-CN`, `es`, `pt-BR`, `de`, `fr`, `ja`, `ko`, `pl`. Steam language maps live in `STEAM_LANG_BY_LOCALE` / `ACCEPT_LANG_BY_STEAM`.
- Gateway: ESM Node, `undici` for upstream HTTP/SOCKS. Do not expand it into a general-purpose proxy product unless asked.

## Commands

```bash
npm install
npm run gateway
# optional: PORT=8765 UPSTREAM_PROXY=socks5://127.0.0.1:1080 npm run gateway
```

Local userscript iteration: Violentmonkey **Track local file** on `steam-region-block-bypass.user.js`.

## Releases

On any user-facing or behavioral change that should ship:

1. Bump `@version` in **both** `steam-region-block-bypass.user.js` and `steam-region-block-bypass.meta.js`.
2. Bump `"version"` in `package.json` to match.
3. Add a Keep a Changelog entry in `CHANGELOG.md`.
4. Update the version badge (and any stale feature docs) in `README.md`.

Metadata block in `.user.js` and `.meta.js` must stay identical except that `.meta.js` has no script body.

## Do not

- Commit secrets, proxy credentials, or local `@updateURL` / `@downloadURL` overrides.
- Add `@connect` hosts casually without need; `*` already covers custom gateways.
- Nest injected content inside the Steam Oops / `#error_box` shell.
- Execute non-Steam / extension scripts from guest HTML (AlikeGuardian, chrome-extension, etc.). Steam CDN libs + guest inline inits are re-run on purpose via `ensureAppPageScripts` / `collectGuestInlineScripts`.
- Force-push `main` or amend published commits unless the user explicitly asks.
