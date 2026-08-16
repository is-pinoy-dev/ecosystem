import { describe, expect, it } from "vitest"

import {
  failedRetryBackoffMs,
  selectRefreshEligible,
  FAILED_RETRY_FLOOR_MS,
  type RefreshSweepWindow,
  type SweepCandidate,
} from "../repository"

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const NOW = Date.parse("2026-08-16T03:00:00.000Z")

function window(
  overrides: Partial<RefreshSweepWindow> = {}
): RefreshSweepWindow {
  return {
    now: NOW,
    refreshAfterMs: 30 * DAY,
    staleProcessingMs: HOUR,
    limit: 25,
    ...overrides,
  }
}

function candidate(overrides: Partial<SweepCandidate> = {}): SweepCandidate {
  return {
    name: "juan",
    screenshotStatus: "pending",
    screenshotKey: null,
    screenshotCapturedAt: null,
    screenshotRequestedAt: null,
    screenshotRetryCount: 0,
    ...overrides,
  }
}

/** The portfolio ids the sweep would enqueue, in the order it would enqueue them. */
function swept(candidates: SweepCandidate[], sweepWindow = window()): string[] {
  return selectRefreshEligible(candidates, sweepWindow).map(
    (job) => job.portfolioId
  )
}

describe("failed-capture backoff", () => {
  it("never retires a portfolio, however many times it has failed", () => {
    // The bug this replaces: the sweep dropped a row at four failures, and a
    // failed row's retry count is only reset by a successful capture — which it
    // could only get by being swept. Every count must still name a wait.
    for (const retryCount of [0, 3, 4, 7, 10, 50, 1_000]) {
      const backoff = failedRetryBackoffMs(retryCount)
      expect(Number.isFinite(backoff)).toBe(true)
      expect(backoff).toBeGreaterThan(0)
    }
  })

  it("widens the wait as failures accumulate, then settles", () => {
    expect(failedRetryBackoffMs(1)).toBeLessThan(failedRetryBackoffMs(4))
    expect(failedRetryBackoffMs(4)).toBeLessThan(failedRetryBackoffMs(7))
    expect(failedRetryBackoffMs(10)).toBe(FAILED_RETRY_FLOOR_MS)
    expect(failedRetryBackoffMs(10_000)).toBe(FAILED_RETRY_FLOOR_MS)
  })
})

describe("refresh sweep selection", () => {
  it("picks up a portfolio whose in-queue retries are long exhausted", () => {
    const exhausted = candidate({
      name: "wingedge",
      screenshotStatus: "failed",
      screenshotRetryCount: 9,
      screenshotRequestedAt: NOW - 8 * DAY,
    })

    expect(swept([exhausted])).toEqual(["wingedge"])
  })

  it("leaves a failed portfolio alone until its backoff has elapsed", () => {
    const justTried = candidate({
      screenshotStatus: "failed",
      screenshotRetryCount: 5,
      screenshotRequestedAt: NOW - HOUR,
    })

    expect(swept([justTried])).toEqual([])
  })

  it("rotates through a backlog instead of retrying the same names daily", () => {
    // Every never-captured row ties on capture date, so ordering fell through to
    // the name and the sweep re-picked the same alphabetical prefix each run.
    // Least-recently-attempted has to win the tie, or the tail never gets a turn.
    const backlog = [
      candidate({ name: "aaron", screenshotRequestedAt: NOW - 2 * HOUR }),
      candidate({ name: "zeny", screenshotRequestedAt: NOW - 3 * DAY }),
      candidate({ name: "mika", screenshotRequestedAt: NOW - 2 * DAY }),
    ]

    expect(swept(backlog, window({ limit: 2 }))).toEqual(["zeny", "mika"])
  })

  it("recovers a capture that crashed without stamping a request time", () => {
    const orphaned = candidate({
      name: "kench",
      screenshotStatus: "processing",
      screenshotRequestedAt: null,
    })

    expect(swept([orphaned])).toEqual(["kench"])
  })

  it("re-queues a fresh claim whose queue send was lost", () => {
    // Reconcile stamps a new row pending with a request time, so it can only
    // come back through this branch. An hour is long enough to be sure the
    // queue dropped it, and it has no in-flight retry ladder to collide with.
    const lost = candidate({
      name: "joel-santos",
      screenshotStatus: "pending",
      screenshotRetryCount: 0,
      screenshotRequestedAt: NOW - 90 * 60 * 1000,
    })

    expect(swept([lost])).toEqual(["joel-santos"])
  })

  it("waits out the in-queue ladder before re-queuing a pending retry", () => {
    const midLadder = candidate({
      screenshotStatus: "pending",
      screenshotRetryCount: 2,
      screenshotRequestedAt: NOW - 2 * HOUR,
    })

    expect(swept([midLadder])).toEqual([])
  })

  it("refreshes a stale capture but not a recent one", () => {
    const stale = candidate({
      name: "lazuee",
      screenshotStatus: "ready",
      screenshotKey: "showcase/lazuee/preview-v1.jpeg",
      screenshotCapturedAt: NOW - 45 * DAY,
    })
    const recent = candidate({
      name: "kaylmatyu",
      screenshotStatus: "ready",
      screenshotKey: "showcase/kaylmatyu/preview-v3.jpeg",
      screenshotCapturedAt: NOW - DAY,
    })

    expect(swept([stale, recent])).toEqual(["lazuee"])
  })

  it("serves never-captured portfolios before refreshes", () => {
    const uncaptured = candidate({
      name: "asher",
      screenshotStatus: "failed",
      screenshotRetryCount: 6,
      screenshotRequestedAt: NOW - 30 * DAY,
    })
    const stale = candidate({
      name: "aaron",
      screenshotStatus: "ready",
      screenshotKey: "showcase/aaron/preview-v1.jpeg",
      screenshotCapturedAt: NOW - 60 * DAY,
    })

    expect(swept([stale, uncaptured])).toEqual(["asher", "aaron"])
  })

  it("asks for an initial capture only on a portfolio that has never tried", () => {
    const fresh = candidate({ name: "new", screenshotRequestedAt: null })
    const retried = candidate({
      name: "old",
      screenshotStatus: "failed",
      screenshotRetryCount: 4,
      screenshotRequestedAt: NOW - 30 * DAY,
    })
    const refreshable = candidate({
      name: "kept",
      screenshotStatus: "ready",
      screenshotKey: "showcase/kept/preview-v1.jpeg",
      screenshotCapturedAt: NOW - 60 * DAY,
    })

    expect(
      selectRefreshEligible([fresh, retried, refreshable], window())
    ).toEqual([
      { portfolioId: "new", reason: "initial" },
      { portfolioId: "old", reason: "retry" },
      { portfolioId: "kept", reason: "scheduled_refresh" },
    ])
  })

  it("honours the batch limit", () => {
    const many = Array.from({ length: 40 }, (_, i) =>
      candidate({ name: `p${String(i).padStart(2, "0")}` })
    )

    expect(swept(many, window({ limit: 25 }))).toHaveLength(25)
  })
})
