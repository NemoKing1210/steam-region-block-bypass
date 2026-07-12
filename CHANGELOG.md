# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.1.1]: https://github.com/NemoKing1210/steam-region-block-bypass/releases/tag/v1.1.1
[1.1.0]: https://github.com/NemoKing1210/steam-region-block-bypass/releases/tag/v1.1.0
[1.0.0]: https://github.com/NemoKing1210/steam-region-block-bypass/releases/tag/v1.0.0
