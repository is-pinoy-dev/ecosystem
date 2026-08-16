import { classifyScreenshotError } from "./errors"
import { canonicalPortfolioUrl, isValidPortfolioId } from "./security"
import type { ScreenshotRepository } from "./repository"
import type { ScreenshotBrowser } from "./browser"
import type { ScreenshotStorage } from "./storage"
import type { PortfolioScreenshotJob } from "./types"

export type ProcessResult =
  | { outcome: "ignored"; reason: "invalid" | "not_found" | "inactive" }
  | { outcome: "idempotent" }
  | { outcome: "ready"; version: number }
  | {
      outcome: "failed"
      retryCount: number | null
      errorCode: string
    }

export interface ProcessorDependencies {
  repository: ScreenshotRepository
  browser: ScreenshotBrowser
  storage: ScreenshotStorage
  now?: () => number
}

function log(event: string, fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ event, ...fields }))
}

export function isPortfolioScreenshotJob(
  value: unknown
): value is PortfolioScreenshotJob {
  if (!value || typeof value !== "object") return false
  const job = value as Record<string, unknown>
  return (
    Object.keys(job).length === 4 &&
    job.version === 1 &&
    typeof job.portfolioId === "string" &&
    isValidPortfolioId(job.portfolioId) &&
    (job.reason === "initial" ||
      job.reason === "manual_refresh" ||
      job.reason === "scheduled_refresh" ||
      job.reason === "retry") &&
    typeof job.requestedAt === "string" &&
    Number.isFinite(Date.parse(job.requestedAt))
  )
}

export async function processScreenshotJob(
  job: PortfolioScreenshotJob,
  dependencies: ProcessorDependencies
): Promise<ProcessResult> {
  if (!isPortfolioScreenshotJob(job)) {
    return { outcome: "ignored", reason: "invalid" }
  }

  const { repository, browser, storage } = dependencies
  const now = dependencies.now ?? Date.now
  const portfolio = await repository.getPortfolio(job.portfolioId)
  if (!portfolio) return { outcome: "ignored", reason: "not_found" }
  if (portfolio.syncStatus !== "synced") {
    return { outcome: "ignored", reason: "inactive" }
  }

  const requestedAt = Date.parse(job.requestedAt)
  if (
    portfolio.screenshotCapturedAt !== null &&
    portfolio.screenshotCapturedAt >= requestedAt
  ) {
    return { outcome: "idempotent" }
  }

  const url = canonicalPortfolioUrl(portfolio.name)
  const claim = await repository.claimJob(job.portfolioId, requestedAt)
  if (!claim) return { outcome: "idempotent" }

  const startedAt = now()
  log("screenshot.capture.started", {
    portfolioId: job.portfolioId,
    reason: job.reason,
    attempt: claim.portfolio.screenshotRetryCount + 1,
    durationMs: 0,
  })

  try {
    const capture = await browser.capture(url, portfolio.name)
    const stored = await storage.put(portfolio.name, claim.version, capture)
    log("screenshot.upload.succeeded", {
      portfolioId: job.portfolioId,
      reason: job.reason,
      attempt: claim.portfolio.screenshotRetryCount + 1,
      durationMs: now() - startedAt,
      key: stored.key,
    })

    const ready = await repository.markReady(portfolio.name, claim.version, {
      ...stored,
      capturedAt: now(),
    })
    if (!ready) return { outcome: "idempotent" }

    log("screenshot.capture.succeeded", {
      portfolioId: job.portfolioId,
      reason: job.reason,
      attempt: claim.portfolio.screenshotRetryCount + 1,
      durationMs: now() - startedAt,
      bytes: capture.bytes.byteLength,
      // A picture of a page that never went quiet. Under the old wait this was
      // a timeout and no picture at all.
      settled: capture.settled,
    })
    return { outcome: "ready", version: claim.version }
  } catch (error) {
    const classified = classifyScreenshotError(error)
    const retryCount = await repository.markFailed(
      portfolio.name,
      claim.version,
      classified.ownerMessage
    )
    log("screenshot.capture.failed", {
      portfolioId: job.portfolioId,
      reason: job.reason,
      attempt: claim.portfolio.screenshotRetryCount + 1,
      durationMs: now() - startedAt,
      errorCode: classified.code,
      retryCount,
      url: url.href,
    })
    return {
      outcome: "failed",
      retryCount,
      errorCode: classified.code,
    }
  }
}

const RETRY_DELAYS_SECONDS = [5 * 60, 30 * 60, 6 * 60 * 60] as const

export function retryDelayForFailureCount(
  failureCount: number | null
): number | null {
  if (failureCount === null || failureCount < 1 || failureCount > 3) {
    return null
  }
  return RETRY_DELAYS_SECONDS[failureCount - 1] ?? null
}
