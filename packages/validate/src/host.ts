// Identifying the host a subdomain is served by, from its DNS records alone.
//
// The registry stores DNS, not "who hosts this" — but the CNAME target is a
// reliable fingerprint for the handful of hosts our users actually use. Two
// surfaces read that fingerprint and must agree on it: the dashboard, which
// shows a provider mark and decides whether a record may be proxied, and the
// public showcase, which labels a card by what it points at. The matchers
// therefore live here rather than in either app.
//
// This is identification, not validation — an unrecognised target is a host we
// have no fingerprint for, never an error.

export const HOST_PROVIDER_IDS = [
  "portfolio",
  "vercel",
  "github",
  "netlify",
  "cloudflare",
] as const

export type HostProviderId = (typeof HOST_PROVIDER_IDS)[number]

/** Display names, for surfaces that show the host rather than act on it. */
export const HOST_PROVIDER_NAMES: Record<HostProviderId, string> = {
  portfolio: "is-pinoy.dev portfolio",
  vercel: "Vercel",
  github: "GitHub Pages",
  netlify: "Netlify",
  cloudflare: "Cloudflare Pages",
}

/** The CNAME target every hosted portfolio points at. */
export const PORTFOLIO_RENDERER_HOST = "portfolio.is-pinoy.dev"

// Ordered most specific first: a hosted portfolio is an is-pinoy.dev CNAME and
// has to be matched before any generic rule could claim it.
const MATCHERS: { id: HostProviderId; test: (target: string) => boolean }[] = [
  { id: "portfolio", test: (t) => t === PORTFOLIO_RENDERER_HOST },
  {
    id: "vercel",
    test: (t) =>
      /(^|\.)vercel\.app$/.test(t) || /vercel-dns[^.]*\.com$/.test(t),
  },
  { id: "github", test: (t) => /(^|\.)github\.io$/.test(t) },
  { id: "netlify", test: (t) => /(^|\.)netlify\.(app|com)$/.test(t) },
  { id: "cloudflare", test: (t) => /(^|\.)pages\.dev$/.test(t) },
]

/** Normalise a DNS value for matching: no trailing dot, lower case. */
export function normalizeHostTarget(target: string): string {
  return target.trim().replace(/\.$/, "").toLowerCase()
}

/** The host a CNAME target points at, or null when it is not one we know. */
export function hostProviderForTarget(target: string): HostProviderId | null {
  const normalized = normalizeHostTarget(target)
  return MATCHERS.find((m) => m.test(normalized))?.id ?? null
}

/** The DNS value of a record entry, whatever shape it is written in. */
function entryValue(entry: unknown): string | null {
  if (typeof entry === "string") return entry
  if (entry && typeof entry === "object" && "value" in entry) {
    const value = (entry as { value?: unknown }).value
    if (typeof value === "string") return value
  }
  return null
}

/**
 * The host a whole subdomain is served by, inferred from its CNAME. A records
 * point at bare IPs, which identify nothing, so those return null rather than
 * guessing.
 */
export function hostProviderForRecords(
  records: Record<string, unknown>
): HostProviderId | null {
  const raw = records.CNAME
  if (raw === undefined || raw === null) return null

  const list = Array.isArray(raw) ? raw : [raw]
  for (const entry of list) {
    const value = entryValue(entry)
    if (!value) continue
    const id = hostProviderForTarget(value)
    if (id) return id
  }
  return null
}
