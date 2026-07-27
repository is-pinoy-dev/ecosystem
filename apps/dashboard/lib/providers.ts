// Identifying the host a subdomain points at, from its DNS records alone.
//
// The registry does not store "who hosts this" — it stores DNS. But the CNAME
// target is a reliable fingerprint for the handful of hosts our users actually
// use, so the listing can show a provider mark instead of leaving a bare
// hostname to be decoded by eye.
//
// Icon paths are the official marks from Simple Icons (CC0-1.0, simpleicons.org),
// inlined as 24x24 path data rather than pulled in as a dependency. `brand` is
// the official colour; marks whose brand colour is black render in currentColor
// instead so they stay visible on a dark background.

/**
 * Whether a host tolerates being proxied through our Cloudflare zone.
 *
 *   optional  — the owner's choice; proxying works.
 *   forbidden — proxying breaks the site. Documented per provider; see `note`.
 *   required  — the site only works proxied.
 */
export type ProxySupport = "optional" | "forbidden" | "required"

export interface Provider {
  id: string
  name: string
  /** 24x24 SVG path data for the mark. */
  path: string
  /** Official brand colour, or null to inherit the surrounding text colour. */
  brand: string | null
  proxySupport: ProxySupport
  /** Why, when proxying is not the owner's to choose. */
  note?: string
}

export const PROVIDERS = {
  vercel: {
    id: "vercel",
    name: "Vercel",
    path: "m12 1.608 12 20.784H0Z",
    brand: null,
    proxySupport: "optional",
  },
  github: {
    id: "github",
    name: "GitHub Pages",
    path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
    brand: null,
    // docs/guides/providers/github-pages.mdx: the record must stay DNS-only so
    // GitHub can verify the domain and issue the HTTPS certificate.
    proxySupport: "forbidden",
    note: "GitHub Pages needs a DNS-only record to verify your domain and issue its HTTPS certificate.",
  },
  netlify: {
    id: "netlify",
    name: "Netlify",
    path: "M6.49 19.04h-.23L5.13 17.9v-.23l1.73-1.71h1.2l.15.15v1.2L6.5 19.04ZM5.13 6.31V6.1l1.13-1.13h.23L8.2 6.68v1.2l-.15.15h-1.2L5.13 6.31Zm9.96 9.09h-1.65l-.14-.13v-3.83c0-.68-.27-1.2-1.1-1.23-.42 0-.9 0-1.43.02l-.07.08v4.96l-.14.14H8.9l-.13-.14V8.73l.13-.14h3.7a2.6 2.6 0 0 1 2.61 2.6v4.08l-.13.14Zm-8.37-2.44H.14L0 12.82v-1.64l.14-.14h6.58l.14.14v1.64l-.14.14Zm17.14 0h-6.58l-.14-.14v-1.64l.14-.14h6.58l.14.14v1.64l-.14.14ZM11.05 6.55V1.64l.14-.14h1.65l.14.14v4.9l-.14.14h-1.65l-.14-.13Zm0 15.81v-4.9l.14-.14h1.65l.14.13v4.91l-.14.14h-1.65l-.14-.14Z",
    brand: "#00C7B7",
    proxySupport: "optional",
  },
  cloudflare: {
    id: "cloudflare",
    name: "Cloudflare Pages",
    path: "M10.715 14.32H5.442l-.64-1.203L13.673 0l1.397.579-1.752 9.112h5.24l.648 1.192L10.719 24l-1.412-.54ZM4.091 5.448a.5787.5787 0 1 1 0-1.1574.5787.5787 0 0 1 0 1.1574zm1.543 0a.5787.5787 0 1 1 0-1.1574.5787.5787 0 0 1 0 1.1574zm1.544 0a.5787.5787 0 1 1 0-1.1574.5787.5787 0 0 1 0 1.1574zm8.657-2.7h5.424l.772.771v16.975l-.772.772h-7.392l.374-.579h6.779l.432-.432V3.758l-.432-.432h-4.676l-.552 2.85h-.59l.529-2.877.108-.552ZM2.74 21.265l-.772-.772V3.518l.772-.771h7.677l-.386.579H2.98l-.432.432v16.496l.432.432h5.586l-.092.579zm1.157-1.93h3.28l-.116.58h-3.55l-.192-.193v-3.473l.578 1.158zm13.117 0 .579.58H14.7l.385-.58z",
    brand: "#F38020",
    // docs/guides/providers/cloudflare-pages.mdx: proxying across two
    // Cloudflare accounts is rejected with Error 1014 CNAME Cross-User Banned.
    proxySupport: "forbidden",
    note: "Proxying a pages.dev target across two Cloudflare accounts is rejected with Error 1014.",
  },
  // Our own hosted renderer. Drawn as the site's starburst mark rather than
  // borrowed from a third party.
  portfolio: {
    id: "portfolio",
    name: "is-pinoy.dev portfolio",
    path: "M12 2v20M2 12h20M4.929 4.929l14.142 14.142M19.071 4.929L4.929 19.071",
    brand: null,
    proxySupport: "required",
    note: "Hosted portfolios are served through our renderer, which is only reachable proxied.",
  },
} as const satisfies Record<string, Provider>

export type ProviderId = keyof typeof PROVIDERS

/** The portfolio mark is strokes, not filled shapes, so it renders differently. */
export const STROKE_PROVIDERS: readonly ProviderId[] = ["portfolio"]

/**
 * Match a DNS target to a known host. Ordered most specific first — a hosted
 * portfolio is a is-pinoy.dev CNAME and must be matched before any generic rule.
 */
const MATCHERS: { id: ProviderId; test: (target: string) => boolean }[] = [
  { id: "portfolio", test: (t) => t === "portfolio.is-pinoy.dev" },
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
function normalizeTarget(target: string): string {
  return target.trim().replace(/\.$/, "").toLowerCase()
}

/** The host a CNAME target points at, or null when it is not one we know. */
export function providerForTarget(target: string): Provider | null {
  const normalized = normalizeTarget(target)
  const match = MATCHERS.find((m) => m.test(normalized))
  return match ? PROVIDERS[match.id] : null
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
export function providerForRecords(
  records: Record<string, unknown>
): Provider | null {
  const raw = records.CNAME
  if (raw === undefined || raw === null) return null

  const list = Array.isArray(raw) ? raw : [raw]
  for (const entry of list) {
    const value = entryValue(entry)
    if (!value) continue
    const provider = providerForTarget(value)
    if (provider) return provider
  }
  return null
}
