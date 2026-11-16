# CLAUDE.md

Project instructions for Claude Code live in **[AGENTS.md](./AGENTS.md)**. Treat that file as the source of truth.

When updating agent guidance, edit `AGENTS.md` first, then mirror any Claude-specific notes here if needed.

## Quick pointers

- Edit `src/` only; run `npm test`, then `npm run build` to refresh root
  `steam-region-block-bypass.user.js` / `.meta.js`; `npm run ci` runs both plus
  artifact verification
- Metadata: `vite.config.js`; version: `package.json`
- Settings: nested v2 in `src/core/settings-model.js` + `src/core/settings.js`
  (`srbb_settings_v2`, one-time migration from flat `srbb_settings`)
- Region bypass: `src/region/` — transplant-first via `transplant.js`, with
  `inject.js` full-document rewrite as the only fallback; queue restore and
  tag fixups are separate modules
- Search: `src/features/search/` — preserve endpoints, merge order,
  enrichment, DOM, and probe behaviour; state stays module-local
- UI: `src/features/settings/`, `src/ui/`, `src/styles/`, `src/i18n/locales/`
- Optional gateway: `npm run gateway` → `proxy-gateway.mjs`
- Releases: bump `package.json` → `npm run build` → `CHANGELOG.md` + README badge
- Scope: anonymous guest refetch + transplant/rewrite only — no purchase/login
  bypass, no iframe/blob insert mode unless explicitly asked
