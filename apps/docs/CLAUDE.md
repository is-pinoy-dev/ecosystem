# CLAUDE.md — apps/docs

Guidance for working in the `docs` app specifically. See the root `CLAUDE.md`
for monorepo-wide commands, the Banig Grid v2 design system, and
component/styling rules — all of it applies here.

## What this is

The is-pinoy.dev documentation site, built on Fumadocs 16 (patched — see
`patches/fumadocs-ui@16.9.1.patch` at the repo root) over Next.js App Router.

## Commands

```bash
pnpm --filter docs dev          # http://localhost:3000
pnpm --filter docs build
pnpm --filter docs types:check  # fumadocs-mdx && next typegen && tsc --noEmit
```

`postinstall` runs `fumadocs-mdx` automatically — don't skip installs with
`--ignore-scripts` in this app or the generated MDX types go stale.

## Structure

```
content/docs/            MDX documentation content
src/app/(docs)/          docs layout + [[...slug]] catch-all route
src/app/api/search/      Fumadocs search route handler
src/app/api/chat/        AI search backend (@ai-sdk/react + @openrouter/ai-sdk-provider)
src/app/llms.txt, llms-full.txt, llms.mdx   machine-readable doc exports for LLMs
src/components/          docs-specific components (badge preview, interactive badge, mdx)
src/lib/source.ts        Fumadocs content source adapter — loader()
src/lib/layout.shared.tsx shared layout options across route groups
source.config.ts         Fumadocs MDX config (frontmatter schema, etc.)
```

## Key notes

- **Always use Fumadocs' `TypeTable`** (`fumadocs-ui/components/type-table`)
  for type/props documentation — never a plain markdown or HTML table. This is
  a hard rule from the root CLAUDE.md, most relevant to this app of all of
  them.
- The whole `react-router` family constraint from the root CLAUDE.md doesn't
  apply here — `docs` is Next.js, not one of the `tools/*` Workers.
- `fumadocs-ui` is patched via pnpm patches; if upgrading it, check whether the
  patch in `patches/fumadocs-ui@16.9.1.patch` still applies or needs
  regenerating.
- The interactive badge/subdomain components in `src/components` call the live
  `badges.is-pinoy.dev` service (see `packages/badge-kit`) — keep query-param
  usage there in sync with that package's README if either changes.
