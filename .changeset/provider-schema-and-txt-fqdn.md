---
"@is-pinoy-dev/schemas": minor
"@is-pinoy-dev/registry": patch
"@is-pinoy-dev/validate": patch
---

Expand supported TXT providers and fix provider TXT record naming in diff.

- `txtRecord.provider` now accepts `vercel`, `netlify`, `github`, and `cloudflare` (previously only `vercel`). Exported as `SUPPORTED_PROVIDERS`. Regenerated `schema/v1/subdomain.schema.json`.
- Fixed `diff` so provider verification TXT records resolve to `_<provider>.<subdomain>.is-pinoy.dev` instead of `_<provider>.is-pinoy.dev`. The subdomain was being dropped, so every provider TXT collapsed to the same name — this produced phantom `CREATE`/`UPDATE` actions in `sync --dry-run` that did not correspond to the subdomain being registered, and caused records from different subdomains to collide.
