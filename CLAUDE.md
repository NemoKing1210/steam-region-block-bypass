# CLAUDE.md

Project instructions for Claude Code live in **[AGENTS.md](./AGENTS.md)**. Treat that file as the source of truth.

When updating agent guidance, edit `AGENTS.md` first, then mirror any Claude-specific notes here if needed.

## Quick pointers

- Edit `src/` only; run `npm run build` to refresh root `steam-region-block-bypass.user.js` / `.meta.js`
- Metadata: `vite.config.js`; version: `package.json`
- Optional gateway: `npm run gateway` → `proxy-gateway.mjs`
- Releases: bump `package.json` → `npm run build` → `CHANGELOG.md` + README badge
- Scope: anonymous guest refetch + DOM inject only — no purchase/login bypass, no reintroducing iframe insert mode unless asked
