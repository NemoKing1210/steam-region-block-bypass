# Steam Region Block Bypass

**English** · [Русский](README.ru.md) · [简体中文](README.zh-CN.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![Install userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge)](CHANGELOG.md)

A userscript for the Steam store that restores **blocked product pages** and adds optional **guest search** — anonymous search suggestions in the header, plus an opt-in guest `/search` page, without account cookies.

It refetches app URLs **without account cookies** (guest view), transplants the real store layout into the live document, and restores signed-in wishlist/follow/ignore controls after a transplant. **Guest search suggestions** are on by default; the full **`/search` page** guest mode is off by default (enable in Region Bypass → Search). For IP-based locks, an optional **proxy gateway** can be configured from the Steam-styled settings panel (account menu → Region Bypass settings).

Compatible with [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat, and other managers that support the `// ==UserScript==` metadata block.

## Screenshots

The real userscript running on a live Steam store page.

![Region Bypass settings panel with General, Search, Cache, Proxy and About pages](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-home.png)

| | |
|---|---|
| ![General — interface language, bypass mode, store country, toast notifications](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-general.png)<br>**General** — interface language, auto/manual bypass, banner, store country, toast notifications | ![Search — guest suggestions, opt-in /search page, blocked-games registry, probing](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-search.png)<br>**Search** — guest suggestions, opt-in `/search` page, blocked-games registry, probing |
| ![Cache — usage meter, TTL, entry limit, per-source caching, blocked list](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-cache.png)<br>**Cache** — usage meter, TTL, entry limit, per-source caching, blocked list | ![Proxy gateway — URL mode, host/port, optional HTTP Basic credentials](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/settings-proxy.png)<br>**Proxy gateway** — URL mode, host/port, optional HTTP Basic credentials |

Guest search suggestions in the store header — **Call of Duty: Modern Warfare 4** is flagged as **region blocked**, while other results remain available:

![Guest search suggestions for Call of Duty: Modern Warfare 4 with a Region blocked badge](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/docs/screenshots/guest-suggest-blocked.png)

## Quick install

1. Install a userscript manager (Tampermonkey or Violentmonkey recommended).
2. Click the install link below — your manager should open an installation prompt.

**Install URL:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js
```

[![Install](https://img.shields.io/badge/⬇_Install-Steam_Region_Block_Bypass-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)

### Install from URL (dashboard)

| Manager | Path |
|---------|------|
| Tampermonkey | Dashboard → **Utilities** → **Install from URL** |
| Violentmonkey | Dashboard → **+** → **Install from URL** |
| Greasemonkey | Add-on menu → **New User Script** → paste the raw URL |

Paste the [install URL](#quick-install) above.

### Manual install

1. Open [`steam-region-block-bypass.user.js`](steam-region-block-bypass.user.js) in this repository.
2. Copy the entire file contents.
3. In your userscript manager, create a new script and paste the code.
4. Save and enable the script.

## Updates

The script includes `@updateURL` and `@downloadURL` metadata pointing to the raw GitHub file. Supported managers check for updates automatically (Tampermonkey: Dashboard → check interval; Violentmonkey: similar).

**To release a new version:**

1. Bump `version` in `package.json` (SemVer).
2. Run `npm run build` (refreshes root `.user.js` / `.meta.js`).
3. Add an entry to [`CHANGELOG.md`](CHANGELOG.md).
4. Push to `main` (or create a GitHub Release).

Managers compare the installed `@version` with the remote metadata to decide whether to offer an update. See [DEVELOPMENT.md](DEVELOPMENT.md) for the full workflow.

## Features

- **Transplant-first injection** — swaps the guest game layout into the live `#responsive_page_template_content`, preserving the logged-in header, session globals, loaded styles, and scripts; `document.write` remains a full-rewrite fallback
- **Signed-in queue restore** — rebuilds wishlist, follow, and ignore controls after a transplant and posts actions through the live session
- **Auto-bypass or button** — run immediately on blocked pages, or show a manual offer first
- **Anonymous request** — uses `GM_xmlhttpRequest` with `anonymous: true` (no login cookies)
- **Store language** — guest fetch uses `Steam_Language`, `?l=`, and `Accept-Language` so the page matches your Steam UI language
- **Age-gate cookies** — sends `birthtime` / mature-content cookies so guest pages are less likely to stop at the age check
- **Optional store country (`cc`)** — override Steam store country for the guest request
- **Proxy gateway panel** — enable/disable, host, port, username, password, URL mode
- **Region master switch + banner control** — disable page bypass without affecting guest search; hide the region banner when desired
- **Steam-like UI** — settings entry in the account dropdown (`#account_dropdown`, SteamDB-style); logged-out fallback button in `#global_actions`; home-list panel with General / Search / Cache / Proxy / About pages, draft editing, Reset, Cancel, Save, and Save & reload
- **Localized UI** — panel and messages in en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, pl; interface language selector with browser auto-detection
- **Manual controls** — reload injected content, open settings from the banner or userscript manager menu
- **Guest search suggestions** — on by default: anonymous suggest dropdown via the same guest fetch stack (proxy / `cc` / cache); disable in **Region Bypass → Search**
- **Guest `/search` page** — opt-in: anonymous refetch/inject for `store.steampowered.com/search` (same stack); enable separately in **Region Bypass → Search**
- **Cache tab** — usage meter, TTL and max entries, choose which guest pages to store, browse/remove cached HTML, browse/clear blocked games list
- **Blocked games registry** — remembers region-blocked app IDs (Search tab toggles) and highlights them in guest search; list and clear on **Cache**

## Supported pages

| Site | URL pattern | Notes |
|------|-------------|-------|
| Steam Store (apps) | `https://store.steampowered.com/app/{id}/…` | Region-error bypass (main use case) |
| Steam Store (search) | Header search + `https://store.steampowered.com/search/?term=…` | **Guest search suggestions** and optional **Guest /search page** in Region Bypass → Search |

App pages work when Steam shows **“This item is currently unavailable in your region”** — for example, **Call of Duty: Modern Warfare 4** in restricted regions. **Guest search suggestions** are enabled by default for the header search bar. Guest refetch for the full `/search` page is **off by default** (same anonymous guest fetch stack: proxy / `cc` / cache) — turn it on in **Region Bypass → Search**. Saved region-blocked app IDs can be highlighted in search results.

## How it works

```
Steam app page loads
       │
       ▼
#error_box / Oops matches “unavailable in your region”?
       │
       ├── no ──► idle (settings button still available)
       │
       └── yes ──► Build target URL (?l= language, optional ?cc=)
                │
                ▼
       Cache hit (within TTL)? ── yes ──► use stored guest HTML
                │ no
                ▼
       Optional: rewrite URL through proxy gateway
                │
                ▼
       GM_xmlhttpRequest(anonymous: true,
         Cookie: birthtime…; Steam_Language=…)
                │
                ▼
       Parse HTML → extract .game_page_background / #tabletGrid
                │
                ├── still blocked? ──► show error + suggest proxy
                │
                ├── transplant into the live shell
                │   ├── sync title, classes, styles, scripts
                │   ├── restore signed-in queue controls
                │   └── fail → document.write(guest HTML) fallback
                │
                └── banner + feature re-boot (successful HTML saved to cache)
```

### Guest search

In the Region Bypass panel (**Search** tab):

1. **Guest search suggestions** (on by default) — typing in the store header search fetches anonymous suggestions from `/search/results` (up to 25 games), enriched with `/api/storesearch/` extras when available (fallback: `/search/suggest`).
2. **Guest `/search` page** (off by default) — submitting search or opening `/search/?term=…` can refetch results as a guest and inject them into the page when this setting is enabled.
3. Optional **blocked games registry** highlights apps you previously opened on a region-error page.
4. **Auto-detect blocked in search** (on by default) probes each result with your signed-in Steam cookies and adds region-locked apps to the blocked list (progress bar + per-item loaders; configurable scope and concurrency).

Uses the same proxy, `cc`, language, and cache settings as app-page bypass.

### Anonymous fetch

Steam often gates the store page by **account country**. A privileged request without session cookies can return the public store layout for that IP. The script never uses your logged-in session for the bypass request.

### Store language

The guest request mirrors your Steam store language when possible:

1. `Steam_Language` cookie from the current page
2. Otherwise a language derived from the UI/browser locale
3. Applied as `?l=…`, `Cookie: Steam_Language=…`, and `Accept-Language`

### Proxy gateway

Userscript managers **cannot** attach a system SOCKS/HTTP proxy to `GM_xmlhttpRequest`. When the lock is IP-based, point the panel at a local/remote **HTTP gateway** that fetches the Steam URL from another network.

| Mode | Example request |
|------|-----------------|
| `host:port/https://…` | `http://127.0.0.1:8765/https://store.steampowered.com/app/412020/` |
| `host:port/store.steampowered.com/…` | `http://127.0.0.1:8765/store.steampowered.com/app/412020/` |
| `host:port/?url=…` | `http://127.0.0.1:8765/?url=https%3A%2F%2Fstore.steampowered.com%2Fapp%2F412020%2F` |

This repository includes an optional Node gateway: [`proxy-gateway.mjs`](proxy-gateway.mjs).

```bash
npm install
npm run gateway

# with upstream SOCKS/HTTP:
# UPSTREAM_PROXY=socks5://user:pass@host:1080 npm run gateway
```

Then in the userscript panel: Host `127.0.0.1`, Port `8765`, mode `host:port/https://…`, proxy **ON**.

## Repository layout

```text
steam-region-block-bypass/
├── src/
│   ├── main.js                 # locale + bootDocument + region:rewrote handler
│   ├── core/                   # settings, cache, blocked apps, bus, constants, debug
│   ├── region/                 # detect, request, transplant, queue, fixups, bypass
│   ├── features/search/        # suggest API/parse/render/header, /search page, probe
│   ├── features/settings/      # panel, controls, confirm, pages
│   ├── i18n/                   # locale meta + ten locale files
│   ├── ui/                     # toasts
│   ├── utils/                  # dom, html, pool, navigation, scroll lock
│   └── styles/                 # tokens, base, panel, region, search, cache, toast
├── tests/                      # Node built-in unit tests
├── scripts/                    # build / artifact helpers
├── steam-region-block-bypass.user.js   # Installable userscript (committed artifact)
├── steam-region-block-bypass.meta.js   # Metadata companion for update checks
├── proxy-gateway.mjs           # Optional local HTTP gateway (Node)
├── package.json                # Dependencies, version, scripts
├── README.md                   # Documentation and install instructions
├── CHANGELOG.md                # Version history
├── DESIGN.md                   # Visual language and CSS token rules
├── LICENSE                     # MIT license
└── .gitattributes / .gitignore
```

| File | Purpose |
|------|---------|
| `steam-region-block-bypass.user.js` | Full script served at `@downloadURL` / `@updateURL` |
| `steam-region-block-bypass.meta.js` | Lightweight metadata mirror; managers may fetch it instead of the full script when checking for updates |
| `proxy-gateway.mjs` | Optional local relay for IP-based region locks |

## Script metadata

Key `// ==UserScript==` fields used by managers:

| Field | Value |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-region-block-bypass` |
| `@version` | Semantic version (must be bumped on every release) |
| `@updateURL` / `@downloadURL` | Raw GitHub URL of `steam-region-block-bypass.user.js` |
| `@homepageURL` | This repository |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_registerMenuCommand` |
| `@connect` | `store.steampowered.com`, `*` (custom proxy gateways) |

Localized `@name` and `@description` tags are provided for en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, and pl.

## Required permissions

| Grant | Purpose |
|-------|---------|
| `GM_xmlhttpRequest` | Fetch the store page without page cookies / CORS limits |
| `GM_getValue` / `GM_setValue` | Persist proxy and UI settings |
| `GM_addStyle` | Inject Steam-styled panel and banner CSS |
| `GM_registerMenuCommand` | Open settings from the userscript manager menu |

`@connect *` is required so the script can call a user-configured proxy gateway host.

## Development

Built with **Vite** + **vite-plugin-monkey**. Edit ESM modules under [`src/`](src/), then `npm run build` to refresh the committed install artifacts. Details: [DEVELOPMENT.md](DEVELOPMENT.md), [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
npm install
npm run dev      # live "dev:" userscript via Vite
npm run build    # production → dist/ + root .user.js / .meta.js
npm test         # Node built-in unit tests
npm run ci       # tests + build + artifact verification
npm run gateway  # optional local proxy gateway
```

### Local workflow (Violentmonkey)

1. Clone this repository and run `npm run build`.
2. In Violentmonkey, install from the local root `steam-region-block-bypass.user.js`.
3. Enable **Track local file** before closing the install dialog.
4. Edit `src/`, rebuild, reload the Steam page — or use `npm run dev` for HMR.

### Local workflow (Tampermonkey)

Tampermonkey does not track local files natively. Options:

- Use `npm run dev` and install the served `dev:` userscript, or
- Reinstall from the built file / URL after each `npm run build`, or
- Temporarily point `@updateURL` / `@downloadURL` to `http://localhost:...` during development (do not commit local URLs).

### Configuration

Settings are stored in userscript storage (`srbb_settings_v2`; the flat `srbb_settings` v1 object is migrated once and left intact for downgrade) via the settings panel:

| Setting | Default | Description |
|---------|---------|-------------|
| Interface language | Auto | Panel / message language; `Auto` follows the browser. Steam's store-language cookie still wins for guest requests |
| Enable region bypass | on | Gates page detection, auto/manual mode, banner, other-site button, and queue restore. Guest search keeps its own switches |
| Bypass trigger | Auto | **Auto** runs on region-error pages; **Show button** waits for a manual offer |
| Show banner | on | Show the region notice above a bypassed page |
| Store country (`cc`) | empty | Optional Steam country code for guest requests |
| Show toast notifications | on | Steam-style floating notices for setting changes; can be turned off |
| Toast position | Top right | Corner for toasts: top/bottom × left/right |
| Guest search suggestions | on | **Search** tab: anonymous header suggestions |
| Guest `/search` page | off | **Search** tab: replace the live results with an anonymous guest fetch |
| Remember blocked games | on | **Search** tab: save app IDs when Steam shows a region error |
| Highlight blocked in search | on | **Search** tab: badge saved games in guest results |
| Auto-detect blocked in search | on | **Search** tab: probe result pages with the signed-in session; scope and concurrency are configurable |
| Cache duration (minutes) | `60` | **Cache** tab: reuse a successful guest page for this long; `0` disables cache. Banner **Reload** always fetches fresh |
| Max cached pages | `30` | **Cache** tab: newest guest HTML entries kept (soft 10 MB meter budget) |
| Cache app / search pages | on / on | **Cache** tab: which guest HTML kinds to store; off stops writes and prunes that kind |
| Use proxy gateway | off | Route the anonymous fetch through a gateway |
| Gateway mode | `gateway` | How the target URL is appended to `host:port` |
| Host / Port | empty | Gateway address (e.g. `127.0.0.1` / `8765`) |
| Username / Password | empty | Optional HTTP Basic auth for the gateway |

Settings are written to `srbb_settings_v2`. The page cache keeps the existing `srbb_page_cache` key and the blocked registry keeps `srbb_blocked_apps`.

## Disclaimer

This project is **not affiliated** with Valve or Steam. Circumventing geographic restrictions may violate the [Steam Subscriber Agreement](https://store.steampowered.com/subscriber_agreement/). Use at your own risk. The script is intended to **view** store information that Steam already serves to anonymous visitors; it does not purchase or activate products.

## License

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
