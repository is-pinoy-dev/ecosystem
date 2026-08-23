import type { D1Database } from "@cloudflare/workers-types"

// Read-only access to the dashboard's registry database, worker-only: unlike
// ../src/lib/domains.ts this may depend on @cloudflare/workers-types, since
// nothing under src/ (typechecked under DOM) imports this file.

interface OverrideRow {
  features_override: string | null
}

/**
 * A dashboard-saved feature override for this subdomain — the direct-D1
 * write from apps/dashboard/lib/db/settings.ts, checked instead of the git
 * file's `features` block whenever it exists. `null` covers "no override
 * yet" and "the query failed" alike: either way the caller falls back to the
 * record's own `features`, same as before this existed.
 */
export async function readFeaturesOverride(
  db: D1Database,
  subdomain: string
): Promise<Record<string, unknown> | null> {
  try {
    const row = await db
      .prepare("SELECT features_override FROM subdomains WHERE name = ?")
      .bind(subdomain)
      .first<OverrideRow>()
    if (!row?.features_override) return null
    return JSON.parse(row.features_override) as Record<string, unknown>
  } catch (error) {
    console.warn(
      `[site-audit] features override lookup failed subdomain=${subdomain}`,
      error
    )
    return null
  }
}

/** The one-row-per-subdomain snapshot this Worker writes after a scan. */
export interface AuditSnapshot {
  url: string
  seo: unknown
  og: unknown
  /** null when no PageSpeed run has completed for the current scan. */
  psi: unknown
  auditedAt: string
}

/**
 * Write access to `site_audits` — the counterpart to `readFeaturesOverride`
 * above, in the opposite direction: this Worker owns that table (see
 * apps/dashboard/lib/db/schema.ts) and is the only writer, the same way the
 * dashboard is the only writer of `features_override`. One row per
 * subdomain, fully overwritten on every scan — it is a snapshot of the most
 * recent audit, not a history.
 *
 * Best-effort: a failed write must never fail the scan the user is actually
 * looking at, so errors are logged and swallowed.
 */
export async function saveAuditSnapshot(
  db: D1Database,
  subdomain: string,
  snapshot: AuditSnapshot
): Promise<void> {
  const auditedAtMs = Date.parse(snapshot.auditedAt)
  const now = Date.now()
  try {
    await db
      .prepare(
        `INSERT INTO site_audits (subdomain, url, seo, og, psi, audited_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(subdomain) DO UPDATE SET
           url = excluded.url,
           seo = excluded.seo,
           og = excluded.og,
           psi = excluded.psi,
           audited_at = excluded.audited_at,
           updated_at = excluded.updated_at`
      )
      .bind(
        subdomain,
        snapshot.url,
        JSON.stringify(snapshot.seo),
        JSON.stringify(snapshot.og),
        snapshot.psi ? JSON.stringify(snapshot.psi) : null,
        Number.isNaN(auditedAtMs) ? now : auditedAtMs,
        now
      )
      .run()
  } catch (error) {
    console.warn(
      `[site-audit] audit snapshot save failed subdomain=${subdomain}`,
      error
    )
  }
}
