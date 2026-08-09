// Preview status vocabulary shared by the showcase server components and the
// client card. Kept free of `server-only` so both sides — and tests — can use it.

/** Capture states the screenshot worker tracks for a portfolio it knows about. */
export type ShowcaseScreenshotStatus =
  | "pending"
  | "processing"
  | "ready"
  | "failed"

/**
 * What the showcase renders for. Adds `unknown` for subdomains the manifest has
 * no row for: the worker may be unreachable, unconfigured, or simply not
 * tracking the entry yet. Absent metadata is not a capture in flight, so it must
 * never be presented as one.
 */
export type ShowcasePreviewStatus = ShowcaseScreenshotStatus | "unknown"

export function previewStatusFor(
  screenshot: { screenshotStatus: ShowcaseScreenshotStatus } | undefined
): ShowcasePreviewStatus {
  return screenshot?.screenshotStatus ?? "unknown"
}

/**
 * Second and third rungs of the preview ranking, behind one URL: the og Worker
 * serves the portfolio's own og:image, or the OG card it generates. Requested
 * from the apex because portfolios pointed at an external host never route
 * through the Worker on their own hostname. The browser fetches this, so the
 * showcase still makes exactly one server-side request for the whole grid.
 */
export function previewFallbackUrl(subdomain: string): string {
  return `/_tools/og/preview?subdomain=${encodeURIComponent(subdomain)}`
}
