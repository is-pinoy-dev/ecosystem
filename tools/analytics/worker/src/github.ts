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
 * Subdomains whose visits we are allowed to store.
 *
 * Traffic to a proxied subdomain is measured at Cloudflare's edge whether we ask
 * for it or not, so an opt-out is only meaningful if it happens before anything
 * is persisted. Any subdomain whose record sets `features.analytics: false` is
 * dropped here and never reaches the database.
 *
 * A record we cannot read is dropped as well: losing one subdomain's numbers for
 * a day is recoverable, storing visits for someone who opted out is not.
 */
export async function fetchSubdomains(): Promise<string[]> {
  const res = await fetch(GITHUB_URL, {
    headers: { "User-Agent": USER_AGENT },
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  const files = (await res.json()) as GitHubEntry[]

  const names = files
    .filter((f) => f.type === "file" && f.name.endsWith(".json"))
    .map((f) => f.name.replace(/\.json$/, ""))

  const checked = await Promise.all(
    names.map(async (subdomain) => {
      try {
        const record = await fetch(`${RAW_BASE}/${subdomain}.json`, {
          headers: { "User-Agent": USER_AGENT },
        })
        if (!record.ok) return null
        const data = (await record.json()) as DomainRecord
        return data.features?.analytics === false ? null : subdomain
      } catch {
        return null
      }
    })
  )

  return checked.filter((name): name is string => name !== null)
}
