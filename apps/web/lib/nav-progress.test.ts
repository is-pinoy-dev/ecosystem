import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { advance, createNavProgress, type NavProgress } from "./nav-progress"

const REVEAL = 120
const MIN_VISIBLE = 240
const TICK = 100
const CEILING = 0.9

function makeProgress() {
  return createNavProgress({
    revealDelayMs: REVEAL,
    minVisibleMs: MIN_VISIBLE,
    tickMs: TICK,
    ceiling: CEILING,
    closeFraction: 0.18,
  })
}

describe("advance", () => {
  it("closes a share of the remaining distance to the ceiling", () => {
    expect(advance(0, 1, 0.5)).toBe(0.5)
    expect(advance(0.5, 1, 0.5)).toBe(0.75)
  })

  it("approaches the ceiling without reaching it", () => {
    let value = 0
    for (let i = 0; i < 500; i += 1) value = advance(value, CEILING, 0.18)

    expect(value).toBeLessThan(CEILING)
    expect(value).toBeCloseTo(CEILING, 6)
  })
})

describe("navProgress", () => {
  let progress: NavProgress

  beforeEach(() => {
    vi.useFakeTimers()
    progress = makeProgress()
  })

  afterEach(() => {
    progress.reset()
    vi.useRealTimers()
  })

  it("starts idle", () => {
    expect(progress.getSnapshot()).toBeNull()
    expect(progress.getServerSnapshot()).toBeNull()
  })

  it("shows nothing at all when a navigation beats the reveal delay", () => {
    progress.start()
    vi.advanceTimersByTime(REVEAL - 1)
    expect(progress.getSnapshot()).toBeNull()

    progress.done()
    // Nothing was ever shown, so there is nothing to wind down either.
    vi.advanceTimersByTime(10_000)
    expect(progress.getSnapshot()).toBeNull()
  })

  it("reveals once a navigation outlasts the delay", () => {
    progress.start()
    vi.advanceTimersByTime(REVEAL)

    const revealed = progress.getSnapshot()
    expect(revealed).not.toBeNull()
    expect(revealed).toBeGreaterThan(0)
    expect(revealed).toBeLessThan(CEILING)
  })

  it("keeps advancing while pending but never reaches the ceiling", () => {
    progress.start()
    vi.advanceTimersByTime(REVEAL)
    const first = progress.getSnapshot()!

    vi.advanceTimersByTime(TICK * 3)
    const later = progress.getSnapshot()!

    expect(later).toBeGreaterThan(first)
    expect(later).toBeLessThan(CEILING)

    vi.advanceTimersByTime(TICK * 200)
    expect(progress.getSnapshot()!).toBeLessThan(CEILING)
  })

  it("runs to full and then hides, holding for the minimum visible time", () => {
    progress.start()
    vi.advanceTimersByTime(REVEAL)

    progress.done()
    expect(progress.getSnapshot()).toBe(1)

    // Still up: the reveal only just happened, so the whole hold is ahead.
    vi.advanceTimersByTime(MIN_VISIBLE - 1)
    expect(progress.getSnapshot()).toBe(1)

    vi.advanceTimersByTime(1)
    expect(progress.getSnapshot()).toBeNull()
  })

  it("still holds long enough to see the fill when the bar was up for ages", () => {
    progress.start()
    vi.advanceTimersByTime(REVEAL + MIN_VISIBLE * 5)

    progress.done()
    expect(progress.getSnapshot()).toBe(1)

    vi.advanceTimersByTime(TICK - 1)
    expect(progress.getSnapshot()).toBe(1)

    vi.advanceTimersByTime(1)
    expect(progress.getSnapshot()).toBeNull()
  })

  it("stays up until the last of several overlapping navigations finishes", () => {
    progress.start()
    progress.start()
    vi.advanceTimersByTime(REVEAL)
    expect(progress.getSnapshot()).not.toBeNull()

    progress.done()
    // One is still pending, so the bar must not run to full yet.
    expect(progress.getSnapshot()).not.toBe(1)

    vi.advanceTimersByTime(TICK)
    expect(progress.getSnapshot()).toBeLessThan(CEILING)

    progress.done()
    expect(progress.getSnapshot()).toBe(1)
  })

  it("does not reveal for a second link when the first already beat the delay", () => {
    progress.start()
    progress.start()
    vi.advanceTimersByTime(REVEAL - 1)
    progress.done()
    progress.done()

    vi.advanceTimersByTime(10_000)
    expect(progress.getSnapshot()).toBeNull()
  })

  it("ignores a stray done() with nothing pending", () => {
    progress.done()
    vi.advanceTimersByTime(10_000)
    expect(progress.getSnapshot()).toBeNull()
  })

  it("keeps a visible bar in place when the next navigation starts mid-fade", () => {
    progress.start()
    vi.advanceTimersByTime(REVEAL)
    progress.done()
    expect(progress.getSnapshot()).toBe(1)

    // A second navigation before the hold expires restarts the fill rather than
    // blinking out and waiting out the reveal delay again.
    progress.start()
    expect(progress.getSnapshot()).toBeGreaterThan(0)
    expect(progress.getSnapshot()).toBeLessThan(CEILING)

    vi.advanceTimersByTime(MIN_VISIBLE * 4)
    expect(progress.getSnapshot()).not.toBeNull()
  })

  it("notifies subscribers on reveal and on hide, and stops after unsubscribe", () => {
    const listener = vi.fn()
    const unsubscribe = progress.subscribe(listener)

    progress.start()
    vi.advanceTimersByTime(REVEAL)
    expect(listener).toHaveBeenCalled()

    unsubscribe()
    const callsAtUnsubscribe = listener.mock.calls.length
    progress.done()
    vi.advanceTimersByTime(MIN_VISIBLE * 2)

    expect(listener.mock.calls.length).toBe(callsAtUnsubscribe)
  })

  it("goes back to idle on reset", () => {
    progress.start()
    vi.advanceTimersByTime(REVEAL + TICK)
    expect(progress.getSnapshot()).not.toBeNull()

    progress.reset()
    expect(progress.getSnapshot()).toBeNull()

    vi.advanceTimersByTime(10_000)
    expect(progress.getSnapshot()).toBeNull()
  })
})
