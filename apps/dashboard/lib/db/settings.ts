import "server-only"

import { eq } from "drizzle-orm"

import { getDb, hasDatabase } from "@/lib/db"
import { subdomains } from "@/lib/db/schema"

// Writing a dashboard-owned setting override — the direct-to-D1 half of the
// read/write pair with lib/domains.ts (features) and lib/portfolio-config.ts
// (portfolio style). No pull request, no sync workflow: the write lands here
// and the next read sees it immediately, because D1 is authoritative for a
// setting once an override exists. Git keeps the value it had at the time —
// it is only ever the seed for a record that has never been overridden.

export type SettingsWriteResult = { ok: true } | { ok: false; error: string }

/** Overwrite a subdomain's dashboard-saved feature flags. */
export async function writeFeaturesOverride(
  subdomain: string,
  features: Record<string, unknown>
): Promise<SettingsWriteResult> {
  if (!hasDatabase()) {
    return {
      ok: false,
      error: "Feature settings need the database, which is not configured.",
    }
  }
  try {
    await getDb()
      .update(subdomains)
      .set({ featuresOverride: features, updatedAt: new Date() })
      .where(eq(subdomains.name, subdomain))
    return { ok: true }
  } catch (error) {
    console.error("[settings] failed to write features override", error)
    return { ok: false, error: "Could not save. Please try again." }
  }
}

/** Overwrite a subdomain's dashboard-saved portfolio style. */
export async function writePortfolioOverride(
  subdomain: string,
  style: { template: string; theme?: string }
): Promise<SettingsWriteResult> {
  if (!hasDatabase()) {
    return {
      ok: false,
      error: "Portfolio style needs the database, which is not configured.",
    }
  }
  try {
    await getDb()
      .update(subdomains)
      .set({ portfolioOverride: style, updatedAt: new Date() })
      .where(eq(subdomains.name, subdomain))
    return { ok: true }
  } catch (error) {
    console.error("[settings] failed to write portfolio override", error)
    return { ok: false, error: "Could not save. Please try again." }
  }
}
