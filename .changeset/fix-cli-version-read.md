---
"@is-pinoy-dev/cli": patch
---

Fix version reading in CLI banner — replaced static `../package.json` import with runtime `require()` for consistency with the validate package fix.
