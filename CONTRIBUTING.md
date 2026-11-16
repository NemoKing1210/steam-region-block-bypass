# Contributing

Thanks for your interest in improving Steam Region Block Bypass.

## Ways to help

- Report bugs and suggest features via [GitHub Issues](https://github.com/NemoKing1210/steam-region-block-bypass/issues)
- Open pull requests for fixes, features, docs, or translations
- Test on different userscript managers (Tampermonkey, Violentmonkey, ScriptCat) and browsers

## Before you start

1. Read [DEVELOPMENT.md](docs/DEVELOPMENT.md) for setup, scripts, and release notes.
2. Skim [ARCHITECTURE.md](docs/ARCHITECTURE.md) and [AGENTS.md](AGENTS.md) for how the script works and project conventions.
3. Check [README.md](README.md), [CHANGELOG.md](CHANGELOG.md), and open issues/PRs to avoid duplicate work.

## Development setup

```bash
git clone https://github.com/NemoKing1210/steam-region-block-bypass.git
cd steam-region-block-bypass
npm install
npm run dev      # Vite + monkey HMR — install the "dev:" userscript
npm run build    # Production bundle → dist/ + copy to repo root
npm test         # Node built-in unit tests
npm run ci       # tests + build + verify committed artifacts match
```

Edit source under `src/` (and `vite.config.js` for userscript metadata). Do **not** hand-edit root `.user.js` / `.meta.js`.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Keep PRs focused: one concern per PR when possible.
3. Run `npm run build` so committed install artifacts stay in sync.
4. Run `npm run ci` locally when practical (same checks as GitHub Actions).
5. For user-visible changes:
   - Bump `version` in `package.json` (SemVer: patch for fixes, minor for features)
   - Add a [Keep a Changelog](https://keepachangelog.com/) entry in `CHANGELOG.md`
   - Update [README.md](README.md) and the corresponding `README.<locale>.md` translations if features or install flow changed
   - Update [ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details, metadata, permissions, or settings changes

### What CI checks

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs `npm ci` → `npm run ci`. It fails if `dist/` and the root `.user.js` / `.meta.js` are out of sync with the build.

## Conventions

- Vanilla JS ESM modules under `src/`; no frameworks unless explicitly agreed.
- Prefer existing patterns: constants in `core/constants.js`, pure models for testable logic, strings in `i18n/locales/`, DOM features in `features/`, shared utilities in `utils/`.
- Use the bus (`core/bus.js`) for cross-feature reactions. Do not add a global mutable state bag.
- Persist settings through `core/settings.js`; normalize every value in `core/settings-model.js`.
- Prefix DOM / storage keys with `srbb-` / `srbb_`.
- Guest `GM_xmlhttpRequest` must stay `anonymous: true`.
- Transplant into the live document first; keep the full-document rewrite fallback. Never introduce iframe/blob insert mode.
- Do not expand `@connect` or `@grant` beyond what is needed (`vite.config.js`).
- Do not commit localhost `@updateURL` / `@downloadURL` values.
- Do not imply affiliation with Valve / Steam in docs or UI copy.
- Do not add purchase, activation, or account-login bypass logic.

## Localization

UI locales: `en`, `ru`, `zh-CN`, `es`, `pt-BR`, `de`, `fr`, `ja`, `ko`, `pl`.

- Add every new user-facing string to **all ten** locale files in [`src/i18n/locales/`](src/i18n/locales/) with identical keys and placeholders. `npm test` enforces parity and source-key coverage.
- Keep localized `@name` / `@description` in `vite.config.js` aligned when changing the product description.

## Testing checklist

When changing inject or search:

- [ ] Region-blocked app page, signed out — auto-bypass transplants the game layout and preserves the header
- [ ] Region-blocked app page, signed in — transplant keeps the session; wishlist/follow/ignore work; tag modal and tag rows work
- [ ] Full rewrite fallback (temporarily break the shell selector) still renders the page
- [ ] Banner Reload fetches fresh (bypasses cache)
- [ ] Guest search suggestions (header) with blocked badges
- [ ] Optional guest `/search` page when enabled
- [ ] Settings: every page, Reset confirmation, language switch, Save and Save & Reload
- [ ] Both `steam-plus` and this script enabled on one page — no `srbb-` class/id collisions
- [ ] Proxy gateway path (if testing IP locks)
