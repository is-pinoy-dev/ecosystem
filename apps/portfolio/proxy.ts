import { NextResponse, type NextRequest } from "next/server"
import { RESERVED_SUBDOMAINS } from "@is-pinoy-dev/validate/reserved"

// Host → subdomain routing. In production every portfolio request arrives as
// `<label>.is-pinoy.dev` (CNAME → portfolio.is-pinoy.dev) and we extract the
// label into `x-portfolio-subdomain`, which lib/context.ts reads to resolve the
// domains-repo file. The apex, the renderer host itself, and reserved names
// carry no label and fall through to the page's 404.
const ROOT_DOMAIN = process.env.PORTFOLIO_ROOT_DOMAIN ?? "is-pinoy.dev"

// The same list the registry validates claims against, so a name that can never
// own a `subdomains/<name>.json` file never costs us a lookup either. Imported
// from the `./reserved` subpath rather than the package root to keep zod and the
// rest of the validator out of the proxy bundle.
const RESERVED = new Set(RESERVED_SUBDOMAINS)

export default function proxy(req: NextRequest) {
  const host = req.headers.get("host")?.split(":")[0] ?? ""
  const label = extractLabel(host)

  const headers = new Headers(req.headers)
  // `x-portfolio-subdomain` is ours to set, never the client's to send. Without
  // this delete an inbound copy survives on any host we can't extract a label
  // from — the renderer host, a *.vercel.app URL, localhost — and lib/context.ts
  // would render whatever subdomain the caller named on an origin that isn't
  // theirs. Delete unconditionally, then set only what we derived from Host.
  headers.delete("x-portfolio-subdomain")
  if (label) headers.set("x-portfolio-subdomain", label)

  return NextResponse.next({ request: { headers } })
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
