# @is-pinoy-dev/cli

## 0.4.5

### Patch Changes

- ecdd7f2: Switch publish target from GitHub Packages to npmjs (public)

## 0.4.4

### Patch Changes

- e858dd0: Security hardening: symlink protection, error sanitization, and credential safety
  - Reject symlinks in the domains directory loader and validate CLI before reading files, preventing symlink-based access to files outside the intended directory
  - Add a 64 KB file size cap before JSON.parse in both the loader and validate CLI to prevent memory exhaustion from oversized inputs
  - Sanitize Cloudflare API error messages so only the human-readable message is surfaced instead of the full raw API response
  - Warn when --api-key CLI flag is used since the token value is visible to all users via process listings (ps aux)
  - Add HTTP security headers to the web app (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)
  - Write ~/.npmrc with chmod 600 in CI to restrict token file permissions to the current user only

## 0.4.3

### Patch Changes

- da68b45: Fix duplicate record error (81058) and improve DNS sync efficiency
  - Fix error 81058 "An identical record already exists" caused by the diff algorithm matching actual records by fqdn+type only, which produced spurious UPDATE/CREATE actions when a domain had multiple records of the same type
  - Fix silent record truncation on zones with more than 100 records by requesting per_page=5000 from the Cloudflare API
  - Parallelize sync execution with Promise.allSettled so all CREATE/UPDATE/DELETE actions fire concurrently instead of sequentially; a single failure no longer blocks the rest
  - Replace O(n×m) find() loops in diff with O(n+m) Map-based lookups
  - Detect proxied and TTL changes on records whose content is unchanged and generate UPDATE actions for them
  - Add optional proxied and ttl fields to CloudflareRecord schema to support the above comparison

## 0.4.2

### Patch Changes

- 6b4ce03: Fix version reading in CLI banner — replaced static `../package.json` import with runtime `require()` for consistency with the validate package fix.

## 0.4.1

### Patch Changes

- beedf81: Fix version reading in CLI banner — replaced static `../package.json` import with runtime `require()` for consistency with the validate package fix.

## 0.4.0

### Minor Changes

- bdefedc: Initial release of the is-pinoy.dev tooling — a free subdomain registry for Filipino developers.
  - `@is-pinoy-dev/cli` — CLI to validate and sync is-pinoy.dev subdomains to Cloudflare
  - `@is-pinoy-dev/validate` — public validator for is-pinoy.dev domain files
  - `@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev domain files

## 0.3.0

### Minor Changes

- 8985e5a: Initial release of the is-pinoy.dev tooling — a free subdomain registry for Filipino developers.
  - `@is-pinoy-dev/cli` — CLI to validate and sync is-pinoy.dev subdomains to Cloudflare
  - `@is-pinoy-dev/validate` — public validator for is-pinoy.dev domain files
  - `@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev domain files

## 0.2.0

### Minor Changes

- 51d2007: Initial release of the is-pinoy.dev tooling — a free subdomain registry for Filipino developers.
  - `@is-pinoy-dev/cli` — CLI to validate and sync is-pinoy.dev subdomains to Cloudflare
  - `@is-pinoy-dev/validate` — public validator for is-pinoy.dev domain files
  - `@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev domain files

## 0.1.0

### Minor Changes

- 5e4b1eb: Initial release of `@is-pinoy-dev/cli` — validate and sync is-pinoy.dev subdomains to Cloudflare.
