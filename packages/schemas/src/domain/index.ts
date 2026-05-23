import { z } from "zod";

const baseRecord = z.object({
  ttl: z.number().optional(),
});

const aRecord = baseRecord.extend({
  value: z.ipv4(),
});

const aaaaRecord = baseRecord.extend({
  value: z.ipv6(),
});

const cnameRecord = baseRecord.extend({
  value: z.string().min(1),
  proxied: z.boolean().optional(),
});

const txtRecord = baseRecord.extend({
  value: z.string().min(1),
  provider: z.enum(["vercel"]),
});

const singleOrArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.array(schema)]);

export const dnsRecordSchema = z.discriminatedUnion("type", [
  aRecord.extend({ type: z.literal("A") }),
  aaaaRecord.extend({ type: z.literal("AAAA") }),
  cnameRecord.extend({ type: z.literal("CNAME") }),
  txtRecord.extend({ type: z.literal("TXT") }),
]);

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
  records: z.object({
    A: singleOrArray(aRecord).optional(),
    AAAA: singleOrArray(aaaaRecord).optional(),
    CNAME: singleOrArray(cnameRecord).optional(),
    TXT: singleOrArray(txtRecord).optional(),
  }).refine((r) => Object.keys(r).length > 0, "At least one record type required"),
  destroy: z.boolean().optional(),
});

export const resolvedDomainSchema = domainSchema.extend({
  file: z.string(),
});

export const ResolvedDomainsSchema = z.array(resolvedDomainSchema);

export const aRecordSchema = aRecord;
export const aaaaRecordSchema = aaaaRecord;
export const cnameRecordSchema = cnameRecord;
export const txtRecordSchema = txtRecord;

export type ResolvedDomain = z.infer<typeof resolvedDomainSchema>;
export type ResolvedDomains = z.infer<typeof ResolvedDomainsSchema>;
export type Domain = z.infer<typeof domainSchema>;
export type DNSRecord = z.infer<typeof dnsRecordSchema>


export * from './action.js';
export * from './provider.js'
