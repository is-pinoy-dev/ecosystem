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

export const headingItemSchema = z.object({
  tag: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]),
  text: z.string(),
})
export type HeadingItem = z.infer<typeof headingItemSchema>

export const linkItemSchema = z.object({
  href: z.string(),
  text: z.string(),
  rel: z.string().nullable(),
})
export type LinkItem = z.infer<typeof linkItemSchema>

export const imageItemSchema = z.object({
  src: z.string(),
  alt: z.string().nullable(),
  title: z.string().nullable(),
})
export type ImageItem = z.infer<typeof imageItemSchema>

export const hreflangItemSchema = z.object({
  lang: z.string(),
  href: z.string(),
})
export type HreflangItem = z.infer<typeof hreflangItemSchema>

export const jsonLdSchemaItemSchema = z.object({
  raw: z.string(),
  type: z.string().nullable(),
  isValid: z.boolean(),
  parsed: z.unknown(),
})
export type JsonLdSchemaItem = z.infer<typeof jsonLdSchemaItemSchema>

export const seoDetailsSchema = z.object({
  wordCount: z.number(),
  keywords: z.string().nullable(),
  publisher: z.string().nullable(),
  xRobotsTag: z.string().nullable(),
  headings: z.array(headingItemSchema),
  headingCounts: z.record(z.string(), z.number()),
  links: z.object({
    total: z.number(),
    unique: z.number(),
    internal: z.number(),
    external: z.number(),
    internalLinks: z.array(linkItemSchema),
    externalLinks: z.array(linkItemSchema),
  }),
  images: z.object({
    total: z.number(),
    withoutAlt: z.number(),
    withoutTitle: z.number(),
    list: z.array(imageItemSchema),
  }),
  jsonLdSchemas: z.array(jsonLdSchemaItemSchema),
  hreflangLinks: z.array(hreflangItemSchema),
})
export type SeoDetails = z.infer<typeof seoDetailsSchema>

export const auditResultSchema = z.object({
  url: z.string(),
  auditedAt: z.string(),
  seo: auditCategorySchema,
  og: auditCategorySchema,
  details: seoDetailsSchema,
})
export type AuditResult = z.infer<typeof auditResultSchema>
