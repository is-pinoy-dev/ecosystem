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
