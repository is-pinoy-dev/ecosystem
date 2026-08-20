# CLAUDE.md — packages/validate

Guidance for working in `@is-pinoy-dev/validate` specifically. See the root
`CLAUDE.md` for monorepo-wide commands and conventions.

## What this is

`@is-pinoy-dev/validate` — standalone domain validation logic, published to
npm and runnable directly via `npx @is-pinoy-dev/validate ./subdomains/juan.json`
(`bin: validate` → `dist/bin.js`). Lets a contributor validate their subdomain
PR locally before submitting, without installing the full CLI.

## Commands

```bash
pnpm --filter @is-pinoy-dev/validate build       # tsc
pnpm --filter @is-pinoy-dev/validate typecheck
pnpm --filter @is-pinoy-dev/validate lint
pnpm --filter @is-pinoy-dev/validate test
pnpm --filter @is-pinoy-dev/validate test:watch
```

## Structure

```
src/bin.ts        CLI entry point (the `validate` binary)
src/index.ts       public library exports (also used by other packages)
src/reserved.ts    reserved-subdomain list, exported separately (./reserved)
src/tests/
```

## Key notes

- Depends only on `@is-pinoy-dev/schemas` — keep it that way. This package is
  meant to be a lightweight, dependency-light validator; don't pull in
  `registry` or Cloudflare-aware code here even for convenience.
- Both `web` and `dashboard` import from this package directly for
  client-facing validation — a behavior change here (e.g. what counts as a
  reserved subdomain) affects form validation in those apps immediately, not
  just the standalone CLI.
- Supported record types are `A`, `CNAME`, `TXT` — keep the README's format
  example and `src/reserved.ts` in sync with `@is-pinoy-dev/schemas`.
