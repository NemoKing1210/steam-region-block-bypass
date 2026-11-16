# Development

Local setup, build scripts, and release workflow for Steam Region Block Bypass.

Architecture, repository layout, userscript metadata, and the full settings
reference live in [ARCHITECTURE.md](ARCHITECTURE.md). For contribution
guidelines, see [CONTRIBUTING.md](../CONTRIBUTING.md). Agent-oriented notes live
in [AGENTS.md](../AGENTS.md).

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (see `.nvmrc` and `engines` in `package.json`)
- npm
- A userscript manager for browser testing ([Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or ScriptCat)

## Scripts

```bash
npm install
npm run dev      # Vite serve — open/install the generated "dev:" userscript
npm run build    # Production → dist/ + copy to repo root
npm test         # Node built-in unit tests
npm run ci       # Same checks as GitHub Actions (tests + build + verify artifacts)
npm run gateway  # Optional local HTTP proxy gateway
```

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite + vite-plugin-monkey; installable userscript prefixed with `dev:` |
| `npm run build` | Production bundle → `dist/`, then copy to root install artifacts |
| `npm test` | Node built-in runner: settings/migration, URLs, cache, blocked apps, search parsing, i18n parity |
| `npm run verify:artifacts` | Ensure `dist/` matches committed root `.user.js` / `.meta.js` |
| `npm run ci` | `test` + `build` + `verify:artifacts` (set `CI=true` or pass `--git` for freshness vs HEAD) |
| `npm run gateway` | Run [`proxy-gateway.mjs`](../proxy-gateway.mjs) on `127.0.0.1:8765` |

## Local workflow

1. Edit source under [`src/`](../src/) (entry: [`src/main.js`](../src/main.js)).
2. Userscript metadata (`@match`, `@connect`, localized `@name` / `@description`, …) lives in [`vite.config.js`](../vite.config.js) — not in the built files.
3. Version is `package.json` → header `@version` and in-script `SCRIPT_VERSION`.
4. After changes that should ship, run `npm run build` and commit the regenerated root `.user.js` / `.meta.js`.
5. Pull requests run [CI](../.github/workflows/ci.yml), which fails if those files are out of date.

### Notes

- **`npm run dev`:** install the served userscript once in your manager; HMR applies while the server runs.
- **Built file:** after `npm run build`, Violentmonkey **Track local file** on the root `steam-region-block-bypass.user.js`.
- Do **not** hand-edit committed `.user.js` / `.meta.js`.
- Do **not** commit localhost `@updateURL` / `@downloadURL` values.

### Configuration

Shared constants and `DEFAULT_SETTINGS` live in [`src/core/constants.js`](../src/core/constants.js). Settings normalization/migration is pure [`src/core/settings-model.js`](../src/core/settings-model.js); GM persistence is [`src/core/settings.js`](../src/core/settings.js). UI strings live in [`src/i18n/locales/`](../src/i18n/locales/). Cross-feature notifications use [`src/core/bus.js`](../src/core/bus.js); there is no global mutable state bag.

Settings use `srbb_settings_v2`. On first load the flat `srbb_settings` v1 object is migrated once and left untouched for downgrade. Page cache (`srbb_page_cache`) and blocked apps (`srbb_blocked_apps`) keep their existing shapes.

## UI and runtime notes

Settings open from the account dropdown item (`#account_dropdown`), the
logged-out fallback button in `#global_actions`, or `GM_registerMenuCommand`.
The panel uses a home list with General / Search / Cache / Proxy / About pages
and a draft model: Reset, Cancel, Save, Save & reload. Cache clearing actions
apply immediately.

The optional gateway can be pointed at `127.0.0.1:8765` (or your host/port)
from the **Proxy** tab. See [ARCHITECTURE.md](ARCHITECTURE.md#proxy-gateway) for
the supported URL modes.

## Releasing

1. Bump `version` in `package.json` (SemVer).
2. Run `npm run build` to refresh the root `.user.js` / `.meta.js`.
3. Add a [Keep a Changelog](https://keepachangelog.com/) entry to
   [`CHANGELOG.md`](../CHANGELOG.md).
4. Push to `main` (or create a GitHub Release).

Managers compare the installed `@version` with the remote metadata to decide
whether to offer an update.
