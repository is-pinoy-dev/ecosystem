import "server-only"

import { eq } from "drizzle-orm"

import type { AuditCategory, PsiResult } from "@is-pinoy-dev/schemas"

import { getDb, hasDatabase } from "@/lib/db"
import { siteAudits } from "@/lib/db/schema"

// The most recent tools/site-audit scan for a subdomain — written directly by
// that Worker (see worker/subdomains-db.ts), never by anything in this app.
// One row per subdomain, fully overwritten on every scan: a snapshot of the
// last thing site-audit measured, not a history. Absent entirely for a
// subdomain nobody has scanned yet.

export interface SiteAuditSummary {
  /** The page last scanned — may be a path under the subdomain, not just its root. */
  url: string
  seo: AuditCategory
  og: AuditCategory
  /** Null until a PageSpeed run has completed for the current scan. */
  psi: PsiResult | null
  auditedAt: string
}

export async function getSiteAudit(
  subdomain: string
): Promise<SiteAuditSummary | null> {
  if (!hasDatabase()) return null
  try {
    const row = await getDb()
      .select()
      .from(siteAudits)
      .where(eq(siteAudits.subdomain, subdomain))
      .get()
    if (!row) return null
    return {
      url: row.url,
      seo: row.seo as AuditCategory,
      og: row.og as AuditCategory,
      psi: (row.psi as PsiResult | null) ?? null,
      auditedAt: row.auditedAt.toISOString(),
    }
  } catch (error) {
    console.error("[site-audit] read failed", error)
    return null
  }
}
