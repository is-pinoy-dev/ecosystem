# @is-pinoy-dev/schemas

## 1.2.0

### Minor Changes

- 8f79768: Expand supported TXT providers, fix provider TXT record naming, and scope diffs to changed files.
  - `txtRecord.provider` now accepts `vercel`, `netlify`, `github`, and `cloudflare` (previously only `vercel`). Exported as `SUPPORTED_PROVIDERS`. Regenerated `schema/v1/subdomain.schema.json`.
  - Fixed `diff` so provider verification TXT records resolve to `_<provider>.<subdomain>.is-pinoy.dev` instead of `_<provider>.is-pinoy.dev`. The subdomain was being dropped, so every provider TXT collapsed to the same name — this produced phantom `CREATE`/`UPDATE` actions in `sync --dry-run` that did not correspond to the subdomain being registered, and caused records from different subdomains to collide.
  - Added a `--only <files...>` option to `registry diff` and `registry sync` that restricts the operation to the given changed domain files (matched by basename). The `registry-validate` CI action now uses it to scope the PR dry-run strictly to the subdomain files the PR changed, so drift on unrelated subdomains no longer surfaces as phantom changes.

## 1.1.0

### Minor Changes

- 0a3c2aa: Add `og` to `features.tools` in domain schema and relocate generated JSON Schema artifact.
  - `domainFeaturesSchema.tools` now accepts `"og": boolean` alongside `"site-audit": boolean`.
  - Generator (`pnpm generate:schema`) now writes to `packages/schemas/schema/v1/subdomain.schema.json` (canonical artifact in ecosystem) instead of the sibling `domains/` repo. Eliminates the cross-repo file write that required both repos to be checked out side-by-side.
  - `schema/` directory added to the `files` array so the JSON Schema ships with the published npm package.
  - Docs `$schema` URL references updated to point at the ecosystem-hosted artifact.

## 1.0.0

### Major Changes

- 19b93e4: Expand reserved subdomain list and enforce 3-character minimum length.

  `RESERVED_SUBDOMAINS` grows from 22 to ~95 keywords covering infrastructure, auth, environments, observability, assets, community, commerce, and brand protection. The `reserved_subdomains.json` duplicate has been removed — `reserved.ts` is now the single source of truth.

  `domainSchema` now enforces `subdomain: min(3)` — subdomains shorter than 3 characters are rejected at the schema level.

  **Breaking:** any subdomain shorter than 3 characters or matching a newly reserved keyword will now fail validation.

  Docs updated: `naming-rules` now lists all reserved names in a table and reflects the new 3-character minimum; `common-errors` adds entries for the "too short" and "reserved subdomain" errors.

## 0.3.1

### Patch Changes

- da68b45: Fix duplicate record error (81058) and improve DNS sync efficiency
  - Fix error 81058 "An identical record already exists" caused by the diff algorithm matching actual records by fqdn+type only, which produced spurious UPDATE/CREATE actions when a domain had multiple records of the same type
  - Fix silent record truncation on zones with more than 100 records by requesting per_page=5000 from the Cloudflare API
  - Parallelize sync execution with Promise.allSettled so all CREATE/UPDATE/DELETE actions fire concurrently instead of sequentially; a single failure no longer blocks the rest
  - Replace O(n×m) find() loops in diff with O(n+m) Map-based lookups
  - Detect proxied and TTL changes on records whose content is unchanged and generate UPDATE actions for them
  - Add optional proxied and ttl fields to CloudflareRecord schema to support the above comparison

## 0.3.0

### Minor Changes

- bdefedc: Initial release of the is-pinoy.dev tooling — a free subdomain registry for Filipino developers.
  - `@is-pinoy-dev/cli` — CLI to validate and sync is-pinoy.dev subdomains to Cloudflare
  - `@is-pinoy-dev/validate` — public validator for is-pinoy.dev domain files
  - `@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev domain files

## 0.2.0

### Minor Changes

- 8985e5a: Initial release of the is-pinoy.dev tooling — a free subdomain registry for Filipino developers.
  - `@is-pinoy-dev/cli` — CLI to validate and sync is-pinoy.dev subdomains to Cloudflare
  - `@is-pinoy-dev/validate` — public validator for is-pinoy.dev domain files
  - `@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev domain files

## 0.1.0

### Minor Changes

- 51d2007: Initial release of the is-pinoy.dev tooling — a free subdomain registry for Filipino developers.
  - `@is-pinoy-dev/cli` — CLI to validate and sync is-pinoy.dev subdomains to Cloudflare
  - `@is-pinoy-dev/validate` — public validator for is-pinoy.dev domain files
  - `@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev domain files
