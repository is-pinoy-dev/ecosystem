import "server-only"

import { portfolioSchema } from "@is-pinoy-dev/schemas"

import type { PortfolioStyle } from "@/lib/portfolio-style"

// The `portfolio` block of one record, read straight from the domains repo.
//
// Read here rather than from the dashboard's D1 read model on purpose. The
// read model carries `records` and `features` but not `portfolio` (see
// lib/domains.ts), and it is populated by the sync workflow in the domains
// repo — a surface we would have to change in lockstep to widen it. The block
// is also inert to Cloudflare sync: only apps/portfolio reads it, so its state
// is exactly the file in git and nothing else. One cached fetch of the file
// the edit would rewrite is both the cheapest and the freshest answer.

const DOMAINS_REPO = "is-pinoy-dev/domains"
const REVALIDATE_SECONDS = 300

/** The record's portfolio block, or null when it has none (or is unreadable). */
export async function getPortfolioStyle(
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
