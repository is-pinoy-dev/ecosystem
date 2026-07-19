# @is-pinoy-dev/cli

## 0.6.0

### Minor Changes

- 077adc1: Add `registry vercel-cleanup` command and Vercel verification TXT lifecycle handling.

  Vercel's `vc-domain-verify` TXT challenge is single-use: once a domain is
  attached and verified, the record is dead weight. The new command scans the
  registry for domains carrying a verification TXT, probes each `https://<fqdn>`
  to confirm it is served by Vercel's edge without an `x-vercel-error` header
  (the observable signature of a verified, working domain), and with `--write`
  removes the now-unneeded TXT entries from the domain JSON files. `--json`
  emits a machine-readable report for CI.

  `diff` now also deletes orphaned `vc-domain-verify` TXT records at the
  `_vercel` challenge names once no active domain file declares them, so a
  cleanup PR propagates to Cloudflare through the normal sync. Deletion is
  tightly scoped: only values whose embedded target is a strict subdomain of
  the zone — the org's own apex verification and unrelated TXT records are
  never touched.

## 0.5.1

### Patch Changes

- b69735b: Restrict `txtRecord.provider` to `vercel` only.

  The `netlify`, `github`, and `cloudflare` values added in the previous release
  never mapped to a real DNS verification flow: Netlify and Cloudflare Pages do
  not verify subdomains with a DNS TXT challenge, and GitHub Pages uses a
  challenge name that embeds the user's GitHub username
  (`_github-pages-challenge-<username>`), which cannot be derived from a provider
  enum. Accepting these values created records no provider ever queries while
  telling users verification was set up.

  The `provider` field remains required on verification TXT records so the intent
  stays explicit in the JSON file. Regenerated `schema/v1/subdomain.schema.json`.

## 0.5.0

### Minor Changes

- 8f79768: Expand supported TXT providers, fix provider TXT record naming, and scope diffs to changed files.
  - `txtRecord.provider` now accepts `vercel`, `netlify`, `github`, and `cloudflare` (previously only `vercel`). Exported as `SUPPORTED_PROVIDERS`. Regenerated `schema/v1/subdomain.schema.json`.
  - Fixed `diff` so provider verification TXT records resolve to `_<provider>.<subdomain>.is-pinoy.dev` instead of `_<provider>.is-pinoy.dev`. The subdomain was being dropped, so every provider TXT collapsed to the same name — this produced phantom `CREATE`/`UPDATE` actions in `sync --dry-run` that did not correspond to the subdomain being registered, and caused records from different subdomains to collide.
  - Added a `--only <files...>` option to `registry diff` and `registry sync` that restricts the operation to the given changed domain files (matched by basename). The `registry-validate` CI action now uses it to scope the PR dry-run strictly to the subdomain files the PR changed, so drift on unrelated subdomains no longer surfaces as phantom changes.

## 0.4.9

### Patch Changes

- f7caa44: Pin figlet to 1.11.0. figlet 1.11.1 ships a broken CommonJS build (`fileURLToPath(undefined)` throws on require), which crashed the CLI on startup for any fresh install.

## 0.4.8

### Patch Changes

- c21b96e: Show `(proxied)` in dry-run and diff output when a record has Cloudflare proxy enabled

## 0.4.7

### Patch Changes

- 1e1f6a3: Fix TXT record FQDN to use `_${provider}.${domain}` instead of `_${provider}.${subdomain}.${domain}`

## 0.4.6

### Patch Changes

- 7dc7edb: Fix TXT record FQDN to include subdomain: `_vercel.{subdomain}.is-pinoy.dev` instead of `_vercel.is-pinoy.dev`. Previously synced records at the wrong FQDN will need to be manually removed from Cloudflare.

  The `registry-validate` CI action now also runs a sync dry-run after validation passes, posting the expected changes as a PR comment. Pass `cloudflare-api-token` and `cloudflare-zone-id` inputs to enable it.

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
