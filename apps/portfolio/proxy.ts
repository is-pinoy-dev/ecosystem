import { NextResponse, type NextRequest } from "next/server"

// Host → subdomain routing. In production every portfolio request arrives as
// `<label>.is-pinoy.dev` (CNAME → portfolio.is-pinoy.dev). We extract the label
// and hand it to the page via a request header so the resolver can look up the
// domains-repo file. Apex, `www`, and the bare renderer host carry no label and
// pass through (the page's spike fallback handles them for now).
//
// NOTE: for the Phase 2 spike the page is still driven by env vars; this proxy
// is wired and documented so Phase 3 only has to switch the page from env to
// reading the `x-portfolio-subdomain` header.
const ROOT_DOMAIN = process.env.PORTFOLIO_ROOT_DOMAIN ?? "is-pinoy.dev"
const RESERVED = new Set(["www", "portfolio"])

export default function proxy(req: NextRequest) {
  const host = req.headers.get("host")?.split(":")[0] ?? ""
  const label = extractLabel(host)

  const headers = new Headers(req.headers)
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
