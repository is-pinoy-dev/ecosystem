# portfolio-proxy

The front door for hosted portfolios. Rewrites `<label>.is-pinoy.dev` onto the
renderer's own hostname and carries the label in a header, so `apps/portfolio`
can serve a subdomain Vercel has never heard of.

## Why this exists

`apps/portfolio` runs on Vercel, which routes purely on the `Host` header and
answers its own 404 for any hostname not registered on the project. Neither way
of registering claimed subdomains is open to us:

- **A wildcard domain (`*.is-pinoy.dev`) requires Vercel's nameservers.**
  Wildcard certificates are issued over DNS-01, so Vercel has to own the zone's
  DNS to answer the challenge. The zone stays on Cloudflare — the registry syncs
  every record there, four Workers hold routes on it, and edge analytics run on
  it. Delegating it away isn't on the table.
- **Per-hostname registration is capped at 50 domains per project** on the free
  plan. That is a permanent ceiling on how many portfolios can ever exist.

So Cloudflare handles the dynamic part instead. The visitor's TLS is terminated
by Universal SSL, which already covers one level of `*.is-pinoy.dev`, and this
Worker forwards to `portfolio.is-pinoy.dev` — a hostname Vercel *does* own —
with `x-portfolio-subdomain` set. **No per-portfolio certificate exists to
provision, and nothing has to be registered with Vercel.**

## Routes

One route per claimed portfolio (`juan.is-pinoy.dev/*`), created by
`is-pinoy registry sync` alongside the DNS record — see
`packages/registry/src/core/routes.ts`. `wrangler.toml` deliberately declares
none; adding a `[[routes]]` block would make `wrangler deploy` reconcile the
route list against the file and tear down every portfolio's route.

It is *not* a single `*.is-pinoy.dev/*` route. That pattern matches everything
entering the zone, which would put this Worker in front of the ~40 subdomains
pointing at their owners' own hosts. Per-route costs nothing and keeps the blast
radius at the portfolios.

## Trust

The renderer answers on a public hostname, so `x-portfolio-subdomain` alone
would let anyone render any subdomain's portfolio anywhere. Every forwarded
request also carries `x-portfolio-proxy-secret`; `apps/portfolio/proxy.ts`
honours the label only on a constant-time match and strips both headers
otherwise.

The same value has to exist in two places:

| Side | Where | How |
| --- | --- | --- |
| Worker | Cloudflare secret | `PORTFOLIO_PROXY_SECRET` **repository secret** in `is-pinoy-dev/ecosystem` — the deploy workflow pushes it |
| Renderer | Vercel env var | `PORTFOLIO_PROXY_SECRET` on the portfolio project, **then redeploy** |

Adding it to GitHub means rotating is a secret edit plus a re-run of
`deploy-portfolio-proxy.yml`; no local wrangler needed. The workflow step is
skipped when the secret is absent, so the Worker deploys fine without it — it
just can't authenticate anything yet.

The Vercel side stays manual, and it needs a **redeploy**: Next inlines
`process.env` into the proxy bundle at build time, so setting the variable
without rebuilding changes nothing.

A mismatch is quiet in the worst way: previews keep working (they never touch
this path) while every claimed portfolio 404s. A trailing newline is the usual
culprit — the workflow uses `printf` rather than `echo` for exactly that reason,
so check the Vercel value if the two ever disagree.

## `/_tools/*`

`/_tools/og*` and `/_tools/site-audit*` are handed to their own Workers over
service bindings rather than forwarded to the renderer. Cloudflare picks the
most specific route when several match, but the tie-break between this Worker's
`juan.is-pinoy.dev/*` and the tools' `*.is-pinoy.dev/_tools/og*` — host
specificity against path specificity — isn't something to bet on. The binding
makes it explicit. `app/page.tsx` builds a claimed portfolio's OG card from
`/_tools/og/image`, so getting this wrong means every portfolio's share card
renders the portfolio's own HTML.

## Deploy

```bash
pnpm --filter portfolio-proxy deploy
```

Runs on push to `main` under `.github/workflows/deploy-portfolio-proxy.yml`.
The `tools-og` and `tools-site-audit` Workers must already be deployed — the
service bindings resolve by script name.

## Tests

```bash
pnpm --filter portfolio-proxy test
```
