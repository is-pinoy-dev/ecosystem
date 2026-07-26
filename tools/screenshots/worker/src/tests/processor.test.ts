import { describe, expect, it } from "vitest"

import {
  isPortfolioScreenshotJob,
  processScreenshotJob,
  retryDelayForFailureCount,
} from "../processor"
import type { ScreenshotBrowser } from "../browser"
import type { ScreenshotRepository } from "../repository"
import type { ScreenshotStorage } from "../storage"
import type {
  ClaimedScreenshotJob,
  PortfolioRecord,
  PortfolioScreenshotJob,
} from "../types"

const REQUESTED_AT = "2026-07-26T00:00:00.000Z"
const JOB: PortfolioScreenshotJob = {
  version: 1,
  portfolioId: "juan",
  reason: "initial",
  requestedAt: REQUESTED_AT,
}

function portfolio(overrides: Partial<PortfolioRecord> = {}): PortfolioRecord {
  return {
    name: "juan",
    ownerGithub: "juandelacruz",
    syncStatus: "synced",
    screenshotStatus: "pending",
    screenshotKey: null,
    screenshotUrl: null,
    screenshotCapturedAt: null,
    screenshotRequestedAt: Date.parse(REQUESTED_AT),
    screenshotFailureReason: null,
    screenshotRetryCount: 0,
    screenshotVersion: 0,
    ...overrides,
  }
}

class FakeRepository implements ScreenshotRepository {
  row: PortfolioRecord | null = portfolio()
  readyValues: unknown = null
  failedReason: string | null = null
  claimCount = 0

  async getPortfolio(): Promise<PortfolioRecord | null> {
    return this.row
  }

  async claimJob(): Promise<ClaimedScreenshotJob | null> {
    this.claimCount++
    if (!this.row) return null
    this.row = {
      ...this.row,
      screenshotStatus: "processing",
      screenshotVersion: this.row.screenshotVersion + 1,
    }
    return {
      portfolio: this.row,
      version: this.row.screenshotVersion,
    }
  }

  async markReady(
    _portfolioId: string,
    _version: number,
    values: { key: string; url: string; capturedAt: number }
  ): Promise<boolean> {
    this.readyValues = values
    if (!this.row) return false
    this.row = {
      ...this.row,
      screenshotStatus: "ready",
      screenshotKey: values.key,
      screenshotUrl: values.url,
      screenshotCapturedAt: values.capturedAt,
      screenshotFailureReason: null,
      screenshotRetryCount: 0,
    }
    return true
  }

  async markFailed(
    _portfolioId: string,
    _version: number,
    reason: string
  ): Promise<number | null> {
    this.failedReason = reason
    if (!this.row) return null
    const retryCount = this.row.screenshotRetryCount + 1
    this.row = {
      ...this.row,
      screenshotStatus: "failed",
      screenshotFailureReason: reason,
      screenshotRetryCount: retryCount,
    }
    return retryCount
  }
}

const successfulBrowser: ScreenshotBrowser = {
  async capture() {
    return {
      bytes: new Uint8Array([1, 2, 3]),
      contentType: "image/jpeg",
    }
  },
}

const storage: ScreenshotStorage = {
  async put(portfolioId, version) {
    const key = `showcase/${portfolioId}/preview-v${version}.jpeg`
    return { key, url: `https://images.example/${key}` }
  },
}

describe("screenshot job processing", () => {
  it("moves a successful job through processing to ready", async () => {
    const repository = new FakeRepository()
    const result = await processScreenshotJob(JOB, {
      repository,
      browser: successfulBrowser,
      storage,
      now: () => Date.parse("2026-07-26T00:01:00.000Z"),
    })

    expect(result).toEqual({ outcome: "ready", version: 1 })
    expect(repository.row?.screenshotStatus).toBe("ready")
    expect(repository.row?.screenshotKey).toBe("showcase/juan/preview-v1.jpeg")
    expect(repository.row?.screenshotRetryCount).toBe(0)
  })

  it("is idempotent when an equal or newer screenshot already exists", async () => {
    const repository = new FakeRepository()
    repository.row = portfolio({
      screenshotStatus: "ready",
      screenshotCapturedAt: Date.parse(REQUESTED_AT),
    })

    const result = await processScreenshotJob(JOB, {
      repository,
      browser: successfulBrowser,
      storage,
    })

    expect(result).toEqual({ outcome: "idempotent" })
    expect(repository.claimCount).toBe(0)
  })

  it("records a sanitized failed transition", async () => {
    const repository = new FakeRepository()
    const browser: ScreenshotBrowser = {
      async capture() {
        throw new Error("request timed out with secret header")
      },
    }

    const result = await processScreenshotJob(JOB, {
      repository,
      browser,
      storage,
    })

    expect(result).toMatchObject({
      outcome: "failed",
      retryCount: 1,
      errorCode: "timeout",
    })
    expect(repository.row?.screenshotStatus).toBe("failed")
    expect(repository.failedReason).toBe("The portfolio took too long to load.")
    expect(repository.failedReason).not.toContain("secret")
  })

  it("caps automatic retries after the third retry is scheduled", () => {
    expect(retryDelayForFailureCount(1)).toBe(300)
    expect(retryDelayForFailureCount(2)).toBe(1_800)
    expect(retryDelayForFailureCount(3)).toBe(21_600)
    expect(retryDelayForFailureCount(4)).toBeNull()
  })

  it("rejects queue payloads containing a client-supplied URL", () => {
    expect(
      isPortfolioScreenshotJob({
        ...JOB,
        url: "https://attacker.example/",
      })
    ).toBe(false)
  })
})
