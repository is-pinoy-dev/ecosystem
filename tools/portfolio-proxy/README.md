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
so check the Vercel value if the two ever disagree. Note the newline can only
bite from the Vercel side: the Worker's copy travels as a header value, and HTTP
normalization trims it before `proxy.ts` compares.

## Diagnosing a 404

Every failure in this chain renders the same 404 page. `proxy.ts` names its own
verdict on every response, so one request tells you which:

```bash
curl -sI https://juan.is-pinoy.dev/ | grep -i x-portfolio-route
```

| `x-portfolio-route` | Meaning |
| --- | --- |
| `worker` | The proxy chain is healthy — a 404 came from further in; see the renderer's logs |
| `host` | Reached the renderer without this Worker (direct hostname) |
| `no-secret` | The Worker authenticated, the **renderer** has no secret compiled in — set it on Vercel **and redeploy** |
| `secret-mismatch` | Both sides have one and they differ — check for a trailing newline on the Vercel value |
| `bad-label` | Secret matched, label malformed. The Worker constrains it, so this means something else is forwarding |
| `unlabelled` | No label and none presented — the apex, a preview, or this Worker not being in the path at all |

### Which side is stale

`secret-mismatch` says the two copies disagree, not which one is wrong — and a
repository secret is write-only, so you cannot read either value back to compare
them. Both sides instead log a fingerprint of their own copy once per cold start:
32 bits of SHA-256, computed identically in `worker/index.ts` and
`apps/portfolio/lib/diagnostics.ts`, and pinned to the same known answer in both
test suites so they cannot drift apart.

```
[portfolio-proxy] config rootDomain=… proxySecret=set proxySecretFp=31eb0ae3 og=bound siteAudit=bound
[portfolio] config proxySecret=set proxySecretFp=ea19211e githubToken=set rootDomain=is-pinoy.dev(default)
```

Equal tags mean equal secrets. Different tags, as above, name the side to fix:
whichever disagrees with the value CI last pushed. `MISSING` in either line is a
variable or binding that was never set — each fails silently in its own way, so
both lines drop to `warn` level when anything is absent and stay at `info`/`log`
when everything is present.

The Worker's line is in `wrangler tail` or the Workers observability logs; the
renderer's is in the Vercel runtime logs.

A `worker` verdict on a 404 puts the fault past the proxy. The renderer names
those in its runtime logs on one line each:

```bash
vercel logs --since 1h | grep '\[portfolio\] miss'
# reason=unknown-subdomain     no subdomains/<name>.json on the domains repo
# reason=no-portfolio-block    claimed, but it points at the owner's own host
# reason=github-unavailable    GitHub gave us no user — check the adjacent
#                              [portfolio] upstream line for status=403 and
#                              rateLimitRemaining=0, i.e. no GITHUB_TOKEN
```

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
