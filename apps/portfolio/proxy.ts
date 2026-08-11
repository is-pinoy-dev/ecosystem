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

/**
 * How this request got its label, echoed on every response as
 * `x-portfolio-route`. A claimed portfolio that 404s is otherwise
 * indistinguishable from a name nobody ever claimed, and the difference is
 * usually one of these verdicts — reachable with `curl -I`, no dashboards.
 *
 * `no-secret` and `secret-mismatch` are reported apart deliberately. Rendering
 * versus 404ing is already a match/no-match oracle for anyone probing, so naming
 * which one happened leaks no secret material; what it adds is the one fact this
 * app cannot otherwise tell you — whether the running deployment has a secret at
 * all. Vercel binds env vars to a deployment, so a value added to the project and
 * never redeployed reads here as `no-secret`.
 */
export type RouteVerdict =
  /** Label came from the Host header — direct, unproxied. */
  | "host"
  /** Label came from the Worker and its secret matched. */
  | "worker"
  /** Host carries no label and the Worker presented nothing. Apex or preview. */
  | "unlabelled"
  /** The Worker presented a label, but this deployment has no secret to check. */
  | "no-secret"
  /** A secret was presented and did not match. Check for a trailing newline. */
  | "secret-mismatch"
  /** Secret matched, but the label was malformed — the Worker should not emit this. */
  | "bad-label"

const ROUTE_HEADER = "x-portfolio-route"

// Indexing, stated at the transport level as well as in the page's <meta>.
//
// The two must agree, and they're decided by the same fact: a request carrying
// a label is somebody's portfolio at its own address, and anything else — the
// apex, the renderer host, a `?preview=` of an arbitrary login — is our content
// served from an address that isn't its home. app/page.tsx derives the meta
// robots from exactly this condition.
//
// The header earns its place on the responses that have no <meta> to carry the
// directive: robots.txt, the sitemap, the manifest. On a labelled name that
// turns out unclaimed the page 404s and app/not-found.tsx says `noindex`; a
// conflict resolves to the more restrictive of the two, which is the one we
// want there anyway.
const ROBOTS_HEADER = "X-Robots-Tag"
const INDEXABLE =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
const NOINDEX = "noindex, nofollow"

export default function proxy(req: NextRequest) {
  const host = req.headers.get("host")?.split(":")[0] ?? ""
  const fromHost = extractLabel(host)
  const { label, verdict } = fromHost
    ? { label: fromHost, verdict: "host" as const }
    : proxiedLabel(req)

  const headers = new Headers(req.headers)
  // Both headers are ours to set, never the client's to send. Without these
  // deletes an inbound copy survives on any host we can't extract a label from
  // — this host, a *.vercel.app URL, localhost — and lib/context.ts would
  // render whatever subdomain the caller named on an origin that isn't theirs.
  // Delete unconditionally, then set only what we established ourselves.
  headers.delete(SUBDOMAIN_HEADER)
  headers.delete(SECRET_HEADER)
  if (label) headers.set(SUBDOMAIN_HEADER, label)

  const res = NextResponse.next({ request: { headers } })
  res.headers.set(ROUTE_HEADER, verdict)
  res.headers.set(ROBOTS_HEADER, label ? INDEXABLE : NOINDEX)
  return res
}

/**
 * The label supplied by the Worker, once its shared secret checks out.
 *
 * Reached only when the Host carries no label of its own, which is exactly the
 * case for a proxied request: the Worker rewrites onto this host, so `Host` is
 * `portfolio.is-pinoy.dev` and the real subdomain is in the header.
 */
function proxiedLabel(req: NextRequest): {
  label: string | null
  verdict: RouteVerdict
} {
  const presented = req.headers.get(SECRET_HEADER)
  const secret = process.env.PORTFOLIO_PROXY_SECRET
  if (!secret) {
    // Nothing presented either: an ordinary request to the apex or a preview,
    // not a proxy that failed. Only a presented secret makes this a misconfig.
    return { label: null, verdict: presented ? "no-secret" : "unlabelled" }
  }
  if (!presented) return { label: null, verdict: "unlabelled" }
  if (!secretMatches(presented, secret)) {
    return { label: null, verdict: "secret-mismatch" }
  }

  const label = req.headers.get(SUBDOMAIN_HEADER)
  // The Worker already constrains this, but the shape is what keeps
  // lib/resolve.ts from interpolating a path escape into its fetch URL, and
  // this is the last place that can enforce it.
  if (!label || !LABEL_PATTERN.test(label)) {
    return { label: null, verdict: "bad-label" }
  }
  return { label, verdict: "worker" }
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

// Everything except build output and the brand image assets in public/. The
// exclusions are deliberately narrow: robots.txt, sitemap.xml and
// manifest.webmanifest are all per-portfolio and answer differently depending
// on the label, so they must keep going through here to get the header.
export const config = {
  matcher: [
    "/((?!_next|favicon\\.ico|.*\\.(?:png|jpe?g|gif|webp|svg|ico)$).*)",
  ],
}
