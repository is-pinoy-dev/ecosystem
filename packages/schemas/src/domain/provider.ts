import { z } from "zod"

export const cloudflareRecordSchema = z.object({
  type: z.string(),
  content: z.string(),
  id: z.string(),
  name: z.string(),
  proxied: z.boolean().optional(),
  ttl: z.number().optional(),
})

export type CloudflareRecord = z.infer<typeof cloudflareRecordSchema>

// A Workers route on the zone. Portfolio subdomains need one each: Workers
// routes match the *request* hostname, so a route on the renderer host would
// never fire for `juan.is-pinoy.dev`, and the only wildcard that would —
// `*.is-pinoy.dev/*` — sits in front of every proxied subdomain in the
// registry. One route per portfolio keeps the blast radius at the portfolios.
export const cloudflareWorkerRouteSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  // Absent on routes that resolve to no script.
  script: z.string().optional(),
})

export type CloudflareWorkerRoute = z.infer<typeof cloudflareWorkerRouteSchema>
