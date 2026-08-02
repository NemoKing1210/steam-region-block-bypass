# Development

Local setup, repository layout, and release notes for Steam Region Block Bypass.

For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md). Agent-oriented architecture notes live in [AGENTS.md](AGENTS.md).

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (see `.nvmrc` and `engines` in `package.json`)
- npm
- A userscript manager for browser testing ([Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), or ScriptCat)

## Scripts

```bash
npm install
npm run dev      # Vite serve — open/install the generated "dev:" userscript
npm run build    # Production → dist/ + copy to repo root
npm run ci       # Same checks as GitHub Actions (build + verify artifacts)
npm run gateway  # Optional local HTTP proxy gateway
```

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite + vite-plugin-monkey; installable userscript prefixed with `dev:` |
| `npm run build` | Production bundle → `dist/`, then copy to root install artifacts |
| `npm run verify:artifacts` | Ensure `dist/` matches committed root `.user.js` / `.meta.js` |
| `npm run ci` | `build` + `verify:artifacts` (set `CI=true` or pass `--git` for freshness vs HEAD) |
| `npm run gateway` | Run [`proxy-gateway.mjs`](proxy-gateway.mjs) on `127.0.0.1:8765` |

## Local workflow

1. Edit source under [`src/`](src/) (entry: [`src/main.js`](src/main.js)).
2. Userscript metadata (`@match`, `@connect`, localized `@name` / `@description`, …) lives in [`vite.config.js`](vite.config.js) — not in the built files.
3. Version is `package.json` → header `@version` and in-script `SCRIPT_VERSION`.
4. After changes that should ship, run `npm run build` and commit the regenerated root `.user.js` / `.meta.js`.
5. Pull requests run [CI](.github/workflows/ci.yml), which fails if those files are out of date.

### Notes

- **`npm run dev`:** install the served userscript once in your manager; HMR applies while the server runs.
- **Built file:** after `npm run build`, Violentmonkey **Track local file** on the root `steam-region-block-bypass.user.js`.
- Do **not** hand-edit committed `.user.js` / `.meta.js`.
- Do **not** commit localhost `@updateURL` / `@downloadURL` values.

### Configuration

Shared constants live in [`src/constants.js`](src/constants.js). UI strings in [`src/i18n/`](src/i18n/). Mutable runtime in [`src/state.js`](src/state.js).

## How it works

```
store.steampowered.com
       │
       ▼
region error detect  OR  guest search hooks
       │
       ▼
buildTargetUrl → optional proxy → anonymous GM_xmlhttpRequest
       │
       ▼
parse HTML → extractGamePageRoot → injectDirect
       │
       ▼
banner + Steam app CSS/JS + guest inline inits
```

Settings open from the header **Region Bypass** button or `GM_registerMenuCommand`.

## Repository layout

```text
steam-region-block-bypass/
├── src/                     # ESM source (edit here)
│   ├── main.js
│   ├── constants.js
│   ├── state.js
│   ├── settings.js
│   ├── cache.js
│   ├── blocked-apps.js
│   ├── gm.js / detect.js / url.js / bypass.js / inject.js
│   ├── features/            # panel, feedback, suggest, search-page, probe
│   ├── i18n/
│   ├── styles/
│   └── utils/
├── scripts/                 # Build / CI helpers
├── proxy-gateway.mjs        # Optional Node gateway (not bundled into userscript)
├── package.json
├── vite.config.js
├── steam-region-block-bypass.user.js   # Built installable artifact
├── steam-region-block-bypass.meta.js
├── README.md
├── DEVELOPMENT.md
├── CONTRIBUTING.md
├── AGENTS.md
├── CHANGELOG.md
└── LICENSE
```

## Script metadata

Declared in `vite.config.js`. Key fields:

| Field | Value |
|-------|-------|
| `@namespace` | `https://github.com/NemoKing1210/steam-region-block-bypass` |
| `@version` | From `package.json` |
| `@updateURL` / `@downloadURL` | Raw GitHub URL of `.user.js` |
| `@match` | `https://store.steampowered.com/*` |
| `@grant` | `GM_xmlhttpRequest`, `GM_getValue`, `GM_setValue`, `GM_addStyle`, `GM_registerMenuCommand` |
| `@connect` | `store.steampowered.com`, `*` |

## Proxy gateway

```bash
npm run gateway
# PORT=8765 UPSTREAM_PROXY=socks5://127.0.0.1:1080 npm run gateway
```

Point the userscript **Proxy** tab at `127.0.0.1:8765` (or your host/port). The gateway is optional and separate from the Vite userscript build.
