import { lookupSubdomain, isHostedPortfolio, type WaitUntil } from "./domains"

/** Mirrors tools/portfolio-proxy's [vars] plus its secret. */
export interface PortfolioEnv {
  ROOT_DOMAIN?: string
  RENDERER_HOST?: string
  PORTFOLIO_PROXY_SECRET?: string
}

export interface Upstream {
  url: URL
  headers: Record<string, string>
  /** True when we addressed the renderer on the target's behalf. */
  rewritten: boolean
}

const LABEL_PATTERN = /^[a-z0-9-]{1,63}$/

/**
 * Where to actually fetch `target` from.
 *
 * A *hosted portfolio* is only reachable at its own hostname because a Workers
 * route rewrites the request onto the renderer — and a `fetch()` from inside a
 * Worker to its own zone does not re-run that zone's routes. Cloudflare skips
 * them to keep Workers from recursing, so this subrequest would bypass
 * portfolio-proxy, reach the origin still carrying the portfolio's hostname,
 * and fail the handshake against a certificate that does not cover it — HTTP
 * 525, for a page that serves perfectly to a browser. For those we do what
 * portfolio-proxy does: address the renderer directly and carry the label in a
 * header, authenticated by the shared secret.
 *
 * But most subdomains are not hosted portfolios. `jappe.is-pinoy.dev` is a
 * CNAME to its owner's own Vercel project, and rewriting it onto the renderer
 * asks a completely different origin for a portfolio that was never claimed —
 * the renderer answers 404 (`no-portfolio-block`), and the audit reports that
 * 404 against a site that serves 200 to every browser. Being a subdomain of
 * our zone is therefore not the test; carrying a `portfolio` block in the
 * domains repo is, which is the same fact the renderer resolves on.
 *
 * Anything else — the apex, an external site, an unclaimed name — is fetched
 * as asked. So is a target we could not resolve: with GitHub unreachable the
 * honest failure for a portfolio is a connection error at its real address,
 * which beats a 404 misattributed to whoever owns the name.
 */
export async function upstreamFor(
  target: URL,
  env: PortfolioEnv,
  ctx?: WaitUntil,
): Promise<Upstream> {
  const plain: Upstream = { url: target, headers: {}, rewritten: false }
  const { ROOT_DOMAIN, RENDERER_HOST, PORTFOLIO_PROXY_SECRET } = env
  if (!ROOT_DOMAIN || !RENDERER_HOST || !PORTFOLIO_PROXY_SECRET) return plain

  const suffix = `.${ROOT_DOMAIN}`
  if (!target.hostname.endsWith(suffix)) return plain
  const label = target.hostname.slice(0, -suffix.length)
  // Nested labels and the renderer host itself are not portfolios.
  if (!LABEL_PATTERN.test(label) || target.hostname === RENDERER_HOST) {
    return plain
  }

  // Keyed on the *target's* label, never the host this tool is being served
  // from: /audit-proxy takes a url parameter, so the two need not agree.
  const lookup = await lookupSubdomain(label, ctx)
  if (lookup.status !== "found" || !isHostedPortfolio(lookup.record)) {
    return plain
  }

  const url = new URL(target)
  url.hostname = RENDERER_HOST
  return {
    url,
    headers: {
      "x-portfolio-subdomain": label,
      "x-portfolio-proxy-secret": PORTFOLIO_PROXY_SECRET,
    },
    rewritten: true,
  }
}
