# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.15.0] - 2026-07-13

### Changed

- **Guest search** is enabled by default (existing installs are migrated on once)
- Suggest dropdown and `/search` banner explain that Region Bypass guest search is active and link to **Settings → Search** to disable it

## [1.14.3] - 2026-07-13

### Fixed

- Region-blocked search hits no longer sink to the bottom — list order follows `storesearch` relevance again, and hidden `/search` rows are inserted at their ranked positions (still no reshuffle after probes)

## [1.14.2] - 2026-07-13

### Fixed

- Guest search no longer reorders results after region-block probes (badges update in place; blocked titles stay in their original positions)

## [1.14.1] - 2026-07-13

### Fixed

- Region-blocked games missing from guest search after switching suggest to `/search/results` — Steam search HTML hides unavailable titles; results now union `storesearch` + remembered blocked matches, and the `/search` page re-injects those hits

## [1.14.0] - 2026-07-13

### Changed

- Guest search suggestions now show up to **25** results (from Steam `/search/results`; previously capped at ~10 by `/api/storesearch/`)

## [1.13.0] - 2026-07-13

### Added

- Guest search suggestions now show **release date** and **user review summary** (e.g. Very Positive · 94%), merged from anonymous `/search/results` metadata

## [1.12.0] - 2026-07-12

### Removed

- **Remember search text** setting and `srbb_search_term` persistence (header search no longer restores the last query)

### Added

- Loading skeletons for guest search suggestions and `/search` results (Steam-styled shimmer placeholders)

## [1.11.2] - 2026-07-12

### Changed

- Guest search suggestions debounce increased from 250 ms to 550 ms while typing

## [1.11.1] - 2026-07-12

### Fixed

- **Remember search text** no longer restores the previous query while you clear the header search box (MutationObserver remount race + deferred empty save)

### Changed

- Clearing the search field (or Escape: close suggest → clear → blur) forgets the saved term immediately; emptying the box hides suggestions instead of showing the empty hint
- Turning off **Remember search text** clears the stored query

## [1.11.0] - 2026-07-12

### Added

- **Auto-detect blocked in search** — after guest suggest/`/search` renders, probes each app with account cookies (not anonymous), saves region-locked IDs to `srbb_blocked_apps`, with progress UI, per-item loaders, scope (suggest / search / both), and concurrency (1–5). On by default; requires signed-in Steam + “Remember blocked games”

## [1.10.0] - 2026-07-12

### Added

- **Remember search text** setting (Search tab, on by default) — keeps the last store search query in the header field across navigations (`srbb_search_term`)

## [1.9.0] - 2026-07-12

### Changed

- Release docs and userscript `@description` now advertise **guest search** (header suggestions + `/search` results) alongside app-page region bypass

## [1.8.2] - 2026-07-12

### Fixed

- Settings panel would not hide after close: `display: flex` overrode the `hidden` attribute

## [1.8.1] - 2026-07-12

### Changed

- Settings panel uses tabs (General / Search / Proxy) with a viewport-clamped scrollable body so options no longer overflow the screen

## [1.8.0] - 2026-07-12

### Added

- **Blocked games registry** (`srbb_blocked_apps`) — auto-saves app IDs when Steam shows a region error; guest search highlights saved games with a region-blocked badge (settings: remember / highlight / clear list)

## [1.7.3] - 2026-07-12

### Changed

- Guest search dropdown shows richer item cards: discount badge, original/final price, platforms (Win/Mac/Linux), type, Metascore, controller support, and app ID (via `/api/storesearch/` metadata)

## [1.7.2] - 2026-07-12

### Fixed

- Guest search suggestions always empty: Steam `/search/suggest` and `/api/storesearch/` require `cc`; the script now infers store country from settings, `steamCountry` cookie, or page hints, and falls back to `storesearch` when suggest returns no hits

## [1.7.1] - 2026-07-12

### Changed

- Guest search mode toggle moved from the store search bar into the Region Bypass settings panel only

## [1.7.0] - 2026-07-12

### Added

- **Guest search** — setting in the Region Bypass panel: anonymous suggest dropdown (`/search/suggest`) and guest refetch/inject for `/search` results (same proxy, `cc`, language, and cache stack as app bypass)

## [1.6.4] - 2026-07-12

### Changed

- Header settings button no longer shows an icon (text + proxy indicator only)

## [1.6.3] - 2026-07-12

### Fixed

- When the host page is signed into Steam, replace the guest tag modal “Sign In” panel with the real tagging form so “+” can add tags in-session

## [1.6.2] - 2026-07-12

### Fixed

- When the host page is signed into Steam, remove the guest “Open in Desktop App / You're not signed in!” banner (`.banner_open_in_steam`)

## [1.6.1] - 2026-07-12

### Fixed

- Tag “+” button works again: inject `#app_tagging_modal` and re-run `InitAppTagModal` (defines `ShowAppTagModal`), which live outside `.game_page_background` and were skipped on direct inject

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
