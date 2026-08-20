# CLAUDE.md — packages/badge-kit

Guidance for working in `@is-pinoy-dev/badge-kit` specifically. See the root
`CLAUDE.md` for monorepo-wide commands and the Banig Grid v2 design system —
badge/banner visuals follow it too (see this package's own `DESIGN.md` for the
badge-specific application of those rules).

## What this is

A Cloudflare Worker (Hono) at `badges.is-pinoy.dev` that renders SVG/PNG/WebP
badges and banners for is-pinoy.dev subdomains — the `README.md` embed badges
and the `<is-pinoy-badge>` interactive web component used in `apps/docs` and
real portfolio pages. Not part of the Turborepo `build`/`typecheck` pipeline
in the same way as other packages — it deploys itself as a Worker.

## Commands

```bash
pnpm --filter @is-pinoy-dev/badge-kit dev            # wrangler dev (local Worker)
pnpm --filter @is-pinoy-dev/badge-kit deploy         # wrangler deploy
pnpm --filter @is-pinoy-dev/badge-kit typecheck
pnpm --filter @is-pinoy-dev/badge-kit test
pnpm --filter @is-pinoy-dev/badge-kit test:watch
pnpm --filter @is-pinoy-dev/badge-kit generate:font  # regenerate embedded IBM Plex Mono constant
```

Local dev needs `.dev.vars` (copy `.dev.vars.example`) with real
`CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ZONE_ID` — badge rendering verifies
subdomain registration via a Cloudflare DNS TXT record lookup.

## Structure

```
src/routes/     Hono route handlers (/badge, /banner, /badge.js)
src/lib/        rendering (SVG build, resvg PNG conversion, jsquash WebP conversion), color validation
src/tests/
scripts/generate-font.ts    embeds IBM Plex Mono as base64 into rendered SVGs
assets/
```

## Key notes

- Every color query param (`bg`, `text`, `muted`, `border`, `mark`, `markbg`)
  is validated as a hex value or `transparent` and **never echoed raw into the
  generated SVG** — an invalid/unsafe value silently falls back to the theme
  default instead of erroring. Any new customizable param must follow the same
  validate-never-echo pattern; this is an injection boundary, not just a UX
  nicety.
- IBM Plex Mono is base64-embedded directly in every SVG (via
  `generate:font`) because GitHub's camo image proxy strips external font
  requests — don't switch this to a `@font-face` URL.
- Badges are cached at the CDN edge for 1 day
  (`Cache-Control: public, max-age=86400`) — a rendering bug can stay visible
  for up to 24h after a fix ships; consider that when triaging urgency.
- The `<is-pinoy-badge>` web component (`/badge.js`) renders into Shadow DOM
  and must mirror the static SVG badge output exactly. It honors
  `prefers-reduced-motion`; the only animation is the sun mark
  (`animate=spin|hover`) — no tilt/glare/shimmer, matching the retired
  arcade-style motion rule from the root design system.
