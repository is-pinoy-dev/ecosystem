---
"@is-pinoy-dev/registry": patch
---

Say something when a sync strands a hosted portfolio.

`diffWorkerRoutes` returns no actions when `PORTFOLIO_WORKER` is unset, so a
sync run from an environment predating the feature is a no-op rather than a
teardown. That is only harmless when there is nothing to reconcile: a hosted
portfolio's CNAME points at the renderer, whose host holds a certificate for
its own name only, and the Workers route is what rewrites the request onto it.
Without the route Cloudflare connects to that origin under the portfolio's own
hostname, the TLS handshake fails, and the address serves HTTP 525 — with
nothing in the sync output to say why.

The skip stays a skip, but a sync that leaves hosted portfolios without routes
now names them and says what they will serve until the routes exist.
