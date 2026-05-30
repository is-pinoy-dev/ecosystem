# SEO & Metadata Fix — apps/docs

**Date:** 2026-05-30
**Scope:** `apps/docs` only

---

## Overview

Fix and improve SEO, structured data, PWA manifest, OG images, and metadata across the docs site at `docs.is-pinoy.dev`. The site already has a solid foundation — this pass corrects schema errors, completes the manifest, brands the OG image, and cleans up metadata organisation.

---

## Section 1: Structured Data

### Root Layout (`src/app/layout.tsx`)

Replace the `Organization` schema with a `WebSite` schema that references the Organisation on the main site:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "is-pinoy.dev docs",
  "url": "https://docs.is-pinoy.dev",
  "isPartOf": {
    "@type": "Organization",
    "name": "is-pinoy.dev",
    "url": "https://is-pinoy.dev",
    "sameAs": [
      "https://is-pinoy.dev",
      "https://github.com/is-pinoy-dev/ecosystem",
      "https://discord.gg/MVrgEfFExh"
    ]
  }
}
```

**Why:** The docs site is a sub-property of the organisation, not the organisation itself. The canonical URL for is-pinoy.dev the org is `is-pinoy.dev`, not `docs.is-pinoy.dev`.

### Per-Page (`src/app/(docs)/[[...slug]]/page.tsx`)

Keep `BreadcrumbList` unchanged. Enhance `TechArticle` with:

```json
{
  "author": { "@type": "Organization", "name": "is-pinoy.dev", "url": "https://is-pinoy.dev" },
  "publisher": { "@type": "Organization", "name": "is-pinoy.dev", "url": "https://is-pinoy.dev" },
  "dateModified": "<page.data.lastModified if available, else omit the field>"
}
```

---

## Section 2: PWA Manifest (`public/site.webmanifest`)

```json
{
  "name": "is-pinoy.dev Docs",
  "short_name": "ipd docs",
  "description": "Documentation for the is-pinoy.dev free subdomain service",
  "start_url": "/guides",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#F5C800",
  "background_color": "#0D0D0D",
  "icons": [
    { "src": "/web-app-manifest-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/web-app-manifest-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/web-app-manifest-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/web-app-manifest-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**Changes from current:**
- `name` → "is-pinoy.dev Docs" (was "is-pinoy.dev")
- `short_name` → "ipd docs"
- Added `description`, `start_url`, `scope`
- `theme_color` → `#F5C800` gold (was `#000000`)
- `background_color` → `#0D0D0D` (was `#000000`)
- Added `any` purpose icon entries alongside existing `maskable` ones

---

## Section 3: Custom Branded OG Image

### Route: `src/app/og/docs/[...slug]/route.tsx`

Replace `DefaultImage` from fumadocs-ui with a custom `ImageResponse` layout.

**Canvas:** 1200×630

**Layout (left-to-right):**
- Right edge: vertical gold bar, 6px wide, full height (`#F5C800`)
- Content area: left-padded ~64px, vertically centered

**Content (top to bottom within content area):**
1. `is-pinoy.dev docs` — IBM Plex Mono, 16px, `#888888`, top-left
2. Page title — Press Start 2P, 42px, `#F5C800`, max 2 lines, word-wrap
3. Page description — IBM Plex Mono, 20px, `#FAFAF5`, truncated at ~120 chars
4. `docs.is-pinoy.dev` — IBM Plex Mono, 16px, `#888888`, bottom-right

**Background:**
- Base: `#0D0D0D`
- Scanline overlay: CSS `repeating-linear-gradient` of 1px `rgba(0,0,0,0.3)` lines every 3px

**Fonts:** Loaded at runtime via `fetch` from Google Fonts (Press Start 2P, IBM Plex Mono). Cached by Next.js static generation.

---

## Section 4: Metadata Cleanup

### `src/app/layout.tsx`

Add explicit `viewport` export:

```ts
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#F5C800',
  colorScheme: 'dark',
};
```

Add to `metadata`:
```ts
keywords: ['Filipino developers', 'free subdomain', 'is-pinoy.dev', 'portfolio subdomain', 'Pilipinas'],
category: 'technology',
creator: 'is-pinoy.dev',
```

### `src/lib/shared.ts`

Add a `baseUrl` constant:
```ts
export const baseUrl = 'https://docs.is-pinoy.dev';
```

Replace the hardcoded `"https://docs.is-pinoy.dev"` string in `page.tsx` and `og/route.tsx` with `baseUrl` imported from `shared.ts`.

### `src/app/(docs)/[[...slug]]/page.tsx`

In `generateMetadata`, make OG title and description explicit:

```ts
openGraph: {
  title: page.data.title,
  description: page.data.description,
  url: `${baseUrl}${page.url}`,
  type: 'article',
  images: getPageImage(page).url,
},
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/layout.tsx` | Replace Organization schema → WebSite; add viewport export; add keywords/category/creator to metadata |
| `src/app/(docs)/[[...slug]]/page.tsx` | Enhance TechArticle schema; explicit OG title/description; use baseUrl from shared |
| `src/app/og/docs/[...slug]/route.tsx` | Custom branded ImageResponse replacing DefaultImage; use baseUrl from shared |
| `src/lib/shared.ts` | Add `baseUrl` export |
| `public/site.webmanifest` | Updated name, description, start_url, scope, theme_color, background_color, icon purposes |

---

## Out of Scope

- Changes to `apps/web` (the main site) — Organization schema on the main site is a separate task
- New favicon assets — existing ICO/PNG/SVG/Apple assets are adequate
- Alternate language / hreflang — single-language site
