import { z } from "zod"
import { dnsRecordSchema } from "./records.js"

export const createActionSchema = z.object({
  type: z.literal("CREATE"),
  fqdn: z.string(),
  record: dnsRecordSchema,
})

export const updateActionSchema = z.object({
  type: z.literal("UPDATE"),
  id: z.string(),
  fqdn: z.string(),
  record: dnsRecordSchema,
})

export const deleteActionSchema = z.object({
  type: z.literal("DELETE"),
  id: z.string(),
  fqdn: z.string(),
})

export const dnsActionSchema = z.discriminatedUnion("type", [
  createActionSchema,
  updateActionSchema,
  deleteActionSchema,
])

export type DNSAction = z.infer<typeof dnsActionSchema>

// Worker-route actions are kept in their own union rather than folded into
// DNSAction: they reconcile a different Cloudflare resource against a
// different "actual" list, and the DNS diff has invariants (claiming, orphan
// detection) that don't apply to routes.
export const createRouteActionSchema = z.object({
  type: z.literal("CREATE_ROUTE"),
  pattern: z.string(),
  script: z.string(),
})

export const deleteRouteActionSchema = z.object({
  type: z.literal("DELETE_ROUTE"),
  id: z.string(),
  pattern: z.string(),
})

export const routeActionSchema = z.discriminatedUnion("type", [
  createRouteActionSchema,
  deleteRouteActionSchema,
])

export type RouteAction = z.infer<typeof routeActionSchema>
