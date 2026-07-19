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

// Only Vercel uses a DNS TXT challenge that this registry can serve. Other
// hosts either need no DNS verification (Netlify, Cloudflare Pages) or use a
// challenge name that embeds the user's account name and cannot be derived
// from a provider enum (GitHub Pages: _github-pages-challenge-<username>).
export const SUPPORTED_PROVIDERS = ["vercel"] as const;

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
