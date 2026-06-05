# @is-pinoy-dev/badge-kit

## 0.3.0

### Minor Changes

- e426ebe: Add the interactive `<is-pinoy-badge>` HTML web component, served at `GET /badge.js`. It renders the badge into Shadow DOM (so host-page CSS can't bleed in) and adds two effects over the static SVG badge: an "ID card" 3D tilt that rotates toward the cursor with a pointer-tracking glare, and a configurable shimmer sweep (`off` / `sweep` / `loop` / `always`). Both degrade gracefully under `prefers-reduced-motion`. Docs and README document the component attributes.

## 0.2.0

### Minor Changes

- 66d501c: Introduce badge-kit — a Cloudflare Worker that generates SVG/PNG/WebP badges and banners for is-pinoy.dev subdomains. Includes 8 badge types, pixel sun design, IBM Plex Mono eyebrows, CRT scanline banner, registry subdomain verification, and WASM-based raster rendering. Docs site adds badge-kit reference and preview components.
