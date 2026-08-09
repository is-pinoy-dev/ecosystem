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

export const PORTFOLIO_LAYOUT_TEMPLATES = [
  "terminal",
  "pixel-card",
  "minimal",
] as const

export const PORTFOLIO_DESIGNER_TEMPLATES = [
  "concrete",
  "broadsheet",
  "phosphor",
  "draft",
  "bubblegum",
  "grid",
  "bento",
  "noir",
  "solar",
] as const

export const PORTFOLIO_TEMPLATES = [
  ...PORTFOLIO_LAYOUT_TEMPLATES,
  ...PORTFOLIO_DESIGNER_TEMPLATES,
] as const

export const PORTFOLIO_THEMES = [
  "gold-dark",
  "mono",
  "matrix",
  "midnight",
  "crimson",
  "sunset",
] as const

export const portfolioTemplateSchema = z.enum(PORTFOLIO_TEMPLATES)
export const portfolioThemeSchema = z.enum(PORTFOLIO_THEMES)

// Opt-in hosted portfolio. When present, the subdomain's CNAME points at our
// own renderer (portfolio.is-pinoy.dev) and this block tells the renderer which
// template/theme to use. Content itself comes from the owner's GitHub profile
// README at request time — nothing here duplicates that content. Inert to the
// registry/sync engine; only apps/portfolio reads it.
export const portfolioSchema = z
  .object({
    // The first three are "layout" templates styled by `theme`. The rest are
    // self-contained "designer themes" — each a complete design (layout + type
    // + color) that ignores `theme`.
    template: portfolioTemplateSchema,
    theme: portfolioThemeSchema.optional(),
    // Optional allow-list / reordering of README sections by heading slug.
    // Omitted → render every section in document order.
    sections: z.array(z.string()).optional(),
  })
  .optional()

export const domainSchema = z.object({
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63)
    .regex(/^[a-z0-9-]+$/),
  owner: z.object({
    github: z.string(),
    // GitHub's numeric account ID. A login can be renamed and then claimed by
    // somebody else; this cannot — it is issued once per account and never
    // reused. Ownership is matched on it wherever it is present, so a rename
    // no longer detaches someone from their own subdomains.
    //
    // Optional because every record written before this field existed lacks
    // it, and backfilling means asking GitHub for 45 logins. Records minted by
    // the dashboard carry it from the claim onward.
    id: z.number().int().positive().optional(),
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
export type DNSRecord = z.infer<typeof dnsRecordSchema>

export * from "./records.js"
export * from "./action.js"
export * from "./provider.js"
