---
"site-audit": minor
---

Report a failed fetch as a failed fetch, instead of scoring it.

An HTML parser accepts anything. A 404 body, an empty response and a JSON
error each parse into a valid `Document` with an empty `<head>`, so every check
found its field missing and the report read as the audited site's fault. The
floor this produces is 7 of 29 SEO checks — `URL`, the five heading counts, and
`Image Alt Texts` passing on "no images" — which looks like a real, very bad
score rather than a page that was never fetched.

`/audit-proxy` now returns the status, content type, byte count and final URL
alongside the bytes, and the scan refuses to grade a response that isn't a
2xx HTML document from the origin that was asked for, naming which of those it
was instead.
