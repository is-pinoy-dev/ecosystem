# CLAUDE.md — packages/schemas

Guidance for working in `@is-pinoy-dev/schemas` specifically. See the root
`CLAUDE.md` for monorepo-wide commands and conventions.

## What this is

`@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev
subdomain files. Published to npm (`access: public`). The single source of
truth for the subdomain file shape; every other package (`registry`,
`validate`, `cli`) and the CI validation action build on top of it.

## Commands

```bash
pnpm --filter @is-pinoy-dev/schemas build             # tsc
pnpm --filter @is-pinoy-dev/schemas typecheck
pnpm --filter @is-pinoy-dev/schemas lint
pnpm --filter @is-pinoy-dev/schemas generate:schema    # tsx scripts/generate-schema.ts
```

## Structure

```
src/domain/          Zod schema definitions (domainSchema, dnsRecordSchema, ...)
src/index.ts          public exports (schemas + inferred types)
schema/v1/            generated JSON Schema output (from generate:schema)
scripts/generate-schema.ts
```

Key exports: `domainSchema`, `resolvedDomainSchema`, `ResolvedDomainsSchema`,
`dnsRecordSchema` (discriminated union of `aRecordSchema`, `aaaaRecordSchema`,
`cnameRecordSchema`, `txtRecordSchema`), and their inferred types `Domain`,
`ResolvedDomain`, `ResolvedDomains`, `DNSRecord`.

## Key notes

- **Any change to a Zod schema in `src/domain/` must be followed by
  `pnpm --filter @is-pinoy-dev/schemas generate:schema`** to regenerate
  `schema/v1/` — the generated JSON Schema is what the CI
  `registry-validate` action and external tooling actually validate against,
  so a drift between the two is a silent correctness bug.
- This package has no dependents inside itself — it's the bottom of the
  dependency chain (`cli` → `registry` → `schemas` + `validate` → `schemas`).
  Keep it free of Cloudflare/registry/CLI-specific logic; it should only ever
  describe the *shape* of a subdomain file, never how to act on one.
- No test suite here (`pnpm test` is a no-op at this package level) —
  schema correctness is exercised indirectly via `registry`'s
  `domain-schema.test.ts`.
