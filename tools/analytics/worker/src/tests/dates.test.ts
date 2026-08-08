import { describe, it, expect } from "vitest"
import { isoDate, latestCompleteDate, pendingDates } from "../dates"

// Mid-afternoon UTC, so a bug that reaches for "today" is visible as a date
// rather than hidden by a midnight boundary.
const NOW = new Date("2026-08-06T14:30:00Z")

describe("isoDate", () => {
  it("formats as YYYY-MM-DD in UTC", () => {
    expect(isoDate(new Date("2026-08-06T23:59:59Z"))).toBe("2026-08-06")
  })

  it("does not shift the day for a time just past midnight UTC", () => {
    expect(isoDate(new Date("2026-08-06T00:00:01Z"))).toBe("2026-08-06")
  })
})

describe("latestCompleteDate", () => {
  it("is yesterday, never today", () => {
    expect(latestCompleteDate(NOW)).toBe("2026-08-05")
  })

  it("crosses a month boundary", () => {
    expect(latestCompleteDate(new Date("2026-09-01T00:30:00Z"))).toBe(
      "2026-08-31"
    )
  })
})

describe("pendingDates", () => {
  it("backfills the full window when the table is empty", () => {
    const dates = pendingDates(null, NOW, 30)
    expect(dates).toHaveLength(30)
    expect(dates[0]).toBe("2026-07-07")
    expect(dates.at(-1)).toBe("2026-08-05")
  })

  it("returns only yesterday on the ordinary daily run", () => {
    expect(pendingDates("2026-08-04", NOW, 30)).toEqual(["2026-08-05"])
  })

  it("returns nothing when yesterday is already stored", () => {
    expect(pendingDates("2026-08-05", NOW, 30)).toEqual([])
  })

  it("fills the hole left by missed runs, oldest first", () => {
    expect(pendingDates("2026-08-01", NOW, 30)).toEqual([
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
    ])
  })

  it("clamps a long outage to the window rather than asking for every day", () => {
    const dates = pendingDates("2024-01-01", NOW, 30)
    expect(dates).toHaveLength(30)
    expect(dates[0]).toBe("2026-07-07")
  })

  it("returns nothing when the stored date is somehow in the future", () => {
    expect(pendingDates("2027-01-01", NOW, 30)).toEqual([])
  })

  it("returns nothing for an unparseable stored date", () => {
    expect(pendingDates("not-a-date", NOW, 30)).toEqual([])
  })

  it("returns nothing for a non-positive window", () => {
    expect(pendingDates(null, NOW, 0)).toEqual([])
  })
})
