import { z } from "zod"
import {
  singleOrArray,
  aRecord,
  cnameRecord,
  txtRecord,
  dnsRecordSchema,
} from "./records.js"

export const domainFeaturesSchema = z
  .object({
    // Opt-in tools served at /_tools/*. Absent or false means off.
    tools: z
      .object({
        "site-audit": z.boolean(),
        og: z.boolean(),
      })
      .partial()
      .optional(),
    // Opt-OUT of platform visit analytics, unlike everything else here. Traffic
    // to a proxied subdomain is measured at Cloudflare's edge whether we ask for
    // it or not, so the only honest control is at collection: set this to false
    // and the analytics worker drops the subdomain before anything is stored.
    // Absent means analytics are collected (see apps/web/app/privacy).
    analytics: z.boolean().optional(),
  })
  .partial()
  .optional()

// "Layout" templates are styled by `theme` via the shared shell. "Designer"
// templates are complete, self-contained designs (own layout, type, and color)
// and ignore `theme` entirely. Exported so the renderer and the dashboard stop
// re-declaring these lists — they were previously duplicated in four places.
export const LAYOUT_TEMPLATES = ["terminal", "pixel-card", "minimal"] as const
export const DESIGNER_TEMPLATES = [
  "concrete",
  "broadsheet",
  "phosphor",
  "draft",
  "bubblegum",
  "grid",
] as const

export const templateSchema = z.enum([
  ...LAYOUT_TEMPLATES,
  ...DESIGNER_TEMPLATES,
])

/** Themes shipped by the platform, defined in apps/portfolio/app/themes.css. */
export const BUILTIN_THEMES = [
  "gold-dark",
  "mono",
  "matrix",
  "midnight",
  "crimson",
  "sunset",
] as const

export const builtinThemeSchema = z.enum(BUILTIN_THEMES)

// `@<github-username>/<slug>` — the author segment is a real GitHub login
// (1-39 chars, no leading/trailing/consecutive hyphens) so a theme id is always
// traceable to an account.
const THEME_ID = /^@[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}\/[a-z0-9]+(?:-[a-z0-9]+)*$/

// Exact semver only — deliberately no ranges (`^1.2.0`, `~1.2`, `latest`). A
// range would let a theme author change what renders on a subdomain without
// that subdomain's owner opening a PR, which is precisely the silent-update
// problem pinning exists to prevent. Prerelease tags are allowed; build
// metadata is not, since it does not affect resolution.
const SEMVER_EXACT =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/

/** A community theme, pinned to one exact published version. */
export const communityThemeSchema = z.object({
  id: z
    .string()
    .regex(THEME_ID, "Theme id must look like @github-username/theme-name"),
  version: z
    .string()
    .regex(SEMVER_EXACT, "Pin an exact version, e.g. 1.2.0 — ranges are not allowed"),
})

export const themeSchema = z.union([builtinThemeSchema, communityThemeSchema])

// Opt-in hosted portfolio. When present, the subdomain's CNAME points at our
// own renderer (portfolio.is-pinoy.dev) and this block tells the renderer which
// template/theme to use. Content itself comes from the owner's GitHub profile
// README at request time — nothing here duplicates that content. Inert to the
// registry/sync engine; only apps/portfolio reads it.
export const portfolioSchema = z
  .object({
    template: templateSchema,
    theme: themeSchema.optional(),
    // Optional allow-list / reordering of README sections by heading slug.
    // Omitted → render every section in document order.
    sections: z.array(z.string()).optional(),
  })
  .refine(
    (p) =>
      !(
        typeof p.theme === "object" &&
        (DESIGNER_TEMPLATES as readonly string[]).includes(p.template)
      ),
    {
      // A built-in theme alongside a designer template is merely redundant and
      // has always been tolerated. A *community* theme there is different: the
      // owner picked and pinned something specific, and a designer template
      // would silently discard it. Fail the claim instead of rendering
      // something the owner did not ask for.
      path: ["theme"],
      error:
        "Designer templates supply their own colors and ignore `theme`. Use a layout template (terminal, pixel-card, minimal) with a community theme.",
    }
  )
  .optional()

export const domainSchema = z.object({
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63)
    .regex(/^[a-z0-9-]+$/),
  owner: z.object({
    github: z.string(),
    email: z.email().optional(),
  }),
  records: z
    .object({
      A: singleOrArray(aRecord).optional(),
      CNAME: singleOrArray(cnameRecord).optional(),
      TXT: singleOrArray(txtRecord).optional(),
    })
    .refine(
      (r) => Object.keys(r).length > 0,
      "At least one record type required"
    ),
  features: domainFeaturesSchema,
  portfolio: portfolioSchema,
  destroy: z.boolean().optional(),
})

export const resolvedDomainSchema = domainSchema.extend({
  file: z.string(),
})

export const ResolvedDomainsSchema = z.array(resolvedDomainSchema)

export type ResolvedDomain = z.infer<typeof resolvedDomainSchema>
export type ResolvedDomains = z.infer<typeof ResolvedDomainsSchema>
export type Domain = z.infer<typeof domainSchema>
export type DomainFeatures = z.infer<typeof domainFeaturesSchema>
export type PortfolioConfig = z.infer<typeof portfolioSchema>
export type PortfolioTemplate = z.infer<typeof templateSchema>
export type BuiltinTheme = z.infer<typeof builtinThemeSchema>
export type CommunityTheme = z.infer<typeof communityThemeSchema>
export type PortfolioThemeRef = z.infer<typeof themeSchema>
export type DNSRecord = z.infer<typeof dnsRecordSchema>

/** Narrow a `portfolio.theme` to a pinned community theme. */
export function isCommunityTheme(
  theme: PortfolioThemeRef | undefined
): theme is CommunityTheme {
  return typeof theme === "object" && theme !== null
}

export * from "./records.js"
export * from "./action.js"
export * from "./provider.js"
