# CLAUDE.md

Project instructions for Claude Code live in **[AGENTS.md](./AGENTS.md)**. Treat that file as the source of truth.

When updating agent guidance, edit `AGENTS.md` first, then mirror any Claude-specific notes here if needed.

## Quick pointers

- Canonical userscript: `steam-region-block-bypass.user.js` (keep header in sync with `steam-region-block-bypass.meta.js`)
- Optional gateway: `npm run gateway` → `proxy-gateway.mjs`
- Releases: bump `@version` in both script headers + `package.json`, update `CHANGELOG.md` and the README version badge
- Scope: anonymous guest refetch + DOM inject only — no purchase/login bypass, no reintroducing iframe insert mode unless asked
