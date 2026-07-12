# Steam Region Block Bypass

[![Install userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-region-block-bypass/main/steam-region-block-bypass.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.1-green?style=for-the-badge)](CHANGELOG.md)

A userscript for the Steam store that restores the product page when Steam shows **“This item is currently unavailable in your region”**.

It refetches the same app URL **without account cookies** (guest view) and injects the store content into the page. For IP-based locks, an optional **proxy gateway** can be configured from a Steam-styled settings panel in the header.

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

1. Bump `@version` in `steam-region-block-bypass.user.js` and `steam-region-block-bypass.meta.js`.
2. Add an entry to [`CHANGELOG.md`](CHANGELOG.md).
3. Push to `main` (or create a GitHub Release).

Managers compare the installed `@version` with the remote metadata to decide whether to offer an update.

## Features

- **Insert mode** — Direct DOM inject (Steam game layout) or iframe with the full guest HTML
- **Auto-bypass on blocked pages** — detects the Steam region error box and refetches the page as a guest
- **Anonymous request** — uses `GM_xmlhttpRequest` with `anonymous: true` (no login cookies)
- **Age-gate cookies** — sends `birthtime` / mature-content cookies so guest pages are less likely to stop at the age check
- **Optional store country (`cc`)** — override Steam store country for the guest request
- **Proxy gateway panel** — enable/disable, host, port, username, password, URL mode
- **Steam-like UI** — **Region Bypass** button in `#global_actions`, dark Steam-styled settings popup
- **Manual controls** — reload injected content, open settings from the banner or Violentmonkey menu

## Supported pages

| Site | URL pattern |
|------|-------------|
| Steam Store | `https://store.steampowered.com/*` |

Works best on app pages such as `https://store.steampowered.com/app/{id}/…` when the region error is shown.

## How it works

```
Steam app page loads
       │
       ▼
#error_box matches “unavailable in your region”?
       │
       ├── no ──► idle (settings button still available)
       │
       └── yes ──► Build target URL (optional ?cc=)
                │
                ▼
       Optional: rewrite URL through proxy gateway
                │
                ▼
       GM_xmlhttpRequest(anonymous: true, Cookie: birthtime…)
                │
                ▼
       Parse HTML → extract .game_page_background / #tabletGrid
                │
                ├── still blocked? ──► show error + suggest proxy
                │
                ├── injectMode=iframe ──► blob URL iframe (full guest HTML)
                │
                └── injectMode=direct ──► clear Oops shell, insert game layout + banner
```

### Anonymous fetch

Steam often gates the store page by **account country**. A privileged request without session cookies can return the public store layout for that IP. The script never uses your logged-in session for the bypass request.

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
| Auto-bypass | on | Run bypass automatically on region-error pages |
| Insert mode | `direct` | `direct` injects `.game_page_background`; `iframe` loads full guest HTML |
| Store country (`cc`) | empty | Optional Steam country code for guest requests |
| Use proxy gateway | off | Route the anonymous fetch through a gateway |
| Gateway mode | `gateway` | How the target URL is appended to `host:port` |
| Host / Port | empty | Gateway address (e.g. `127.0.0.1` / `8765`) |
| Username / Password | empty | Optional HTTP Basic auth for the gateway |

## Disclaimer

This project is **not affiliated** with Valve or Steam. Circumventing geographic restrictions may violate the [Steam Subscriber Agreement](https://store.steampowered.com/subscriber_agreement/). Use at your own risk. The script is intended to **view** store information that Steam already serves to anonymous visitors; it does not purchase or activate products.

## License

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
