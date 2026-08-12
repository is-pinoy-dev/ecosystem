// Platform features: what they are, and reading/writing their flags in a record.
//
// Two levels, both stored in git and both edited from the dashboard:
//
//   records.{A,CNAME}.proxied  — the master switch. Cloudflare only sees a
//                                request it proxies, so nothing under /_tools/
//                                can run without it (docs/tools/index.mdx).
//   features.*                 — per-feature flags on top of that.
//
// The features are not uniform, and the registry is explicit about it:
//
//   toggle  + defaultEnabled false — opt-in, e.g. Site Audit.
//   toggle  + defaultEnabled true  — opt-OUT, e.g. analytics. Cloudflare
//                                    measures proxied traffic regardless, so
//                                    the switch controls collection, not
//                                    interception.
//   builtin — always on once proxied, no flag and no switch, e.g. OG images.
//
// Kept free of server-only imports so it can be unit tested.

export type FeatureKind = "toggle" | "builtin"

export interface PlatformFeature {
  id: string
  name: string
  description: string
  docsUrl: string
  kind: FeatureKind
  /**
   * Where the flag lives under `features`. Empty for a built-in, which has no
   * flag at all.
   */
  flagPath: string[]
  /** Value when the flag is absent — false for opt-in, true for opt-out. */
  defaultEnabled: boolean
}

export const FEATURES: PlatformFeature[] = [
  {
    id: "site-audit",
    name: "Site Audit",
    description:
      "Audit your site's SEO and OpenGraph metadata from /_tools/site-audit.",
    docsUrl: "https://docs.is-pinoy.dev/tools/site-audit",
    kind: "toggle",
    flagPath: ["tools", "site-audit"],
    defaultEnabled: false,
  },
  {
    id: "og",
    name: "OG Images",
    description:
      "A generated 1200x630 share card for your subdomain. Reference it from your page's meta tags to use it.",
    docsUrl: "https://docs.is-pinoy.dev/tools",
    // tools/og/worker only routes /_tools/og*, and serves any registered
    // subdomain without consulting a flag. It is available the moment the
    // domain is proxied, so presenting a switch would be fiction.
    kind: "builtin",
    flagPath: [],
    defaultEnabled: true,
  },
  {
    id: "analytics",
    name: "Visit analytics",
    description:
      "Daily visit counts for your subdomain, with the 30-day total shown on your showcase card. Switch off and your traffic is dropped before anything is stored — and the card stops showing a total.",
    docsUrl: "https://is-pinoy.dev/privacy",
    kind: "toggle",
    flagPath: ["analytics"],
    defaultEnabled: true,
  },
]

/** Features rendered with a switch. */
export const TOGGLEABLE_FEATURES = FEATURES.filter((f) => f.kind === "toggle")

/** Features that simply come with the platform, listed without a switch. */
export const BUILTIN_FEATURES = FEATURES.filter((f) => f.kind === "builtin")

export function findFeature(id: string): PlatformFeature | undefined {
  return FEATURES.find((feature) => feature.id === id)
}

function readPath(
  features: Record<string, unknown> | null | undefined,
  path: string[]
): unknown {
  let current: unknown = features
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

/**
 * Is this feature on for a record? Only an explicit boolean overrides the
 * feature's default, so a malformed value falls back rather than flipping the
 * meaning of the switch.
 */
export function isFeatureEnabled(
  features: Record<string, unknown> | null | undefined,
  feature: PlatformFeature
): boolean {
  if (feature.kind === "builtin") return true
  const value = readPath(features, feature.flagPath)
  return typeof value === "boolean" ? value : feature.defaultEnabled
}

/**
 * Set one feature's flag, returning a new features object. Never mutates, and
 * builds any missing nesting on the way down.
 */
export function setFeatureEnabled(
  features: Record<string, unknown> | null | undefined,
  feature: PlatformFeature,
  enabled: boolean
): Record<string, unknown> {
  const base =
    features && typeof features === "object"
      ? { ...(features as Record<string, unknown>) }
      : {}
  if (feature.flagPath.length === 0) return base

  const [head, ...rest] = feature.flagPath as [string, ...string[]]
  if (rest.length === 0) {
    return { ...base, [head]: enabled }
  }

  const nested =
    base[head] && typeof base[head] === "object"
      ? (base[head] as Record<string, unknown>)
      : {}
  return {
    ...base,
    [head]: setFeatureEnabled(nested, { ...feature, flagPath: rest }, enabled),
  }
}
