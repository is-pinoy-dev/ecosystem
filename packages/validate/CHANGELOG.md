# @is-pinoy-dev/validate

## 1.3.0

### Minor Changes

- 89c4ad3: Add host identification: `hostProviderForTarget`, `hostProviderForRecords`, `normalizeHostTarget`, `HOST_PROVIDER_IDS`, `HOST_PROVIDER_NAMES`, and `PORTFOLIO_RENDERER_HOST`.

  Recognises the host a subdomain is served by from its CNAME target — our own
  portfolio renderer, Vercel, GitHub Pages, Netlify, or Cloudflare Pages — and
  returns null for anything else. Identification, not validation: an unrecognised
  target is a host we have no fingerprint for, never an error. A records identify
  no host and return null rather than a guess.

  The dashboard already did this privately; moving it here lets the public
  showcase label a card by what it points at without the two surfaces drifting.

## 1.2.0

### Minor Changes

- 242ff77: Tie hosted portfolios to their owner's GitHub identity.
  - `owner.id` (GitHub's numeric account ID) is a new optional field on the
    domain schema. Unlike a login it can't be renamed or re-registered by
    somebody else, so ownership matched on it survives a GitHub rename.
  - `validateDomain` now rejects a record that carries a `portfolio` block whose
    subdomain isn't its owner's GitHub username. A hosted portfolio renders
    `owner.github`'s profile, so a mismatch means the address advertises one
    person and the page shows another's. Subdomains without a `portfolio` block
    are unaffected and stay free to be named anything.
  - `validateDomains` reports a warning when one owner holds more than one
    hosted portfolio or more than one custom subdomain, counting by numeric ID
    where records carry it. Warnings rather than errors: the whole directory is
    checked on every run, so a hard failure would red unrelated pull requests.

### Patch Changes

- Updated dependencies [242ff77]
  - @is-pinoy-dev/schemas@1.6.0

## 1.1.1

### Patch Changes

- Updated dependencies [41fb09a]
  - @is-pinoy-dev/schemas@1.5.1

## 1.1.0

### Minor Changes

- ca63d4c: Reserve `portfolio` and expose the reserved list on a `./reserved` subpath.

  `portfolio.is-pinoy.dev` is the CNAME target every hosted portfolio points at,
  but it was claimable: a `subdomains/portfolio.json` would have passed validation
  and synced as an UPDATE against the platform's own record, breaking every
  portfolio at once.

  The new `@is-pinoy-dev/validate/reserved` export lets consumers read the list
  without pulling in zod and the rest of the validator — `apps/portfolio`'s proxy
  runs on the edge and now shares this list instead of keeping its own copy.

### Patch Changes

- Updated dependencies [ca63d4c]
  - @is-pinoy-dev/schemas@1.5.0

## 1.0.4

### Patch Changes

- bef4a89: Add the optional `portfolio` block to the domain schema.

  A subdomain that opts into a hosted portfolio points its CNAME at our own
  renderer and carries `portfolio: { template, theme?, sections? }` telling the
  renderer which design to use. `template` is required when the block is present;
  `sections` is an optional allow-list of profile-README heading slugs and also
  sets their render order.

  The block is inert to the registry and sync engine — to the differ it is just
  another CNAME — so this is additive and backward-compatible for every existing
  subdomain file. `schema/v1/subdomain.schema.json` is regenerated to match, which
  is what unblocks the domains repo: until this ships, files carrying a
  `portfolio` block validate only because Zod silently strips unknown keys, while
  anything checking against the published JSON Schema rejects them
  (`additionalProperties: false`).

- Updated dependencies [bef4a89]
  - @is-pinoy-dev/schemas@1.4.0

## 1.0.3

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

- Updated dependencies [b69735b]
  - @is-pinoy-dev/schemas@1.3.0

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
