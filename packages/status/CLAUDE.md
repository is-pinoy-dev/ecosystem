# CLAUDE.md — packages/status

Guidance for working in `@is-pinoy-dev/status` specifically. See the root
`CLAUDE.md` for monorepo-wide commands and conventions.

## What this is

`@is-pinoy-dev/status` — shared subdomain status types (and a checker),
published to npm. The common vocabulary between `apps/web` (which shows
status on the showcase) and `tools/status` (the uptime/DNS/SSL checker Worker
backed by D1 at `status.is-pinoy.dev`).

## Commands

```bash
pnpm --filter @is-pinoy-dev/status build       # tsc
pnpm --filter @is-pinoy-dev/status typecheck
```

No lint/test scripts at this package — it's intentionally small (three files
in `src/`).

## Structure

```
src/types.ts      shared status type definitions
src/checker.ts     status-checking logic shared with tools/status
src/index.ts       public exports
```

## Key notes

- Keep this package free of Cloudflare Workers-specific APIs even though its
  main consumer (`tools/status`) is a Worker — `apps/web` imports it in a
  plain Next.js/Node context, so anything added here must run in both.
- If you change a status type here, check both `apps/web` (display) and
  `tools/status` (the source of truth for what the type represents) for
  matching updates.
