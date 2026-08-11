import "server-only"

import type { ShowcaseVisitSummary } from "./visit-count"

// Visit totals for the showcase, read from the analytics worker's database.
//
// The numbers are collected by tools/analytics: a daily cron that reads the
// previous day's aggregate traffic from Cloudflare's GraphQL Analytics API and
// writes one row per subdomain per day. Nothing here — and nothing anywhere in
// this app — observes a visit. By the time a number reaches this file it is
// already a day's total, counted at Cloudflare's edge.
//
// **The opt-out is upstream of this file, and that is the whole design.** A
// subdomain with `features.analytics: false` is dropped by the collector before
// any row is written, so it has no row to read and no card can show a figure
// for it. There is no filtering to do here and deliberately none to forget:
// every subdomain this query can return is one whose owner left collection on.
// See apps/web/app/privacy for what that consent covers, which now includes
// the total appearing on the public showcase.
//
// Read over the D1 HTTP API rather than a binding, the same route
// apps/dashboard takes — this app has no Workers runtime either. The token
// needs read access to the analytics database and nothing else.

/**
 * The span a card's figure covers.
 *
 * Matches the dashboard's default window, so an owner comparing their card
 * against their own Visits panel is reading the same span rather than
 * wondering which of the two is wrong.
 */
export const SHOWCASE_WINDOW_DAYS = 30

// Committed in tools/analytics/worker/wrangler.toml, so it is configuration
// rather than a secret, and defaulting to it means one less environment
// variable to set. The override exists for a preview or staging database.
const DEFAULT_ANALYTICS_DATABASE_ID = "f0b338c1-b5d4-48db-8b42-0435a24ef430"

const DAY_MS = 86_400_000

interface D1Config {
  accountId: string
  databaseId: string
  token: string
}

interface D1QueryResponse {
  success: boolean
  errors?: { message: string }[]
  result?: { results?: Record<string, unknown>[] }[]
}

async function d1Query(
  config: D1Config,
  sql: string,
  params: unknown[]
): Promise<Record<string, unknown>[]> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
      // The showcase is server-rendered on every request and the totals move
      // once a day, so the window is generous. It matches the screenshot
      // manifest's, which keeps the two halves of a card equally stale.
      next: { revalidate: 300 },
    }
  )

  const body = (await response.json()) as D1QueryResponse
  if (!response.ok || !body.success) {
    const message =
      body.errors?.map((error) => error.message).join("; ") ||
      `HTTP ${response.status}`
    throw new Error(`D1 query failed: ${message}`)
  }
  return body.result?.[0]?.results ?? []
}

function readConfig(): Partial<D1Config> {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    databaseId:
      process.env.CLOUDFLARE_ANALYTICS_D1_DATABASE_ID ??
      DEFAULT_ANALYTICS_DATABASE_ID,
    token: process.env.CLOUDFLARE_D1_API_TOKEN,
  }
}

/**
 * Said once per process, not once per render.
 *
 * A card without a figure is indistinguishable from a card whose subdomain had
 * no traffic, which is exactly the right thing for a visitor to see and exactly
 * the wrong thing for an operator: "never configured" and "token expired" both
 * render as a showcase that has simply never mentioned visits.
 */
let warnedUnconfigured = false

function warnUnconfiguredOnce(missing: string[]): void {
  if (warnedUnconfigured) return
  warnedUnconfigured = true
  console.warn(
    `[visits] showcase totals disabled — missing ${missing.join(", ")}. ` +
      `Cards will render without a visit count until these are set.`
  )
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0)
}

/**
 * Trailing-window totals for every subdomain that has any, keyed by subdomain.
 *
 * Null when the database is not configured or could not be read. That is not
 * the same as an empty map — "nobody has visits" is a fact about the community
 * and "we could not ask" is a fact about our infrastructure — but the showcase
 * treats them alike on purpose, because the honest rendering of both is a card
 * that says nothing about visits rather than one that shows an error to a
 * visitor who never asked about our database.
 */
export async function getShowcaseVisits(
  windowDays: number = SHOWCASE_WINDOW_DAYS
): Promise<Map<string, ShowcaseVisitSummary> | null> {
  const { accountId, databaseId, token } = readConfig()
  if (!accountId || !databaseId || !token) {
    warnUnconfiguredOnce(
      [
        !accountId && "CLOUDFLARE_ACCOUNT_ID",
        !token && "CLOUDFLARE_D1_API_TOKEN",
        !databaseId && "CLOUDFLARE_ANALYTICS_D1_DATABASE_ID",
      ].filter((name): name is string => typeof name === "string")
    )
    return null
  }
  const config: D1Config = { accountId, databaseId, token }

  try {
    // Anchored on the newest day collected rather than on today, so a cron that
    // has not run yet shortens nobody's window by a day. It is also the date
    // the card's tooltip names.
    const freshness = await d1Query(
      config,
      "SELECT MAX(date) AS date FROM visits_daily",
      []
    )
    const through = (freshness[0]?.date as string | null) ?? null
    // Nothing has ever been collected. Every card renders without a figure,
    // which is what a brand-new deployment should look like.
    if (through === null) return null

    const since = isoDate(
      Date.parse(`${through}T00:00:00Z`) - (windowDays - 1) * DAY_MS
    )

    // Unscoped by subdomain, unlike the dashboard's query: the showcase is a
    // public page listing the whole registry, and a row only exists for a
    // subdomain that opted into collection.
    const rows = await d1Query(
      config,
      `SELECT subdomain, SUM(visits) AS visits FROM visits_daily
       WHERE date >= ? AND date <= ?
       GROUP BY subdomain`,
      [since, through]
    )

    const totals = new Map<string, ShowcaseVisitSummary>()
    for (const row of rows) {
      totals.set(String(row.subdomain), {
        total: toNumber(row.visits),
        windowDays,
        through,
      })
    }
    return totals
  } catch (error) {
    // A failure here costs the showcase one line per card, so it degrades
    // quietly for the visitor — but silently for us it must not.
    console.warn("[visits] showcase totals request failed", error)
    return null
  }
}
