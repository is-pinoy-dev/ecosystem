# Design QA — landing showcase bento grid

## Evidence

- Selected source visual: `C:\Users\Work\.codex\generated_images\01a00399-e538-7f71-80c5-b3de542b85fb\exec-772f076b-dd0c-43b2-86e8-a9349e848a55.png`
- Source dimensions: 1600 × 1000 px.
- Desktop implementation capture: `C:\Users\Work\.codex\generated_images\01a00399-e538-7f71-80c5-b3de542b85fb\showcase-bento-implementation-desktop.png`
- Desktop viewport: 1440 × 1000 CSS px, DPR 1, light theme.
- Mobile implementation capture: `C:\Users\Work\.codex\generated_images\01a00399-e538-7f71-80c5-b3de542b85fb\showcase-bento-implementation-mobile.png`
- Mobile viewport: requested at 390 px wide; the visible content capture is 375 × 1800 px because of the browser scrollbar, DPR 1.
- Tested state: three real weekly showcase entries. Local visual QA used the public preview-image origin because the local development server does not expose the production image worker. Visit counts were unavailable without the optional local analytics token; their conditional layout is covered by component tests.

## Full-view comparison evidence

- Combined source and implementation comparison: `C:\Users\Work\.codex\generated_images\01a00399-e538-7f71-80c5-b3de542b85fb\showcase-bento-comparison.png`
- The source was normalized to 1200 × 750 px and the implementation to 1080 × 750 px, preserving each image's aspect ratio.
- The implementation retains the selected direction's hierarchy: editorial heading and CTA above a dominant left feature, with two stacked supporting cards on the right.

## Focused region comparison evidence

- Focused bento comparison: `C:\Users\Work\.codex\generated_images\01a00399-e538-7f71-80c5-b3de542b85fb\showcase-bento-focused-comparison.png`
- The featured-card scale, supporting-card proportions, metadata rail, card borders, spacing, and directional affordances were compared side by side.
- The source uses illustrative project names and descriptions. The implementation intentionally renders the real registry metadata and real project previews available to the product.

## Findings

No actionable P0, P1, or P2 issues remain after the second visual comparison pass.

## Required fidelity surfaces

- Typography: the title now wraps at the same editorial cadence as the source while using the site's existing display styles.
- Layout rhythm: the desktop bento uses a 1.6:1 split with the feature spanning both supporting rows; the grid stacks cleanly on smaller screens.
- Colors and tokens: the implementation uses the existing yellow, navy, border, foreground, and muted design tokens rather than introducing isolated values.
- Image fidelity: real project previews preserve their 1200:630 ratio when stacked and use a full-height crop within desktop bento cells.
- Content fidelity: real subdomains, GitHub owners, project kinds, and optional visits replace the source's illustrative copy.
- Responsive behavior: the 375 px content viewport has no horizontal overflow, and all three cards remain legible and tappable.

## Primary interactions tested

- The “View the full showcase” CTA navigates to `/showcase`, where the “Work worth sharing” heading is present.
- All three project cards expose external links that open in a new tab.
- The light-theme default state and mobile stacked layout were captured and compared.
- Component tests cover weekly rotation, preview filtering, card hierarchy, project types, visit counts, and the optional local preview-image origin.

## Console errors checked

- The final local showcase view reported no browser console errors.

## Comparison history

- Pass 1: found two P2 differences — the headline wrapped later than the source, and long domains truncated too aggressively.
- Fixes: constrained the title measure and adjusted its desktop scale; split each domain into the subdomain and `.is-pinoy.dev` suffix across two readable lines.
- Pass 2: the full-view and focused comparisons showed no remaining actionable P0, P1, or P2 issues.

## Follow-up polish

- P3: if the registry later gains curated project titles and one-line descriptions, the metadata rail could surface them without changing the bento structure.

final result: passed
