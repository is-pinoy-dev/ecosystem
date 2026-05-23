# Landing Page Design — is-pinoy.dev

**Date:** 2026-05-23  
**Status:** Approved  
**Scope:** `apps/web` — single-page hero landing page

---

## Overview

A single-page hero landing for is-pinoy.dev, a free subdomain service for Filipino developers. The page consists of three vertical zones: a fixed nav bar, a full-viewport hero with a subdomain claim input, and a gold marquee strip. Design follows DESIGN.md exactly — retro pixel-art aesthetic, zero border-radius, hard-offset pixel shadows, Press Start 2P + IBM Plex type system.

---

## Sections

### 1. Fixed Navigation Bar

- **Left:** Jeepney logo (`logo.png`) — minimum 80px, no filters, no competing elements. Clicking navigates to `/`.
- **Center:** Empty (no nav links — single-page, nothing to navigate to yet).
- **Right:** `CLAIM YOUR SUBDOMAIN` button — `button-primary` component style, links to `https://github.com/is-pinoy-dev/domains`.
- **Style:** `position: fixed`, `top: 0`, full width, `backdrop-filter: blur(8px)`, `3px solid #F5C800` bottom border, `background: rgba(13,13,13,0.85)`.

### 2. Full-Viewport Hero

Full `min-height: 100vh`, centered content column, `padding-top` to clear the fixed nav.

**Background layers (bottom to top):**
1. Base: `#0D0D0D`
2. Pixel grid: `24×24px` linear-gradient at `rgba(245,200,0,0.03)` — `pointer-events: none`
3. Scanline overlay: `position: fixed`, full viewport, `repeating-linear-gradient` 4px bands at 8% opacity, `z-index: 9999`, `pointer-events: none`

**Content stack (centered, vertical):**
1. **Jeepney logo** — `120px` wide, floating animation (`translateY -8px ↔ 0`, 5s ease-in-out, infinite)
2. **Eyebrow badge** — `// FREE FOR FILIPINO DEVS` in `Press Start 2P 8px`, gold text, faint gold bg (`rgba(245,200,0,0.1)`), `2px solid #F5C800` border, `8px 16px` padding, pulsing `box-shadow` glow at 2s interval
3. **Headline** — `YOUR NAME.IS-PINOY.DEV` in `Press Start 2P 2.25rem`, `color: #FAFAF5`, `line-height: 1.6`. On mobile (≤600px): reduce to `1.2rem`.
4. **Subheadline** — `A free subdomain for every Filipino developer.` in `IBM Plex Sans 15px`, `color: #888888`, `line-height: 1.7`
5. **Subdomain input row:**
   - Text input: black bg, `3px solid #F5C800`, `IBM Plex Mono 13px`, gold caret, `16px` padding, placeholder `yourname`
   - Suffix label: `.is-pinoy.dev` in `IBM Plex Mono`, `color: #888888`, inline with input, no gap
   - `CLAIM` button: attached directly to input (no gap), `button-primary` style, `Press Start 2P 9px`. On click: `window.open('https://github.com/is-pinoy-dev/domains', '_blank')`
   - Full row has `box-shadow: 0 0 20px rgba(245,200,0,0.15)` glow

### 3. Gold Marquee Strip

- Full-width gold band (`background: #F5C800`, `3px solid #0D0D0D` top + bottom border)
- Scrolling text: `★ LIBRE ★ PARA SA MGA PINOY DEVELOPER ★ FREE SUBDOMAINS ★ IS-PINOY.DEV ★ CLAIM YOURS NOW ★`
- Font: `Press Start 2P 10px`, `color: #0D0D0D`
- Stars (`★`) in `#D4A800` (primary-dark)
- Infinite CSS `@keyframes` scroll — no JavaScript
- Two copies of text concatenated for seamless loop

---

## Typography Setup

Update `apps/web/app/layout.tsx` to load:
- `Press Start 2P` (Google Fonts) → `--font-pixel`
- `IBM Plex Sans` → `--font-sans`
- `IBM Plex Mono` → `--font-mono`

Remove current Geist, Geist Mono, Figtree, Roboto imports.

---

## Interaction Details

| Element | Behavior |
|---|---|
| Nav CTA button | Opens `https://github.com/is-pinoy-dev/domains` in new tab |
| CLAIM button | Opens `https://github.com/is-pinoy-dev/domains` in new tab |
| Input Enter key | Same as CLAIM button |
| Card/button hover | `translate(3px, 3px)` + shadow shrinks from `5px 5px` to `2px 2px` |
| All corners | `border-radius: 0` — no exceptions |

---

## File Changes

| File | Change |
|---|---|
| `apps/web/app/layout.tsx` | Replace fonts, set up CSS variables, add base styles |
| `apps/web/app/page.tsx` | Replace placeholder with full landing page |
| `apps/web/app/globals.css` (if exists) | Add marquee keyframe, scanline/pixel-grid styles |

---

## Constraints

- Zero border-radius everywhere
- No blurred box-shadows on interactive elements (hard offset only)
- No white backgrounds
- Accent colors (green/red/blue) not used decoratively
- Scanline + pixel grid overlays always present
- Logo never below 80px wide
- `Press Start 2P` only at token sizes from DESIGN.md
