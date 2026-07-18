---
"@is-pinoy-dev/schemas": minor
"@is-pinoy-dev/registry": patch
"@is-pinoy-dev/validate": patch
"@is-pinoy-dev/cli": minor
---

Expand supported TXT providers, fix provider TXT record naming, and scope diffs to changed files.

- `txtRecord.provider` now accepts `vercel`, `netlify`, `github`, and `cloudflare` (previously only `vercel`). Exported as `SUPPORTED_PROVIDERS`. Regenerated `schema/v1/subdomain.schema.json`.
- Fixed `diff` so provider verification TXT records resolve to `_<provider>.<subdomain>.is-pinoy.dev` instead of `_<provider>.is-pinoy.dev`. The subdomain was being dropped, so every provider TXT collapsed to the same name — this produced phantom `CREATE`/`UPDATE` actions in `sync --dry-run` that did not correspond to the subdomain being registered, and caused records from different subdomains to collide.
- Added a `--only <files...>` option to `registry diff` and `registry sync` that restricts the operation to the given changed domain files (matched by basename). The `registry-validate` CI action now uses it to scope the PR dry-run strictly to the subdomain files the PR changed, so drift on unrelated subdomains no longer surfaces as phantom changes.
