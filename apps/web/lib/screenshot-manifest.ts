import "server-only"

export type ShowcaseScreenshotStatus =
  | "pending"
  | "processing"
  | "ready"
  | "failed"

export interface ShowcaseScreenshot {
  portfolioId: string
  subdomain: string
  ownerGithub: string
  screenshotStatus: ShowcaseScreenshotStatus
  screenshotKey: string | null
  screenshotUrl: string | null
  screenshotCapturedAt: string | null
  screenshotRequestedAt: string | null
  screenshotFailureReason: string | null
  screenshotRetryCount: number
  screenshotVersion: number
}

interface ManifestResponse {
  entries?: ShowcaseScreenshot[]
}

export async function getScreenshotManifest(): Promise<
  Map<string, ShowcaseScreenshot>
> {
  const workerUrl = process.env.SCREENSHOT_WORKER_URL
  const workerSecret = process.env.SCREENSHOT_WORKER_SECRET
  if (!workerUrl || !workerSecret) return new Map()

  try {
    const response = await fetch(
      `${workerUrl.replace(/\/+$/, "")}/v1/showcase`,
      {
        headers: { Authorization: `Bearer ${workerSecret}` },
        next: { revalidate: 300 },
      }
    )
    if (!response.ok) return new Map()
    const body = (await response.json()) as ManifestResponse
    const entries = Array.isArray(body.entries) ? body.entries : []
    return new Map(entries.map((entry) => [entry.subdomain, entry]))
  } catch {
    return new Map()
  }
}
