# CLAUDE.md — packages/ui

Guidance for working in `@is-pinoy-dev/ui` specifically. See the root
`CLAUDE.md` for the Banig Grid v2 design system and component/styling rules —
this package is where those rules are implemented, not just followed.

## What this is

`@is-pinoy-dev/ui` — the shadcn/ui + Radix UI component library shared by
`web`, `dashboard`, `portfolio`, and `docs`. Private workspace package (not
published to npm).

## Commands

```bash
pnpm --filter @is-pinoy-dev/ui typecheck
pnpm --filter @is-pinoy-dev/ui lint
```

No build step — consumers import straight from `src/` via the package's
`exports` map; no test suite (purely presentational components).

## Structure

```
src/components/    shadcn-derived components (button, card, dialog, navigation-menu, ...)
src/hooks/
src/lib/           utils.ts (cn() helper), maintenance.ts
src/fonts/         IBM Plex Sans/Mono woff2 files
src/styles/globals.css   design tokens (Tailwind v4 CSS variables) — the source of truth for color/type/spacing tokens
```

`globals.css` and per-component variants are exported individually (see
`package.json` `exports`) so consuming apps only ship what they import.

## Key notes

- Every token an app might reach for as an arbitrary Tailwind value
  (`text-[#F5C800]`) should exist here as a CSS variable first
  (`--color-...` in `globals.css`) so apps can use `text-primary` instead —
  if a consuming app needs a color/spacing value this package doesn't expose,
  add the token here rather than letting the app hardcode it.
- Border radius is `0` and borders are `1px` everywhere in this package —
  no exceptions per-component. See root `CLAUDE.md` → Design System → Shape.
- Yellow (`#F5C800`) is the only color allowed to read as "primary action";
  blue (`#175CD3`) is for links/focus/eyebrows only, never a CTA. Green/red/
  orange stay semantic (`success`/`destructive`/`warning`) — don't introduce
  them as decorative variants.
- `maintenance-page.tsx` is the shared maintenance-mode UI used by `web`,
  `dashboard`, and `portfolio` when their `MAINTENANCE_MODE` env var is set —
  keep it app-agnostic (no app-specific copy or links).
- When adding a new shadcn component, match the existing pattern in
  `src/components/` (Radix primitive + `class-variance-authority` variants +
  `cn()` from `src/lib/utils.ts`) rather than hand-rolling structure.
