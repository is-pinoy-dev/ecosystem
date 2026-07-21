# is-pinoy.dev — Badge & Banner Kit

**Component:** Embeddable badge + banner service (`badges.is-pinoy.dev`)
**Design system:** is-pinoy.dev **Banig Grid v2.0** (see the repo-root `DESIGN.md`)

> **v0.3 redesign.** The kit was rebuilt on the Banig Grid system. The earlier
> retro pixel-art look — Press Start 2P, CRT scanlines, glow-pulse, hard pixel
> shadows, the 8-ray pixel sun, the holographic tilt/shimmer web component — is
> retired. `Banners and Badges.html` is kept only as a historical mockup of that
> earlier look; it is no longer the source of truth.

---

## 1. Purpose

A badge kit for is-pinoy.dev. Any developer who has claimed a
`<handle>.is-pinoy.dev` subdomain can grab a badge or banner for their GitHub
README, profile, portfolio, or deployed site — driving recognition and
backlinks to the network. Two surfaces ship: the **SVG endpoints** (for READMEs,
where no JS runs) and the **`<is-pinoy-badge>` web component** (for HTML pages).

---

## 2. Taxonomy

Type is the semantic role; theme is the skin. Every type ships in every theme.

### Badges

| Type id | Renders | Handle? | Default theme |
|---|---|---|---|
| `subdomain` (a.k.a. `deployed-on`) | eyebrow label over `handle`**.is-pinoy.dev** | required | `light` |
| `member` | `is-pinoy.dev` │ `handle` inline chip | required | `light` |
| `pinoy-made` | `PINOY-MADE` origin stamp | none | `light` |
| `certified` | `CERTIFIED` over `PINOY DEV` | none | `gold` |

### Banners

| Type id | Size | Handle? | Default theme |
|---|---|---|---|
| `readme` | 640 × 96 | required | `light` |
| `profile` | 720 × 140 | required | `gold` |

The `subdomain` and `member` badges verify the handle against the registry and
fall back to a neutral **not found** state (never a broken image).

---

## 3. Themes

Four skins, resolved from the Banig Grid tokens. Each is one flat surface, a 1px
border, and one navy/gold brand mark — no gradients, no shadows.

| Theme | Surface | Text | Mark cell | Reads best on |
|---|---|---|---|---|
| `light` | `#FFFFFF` white | navy `#0B1F44` | navy cell, gold glyph | light READMEs (default) |
| `dark` | navy `#0B1F44` | warm white `#FAF9F5` | gold cell, navy glyph | dark READMEs |
| `gold` | gold `#F5C800` | navy `#0B1F44` | navy cell, gold glyph | a bold accent |
| `outlined` | transparent | gold `#F5C800` | gold glyph, no fill | any background |

---

## 4. Design system grounding

Every value comes from the root `DESIGN.md`. Do not invent colors, type, or radii.

**Color** — navy `#0B1F44` (structure/text), warm white `#FAF9F5` (text on
navy), white `#FFFFFF` (light surface), gold `#F5C800` primary, gold-dark
`#D4A800`, muted `#667085` (`#9DABC6` on navy, `#7A6600` on gold), border
`#DED9CD` (`#24365F` on navy), not-found `#98A2B3`. Gold appears **only** as the
brand mark — a moment of recognition — never as decoration.

**Type** — **IBM Plex Mono only**, base64-embedded so it renders through
GitHub's camo proxy. Eyebrows are 10–11px uppercase with `0.12em` tracking and
muted; values are 13–24px in the text color. Weight contrast is avoided (a
single embedded weight rasterizes identically in SVG and PNG); hierarchy comes
from size and color. Glyph widths are pinned with `textLength` so browser and
resvg layouts match.

**Shape** — `border-radius: 0` everywhere. Borders are 1px. No pixel shadows.

**Mark** — the brand mark is a five-square "plus": a sun reduced to axis-aligned
squares, scaled to fill the square mark cell. No icon library, no emoji.

**Motion** (web component only) — a single 140ms border/opacity hover. No tilt,
glare, shimmer, scanline, or glow. Honors `prefers-reduced-motion`.

---

## 5. Embed APIs

### 5a. SVG endpoint (GitHub READMEs)

```
https://badges.is-pinoy.dev/badge/<handle>?type=subdomain|member&theme=<theme>&format=svg|png|webp
https://badges.is-pinoy.dev/badge?type=pinoy-made|certified&theme=<theme>
https://badges.is-pinoy.dev/banner/<handle>?type=readme|profile&theme=<theme>
```

Markdown pattern:

```md
[![Deployed on is-pinoy.dev](https://badges.is-pinoy.dev/badge/juan?type=subdomain)](https://juan.is-pinoy.dev)
```

- `?theme=` selects the skin; invalid/omitted falls back to the type default.
- `?preview=true` bypasses the registry check (used by the showcase gallery).
- Cached at the edge for one day (see `lib/cache.ts`).

### 5b. Web component (HTML pages)

```html
<script src="https://badges.is-pinoy.dev/badge.js"></script>
<is-pinoy-badge handle="juan" type="deployed-on" theme="light"></is-pinoy-badge>
```

Renders into Shadow DOM (host CSS can't bleed in), mirrors the SVG exactly, and
adds only the quiet hover. Attributes: `handle` (omit for `pinoy-made`), `type`,
`theme`, `label` (custom eyebrow for `subdomain`).

---

## 6. Acceptance checklist

- [x] All types render in all four themes.
- [x] `border-radius: 0` holds everywhere; no rounded corners.
- [x] No Press Start 2P, no scanlines, no glow, no pixel shadows, no tilt/shimmer.
- [x] SVGs embed IBM Plex Mono and render through GitHub's camo proxy.
- [x] Web component is Shadow-DOM isolated and survives hostile host CSS.
- [x] Handle sanitizes to `[a-z0-9-]`; interpolated text is escaped.
- [x] `subdomain`/`member` show a neutral not-found state, never a broken image.
