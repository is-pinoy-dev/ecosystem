# badge-kit Design Spec

**Date:** 2026-05-29
**Status:** Approved
**Package:** `@is-pinoy-dev/badge-kit`
**Deployed at:** `https://badges.is-pinoy.dev`

## Overview

A Cloudflare Worker that serves dynamically rendered SVG/PNG/WebP badges and banners for Filipino developers using is-pinoy.dev subdomains. Badges are generated on-request and cached at the CDN edge for 1 day — no static file storage needed.

## Package Location

```
packages/badge-kit/
```

Placed in `packages/` (not `tools/`) because it may export types and utilities to other workspace members (e.g. the web app). Deployed as a standalone Cloudflare Worker at `badges.is-pinoy.dev` via `wrangler deploy`.

## Routes

```
GET /powered-by[?variant=&format=]
GET /filipino-dev[?variant=&format=]
GET /banner/:subdomain[?format=]
GET /:subdomain/badge?variant=default|outline|flat|pixel&format=svg|png|webp
```

- **Default format:** `svg`
- **Default variant:** `default` (presets default to `pixel`)
- The `/banner/:subdomain` route renders a wider landscape banner (640×160px)
- All other badge routes render at 280×56px

## File Structure

```
packages/badge-kit/
  src/
    index.ts          # Hono app — Cloudflare Worker entry point
    routes/
      presets.ts      # /powered-by, /filipino-dev, /banner/:subdomain
      badge.ts        # /:subdomain/badge
    lib/
      svg.ts          # SVG template generators for all 4 variants + presets
      render.ts       # resvg-wasm → PNG/WebP conversion
      registry.ts     # Cloudflare DNS API subdomain verification
      cache.ts        # Cache-Control header helpers
  wrangler.toml       # Worker config, route pattern: badges.is-pinoy.dev/*
  package.json        # @is-pinoy-dev/badge-kit (private)
  tsconfig.json
```

## SVG Templates & Variants

All badges follow the retro pixel-art design system: Press Start 2P font, `border-radius: 0`, hard pixel-offset shadows (no blur).

### Badge anatomy

```
[ 🇵🇭 | {subdomain}.is-pinoy.dev ]
```

Left section: Philippine flag emoji. Right section: subdomain name in Press Start 2P, white text on dark background.

### Dimensions

| Type | Width | Height |
|------|-------|--------|
| Badge | 280px | 56px |
| Banner | 640px | 160px |

### Variants

| Variant | Background | Border | Shadow |
|---------|------------|--------|--------|
| `default` | `#0D0D0D` | `2px solid #F5C800` | `4px 4px 0px #000` |
| `outline` | transparent | `2px solid #F5C800` | none |
| `flat` | `#F5C800` | none | none |
| `pixel` | `#0D0D0D` | `2px solid #F5C800` | `4px 4px 0px #F5C800` |

### "Not found" state

When a subdomain is not registered, the badge renders with muted `#888888` text and the label `not found`. Always returns a valid image — embeds never break in READMEs.

### Preset badges

`/powered-by` and `/filipino-dev` are fixed routes with hardcoded templates. They default to the `pixel` variant but accept `?variant=` overrides. Since they return identical SVG every time, Cloudflare caches them indefinitely until the next Worker deploy.

## Output Formats

| Format | Content-Type | Notes |
|--------|-------------|-------|
| `svg` | `image/svg+xml` | Default, smallest, best for GitHub READMEs |
| `png` | `image/png` | Via `resvg-wasm` (WebAssembly SVG renderer) |
| `webp` | `image/webp` | Via `resvg-wasm` |

`resvg-wasm` runs inside the Worker — no external service call needed for rasterization. The WASM module is initialized once per Worker instance (~2MB bundle overhead).

## Registry Verification

Dynamic badge routes verify the subdomain against the Cloudflare DNS API before rendering.

```
GET /:subdomain/badge
  → registry.ts: GET https://api.cloudflare.com/client/v4/zones/{ZONE_ID}/dns_records
      ?type=TXT&name={subdomain}.is-pinoy.dev
  → found     → render active badge
  → not found → render "not found" muted badge
```

The Worker does not cache DNS results internally — Cloudflare's CDN caches the full HTTP response for 1 day, so the DNS API is only hit on cache miss (first request or 24h expiry).

## Caching

All responses include:
```
Cache-Control: public, max-age=86400
```

No Worker KV or R2 involved. Pure render-and-cache-at-edge pattern.

## Environment Variables

| Variable | Source |
|----------|--------|
| `CLOUDFLARE_API_TOKEN` | Already in repo CI secrets |
| `CLOUDFLARE_ZONE_ID` | Already in repo CI secrets |

Set via `wrangler secret put` for production; `.dev.vars` for local development.

## CI/CD

New workflow at `.github/workflows/deploy-badge-kit.yml`:

```yaml
on:
  push:
    branches: [main]
    paths: ["packages/badge-kit/**"]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm --filter @is-pinoy-dev/badge-kit deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_WORKER_DEPLOY_TOKEN }}
          CLOUDFLARE_ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
```

## Example Usage

GitHub README embed:
```md
![is-pinoy.dev](https://badges.is-pinoy.dev/yourname/badge?variant=pixel)
```

HTML embed:
```html
<img src="https://badges.is-pinoy.dev/yourname/badge?variant=outline&format=png" alt="yourname.is-pinoy.dev" />
```

Powered-by badge:
```md
[![Powered by is-pinoy.dev](https://badges.is-pinoy.dev/powered-by)](https://is-pinoy.dev)
```
