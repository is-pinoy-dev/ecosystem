# portfolio

The hosted-portfolio renderer. A subdomain whose
[is-pinoy-dev/domains](https://github.com/is-pinoy-dev/domains) file carries a
`portfolio` block points its CNAME here, and this app renders that owner's
GitHub **profile README** (`github.com/<user>/<user>`) plus their public profile
metadata in the template they chose. No site of their own required.

Design spec: [`docs/superpowers/specs/2026-07-22-portfolio-renderer-design.md`](../../docs/superpowers/specs/2026-07-22-portfolio-renderer-design.md).

## Stack

- Next.js App Router, one dynamic route, ISR-cached upstream fetches (1h)
- `proxy.ts` middleware maps the `Host` header to a subdomain label
- `unified` + `rehype-sanitize` to render untrusted README markdown/HTML
- `@is-pinoy-dev/ui` components with the shared design tokens

## Request lifecycle

```
juan.is-pinoy.dev
  → Cloudflare (proxied CNAME → portfolio.is-pinoy.dev, original Host preserved)
  → proxy.ts          strips the apex, sets x-portfolio-subdomain: juan
  → lib/resolve.ts    reads subdomains/juan.json from the domains repo
                      no file, or no `portfolio` block → 404
  → lib/github.ts     fetches profile, repos, README (ISR-cached)
  → lib/parse.ts      sanitizes the README to safe HTML
  → lib/seo.ts        derives the title, description, canonical, icons,
                      theme color and Schema.org graph from that same data
  → templates/        renders the chosen template + theme
```

## SEO, icons, and the rest of the site furniture

A claimed portfolio is somebody's actual homepage, so it ships what a homepage
ships. Everything below is derived from the one `PortfolioData` the templates
render — there is no second copy of the owner's name or bio to fall out of sync.

| Surface | Claimed subdomain | Renderer host / `?preview=` |
| --- | --- | --- |
| `robots.txt` | `Allow: /`, sitemap + host | `Disallow: /` |
| `sitemap.xml` | the one URL, `lastmod` pinned to the ISR window | empty |
| `manifest.webmanifest` | installable, owner's name/icon/colors | brand, `display: browser` |
| `<link rel=icon>` | the owner's GitHub avatar at 32/96/192/180 | the brand marks |
| `robots` meta | `index, follow` + `max-image-preview:large` | `noindex, nofollow` |
| `<link rel=canonical>` | `https://<label>.is-pinoy.dev` | none |
| `theme-color` / `color-scheme` | the template's own background | same |
| Schema.org JSON-LD | `WebSite` + `ProfilePage` + `Person` + projects | none |

Two rules hold the whole table up:

- **Only a claimed subdomain is a real site.** A preview renders an arbitrary
  GitHub login on our host, and `PORTFOLIO_SPIKE_*` is a demo. Both are the same
  content at an address that isn't its home — the textbook duplicate a canonical
  tag exists to prevent — so neither gets a canonical, structured data, an
  install manifest, or a place in the index.
- **The chrome matches the design that is about to paint.** `theme-color` and
  the manifest's splash colors come from `backgroundFor()`, which mirrors
  `themes.css` / `designer-themes.css`; `color-scheme` is computed from that
  hex's luminance, so a new designer template gets the right answer without a
  list to update. `tests/seo.test.ts` pins both.

`robots.ts` and `sitemap.ts` answer from the subdomain and one cached
domains-repo lookup — never a GitHub call. A crawler hitting them must not be
able to spend the API budget that renders pages.

## Local development

```bash
cp .env.example .env.local
pnpm --filter portfolio dev   # http://localhost:3002
```

Locally there is no wildcard DNS, so there is no subdomain in the `Host` header.
Two ways to render something:

- **Preview mode** — no env needed:
  `http://localhost:3002/?preview=1&github=<github-username>&template=terminal&theme=gold-dark`.
  This is the same URL shape the dashboard's `/claim` Preview link uses.
- **Spike fallback** — set `PORTFOLIO_SPIKE_SUBDOMAIN` (resolves against the
  domains repo exactly as production does) or `PORTFOLIO_SPIKE_LOGIN` (skips
  resolution) and open `/`.

To exercise real Host-based routing without DNS, send the header yourself:

```bash
curl -H "Host: juan.is-pinoy.dev" http://localhost:3002/
```

A `GITHUB_TOKEN` is not strictly required locally, but without one the
unauthenticated GitHub API allows ~20 renders/hour before the app starts
returning 404s.

## Tests

```bash
pnpm --filter portfolio test
```

`tests/parse.test.ts` is the security gate, not an optional suite. READMEs are
arbitrary third-party markdown **and** HTML served on `*.is-pinoy.dev`, a cookie
domain shared with the dashboard — a sanitizer regression here is stored XSS
against every other subdomain. Treat a failure there as a release blocker and
add a case for any new vector before changing `lib/parse.ts`.

## Security headers

`next.config.mjs` sets a deliberately narrow CSP as the second layer behind the
sanitizer, for the same threat model: if a bypass ever lands, the payload is
still denied its exits — `img-src` confined to the four allow-listed hosts,
`object-src`/`form-action`/`frame-ancestors` at `'none'`, `base-uri 'self'`.

It sets **no** `default-src`, `script-src`, or `style-src`. Next emits inline
hydration scripts, so restricting those needs per-request nonces, and a
half-configured CSP that blanks the page is worse than a narrow one that holds.
`tests/csp.test.ts` pins that, and pins the image allow-list identical across the
sanitizer, the CSP, and `images.remotePatterns` — three places that silently stop
working (or silently stop protecting) if they drift.

## Hosting

**Vercel**, alongside `web` and `dashboard`. The project exists and is live:
`portfolio.is-pinoy.dev` is a DNS-only (grey-cloud) CNAME to the project's own
`*.vercel-dns-*.com` target, which is why it answers with Vercel's addresses
rather than Cloudflare's anycast pair the way the apex and `status` do.

Preview mode works there today. Note what that does **not** prove: `?preview=1`
short-circuits in `parsePreview()` before `getRenderContext()` ever reads
`x-portfolio-subdomain`, so it renders on any host — including `*.vercel.app` —
and exercises neither `proxy.ts` nor `lib/resolve.ts`. A working preview means
the build and `GITHUB_TOKEN` are good, nothing more.

### How a claimed subdomain reaches this app

Vercel routes purely on `Host` and 404s any hostname not registered on the
project, and **neither way of registering claimed subdomains is available**: a
wildcard domain needs Vercel's nameservers (the zone stays on Cloudflare), and
per-hostname registration is capped at 50 domains per project on the free plan
— a permanent ceiling on how many portfolios can exist.

So the dynamic part lives on Cloudflare instead. `tools/portfolio-proxy` is a
Worker with **one route per claimed portfolio**, created by
`is-pinoy registry sync` alongside the DNS record. It rewrites the request onto
`portfolio.is-pinoy.dev` — a hostname Vercel does own — and carries the label in
`x-portfolio-subdomain`, authenticated with a shared secret that `proxy.ts`
checks before honouring it.

```
juan.is-pinoy.dev
  → Cloudflare edge (Universal SSL covers *.is-pinoy.dev at one level)
  → tools-portfolio-proxy   route juan.is-pinoy.dev/*
                            Host → portfolio.is-pinoy.dev
                            + x-portfolio-subdomain: juan (+ shared secret)
  → Vercel → this app
```

Nothing per-portfolio is registered with Vercel and no per-portfolio
certificate is provisioned. Read `tools/portfolio-proxy/README.md` before
changing any of it — particularly why the route is per-subdomain and not
`*.is-pinoy.dev/*`, and why `/_tools/*` goes over service bindings.

### Runbook

Done: the Vercel project (root directory `apps/portfolio`), its `GITHUB_TOKEN`,
and the `portfolio.is-pinoy.dev` DNS record. What remains:

1. **Deploy the Worker** — `pnpm --filter portfolio-proxy deploy`, or let
   `.github/workflows/deploy-portfolio-proxy.yml` do it on merge. `tools-og` and
   `tools-site-audit` must already be deployed; the service bindings resolve by
   script name.
2. **Set `PORTFOLIO_PROXY_SECRET` on both sides.** Add it as a repository secret
   in `is-pinoy-dev/ecosystem` and re-run `deploy-portfolio-proxy.yml` — the
   workflow pushes it to the Worker, so no local wrangler is needed. Then set
   the same value on the Vercel portfolio project **and redeploy**, since Next
   inlines `process.env` into the proxy bundle at build time. A mismatch is
   quiet: previews keep working while every claimed portfolio 404s.
3. **Set `PORTFOLIO_WORKER=tools-portfolio-proxy` in the domains repo's sync
   workflow**, and give `CLOUDFLARE_API_TOKEN` the *Workers Routes: Edit* scope.
   Until it's set, route reconciliation is skipped entirely — deliberately, so a
   sync from an older environment is a no-op rather than a teardown.
4. **Claim one subdomain end to end**: PR opens against the domains repo → CI
   validates the `portfolio` block → merge → sync writes the DNS record *and*
   the Worker route → the subdomain renders.

`/claim` writes `proxied: true` for portfolio subdomains
(`apps/dashboard/lib/claim-portfolio.ts`), which is required, not incidental:
a Workers route only fires on proxied traffic. It is also what lets the
`_tools` routes and edge analytics work — `app/page.tsx` builds a claimed
portfolio's OG card from its own `/_tools/og/image`.
