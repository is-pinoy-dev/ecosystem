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
| `http://localhost:8787/` | Welcome text |
| `http://localhost:8787/powered-by` | "Powered by is-pinoy.dev" badge |
| `http://localhost:8787/filipino-dev` | Filipino Dev badge |
| `http://localhost:8787/banner/:subdomain` | Wide banner for a subdomain |
| `http://localhost:8787/:subdomain/badge` | Dynamic badge — active or "not found" state |

### Query Parameters

| Param | Values | Default |
|-------|--------|---------|
| `variant` | `default`, `outline`, `flat`, `pixel` | `default` (badges), `pixel` (presets) |
| `format` | `svg`, `png`, `webp` | `svg` |

### Examples

```
/powered-by?variant=flat
/filipino-dev?variant=pixel
/banner/juan
/juan/badge?variant=pixel
/juan/badge?format=png
/juan/badge?variant=outline&format=webp
```

## Scripts

```bash
pnpm dev           # start local dev server
pnpm test          # run unit tests
pnpm typecheck     # TypeScript check
pnpm deploy        # deploy to Cloudflare Workers
pnpm generate:font # regenerate the embedded Press Start 2P font constant
```

## Architecture

- **Hono** — request routing
- **`@resvg/resvg-wasm`** — SVG → PNG (WASM, bundled)
- **`@jsquash/webp`** — PNG → WebP (WASM, bundled)
- All badges are cached at the CDN edge for 1 day (`Cache-Control: public, max-age=86400`)
- Subdomain registration is verified against the Cloudflare DNS API (TXT record lookup)
- Press Start 2P font is base64-embedded in SVGs so they render correctly in GitHub READMEs
