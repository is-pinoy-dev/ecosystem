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

Cloudflare Workers was considered and rejected *for now*. Workers routes match on
the **request** hostname, not the CNAME target, so a route on
`portfolio.is-pinoy.dev/*` would never fire for `juan.is-pinoy.dev` — it would
have to be `*.is-pinoy.dev/*`, which matches all traffic entering the zone. That
puts the Worker in front of every proxied subdomain in the registry, including
everyone pointing at their own host, so a bug in its pass-through takes down the
whole registry rather than just portfolios. Vercel's wildcard is passive by
comparison: traffic arrives only if a CNAME sends it there.

Workers becomes the better home if the resolver ever moves off per-request
GitHub fetches and into KV — that would drop `raw.githubusercontent.com` out of
the hot path and is a real improvement, but it is its own project.

### Runbook

Done: the Vercel project (root directory `apps/portfolio`), its `GITHUB_TOKEN`,
and the `portfolio.is-pinoy.dev` DNS record. What remains is the wildcard — a
claimed subdomain does **not** render until step 1 lands.

1. **Add `*.is-pinoy.dev` as a domain on the portfolio project.** This is the
   step that makes claimed subdomains work at all. Cloudflare forwards the
   original Host (`juan.is-pinoy.dev`); if no Vercel project claims that
   hostname, Vercel answers with its own 404 and this app never runs. Expect
   two DNS records from Vercel:
   - a `_vercel` TXT for domain verification — note that name already holds
     per-subdomain `vc-domain-verify=` tokens for users pointing at their own
     Vercel projects, so **add** to the record set rather than replacing it;
   - an `_acme-challenge.is-pinoy.dev` record for the wildcard certificate.
     Wildcards can only be issued over DNS-01, so there is no way to skip this.

   The absence of `_acme-challenge.is-pinoy.dev` in the zone is the quickest
   way to tell from outside that this step hasn't been done yet.
2. **Re-check the neighbours.** Immediately after adding the wildcard, load
   `dashboard.is-pinoy.dev`, `www`, and the apex to confirm their explicit
   project assignments still beat it. This is the step most likely to bite.
   `docs` and `status` never reach Vercel at all — they resolve to Cloudflare —
   so the blast radius is limited to the Vercel-hosted names.
3. **Claim one subdomain end to end** and watch the whole chain: PR opens
   against the domains repo → CI validates the `portfolio` block → merge → sync
   writes the DNS record → the subdomain renders.

On the orange cloud: `/claim` writes `proxied: true` for portfolio subdomains
(`apps/dashboard/lib/claim-portfolio.ts`), while the renderer host itself stays
grey. That combination is deliberate, not drift — Cloudflare follows the in-zone
CNAME through to Vercel and preserves the original Host, and proxying is what
lets the `*.is-pinoy.dev/_tools/*` Worker routes fire and edge analytics record
the visit. `app/page.tsx` depends on it directly: a claimed portfolio's OG card
is served from its own `/_tools/og/image`. Keep the zone on Full or Full
(strict) SSL; under strict it is the Vercel wildcard certificate from step 1
that makes the origin leg valid.

Universal SSL already covers `*.is-pinoy.dev` at one level, so there is no
per-user certificate provisioning.
