// Single source of truth for the list of registered subdomains.
//
// Data lives as `subdomains/<name>.json` files in the is-pinoy-dev/domains repo.
// This utility lists those files, loads each record, and enriches it with the
// GitHub commit timestamps for the file:
//   - createdOn: the first commit that added the file  → true registration date
//   - updatedOn: the most recent commit touching it    → last-modified date
//
// Entries are returned sorted newest-first by createdOn so both the landing-page
// marquee and the showcase grid can render them in chronological order from a
// single fetch. Results are cached via Next's `revalidate` so the N+1 GitHub
// calls only run once per revalidation window.

const DOMAINS_REPO = "is-pinoy-dev/domains"
const REVALIDATE_SECONDS = 3600

export interface RegisteredSubdomain {
  subdomain: string
  owner: { github: string; email?: string }
  records: Record<string, unknown>
  /** ISO date of the first commit that added the file, or null if unknown. */
  createdOn: string | null
  /** ISO date of the most recent commit touching the file, or null if unknown. */
  updatedOn: string | null
}

type DomainFile = {
  owner: { github: string; email?: string }
  records: Record<string, unknown>
  destroy?: boolean
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  }
  // Optional token raises the unauthenticated 60 req/hr rate limit. Works without.
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

/** Parse the `page` number of the `rel="last"` entry from a GitHub Link header. */
function parseLastPage(link: string | null): number | null {
  if (!link) return null
  const match = link.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/)
  return match ? Number(match[1]) : null
}

/**
 * Fetch the created (first commit) and updated (latest commit) dates for a
 * subdomain's JSON file. GitHub returns commits newest-first, so the latest
 * commit is page 1 and the first commit is the last page — we follow the Link
 * header to grab it without paging through everything in between.
 */
async function fetchTimestamps(
  subdomain: string,
): Promise<{ createdOn: string | null; updatedOn: string | null }> {
  const path = `subdomains/${subdomain}.json`
  const baseUrl = `https://api.github.com/repos/${DOMAINS_REPO}/commits?path=${encodeURIComponent(
    path,
  )}&per_page=1`

  try {
    const res = await fetch(baseUrl, {
      headers: githubHeaders(),
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) return { createdOn: null, updatedOn: null }

    const latest = (await res.json()) as { commit?: { committer?: { date?: string } } }[]
    const updatedOn = latest[0]?.commit?.committer?.date ?? null

    // A single commit means created === updated; no extra request needed.
    const lastPage = parseLastPage(res.headers.get("link"))
    if (!lastPage || lastPage <= 1) {
      return { createdOn: updatedOn, updatedOn }
    }

    const firstRes = await fetch(`${baseUrl}&page=${lastPage}`, {
      headers: githubHeaders(),
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!firstRes.ok) return { createdOn: updatedOn, updatedOn }

    const oldest = (await firstRes.json()) as { commit?: { committer?: { date?: string } } }[]
    const createdOn = oldest[0]?.commit?.committer?.date ?? updatedOn
    return { createdOn, updatedOn }
  } catch {
    return { createdOn: null, updatedOn: null }
  }
}

/**
 * Returns every registered (non-destroyed) subdomain with its commit
 * timestamps, sorted newest-first by registration date. Shared by the landing
 * page marquee and the showcase grid.
 */
export async function getRegisteredSubdomains(): Promise<RegisteredSubdomain[]> {
  let names: string[] = []
  try {
    const res = await fetch(
      `https://api.github.com/repos/${DOMAINS_REPO}/contents/subdomains`,
      {
        headers: githubHeaders(),
        next: { revalidate: REVALIDATE_SECONDS },
      },
    )
    if (res.ok) {
      const files = (await res.json()) as { name: string }[]
      names = files
        .filter((f) => f.name.endsWith(".json"))
        .map((f) => f.name.replace(/\.json$/, ""))
    }
  } catch {
    // no-op — fall through to empty list
  }

  if (names.length === 0) return []

  const results = await Promise.allSettled(
    names.map(async (subdomain): Promise<RegisteredSubdomain | null> => {
      const [contentRes, timestamps] = await Promise.all([
        fetch(
          `https://raw.githubusercontent.com/${DOMAINS_REPO}/main/subdomains/${subdomain}.json`,
          { next: { revalidate: REVALIDATE_SECONDS } },
        ),
        fetchTimestamps(subdomain),
      ])
      if (!contentRes.ok) return null
      const data = (await contentRes.json()) as DomainFile
      if (data.destroy) return null
      return {
        subdomain,
        owner: data.owner,
        records: data.records,
        createdOn: timestamps.createdOn,
        updatedOn: timestamps.updatedOn,
      }
    }),
  )

  return results
    .filter(
      (r): r is PromiseFulfilledResult<RegisteredSubdomain> =>
        r.status === "fulfilled" && r.value !== null,
    )
    .map((r) => r.value)
    .sort((a, b) => {
      // Newest registration first; entries with unknown dates sink to the bottom.
      const ta = a.createdOn ? Date.parse(a.createdOn) : 0
      const tb = b.createdOn ? Date.parse(b.createdOn) : 0
      return tb - ta
    })
}
