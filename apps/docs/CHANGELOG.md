# docs

## 0.2.0

### Minor Changes

- 38477b9: Badge Kit docs UX improvements and general polish.
  - **Badge embed tabs**: replaced custom tab/code UI in `BadgeThemes` with Fumadocs `Tabs`/`Tab` + `CodeBlock`/`Pre`, matching the rest of the docs and adding a copy button to embed code
  - **Subdomain banner**: added `SubdomainBanner` at the top of the Badge Kit page so users can set their subdomain once and see all previews and embed URLs update live
  - **Reference examples**: reorganised the flat examples code block into per-type tabs (Subdomain badge, Member badge, Platform badges, Banners) with one URL per tab and a description title, so the copy button captures only the link
  - **Sidebar search bar border**: added retro pixel-art border (`3px solid var(--border)` + `4px 4px 0 var(--primary-dark)` shadow) to the desktop sidebar search bar, consistent with other bordered elements
  - **"Workflow" renamed to "Steps"**: sidebar section and cross-links updated to use friendlier language
  - **robots.txt**: added `Allow: /` for all crawlers

## 0.1.0

### Minor Changes

- 66d501c: Introduce badge-kit — a Cloudflare Worker that generates SVG/PNG/WebP badges and banners for is-pinoy.dev subdomains. Includes 8 badge types, pixel sun design, IBM Plex Mono eyebrows, CRT scanline banner, registry subdomain verification, and WASM-based raster rendering. Docs site adds badge-kit reference and preview components.

### Patch Changes

- 66d501c: Fix SEO and metadata: replace Organization JSON-LD schema with WebSite, add viewport export with gold theme colour, add keywords/category/creator, update PWA manifest (name, start_url, icon purposes), use baseUrl constant throughout, enhance TechArticle schema with author/publisher, explicit OG metadata, and custom branded OG image.
- 66d501c: Reorganize docs sidebar into dropdown tabs — Guides, Built-in Tools, and Badge Kit sections for cleaner navigation.
- 66d501c: Fix sidebar tab icons on mobile — wrap in a flex centering container so icons render at a consistent 20px size instead of stretching to fill the 36px mobile container.
