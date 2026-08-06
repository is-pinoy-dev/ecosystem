import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getVisitsForSubdomains, hasAnalyticsDatabase } from "./analytics"

// Every query goes through d1Query, so stubbing it lets the tests drive the
// shape of the rows D1 would return without a network or a database.
vi.mock("@/lib/db/d1", () => ({ d1Query: vi.fn() }))
const { d1Query } = await import("@/lib/db/d1")
const query = vi.mocked(d1Query)

/**
 * Answer each statement by matching on its text, so the tests stay readable
 * and do not depend on the order the implementation happens to issue them in.
 */
function respond(rows: {
  freshness?: Record<string, unknown>[]
  daily?: Record<string, unknown>[]
  countries?: Record<string, unknown>[]
}) {
  query.mockImplementation(async (_config, sql) => {
    if (sql.includes("MAX(date)")) return rows.freshness ?? []
    if (sql.includes("visits_daily_by_country")) return rows.countries ?? []
    return rows.daily ?? []
  })
}

beforeEach(() => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "acct"
  process.env.CLOUDFLARE_D1_API_TOKEN = "token"
  query.mockReset()
})

afterEach(() => {
  delete process.env.CLOUDFLARE_ACCOUNT_ID
  delete process.env.CLOUDFLARE_D1_API_TOKEN
  delete process.env.CLOUDFLARE_ANALYTICS_D1_DATABASE_ID
})

describe("hasAnalyticsDatabase", () => {
  it("is satisfied by the account id and token alone", () => {
    // The database id defaults to the one committed in the worker's
    // wrangler.toml, so it is not something a deployment has to supply.
    expect(hasAnalyticsDatabase()).toBe(true)
  })

  it("is false without a token", () => {
    delete process.env.CLOUDFLARE_D1_API_TOKEN
    expect(hasAnalyticsDatabase()).toBe(false)
  })
})

describe("getVisitsForSubdomains", () => {
  it("returns null when the database is not configured", async () => {
    delete process.env.CLOUDFLARE_ACCOUNT_ID
    await expect(getVisitsForSubdomains(["juan"])).resolves.toBeNull()
    expect(query).not.toHaveBeenCalled()
  })

  it("issues no query at all for an owner with no subdomains", async () => {
    const report = await getVisitsForSubdomains([])
    expect(report).toEqual({ through: null, windowDays: 30, bySubdomain: {} })
    expect(query).not.toHaveBeenCalled()
  })

  it("reports nothing collected when the table is empty", async () => {
    respond({ freshness: [{ date: null }] })
    const report = await getVisitsForSubdomains(["juan"])
    expect(report?.through).toBeNull()
    expect(report?.bySubdomain).toEqual({})
  })

  it("zero-fills days with no traffic", async () => {
    respond({
      freshness: [{ date: "2026-08-05" }],
      daily: [{ subdomain: "juan", date: "2026-08-05", visits: 12 }],
    })
    const report = await getVisitsForSubdomains(["juan"], 3)
    expect(report!.bySubdomain.juan!.series).toEqual([
      { date: "2026-08-03", visits: 0 },
      { date: "2026-08-04", visits: 0 },
      { date: "2026-08-05", visits: 12 },
    ])
    expect(report!.bySubdomain.juan!.total).toBe(12)
  })

  // A day the cron has not reached yet is unknown, not zero — drawing it would
  // put a false cliff at the end of every chart.
  it("ends the series at the last collected day, not today", async () => {
    respond({ freshness: [{ date: "2026-08-01" }] })
    const report = await getVisitsForSubdomains(["juan"], 2)
    expect(report?.through).toBe("2026-08-01")
    expect(report!.bySubdomain.juan!.series.at(-1)?.date).toBe("2026-08-01")
  })

  it("includes an owned subdomain that has no rows at all", async () => {
    respond({
      freshness: [{ date: "2026-08-05" }],
      daily: [{ subdomain: "juan", date: "2026-08-05", visits: 4 }],
    })
    const report = await getVisitsForSubdomains(["juan", "maria"], 1)
    expect(report!.bySubdomain.maria!.total).toBe(0)
    expect(report!.bySubdomain.maria!.series).toHaveLength(1)
  })

  it("scopes both data queries to the subdomains it was given", async () => {
    respond({ freshness: [{ date: "2026-08-05" }] })
    await getVisitsForSubdomains(["juan", "maria"], 7)

    const scoped = query.mock.calls.filter(
      ([, sql]) => !sql.includes("MAX(date)")
    )
    expect(scoped).toHaveLength(2)
    for (const [, sql, params] of scoped) {
      expect(sql).toContain("subdomain IN (?, ?)")
      // The owned names lead, followed by the window bounds.
      expect(params.slice(0, 2)).toEqual(["juan", "maria"])
      expect(params.slice(2)).toEqual(["2026-07-30", "2026-08-05"])
    }
  })

  it("groups country totals by subdomain, busiest first", async () => {
    respond({
      freshness: [{ date: "2026-08-05" }],
      countries: [
        { subdomain: "juan", country: "PH", visits: 30 },
        { subdomain: "juan", country: "US", visits: 12 },
        { subdomain: "maria", country: "PH", visits: 5 },
      ],
    })
    const report = await getVisitsForSubdomains(["juan", "maria"], 1)
    expect(report!.bySubdomain.juan!.countries).toEqual([
      { country: "PH", visits: 30 },
      { country: "US", visits: 12 },
    ])
    expect(report!.bySubdomain.maria!.countries).toEqual([
      { country: "PH", visits: 5 },
    ])
  })

  // D1 returns aggregate columns as strings often enough that a raw sum would
  // silently concatenate instead of adding.
  it("coerces numeric columns returned as strings", async () => {
    respond({
      freshness: [{ date: "2026-08-05" }],
      daily: [{ subdomain: "juan", date: "2026-08-05", visits: "7" }],
      countries: [{ subdomain: "juan", country: "PH", visits: "7" }],
    })
    const report = await getVisitsForSubdomains(["juan"], 1)
    expect(report!.bySubdomain.juan!.total).toBe(7)
    expect(report!.bySubdomain.juan!.countries[0]!.visits).toBe(7)
  })
})
