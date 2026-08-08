const GRAPHQL_URL = "https://api.github.com/graphql"

const OWNER = "is-pinoy-dev"
const REPO = "domains"
const EXPRESSION = "main:subdomains"

const USER_AGENT = "is-pinoy.dev analytics worker"

/**
 * The registry listing and every record body, in one request.
 *
 * The REST version cost one call to list the directory plus one per record —
 * roughly 47 in total. A Worker on the free plan gets **50 external subrequests
 * per invocation**, so that left three for the rest of the run and a thirty-day
 * backfill died on its fourth date with "Too many subrequests by single Worker
 * invocation". GraphQL returns a tree's entries with their blob text attached,
 * so the whole registry costs one subrequest and the budget goes to collecting
 * days instead of re-reading records.
 *
 * A blob's `text` is null for binary or oversized files. Registry records are
 * neither, so a null there is a genuine "could not read" and is treated as one.
 */
const QUERY = `
  query RegistryRecords($owner: String!, $repo: String!, $expression: String!) {
    repository(owner: $owner, name: $repo) {
      object(expression: $expression) {
        ... on Tree {
          entries {
            name
            object {
              ... on Blob {
                text
              }
            }
          }
        }
      }
    }
  }
`

interface TreeEntry {
  name: string
  object: { text?: string | null } | null
}

interface GQLResponse {
  data?: { repository?: { object?: { entries?: TreeEntry[] } | null } | null }
  errors?: Array<{ message: string }>
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
 * A record we cannot read is a different case and must not be confused with an
 * opt-out. It is never treated as consent — but it does not silently vanish
 * either: the whole run aborts. Dropping unreadable records individually meant
 * a failed read stored the day for whichever records happened to answer, and
 * because the writes are keyed on the date and the backfill only looks at the
 * newest date present, that partial day then looked complete to every later
 * run. Aborting costs nothing — the writes are idempotent and the next run
 * re-collects the date.
 */
export async function fetchSubdomains(token?: string): Promise<string[]> {
  // Unlike the REST endpoints this replaces, GitHub's GraphQL API rejects
  // unauthenticated requests outright rather than rate limiting them.
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is not set — the GraphQL registry read requires authentication"
    )
  }

  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { owner: OWNER, repo: REPO, expression: EXPRESSION },
    }),
  })

  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)

  const json = (await res.json()) as GQLResponse
  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${json.errors[0].message}`)
  }

  const entries = json.data?.repository?.object?.entries
  if (!entries) {
    throw new Error(
      `No tree at ${OWNER}/${REPO} ${EXPRESSION} — aborting rather than ` +
        `treating a missing registry as an empty one`
    )
  }

  const records = entries.filter((entry) => entry.name.endsWith(".json"))

  const allowed: string[] = []
  const unreadable: string[] = []

  for (const entry of records) {
    const subdomain = entry.name.replace(/\.json$/, "")
    const text = entry.object?.text
    if (typeof text !== "string") {
      unreadable.push(subdomain)
      continue
    }
    try {
      const data = JSON.parse(text) as DomainRecord
      if (data.features?.analytics !== false) allowed.push(subdomain)
    } catch {
      unreadable.push(subdomain)
    }
  }

  if (unreadable.length > 0) {
    const sample = unreadable.slice(0, 5).join(", ")
    throw new Error(
      `Could not read ${unreadable.length}/${records.length} subdomain records ` +
        `(${sample}${unreadable.length > 5 ? ", …" : ""}) — aborting rather ` +
        `than storing a partial day`
    )
  }

  return allowed
}
