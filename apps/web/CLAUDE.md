# CLAUDE.md — apps/web

Guidance for working in the `web` app specifically. See the root `CLAUDE.md`
for monorepo-wide commands, the Banig Grid v2 design system, and component/
styling rules — all of it applies here.

## What this is

The public is-pinoy.dev marketing site: Next.js 16 App Router, React 19. Shows
the landing page, subdomain showcase, and static legal pages (privacy, ToS via
MDX).

## Commands

```bash
pnpm --filter web dev         # http://localhost:3000
pnpm --filter web build
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web test        # vitest run
```

## Structure

```
app/
  page.tsx            landing page
  showcase/           subdomain showcase (loading.tsx = streaming skeleton)
  privacy/, tos/       MDX-driven legal pages (page.mdx + layout.tsx)
  api/subdomains/      route handler backing the showcase
  robots.ts, sitemap.ts, manifest.ts, opengraph-image.tsx   Next metadata routes
  .well-known/vercel/  Vercel flags toolbar verification
components/, hooks/, lib/
```

## Key notes

- Depends on `@is-pinoy-dev/status`, `@is-pinoy-dev/ui`, `@is-pinoy-dev/validate` as
  workspace packages — changes there require a rebuild of those packages to
  show up here (`pnpm --filter <pkg> build`, or just run `pnpm dev` at the
  root so Turborepo watches the whole chain).
- Feature flags via `flags` / `@flags-sdk/vercel` — see `lib/flags*` for how
  flags gate features; flags are managed in the Vercel dashboard, not in this
  repo.
- Uses MDX (`@next/mdx`) for the two legal pages only — don't reach for MDX
  elsewhere in this app without a reason.
- Follow the root CLAUDE.md component/styling priority order: `@is-pinoy-dev/ui`
  components first, then Tailwind + shadcn tokens, before any inline style or
  raw color literal.
