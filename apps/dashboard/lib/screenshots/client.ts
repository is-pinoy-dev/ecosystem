import "server-only"

export type ScreenshotJobReason =
  | "initial"
  | "manual_refresh"
  | "scheduled_refresh"
  | "retry"

export interface ScreenshotJobRequest {
  portfolioId: string
  reason: ScreenshotJobReason
}

interface WorkerJobResult {
  portfolioId: string
  accepted: boolean
  reason?: string
  retryAfterSeconds?: number
}

interface WorkerResponse {
  results?: WorkerJobResult[]
  error?: string
}

export class ScreenshotWorkerError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds?: number
  ) {
    super(message)
    this.name = "ScreenshotWorkerError"
  }
}

function workerConfig(): { url: string; secret: string } {
  const url = process.env.SCREENSHOT_WORKER_URL
  const secret = process.env.SCREENSHOT_WORKER_SECRET
  if (!url || !secret) {
    throw new ScreenshotWorkerError(
      "Screenshot processing is not configured.",
      503
    )
  }
  return { url: url.replace(/\/+$/, ""), secret }
}

/**
 * Whether a refresh can reach the Worker at all. Server components use this to
 * decide whether to offer the control, so an unconfigured deployment stays
 * quiet instead of handing out a button whose only outcome is an error.
 */
export function hasScreenshotWorker(): boolean {
  return Boolean(
    process.env.SCREENSHOT_WORKER_URL && process.env.SCREENSHOT_WORKER_SECRET
  )
}

export async function enqueueScreenshotJobs(
  jobs: ScreenshotJobRequest[]
): Promise<WorkerJobResult[]> {
  if (jobs.length < 1 || jobs.length > 25) {
    throw new ScreenshotWorkerError(
      "Screenshot batches must contain between 1 and 25 jobs.",
      400
    )
  }

  const config = workerConfig()
  const response = await fetch(`${config.url}/v1/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ jobs }),
    cache: "no-store",
  })
  const body = (await response.json().catch(() => ({}))) as WorkerResponse
  const first = body.results?.[0]
  if (!response.ok) {
    throw new ScreenshotWorkerError(
      first?.reason === "cooldown"
        ? "Preview refresh is still in its cooldown period."
        : body.error || first?.reason || "Could not queue the preview refresh.",
      response.status,
      first?.retryAfterSeconds
    )
  }
  return body.results ?? []
}
