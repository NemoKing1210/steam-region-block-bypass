# Design

Visual rules for every injected surface: the settings entry, the panel, region
status cards and banners, guest search UI, cache meters, and toasts. Steam owns
the page; our UI must read as part of it, not as a separate product.

## Principles

- **Steam-native, not a skin.** Use Steam's dark surfaces, Motiva Sans, compact
  controls, black hairline borders, and Steam blue (`#66c0f4`) as the only
  accent. Do not introduce a parallel palette.
- **Reuse Steam chrome where it exists.** The settings entry lives in
  `#account_dropdown .popup_body.popup_menu` with Steam's `popup_menu_item`
  class plus our own `srbb-menu-item`. Own-styled shells are only for surfaces
  Steam does not provide (the panel and the logged-out header fallback).
- **Every injected class and id is prefixed `srbb-`.** Both this script and
  sibling userscripts can run on the same Steam page; never add an unprefixed
  class or style an unprefixed selector.
- **Never outshine the store.** No decorative gradients, emoji, infinite
  animations, or shadows Steam would not use. Motion is short and functional.
- **Draft before commit.** Panel controls edit an in-memory draft. Only Save
  persists; Cancel, Escape, and overlay clicks discard. Cache clear actions are
  the deliberate exception: they act on data immediately.

## Color tokens

All colors are custom properties in [`src/styles/tokens.css`](src/styles/tokens.css)
and consumed through `var(--srbb-*)`. Component CSS must not hardcode palette
hexes.

| Token | Value | Use |
|---|---|---|
| `--srbb-accent` | `#66c0f4` | active states, focus rings, accent text and borders |
| `--srbb-accent-dark` | `#417a9b` | gradient bottom, scrollbar thumb |
| `--srbb-accent-bright` | `#7dcafa` | hover tint of the accent |
| `--srbb-bg` | `#1b2838` | raised panel surface |
| `--srbb-bg-deep` | `#16202d` | panel gradient bottom, sunken wells |
| `--srbb-surface` | `#2c313a` | neutral raised controls |
| `--srbb-surface-hover` | `#3d4450` | neutral hover |
| `--srbb-text` | `#c7d5e0` | body text |
| `--srbb-text-soft` | `#b8c4d0` | secondary body text |
| `--srbb-muted` | `#8f98a0` | hints, descriptions, metadata |
| `--srbb-white` | `#fff` | headings, hovered labels |
| `--srbb-border` | `#000` | hard outlines |
| `--srbb-success` | `#a4d007` | positive actions and states |
| `--srbb-success-dark` | `#536904` | green gradient bottom |
| `--srbb-success-soft` | `#beee11` | store-green highlights |
| `--srbb-warning` | `#c6a32e` | warning states |
| `--srbb-warning-dark` | `#8a6d1a` | warning gradient bottom |
| `--srbb-warning-soft` | `#e7c65c` | warning text/icons |
| `--srbb-danger` | `#a94847` | destructive actions, errors |
| `--srbb-danger-soft` | `#ffc9c9` | error text/icons |
| `--srbb-overlay` | `rgba(0,0,0,.72)` | modal backdrop |
| `--srbb-radius` | `2px` | controls and cards |
| `--srbb-font` | `"Motiva Sans", Arial, Helvetica, sans-serif` | all injected text |

Raised cards use a 1px black border, radius 2–3px, and
`inset 0 1px 0 rgba(255,255,255,.04)`. Soft separators inside cards use a
low-opacity white line, never a second gray palette.

## Typography

- Base: `12px/1.4 var(--srbb-font)`.
- Panel title: 14px, 700, white. Subtitle and hints: 11–12px, muted.
- Section captions and field labels: 10–11px, 700, uppercase,
  `letter-spacing: .04em`.
- Nav titles: 13px, 700. Descriptions: 11px, muted, one line.
- Buttons: 12px, 700. Pills, counters, version: 9–11px, 700.

## Layout

- **Overlay** (`.srbb-panel-overlay`): fixed inset, centered panel,
  `var(--srbb-overlay)`, z-index above Steam content. Page scroll is locked
  while the panel is open; wheel/touch outside the panel body is swallowed.
- **Panel** (`.srbb-panel`): vertical flex column,
  `width: min(640px, 100%)`, capped height, hidden overflow, dark gradient,
  black border, radius 3px, deep shadow.
- **Header/footer**: sticky inside the panel, black separators. Header carries
  title, version chip, muted subtitle, and the × close button. Footer pins
  Reset left with `margin-right: auto`, then Cancel, Save, Save & reload.
- **Home list** (`.srbb-panel__nav`): full-width page buttons with a small
  accent icon, title, one-line description, and `›` chevron. The Cache item
  carries a fill badge. Hover switches the border/text to accent.
- **Page view** (`.srbb-panel__page`): `‹ Back` crumb plus the page title, then
  stacked section cards. Escape returns home first, then closes the panel.
- **Sections** (`.srbb-panel__section`): dark translucent card with a black
  border and inner highlight; captions are uppercase accent text.

## Components

- **Buttons** (`.srbb-btn`): 2px radius, compact height, bold text. Default is
  the accent gradient; `--ghost` is neutral; `--green` is positive;
  `--danger` is destructive. Primary actions are never flat or outline-only.
- **Fields** (`.srbb-field`): label above, control below, optional hint
  underneath. Selects and inputs use Steam's blue-gray fill, black border,
  and an accent focus ring.
- **Switch** (`.srbb-switch`): real checkbox visually hidden inside the label;
  34×18px track, gray knob off, accent/white knob on. A `.srbb-pill` on the
  right shows ON/OFF with a green treatment when on.
- **Cache** (`.srbb-cache-*`): large fill percentage, used-bytes line,
  segmented bar (pages / search / blocked / free), legend with counts and
  sizes, then scrollable entry and blocked lists with ghost remove buttons.
- **Toasts** (`.srbb-toasts` / `.srbb-toast`): corner-anchored cards with icon,
  title, optional message, thin remaining-time bar, hover pause, and key-based
  deduplication. Errors use `role="alert"`; others use `role="status"`.
- **Region UI** (`.srbb-region-*`): loader veil/card, status card with Retry,
  manual offer, grid banner, and the native-looking other-site button.
- **Search UI** (`.srbb-suggest*`, `.srbb-search-*`): header dropdown with
  skeleton, message, stats, and probe progress; `/search` banner, skeleton,
  status line, injected rows, and blocked marks reuse the same palette.

## Motion

- Default transitions are color/border/opacity only, around `.15s ease`.
- View changes may slide 14px over `.22s`; sections can fade in with a short
  stagger. No loops, bounce, or decorative motion.
- Respect `prefers-reduced-motion: reduce` by removing transforms and
  animations from our UI.

## Accessibility

- Focus-visible elements get
  `outline: 1px solid var(--srbb-accent); outline-offset: 2px`.
- The panel is a modal dialog (`role="dialog"`, `aria-modal="true"`, labelled
  header), closes on Escape/overlay click, and traps page scrolling.
- Icon-only buttons carry `aria-label` and `title`. Status regions use
  `role="status"`; failures use `role="alert"`.
- Body text must stay readable on the dark palette; do not use muted text for
  essential information.

## Do / Don't

- Do keep every injected class/id under `srbb-` and every color in
  `tokens.css`.
- Do place entries in Steam-owned containers using Steam's layout.
- Do add new strings to all ten locale files and keep token names in sync
  with this document.
- Don't add a second visual language for a one-off feature; extend this file
  and the token table first.
- Don't style bare Steam selectors globally; scope to our classes or to an
  element we own.
- Don't imply Valve affiliation in copy or chrome.

## Changing the design

Update this file and `src/styles/tokens.css` in the same change that touches
injected CSS, then run `npm run ci` and inspect the result on a real Steam
page in both settings-entry placements (account dropdown and logged-out
fallback).
