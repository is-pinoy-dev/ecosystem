# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**is-pinoy.dev** — free subdomain service for Filipino developers. Packages expose a CLI + registry that manages DNS records via Cloudflare. The web app and docs site present the public interface using the Banig Grid v2 design system (see `DESIGN.md`).

This file covers monorepo-wide conventions. Each app and package under
`apps/` and `packages/` also has its own `CLAUDE.md` with directory-specific
commands, structure, and gotchas — read it alongside this one when working
inside that directory; it doesn't repeat what's already covered here.

## Common Commands

```bash
# Install
pnpm install

# Develop (all apps and packages)
pnpm dev

# Build everything (respects dependency order via Turborepo)
pnpm build

# Type check / lint / format
pnpm typecheck
pnpm lint
pnpm format

# Tests (cli, registry, validate, badge-kit, web, dashboard, portfolio have tests)
pnpm test

# Single package
pnpm --filter @is-pinoy-dev/cli test
pnpm --filter @is-pinoy-dev/registry test

# Single test file
pnpm --filter @is-pinoy-dev/cli test -- validate.test.ts

# Watch mode
pnpm --filter @is-pinoy-dev/cli test:watch
```

## Architecture

**Monorepo:** pnpm workspaces + Turborepo. Package manager: pnpm 10.

```
apps/
  web/          Next.js 16 public website (depends on @is-pinoy-dev/ui)
  docs/         Fumadocs MDX documentation site
  dashboard/    Next.js dashboard app
  portfolio/    Next.js portfolio app
packages/
  cli/          @is-pinoy-dev/cli — Commander.js CLI (validate, diff, sync commands)
  registry/     @is-pinoy-dev/registry — Core DNS registry logic; Cloudflare provider
  schemas/      @is-pinoy-dev/schemas — Zod schemas; `generate:schema` script produces JSON Schema
  validate/     @is-pinoy-dev/validate — Domain validation logic (published package)
  status/       @is-pinoy-dev/status — Shared subdomain status types
  badge-kit/    @is-pinoy-dev/badge-kit — Badge rendering
  ui/           @is-pinoy-dev/ui — shadcn/ui + Radix UI component library
  eslint-config/ @workspace/eslint-config — shared ESLint rules
  typescript-config/ @workspace/typescript-config — shared tsconfig bases
tools/          Cloudflare Workers (React Router 7 + Vite), deployed separately — not published
  site-audit/   SEO + Open Graph auditing, served at /_tools/site-audit
  og/           Per-subdomain Open Graph image generator, served at /_tools/og
  status/       Uptime/DNS/SSL status site backed by D1, served at status.is-pinoy.dev
  analytics/    Analytics worker
  portfolio-proxy/ Fronts hosted portfolios; one route per claimed subdomain,
                created by registry sync. Not a React Router app — a single module.
```

**Tools:** each is a React Router 7 SSR app running on a Cloudflare Worker. The
whole `react-router` family (`react-router` plus `@react-router/{dev,node,serve,cloudflare}`)
**must stay on the same version** — a lone `react-router` bump breaks
`getLoadContext`/`AppLoadContext` and the dev server.

**Dependency chain:** `cli` → `registry` → `schemas` + `validate` → `schemas`

**Build:** `cli` is bundled with `tsup` (ESM, Node22 target). Other packages use `tsc`. Turbo handles build ordering via `"dependsOn": ["^build"]`.

**Environment variables required for build:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` (declared in `turbo.json`).

**pnpm catalog:** Shared dependency versions are pinned in `pnpm-workspace.yaml` under the `catalog:` key. Add new shared deps there rather than per-package.

**CLI → Registry pattern:** CLI commands call `import("@is-pinoy-dev/registry")` dynamically at runtime. The registry owns all Cloudflare API interaction; the CLI handles I/O, confirmation prompts, and output formatting.

**CI custom action:** `.github/actions/registry-validate/` runs on PRs that touch subdomain JSON files. It validates records against schemas and posts a comment summary. All packages are published to npm with `access: public` via Changesets on merge to `main`.

## Key Tech

- **Runtime/target:** Node 22, TypeScript 5.9, ESM
- **Apps:** Next.js 16 App Router, React 19, Tailwind CSS v4 (PostCSS via `@tailwindcss/postcss`)
- **Docs:** Fumadocs 16 (patched in `patches/fumadocs-ui@16.9.1.patch`)
- **Tests:** Vitest 3, Node environment, pattern `src/tests/**/*.test.ts`
- **Releases:** Changesets — CI publishes on merge to `main` via `.github/workflows/publish-cli.yml`

## Design System

The UI follows the **Banig Grid v2** system — a calm, precise, light-first
direction for Filipino developer infrastructure. `DESIGN.md` is the source of
truth; the highlights:

- **Light-first.** Warm canvas `#FDFCFA` with navy `#0B1F44` text. Dark mode is
  an optional accessibility preference, not the default presentation — never
  hardcode `class="dark"` on `<html>`.
- **Color roles.** Yellow `#F5C800` is brand and primary action. Blue `#175CD3`
  supports links, focus, and eyebrows — it never leads. Green, red, and orange
  are semantic only (`success`, `destructive`, `warning`), never decorative.
- **Type.** **IBM Plex Sans** for headings and body; **IBM Plex Mono** for
  domains, code, metadata, and uppercase eyebrows (12px, `0.12em` tracking).
  Body copy is 16px minimum. **Press Start 2P is retired from interface text.**
- **Shape.** Border radius stays `0`, but borders are **1px** — no 2–3px
  borders, and **no pixel-offset or blurred shadows**. Group with white
  surfaces, subtle tints, and rules. Don't nest cards.
- **Layout.** Prefer ruled rows, rules, and whitespace over card grids. Cards
  are for standalone objects only. Container maxes at `1180px`.
- **Motion.** The GIF banners (`banner.gif`, `docs-banner.gif`) are the brand
  motion and must be preserved. No scanlines, flicker, glow-pulse, or
  arcade-style movement. Transitions are 120–180ms on color/border/opacity.

Tokens live in `packages/ui/src/styles/globals.css` and drive Tailwind v4 CSS
variables; component variants live in `packages/ui`.

## Component Rules

**Always prefer `@is-pinoy-dev/ui` (shadcn) components** over native HTML tags. Use `Button`, `Card`, `Badge`, etc. from `packages/ui` instead of `<button>`, `<div>`, `<span>`. Fall back to a native tag only when no shadcn component exists for the use case.

**In `apps/docs`, always use the Fumadocs `TypeTable` component** to display type/props tables. Import it from `fumadocs-ui/components/type-table`. Never use a plain markdown table or custom HTML table for type documentation.

## Styling Rules

**Always prefer Tailwind CSS utility classes** over inline styles (`style={{...}}`) or native CSS classes in `globals.css`. Use inline styles or globals only when a utility class is not available (e.g., complex `clamp()` expressions, dynamic values that depend on runtime state, or CSS animations/keyframes).

**Within Tailwind, prefer shadcn CSS variable tokens** over arbitrary values or raw color literals. Use semantic utilities like `text-primary`, `bg-background`, `border-border`, `text-muted-foreground` rather than `text-[#F5C800]` or `bg-[var(--color-gold)]`. Only use arbitrary values when no token maps to the required value.

Priority order:

1. **shadcn/ui components from `@is-pinoy-dev/ui`** — default choice for all UI elements
2. **Tailwind utility classes with shadcn CSS variable tokens** — e.g., `text-primary`, `bg-card`
3. **Tailwind utility classes with static scale values** — e.g., `text-sm`, `p-4`
4. **Inline `style={{}}`** — only for dynamic/runtime values (e.g., a color derived from a prop)
5. **`globals.css`** — only for keyframe animations or styles that cannot be expressed in Tailwind

## Commits & PRs

Conventional commit style: `feat:`, `fix:`, `chore:`, etc. Before opening a PR run `pnpm typecheck && pnpm lint && pnpm test`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
