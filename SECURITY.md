# Security Policy

## Supported versions

Only the latest published version of the userscript is supported with security
fixes. The version is shown in the userscript header and in
[`package.json`](package.json); older builds should be updated before reporting
an issue that may already be fixed.

| Version | Supported |
|---------|-----------|
| 2.x (latest release) | ✅ |
| 1.x and older | ❌ |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

Report privately through GitHub's
[private vulnerability reporting](https://github.com/NemoKing1210/steam-region-block-bypass/security/advisories/new)
(Security → Advisories → *Report a vulnerability*). If that is unavailable, you
may open an issue containing only a request for a private contact channel — no
exploit details, URLs, or payloads.

Please include:

- Affected version(s) and userscript manager / browser
- A description of the impact and the conditions required to trigger it
- Steps to reproduce, or a minimal proof of concept (redact any account data)
- Whether the issue also affects the optional `proxy-gateway.mjs`

You will receive an acknowledgement as soon as practical. This is a
volunteer-maintained project, so response and fix times are best-effort, not
guaranteed. Please allow time for a fix before public disclosure.

## Scope

This project is a userscript that refetches **public, guest-visible** Steam
store pages and an optional local proxy gateway. In scope:

- Leakage of Steam session cookies, login state, or other user data in guest
  requests (`GM_xmlhttpRequest` must stay `anonymous: true`)
- Code injection or execution of non-Steam scripts from fetched guest HTML
  (for example extension or third-party scripts embedded in a response)
- Cross-site scripting, prototype pollution, or DOM clobbering introduced by
  the transplant / injected content / settings UI
- Exposure of settings, cached pages, or proxy credentials stored by the script
- The gateway accepting non-loopback connections, being usable as an open
  proxy, or forwarding credentials/headers it should not
- Supply-chain issues in the build (dependencies, committed artifacts not
  matching `src/`)

## Out of scope

- The region block itself, or Steam's willingness to serve a given page to
  guest visitors
- Purchase, activation, or account-login bypasses — these are explicitly out of
  the project's scope and are not accepted as features
- Vulnerabilities in Steam, Valve services, userscript managers, or browsers
- Missing hardening (for example CSP headers) with no demonstrated impact
- Social engineering, physical access, or issues requiring an already
  compromised browser profile or machine

## Safe harbour

We will not pursue or support legal action against researchers acting in good
faith: testing on accounts and machines they own, avoiding privacy violations,
service disruption, and data destruction, and reporting findings privately with
reasonable time to fix. Do not test against other users' accounts or data.
