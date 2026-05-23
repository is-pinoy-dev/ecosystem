---
"@is-pinoy-dev/registry": patch
---

Fix false UPDATE actions caused by CNAME content format differences

Cloudflare can return CNAME targets with a trailing dot or different
casing (e.g. `jun.vercel.app.` instead of `jun.vercel.app`), causing
the diff to miss the exact-content match and fall through to the
type-match branch — producing an UPDATE on every sync even when nothing
in the local JSON changed.

Content is now normalized on both sides before comparison: CNAME values
are stripped of trailing dots and lowercased, and TXT values are
quote-wrapped. This prevents spurious UPDATE actions for domains whose
records have not actually changed.
