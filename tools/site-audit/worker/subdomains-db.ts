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
