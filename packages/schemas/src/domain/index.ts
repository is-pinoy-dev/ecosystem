import { z } from "zod"
import {
  singleOrArray,
  aRecord,
  cnameRecord,
  txtRecord,
  dnsRecordSchema,
} from "./records.js"

export const domainFeaturesSchema = z.object({
  tools: z.object({
    "site-audit": z.boolean(),
    "og": z.boolean(),
  }).partial().optional(),
}).partial().optional()

// Opt-in hosted portfolio. When present, the subdomain's CNAME points at our
// own renderer (portfolio.is-pinoy.dev) and this block tells the renderer which
// template/theme to use. Content itself comes from the owner's GitHub profile
// README at request time — nothing here duplicates that content. Inert to the
// registry/sync engine; only apps/portfolio reads it.
export const portfolioSchema = z
  .object({
    template: z.enum(["terminal", "pixel-card", "minimal"]),
    theme: z
      .enum(["gold-dark", "mono", "matrix", "midnight", "crimson", "sunset"])
      .optional(),
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
