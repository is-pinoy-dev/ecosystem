---
version: alpha
name: is-pinoy.dev
description: >
  Free subdomain service for Filipino developers. Retro pixel-art aesthetic
  layered over a modern, intuitive layout. Every interface element should feel
  like it belongs in a JRPG but ships production-grade code.

colors:
  primary: "#F5C800"
  primary-dark: "#D4A800"
  primary-light: "#FFE566"
  background: "#0D0D0D"
  surface: "#2A2A2A"
  surface-mid: "#444444"
  on-primary: "#0D0D0D"
  on-background: "#FAFAF5"
  muted: "#888888"
  accent-red: "#E63946"
  accent-blue: "#1E90FF"
  accent-green: "#39D353"
  code-bg: "#0A0A0A"

typography:
  display:
    fontFamily: "Press Start 2P"
    fontSize: 2.25rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em
  heading-lg:
    fontFamily: "Press Start 2P"
    fontSize: 1.625rem
    fontWeight: 400
    lineHeight: 1.6
  heading-sm:
    fontFamily: "Press Start 2P"
    fontSize: 0.6875rem
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0.01em
  eyebrow:
    fontFamily: "Press Start 2P"
    fontSize: 0.5rem
    fontWeight: 400
    letterSpacing: 0.1875em
    textTransform: uppercase
  body-md:
    fontFamily: "IBM Plex Sans"
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.7
  body-sm:
    fontFamily: "IBM Plex Sans"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.7
  mono-md:
    fontFamily: "IBM Plex Mono"
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.8
  mono-sm:
    fontFamily: "IBM Plex Mono"
    fontSize: 0.6875rem
    fontWeight: 400
    letterSpacing: 0.0625em
    textTransform: uppercase
  label:
    fontFamily: "Press Start 2P"
    fontSize: 0.5625rem
    fontWeight: 400
    lineHeight: 1.6

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  4xl: 80px
  section: 100px

rounded:
  none: 0px
  sm: 0px
  md: 0px
  lg: 0px
  full: 0px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
    border: "3px solid {colors.on-primary}"
    shadow: "5px 5px 0 {colors.on-background}"
  button-primary-hover:
    backgroundColor: "{colors.primary-light}"
    shadow: "2px 2px 0 {colors.on-background}"
    transform: "translate(3px, 3px)"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-background}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
    border: "3px solid {colors.on-background}"
    shadow: "5px 5px 0 {colors.surface-mid}"
  button-secondary-hover:
    textColor: "{colors.primary}"
    border: "3px solid {colors.primary}"
    shadow: "2px 2px 0 {colors.surface-mid}"
    transform: "translate(3px, 3px)"
  nav-link:
    textColor: "{colors.muted}"
    typography: "{typography.mono-sm}"
  nav-link-hover:
    textColor: "{colors.primary}"
  card:
    backgroundColor: "{colors.surface}"
    border: "3px solid {colors.surface-mid}"
    padding: "36px 28px"
    rounded: "{rounded.none}"
  card-hover:
    border: "3px solid {colors.primary}"
    shadow: "6px 6px 0 {colors.primary-dark}"
    transform: "translate(-3px, -3px)"
  feature-card:
    backgroundColor: "transparent"
    border: "2px solid {colors.surface-mid}"
    padding: "28px 24px"
  feature-card-hover:
    border: "2px solid {colors.primary}"
  feature-icon:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    border: "2px solid {colors.primary-dark}"
    shadow: "3px 3px 0 {colors.background}"
    size: "40px"
  code-block:
    backgroundColor: "{colors.code-bg}"
    border: "3px solid {colors.surface-mid}"
    padding: "32px"
    typography: "{typography.mono-md}"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    border: "3px solid {colors.primary}"
    typography: "{typography.mono-md}"
    padding: "16px"
    caretColor: "{colors.primary}"
  badge:
    backgroundColor: "rgba(245,200,0,0.1)"
    textColor: "{colors.primary}"
    border: "2px solid {colors.primary}"
    typography: "{typography.eyebrow}"
    padding: "8px 16px"
  stats-bar:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    border-top: "3px solid {colors.background}"
    border-bottom: "3px solid {colors.background}"
  tag:
    border: "2px solid {colors.surface-mid}"
    textColor: "{colors.muted}"
    typography: "{typography.mono-md}"
    padding: "8px 16px"
  tag-featured:
    border: "2px solid {colors.primary}"
    textColor: "{colors.primary}"
    backgroundColor: "rgba(245,200,0,0.08)"
---

## Component Library

All UI components live in `packages/ui` (`@is-pinoy-dev/ui`). Always import from there — never build one-off components in app code.

**Adding a new component:**

```bash
pnpm dlx shadcn@latest add <component-name>
```

Run this from the repo root. shadcn installs the component into `packages/ui/src/components/` and it automatically inherits all design tokens below via CSS variables — no extra theming needed.

**Never** install shadcn components directly into `apps/web` or any other app. All shared components belong in the `packages/ui` package.

---

## Overview

**Retro Pixel × Modern Dev Tool.**

is-pinoy.dev is a free subdomain service for Filipino developers. The visual identity fuses the cultural vibrancy of the Philippine jeepney — chrome, chrome, stars, and loud color — with the pixel-art aesthetic of 16-bit games. The result is a dark-mode developer tool that feels unmistakably Filipino without being a caricature.

The emotional target: *the satisfying click of a mechanical keyboard inside a retro arcade cabinet*. Functional, high-contrast, and full of small delights. Every interaction should feel intentional and slightly playful.

The logo — a pixel-art jeepney front-on — is the visual anchor of the brand. It should never be altered, filtered, or surrounded by competing elements.

## Colors

- **Primary (#F5C800):** Jeepney gold. The single dominant accent. Used for borders, CTAs, highlights, active states, and the stats bar. Everything important is gold.
- **Primary Dark (#D4A800):** Deep gold used for box-shadows that simulate pixel-art depth on interactive elements.
- **Primary Light (#FFE566):** Pale gold reserved for hover brightening on primary buttons only.
- **Background (#0D0D0D):** Near-black canvas. All pages use this as the base — no white or light backgrounds anywhere.
- **Surface (#2A2A2A):** Card backgrounds. One step lighter than background, creates depth without shadows.
- **Surface Mid (#444444):** Default border color for non-active cards and code block outlines.
- **On-Primary (#0D0D0D):** Text placed on gold backgrounds. Always near-black for contrast.
- **On-Background (#FAFAF5):** Body text on dark surfaces. Slightly warm white — not pure #FFFFFF.
- **Muted (#888888):** Secondary text, nav links, captions. Never use for interactive elements.
- **Accent Green (#39D353):** Reserved exclusively for success states (copied, merged, live).
- **Accent Red (#E63946):** Reserved exclusively for error states and reserved-name warnings.
- **Accent Blue (#1E90FF):** Reserved for external link indicators and syntax highlighting keys.
- **Code BG (#0A0A0A):** Slightly darker than background, used only inside code blocks.

## Typography

Two type systems in strict roles — **never mix them in the same UI element**:

**Pixel fonts (Press Start 2P):** All headings, eyebrows, button labels, stat numbers, nav logo, step numbers, and the nav CTA. This is the voice of the brand. Its chunky 8-bit letterforms carry the retro identity. Use only at sizes from the token set — never scale it arbitrarily.

**System fonts (IBM Plex):** All body copy, descriptions, code, nav links, tags, and form inputs. Plex Sans for prose; Plex Mono for anything code-like, metadata, or tabular. These fonts ground the retro aesthetic in professional readability.

**Scaling:** `display` (hero H1) → `heading-lg` (section titles) → `heading-sm` (card titles, step titles) → `eyebrow` (section labels above titles). Never skip levels.

**Line height:** Press Start 2P always needs `1.6` minimum — it has no descenders and needs vertical air. IBM Plex body runs `1.7–1.8`.

**Uppercase eyebrows** always use `letter-spacing: 0.1875em` and are prefixed with `// ` in the text content (e.g., `// STEP BY STEP`).

## Layout

**Max content width:** 1100px for feature grids and how-it-works sections. 900px for code sections. 700px for centered community/CTA sections. Always `margin: 0 auto`.

**Section padding:** `100px 40px` on desktop, `60px 20px` on mobile (≤ 600px).

**Grid system:** CSS Grid with `auto-fit` and `minmax(260px, 1fr)` for step cards; `minmax(220px, 1fr)` for feature cards. No explicit column counts — let content breathe.

**Spacing scale:** Strictly 8px-based (`xs: 4px`, `sm: 8px`, `md: 16px`, `lg: 24px`, `xl: 32px`, `2xl: 48px`). Section-level gaps use `3xl` (64px) or `4xl` (80px) between sub-elements. Never use arbitrary pixel values.

**Navigation:** Fixed top bar, `backdrop-filter: blur(8px)`, `3px solid primary` bottom border. Logo left, links center, CTA right. On mobile (≤ 600px), hide nav links — show only logo and CTA.

**Pixel grid background:** Always present at the full-page level — a subtle `24px × 24px` grid in `rgba(245,200,0,0.03)` using `linear-gradient`. Non-interactive, `pointer-events: none`.

**Scanline overlay:** Fixed `position: fixed`, full viewport, `repeating-linear-gradient` creating 4px horizontal bands at 8% opacity. Always the highest `z-index` on the page (e.g., `9999`). Non-interactive.

## Elevation & Depth

Depth is simulated in **pixel-art style** — not with `box-shadow: blur`. All depth uses hard-offset shadows with zero blur:

- **Standard interactive depth:** `5px 5px 0 <shadow-color>` at rest → `2px 2px 0 <shadow-color>` on hover, with `transform: translate(3px, 3px)`. This mimics a physical button press in 8-bit UI.
- **Card hover depth:** `6px 6px 0 {colors.primary-dark}` with `transform: translate(-3px, -3px)` — cards lift toward the viewer.
- **Glow effects:** `box-shadow: 0 0 20px rgba(245,200,0,0.15)` for yellow-bordered containers that need atmospheric depth. Used sparingly — only the hero subdomain input and the badge.
- **No blurred shadows anywhere.** No `box-shadow` with a blur radius > 0 on interactive components.
- **Tonal layering:** Background (#0D0D0D) → Surface (#2A2A2A) → Code BG (#0A0A0A). These three levels handle the majority of perceived depth.

## Shapes

**Zero border-radius everywhere.** All corners are perfectly square — `border-radius: 0`. This is non-negotiable and central to the pixel-art identity. No `rounded-*`, no `border-radius: 4px`, no softening for "modern" feel.

**Pixel borders:** All meaningful containers use a multi-layer `box-shadow` pattern that simulates a pixelated outline:
```
box-shadow:
  -3px -3px 0 #0D0D0D,
   3px  3px 0 #0D0D0D,
  -3px  3px 0 #0D0D0D,
   3px -3px 0 #0D0D0D,
   0    0   0 6px <border-color>;
```
This creates the appearance of a hand-drawn pixel border with corner emphasis.

**Border weights:** `3px` for primary containers and nav; `2px` for secondary cards and tags; `2px` for internal code block tab outlines.

## Components

All components default to `border-radius: 0`. All interactive components implement the press-depth pattern (`translate` + shrinking shadow) on `:hover` and `:active`.

**Buttons:** Two variants only.
- `button-primary`: Gold background, black text, black border, white shadow. The main CTA.
- `button-secondary`: Transparent, white border, gray shadow. Turns gold on hover.

Buttons use `Press Start 2P` at `9px` (label size). Padding `16px 28px`. Never use `border-radius`.

**Cards (step cards):** `surface` background, `surface-mid` border at rest. On hover: gold border + lift shadow + negative translate. Step number displayed in a `40×40px` pixel box (black bg, gold border, Press Start 2P `11px`).

**Feature cards:** Transparent background, `surface-mid` border. Simpler than step cards — no lift shadow. Feature icon is a `40×40px` gold square with black shadow offset.

**Code blocks:** Near-black background, `surface-mid` border, no top border (tabs connect). Syntax highlighting: keys in `#7EC8E3` (blue), values in `#F5C800` (gold), strings in `#39D353` (green), comments in `#555555`, punctuation in `#888888`. Copy button in top-right corner — turns green on success.

**Nav CTA:** Same as `button-primary` but smaller (`9px`, `padding: 10px 16px`), white shadow instead of full 5px.

**Badge (hero eyebrow badge):** Gold text on faint gold background, gold border, pulsing `box-shadow` glow animation at 2s interval.

**Subdomain input:** Black background, gold border, `IBM Plex Mono 13px`. Caret is gold. Suffix `.is-pinoy.dev` in muted color. Attached action button is full-height gold — no gap between input and button.

**Tags:** Square, Plex Mono, 2px border. Default muted. Featured variant is gold border + gold text + faint gold fill.

**Marquee:** Gold background strip with black text. `Press Start 2P 10px`. Stars (★) as separators in `primary-dark`. Infinite CSS animation — no JS.

**Stats bar:** Full-width gold band. Black text. Numbers in `Press Start 2P 20px`, labels in `IBM Plex Mono 11px uppercase`. `3px solid black` top and bottom borders.

## Do's and Don'ts

**Do:**
- Use `Press Start 2P` for every heading, button label, and data number — it carries the brand voice
- Always pair gold (#F5C800) with near-black (#0D0D0D) for maximum contrast and visual identity
- Keep `border-radius: 0` on every element including inputs, buttons, and images
- Use hard pixel-offset shadows (e.g., `5px 5px 0`) — never blurred shadows on interactive components
- Use the `// SECTION NAME` eyebrow convention with `Press Start 2P 8px` and wide letter-spacing before every section title
- Animate logos and decorative elements with slow, floating `translateY` keyframes (4–6s, ease-in-out)
- Keep the scanline and pixel grid overlays on every full page view — they define the CRT atmosphere
- Use `IBM Plex Mono` for all code, metadata, nav labels, and tag text
- Maintain WCAG AA contrast (4.5:1 minimum) — gold on black passes; never use `muted (#888)` for interactive labels
- Scope accent colors (green, red, blue) to their semantic purpose only — they are not decorative

**Don't:**
- Don't use `border-radius` anywhere — not even `2px` to "soften" corners
- Don't use blurred `box-shadow` on any interactive component — depth is always hard-offset
- Don't place two `Press Start 2P` elements of the same size directly adjacent — use the type scale hierarchy
- Don't use white (#FFFFFF) as a background — always use `#0D0D0D` or `#2A2A2A`
- Don't use more than three font sizes of `Press Start 2P` in a single screen
- Don't use the accent colors (green/red/blue) as decorative or brand elements
- Don't use gradients on backgrounds — the retro identity relies on flat, high-contrast surfaces
- Don't add `backdrop-filter` blur to anything except the fixed nav bar
- Don't override the cursor — the custom pixel cursor (gold 8×8 checkerboard) is part of the personality
- Don't use the jeepney logo at sizes below 80px — the pixel-art detail is lost
- Don't mix IBM Plex Sans and IBM Plex Mono in the same paragraph or label
- Don't use `opacity` to dim primary gold — use `primary-dark` or add a transparent overlay color instead
Human: values (never tint the brand color)
