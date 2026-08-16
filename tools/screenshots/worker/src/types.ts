export const JOB_REASONS = [
  "initial",
  "manual_refresh",
  "scheduled_refresh",
  "retry",
] as const

export type ScreenshotJobReason = (typeof JOB_REASONS)[number]

export interface PortfolioScreenshotJob {
  version: 1
  portfolioId: string
  reason: ScreenshotJobReason
  requestedAt: string
}

export type ScreenshotStatus = "pending" | "processing" | "ready" | "failed"

export interface PortfolioRecord {
  name: string
  ownerGithub: string
  syncStatus: string
  screenshotStatus: ScreenshotStatus
  screenshotKey: string | null
  screenshotUrl: string | null
  screenshotCapturedAt: number | null
  screenshotRequestedAt: number | null
  screenshotFailureReason: string | null
  screenshotRetryCount: number
  screenshotVersion: number
}

export interface ClaimedScreenshotJob {
  portfolio: PortfolioRecord
  version: number
}

export interface CaptureResult {
  bytes: Uint8Array
  contentType: "image/jpeg"
  /**
   * Whether the page went quiet before we photographed it. False means it never
   * stopped making requests and we took the picture anyway — worth knowing,
   * because that case used to be recorded as an outright failure.
   */
  settled: boolean
}

/** The half of a capture that gets stored. How it went is not R2's business. */
export type StoredCapture = Pick<CaptureResult, "bytes" | "contentType">

export interface ScreenshotManifestEntry {
  portfolioId: string
  subdomain: string
  ownerGithub: string
  screenshotStatus: ScreenshotStatus
  screenshotKey: string | null
  screenshotUrl: string | null
  screenshotCapturedAt: string | null
  screenshotRequestedAt: string | null
  screenshotFailureReason: string | null
  screenshotRetryCount: number
  screenshotVersion: number
}

export interface Env {
  SCREENSHOT_DB: D1Database
  SCREENSHOT_BUCKET: R2Bucket
  SCREENSHOT_QUEUE: Queue<PortfolioScreenshotJob>
  BROWSER: Fetcher
  SCREENSHOT_WORKER_SECRET: string
  SCREENSHOT_PUBLIC_BASE_URL: string
  PORTFOLIO_SCREENSHOT_REFRESH_DAYS?: string
  PORTFOLIO_SCREENSHOT_MANUAL_COOLDOWN_HOURS?: string
}
