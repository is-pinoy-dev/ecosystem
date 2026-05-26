import { z } from "zod"

export const auditStatusSchema = z.enum(["pass", "warn", "fail"])
export type AuditStatus = z.infer<typeof auditStatusSchema>

export const auditFieldSchema = z.object({
  label: z.string(),
  value: z.string().nullable(),
  status: auditStatusSchema,
  message: z.string().optional(),
})
export type AuditField = z.infer<typeof auditFieldSchema>

export const auditCategorySchema = z.object({
  score: z.number().min(0).max(100),
  fields: z.array(auditFieldSchema),
})
export type AuditCategory = z.infer<typeof auditCategorySchema>

export const auditResultSchema = z.object({
  url: z.string(),
  auditedAt: z.string(),
  seo: auditCategorySchema,
  og: auditCategorySchema,
})
export type AuditResult = z.infer<typeof auditResultSchema>
