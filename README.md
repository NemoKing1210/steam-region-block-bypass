# Steam Region Block Bypass

[![Install userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.9.0-green?style=for-the-badge)](CHANGELOG.md)

A userscript for the Steam store that restores **blocked product pages** and adds optional **guest search** — anonymous search suggestions in the header and `/search` results without account cookies.

It refetches app URLs **without account cookies** (guest view) and injects the real store layout. Enable **Guest search** in the Region Bypass settings panel for store-wide search. For IP-based locks, an optional **proxy gateway** can be configured from a Steam-styled settings panel in the header.

Compatible with [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat, and other managers that support the `// ==UserScript==` metadata block.

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

1. Bump `@version` in `steam-region-block-bypass.user.js` and `steam-region-block-bypass.meta.js` (and `package.json`).
2. Add an entry to [`CHANGELOG.md`](CHANGELOG.md).
3. Push to `main` (or create a GitHub Release).

Managers compare the installed `@version` with the remote metadata to decide whether to offer an update.

## Features

- **Direct DOM inject** — clears the Oops / region-error shell and inserts the real Steam game layout (`.game_page_background` / `#tabletGrid`), including app CSS/JS so store widgets keep working
- **Auto-bypass or button** — run immediately on blocked pages, or show a manual offer first
- **Anonymous request** — uses `GM_xmlhttpRequest` with `anonymous: true` (no login cookies)
- **Store language** — guest fetch uses `Steam_Language`, `?l=`, and `Accept-Language` so the page matches your Steam UI language
- **Age-gate cookies** — sends `birthtime` / mature-content cookies so guest pages are less likely to stop at the age check
- **Optional store country (`cc`)** — override Steam store country for the guest request
- **Proxy gateway panel** — enable/disable, host, port, username, password, URL mode
- **Steam-like UI** — **Region Bypass** button in `#global_actions`, dark Steam-styled settings popup
- **Localized UI** — panel and messages in en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, pl
- **Manual controls** — reload injected content, open settings from the banner or userscript manager menu
- **Guest search** — optional setting in the Region Bypass panel: anonymous suggest dropdown and `/search` results via the same guest fetch stack (proxy / `cc` / cache)
- **Blocked games registry** — remembers region-blocked app IDs and highlights them in guest search (dropdown and `/search` results)

## Supported pages

| Site | URL pattern | Notes |
|------|-------------|-------|
| Steam Store (apps) | `https://store.steampowered.com/app/{id}/…` | Region-error bypass (main use case) |
| Steam Store (search) | Header search + `https://store.steampowered.com/search/?term=…` | **Guest search** setting in Region Bypass panel |

App pages work when Steam shows **“This item is currently unavailable in your region”**. With **Guest search** enabled, the header search bar and `/search` use the same anonymous guest fetch stack (proxy / `cc` / cache). Saved region-blocked app IDs can be highlighted in search results.

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
                └── clear Oops shell → inject layout + CSS + Steam JS + banner
                    (successful HTML saved to cache)
```

### Guest search

When **Guest search** is enabled in the Region Bypass panel:

1. Typing in the store header search fetches anonymous suggestions (`/search/suggest`, fallback `/api/storesearch/`).
2. Submitting search or opening `/search/?term=…` refetches results as a guest and injects them into the page.
3. Optional **blocked games registry** highlights apps you previously opened on a region-error page.

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
├── steam-region-block-bypass.user.js   # Installable userscript (canonical distribution file)
├── steam-region-block-bypass.meta.js   # Metadata-only companion for faster update checks
├── proxy-gateway.mjs                   # Optional local HTTP gateway (Node)
├── package.json                        # Gateway dependencies / npm scripts
├── README.md                           # Documentation and install instructions
├── CHANGELOG.md                        # Version history
├── LICENSE                             # MIT license
├── .gitattributes                      # GitHub linguist overrides
└── .gitignore                          # node_modules, env files, logs
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

### Local workflow (Violentmonkey)

1. Clone this repository.
2. In Violentmonkey, install from the local `steam-region-block-bypass.user.js` file.
3. Enable **Track local file** before closing the install dialog.
4. Edit the file in your IDE — changes apply after a page reload.

### Local workflow (Tampermonkey)

Tampermonkey does not track local files natively. Options:

- Reinstall from URL after each change, or
- Use a local HTTP server and temporarily point `@updateURL` / `@downloadURL` to `http://localhost:...` during development (do not commit local URLs).

### Configuration

Settings are stored in userscript storage (`srbb_settings`) via the header panel:

| Setting | Default | Description |
|---------|---------|-------------|
| Bypass trigger | Auto | **Auto** runs on region-error pages; **Show button** waits for a manual offer |
| Store country (`cc`) | empty | Optional Steam country code for guest requests |
| Cache duration (minutes) | `60` | Reuse a successful guest page for this long; `0` disables cache. Banner **Reload** always fetches fresh |
| Use proxy gateway | off | Route the anonymous fetch through a gateway |
| Gateway mode | `gateway` | How the target URL is appended to `host:port` |
| Host / Port | empty | Gateway address (e.g. `127.0.0.1` / `8765`) |
| Username / Password | empty | Optional HTTP Basic auth for the gateway |

## Disclaimer

This project is **not affiliated** with Valve or Steam. Circumventing geographic restrictions may violate the [Steam Subscriber Agreement](https://store.steampowered.com/subscriber_agreement/). Use at your own risk. The script is intended to **view** store information that Steam already serves to anonymous visitors; it does not purchase or activate products.

## License

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
