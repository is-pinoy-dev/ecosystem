// Front door for hosted portfolios.
//
// `juan.is-pinoy.dev` is a proxied CNAME to the renderer, which runs on Vercel.
// Vercel routes purely on the Host header and answers its own 404 for any
// hostname not registered on the project — and neither way of registering them
// is open to us: a wildcard domain requires Vercel's nameservers (the zone
// stays on Cloudflare), and per-hostname registration is capped at 50 domains
// per project on the free plan, which is a ceiling on total portfolios.
//
// So this Worker rewrites the request onto `portfolio.is-pinoy.dev` — a
// hostname Vercel does own — and carries the real label in a header. Cloudflare
// still terminates TLS for the visitor with Universal SSL, which covers one
// level of `*.is-pinoy.dev`, so no per-portfolio certificate exists to provision.
//
// Routes are created one per claimed portfolio by `is-pinoy registry sync`
// (see packages/registry/src/core/routes.ts), never `*.is-pinoy.dev/*`.
export interface Env {
  ROOT_DOMAIN: string
  RENDERER_HOST: string
  /** Shared with the renderer; see apps/portfolio/proxy.ts. */
  PORTFOLIO_PROXY_SECRET: string
  OG: Fetcher
  SITE_AUDIT: Fetcher
}

const SUBDOMAIN_HEADER = "x-portfolio-subdomain"
const SECRET_HEADER = "x-portfolio-proxy-secret"

/** The renderer interpolates this into a raw.githubusercontent.com path. */
const LABEL_PATTERN = /^[a-z0-9-]{1,63}$/

function extractLabel(hostname: string, rootDomain: string): string | null {
  const suffix = `.${rootDomain}`
  if (!hostname.endsWith(suffix)) return null
  const label = hostname.slice(0, -suffix.length)
  return LABEL_PATTERN.test(label) ? label : null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Nothing should reach this Worker but a claimed portfolio, since sync owns
    // the routes. A hand-added route, or the renderer host itself, would loop
    // forever without this guard — pass it to the origin untouched instead.
    if (url.hostname === env.RENDERER_HOST) return fetch(request)
    const label = extractLabel(url.hostname, env.ROOT_DOMAIN)
    if (!label) return fetch(request)

    // The platform tools stay on their own Workers. Explicit service bindings
    // rather than trusting Cloudflare's precedence between this Worker's
    // `<label>.is-pinoy.dev/*` route and the tools' `*.is-pinoy.dev/_tools/*`
    // ones: app/page.tsx builds a claimed portfolio's OG card from
    // /_tools/og/image, and that must not resolve to the portfolio's own HTML.
    if (url.pathname.startsWith("/_tools/og")) return env.OG.fetch(request)
    if (url.pathname.startsWith("/_tools/site-audit")) {
      return env.SITE_AUDIT.fetch(request)
    }

    const upstream = new URL(url)
    upstream.hostname = env.RENDERER_HOST

    const headers = new Headers(request.headers)
    // Host is derived from the subrequest URL; carrying the visitor's copy
    // through would just contradict it.
    headers.delete("host")
    // Both are set unconditionally, so an inbound copy from the visitor is
    // overwritten rather than forwarded.
    headers.set(SUBDOMAIN_HEADER, label)
    headers.set(SECRET_HEADER, env.PORTFOLIO_PROXY_SECRET)

    return fetch(
      new Request(upstream, {
        method: request.method,
        headers,
        body: request.body,
        // The renderer's redirects are the visitor's to follow, on the
        // visitor's hostname — not ours to resolve against the renderer host.
        redirect: "manual",
      }),
    )
  },
}
