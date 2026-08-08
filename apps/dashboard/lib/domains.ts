// Registry data for the dashboard.
//
// Primary source is the local database — a read model of the
// is-pinoy-dev/domains repo kept current by the sync workflow POSTing to
// /api/registry/events after each Cloudflare sync. When the Cloudflare D1 env
// vars are not configured the dashboard falls back to reading the repo via the
// GitHub API (same source the public website reads): one listing call plus
// one raw-content fetch per file, cached via Next's `revalidate`.

import { asc } from "drizzle-orm"

import { getDb, hasDatabase } from "@/lib/db"
import { subdomains, type SyncStatus } from "@/lib/db/schema"

const DOMAINS_REPO = "is-pinoy-dev/domains"
const REVALIDATE_SECONDS = 300

export interface RegistrySubdomain {
  subdomain: string
  owner: { github: string; email?: string }
  records: Record<string, unknown>
  /** Opt-in platform tools (`features.tools.*`). */
  features?: Record<string, unknown> | null
  /** Only available when reading from the database. */
  syncStatus?: SyncStatus
  lastError?: string | null
  lastSyncedAt?: Date | null
  createdAt?: Date | null
  updatedAt?: Date | null
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

async function getSubdomainsFromDb(): Promise<RegistrySubdomain[]> {
  const rows = await getDb()
    .select()
    .from(subdomains)
    .orderBy(asc(subdomains.name))

  return rows.map((row) => ({
    subdomain: row.name,
    owner: { github: row.ownerGithub, email: row.ownerEmail ?? undefined },
    records: row.records,
    features: row.features,
    syncStatus: row.syncStatus,
    lastError: row.lastError,
    lastSyncedAt: row.lastSyncedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }))
}

/** Every registered (non-destroyed) subdomain in the registry, sorted by name. */
export async function getRegistrySubdomains(): Promise<RegistrySubdomain[]> {
  if (hasDatabase()) {
    try {
      return await getSubdomainsFromDb()
    } catch (error) {
      // A misconfigured database used to be worse than an absent one. With no
      // credentials the listing quietly served from GitHub; with wrong ones —
      // a token lacking `Account -> D1 -> Edit`, or one carrying a newline
      // picked up from a paste — the query threw and took the whole page with
      // it. The fallback exists precisely because git is the source of truth
      // and D1 only a read model, so there is no reason a broken read model
      // should be fatal when a missing one is not.
      //
      // Logged rather than swallowed: the page recovers, but silently serving
      // the slower path forever is its own failure.
      console.error(
        "[domains] registry database unavailable, serving from GitHub instead",
        error
      )
    }
  }

  return getSubdomainsFromGitHub()
}

/**
 * The registry as the public website reads it: one listing call plus one raw
 * fetch per record. Slower and missing the sync metadata D1 carries, but it
 * depends on nothing but the repo being public.
 */
async function getSubdomainsFromGitHub(): Promise<RegistrySubdomain[]> {
  let names: string[] = []
  try {
    const res = await fetch(
      `https://api.github.com/repos/${DOMAINS_REPO}/contents/subdomains`,
      {
        headers: githubHeaders(),
        next: { revalidate: REVALIDATE_SECONDS },
      }
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
    names.map(async (subdomain): Promise<RegistrySubdomain | null> => {
      const res = await fetch(
        `https://raw.githubusercontent.com/${DOMAINS_REPO}/main/subdomains/${subdomain}.json`,
        { next: { revalidate: REVALIDATE_SECONDS } }
      )
      if (!res.ok) return null
      const data = (await res.json()) as {
        owner: { github: string; email?: string }
        records: Record<string, unknown>
        features?: Record<string, unknown>
        destroy?: boolean
      }
      if (data.destroy) return null
      return {
        subdomain,
        owner: data.owner,
        records: data.records,
        features: data.features ?? null,
      }
    })
  )

  return results
    .filter(
      (r): r is PromiseFulfilledResult<RegistrySubdomain> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value)
    .sort((a, b) => a.subdomain.localeCompare(b.subdomain))
}

/** Registry snapshot scoped to one GitHub account (case-insensitive match). */
export async function getSubdomainsForOwner(login: string): Promise<{
  owned: RegistrySubdomain[]
  registryTotal: number
}> {
  const all = await getRegistrySubdomains()
  const normalized = login.toLowerCase()
  return {
    owned: all.filter((d) => d.owner.github.toLowerCase() === normalized),
    registryTotal: all.length,
  }
}

/** Flatten a record's DNS entry types for display, e.g. ["A", "CNAME"]. */
export function recordTypes(records: Record<string, unknown>): string[] {
  return Object.keys(records).map((k) => k.toUpperCase())
}
