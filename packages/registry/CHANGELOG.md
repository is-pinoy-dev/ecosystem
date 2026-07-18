# @is-pinoy-dev/registry

## 0.0.12

### Patch Changes

- 8f79768: Expand supported TXT providers, fix provider TXT record naming, and scope diffs to changed files.
  - `txtRecord.provider` now accepts `vercel`, `netlify`, `github`, and `cloudflare` (previously only `vercel`). Exported as `SUPPORTED_PROVIDERS`. Regenerated `schema/v1/subdomain.schema.json`.
  - Fixed `diff` so provider verification TXT records resolve to `_<provider>.<subdomain>.is-pinoy.dev` instead of `_<provider>.is-pinoy.dev`. The subdomain was being dropped, so every provider TXT collapsed to the same name — this produced phantom `CREATE`/`UPDATE` actions in `sync --dry-run` that did not correspond to the subdomain being registered, and caused records from different subdomains to collide.
  - Added a `--only <files...>` option to `registry diff` and `registry sync` that restricts the operation to the given changed domain files (matched by basename). The `registry-validate` CI action now uses it to scope the PR dry-run strictly to the subdomain files the PR changed, so drift on unrelated subdomains no longer surfaces as phantom changes.

- Updated dependencies [8f79768]
  - @is-pinoy-dev/schemas@1.2.0
  - @is-pinoy-dev/validate@1.0.2

## 0.0.11

### Patch Changes

- Updated dependencies [0a3c2aa]
  - @is-pinoy-dev/schemas@1.1.0
  - @is-pinoy-dev/validate@1.0.1

## 0.0.10

### Patch Changes

- Updated dependencies [19b93e4]
  - @is-pinoy-dev/validate@1.0.0
  - @is-pinoy-dev/schemas@1.0.0

## 0.0.9

### Patch Changes

- 7dc7edb: Fix TXT record FQDN to include subdomain: `_vercel.{subdomain}.is-pinoy.dev` instead of `_vercel.is-pinoy.dev`. Previously synced records at the wrong FQDN will need to be manually removed from Cloudflare.

  The `registry-validate` CI action now also runs a sync dry-run after validation passes, posting the expected changes as a PR comment. Pass `cloudflare-api-token` and `cloudflare-zone-id` inputs to enable it.

## 0.0.8

### Patch Changes

- 5caa3a1: Fix false UPDATE actions caused by CNAME content format differences

  Cloudflare can return CNAME targets with a trailing dot or different
  casing (e.g. `jun.vercel.app.` instead of `jun.vercel.app`), causing
  the diff to miss the exact-content match and fall through to the
  type-match branch — producing an UPDATE on every sync even when nothing
  in the local JSON changed.

  Content is now normalized on both sides before comparison: CNAME values
  are stripped of trailing dots and lowercased, and TXT values are
  quote-wrapped. This prevents spurious UPDATE actions for domains whose
  records have not actually changed.

## 0.0.7

### Patch Changes

- Updated dependencies [e858dd0]
  - @is-pinoy-dev/validate@0.3.4

## 0.0.6

### Patch Changes

- Updated dependencies [da68b45]
  - @is-pinoy-dev/schemas@0.3.1
  - @is-pinoy-dev/validate@0.3.3

## 0.0.5

### Patch Changes

- Updated dependencies [6b4ce03]
  - @is-pinoy-dev/validate@0.3.2

## 0.0.4

### Patch Changes

- Updated dependencies [beedf81]
  - @is-pinoy-dev/validate@0.3.1

## 0.0.3

### Patch Changes

- Updated dependencies [bdefedc]
  - @is-pinoy-dev/validate@0.3.0
  - @is-pinoy-dev/schemas@0.3.0

## 0.0.2

### Patch Changes

- Updated dependencies [8985e5a]
  - @is-pinoy-dev/validate@0.2.0
  - @is-pinoy-dev/schemas@0.2.0

## 0.0.1

### Patch Changes

- Updated dependencies [51d2007]
  - @is-pinoy-dev/validate@0.1.0
  - @is-pinoy-dev/schemas@0.1.0
