# @is-pinoy-dev/validate

## 1.0.2

### Patch Changes

- 8f79768: Expand supported TXT providers, fix provider TXT record naming, and scope diffs to changed files.
  - `txtRecord.provider` now accepts `vercel`, `netlify`, `github`, and `cloudflare` (previously only `vercel`). Exported as `SUPPORTED_PROVIDERS`. Regenerated `schema/v1/subdomain.schema.json`.
  - Fixed `diff` so provider verification TXT records resolve to `_<provider>.<subdomain>.is-pinoy.dev` instead of `_<provider>.is-pinoy.dev`. The subdomain was being dropped, so every provider TXT collapsed to the same name — this produced phantom `CREATE`/`UPDATE` actions in `sync --dry-run` that did not correspond to the subdomain being registered, and caused records from different subdomains to collide.
  - Added a `--only <files...>` option to `registry diff` and `registry sync` that restricts the operation to the given changed domain files (matched by basename). The `registry-validate` CI action now uses it to scope the PR dry-run strictly to the subdomain files the PR changed, so drift on unrelated subdomains no longer surfaces as phantom changes.

- Updated dependencies [8f79768]
  - @is-pinoy-dev/schemas@1.2.0

## 1.0.1

### Patch Changes

- Updated dependencies [0a3c2aa]
  - @is-pinoy-dev/schemas@1.1.0

## 1.0.0

### Major Changes

- 19b93e4: Expand reserved subdomain list and enforce 3-character minimum length.

  `RESERVED_SUBDOMAINS` grows from 22 to ~95 keywords covering infrastructure, auth, environments, observability, assets, community, commerce, and brand protection. The `reserved_subdomains.json` duplicate has been removed — `reserved.ts` is now the single source of truth.

  `domainSchema` now enforces `subdomain: min(3)` — subdomains shorter than 3 characters are rejected at the schema level.

  **Breaking:** any subdomain shorter than 3 characters or matching a newly reserved keyword will now fail validation.

  Docs updated: `naming-rules` now lists all reserved names in a table and reflects the new 3-character minimum; `common-errors` adds entries for the "too short" and "reserved subdomain" errors.

### Patch Changes

- Updated dependencies [19b93e4]
  - @is-pinoy-dev/schemas@1.0.0

## 0.3.4

### Patch Changes

- e858dd0: Security hardening: symlink protection, error sanitization, and credential safety
  - Reject symlinks in the domains directory loader and validate CLI before reading files, preventing symlink-based access to files outside the intended directory
  - Add a 64 KB file size cap before JSON.parse in both the loader and validate CLI to prevent memory exhaustion from oversized inputs
  - Sanitize Cloudflare API error messages so only the human-readable message is surfaced instead of the full raw API response
  - Warn when --api-key CLI flag is used since the token value is visible to all users via process listings (ps aux)
  - Add HTTP security headers to the web app (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)
  - Write ~/.npmrc with chmod 600 in CI to restrict token file permissions to the current user only

## 0.3.3

### Patch Changes

- Updated dependencies [da68b45]
  - @is-pinoy-dev/schemas@0.3.1

## 0.3.2

### Patch Changes

- 6b4ce03: Fix TypeScript rootDir inference — static JSON import of `../package.json` in `bin.ts` was causing `tsc` to expand `rootDir` to the project root, outputting compiled files to `dist/src/` instead of `dist/`. This broke CI builds from a clean checkout where no stale `dist/index.js` existed. Switched to runtime `readFileSync` to read the package version.

## 0.3.1

### Patch Changes

- beedf81: Fix TypeScript rootDir inference — static JSON import of `../package.json` in `bin.ts` was causing `tsc` to expand `rootDir` to the project root, outputting compiled files to `dist/src/` instead of `dist/`. This broke CI builds from a clean checkout where no stale `dist/index.js` existed. Switched to runtime `readFileSync` to read the package version.

## 0.3.0

### Minor Changes

- bdefedc: Initial release of the is-pinoy.dev tooling — a free subdomain registry for Filipino developers.
  - `@is-pinoy-dev/cli` — CLI to validate and sync is-pinoy.dev subdomains to Cloudflare
  - `@is-pinoy-dev/validate` — public validator for is-pinoy.dev domain files
  - `@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev domain files

### Patch Changes

- Updated dependencies [bdefedc]
  - @is-pinoy-dev/schemas@0.3.0

## 0.2.0

### Minor Changes

- 8985e5a: Initial release of the is-pinoy.dev tooling — a free subdomain registry for Filipino developers.
  - `@is-pinoy-dev/cli` — CLI to validate and sync is-pinoy.dev subdomains to Cloudflare
  - `@is-pinoy-dev/validate` — public validator for is-pinoy.dev domain files
  - `@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev domain files

### Patch Changes

- Updated dependencies [8985e5a]
  - @is-pinoy-dev/schemas@0.2.0

## 0.1.0

### Minor Changes

- 51d2007: Initial release of the is-pinoy.dev tooling — a free subdomain registry for Filipino developers.
  - `@is-pinoy-dev/cli` — CLI to validate and sync is-pinoy.dev subdomains to Cloudflare
  - `@is-pinoy-dev/validate` — public validator for is-pinoy.dev domain files
  - `@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev domain files

### Patch Changes

- Updated dependencies [51d2007]
  - @is-pinoy-dev/schemas@0.1.0
