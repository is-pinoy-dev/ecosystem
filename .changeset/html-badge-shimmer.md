---
"@is-pinoy-dev/badge-kit": minor
---

Add the interactive `<is-pinoy-badge>` HTML web component, served at `GET /badge.js`. It renders the badge into Shadow DOM (so host-page CSS can't bleed in) and adds two effects over the static SVG badge: an "ID card" 3D tilt that rotates toward the cursor with a pointer-tracking glare, and a configurable shimmer sweep (`off` / `sweep` / `loop` / `always`). Both degrade gracefully under `prefers-reduced-motion`. Docs and README document the component attributes.
