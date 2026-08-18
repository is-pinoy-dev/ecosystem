import { describe, expect, it } from "vitest"

import { rotateWeekly, weekIndex, weekStart } from "./showcase-rotation"

const POOL = ["alpha", "bravo", "charlie", "delta", "echo"]

/** A Monday, the day the rotation turns over. */
const MONDAY = new Date("2026-01-19T00:00:00Z")
const NEXT_MONDAY = new Date("2026-01-26T00:00:00Z")

describe("weekIndex", () => {
  it("holds steady from Monday through the end of Sunday", () => {
    expect(weekIndex(new Date("2026-01-19T23:59:59Z"))).toBe(weekIndex(MONDAY))
    expect(weekIndex(new Date("2026-01-25T23:59:59.999Z"))).toBe(
      weekIndex(MONDAY)
    )
  })

  it("advances by one at Monday 00:00 UTC", () => {
    expect(weekIndex(NEXT_MONDAY)).toBe(weekIndex(MONDAY) + 1)
  })
})

describe("weekStart", () => {
  it("names the Monday that opens the week, from any moment inside it", () => {
    expect(weekStart(MONDAY)).toEqual(MONDAY)
    expect(weekStart(new Date("2026-01-25T23:59:59.999Z"))).toEqual(MONDAY)
    expect(weekStart(NEXT_MONDAY)).toEqual(NEXT_MONDAY)
  })

  it("lands on a Monday for dates before the epoch", () => {
    expect(weekStart(new Date("1969-07-20T20:17:00Z")).getUTCDay()).toBe(1)
  })
})

describe("rotateWeekly", () => {
  it("returns the same window for every moment in a week", () => {
    const monday = rotateWeekly(POOL, 3, MONDAY)
    const sunday = rotateWeekly(POOL, 3, new Date("2026-01-25T23:59:59Z"))

    expect(sunday).toEqual(monday)
  })

  it("advances by a full window the next week", () => {
    const first = rotateWeekly(POOL, 3, MONDAY)
    const second = rotateWeekly(POOL, 3, NEXT_MONDAY)

    // The window moves on by its own width, so the section visibly turns over.
    // Some entries can recur when the width does not divide the pool — that is
    // wraparound, not a stalled rotation.
    expect(second).not.toEqual(first)
    const start = POOL.indexOf(first[0]!)
    expect(second[0]).toBe(POOL[(start + 3) % POOL.length])
  })

  it("wraps around the end of the pool", () => {
    const windows = Array.from({ length: 5 }, (_, week) =>
      rotateWeekly(POOL, 3, new Date(MONDAY.getTime() + week * 7 * 86400000))
    )

    // Every window is full even when it straddles the end of the list.
    for (const window of windows) expect(window).toHaveLength(3)
  })

  it("gives every entry a turn within one cycle", () => {
    const seen = new Set<string>()
    for (let week = 0; week < POOL.length; week++) {
      const at = new Date(MONDAY.getTime() + week * 7 * 86400000)
      for (const entry of rotateWeekly(POOL, 3, at)) seen.add(entry)
    }

    expect([...seen].sort()).toEqual([...POOL].sort())
  })

  it("keeps each window in pool order from its starting point", () => {
    const window = rotateWeekly(POOL, 3, MONDAY)
    const start = POOL.indexOf(window[0]!)

    expect(window).toEqual([
      POOL[start % POOL.length],
      POOL[(start + 1) % POOL.length],
      POOL[(start + 2) % POOL.length],
    ])
  })

  it("leaves a pool no larger than the window untouched", () => {
    // Dropping entries to fake movement would only hide sites.
    expect(rotateWeekly(POOL.slice(0, 3), 3, MONDAY)).toEqual(POOL.slice(0, 3))
    expect(rotateWeekly(POOL.slice(0, 2), 3, NEXT_MONDAY)).toEqual(
      POOL.slice(0, 2)
    )
    expect(rotateWeekly([], 3, MONDAY)).toEqual([])
  })

  it("stays in range for dates before the epoch", () => {
    const window = rotateWeekly(POOL, 3, new Date("1969-07-20T20:17:00Z"))

    expect(window).toHaveLength(3)
    expect(window.every((entry) => POOL.includes(entry))).toBe(true)
  })
})
