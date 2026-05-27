# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**is-pinoy.dev** — free subdomain service for Filipino developers. Packages expose a CLI + registry that manages DNS records via Cloudflare. The web app and docs site present the public interface with a retro pixel-art aesthetic.

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

# Tests (only cli and registry packages have tests)
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
packages/
  cli/          @is-pinoy-dev/cli — Commander.js CLI (validate, diff, sync commands)
  registry/     @is-pinoy-dev/registry — Core DNS registry logic; Cloudflare provider
  schemas/      @is-pinoy-dev/schemas — Zod schemas; `generate:schema` script produces JSON Schema
  validate/     @is-pinoy-dev/validate — Domain validation logic (published package)
  ui/           @is-pinoy-dev/ui — shadcn/ui + Radix UI component library
  eslint-config/ @workspace/eslint-config — shared ESLint rules
  typescript-config/ @workspace/typescript-config — shared tsconfig bases
tools/
  site-audit/   Standalone React Router 7 + Vite app for Lighthouse auditing (not published)
```

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

The UI follows a strict **retro pixel-art** aesthetic (see `DESIGN.md`):
- Primary color: gold `#F5C800` on dark backgrounds
- Font: **Press Start 2P** for headings/UI; **zero border-radius everywhere** (no `rounded-*` classes)
- Borders: hard pixel borders with pixel-offset box shadows — **no blur** (e.g., `4px 4px 0px #000`, never `shadow-md`)
- Scanline overlay is a required global effect (defined in `globals.css`)
- Component variants live in `packages/ui`; Tailwind v4 CSS variables drive tokens

## Component Rules

**Always prefer `@is-pinoy-dev/ui` (shadcn) components** over native HTML tags. Use `Button`, `Card`, `Badge`, etc. from `packages/ui` instead of `<button>`, `<div>`, `<span>`. Fall back to a native tag only when no shadcn component exists for the use case.

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
