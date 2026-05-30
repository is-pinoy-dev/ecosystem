# @is-pinoy-dev/badge-kit

Cloudflare Worker at `badges.is-pinoy.dev` that renders SVG/PNG/WebP badges and banners for is-pinoy.dev subdomains.

## Local Development

1. Copy the example secrets file and fill in your values:

   ```bash
   cp .dev.vars.example .dev.vars
   # edit .dev.vars with real CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID
   ```

2. Start the dev server:

   ```bash
   pnpm dev
   ```

## Endpoints

| URL | Description |
|-----|-------------|
| `GET /badge/:subdomain` | Badge for a registered subdomain (shows "not found" if unregistered) |
| `GET /badge` | Subdomain-less badge (only `type=pinoy-made` applies) |
| `GET /banner/:subdomain` | Wide banner for a subdomain |

### Query Parameters

| Param | Values | Default |
|-------|--------|---------|
| `type` | See badge/banner types below | `deployed-on` (badge), `readme` (banner) |
| `theme` | See themes below | Depends on type |
| `format` | `svg`, `png`, `webp` | `svg` |

### Badge Types (`/badge/:subdomain?type=...`)

| Type | Description | Default Theme |
|------|-------------|---------------|
| `deployed-on` | "Deployed on is-pinoy.dev" | `dark` |
| `built-by` | "Built by :subdomain" | `dark` |
| `proud-pinoy-dev` | "Proud Pinoy Dev" declaration | `dark` |
| `certified` | Certified PINOY DEV seal | `gold` |
| `member` | Community member badge | `dark` |
| `pinoy-made` | "PINOY-MADE" (no subdomain needed, use `/badge`) | `split` |

### Banner Types (`/banner/:subdomain?type=...`)

| Type | Description | Default Theme |
|------|-------------|---------------|
| `readme` | 646px-wide README banner | `dark` |
| `profile` | 726px-wide GitHub profile banner | `gold` |

### Themes

`dark` · `gold` · `light` · `outlined` · `retro` · `split`

### Examples

```
/badge/juan
/badge/juan?type=built-by&theme=retro
/badge/juan?type=certified&format=png
/badge?type=pinoy-made&theme=split
/banner/juan?type=readme&theme=dark
/banner/juan?type=profile&theme=gold&format=webp
```

## Scripts

```bash
pnpm dev           # start local dev server
pnpm test          # run unit tests
pnpm typecheck     # TypeScript check
pnpm deploy        # deploy to Cloudflare Workers
pnpm generate:font # regenerate the embedded Press Start 2P + IBM Plex Mono font constants
```

## Architecture

- **Hono** — request routing
- **`@resvg/resvg-wasm`** — SVG → PNG (WASM, bundled)
- **`@jsquash/webp`** — PNG → WebP (WASM, bundled)
- All badges are cached at the CDN edge for 1 day (`Cache-Control: public, max-age=86400`)
- Subdomain registration is verified against the Cloudflare DNS API (TXT record lookup)
- Press Start 2P and IBM Plex Mono fonts are base64-embedded in SVGs so they render correctly in GitHub READMEs
