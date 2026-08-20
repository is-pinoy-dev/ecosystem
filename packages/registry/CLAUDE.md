# CLAUDE.md — packages/registry

Guidance for working in `@is-pinoy-dev/registry` specifically. See the root
`CLAUDE.md` for monorepo-wide commands and conventions.

## What this is

`@is-pinoy-dev/registry` — the core DNS registry logic and Cloudflare
provider. Private (not published to npm); consumed as a workspace dependency
by `packages/cli` and `apps/dashboard`.

## Commands

```bash
pnpm --filter @is-pinoy-dev/registry build       # tsc
pnpm --filter @is-pinoy-dev/registry typecheck
pnpm --filter @is-pinoy-dev/registry lint
pnpm --filter @is-pinoy-dev/registry test
pnpm --filter @is-pinoy-dev/registry test:watch
```

## Structure

```
src/core/
  loader.ts     reads subdomain JSON files from a directory
  validate.ts   validates them against @is-pinoy-dev/schemas
  normalize.ts  normalizes parsed records before diff/sync
  diff.ts       computes the delta between local files and live Cloudflare DNS
  sync.ts       applies the diff to Cloudflare
  routes.ts     Workers Routes reconciliation (portfolio-proxy)
  vercel.ts     Vercel-side integration helpers
  env.ts        environment/config loading (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID)
src/index.ts    public exports
```

## Key notes

- This package owns **all** Cloudflare API interaction (DNS records + Workers
  Routes). Callers (`cli`, `dashboard`) never talk to Cloudflare directly —
  keep it that way.
- Depends on `@is-pinoy-dev/schemas` and `@is-pinoy-dev/validate` — a schema
  change there should be paired with an update here and covered by
  `src/tests/domain-schema.test.ts`.
- `routes.ts` reconciles Workers Routes for claimed portfolio subdomains; a
  sync that omits or misconfigures `PORTFOLIO_WORKER` skips route
  reconciliation entirely (deliberately, to avoid tearing down routes from an
  older environment) — don't "fix" that by making it fail loudly without
  checking why it was designed that way.
- Every `src/core/*.ts` file has a matching test in `src/tests/` — add one for
  any new core module rather than folding logic into an existing file's test.
