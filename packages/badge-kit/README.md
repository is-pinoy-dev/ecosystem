# @is-pinoy-dev/badge-kit

Cloudflare Worker at `badges.is-pinoy.dev` that renders SVG/PNG/WebP badges and banners for is-pinoy.dev subdomains.

## Local Development

1. Copy the example secrets file and fill in your values:

   ```bash
   cp .dev.vars.example .dev.vars
   # edit .dev.vars with real CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID
   ```

2. Start the dev server (Wrangler, usually on `http://localhost:8787`):

   ```bash
   pnpm dev
   ```

### Previewing component changes in the web/docs apps

The docs "Try it" builder and every badge image load from
`${NEXT_PUBLIC_BADGE_HOST}` (default `https://badges.is-pinoy.dev`) — i.e. the
**deployed** worker, not your local checkout. So edits to `badge.js` (the
`<is-pinoy-badge>` web component) won't appear in the live previews until this
worker is deployed. To preview local changes, run this worker and point the app
at it:

```bash
pnpm --filter @is-pinoy-dev/badge-kit dev            # serves /badge.js on :8787
NEXT_PUBLIC_BADGE_HOST=http://localhost:8787 pnpm --filter docs dev
```

## Endpoints

| URL | Description |
|-----|-------------|
| `GET /badge/:subdomain` | Badge for a registered subdomain (shows "not found" if unregistered) |
| `GET /badge` | Subdomain-less badge (only `type=pinoy-made` applies) |
| `GET /banner/:subdomain` | Wide banner for a subdomain |
| `GET /badge.js` | Interactive `<is-pinoy-badge>` web component for HTML pages (see below) |

### Query Parameters

| Param | Values | Default |
|-------|--------|---------|
| `type` | See badge/banner types below | `subdomain` (badge), `readme` (banner) |
| `theme` | `light`, `dark`, `gold`, `outlined` | Per-type default |
| `format` | `svg`, `png`, `webp` | `svg` |
| `icon` | `false`/`off`/`0`/`no` hides the sun mark cell | shown |
| `preview` | `true` bypasses the registry check (showcase only) | — |
| `bg` `text` `muted` `border` `mark` `markbg` | color overrides — see below | Theme value |

### Custom colors

Any theme color can be overridden per request to match your own brand. Each
param takes a **hex value** (`#RRGGBB`, `#RGB`, `#RGBA`, `#RRGGBBAA`, with or
without the `#`) or the keyword `transparent`. Start from the closest `theme`
and override only what you need; the square geometry, mark, and type stay
on-brand.

| Param | Overrides |
|-------|-----------|
| `bg` | surface background |
| `text` | primary text (handle / value) |
| `muted` | eyebrow + secondary text |
| `border` | outer border **and** the inner divider rule |
| `mark` | brand-mark glyph |
| `markbg` | brand-mark cell background |

```
# a violet mark on the default light badge
/badge/juan?type=subdomain&mark=%23FFFFFF&markbg=6D28D9

# match a GitHub-dark README
/badge/juan?theme=dark&bg=0D1117&text=E6EDF3&muted=7D8590&border=30363D&markbg=238636&mark=FFFFFF
```

Invalid or unsafe values are ignored and fall back to the theme color, so a
malformed param never breaks the image (or injects markup — colors are
validated, never echoed raw into the SVG). `#` must be URL-encoded as `%23` in a
query string; the bare hex form (`markbg=238636`) avoids the encoding.

### Badge Types

| Type | Endpoint | Renders | Default Theme |
|------|----------|---------|---------------|
| `subdomain` (alias `deployed-on`) | `/badge/:subdomain` | eyebrow label over `handle.is-pinoy.dev` | `light` |
| `member` | `/badge/:subdomain` | `is-pinoy.dev │ handle` inline chip | `light` |
| `pinoy-made` | `/badge` | `PINOY-MADE` origin stamp (no handle) | `light` |
| `certified` | `/badge` | `CERTIFIED` over `PINOY DEV` (no handle) | `gold` |

### Banner Types (`/banner/:subdomain?type=...`)

| Type | Description | Default Theme |
|------|-------------|---------------|
| `readme` | 640 × 96 README banner | `light` |
| `profile` | 720 × 140 GitHub profile banner | `gold` |

### Themes

`light` (default) · `dark` · `gold` · `outlined`

### Examples

```
/badge/juan
/badge/juan?type=member&theme=dark
/badge/juan?type=subdomain&format=png
/badge?type=certified&theme=gold
/badge?type=pinoy-made&theme=outlined
/badge/juan?type=subdomain&icon=false
/banner/juan?type=readme&theme=dark
/banner/juan?type=profile&theme=gold&format=webp
```

## Interactive HTML badge (`/badge.js`)

For real HTML pages (portfolios, footers, docs) — where a live link and hover
are available, unlike a GitHub README — load the web component once and drop in
`<is-pinoy-badge>` elements:

```html
<script src="https://badges.is-pinoy.dev/badge.js"></script>

<is-pinoy-badge handle="juan" type="deployed-on" theme="light"></is-pinoy-badge>
```

The component renders into Shadow DOM, so the host page's CSS can't bleed in. It
mirrors the static SVG badge exactly. By default the only motion is a quiet
140ms border hover (per the v2.0 spec); richer effects — sun rotation, a
diagonal shimmer sweep, and an "ID card" cursor tilt — are available but strictly
opt-in. Every effect honors `prefers-reduced-motion`.

### Attributes

| Attribute | Values | Default |
|-----------|--------|---------|
| `handle` | subdomain handle (sanitized to `[a-z0-9-]`); omit for `pinoy-made`/`certified` | — |
| `type` | `deployed-on` (alias `subdomain`), `member`, `pinoy-made`, `certified` | `deployed-on` |
| `theme` | `light`, `dark`, `gold`, `outlined` | `light` |
| `label` | custom eyebrow for `deployed-on` | `DEPLOYED ON` |
| `icon` | `false`/`off`/`0`/`no` hides the sun mark cell | shown |
| `animate` | `spin` (slow continuous sun rotation) or `hover` (springy 45° turn on hover) | none |
| `shimmer` | `sweep` (once on hover), `loop` (while hovered), `always` | `off` |
| `shimmer-color` | any CSS color for the sweep (hex, `rgb()/rgba()/hsl()/hsla()`, or a named color) | translucent white |
| `tilt` | `true`/`on` enables the 3D cursor tilt + glare | off |
| `bg` `text` `muted` `border` `mark` `markbg` | color overrides (hex or `transparent`, same as the SVG params) | Theme value |

All of these are web-component-only; README SVGs stay static (GitHub runs no JS).

```html
<is-pinoy-badge handle="juan" type="certified" theme="gold"></is-pinoy-badge>
<is-pinoy-badge handle="juan" type="deployed-on" markbg="#6D28D9" mark="#FFFFFF"></is-pinoy-badge>
<is-pinoy-badge handle="juan" type="deployed-on" icon="false"></is-pinoy-badge>
<is-pinoy-badge handle="juan" type="deployed-on" animate="spin"></is-pinoy-badge>
<!-- opt into the arcade effects -->
<is-pinoy-badge handle="juan" type="certified" theme="gold" shimmer="sweep" tilt="true"></is-pinoy-badge>
<is-pinoy-badge handle="juan" type="member" theme="dark" shimmer="always" shimmer-color="rgba(245,200,0,0.6)"></is-pinoy-badge>
```

## Scripts

```bash
pnpm dev           # start local dev server
pnpm test          # run unit tests
pnpm typecheck     # TypeScript check
pnpm deploy        # deploy to Cloudflare Workers
pnpm generate:font # regenerate the embedded IBM Plex Mono font constant
```

## Architecture

- **Hono** — request routing
- **`@resvg/resvg-wasm`** — SVG → PNG (WASM, bundled)
- **`@jsquash/webp`** — PNG → WebP (WASM, bundled)
- All badges are cached at the CDN edge for 1 day (`Cache-Control: public, max-age=86400`)
- Subdomain registration is verified against the Cloudflare DNS API (TXT record lookup)
- IBM Plex Mono is base64-embedded in every SVG so it renders correctly through GitHub's camo proxy
- Visuals follow the **Banig Grid v2.0** design system (see `DESIGN.md`) — clean, square, mono-typed; the earlier retro pixel-art look is retired
