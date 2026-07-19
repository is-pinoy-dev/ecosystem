---
"@is-pinoy-dev/cli": minor
"@is-pinoy-dev/registry": minor
---

Add `registry vercel-cleanup` command and Vercel verification TXT lifecycle handling.

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
