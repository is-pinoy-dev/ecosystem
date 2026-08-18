import "server-only"

import { eq } from "drizzle-orm"

import { portfolioSchema } from "@is-pinoy-dev/schemas"

import { getDb, hasDatabase } from "@/lib/db"
import { subdomains } from "@/lib/db/schema"
import type { PortfolioStyle } from "@/lib/portfolio-style"

// The `portfolio` block of one record.
//
// Two layers, checked in order:
//
//   1. `subdomains.portfolioOverride` — a dashboard-saved style. Never
//      touched by the sync workflow, so it exists only once someone edits
//      the style from here instead of by pull request.
//   2. The record file in git, which is where every style starts out and
//      stays for as long as override 1 is null.
//
// The git read (rather than the wider D1 read model in lib/domains.ts) is
// kept for layer 2 on purpose: `subdomains.records`/`features` are populated
// by the sync workflow and carry no `portfolio` field (see lib/domains.ts),
// and the block is inert to Cloudflare sync anyway — only apps/portfolio
// reads it, so its git state is the only "synced" value that exists. One
// cached fetch of the file the edit would rewrite is both the cheapest and
// the freshest answer for that layer.

const DOMAINS_REPO = "is-pinoy-dev/domains"
const REVALIDATE_SECONDS = 300

async function getPortfolioOverride(
  subdomain: string
): Promise<PortfolioStyle | null> {
  if (!hasDatabase()) return null
  try {
    const [row] = await getDb()
      .select({ portfolioOverride: subdomains.portfolioOverride })
      .from(subdomains)
      .where(eq(subdomains.name, subdomain))
      .limit(1)
    const override = row?.portfolioOverride
    if (!override) return null
    const parsed = portfolioSchema.safeParse(override)
    return parsed.success && parsed.data ? parsed.data : null
  } catch (error) {
    // Same posture as lib/domains.ts: a broken read model degrades to the
    // git-derived value rather than taking the style panel down with it.
    console.error(
      "[portfolio-config] override lookup failed, serving git style instead",
      error
    )
    return null
  }
}

/** The record's portfolio block from git, or null when it has none (or is unreadable). */
async function getGitPortfolioStyle(
  subdomain: string
): Promise<PortfolioStyle | null> {
  let res: Response
  try {
    res = await fetch(
      `https://raw.githubusercontent.com/${DOMAINS_REPO}/main/subdomains/${subdomain}.json`,
      { next: { revalidate: REVALIDATE_SECONDS } }
    )
  } catch {
    // The style panel is one section of a page that has plenty else to show;
    // a registry read that fails simply hides it.
    return null
  }
  if (!res.ok) return null

  let file: { portfolio?: unknown }
  try {
    file = (await res.json()) as { portfolio?: unknown }
  } catch {
    return null
  }

  // portfolioSchema is `.optional()`, so a record with no block parses
  // successfully to `undefined` — that is the "not a hosted portfolio" case,
  // not a failure.
  const parsed = portfolioSchema.safeParse(file.portfolio)
  if (!parsed.success || !parsed.data) return null

  const { template, theme } = parsed.data
  return { template, ...(theme ? { theme } : {}) }
}

/**
 * The record's portfolio block: the dashboard override when one has been
 * saved, otherwise whatever git has. Null when neither layer has a style.
 */
export async function getPortfolioStyle(
  subdomain: string
): Promise<PortfolioStyle | null> {
  const override = await getPortfolioOverride(subdomain)
  if (override) return override
  return getGitPortfolioStyle(subdomain)
}
