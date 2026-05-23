import { z } from "zod"
import {
  singleOrArray,
  aRecord,
  cnameRecord,
  txtRecord,
  dnsRecordSchema,
} from "./records.js"

export const domainSchema = z.object({
  subdomain: z
    .string()
    .min(1)
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
  destroy: z.boolean().optional(),
})

export const resolvedDomainSchema = domainSchema.extend({
  file: z.string(),
})

export const ResolvedDomainsSchema = z.array(resolvedDomainSchema)

export type ResolvedDomain = z.infer<typeof resolvedDomainSchema>
export type ResolvedDomains = z.infer<typeof ResolvedDomainsSchema>
export type Domain = z.infer<typeof domainSchema>
export type DNSRecord = z.infer<typeof dnsRecordSchema>

export * from "./records.js"
export * from "./action.js"
export * from "./provider.js"
