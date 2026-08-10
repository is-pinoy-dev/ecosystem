import "server-only"

// Which portfolios there is a real capture of, read from the og Worker.
//
// The showcase's card images already resolve captures through that Worker's own
// D1 binding (`/_tools/og/preview`), so asking it directly is what keeps the
// landing page from disagreeing with the grid about which sites have been
// photographed. The screenshot Worker's manifest answers the same question but
// only for a caller holding the shared secret, and a landing page that silently
// empties itself when that secret drifts is worse than one extra request.

const DEFAULT_ORIGIN = "https://is-pinoy.dev"

/**
 * The captured subdomains, or null when the Worker could not be asked.
 *
 * Null is not an empty set: "nothing has been captured" is a fact about the
 * showcase, while "the request failed" is a fact about our infrastructure, and
 * the caller owes the visitor different pages for the two.
 */
export async function getCapturedSubdomains(): Promise<Set<string> | null> {
  const origin = (process.env.OG_WORKER_ORIGIN ?? DEFAULT_ORIGIN).replace(
    /\/+$/,
    ""
  )

  try {
    const response = await fetch(`${origin}/_tools/og/captured`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    })
    if (!response.ok) {
      console.warn(`[showcase] captured list failed with ${response.status}`)
      return null
    }
    const body = (await response.json()) as { subdomains?: unknown }
    if (!Array.isArray(body.subdomains)) {
      console.warn("[showcase] captured list returned an unexpected shape")
      return null
    }
    return new Set(
      body.subdomains.filter(
        (name): name is string => typeof name === "string" && name.length > 0
      )
    )
  } catch (error) {
    console.warn("[showcase] captured list request threw", error)
    return null
  }
}
