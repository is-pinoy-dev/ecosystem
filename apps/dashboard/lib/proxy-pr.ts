import "server-only"

import {
  buildToggledFile,
  proxyBranch,
  subdomainFromHeadLabel,
  summarizeChanges,
  type RecordChange,
} from "@/lib/proxy-record"

// Opens a settings pull request against the public domains repo on the
// signed-in user's behalf, using their OAuth token (public_repo):
//   sync fork → reset branch → read record file → rewrite the record → open PR.
// Carries the proxy flag, the platform tool flags, and the hosted portfolio's
// style — one record file, so one branch and one pull request per subdomain.
//
// Mirrors lib/claim-portfolio.ts, with one structural difference: a claim adds
// a new file, this edits an existing one. That means the file's blob sha is
// required on the PUT, and the fork has to be brought level with upstream first
// or the edit would be computed against a stale copy of the record.

const UPSTREAM_OWNER = "is-pinoy-dev"
const UPSTREAM_REPO = "domains"
const API = "https://api.github.com"

/** Open PRs are listed in pages of 100; three pages is far past the real load. */
const MAX_PR_PAGES = 3

export interface ProxyToggleParams {
  /** Signed-in user's GitHub login (fork owner + record owner). */
  login: string
  subdomain: string
  /** Every record type edited on this subdomain, applied as one commit. */
  changes: RecordChange[]
}

export type ProxyToggleResult =
  | { ok: true; prUrl: string }
  | { ok: false; error: string }

/** An open dashboard-opened proxy PR for one subdomain. */
export interface PendingProxyPR {
  subdomain: string
  url: string
  number: number
}

function headers(token?: string): HeadersInit {
  const base: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  }
  if (token) base.Authorization = `Bearer ${token}`
  return base
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Open proxy PRs for this user, keyed by subdomain. One listing call covers
 * every domain the user owns, so the domains page does not pay a request per
 * row. Unauthenticated when no token is available — the repo is public, this
 * only costs the lower rate limit.
 */
export async function getPendingProxyPRs(
  login: string,
  token?: string
): Promise<Map<string, PendingProxyPR>> {
  const pending = new Map<string, PendingProxyPR>()

  for (let page = 1; page <= MAX_PR_PAGES; page++) {
    let res: Response
    try {
      res = await fetch(
        `${API}/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/pulls?state=open&per_page=100&page=${page}`,
        { headers: headers(token), next: { revalidate: 30 } }
      )
    } catch {
      // Network trouble reading PR state must not break the domains page; the
      // switches simply render without a pending badge.
      return pending
    }
    if (!res.ok) return pending

    const prs = (await res.json()) as {
      number?: number
      html_url?: string
      head?: { label?: string }
    }[]

    for (const pr of prs) {
      const label = pr.head?.label
      if (!label || !pr.html_url || pr.number === undefined) continue
      const subdomain = subdomainFromHeadLabel(label, login)
      if (!subdomain || pending.has(subdomain)) continue
      pending.set(subdomain, {
        subdomain,
        url: pr.html_url,
        number: pr.number,
      })
    }

    if (prs.length < 100) break
  }

  return pending
}

async function getDefaultBranch(
  token: string,
  owner: string,
  repo: string
): Promise<string | null> {
  const res = await fetch(`${API}/repos/${owner}/${repo}`, {
    headers: headers(token),
    cache: "no-store",
  })
  if (!res.ok) return null
  const data = (await res.json()) as { default_branch?: string }
  return data.default_branch ?? null
}

/** Ensure the user has a fork of the domains repo; fork + poll if missing. */
async function ensureFork(
  token: string,
  login: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const forkPath = `${API}/repos/${login}/${UPSTREAM_REPO}`

  const existing = await fetch(forkPath, {
    headers: headers(token),
    cache: "no-store",
  })
  if (existing.ok) return { ok: true }

  const created = await fetch(
    `${API}/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/forks`,
    { method: "POST", headers: headers(token) }
  )
  if (!created.ok && created.status !== 202) {
    return {
      ok: false,
      error: `Could not fork the domains repo (${created.status}).`,
    }
  }

  // Forking is asynchronous — poll until the fork is queryable.
  for (let attempt = 0; attempt < 10; attempt++) {
    await sleep(1200)
    const check = await fetch(forkPath, {
      headers: headers(token),
      cache: "no-store",
    })
    if (check.ok) return { ok: true }
  }
  return {
    ok: false,
    error: "Fork did not become ready in time. Please try again.",
  }
}

/**
 * Fast-forward the fork's default branch to upstream. Best-effort: a fork that
 * has diverged returns 409 and is left alone — the branch reset below still
 * anchors the edit to a known commit.
 */
async function syncFork(token: string, login: string, branch: string) {
  await fetch(`${API}/repos/${login}/${UPSTREAM_REPO}/merge-upstream`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ branch }),
  }).catch(() => undefined)
}

/**
 * Point the working branch at `sha`, creating it when absent and force-resetting
 * it when a previous (now closed or merged) toggle left it behind. Safe to reset
 * because the caller has already established that no open PR uses this branch.
 */
async function resetBranch(
  token: string,
  login: string,
  branch: string,
  sha: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const created = await fetch(
    `${API}/repos/${login}/${UPSTREAM_REPO}/git/refs`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
    }
  )
  if (created.ok) return { ok: true }
  if (created.status !== 422) {
    return {
      ok: false,
      error: `Could not create a branch (${created.status}).`,
    }
  }

  const updated = await fetch(
    `${API}/repos/${login}/${UPSTREAM_REPO}/git/refs/heads/${branch}`,
    {
      method: "PATCH",
      headers: headers(token),
      body: JSON.stringify({ sha, force: true }),
    }
  )
  if (!updated.ok) {
    return {
      ok: false,
      error: `Could not reuse the existing branch (${updated.status}).`,
    }
  }
  return { ok: true }
}

interface RecordFile {
  content: Record<string, unknown>
  sha: string
}

/** Read and parse a subdomain record file from a branch of the fork. */
async function readRecordFile(
  token: string,
  login: string,
  subdomain: string,
  branch: string
): Promise<RecordFile | { error: string }> {
  const res = await fetch(
    `${API}/repos/${login}/${UPSTREAM_REPO}/contents/subdomains/${subdomain}.json?ref=${branch}`,
    { headers: headers(token), cache: "no-store" }
  )
  if (!res.ok) {
    return {
      error:
        res.status === 404
          ? `No record file found for ${subdomain}.is-pinoy.dev.`
          : `Could not read the record file (${res.status}).`,
    }
  }

  const data = (await res.json()) as { content?: string; sha?: string }
  if (!data.content || !data.sha) {
    return { error: "Could not read the record file contents." }
  }

  try {
    const decoded = Buffer.from(data.content, "base64").toString("utf8")
    return {
      content: JSON.parse(decoded) as Record<string, unknown>,
      sha: data.sha,
    }
  } catch {
    return { error: "The record file is not valid JSON." }
  }
}

export async function openProxyTogglePR(
  token: string,
  params: ProxyToggleParams
): Promise<ProxyToggleResult> {
  const { login, subdomain, changes } = params

  const fork = await ensureFork(token, login)
  if (!fork.ok) return fork

  const upstreamBase =
    (await getDefaultBranch(token, UPSTREAM_OWNER, UPSTREAM_REPO)) ?? "main"
  const forkDefault =
    (await getDefaultBranch(token, login, UPSTREAM_REPO)) ?? upstreamBase

  // Bring the fork level with upstream before branching, or the record could be
  // edited from a stale copy and the PR would silently revert newer changes.
  await syncFork(token, login, forkDefault)

  const refRes = await fetch(
    `${API}/repos/${login}/${UPSTREAM_REPO}/git/ref/heads/${forkDefault}`,
    { headers: headers(token), cache: "no-store" }
  )
  if (!refRes.ok) {
    return {
      ok: false,
      error: `Could not read your fork's ${forkDefault} branch.`,
    }
  }
  const refData = (await refRes.json()) as { object?: { sha?: string } }
  const baseSha = refData.object?.sha
  if (!baseSha)
    return { ok: false, error: "Could not determine the base commit." }

  const branch = proxyBranch(subdomain)
  const reset = await resetBranch(token, login, branch, baseSha)
  if (!reset.ok) return reset

  const file = await readRecordFile(token, login, subdomain, branch)
  if ("error" in file) return { ok: false, error: file.error }

  const built = buildToggledFile(file.content, changes)
  if ("error" in built) return { ok: false, error: built.error }

  const summary = summarizeChanges(subdomain, changes)

  const putFile = await fetch(
    `${API}/repos/${login}/${UPSTREAM_REPO}/contents/subdomains/${subdomain}.json`,
    {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({
        message: summary.commitMessage,
        content: Buffer.from(built.content).toString("base64"),
        sha: file.sha,
        branch,
      }),
    }
  )
  if (!putFile.ok) {
    return {
      ok: false,
      error: `Could not update the record file (${putFile.status}).`,
    }
  }

  const prBody = [
    summary.lead,
    "",
    ...summary.bullets,
    "",
    "Opened from the is-pinoy.dev dashboard. Git stays the source of truth —",
    "merging this applies the change on the next sync run.",
  ].join("\n")

  const prRes = await fetch(
    `${API}/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/pulls`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        title: summary.title,
        head: `${login}:${branch}`,
        base: upstreamBase,
        body: prBody,
        maintainer_can_modify: true,
      }),
    }
  )

  if (prRes.ok) {
    const pr = (await prRes.json()) as { html_url?: string }
    if (pr.html_url) return { ok: true, prUrl: pr.html_url }
    return { ok: false, error: "PR was created but no URL was returned." }
  }

  // A PR for this head may have opened between the pending check and now.
  if (prRes.status === 422) {
    const list = await fetch(
      `${API}/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/pulls?head=${login}:${branch}&state=open`,
      { headers: headers(token), cache: "no-store" }
    )
    if (list.ok) {
      const prs = (await list.json()) as { html_url?: string }[]
      const url = prs[0]?.html_url
      if (url) return { ok: true, prUrl: url }
    }
  }

  return {
    ok: false,
    error: `Could not open the pull request (${prRes.status}).`,
  }
}
