import { CloudflareBrowser } from "./src/browser"
import {
  processScreenshotJob,
  isPortfolioScreenshotJob,
  retryDelayForFailureCount,
} from "./src/processor"
import { D1ScreenshotRepository, failedRetryBackoffMs } from "./src/repository"
import { isValidPortfolioId } from "./src/security"
import { publicScreenshotUrl, R2ScreenshotStorage } from "./src/storage"
import {
  JOB_REASONS,
  type Env,
  type PortfolioScreenshotJob,
  type ScreenshotJobReason,
} from "./src/types"

const MAX_TRIGGER_BATCH = 25
const DEFAULT_REFRESH_DAYS = 30
const DEFAULT_MANUAL_COOLDOWN_HOURS = 24
const STALE_PROCESSING_MS = 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
/**
 * How many portfolios without a picture the sweep names in its log. The
 * registry is a table of tens, so this prints the whole backlog rather than a
 * sample — the point is to be able to read why each one is stuck.
 */
const UNCAPTURED_LOG_LIMIT = 50

function numericSetting(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

async function secretsEqual(
  presented: string,
  expected: string
): Promise<boolean> {
  if (!presented || !expected) return false
  const encoder = new TextEncoder()
  const [presentedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(presented)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ])
  const a = new Uint8Array(presentedHash)
  const b = new Uint8Array(expectedHash)
  let difference = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    difference |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return difference === 0
}

async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  const header = request.headers.get("authorization") ?? ""
  const presented = header.replace(/^Bearer\s+/i, "")
  return secretsEqual(presented, env.SCREENSHOT_WORKER_SECRET)
}

interface RequestedJob {
  portfolioId: string
  reason: ScreenshotJobReason
}

function parseRequestedJobs(value: unknown): RequestedJob[] | null {
  if (!value || typeof value !== "object") return null
  const body = value as Record<string, unknown>
  if (Object.keys(body).length !== 1 || !Array.isArray(body.jobs)) return null
  if (body.jobs.length < 1 || body.jobs.length > MAX_TRIGGER_BATCH) return null

  const parsed: RequestedJob[] = []
  for (const value of body.jobs) {
    if (!value || typeof value !== "object") return null
    const job = value as Record<string, unknown>
    if (
      Object.keys(job).length !== 2 ||
      typeof job.portfolioId !== "string" ||
      !isValidPortfolioId(job.portfolioId) ||
      typeof job.reason !== "string" ||
      !JOB_REASONS.includes(job.reason as ScreenshotJobReason)
    ) {
      return null
    }
    parsed.push({
      portfolioId: job.portfolioId,
      reason: job.reason as ScreenshotJobReason,
    })
  }
  return parsed
}

function structuredLog(event: string, fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ event, ...fields }))
}

/**
 * Run a read that exists only to be logged, surviving its failure.
 *
 * Diagnostics must never be able to stop the work they describe: a sweep that
 * skipped every portfolio because a count query failed would be a far worse bug
 * than the blind spot the count was added to close.
 */
async function observed<T>(
  query: string,
  read: () => Promise<T>
): Promise<T | null> {
  try {
    return await read()
  } catch (error) {
    structuredLog("screenshot.sweep.diagnostic_failed", {
      query,
      errorName: error instanceof Error ? error.name : "UnknownError",
    })
    return null
  }
}

async function enqueueRequestedJobs(
  jobs: RequestedJob[],
  env: Env
): Promise<
  {
    portfolioId: string
    accepted: boolean
    reason?: string
    retryAfterSeconds?: number
  }[]
> {
  const repository = new D1ScreenshotRepository(env.SCREENSHOT_DB)
  const now = Date.now()
  const cooldownMs =
    numericSetting(
      env.PORTFOLIO_SCREENSHOT_MANUAL_COOLDOWN_HOURS,
      DEFAULT_MANUAL_COOLDOWN_HOURS
    ) *
    60 *
    60 *
    1000

  const results = []
  for (const requested of jobs) {
    const requestedAt = Date.now()
    const result = await repository.requestJob(
      requested.portfolioId,
      requested.reason,
      requestedAt,
      cooldownMs
    )
    if (!result.accepted) {
      // A refused job leaves no other trace. Unlogged, a portfolio the registry
      // has stopped calling `synced` simply stops appearing anywhere.
      structuredLog("screenshot.job.rejected", {
        portfolioId: requested.portfolioId,
        reason: requested.reason,
        rejectedBecause: result.reason ?? "unknown",
      })
      results.push({ portfolioId: requested.portfolioId, ...result })
      continue
    }

    const job: PortfolioScreenshotJob = {
      version: 1,
      portfolioId: requested.portfolioId,
      reason: requested.reason,
      requestedAt: new Date(requestedAt).toISOString(),
    }
    try {
      await env.SCREENSHOT_QUEUE.send(job)
      structuredLog("screenshot.job.queued", {
        portfolioId: job.portfolioId,
        reason: job.reason,
        attempt: 0,
        durationMs: Date.now() - now,
      })
      results.push({ portfolioId: requested.portfolioId, accepted: true })
    } catch {
      await repository.markQueueFailure(requested.portfolioId, requestedAt)
      results.push({
        portfolioId: requested.portfolioId,
        accepted: false,
        reason: "queue_unavailable",
      })
    }
  }
  return results
}

/**
 * The daily sweep, and the one place the whole showcase can be seen at once.
 *
 * It logs what it found before it logs what it did: a sweep that enqueues
 * nothing is indistinguishable from a sweep that never ran unless the backlog
 * it was looking at is on the record beside it.
 */
async function scheduleRefreshBatch(env: Env): Promise<void> {
  const repository = new D1ScreenshotRepository(env.SCREENSHOT_DB)
  const startedAt = Date.now()
  const refreshDays = numericSetting(
    env.PORTFOLIO_SCREENSHOT_REFRESH_DAYS,
    DEFAULT_REFRESH_DAYS
  )

  const health = await observed("health", () => repository.screenshotHealth())
  const eligible = await repository.listRefreshEligible({
    now: startedAt,
    refreshAfterMs: refreshDays * DAY_MS,
    staleProcessingMs: STALE_PROCESSING_MS,
    limit: MAX_TRIGGER_BATCH,
  })
  const results = await enqueueRequestedJobs(eligible, env)

  structuredLog("screenshot.sweep.completed", {
    durationMs: Date.now() - startedAt,
    limit: MAX_TRIGGER_BATCH,
    eligible: eligible.length,
    enqueued: results.filter((result) => result.accepted).length,
    rejected: results.filter((result) => !result.accepted).length,
    // The sweep filled its batch, so there is more waiting than one run can
    // take. Several days of this in a row is the backlog outrunning the cron.
    saturated: eligible.length >= MAX_TRIGGER_BATCH,
    ...(health ?? {}),
  })

  const uncaptured = await observed("uncaptured", () =>
    repository.listUncaptured(UNCAPTURED_LOG_LIMIT)
  )
  if (uncaptured && uncaptured.length > 0) {
    structuredLog("screenshot.sweep.uncaptured", {
      count: uncaptured.length,
      portfolios: uncaptured,
    })
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!(await isAuthorized(request, env))) {
      return Response.json({ error: "unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    if (request.method === "GET" && url.pathname === "/v1/showcase") {
      const repository = new D1ScreenshotRepository(env.SCREENSHOT_DB)
      const entries = (await repository.listShowcase()).map((entry) => ({
        ...entry,
        screenshotUrl: entry.screenshotKey
          ? publicScreenshotUrl(
              env.SCREENSHOT_PUBLIC_BASE_URL,
              entry.screenshotKey
            )
          : null,
      }))
      return Response.json({ entries })
    }

    if (request.method === "POST" && url.pathname === "/v1/jobs") {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return Response.json({ error: "invalid JSON body" }, { status: 400 })
      }
      const jobs = parseRequestedJobs(body)
      if (!jobs) {
        return Response.json({ error: "invalid payload" }, { status: 400 })
      }

      const results = await enqueueRequestedJobs(jobs, env)
      const onlyResult = results.length === 1 ? results[0] : null
      const status =
        onlyResult?.reason === "cooldown"
          ? 429
          : results.some((result) => result.accepted)
            ? 202
            : 409
      return Response.json({ results }, { status })
    }

    return Response.json({ error: "not found" }, { status: 404 })
  },

  async queue(
    batch: MessageBatch<PortfolioScreenshotJob>,
    env: Env
  ): Promise<void> {
    const repository = new D1ScreenshotRepository(env.SCREENSHOT_DB)
    const browser = new CloudflareBrowser(env.BROWSER)
    const storage = new R2ScreenshotStorage(
      env.SCREENSHOT_BUCKET,
      env.SCREENSHOT_PUBLIC_BASE_URL
    )

    for (const message of batch.messages) {
      if (!isPortfolioScreenshotJob(message.body)) {
        message.ack()
        continue
      }

      try {
        const result = await processScreenshotJob(message.body, {
          repository,
          browser,
          storage,
        })
        if (result.outcome === "failed") {
          const delaySeconds = retryDelayForFailureCount(result.retryCount)
          if (delaySeconds === null) {
            // The fast ladder is spent. This used to be where a portfolio left
            // the showcase permanently and without a word; it now falls back to
            // the daily sweep, so say so and say when.
            structuredLog("screenshot.job.ladder_exhausted", {
              portfolioId: message.body.portfolioId,
              reason: message.body.reason,
              attempt: result.retryCount,
              errorCode: result.errorCode,
              nextSweepAfterMs: failedRetryBackoffMs(result.retryCount ?? 0),
            })
          } else {
            const requestedAt = Date.now()
            const retryJob: PortfolioScreenshotJob = {
              version: 1,
              portfolioId: message.body.portfolioId,
              reason: "retry",
              requestedAt: new Date(requestedAt).toISOString(),
            }
            await repository.markRetryScheduled(
              retryJob.portfolioId,
              requestedAt
            )
            await env.SCREENSHOT_QUEUE.send(retryJob, { delaySeconds })
            structuredLog("screenshot.job.retried", {
              portfolioId: message.body.portfolioId,
              reason: "retry",
              attempt: result.retryCount,
              delaySeconds,
              durationMs: 0,
            })
          }
        }
        message.ack()
      } catch {
        message.retry({
          delaySeconds: retryDelayForFailureCount(message.attempts) ?? 300,
        })
      }
    }
  },

  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await scheduleRefreshBatch(env)
  },
} satisfies ExportedHandler<Env, PortfolioScreenshotJob>
