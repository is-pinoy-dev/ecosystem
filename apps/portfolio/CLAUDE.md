# CLAUDE.md — apps/portfolio

Guidance for working in the `portfolio` app specifically. See the root
`CLAUDE.md` for monorepo-wide commands, the Banig Grid v2 design system, and
component/styling rules — all of it applies here.

## What this is

The hosted-portfolio renderer. Any subdomain whose `is-pinoy-dev/domains` file
has a `portfolio` block points its CNAME here; this app renders that owner's
GitHub profile README (`github.com/<user>/<user>`) plus profile metadata in
their chosen template. Next.js App Router, one dynamic route, ISR-cached (1h)
upstream GitHub fetches.

## Commands

```bash
pnpm --filter portfolio dev         # http://localhost:3002
pnpm --filter portfolio build
pnpm --filter portfolio typecheck
pnpm --filter portfolio lint
pnpm --filter portfolio test        # vitest run
```

Local dev has no wildcard DNS, so there's no subdomain in the `Host` header.
Use `?preview=1&github=<login>&template=terminal&theme=gold-dark` (no env
needed), or set `PORTFOLIO_SPIKE_SUBDOMAIN`/`PORTFOLIO_SPIKE_LOGIN` and open
`/`. To exercise real Host-based routing: `curl -H "Host: juan.is-pinoy.dev"
http://localhost:3002/`. See `.env.example` for every variable.

## Request lifecycle

```
juan.is-pinoy.dev → Cloudflare → tools/portfolio-proxy Worker (rewrites Host,
  adds x-portfolio-subdomain + shared secret) → Vercel → this app
    proxy.ts        strips the apex, sets x-portfolio-subdomain
    lib/resolve.ts  reads subdomains/juan.json — no file/no portfolio block → 404
    lib/github.ts   fetches profile, repos, README (ISR-cached)
    lib/parse.ts    sanitizes README markdown/HTML to safe HTML
    lib/seo.ts      derives title/description/canonical/icons/theme/JSON-LD
    templates/      renders the chosen template + theme
```

Vercel can't serve wildcard/unbounded per-hostname routing (nameserver and
50-domain-per-project limits), so the dynamic per-subdomain part lives on
Cloudflare via `tools/portfolio-proxy`. Read that package's README before
touching anything in this chain.

## Security — read before touching `lib/parse.ts` or `next.config.mjs`

READMEs are arbitrary third-party markdown **and** HTML served on
`*.is-pinoy.dev`, a cookie domain shared with the dashboard — a sanitizer
regression is stored XSS against every other subdomain.

- `tests/parse.test.ts` is a release blocker, not an optional suite. Add a
  case for any new sanitization vector before changing `lib/parse.ts`.
- `next.config.mjs` sets a deliberately narrow CSP as a second layer:
  `img-src` limited to the allow-listed hosts, `object-src`/`form-action`/
  `frame-ancestors 'none'`, `base-uri 'self'`. It sets **no** `default-src`,
  `script-src`, or `style-src` — Next's inline hydration scripts need
  per-request nonces to restrict those safely, and a half-configured CSP that
  blanks the page is worse than a narrow one that holds.
- `tests/csp.test.ts` pins the image allow-list identical across the
  sanitizer, the CSP, and `images.remotePatterns` — keep those three in sync.

## Key notes

- Only a **claimed** subdomain gets a canonical URL, structured data (JSON-LD),
  or an install manifest. Preview mode (`?preview=1`) and the
  `PORTFOLIO_SPIKE_*` fallback are both non-canonical demo surfaces and must
  never leak into `robots`, `sitemap`, or `<link rel=canonical>`.
- `robots.ts` and `sitemap.ts` must answer from the subdomain + one cached
  domains-repo lookup only — never a live GitHub call, so a crawler can't burn
  the API budget that renders pages.
- `theme-color`/manifest colors come from `backgroundFor()`, which mirrors
  `themes.css`/`designer-themes.css` — a new template needs no separate list
  update; `tests/seo.test.ts` pins this.
