---
version: 2.0
name: is-pinoy.dev
direction: Banig Grid
description: >
  A calm, precise, light-first design system for Filipino developer
  infrastructure. Yellow remains the signature brand color, navy provides
  structure and trust, and blue supports links and technical information.
---

# is-pinoy.dev Design System

## Product character

is-pinoy.dev should feel like dependable open-source infrastructure built with
Filipino warmth. The interface is clean, direct, and technical without becoming
generic SaaS. Filipino identity comes through the existing animated brand
banners, the yellow signature color, community language, and a quiet grid rhythm
inspired by banig weaving.

The existing GIF banners are the brand anchors:

- `apps/web/public/banner.gif` for the public website
- `apps/docs/public/docs-banner.gif` for documentation

Do not replace either banner with a newly drawn wordmark. Decorative sun or grid
motifs may support the identity but must never compete with the GIF banners.

## Principles

1. **The task comes first.** The availability checker, documentation, and
   registration path must be immediately understandable.
2. **Yellow means brand and action.** It marks primary CTAs, active steps, and
   small moments of recognition.
3. **Blue supports; it does not lead.** Use blue for links, focus, external
   navigation, and informational UI.
4. **Structure before decoration.** Create hierarchy with typography, spacing,
   alignment, and rules before adding surfaces.
5. **Filipino, not tourist-facing.** Avoid literal flags, maps, jeepneys,
   festival decoration, bamboo fonts, and visual clichés.
6. **One shared system.** Shared UI belongs in `@is-pinoy-dev/ui`; applications
   should not recreate primitives locally.

## Color

### Light theme

| Token              | Value     | Role                             |
| ------------------ | --------- | -------------------------------- |
| `background`       | `#FAF9F5` | Warm page canvas                 |
| `foreground`       | `#0B1F44` | Primary navy text                |
| `card`             | `#FFFFFF` | Raised or grouped content        |
| `primary`          | `#F5C800` | Brand and primary action         |
| `primary-dark`     | `#D4A800` | Primary hover border/detail      |
| `primary-light`    | `#FFE566` | Primary hover fill               |
| `secondary`        | `#EDF2FB` | Quiet blue-tinted surface        |
| `accent`           | `#175CD3` | Links, focus, secondary actions  |
| `muted`            | `#F2F0E9` | Subtle grouped surface           |
| `muted-foreground` | `#667085` | Secondary copy                   |
| `border`           | `#DED9CD` | Rules and container boundaries   |
| `success`          | `#168253` | Available and operational states |
| `destructive`      | `#D92D20` | Error and abuse-report states    |
| `warning`          | `#B54708` | Warnings requiring attention     |
| `code-bg`          | `#0D172A` | Dark code surface                |

### Usage rules

- Primary buttons use yellow with navy text.
- Links use blue and retain an underline on hover or within long-form content.
- Green is semantic only. Do not use it decoratively.
- Red is semantic only. Do not use it for general emphasis.
- Warm white is the default page background. Pure white is reserved for grouped
  surfaces where separation is needed.
- The dark theme is supported as an optional accessibility preference, not the
  default brand presentation.

## Typography

Use the existing IBM Plex families. The redesign does not introduce another
font dependency.

### IBM Plex Sans

- Display, headings, navigation, buttons, labels, and body copy
- Weights: 400, 500, 600, and 700
- Headings use compact tracking between `-0.02em` and `-0.04em`
- Body copy uses a minimum 16px size and 1.65–1.75 line height

### IBM Plex Mono

- Domain names, code, keyboard shortcuts, metadata, status labels, and section
  eyebrows
- Do not use for long paragraphs
- Uppercase eyebrows use 11–12px with `0.12em` tracking

Press Start 2P is retired from interface text. The animated GIF banners preserve
the original pixel personality without reducing readability.

## Type scale

| Role          | Desktop   | Mobile    | Weight  |
| ------------- | --------- | --------- | ------- |
| Hero          | 56–64px   | 40–44px   | 600     |
| Page title    | 44–52px   | 36–40px   | 600     |
| Section title | 32–40px   | 28–32px   | 600     |
| Subsection    | 22–26px   | 20–22px   | 600     |
| Body          | 16px      | 16px      | 400     |
| Small         | 14px      | 14px      | 400–500 |
| Eyebrow       | 12px mono | 11px mono | 600     |

## Spacing and layout

The spacing system remains based on 4px increments:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`

- Standard content container: `1180px`
- Documentation article measure: `720px`
- Page gutters: `40px` desktop, `32px` tablet, `20px` mobile
- Section padding: `80–96px` desktop, `56–64px` mobile
- Minimum interactive target: `44 × 44px`

The Banig Grid idea is expressed through repeated alignment, crossing rules,
alternating column spans, and occasional linework. Do not render a loud woven
pattern behind text.

## Shape and depth

- Border radius remains `0`. Square geometry is a distinctive brand trait and
  works with the new technical direction.
- Default borders are 1px.
- Avoid 2–3px borders except for a deliberate brand marker.
- Remove hard pixel-offset shadows and blurred decorative shadows.
- Use white surfaces, subtle tints, and rules to group information.
- Do not place cards inside cards.

## Motion

- The GIF banners are the primary brand motion.
- Avoid scanlines, flicker, stamp, glow-pulse, and arcade-style movement.
- Interface transitions should be 120–180ms and limited to color, border, or
  small opacity changes.
- Respect `prefers-reduced-motion`; provide static image fallbacks where a GIF
  would materially distract or impair comprehension.

## Components

All shared primitives live in `packages/ui` and are imported from
`@is-pinoy-dev/ui/components/*`.

### Button

- `default`: yellow primary action
- `secondary`: quiet blue-tinted supporting action
- `outline`: neutral outlined action
- `ghost`: low-emphasis utility action
- `destructive`: report, remove, or error recovery
- `link`: blue text action

`default-shadow` and `outline-shadow` remain compatibility aliases during the
application migration but must not reintroduce pixel shadows.

### Input and InputGroup

- Minimum height 40px; primary marketing forms use 48px or larger
- Focus uses the blue ring token
- Error uses destructive red
- `InputGroup` joins domain input, suffix, and action without gaps
- Domain strings use IBM Plex Mono

### Card

- Use only for standalone objects such as a portfolio preview
- White background and 1px border
- No default shadow
- Lists and workflows should use ruled rows instead

### Badge

- Small metadata or status labels only
- Mono typography
- Avoid using badges as decoration

### SectionHeader

The standard section hierarchy is eyebrow, title, then optional description.
Eyebrows are blue mono text; titles are navy sans text.

### StatusIndicator

- `success`: operational or available
- `warning`: needs attention
- `destructive`: failed or unsafe
- `brand`: highlighted but not semantic

## Public website

- Keep the availability checker above the fold.
- The navigation uses `banner.gif` and one yellow primary CTA.
- Recently claimed domains form one calm status row, not a constantly moving
  two-line marquee.
- Registration steps are ruled rows, not individual feature cards.
- Provider support is a simple compatibility row.
- Community safety is a compact trust band.
- Showcase previews may use cards because each preview is a standalone object.

## Documentation

- Keep `docs-banner.gif` in the sidebar header.
- Use a three-column documentation layout: navigation, article, table of
  contents.
- Article content is the strongest visual layer.
- Active navigation uses a yellow rule or pale-yellow surface.
- Links and anchors use blue.
- Notes use a narrow yellow rule and a quiet warm surface.
- Code blocks remain dark for legibility and syntax contrast.
- Previous/next links use bordered rows rather than elevated cards.

## Accessibility

- Meet WCAG AA contrast for text and interactive controls.
- Do not rely on color alone for status.
- Preserve visible focus indicators.
- Support keyboard operation for navigation, search, and checker interactions.
- Maintain 16px body text and comfortable reading widths.
- Respect reduced motion and browser zoom up to 200%.
- Use semantic headings in sequence and real form labels.

## Do

- Reuse shared package primitives.
- Keep yellow memorable by using it selectively.
- Use blue for links and focus.
- Keep GIF banners visible and free from competing motion.
- Prefer rows, rules, and whitespace over card grids.
- Use Lucide for interface icons unless an official provider logo is required.

## Do not

- Do not restore CRT scanlines, pixel grids, glow flicker, or arcade shadows.
- Do not use Press Start 2P for interface text.
- Do not make blue the primary brand color.
- Do not round components.
- Do not add gradients or glassmorphism.
- Do not create app-local copies of shared shadcn primitives.
- Do not replace either GIF banner with a new logo.
