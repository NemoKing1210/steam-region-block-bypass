# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-07-12

### Added

- Guest store HTML cache with configurable TTL (default 60 minutes; `0` disables); banner Reload always refetches

## [1.5.2] - 2026-07-12

### Fixed

- When the host page is already signed into Steam, drop the guest “Sign in to add this item…” prompt from `#queueActionsCtn` (anonymous HTML still shows it)

## [1.5.1] - 2026-07-12

### Fixed

- Popular tags stay visible after inject: wait for app CSS/layout before running Steam inits, then re-run `AdjustVisibleAppTags` (tags ship as `display:none` and were left hidden when the glance row still had width 0)

## [1.5.0] - 2026-07-12

### Added

- Direct inject reloads missing Steam app libraries (`game.js`, `gamehighlightplayer.js`, …) and re-runs guest page inline scripts so carousels, tabs, and other store widgets work

### Changed

- Extension junk scripts are still stripped; only Steam store scripts from the guest HTML are executed in page context

## [1.4.0] - 2026-07-12

### Added

- Guest fetch follows Steam store language: `Steam_Language` cookie, `?l=` on the request URL, and matching `Accept-Language`
- UI strings localized for en, ru, zh-CN, es, pt-BR, de, fr, ja, ko, and pl (browser locale detection)
- Broader region-error detection: Oops landing without `#error_box`, plus localized “unavailable in your region” patterns

### Changed

- Insert mode removed — always uses direct DOM inject of the Steam game layout (iframe / blob path dropped)
- Settings panel: bypass trigger is **Auto** vs **Show button** (no insert-mode control)

### Fixed

- Injected pages strip extension junk (`script`, AlikeGuradian / AG markers) that break outside a full store boot

## [1.1.1] - 2026-07-12

### Fixed

- Direct insert loads missing app-page stylesheets (`game.css`, `store_game_shared.css`, `apphub.css`, …) that error pages do not include — purchase/layout CSS was absent, so blocks stacked unstyled

## [1.1.0] - 2026-07-12

### Added

- Insert mode setting: **Direct** (DOM inject) or **iframe** (full guest HTML via blob URL)
- Proper Steam game layout extraction (`.game_page_background` / `#tabletGrid` / product `.page_content_ctn`)

### Fixed

- Direct inject no longer nests inside the “Oops, sorry!” error shell
- Clears `.page_header_ctn` / region error markup before inserting store content
- Applies `app game_bg` body classes used by real game pages

## [1.0.0] - 2026-07-12

### Added

- Anonymous refetch of region-blocked Steam store pages (`GM_xmlhttpRequest` with `anonymous: true`)
- Steam-styled **Region Bypass** button in `#global_actions` with settings panel
- Proxy gateway settings: enable toggle, host, port, username, password, URL mode
- Optional Steam store country override (`cc` / `steamCountry`)
- Auto-bypass on blocked pages and Violentmonkey menu command for settings
- Optional local HTTP gateway (`proxy-gateway.mjs`) for upstream HTTP/SOCKS proxies

[1.6.0]: https://github.com/NemoKing1210/steam-region-block-bypass/releases/tag/v1.6.0
[1.5.1]: https://github.com/NemoKing1210/steam-region-block-bypass/releases/tag/v1.5.1
[1.5.0]: https://github.com/NemoKing1210/steam-region-block-bypass/releases/tag/v1.5.0
[1.4.0]: https://github.com/NemoKing1210/steam-region-block-bypass/releases/tag/v1.4.0
[1.1.1]: https://github.com/NemoKing1210/steam-region-block-bypass/releases/tag/v1.1.1
[1.1.0]: https://github.com/NemoKing1210/steam-region-block-bypass/releases/tag/v1.1.0
[1.0.0]: https://github.com/NemoKing1210/steam-region-block-bypass/releases/tag/v1.0.0
