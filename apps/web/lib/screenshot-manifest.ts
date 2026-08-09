import "server-only"

import type { ShowcaseScreenshotStatus } from "./showcase-preview"

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
  if (!workerUrl || !workerSecret) {
    console.warn(
      "[screenshots] manifest skipped: SCREENSHOT_WORKER_URL or SCREENSHOT_WORKER_SECRET is unset"
    )
    return new Map()
  }

  try {
    const response = await fetch(
      `${workerUrl.replace(/\/+$/, "")}/v1/showcase`,
      {
        headers: { Authorization: `Bearer ${workerSecret}` },
        next: { revalidate: 300 },
      }
    )
    // A failure here degrades every card to "no preview", so it must not be
    // silent — a 401 means the shared secret drifted from the Worker binding.
    if (!response.ok) {
      console.warn(
        `[screenshots] manifest request failed with ${response.status}`
      )
      return new Map()
    }
    const body = (await response.json()) as ManifestResponse
    const entries = Array.isArray(body.entries) ? body.entries : []
    return new Map(entries.map((entry) => [entry.subdomain, entry]))
  } catch (error) {
    console.warn("[screenshots] manifest request threw", error)
    return new Map()
  }
}
