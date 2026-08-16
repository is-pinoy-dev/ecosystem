import type {
  ClaimedScreenshotJob,
  PortfolioRecord,
  ScreenshotJobReason,
  ScreenshotManifestEntry,
  ScreenshotStatus,
} from "./types"

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/**
 * How long a failed portfolio waits before the daily sweep tries it again,
 * keyed by how many times it has already failed.
 *
 * The in-queue ladder (5m, 30m, 6h) owns the first three retries, so the first
 * tier only has to outlast it. Past that the sweep is the only thing still
 * trying — and it backs off rather than giving up. Giving up is not a rest
 * state a portfolio can leave: a failed row's retry count is reset only by a
 * successful capture, which it can only get by being swept. A site whose DNS
 * lapsed for a fortnight, or whose host redirected away during a migration,
 * has to be able to come back on its own once the site does.
 */
export const FAILED_RETRY_LADDER = [
  { throughRetryCount: 3, backoffMs: 7 * HOUR_MS },
  { throughRetryCount: 6, backoffMs: DAY_MS },
  { throughRetryCount: 9, backoffMs: 7 * DAY_MS },
] as const

/** Where a portfolio that keeps failing settles: one attempt a month, forever. */
export const FAILED_RETRY_FLOOR_MS = 30 * DAY_MS

/**
 * How long a `pending` row waits before the sweep re-queues it.
 *
 * A row that has never failed is pending only because the queue send was lost,
 * so an hour is long enough to be sure and short enough that a new claim is not
 * left waiting a day. One that has failed may still be working through the
 * in-queue ladder, where re-queuing would just double the work.
 */
const PENDING_REQUEUE_MS = HOUR_MS
const PENDING_LADDER_MS = 7 * HOUR_MS

/** The wait a failed portfolio owes before the sweep will try it again. */
export function failedRetryBackoffMs(retryCount: number): number {
  for (const tier of FAILED_RETRY_LADDER) {
    if (retryCount <= tier.throughRetryCount) return tier.backoffMs
  }
  return FAILED_RETRY_FLOOR_MS
}

/** A portfolio row as the sweep reads it — just enough to judge it by. */
export interface SweepCandidate {
  name: string
  screenshotStatus: ScreenshotStatus
  screenshotKey: string | null
  screenshotCapturedAt: number | null
  screenshotRequestedAt: number | null
  screenshotRetryCount: number
}

export interface RefreshSweepWindow {
  /** The sweep's clock, in epoch ms. Every wait below is measured against it. */
  now: number
  /** A capture older than this is due to be taken again. */
  refreshAfterMs: number
  /** A `processing` row untouched for this long is a capture that crashed. */
  staleProcessingMs: number
  /** The most jobs one sweep may enqueue. */
  limit: number
}

/** Milliseconds since `at`, treating "never" as infinitely long ago. */
function elapsedSince(at: number | null, now: number): number {
  return at === null ? Number.POSITIVE_INFINITY : now - at
}

/**
 * Why this portfolio is due for a capture, or null if it is not.
 *
 * Every state a row can rest in is answered here, and none of the answers is
 * permanent — a row the sweep declines today is a row it will look at again
 * tomorrow. That is the whole point: this is the only scheduler, so any state
 * it cannot leave is a portfolio that leaves the showcase for good.
 */
export function refreshReasonFor(
  candidate: SweepCandidate,
  window: RefreshSweepWindow
): ScreenshotJobReason | null {
  const { now } = window
  const waited = elapsedSince(candidate.screenshotRequestedAt, now)
  // A portfolio with no stored capture is being photographed for the first
  // time; one that already has a picture is having it retaken.
  const recapture: ScreenshotJobReason =
    candidate.screenshotKey === null
      ? candidate.screenshotRetryCount === 0
        ? "initial"
        : "retry"
      : "scheduled_refresh"

  switch (candidate.screenshotStatus) {
    case "pending":
      return waited >=
        (candidate.screenshotRetryCount === 0
          ? PENDING_REQUEUE_MS
          : PENDING_LADDER_MS)
        ? recapture
        : null
    case "failed":
      return waited >= failedRetryBackoffMs(candidate.screenshotRetryCount)
        ? recapture
        : null
    case "processing":
      return waited >= window.staleProcessingMs ? "retry" : null
    case "ready":
      // A `ready` row with no key never happens through `markReady`, but if one
      // ever appears it is a portfolio with no picture and no other way back.
      if (candidate.screenshotKey === null) return recapture
      return elapsedSince(candidate.screenshotCapturedAt, now) >=
        window.refreshAfterMs
        ? "scheduled_refresh"
        : null
  }
}

/**
 * The batch this sweep should enqueue, most deserving first.
 *
 * Portfolios with no picture at all come before refreshes, and among equals the
 * least recently attempted wins. That last tiebreak is load-bearing: every
 * never-captured row ties on capture date, so ordering by name instead handed
 * the same alphabetical prefix to every run and starved the tail of a backlog
 * larger than one batch.
 */
export function selectRefreshEligible(
  candidates: SweepCandidate[],
  window: RefreshSweepWindow
): { portfolioId: string; reason: ScreenshotJobReason }[] {
  return candidates
    .map((candidate) => ({
      candidate,
      reason: refreshReasonFor(candidate, window),
    }))
    .filter(
      (
        entry
      ): entry is { candidate: SweepCandidate; reason: ScreenshotJobReason } =>
        entry.reason !== null
    )
    .sort(
      (a, b) =>
        (a.candidate.screenshotCapturedAt ?? 0) -
          (b.candidate.screenshotCapturedAt ?? 0) ||
        (a.candidate.screenshotRequestedAt ?? 0) -
          (b.candidate.screenshotRequestedAt ?? 0) ||
        a.candidate.name.localeCompare(b.candidate.name)
    )
    .slice(0, window.limit)
    .map((entry) => ({
      portfolioId: entry.candidate.name,
      reason: entry.reason,
    }))
}

interface D1PortfolioRow {
  name: string
  owner_github: string
  sync_status: string
  screenshot_status: PortfolioRecord["screenshotStatus"]
  screenshot_key: string | null
  screenshot_url: string | null
  screenshot_captured_at: number | null
  screenshot_requested_at: number | null
  screenshot_failure_reason: string | null
  screenshot_retry_count: number
  screenshot_version: number
}

export interface RequestJobResult {
  accepted: boolean
  reason?: "not_found" | "inactive" | "cooldown"
  retryAfterSeconds?: number
}

/** Where every synced portfolio stands, counted for one log line. */
export interface ScreenshotHealth {
  synced: number
  captured: number
  pending: number
  processing: number
  ready: number
  failed: number
  /** Failed past the in-queue ladder — these live or die by the sweep alone. */
  failedPastQueueRetries: number
}

export interface UncapturedPortfolio {
  portfolioId: string
  status: ScreenshotStatus
  retryCount: number
  failureReason: string | null
}

export interface ScreenshotRepository {
  getPortfolio(portfolioId: string): Promise<PortfolioRecord | null>
  claimJob(
    portfolioId: string,
    requestedAt: number
  ): Promise<ClaimedScreenshotJob | null>
  markReady(
    portfolioId: string,
    version: number,
    values: {
      key: string
      url: string
      capturedAt: number
    }
  ): Promise<boolean>
  markFailed(
    portfolioId: string,
    version: number,
    reason: string
  ): Promise<number | null>
}

const SELECT_COLUMNS = `
  name, owner_github, sync_status, screenshot_status, screenshot_key,
  screenshot_url, screenshot_captured_at, screenshot_requested_at,
  screenshot_failure_reason, screenshot_retry_count, screenshot_version
`

function toPortfolio(row: D1PortfolioRow): PortfolioRecord {
  return {
    name: row.name,
    ownerGithub: row.owner_github,
    syncStatus: row.sync_status,
    screenshotStatus: row.screenshot_status,
    screenshotKey: row.screenshot_key,
    screenshotUrl: row.screenshot_url,
    screenshotCapturedAt: row.screenshot_captured_at,
    screenshotRequestedAt: row.screenshot_requested_at,
    screenshotFailureReason: row.screenshot_failure_reason,
    screenshotRetryCount: row.screenshot_retry_count,
    screenshotVersion: row.screenshot_version,
  }
}

export class D1ScreenshotRepository implements ScreenshotRepository {
  constructor(private readonly database: D1Database) {}

  async getPortfolio(portfolioId: string): Promise<PortfolioRecord | null> {
    const row = await this.database
      .prepare(`SELECT ${SELECT_COLUMNS} FROM subdomains WHERE name = ?`)
      .bind(portfolioId)
      .first<D1PortfolioRow>()
    return row ? toPortfolio(row) : null
  }

  async requestJob(
    portfolioId: string,
    reason: ScreenshotJobReason,
    requestedAt: number,
    manualCooldownMs: number
  ): Promise<RequestJobResult> {
    const portfolio = await this.getPortfolio(portfolioId)
    if (!portfolio) return { accepted: false, reason: "not_found" }
    if (portfolio.syncStatus !== "synced") {
      return { accepted: false, reason: "inactive" }
    }

    if (
      reason === "manual_refresh" &&
      portfolio.screenshotRequestedAt !== null
    ) {
      const availableAt = portfolio.screenshotRequestedAt + manualCooldownMs
      if (availableAt > requestedAt) {
        return {
          accepted: false,
          reason: "cooldown",
          retryAfterSeconds: Math.ceil((availableAt - requestedAt) / 1000),
        }
      }
    }

    const cutoff = requestedAt - manualCooldownMs
    const statement =
      reason === "manual_refresh"
        ? this.database.prepare(
            `UPDATE subdomains
             SET screenshot_status = 'pending',
                 screenshot_requested_at = ?
             WHERE name = ? AND sync_status = 'synced'
               AND (screenshot_requested_at IS NULL OR screenshot_requested_at <= ?)`
          )
        : this.database.prepare(
            `UPDATE subdomains
             SET screenshot_status = 'pending',
                 screenshot_requested_at = ?
             WHERE name = ? AND sync_status = 'synced'`
          )
    const result =
      reason === "manual_refresh"
        ? await statement.bind(requestedAt, portfolioId, cutoff).run()
        : await statement.bind(requestedAt, portfolioId).run()

    if ((result.meta.changes ?? 0) === 0 && reason === "manual_refresh") {
      const current = await this.getPortfolio(portfolioId)
      const retryAfterSeconds = current?.screenshotRequestedAt
        ? Math.max(
            1,
            Math.ceil(
              (current.screenshotRequestedAt + manualCooldownMs - requestedAt) /
                1000
            )
          )
        : undefined
      return {
        accepted: false,
        reason: "cooldown",
        retryAfterSeconds,
      }
    }
    return { accepted: true }
  }

  async markQueueFailure(
    portfolioId: string,
    requestedAt: number
  ): Promise<void> {
    await this.database
      .prepare(
        `UPDATE subdomains
         SET screenshot_status = 'failed',
             screenshot_failure_reason = 'The preview request could not be queued.'
         WHERE name = ? AND screenshot_requested_at = ?
           AND screenshot_status = 'pending'`
      )
      .bind(portfolioId, requestedAt)
      .run()
  }

  async markRetryScheduled(
    portfolioId: string,
    requestedAt: number
  ): Promise<void> {
    await this.database
      .prepare(
        `UPDATE subdomains
         SET screenshot_requested_at = ?
         WHERE name = ? AND screenshot_status = 'failed'`
      )
      .bind(requestedAt, portfolioId)
      .run()
  }

  async claimJob(
    portfolioId: string,
    requestedAt: number
  ): Promise<ClaimedScreenshotJob | null> {
    const row = await this.database
      .prepare(
        `UPDATE subdomains
         SET screenshot_status = 'processing',
             screenshot_version = screenshot_version + 1
         WHERE name = ? AND sync_status = 'synced'
           AND (
             screenshot_captured_at IS NULL
             OR screenshot_captured_at < ?
           )
         RETURNING ${SELECT_COLUMNS}`
      )
      .bind(portfolioId, requestedAt)
      .first<D1PortfolioRow>()

    if (!row) return null
    const portfolio = toPortfolio(row)
    return { portfolio, version: portfolio.screenshotVersion }
  }

  async markReady(
    portfolioId: string,
    version: number,
    values: { key: string; url: string; capturedAt: number }
  ): Promise<boolean> {
    const result = await this.database
      .prepare(
        `UPDATE subdomains
         SET screenshot_status = 'ready',
             screenshot_key = ?,
             screenshot_url = ?,
             screenshot_captured_at = ?,
             screenshot_failure_reason = NULL,
             screenshot_retry_count = 0
         WHERE name = ? AND screenshot_version = ?`
      )
      .bind(values.key, values.url, values.capturedAt, portfolioId, version)
      .run()
    return (result.meta.changes ?? 0) > 0
  }

  async markFailed(
    portfolioId: string,
    version: number,
    reason: string
  ): Promise<number | null> {
    const row = await this.database
      .prepare(
        `UPDATE subdomains
         SET screenshot_status = 'failed',
             screenshot_failure_reason = ?,
             screenshot_retry_count = screenshot_retry_count + 1
         WHERE name = ? AND screenshot_version = ?
         RETURNING screenshot_retry_count`
      )
      .bind(reason.slice(0, 240), portfolioId, version)
      .first<{ screenshot_retry_count: number }>()
    return row?.screenshot_retry_count ?? null
  }

  async listShowcase(): Promise<ScreenshotManifestEntry[]> {
    const { results } = await this.database
      .prepare(
        `SELECT ${SELECT_COLUMNS}
         FROM subdomains
         WHERE sync_status = 'synced'
         ORDER BY created_at DESC, name ASC`
      )
      .all<D1PortfolioRow>()
    return results.map((row) => {
      const portfolio = toPortfolio(row)
      return {
        portfolioId: portfolio.name,
        subdomain: portfolio.name,
        ownerGithub: portfolio.ownerGithub,
        screenshotStatus: portfolio.screenshotStatus,
        screenshotKey: portfolio.screenshotKey,
        screenshotUrl: portfolio.screenshotUrl,
        screenshotCapturedAt: portfolio.screenshotCapturedAt
          ? new Date(portfolio.screenshotCapturedAt).toISOString()
          : null,
        screenshotRequestedAt: portfolio.screenshotRequestedAt
          ? new Date(portfolio.screenshotRequestedAt).toISOString()
          : null,
        screenshotFailureReason: portfolio.screenshotFailureReason,
        screenshotRetryCount: portfolio.screenshotRetryCount,
        screenshotVersion: portfolio.screenshotVersion,
      }
    })
  }

  /**
   * The batch the daily sweep should enqueue.
   *
   * Which rows are due is decided in `selectRefreshEligible` rather than in SQL.
   * The registry is a table of tens, reread once a day across five narrow
   * columns, so a full scan costs nothing worth defending — and the schedule is
   * the part of this Worker that decides whether a portfolio is ever seen
   * again, which makes being able to test it directly the thing worth buying.
   */
  async listRefreshEligible(
    window: RefreshSweepWindow
  ): Promise<{ portfolioId: string; reason: ScreenshotJobReason }[]> {
    const { results } = await this.database
      .prepare(
        `SELECT name, screenshot_status, screenshot_key,
                screenshot_captured_at, screenshot_requested_at,
                screenshot_retry_count
         FROM subdomains
         WHERE sync_status = 'synced'`
      )
      .all<{
        name: string
        screenshot_status: ScreenshotStatus
        screenshot_key: string | null
        screenshot_captured_at: number | null
        screenshot_requested_at: number | null
        screenshot_retry_count: number
      }>()

    return selectRefreshEligible(
      (results ?? []).map((row) => ({
        name: row.name,
        screenshotStatus: row.screenshot_status,
        screenshotKey: row.screenshot_key,
        screenshotCapturedAt: row.screenshot_captured_at,
        screenshotRequestedAt: row.screenshot_requested_at,
        screenshotRetryCount: row.screenshot_retry_count,
      })),
      window
    )
  }

  /**
   * A count of where every synced portfolio stands, for the sweep to log.
   *
   * The showcase silently sat at twelve captures for a week because nothing
   * ever reported the shape of the backlog — only individual jobs were logged,
   * and a portfolio that stopped being scheduled stopped producing logs at all.
   */
  async screenshotHealth(): Promise<ScreenshotHealth> {
    const row = await this.database
      .prepare(
        `SELECT
           count(*) AS synced,
           sum(CASE WHEN screenshot_key IS NOT NULL THEN 1 ELSE 0 END) AS captured,
           sum(CASE WHEN screenshot_status = 'pending' THEN 1 ELSE 0 END) AS pending,
           sum(CASE WHEN screenshot_status = 'processing' THEN 1 ELSE 0 END) AS processing,
           sum(CASE WHEN screenshot_status = 'ready' THEN 1 ELSE 0 END) AS ready,
           sum(CASE WHEN screenshot_status = 'failed' THEN 1 ELSE 0 END) AS failed,
           sum(CASE WHEN screenshot_status = 'failed' AND screenshot_retry_count > ?
                    THEN 1 ELSE 0 END) AS failedPastQueueRetries
         FROM subdomains
         WHERE sync_status = 'synced'`
      )
      .bind(FAILED_RETRY_LADDER[0].throughRetryCount)
      .first<Record<keyof ScreenshotHealth, number | null>>()

    return {
      synced: row?.synced ?? 0,
      captured: row?.captured ?? 0,
      pending: row?.pending ?? 0,
      processing: row?.processing ?? 0,
      ready: row?.ready ?? 0,
      failed: row?.failed ?? 0,
      failedPastQueueRetries: row?.failedPastQueueRetries ?? 0,
    }
  }

  /**
   * The portfolios with no picture yet, worst first, with the reason recorded
   * against each. This is the answer to "why is the showcase stuck at N", and
   * it belongs where somebody looking for that answer will be: the Worker log.
   */
  async listUncaptured(limit: number): Promise<UncapturedPortfolio[]> {
    const { results } = await this.database
      .prepare(
        `SELECT name, screenshot_status, screenshot_retry_count,
                screenshot_failure_reason
         FROM subdomains
         WHERE sync_status = 'synced' AND screenshot_key IS NULL
         ORDER BY screenshot_retry_count DESC, name ASC
         LIMIT ?`
      )
      .bind(limit)
      .all<{
        name: string
        screenshot_status: ScreenshotStatus
        screenshot_retry_count: number
        screenshot_failure_reason: string | null
      }>()

    return (results ?? []).map((row) => ({
      portfolioId: row.name,
      status: row.screenshot_status,
      retryCount: row.screenshot_retry_count,
      failureReason: row.screenshot_failure_reason,
    }))
  }
}
