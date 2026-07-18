import { z } from "zod";

export const baseRecord = z.object({
  ttl: z.number().optional(),
});

export const aRecord = baseRecord.extend({
  value: z.ipv4(),
  proxied: z.boolean().optional(),
});

export const aaaaRecord = baseRecord.extend({
  value: z.ipv6(),
});

export const cnameRecord = baseRecord.extend({
  value: z.string().min(1),
  proxied: z.boolean().optional(),
});

export const SUPPORTED_PROVIDERS = [
  "vercel",
  "netlify",
  "github",
  "cloudflare",
] as const;

export const txtRecord = baseRecord.extend({
  value: z.string().min(1),
  provider: z.enum(SUPPORTED_PROVIDERS),
});

const singleOrArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.array(schema)]);

export const dnsRecordSchema = z.discriminatedUnion("type", [
  aRecord.extend({ type: z.literal("A") }),
  aaaaRecord.extend({ type: z.literal("AAAA") }),
  cnameRecord.extend({ type: z.literal("CNAME") }),
  txtRecord.extend({ type: z.literal("TXT") }),
]);

export const aRecordSchema = aRecord;
export const aaaaRecordSchema = aaaaRecord;
export const cnameRecordSchema = cnameRecord;
export const txtRecordSchema = txtRecord;
export { singleOrArray };
