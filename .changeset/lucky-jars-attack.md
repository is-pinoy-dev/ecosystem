---
"site-audit": patch
---

Scan a subdomain at its own address unless it is actually a hosted portfolio.

Reaching a hosted portfolio through the renderer (0.3.0) keyed the rewrite on
the hostname alone, so `/audit-proxy` treated every `*.is-pinoy.dev` target as a
portfolio. Most are not. `jappe.is-pinoy.dev` is a CNAME to its owner's own
Vercel project, and rewriting it onto `portfolio.is-pinoy.dev` asked a
completely different origin for a portfolio that was never claimed: the renderer
answered 404 `no-portfolio-block`, and the scan reported that 404 against a site
that serves 200 to every browser. Because the rewrite is ours rather than a
redirect, `finalUrl` still named the portfolio's own address, so nothing in the
report revealed that a different origin had been fetched.

Being a subdomain of our zone is no longer the test. The proxy now resolves the
target's own label against `subdomains/<label>.json` — the same file, and the
same `portfolio` block, the renderer resolves on — and rewrites only for a
record that carries one. Everything else, including an unclaimed name, is
fetched as asked, and the shared secret never travels to an origin we do not
render. With the domains repo unreachable the target is fetched at its real
address: an honest connection error beats a 404 charged to whoever owns the
name.

Two things that made this hard to read are fixed with it. `x-portfolio-route:
worker` — the *healthy* verdict — had no entry in the diagnosis table, so it was
appended to the error bare, reading like a fault code when what it actually
rules out is the whole routing half of the problem; it now says so. And the
Worker's `features.tools.site-audit` gate treated any hiccup from
raw.githubusercontent.com as "not enabled", handing an owner who had enabled the
tool a page telling them to add a flag already in their record. Opting out is a
fact stated in the file, so only a file we actually read may now withhold the
tool; an unreachable registry fails open.
