---
"@is-pinoy-dev/cli": patch
"@is-pinoy-dev/registry": patch
---

Fix TXT record FQDN to include subdomain: `_vercel.{subdomain}.is-pinoy.dev` instead of `_vercel.is-pinoy.dev`. Previously synced records at the wrong FQDN will need to be manually removed from Cloudflare.

The `registry-validate` CI action now also runs a sync dry-run after validation passes, posting the expected changes as a PR comment. Pass `cloudflare-api-token` and `cloudflare-zone-id` inputs to enable it.
