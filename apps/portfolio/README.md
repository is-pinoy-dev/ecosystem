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
  → templates/        renders the chosen template + theme
```

## Local development

```bash
cp .env.example .env.local
pnpm --filter portfolio dev   # http://localhost:3002
```

Locally there is no wildcard DNS, so there is no subdomain in the `Host` header.
Two ways to render something:

- **Preview mode** — no env needed:
  `http://localhost:3002/?preview=1&login=<github-login>&template=terminal&theme=gold-dark`.
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

## Deployment prerequisites

The app builds and runs today, but **is not deployed**. All four of these are
account-level infrastructure, not code:

1. **A deploy target for this app.** Nothing currently ships it — there is no
   deploy workflow for `apps/portfolio` (the workflows in `.github/workflows`
   cover the Cloudflare Workers tools only), and the other Next apps deploy
   through Vercel's git integration rather than repo config.
2. **A DNS record for `portfolio.is-pinoy.dev`**, pointing at that target. It
   does not resolve today, which means the dashboard's Preview links are dead
   and every claim PR writes a CNAME to a name that doesn't exist.
3. **Wildcard host acceptance for `*.is-pinoy.dev` on that target.** This is the
   easy one to miss. Cloudflare forwards the *original* Host
   (`juan.is-pinoy.dev`) to the origin, and `proxy.ts` depends on that. If the
   platform doesn't recognise the hostname it answers with its own 404 and this
   app never runs — so the wildcard has to be attached to this project, and the
   existing explicit assignments (`dashboard.is-pinoy.dev`, the apex) must still
   win over it.
4. **`GITHUB_TOKEN` in the deploy environment.** See `.env.example`; without it
   the renderer 404s as soon as the anonymous rate limit is hit.

Universal SSL already covers `*.is-pinoy.dev` at one level, so no per-user
certificate provisioning is needed.
