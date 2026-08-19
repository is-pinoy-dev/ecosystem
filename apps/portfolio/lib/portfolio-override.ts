import type { PortfolioConfig } from "@is-pinoy-dev/schemas"
import { portfolioSchema } from "@is-pinoy-dev/schemas"

import { d1Query, hasDatabase } from "./d1"

// A dashboard-saved portfolio style — the direct-D1 write from
// apps/dashboard/lib/db/settings.ts, checked here instead of the git file's
// `portfolio.template`/`portfolio.theme` whenever it exists. `null` covers
// "no override yet" and "the query failed" alike: either way the caller
// falls back to what git says, same as before this existed.

export async function getPortfolioOverride(
  subdomain: string
): Promise<NonNullable<PortfolioConfig> | null> {
  if (!hasDatabase()) return null
  try {
    const rows = await d1Query(
      "SELECT portfolio_override FROM subdomains WHERE name = ?",
      [subdomain]
    )
    const raw = rows[0]?.portfolio_override
    if (typeof raw !== "string") return null
    const parsed = portfolioSchema.safeParse(JSON.parse(raw))
    return parsed.success && parsed.data ? parsed.data : null
  } catch (error) {
    console.error(
      `[portfolio] override lookup failed subdomain=${subdomain}`,
      error
    )
    return null
  }
}
