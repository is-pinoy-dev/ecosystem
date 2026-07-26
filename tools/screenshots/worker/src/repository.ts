import type {
  ClaimedScreenshotJob,
  PortfolioRecord,
  ScreenshotJobReason,
  ScreenshotManifestEntry,
} from "./types"

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

  async listRefreshEligible(
    cutoff: number,
    staleProcessingCutoff: number,
    retryQueueCutoff: number,
    limit: number
  ): Promise<{ portfolioId: string; reason: ScreenshotJobReason }[]> {
    const { results } = await this.database
      .prepare(
        `SELECT name, screenshot_key, screenshot_status,
                screenshot_retry_count
         FROM subdomains
         WHERE sync_status = 'synced' AND (
           (
             screenshot_key IS NULL
             AND screenshot_status = 'pending'
             AND screenshot_requested_at IS NULL
           )
           OR (
             screenshot_status = 'pending'
             AND screenshot_requested_at < ?
           )
           OR (
             screenshot_status = 'failed'
             AND screenshot_retry_count <= 3
             AND (
               screenshot_requested_at IS NULL
               OR screenshot_requested_at < ?
             )
           )
           OR (
             screenshot_status = 'processing'
             AND screenshot_requested_at < ?
           )
           OR (
             screenshot_key IS NOT NULL
             AND screenshot_captured_at < ?
             AND screenshot_status NOT IN ('pending', 'processing')
           )
         )
         ORDER BY COALESCE(screenshot_captured_at, 0) ASC, name ASC
         LIMIT ?`
      )
      .bind(
        retryQueueCutoff,
        retryQueueCutoff,
        staleProcessingCutoff,
        cutoff,
        limit
      )
      .all<{
        name: string
        screenshot_key: string | null
        screenshot_status: string
        screenshot_retry_count: number
      }>()

    return results.map((row) => ({
      portfolioId: row.name,
      reason:
        row.screenshot_key === null && row.screenshot_retry_count === 0
          ? "initial"
          : row.screenshot_key === null ||
              row.screenshot_status === "processing"
            ? "retry"
            : "scheduled_refresh",
    }))
  }
}
