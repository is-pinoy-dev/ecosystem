import { describe, expect, it } from "vitest"

import { formatVisitCount, visitSummaryLabel } from "./visit-count"

describe("formatVisitCount", () => {
  it("prints small totals exactly", () => {
    expect(formatVisitCount(0)).toBe("0")
    expect(formatVisitCount(7)).toBe("7")
    expect(formatVisitCount(999)).toBe("999")
  })

  it("compacts a thousand and up", () => {
    expect(formatVisitCount(1000)).toBe("1K")
    expect(formatVisitCount(1240)).toBe("1.2K")
    expect(formatVisitCount(12_431)).toBe("12.4K")
    expect(formatVisitCount(1_200_000)).toBe("1.2M")
  })

  it("never widens past a handful of characters", () => {
    // The card gives this the end of a row it shares with the owner's handle.
    // A format that grows with the number would start truncating the handle
    // on exactly the sites with the most traffic to show.
    for (const total of [999, 1000, 99_999, 1_000_000, 987_654_321]) {
      expect(formatVisitCount(total).length).toBeLessThanOrEqual(6)
    }
  })
})

describe("visitSummaryLabel", () => {
  it("gives the exact total, the window, and the day it runs to", () => {
    // The compact figure is the visible one, so the tooltip is the only place
    // the precise number survives — and the only thing that tells a visitor a
    // quiet week apart from a collection outage.
    expect(
      visitSummaryLabel({
        total: 12_431,
        windowDays: 30,
        through: "2026-08-10",
      })
    ).toBe("12,431 visits in the last 30 days (through 2026-08-10)")
  })
})
