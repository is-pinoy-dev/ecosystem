# @is-pinoy-dev/registry

## 0.2.0

### Minor Changes

- ea3966d: Make Vercel verification TXT deletion scope-aware and add a re-add gate.

  `diff` now accepts a `scoped` option. When the desired domains are a subset
  (e.g. from `--only <changed files>`), orphaned `vc-domain-verify` TXT deletion
  is restricted to subdomains present in that subset. Previously a scoped
  diff/dry-run reported phantom `DELETE`s for every other subdomain's still-valid
  challenge — deletes the full-registry sync never performs. The `diff` and `sync`
  CLI commands pass `scoped` automatically whenever `--only` is used.

  `registry vercel-cleanup` gains `--only <files...>` (mirroring `sync`/`diff`)
  and `--check`. Check mode probes the scoped domains and exits non-zero if any
  still declares a verification TXT for a domain already attached and verified on
  Vercel — a re-add of a single-use challenge the cleanup already removed. It is
  read-only and never writes, even with `--write`. Domains not yet verified probe
  unhealthy and are allowed, so genuine new registrations still pass.

## 0.1.0

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

## 0.0.13

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
  - @is-pinoy-dev/validate@1.0.3

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
