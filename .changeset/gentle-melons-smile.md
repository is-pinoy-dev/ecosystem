---
"site-audit": minor
---

Reach a hosted portfolio the way the proxy does, instead of through the edge.

A hosted portfolio is only reachable at its own hostname because a Workers
route rewrites the request onto the renderer — and a `fetch()` from inside a
Worker to its own zone does not re-run that zone's routes. Cloudflare skips
them to keep Workers from recursing.

So `/audit-proxy` scanning `<label>.is-pinoy.dev` bypassed
tools-portfolio-proxy, reached the origin still carrying the portfolio's own
hostname, and failed the TLS handshake against a certificate that does not
cover it. The scan reported **HTTP 525** for a page that serves perfectly to a
browser — and before the previous release, reported it as 7 of 29 SEO checks
passing rather than as a failed fetch.

For a subdomain of our own zone the proxy now does what portfolio-proxy does:
addresses the renderer directly and carries the label in a header,
authenticated by the shared secret. The apex and external sites are fetched as
asked, and the secret never travels to a host outside the zone. Unconfigured,
it falls back to the plain public fetch.

Deploying this needs `PORTFOLIO_PROXY_SECRET` on the site-audit Worker — the
same value tools-portfolio-proxy and the renderer already hold:

```
wrangler secret put PORTFOLIO_PROXY_SECRET -c worker/wrangler.toml
```
