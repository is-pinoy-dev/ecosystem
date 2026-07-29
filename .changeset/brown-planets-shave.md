---
"@is-pinoy-dev/schemas": minor
"@is-pinoy-dev/registry": minor
"@is-pinoy-dev/cli": minor
---

Reconcile Cloudflare Workers routes for hosted portfolios during sync.

A claimed portfolio's DNS record was never enough to reach the renderer: it runs
on Vercel, which routes on `Host` and 404s any hostname not registered on the
project. Registering them isn't available on the current plans — a wildcard
domain requires Vercel's nameservers, and per-hostname registration is capped at
50 per project — so a Cloudflare Worker fronts them instead, and it needs one
route per claimed subdomain.

`sync` now diffs those routes alongside the DNS records: a route is created when
a domain gains a `portfolio` block and removed when it loses one or is
destroyed. Only routes bound to the configured script are considered, so the
zone's existing `_tools` and status routes are never touched, and a scoped
(`--only`) run won't delete routes for subdomains outside its scope.

Set `PORTFOLIO_WORKER` to the deployed script name to enable this; unset, route
reconciliation is skipped entirely, so an environment that predates this feature
is a no-op rather than a teardown. The Cloudflare token needs the
*Workers Routes: Edit* scope.
