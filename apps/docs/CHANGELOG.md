# docs

## 0.1.0

### Minor Changes

- 66d501c: Introduce badge-kit — a Cloudflare Worker that generates SVG/PNG/WebP badges and banners for is-pinoy.dev subdomains. Includes 8 badge types, pixel sun design, IBM Plex Mono eyebrows, CRT scanline banner, registry subdomain verification, and WASM-based raster rendering. Docs site adds badge-kit reference and preview components.

### Patch Changes

- 66d501c: Fix SEO and metadata: replace Organization JSON-LD schema with WebSite, add viewport export with gold theme colour, add keywords/category/creator, update PWA manifest (name, start_url, icon purposes), use baseUrl constant throughout, enhance TechArticle schema with author/publisher, explicit OG metadata, and custom branded OG image.
- 66d501c: Reorganize docs sidebar into dropdown tabs — Guides, Built-in Tools, and Badge Kit sections for cleaner navigation.
- 66d501c: Fix sidebar tab icons on mobile — wrap in a flex centering container so icons render at a consistent 20px size instead of stretching to fill the 36px mobile container.
