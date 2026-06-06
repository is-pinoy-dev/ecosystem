---
"@is-pinoy-dev/cli": patch
---

Fix TXT record FQDN to use `_${provider}.${domain}` instead of `_${provider}.${subdomain}.${domain}`
