# Architecture

Technical reference for Steam Region Block Bypass: how the bypass works, the
repository layout, userscript metadata, required permissions, and the full
settings reference.

User-facing overview and install instructions live in [README.md](../README.md).
Build and release workflow lives in [DEVELOPMENT.md](DEVELOPMENT.md).

## Scope

The script restores Steam store **app pages** blocked with “This item is
currently unavailable in your region” and adds optional **guest search**
(header suggestions plus an opt-in `/search` page). It only views store HTML
that Steam already serves to anonymous visitors:

- Anonymous guest refetch and live-document transplant (full-document rewrite
  is the only fallback)
- No purchase, activation, or account-login bypass
- No iframe/blob insert mode

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

1. Match `https://store.steampowered.com/*` at `document-idle`.
2. Detect the region error (`#error_box` / Oops shell + `REGION_PATTERNS`).
3. `buildTargetUrl(sourceUrl, { lang, cc })` — strip `snr`, set `?l=`, optional `?cc=`.
4. Optionally rewrite the URL through the proxy gateway (`buildRequestUrl()`).
5. Send an anonymous `GM_xmlhttpRequest` with age-gate and `Steam_Language`
   cookies (`buildRequestHeaders()`).
6. Parse the response → `extractStoreRoot()` → `transplantGuestContent()`
   (live-document swap, head styles, missing bundles, inline scripts). On
   failure, `rewriteDocumentWithGuest()` is the only full-document fallback.
7. On signed-in app pages, `restoreQueueActions()` rebuilds wishlist, follow,
   and ignore controls; `applyGuestFixups()` restores tag editing/fitting and
   app stylesheets.
8. Emit `region:rewrote`; `main.js` waits for boot on rewrite, boots features,
   inserts the banner, then emits `region:injected`.

## Guest search

In the Region Bypass panel (**Search** tab):

1. **Guest search suggestions** (on by default) — typing in the store header
   search fetches anonymous suggestions from `/search/results` (up to 25 games),
   enriched with `/api/storesearch/` extras when available (fallback:
   `/search/suggest`).
2. **Guest `/search` page** (off by default) — submitting search or opening
   `/search/?term=…` can refetch results as a guest and inject them into the
   page when this setting is enabled.
3. Optional **blocked games registry** highlights apps you previously opened on
   a region-error page.
4. **Auto-detect blocked in search** (on by default) probes each result with
   your signed-in Steam cookies and adds region-locked apps to the blocked list
   (progress bar + per-item loaders; configurable scope and concurrency).

Guest search uses the same proxy, `cc`, language, and cache settings as app-page
bypass. Behaviour and endpoints match the 1.x implementation.

## Anonymous fetch

Steam often gates the store page by **account country**. A privileged request
without session cookies can return the public store layout for that IP. The
script never uses your logged-in session for the bypass request — the only
cookies sent are age-gate (`birthtime` / mature-content) and language cookies.

Signed-in probing is separate: `sessionFetch()` (`anonymous: false`, no Cookie
override) may be used for blocked detection only.

## Store language

The guest request mirrors your Steam store language when possible:

1. `Steam_Language` cookie from the current page
2. Otherwise a language derived from the UI/browser locale
3. Applied as `?l=…`, `Cookie: Steam_Language=…`, and `Accept-Language`

## Proxy gateway

Userscript managers **cannot** attach a system SOCKS/HTTP proxy to
`GM_xmlhttpRequest`. When the lock is IP-based, point the panel at a
local/remote **HTTP gateway** that fetches the Steam URL from another network.

| Mode | Example request |
|------|-----------------|
| `host:port/https://…` | `http://127.0.0.1:8765/https://store.steampowered.com/app/412020/` |
| `host:port/store.steampowered.com/…` | `http://127.0.0.1:8765/store.steampowered.com/app/412020/` |
| `host:port/?url=…` | `http://127.0.0.1:8765/?url=https%3A%2F%2Fstore.steampowered.com%2Fapp%2F412020%2F` |

This repository includes an optional Node gateway:
[`proxy-gateway.mjs`](../proxy-gateway.mjs).

```bash
npm install
npm run gateway

# with upstream SOCKS/HTTP:
# UPSTREAM_PROXY=socks5://user:pass@host:1080 npm run gateway
```

Then in the userscript panel: Host `127.0.0.1`, Port `8765`, mode
`host:port/https://…`, proxy **ON**. The gateway is optional and is not bundled
into the userscript.

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
├── README.md                   # Overview and install instructions
├── docs/
│   ├── ARCHITECTURE.md         # This document
│   ├── DEVELOPMENT.md          # Local setup, build, and release workflow
│   └── screenshots/            # README images
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

Key `// ==UserScript==` fields used by managers. Declared in
[`vite.config.js`](../vite.config.js), never hand-written in built files:

| Field | Value |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-region-block-bypass` |
| `@version` | Semantic version from `package.json` (must be bumped on every release) |
| `@updateURL` / `@downloadURL` | Raw GitHub URL of `steam-region-block-bypass.user.js` |
| `@homepageURL` | This repository |
| `@supportURL` | GitHub Issues |
| `@license` | MIT |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_registerMenuCommand` |
| `@connect` | `store.steampowered.com`, `*` (custom proxy gateways) |

Localized `@name` and `@description` tags are provided for en, ru, zh-CN, es,
pt-BR, de, fr, ja, ko, and pl.

## Required permissions

| Grant | Purpose |
|-------|---------|
| `GM_xmlhttpRequest` | Fetch the store page without page cookies / CORS limits |
| `GM_getValue` / `GM_setValue` | Persist proxy and UI settings |
| `GM_addStyle` | Inject Steam-styled panel and banner CSS |
| `GM_registerMenuCommand` | Open settings from the userscript manager menu |

`@connect *` is required so the script can call a user-configured proxy gateway
host.

## Settings reference

Settings are edited in the panel (account menu → Region Bypass settings) and
persisted under `srbb_settings_v2`. The flat `srbb_settings` v1 object is
migrated once and left intact for downgrade.

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

## Storage keys

| Key | Contents |
|-----|----------|
| `srbb_settings_v2` | Nested settings object (current schema) |
| `srbb_page_cache` | Cached guest HTML entries (existing shape) |
| `srbb_blocked_apps` | Region-blocked app registry (existing shape) |

Feature state is module-local; cross-feature reactions use
[`src/core/bus.js`](../src/core/bus.js) events (`settings:*`, `region:rewrote`,
`region:injected`). There is no global mutable state bag.
