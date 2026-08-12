// How a visit total is worded on a showcase card.
//
// Kept apart from lib/visits.ts, which is server-only, so the wording can be
// tested on its own and imported from anywhere.

/** A subdomain's trailing-window visit total, as a card shows it. */
export interface ShowcaseVisitSummary {
  /** Total across the window. */
  total: number
  /** How many days the total covers. */
  windowDays: number
  /** Newest day collected, `YYYY-MM-DD` UTC. */
  through: string
}

const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

const EXACT = new Intl.NumberFormat("en-US")

/**
 * The number as a card shows it: exact up to a thousand, compact past it.
 *
 * A card gives this a few characters at the end of a row it shares with the
 * owner's handle, so "12.4K" earns its place over "12,431" — the precision the
 * long form buys is precision nobody reads at that size. The exact figure stays
 * available in the tooltip, and the owner's dashboard shows it in full.
 */
export function formatVisitCount(total: number): string {
  return total < 1000 ? EXACT.format(total) : COMPACT.format(total)
}

/**
 * The tooltip behind the number: exact total, window, and the day it runs to.
 *
 * Naming the last collected day matters more here than in the dashboard. A
 * visitor has no other way to tell a quiet week from a collection outage, and
 * a total with no date attached invites reading it as "right now".
 */
export function visitSummaryLabel(summary: ShowcaseVisitSummary): string {
  return (
    `${EXACT.format(summary.total)} visits in the last ` +
    `${summary.windowDays} days (through ${summary.through})`
  )
}
