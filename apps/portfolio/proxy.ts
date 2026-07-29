import { NextResponse, type NextRequest } from "next/server"
import { RESERVED_SUBDOMAINS } from "@is-pinoy-dev/validate/reserved"

// Host → subdomain routing. In production every portfolio request arrives as
// `<label>.is-pinoy.dev` (CNAME → portfolio.is-pinoy.dev) and we extract the
// label into `x-portfolio-subdomain`, which lib/context.ts reads to resolve the
// domains-repo file. The apex, the renderer host itself, and reserved names
// carry no label and fall through to the page's 404.
const ROOT_DOMAIN = process.env.PORTFOLIO_ROOT_DOMAIN ?? "is-pinoy.dev"

// Requests for a claimed portfolio don't arrive with their own Host: Vercel
// only answers for hostnames registered on the project, and neither way of
// registering `*.is-pinoy.dev` is available (wildcards need Vercel's
// nameservers; per-hostname is capped at 50 on the free plan). The
// tools-portfolio-proxy Worker therefore rewrites them onto this host and
// carries the label in a header, authenticated by a shared secret. Unset means
// no proxy is deployed and the header is never honoured.
const SUBDOMAIN_HEADER = "x-portfolio-subdomain"
const SECRET_HEADER = "x-portfolio-proxy-secret"
const LABEL_PATTERN = /^[a-z0-9-]{1,63}$/

// The same list the registry validates claims against, so a name that can never
// own a `subdomains/<name>.json` file never costs us a lookup either. Imported
// from the `./reserved` subpath rather than the package root to keep zod and the
// rest of the validator out of the proxy bundle.
const RESERVED = new Set(RESERVED_SUBDOMAINS)

export default function proxy(req: NextRequest) {
  const host = req.headers.get("host")?.split(":")[0] ?? ""
  const label = extractLabel(host) ?? proxiedLabel(req)

  const headers = new Headers(req.headers)
  // Both headers are ours to set, never the client's to send. Without these
  // deletes an inbound copy survives on any host we can't extract a label from
  // — this host, a *.vercel.app URL, localhost — and lib/context.ts would
  // render whatever subdomain the caller named on an origin that isn't theirs.
  // Delete unconditionally, then set only what we established ourselves.
  headers.delete(SUBDOMAIN_HEADER)
  headers.delete(SECRET_HEADER)
  if (label) headers.set(SUBDOMAIN_HEADER, label)

  return NextResponse.next({ request: { headers } })
}

/**
 * The label supplied by the Worker, once its shared secret checks out.
 *
 * Reached only when the Host carries no label of its own, which is exactly the
 * case for a proxied request: the Worker rewrites onto this host, so `Host` is
 * `portfolio.is-pinoy.dev` and the real subdomain is in the header.
 */
function proxiedLabel(req: NextRequest): string | null {
  const secret = process.env.PORTFOLIO_PROXY_SECRET
  if (!secret) return null
  const presented = req.headers.get(SECRET_HEADER)
  if (!presented || !secretMatches(presented, secret)) return null

  const label = req.headers.get(SUBDOMAIN_HEADER)
  // The Worker already constrains this, but the shape is what keeps
  // lib/resolve.ts from interpolating a path escape into its fetch URL, and
  // this is the last place that can enforce it.
  return label && LABEL_PATTERN.test(label) ? label : null
}

/** Constant-time over equal-length input; `timingSafeEqual` isn't available here. */
function secretMatches(presented: string, expected: string): boolean {
  if (presented.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < presented.length; i++) {
    diff |= presented.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

function extractLabel(host: string): string | null {
  if (!host.endsWith(`.${ROOT_DOMAIN}`)) return null
  const label = host.slice(0, -`.${ROOT_DOMAIN}`.length)
  // Single-level labels only; reject nested and reserved names.
  if (!label || label.includes(".") || RESERVED.has(label)) return null
  return label
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
}
