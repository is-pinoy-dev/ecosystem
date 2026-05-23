# Registry Package Migration

## Goal

Migrate the standalone `register` project (`/home/junbosque/IsPinoyDev/register`) into a new `@is-pinoy/registry` package within the ecosystem monorepo (`/home/junbosque/IsPinoyDev/ecosystem/packages/registry`), replacing all local Zod schemas with `@is-pinoy/schemas`.

## Scope

- Create `packages/registry` as `@is-pinoy/registry`
- Migrate core modules: loader, validate, diff, sync, Cloudflare client
- Exclude CLI (deferred to separate package)
- Exclude domain JSON data files (added later)
- Use Vitest for testing (replacing ad-hoc runners and Jest)
- Use `@is-pinoy/schemas` for all Zod schema imports

## Key Difference: Records Format

The register project defines domain records as an **array of discriminated unions**:

```typescript
records: z.array(DNSRecordSchema).min(1)
// [{ type: "CNAME", value: "..." }, { type: "TXT", value: "...", provider: "vercel" }]
```

`@is-pinoy/schemas` defines them as a **keyed object** with optional record type keys:

```typescript
records: z.object({
  A: singleOrArray(aRecord).optional(),
  AAAA: singleOrArray(aaaaRecord).optional(),
  CNAME: singleOrArray(cnameRecord).optional(),
  TXT: singleOrArray(txtRecord).optional(),
}).refine((r) => Object.keys(r).length > 0, "At least one record type required")
// { CNAME: { value: "..." }, TXT: { value: "...", provider: "vercel" } }
```

All code that iterates or constructs records must adapt accordingly.

## Package Structure

```
packages/registry/
  package.json            # @is-pinoy/registry, private, type: module
  tsconfig.json           # extends @is-pinoy/typescript-config/base.json
  eslint.config.js        # flat config from @is-pinoy/eslint-config/base
  vitest.config.ts        # Vitest configuration
  src/
    index.ts              # Public API: re-exports core modules
    core/
      loader.ts           # Load & parse domain JSON files using @is-pinoy/schemas
      validate.ts         # Domain validation (uniqueness, filename, reserved, record sanity)
      diff.ts             # Desired-vs-actual Cloudflare state diff → DNSAction[]
      sync.ts             # Execute DNSAction[] via Cloudflare client
    providers/
      cloudflare/
        client.ts         # Cloudflare API v4 client (CRUD + list)
    reserved_subdomains.json
    tests/
      diff.test.ts        # Ported from ad-hoc runner to Vitest
      validate.test.ts    # Ported from ad-hoc runner to Vitest
      sync.test.ts        # Ported from Jest to Vitest (vi.mock)
```

## Module Details

### `src/core/loader.ts`
- Import `domainSchema`, `resolvedDomainSchema`, `ResolvedDomainsSchema` from `@is-pinoy/schemas`
- Read all `.json` files from a configurable `domains/` directory
- Parse each file, enrich with filename, return resolved domains array
- Basically unchanged logic, just adapted to new schema imports

### `src/core/validate.ts`
- Import `loadDomains` from loader
- Check: subdomain uniqueness, filename matches subdomain, no reserved subdomains
- **Adapted**: record iteration changes from `domain.records` (array) to iterating over `Object.values(domain.records)` (object)

### `src/core/diff.ts`
- Import `Domain`, `DNSRecord`, `DNSAction` from `@is-pinoy/schemas`
- **Adapted**: `expandDomain()` iterates over `Object.entries(domain.records)` instead of `domain.records.map()`
- **Adapted**: TXT record detection uses `record.provider` (same field, just accessed differently)
- **Adapted**: `normalizeTXTValue()` still works on individual `DNSRecord` discriminated union (unchanged)
- All destroy logic remains the same

### `src/providers/cloudflare/client.ts`
- Import `CloudflareRecord`, `DNSRecord` from `@is-pinoy/schemas`
- Cloudflare API CRUD via `fetch()` — no functional changes
- `normalizeContent()` still works on `DNSRecord` discriminated union

### `src/core/sync.ts`
- Import `DNSAction` from `@is-pinoy/schemas`
- Iterate actions, call client methods — no functional changes

## Testing Strategy (Vitest)

All three test files converted to Vitest:

- **`validate.test.ts`**: `describe` + `it` blocks, no file I/O (tests the function signature)
- **`diff.test.ts`**: `describe` + `it` blocks, test fixtures updated to keyed record format
- **`sync.test.ts`**: `vi.mock()` instead of `jest.mock()`, same test coverage

## Dependencies

```json
{
  "dependencies": {
    "@is-pinoy/schemas": "workspace:*",
    "zod": "catalog:",
    "dotenv": "^17.4.2"
  },
  "devDependencies": {
    "@is-pinoy/eslint-config": "workspace:*",
    "@is-pinoy/typescript-config": "workspace:*",
    "typescript": "catalog:",
    "vitest": "^3.1.3"
  }
}
```

## Out of Scope

- CLI entry point (separate package later)
- Domain JSON data files
- GitHub Actions workflow
- `@is-pinoy/schemas` modifications (use as-is)
