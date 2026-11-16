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

The script ships `@updateURL` and `@downloadURL` metadata pointing to the raw GitHub file, so supported managers check for updates automatically. Release steps live in [DEVELOPMENT.md](docs/DEVELOPMENT.md#releasing).

## Features

- **Restores region-blocked app pages** — anonymous guest refetch, then the real store layout is transplanted into the live document (full-document rewrite only as a fallback)
- **Keeps your session intact** — signed-in wishlist, follow, and ignore controls keep working after a transplant
- **Auto-bypass or manual offer** — run immediately on blocked pages, or show an offer first
- **Guest search suggestions** — on by default: anonymous suggestions in the store header, with saved blocked games highlighted
- **Guest `/search` page** — opt-in anonymous refetch and injection of search results
- **Blocked games registry** — remembers region-blocked app IDs and can auto-detect them while probing search results
- **Cache controls** — usage meter, TTL and entry limit, per-source toggles, and a cached-page browser
- **Proxy gateway** — optional HTTP relay for IP-based locks ([setup](docs/ARCHITECTURE.md#proxy-gateway))
- **Steam-styled settings panel** — General / Search / Cache / Proxy / About pages, draft editing, Save and Save & reload
- **10 UI languages** — English, Russian, Chinese, Spanish, Portuguese (Brazil), German, French, Japanese, Korean, Polish

## Supported pages

| Site | URL pattern | Notes |
|------|-------------|-------|
| Steam Store (apps) | `https://store.steampowered.com/app/{id}/…` | Region-error bypass (main use case) |
| Steam Store (search) | Header search + `https://store.steampowered.com/search/?term=…` | **Guest search suggestions** and optional **Guest /search page** in Region Bypass → Search |

App pages work when Steam shows **“This item is currently unavailable in your region”** — for example, **Call of Duty: Modern Warfare 4** in restricted regions. Guest search suggestions are enabled by default for the header search bar; the guest `/search` page is opt-in in **Region Bypass → Search**. Both use the same anonymous fetch stack (proxy / `cc` / cache). Saved region-blocked app IDs can be highlighted in search results.

## For developers

This section moved to dedicated guides:

- [DEVELOPMENT.md](docs/DEVELOPMENT.md) — build, local testing, releasing, gateway
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the bypass works, repository layout, metadata, permissions, settings reference
- [CONTRIBUTING.md](CONTRIBUTING.md) — contributor workflow and PR checklist
- [AGENTS.md](AGENTS.md) — instructions for AI coding agents
- [SECURITY.md](SECURITY.md) — security policy and private reporting
- [DESIGN.md](DESIGN.md) — visual language and CSS token rules

## More userscripts

Other userscripts by the same author:

| Userscript | What it does |
|:-----------|:-------------|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | Full settings panel and on-page translation for Steam Store and Steam Community content — game descriptions, reviews, profile comments, news, and guides |
| [![Steam GameStatus](https://img.shields.io/badge/Steam_GameStatus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-gamestatus) | Adds [GameStatus.info](https://gamestatus.info) data to Steam — protection, release dates, scores, and hardware specs on game cards and pages |

## Disclaimer

This project is **not affiliated** with Valve or Steam. Circumventing geographic restrictions may violate the [Steam Subscriber Agreement](https://store.steampowered.com/subscriber_agreement/). Use at your own risk. The script is intended to **view** store information that Steam already serves to anonymous visitors; it does not purchase or activate products.

## License

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
