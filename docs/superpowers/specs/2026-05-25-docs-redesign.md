# Docs Redesign — Design Spec
**Date:** 2026-05-25
**Status:** Approved

## Overview

Redesign `apps/docs` to align with the `is-pinoy.dev` design system: dark-only retro pixel-art aesthetic, Jeepney Gold `#F5C800` accents, zero border-radius, `Press Start 2P` + `IBM Plex Sans` + `IBM Plex Mono` fonts, logo + `banner.gif` in the nav. Install `@is-pinoy-dev/ui` as the shared token source. No scrolling marquee, no CRT scanline overlay.

## Approach

Option B — CSS override + targeted fumadocs customization. Override fumadocs CSS variables to match design tokens, enforce zero border-radius globally, apply pixel-grid background, and use fumadocs' `nav.title` JSX slot for the logo/banner. Keep fumadocs internals untouched so upgrades remain safe.

## Section 1 — Package Wiring

- Add `@is-pinoy-dev/ui: workspace:*` to `apps/docs/package.json` devDependencies.
- Add `postcss.config.mjs` to `apps/docs/` re-exporting from `@is-pinoy-dev/ui/postcss.config` (same as `apps/web`).
- Run `pnpm install` to link.

## Section 2 — Fonts & Root Layout

Replace `apps/docs/src/app/layout.tsx`:
- Load `Press_Start_2P` (weight 400), `IBM_Plex_Sans` (weights 400, 500), `IBM_Plex_Mono` (weight 400) from `next/font/google`.
- Wire as CSS variables: `--font-pixel`, `--font-sans`, `--font-mono`.
- Add `class="dark"` to `<html>` (dark-only, no theme toggle).
- Remove Inter.

## Section 3 — CSS Theming (`global.css`)

Order of imports:
1. `@is-pinoy-dev/ui/globals.css` — design tokens, `@theme inline`, base layer
2. `fumadocs-ui/css/neutral.css`
3. `fumadocs-ui/css/preset.css`

Then add:

**fumadocs variable overrides** — override `--color-fd-*` vars in `:root` (loaded after fumadocs CSS):
- `--color-fd-background` → `var(--background)` (`#0D0D0D`)
- `--color-fd-foreground` → `var(--foreground)` (`#FAFAF5`)
- `--color-fd-card` → `var(--card)` (`#2A2A2A`)
- `--color-fd-card-foreground` → `var(--card-foreground)` (`#FAFAF5`)
- `--color-fd-border` → `var(--border)` (`#444444`)
- `--color-fd-primary` → `var(--primary)` (`#F5C800`)
- `--color-fd-primary-foreground` → `var(--primary-foreground)` (`#0D0D0D`)
- `--color-fd-muted` → `var(--muted)` (`#444444`)
- `--color-fd-muted-foreground` → `var(--muted-foreground)` (`#888888`)
- `--color-fd-secondary` → `var(--secondary)` (`#2A2A2A`)
- `--color-fd-secondary-foreground` → `var(--secondary-foreground)` (`#FAFAF5`)
- `--color-fd-accent` → `var(--accent)` (`#444444`)
- `--color-fd-accent-foreground` → `var(--accent-foreground)` (`#FAFAF5`)
- `--color-fd-popover` → `var(--popover)` (`#2A2A2A`)
- `--color-fd-popover-foreground` → `var(--popover-foreground)` (`#FAFAF5`)
- `--color-fd-ring` → `var(--ring)` (`#F5C800`)

**Global rules:**
- `* { border-radius: 0 !important }` — enforces zero-radius on all fumadocs elements
- Pixel-grid background on `body`: `rgba(245,200,0,0.03)` horizontal + vertical lines, 24px grid on `#0D0D0D`
- Gold bottom border on fumadocs nav: `#nd-nav { border-bottom: 3px solid #F5C800 }`
- Scrollbar gutter + scroll-lock fix (keep existing rules)

## Section 4 — Nav Logo + Banner

**Asset setup:**
- Copy `apps/web/public/logo.png` → `apps/docs/public/logo.png`
- Copy `apps/web/public/banner.gif` → `apps/docs/public/banner.gif`

**`src/lib/layout.shared.tsx`** — replace text `title` with JSX:
```tsx
nav: {
  title: (
    <>
      <Image src="/logo.png" alt="is-pinoy.dev logo" width={48} height={48}
        className="h-10 w-auto [image-rendering:pixelated]" />
      <Image src="/banner.gif" alt="is-pinoy.dev" width={200} height={40}
        unoptimized className="-ml-4 hidden h-9 w-auto md:block" />
    </>
  ),
}
```

`next/image` requires `next.config` to allow local static images — already works with default Next.js static file serving from `public/`.

## Section 5 — Home Page Redirect

Replace `apps/docs/src/app/(docs)/page.tsx` with a server component that:
1. Reads `source.pageTree.children`
2. Finds the first node with a `url` property (depth-first, handles nested folders)
3. Calls `redirect(url)` from `next/navigation`
4. Falls back to the first doc slug if tree traversal yields nothing unexpected

No client-side JS needed — this is a pure server redirect.

## Files Changed

| File | Action |
|------|--------|
| `apps/docs/package.json` | Add `@is-pinoy-dev/ui` devDep |
| `apps/docs/postcss.config.mjs` | Create — re-export from ui package |
| `apps/docs/src/app/layout.tsx` | Replace Inter with brand fonts, add `dark` class |
| `apps/docs/src/app/global.css` | Add ui globals import, fd overrides, pixel grid, gold nav border |
| `apps/docs/src/lib/layout.shared.tsx` | Replace text title with logo+banner JSX |
| `apps/docs/src/app/(docs)/page.tsx` | Replace with redirect to first doc |
| `apps/docs/public/logo.png` | Copy from apps/web/public |
| `apps/docs/public/banner.gif` | Copy from apps/web/public |

## Non-Goals

- No scrolling marquee
- No CRT scanline overlay
- No light mode
- No fumadocs component forking
