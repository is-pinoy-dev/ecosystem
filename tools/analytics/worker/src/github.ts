const GITHUB_URL =
  "https://api.github.com/repos/is-pinoy-dev/domains/contents/subdomains"
const RAW_BASE =
  "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains"

const USER_AGENT = "is-pinoy.dev analytics worker"

interface GitHubEntry {
  name: string
  type: string
}

interface DomainRecord {
  features?: { analytics?: boolean }
}

/**
 * GitHub rate limits unauthenticated REST calls to 60 an hour **per IP**, and a
 * Worker's egress address is shared across Cloudflare's pool — so in practice
 * the budget is already spent by someone else and the listing call comes back
 * 403. A token moves the limit to 5,000/hr against our own account, which one
 * run a day nowhere near approaches.
 *
 * Optional so a local run still works, mirroring `apps/dashboard/lib/domains.ts`
 * — but in production its absence is the difference between collecting and not.
 */
function headers(token: string | undefined): Record<string, string> {
  const base: Record<string, string> = { "User-Agent": USER_AGENT }
  if (token) base.Authorization = `Bearer ${token}`
  return base
}

/**
 * Subdomains whose visits we are allowed to store.
 *
 * Traffic to a proxied subdomain is measured at Cloudflare's edge whether we ask
 * for it or not, so an opt-out is only meaningful if it happens before anything
 * is persisted. Any subdomain whose record sets `features.analytics: false` is
 * dropped here and never reaches the database.
 *
 * A record we cannot read is a different case and must not be confused with an
 * opt-out. It is never treated as consent — but it does not silently vanish
 * either: the whole run aborts. Dropping unreadable records individually meant
 * a rate-limited run stored a day for whichever handful of subdomains happened
 * to answer, and because the writes are keyed on the date and the backfill only
 * looks at the newest date present, that partial day then looked complete to
 * every later run. Aborting costs nothing — the writes are idempotent and the
 * next run re-collects the date.
 */
export async function fetchSubdomains(token?: string): Promise<string[]> {
  const res = await fetch(GITHUB_URL, { headers: headers(token) })
  if (!res.ok) {
    const hint =
      res.status === 403 && !token
        ? " (unauthenticated requests are rate limited per IP and a Worker's" +
          " egress IP is shared — set the GITHUB_TOKEN secret)"
        : ""
    throw new Error(`GitHub API error: ${res.status}${hint}`)
  }
  const files = (await res.json()) as GitHubEntry[]

  const names = files
    .filter((f) => f.type === "file" && f.name.endsWith(".json"))
    .map((f) => f.name.replace(/\.json$/, ""))

  const checked = await Promise.all(
    names.map(async (subdomain) => {
      try {
        const record = await fetch(`${RAW_BASE}/${subdomain}.json`, {
          headers: headers(token),
        })
        if (!record.ok) return { subdomain, readable: false, allowed: false }
        const data = (await record.json()) as DomainRecord
        return {
          subdomain,
          readable: true,
          allowed: data.features?.analytics !== false,
        }
      } catch {
        return { subdomain, readable: false, allowed: false }
      }
    })
  )

  const unreadable = checked.filter((entry) => !entry.readable)
  if (unreadable.length > 0) {
    const sample = unreadable
      .slice(0, 5)
      .map((entry) => entry.subdomain)
      .join(", ")
    throw new Error(
      `Could not read ${unreadable.length}/${names.length} subdomain records ` +
        `(${sample}${unreadable.length > 5 ? ", …" : ""}) — aborting rather ` +
        `than storing a partial day`
    )
  }

  return checked
    .filter((entry) => entry.allowed)
    .map((entry) => entry.subdomain)
}
