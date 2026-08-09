// Portfolio preview resolution.
//
// The showcase ranks previews: a real screenshot first, then the portfolio's
// own og:image, then the OG card this worker generates. The middle rung lives
// here so the web app never has to fan out to every portfolio at render time —
// the browser asks for one URL per card and the edge cache absorbs the rest.

/** Mirrors the registry's own label rules (see screenshots/src/security.ts). */
const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/

function isRegistrableLabel(value: string): boolean {
  return (
    value.length >= 3 &&
    value.length <= 63 &&
    !value.includes(".") &&
    SUBDOMAIN_PATTERN.test(value)
  )
}

/**
 * Which portfolio a request is about. Served on `<name>.is-pinoy.dev` the host
 * answers it; on the apex the caller must name one, because portfolios pointed
 * at an external host never route through this Worker themselves. The parameter
 * ends up in an outbound URL, so an unregistrable label is refused outright.
 */
export function resolveRequestedSubdomain(
  hostname: string,
  searchParams: URLSearchParams
): string | null {
  const parts = hostname.split(".")
  const hostLabel =
    parts.length > 2 ? parts.slice(0, parts.length - 2).join(".") : null
  if (hostLabel) return hostLabel

  const requested = searchParams.get("subdomain")?.trim().toLowerCase()
  if (!requested || !isRegistrableLabel(requested)) return null
  return requested
}

/** og:image sits in <head>; there is no reason to drain a whole portfolio. */
const MAX_HTML_BYTES = 96 * 1024
const PORTFOLIO_TIMEOUT_MS = 4000

/** Reads at most `maxBytes` of a response body and decodes it as text. */
export async function readLimitedText(
  response: Response,
  maxBytes: number
): Promise<string> {
  const body = response.body
  if (!body) return ""

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let read = 0
  let text = ""

  try {
    while (read < maxBytes) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      const slice =
        read + value.length > maxBytes
          ? value.subarray(0, maxBytes - read)
          : value
      read += slice.length
      text += decoder.decode(slice, { stream: true })
    }
  } finally {
    await reader.cancel().catch(() => {})
  }

  return text + decoder.decode()
}

/**
 * Ask a portfolio for its own og:image. Every failure — offline site, slow
 * response, no tag — collapses to null so the caller falls through to the
 * generated card.
 */
export async function resolvePortfolioOgImage(
  subdomain: string,
  fetchImpl: typeof fetch = fetch
): Promise<string | null> {
  const baseUrl = `https://${subdomain}.is-pinoy.dev/`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PORTFOLIO_TIMEOUT_MS)

  try {
    const response = await fetchImpl(baseUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html",
        "User-Agent": "is-pinoy-dev-og/1.0 (+https://is-pinoy.dev)",
      },
    })
    if (!response.ok) return null
    const html = await readLimitedText(response, MAX_HTML_BYTES)
    return extractOgImageUrl(html, baseUrl)
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

const OG_IMAGE_PATTERNS = [
  /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["']/i,
]

/**
 * Pull the og:image out of a portfolio's HTML and return it as an absolute URL.
 * Returns null when the tag is missing or names a scheme a browser must not be
 * asked to load as an image — the value comes from a third-party page, so
 * `data:`, `javascript:`, and friends are rejected rather than passed through.
 */
export function extractOgImageUrl(
  html: string,
  baseUrl: string
): string | null {
  for (const pattern of OG_IMAGE_PATTERNS) {
    const raw = html.match(pattern)?.[1]?.trim()
    if (!raw) continue
    try {
      const resolved = new URL(raw, baseUrl)
      if (resolved.protocol !== "https:" && resolved.protocol !== "http:") {
        return null
      }
      return resolved.href
    } catch {
      return null
    }
  }
  return null
}
