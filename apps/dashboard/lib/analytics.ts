// Visit totals for the subdomains a signed-in developer owns.
//
// The data is collected by tools/analytics: a daily cron that reads the
// previous day's aggregate traffic from Cloudflare's GraphQL Analytics API and
// writes one row per subdomain per day. Nothing here observes a visit — by the
// time a number reaches this file it is already a day's total, counted at
// Cloudflare's edge.
//
// Why a second database rather than the dashboard's own: lib/db/schema.ts is
// explicitly a read model, every row rebuildable from the domains repo, and it
// is safe to drop and re-sync on that basis. Visit history is the opposite —
// it cannot be reconstructed from anything, and Cloudflare's own retention
// window means a lost row is lost for good. Keeping it in the analytics
// worker's database keeps that guarantee out of reach of a registry rebuild.
//
// Ownership is enforced by the caller passing only subdomains it has already
// resolved for the session; every query below is scoped to that list.

import { d1Query, type D1Config } from "@/lib/db/d1"

/** Default span rendered in the dashboard. */
export const DEFAULT_WINDOW_DAYS = 30

// Committed in tools/analytics/worker/wrangler.toml, so it is configuration
// rather than a secret, and defaulting to it means one less environment
// variable to set. The override exists for a preview or staging database.
const DEFAULT_ANALYTICS_DATABASE_ID = "f0b338c1-b5d4-48db-8b42-0435a24ef430"

const DAY_MS = 86_400_000

export interface VisitPoint {
  /** `YYYY-MM-DD`, UTC. */
  date: string
  visits: number
}

export interface CountryTotal {
  country: string
  visits: number
}

export interface SubdomainVisits {
  subdomain: string
  /** Total across the window. */
  total: number
  /** One point per day up to `through`, zero-filled. */
  series: VisitPoint[]
  /** Busiest first. */
  countries: CountryTotal[]
}

export interface VisitsReport {
  /**
   * Newest day collected, platform-wide. Null when nothing has been collected
   * at all — which is the honest signal that the cron has never succeeded,
   * and is rendered differently from a subdomain that simply had no visitors.
   */
  through: string | null
  windowDays: number
  bySubdomain: Record<string, SubdomainVisits>
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

export function hasAnalyticsDatabase(): boolean {
  const { accountId, databaseId, token } = readConfig()
  return Boolean(accountId && databaseId && token)
}

/**
 * Said once per process, not once per render.
 *
 * The panel renders nothing at all when this returns null, which makes "never
 * configured", "not deployed yet" and "actually broken" look identical from the
 * outside — there is no partial UI to give the game away. One line in the
 * server log is the difference between a five-second answer and an afternoon.
 * Once, because /domains is server-rendered on every request and a per-render
 * warning would drown the log it is meant to help.
 */
let warnedUnconfigured = false

function warnUnconfiguredOnce(missing: string[]): void {
  if (warnedUnconfigured) return
  warnedUnconfigured = true
  console.warn(
    `[analytics] visit totals disabled — missing ${missing.join(", ")}. ` +
      `The Visits panel will not render until these are set on this deployment.`
  )
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function placeholders(count: number): string {
  return new Array(count).fill("?").join(", ")
}

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0)
}

/**
 * Fill every day from the window start to `through` so a chart reads as a
 * continuous span rather than as however many days happened to have traffic.
 *
 * Deliberately stops at `through` rather than today: a day the cron has not
 * collected yet is unknown, not zero, and drawing it as zero would show a
 * cliff at the end of every chart.
 */
function densify(
  points: Map<string, number>,
  through: string,
  windowDays: number
): VisitPoint[] {
  const end = Date.parse(`${through}T00:00:00Z`)
  const series: VisitPoint[] = []
  for (let i = windowDays - 1; i >= 0; i--) {
    const date = isoDate(end - i * DAY_MS)
    series.push({ date, visits: points.get(date) ?? 0 })
  }
  return series
}

/**
 * Visit totals for `subdomains`, which must already be scoped to the caller.
 *
 * Returns null when the analytics database is not configured, so the caller can
 * omit the feature rather than render an error — the dashboard is usable
 * without it, and it is absent in local development by default.
 */
export async function getVisitsForSubdomains(
  subdomains: string[],
  windowDays: number = DEFAULT_WINDOW_DAYS
): Promise<VisitsReport | null> {
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

  const empty: VisitsReport = { through: null, windowDays, bySubdomain: {} }
  if (subdomains.length === 0) return empty

  // Platform-wide rather than scoped to these subdomains: it answers "is
  // collection healthy", which a user with no traffic still needs to see.
  const freshness = await d1Query(
    config,
    "SELECT MAX(date) AS date FROM visits_daily",
    []
  )
  const through = (freshness[0]?.date as string | null) ?? null
  if (through === null) return empty

  const since = isoDate(
    Date.parse(`${through}T00:00:00Z`) - (windowDays - 1) * DAY_MS
  )
  const slots = placeholders(subdomains.length)

  const [daily, countries] = await Promise.all([
    d1Query(
      config,
      `SELECT subdomain, date, visits FROM visits_daily
       WHERE subdomain IN (${slots}) AND date >= ? AND date <= ?
       ORDER BY date ASC`,
      [...subdomains, since, through]
    ),
    d1Query(
      config,
      `SELECT subdomain, country, SUM(visits) AS visits
       FROM visits_daily_by_country
       WHERE subdomain IN (${slots}) AND date >= ? AND date <= ?
       GROUP BY subdomain, country
       ORDER BY visits DESC`,
      [...subdomains, since, through]
    ),
  ])

  const points = new Map<string, Map<string, number>>()
  for (const row of daily) {
    const name = String(row.subdomain)
    const bucket = points.get(name) ?? new Map<string, number>()
    bucket.set(String(row.date), toNumber(row.visits))
    points.set(name, bucket)
  }

  const byCountry = new Map<string, CountryTotal[]>()
  for (const row of countries) {
    const name = String(row.subdomain)
    const bucket = byCountry.get(name) ?? []
    bucket.push({ country: String(row.country), visits: toNumber(row.visits) })
    byCountry.set(name, bucket)
  }

  const bySubdomain: Record<string, SubdomainVisits> = {}
  for (const subdomain of subdomains) {
    const series = densify(
      points.get(subdomain) ?? new Map(),
      through,
      windowDays
    )
    bySubdomain[subdomain] = {
      subdomain,
      total: series.reduce((sum, point) => sum + point.visits, 0),
      series,
      countries: byCountry.get(subdomain) ?? [],
    }
  }

  return { through, windowDays, bySubdomain }
}
