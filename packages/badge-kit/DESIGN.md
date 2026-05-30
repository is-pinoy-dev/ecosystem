# is-pinoy.dev — Badge & Banner Kit

**Component:** Embeddable badge + banner service
**Status:** Design spec for implementation
**Design system:** is-pinoy.dev (retro pixel-art × modern dev tool)
**Reference mockup:** `Banners and Badges.html` (interactive showcase, source of truth for visuals)

---

## 1. Purpose

A ProductHunt-style badge kit for is-pinoy.dev. Any developer who has claimed a
`<handle>.is-pinoy.dev` subdomain can grab a badge or banner to display on their
GitHub README, profile, portfolio, or any deployed site — driving recognition and
backlinks to the network.

Two surfaces ship:

1. **A showcase page** (`/badges`) — where users pick a badge, set their handle, choose a
   theme, and copy embed code. The reference mockup is this page.
2. **The embed runtime** — what those snippets actually load on the user's own site
   (a web component) or render in their README (an SVG endpoint).

---

## 2. Taxonomy

Eight badge/banner types in three categories. **Type is the semantic role; theme is the
skin.** Every type ships in multiple themes (below).

### Category 01 — Website Badges
For a deployed project, repo, or README — the thing lives at a subdomain.

| Type id | Label | Handle? | Notes |
|---|---|---|---|
| `deployed-on` | Deployed On | required | "Deployed on `handle`.is-pinoy.dev". Two-line: mono eyebrow + pixel value. Blinking status dot. |
| `pinoy-made` | Pinoy-Made | none | Origin/quality stamp. No handle — links to is-pinoy.dev root. |
| `built-by` | Built By | required | "Built by a Pinoy Dev" + handle. Credits the builder. |

### Category 02 — Developer Badges
Identity badges for a person — GitHub profile, bio, footer.

| Type id | Label | Handle? | Notes |
|---|---|---|---|
| `proud-pinoy-dev` | Proud Pinoy Dev | required | Identity-first. Dark theme has the glow-pulse animation. |
| `certified` | Certified Pinoy Dev | required | Premium. Gold treatment + double-border. "// CERTIFIED" eyebrow over "PINOY DEV". |
| `member` | Member | required | Compact inline chip. `is-pinoy.dev | handle`. Fits in a sentence. |

### Category 03 — Banners
Wide-format blocks.

| Type id | Label | Handle? | Notes |
|---|---|---|---|
| `readme-banner` | README Banner | required | Top-of-README block. Sun + handle left, "Subdomain by is-pinoy.dev" right. ~88px tall. |
| `profile-banner` | Profile Banner | required | GitHub profile / portfolio hero. Full-width, CRT scanline overlay, tagline. ~120px tall. |

---

## 3. Themes

Not every type supports every theme. The matrix below is the contract — the showcase only
renders combinations marked ✓.

| Theme | deployed-on | pinoy-made | built-by | proud-pinoy-dev | certified | member | readme | profile |
|---|---|---|---|---|---|---|---|---|
| `dark` (bg #0D0D0D, gold border) | ✓ | ✓ | ✓ | ✓ (glow) | ✓ | ✓ | ✓ | ✓ |
| `gold` (bg #F5C800, black border) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `light` (bg #FAFAF5, black border) | ✓ | — | — | — | — | — | — | — |
| `outlined` (transparent, gold border) | — | — | ✓ | ✓ | — | ✓ | — | — |
| `retro` (double-border pixel frame) | ✓ | — | — | — | ✓ | — | — | — |
| `split` (two-panel: dark icon + gold label) | — | ✓ | — | — | — | — | — | — |

**Default theme per type:** `deployed-on`→dark, `pinoy-made`→split, `built-by`→dark,
`proud-pinoy-dev`→dark, `certified`→gold, `member`→dark, `readme-banner`→dark,
`profile-banner`→gold.

### Retro theme — implementation note
The retro double-border is a **pixel frame built from stacked `box-shadow` spread rings**,
NOT a CSS `outline` (outline + offset leaves a disconnected floating gap and reads as broken).

```css
/* retro on dark bg */
box-shadow: 0 0 0 3px #0D0D0D, 0 0 0 6px #F5C800, 8px 8px 0 #D4A800;
/* retro on gold bg (certified) */
box-shadow: 0 0 0 3px #F5C800, 0 0 0 6px #0D0D0D, 8px 8px 0 #0D0D0D;
```

---

## 4. Design system grounding

Pull every value from the is-pinoy.dev design system. Do not invent colors, type, or radii.

**Colors** — `#F5C800` primary gold, `#D4A800` gold-dark (pixel-shadow depth),
`#0D0D0D` near-black bg, `#FAFAF5` warm white text, `#888` muted, `#444`/`#1E1E1E`
borders/surfaces, `#39D353` success (copy confirmation only), `#6b5200` is the
dark-gold used for muted text **on** gold backgrounds.

**Type** — `Press Start 2P` for all labels, handles, headings (line-height ≥ 1.6 always;
sizes 0.5–0.875rem only). `IBM Plex Mono` for eyebrows/metadata/code. `IBM Plex Sans` for
the banner tagline sentence. Never mix Sans and Mono in one label.

**Shape** — `border-radius: 0` everywhere, no exceptions.

**Shadow** — hard-offset pixel shadows, zero blur. Rest `5px 5px 0`, hover collapses to
`2px 2px 0` with `transform: translate(3px,3px)` and `transition: 0.1s` (snappy, mechanical —
no easing curves, no bounce). The glow-pulse (proud-pinoy-dev dark) animates `box-shadow`
between `0 0 20px rgba(245,200,0,0.15)` and `0 0 36px rgba(245,200,0,0.45)` on a 2.5s loop.

**Iconography** — the 8-ray pixel sun, drawn inline as SVG (8 rotated rects on a 100×100
grid). No icon library, no emoji. Sizes used: 16px (member), 24–28px (badges), 34px
(certified), 44px (readme banner), 52px (profile banner).

**Texture** — banners carry the CRT scanline overlay (`repeating-linear-gradient`, 4px
bands, ~5% black). The showcase page also carries the 24px pixel grid + page-level scanlines.

---

## 5. Embed APIs

Users get two embed formats per type. The showcase exposes both in an HTML / Markdown
tab switcher.

### 5a. Web component (for HTML sites, portfolios)
Best fidelity — supports animation, hover, live links.

```html
<script src="https://is-pinoy.dev/badge.js"></script>

<is-pinoy-badge handle="juan" type="deployed-on" theme="dark"></is-pinoy-badge>
<is-pinoy-banner handle="juan" type="profile" theme="gold"></is-pinoy-banner>
```

- One script tag per page (idempotent — guard against double-registration).
- `<is-pinoy-badge>` for the 6 badge types; `<is-pinoy-banner>` for the 2 banners
  (`type="readme" | "profile"`).
- Attributes: `handle` (omit for `pinoy-made`), `type`, `theme`. Invalid `theme` for a
  type falls back to that type's default.
- Render into Shadow DOM so the host page's CSS can't bleed in. Inline the fonts or
  `@import` Google Fonts inside the shadow root.
- The whole badge is an `<a>` to `https://<handle>.is-pinoy.dev` (or root for
  `pinoy-made`), `target="_blank" rel="noopener"`.

### 5b. SVG endpoint (for GitHub READMEs — no JS allowed there)
GitHub strips `<script>`, so READMEs need a static image. Serve a rendered SVG.

```
https://badge.is-pinoy.dev/<type>/<handle>.svg?theme=<theme>
https://banner.is-pinoy.dev/<readme|profile>/<handle>.svg?theme=<theme>
pinoy-made (no handle): https://badge.is-pinoy.dev/pinoy-made.svg?theme=<theme>
```

Markdown snippet pattern:
```md
[![Deployed on is-pinoy.dev](https://badge.is-pinoy.dev/deployed-on/juan.svg)](https://juan.is-pinoy.dev)
```

- Server renders the badge to a self-contained SVG (fonts embedded as paths or
  base64 web-font, since GitHub's camo proxy won't fetch external font files).
- `?theme=` query param selects skin; defaults to type default if omitted/invalid.
- Set sensible cache headers (see §6). Animations degrade gracefully — SVG can carry
  SMIL/CSS for the blink + glow, but static is acceptable for the README surface.
- Validate `<handle>` against the claimed-subdomain registry; unknown handle → 404 SVG
  (or a neutral "claim this" badge), never a broken image.

---

## 6. Visit-count variant (cached)

There's appetite for a **"Deployed On" badge with a visit counter** (ProductHunt-style).
Spec it as a *variant flag*, not a new type:

```
https://badge.is-pinoy.dev/deployed-on/juan.svg?theme=dark&visits=true
<is-pinoy-badge handle="juan" type="deployed-on" theme="dark" visits></is-pinoy-badge>
```

- Adds a right-hand count cell: mono eyebrow "VISITS" over a Press Start 2P numeral,
  comma-grouped (`12,480`), divider rule between it and the handle block.
- **Counts are server-side and cached** — the badge does not count its own impressions.
  Source the number from the subdomain's existing analytics/visit tally.
- **Cache aggressively.** Serve the SVG with `Cache-Control: max-age=300, s-maxage=300`
  (GitHub camo caches ~minutes regardless; don't fight it). The number is "recent," not
  live — label it as a rolling total, not real-time.
- Counter increments on **subdomain page hits**, not badge renders, to avoid camo-proxy
  prefetch inflation. Debounce per-IP server-side.
- If visit data is unavailable, drop the count cell entirely rather than show `0` or `—`.

> Decision needed from product: is the count **all-time**, **30-day rolling**, or
> **today**? The label text and cache window follow from that. Defaulting to 30-day
> rolling unless told otherwise.

---

## 7. Acceptance checklist

- [ ] All 8 types render in every ✓ theme from the matrix; non-✓ combos are not offered.
- [ ] `border-radius: 0` holds everywhere; no rounded corners leak in.
- [ ] Retro frames use stacked `box-shadow` rings, not `outline` (no floating gap).
- [ ] Web component is Shadow-DOM isolated and survives hostile host CSS.
- [ ] SVG endpoints embed fonts (render correctly through GitHub's camo proxy).
- [ ] Hover = `translate(3px,3px)` + shadow collapse, `0.1s`, no easing bounce.
- [ ] Showcase handle input sanitizes to `[a-z0-9-]` and updates all previews live.
- [ ] Copy button confirms with the green success state, then reverts.
- [ ] Visit-count cell is cached, server-sourced, and hidden when data is missing.
- [ ] No emoji, no icon library, no gradients, no white backgrounds.

---

*Visual source of truth: `Banners and Badges.html`. When this spec and the mockup
disagree, the mockup wins for appearance and this doc wins for API/behavior.*
