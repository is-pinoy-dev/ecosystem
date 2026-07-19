---
"@is-pinoy-dev/schemas": minor
"@is-pinoy-dev/validate": patch
"@is-pinoy-dev/registry": patch
"@is-pinoy-dev/cli": patch
---

Restrict `txtRecord.provider` to `vercel` only.

The `netlify`, `github`, and `cloudflare` values added in the previous release
never mapped to a real DNS verification flow: Netlify and Cloudflare Pages do
not verify subdomains with a DNS TXT challenge, and GitHub Pages uses a
challenge name that embeds the user's GitHub username
(`_github-pages-challenge-<username>`), which cannot be derived from a provider
enum. Accepting these values created records no provider ever queries while
telling users verification was set up.

The `provider` field remains required on verification TXT records so the intent
stays explicit in the JSON file. Regenerated `schema/v1/subdomain.schema.json`.
