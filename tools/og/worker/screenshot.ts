// The auto-captured portfolio screenshot, as this Worker sees it.
//
// `tools/screenshots` captures every synced portfolio on a schedule, stores the
// JPEG in R2 under a versioned key, and records that key on the portfolio's row.
// Both images this Worker serves — the showcase preview and the OG card — put
// that capture first, so the picture of a portfolio is the portfolio, not a
// graphic standing in for one. The key alone is not enough to guess: it carries
// a capture version, so the row has to be read.

export interface ScreenshotEnv {
  /** The dashboard D1, read-only here. Absent in local dev and previews. */
  SCREENSHOT_DB?: D1Database
  /** Public origin fronting the screenshot bucket, e.g. https://cdn.is-pinoy.dev */
  SCREENSHOT_PUBLIC_BASE_URL?: string
}

/**
 * Compose the public URL for a stored capture. Returns null when either half is
 * missing — an unconfigured base URL must not produce a relative or `undefined/`
 * URL that then 404s as if the capture itself were gone.
 */
export function screenshotUrlFrom(
  baseUrl: string | undefined,
  key: string | null | undefined
): string | null {
  if (!baseUrl || !key) return null
  return `${baseUrl.replace(/\/+$/, "")}/${key}`
}

/**
 * The capture stored for a portfolio, or null when there is none to show.
 *
 * A key is used whenever the row has one, regardless of the capture status the
 * screenshot Worker is currently reporting: a queued or failed refresh leaves
 * the previous capture in place, and the last good picture of a site beats no
 * picture at all. Only a portfolio that has never been captured falls through.
 *
 * Every failure — no binding, D1 unavailable, unknown portfolio — collapses to
 * null so the caller simply moves to the next rung.
 */
export async function resolveScreenshotUrl(
  subdomain: string,
  env: ScreenshotEnv
): Promise<string | null> {
  if (!env.SCREENSHOT_DB) return null

  try {
    const row = await env.SCREENSHOT_DB.prepare(
      `SELECT screenshot_key FROM subdomains
       WHERE name = ? AND sync_status = 'synced'`
    )
      .bind(subdomain)
      .first<{ screenshot_key: string | null }>()

    return screenshotUrlFrom(
      env.SCREENSHOT_PUBLIC_BASE_URL,
      row?.screenshot_key
    )
  } catch {
    return null
  }
}

/**
 * Every portfolio this Worker would serve a stored capture for.
 *
 * The landing page shows only sites it has a real picture of, and this is the
 * same question `resolveScreenshotUrl` answers one subdomain at a time — asked
 * once for the whole grid. Answering it here rather than in the web app keeps
 * one definition of "captured": the row this Worker reads through its binding,
 * not a manifest the web app has to hold a shared secret to reach.
 *
 * Every failure collapses to null, which the caller must distinguish from an
 * empty list — "no captures exist" and "could not find out" lead to different
 * pages.
 */
export async function listCapturedSubdomains(
  env: ScreenshotEnv
): Promise<string[] | null> {
  if (!env.SCREENSHOT_DB) return null

  try {
    const { results } = await env.SCREENSHOT_DB.prepare(
      `SELECT name FROM subdomains
       WHERE sync_status = 'synced' AND screenshot_key IS NOT NULL
       ORDER BY name ASC`
    ).all<{ name: string }>()

    return (results ?? []).map((row) => row.name).filter(Boolean)
  } catch {
    return null
  }
}

/**
 * Does this og:image point back at an image this Worker generates?
 *
 * Portfolios we host declare their og:image as their own `/_tools/og/image`, so
 * following it would have the preview endpoint proxy its own last rung over the
 * network before arriving where it was always going to end up. Recognising the
 * loop lets the caller skip straight to generating the card.
 */
export function isSelfGeneratedOgImage(imageUrl: string): boolean {
  try {
    const { hostname, pathname } = new URL(imageUrl)
    const onPlatform =
      hostname === "is-pinoy.dev" || hostname.endsWith(".is-pinoy.dev")
    return onPlatform && pathname.startsWith("/_tools/og/")
  } catch {
    return false
  }
}
