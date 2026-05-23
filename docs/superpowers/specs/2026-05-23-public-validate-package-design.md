# Public Validate Package Design

## Overview

Split the `@is-pinoy-dev/registry` package into two published packages:

- `@is-pinoy-dev/validate` — published to **npm** (public), exposes only domain validation
- `@is-pinoy-dev/registry` — published to **GitHub Packages** (private, maintainers only), exposes diff/sync/loader/cloudflare

`@is-pinoy-dev/schemas` is also published to **npm** (public) since `validate` depends on it.

## Packages

### `@is-pinoy-dev/validate` (new, npm public)

**Purpose:** Let contributors validate their domain JSON file locally before submitting a PR.

**API:**

```ts
validateDomain(json: unknown): { ok: boolean; errors: string[] }
```

**Internals:**
- Runs `domainSchema.safeParse(json)` from `@is-pinoy-dev/schemas`
- Checks `reserved_subdomains.json` (bundled at build time — no runtime file I/O)
- Checks for empty record values
- No filesystem, no env vars, no Node-only APIs — works in any JS runtime

**Dependencies:**
- `@is-pinoy-dev/schemas` (peer or direct)
- `zod`

**What it does NOT include:**
- `loader` (filesystem-based directory reading)
- `diff` (cross-file duplicate checks, Cloudflare comparison)
- `sync` (Cloudflare API writes)
- `env` (Cloudflare credentials)

### `@is-pinoy-dev/schemas` (existing, move to npm public)

Currently `private: true`. Remove the private flag and publish to npm so that `@is-pinoy-dev/validate` consumers get the Zod schemas and TypeScript types.

### `@is-pinoy-dev/registry` (existing, GitHub Packages private)

No structural changes. Update `validateDomains` to import `validateDomain` from `@is-pinoy-dev/validate` instead of duplicating the logic.

Published to GitHub Packages under the `@is-pinoy-dev` scope — requires auth, maintainer-only.

## Data Flow

**Contributor (public):**
```
contributor JSON file
  → validateDomain(json)
  → domainSchema.safeParse + reserved check + empty value check
  → { ok, errors }
```

**Maintainer pipeline (private):**
```
domains/ directory
  → loadDomains() [loader]
  → validateDomains() [uses validateDomain internally]
  → diff(desired, actual)
  → sync(actions)
  → Cloudflare API
```

## Validation Logic (in validate package)

1. Zod schema parse via `domainSchema` — catches structural/type errors
2. Reserved subdomain check — `reserved_subdomains.json` bundled into the package
3. Empty record value check — iterates all record values

Cross-file checks (duplicate subdomains) remain in `validateDomains` inside `registry` — these require loading multiple files and are a maintainer concern.

## Package Configuration

`@is-pinoy-dev/validate`:
- `"private": false`
- `publishConfig: { "registry": "https://registry.npmjs.org" }`
- Exports: `"." : "./dist/index.js"`

`@is-pinoy-dev/schemas`:
- `"private": false`
- `publishConfig: { "registry": "https://registry.npmjs.org" }`

`@is-pinoy-dev/registry`:
- `"private": false`
- `publishConfig: { "registry": "https://npm.pkg.github.com" }`
- Depends on `@is-pinoy-dev/validate` (workspace) for validate logic

## Testing

- `validate` package: unit tests for `validateDomain` covering valid input, schema errors, reserved subdomains, empty values
- `registry` package: existing tests unchanged; `validateDomains` behavior preserved via integration
