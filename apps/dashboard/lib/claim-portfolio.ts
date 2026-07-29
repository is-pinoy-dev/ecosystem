import "server-only"
import { domainSchema, type PortfolioConfig } from "@is-pinoy-dev/schemas"

// Opens a portfolio-claim pull request against the public domains repo on the
// signed-in user's behalf, using their OAuth token (public_repo scope):
//   fork the domains repo (if needed) → create a branch → add the subdomain
//   JSON file → open a PR from the fork to upstream.
//
// The generated file is validated against the real domainSchema first, so a
// claim never opens a PR that the repo's schema check would reject.

const UPSTREAM_OWNER = "is-pinoy-dev"
const UPSTREAM_REPO = "domains"
const CNAME_TARGET = "portfolio.is-pinoy.dev"
const API = "https://api.github.com"

export interface ClaimParams {
  /** Signed-in user's GitHub login (fork owner + record owner). */
  login: string
  subdomain: string
  portfolio: NonNullable<PortfolioConfig>
}

export type ClaimResult =
  | { ok: true; prUrl: string }
  | { ok: false; error: string }

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** The plain domain-record object a claim writes to the domains repo. */
export function buildDomainRecord(params: ClaimParams) {
  return {
    subdomain: params.subdomain,
    owner: { github: params.login },
    portfolio: params.portfolio,
    records: {
      CNAME: { value: CNAME_TARGET, proxied: true },
    },
  }
}

/** Build and schema-validate the subdomain JSON file contents. */
export function buildDomainFile(params: ClaimParams): {
  content: string
  error?: string
} {
  const file = buildDomainRecord(params)

  const parsed = domainSchema.safeParse(file)
  if (!parsed.success) {
    return {
      content: "",
      error: parsed.error.issues.map((i) => i.message).join("; "),
    }
  }

  return { content: JSON.stringify(file, null, 2) + "\n" }
}

async function getDefaultBranch(
  token: string,
  owner: string,
  repo: string,
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
  login: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const forkPath = `${API}/repos/${login}/${UPSTREAM_REPO}`

  const existing = await fetch(forkPath, {
    headers: headers(token),
    cache: "no-store",
  })
  if (existing.ok) return { ok: true }

  const created = await fetch(
    `${API}/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/forks`,
    { method: "POST", headers: headers(token) },
  )
  if (!created.ok && created.status !== 202) {
    return { ok: false, error: `Could not fork the domains repo (${created.status}).` }
  }

  // Forking is asynchronous — poll until the fork is queryable.
  for (let attempt = 0; attempt < 10; attempt++) {
    await sleep(1200)
    const check = await fetch(forkPath, { headers: headers(token), cache: "no-store" })
    if (check.ok) return { ok: true }
  }
  return { ok: false, error: "Fork did not become ready in time. Please try again." }
}

/**
 * Fast-forward the fork's default branch to upstream — the API behind GitHub's
 * "Sync fork" button.
 *
 * Deliberately best-effort, and deliberately not what makes a claim correct.
 * The claim branch is cut from upstream's head regardless (see below), so a
 * stale fork can't corrupt the PR either way. This just stops the fork itself
 * drifting further behind every time its owner claims something, which keeps
 * the "Sync fork" banner off their repo and makes future manual PRs saner.
 *
 * Every failure is swallowed on purpose. A fork whose default branch has its
 * own commits answers 409 and can't be fast-forwarded, and a claim must not
 * fail over housekeeping that its correctness doesn't depend on.
 */
async function syncForkDefaultBranch(
  token: string,
  login: string,
): Promise<void> {
  try {
    const branch = await getDefaultBranch(token, login, UPSTREAM_REPO)
    if (!branch) return
    await fetch(`${API}/repos/${login}/${UPSTREAM_REPO}/merge-upstream`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ branch }),
    })
  } catch {
    // Network failure here is no reason to abandon the claim.
  }
}

export async function openPortfolioPR(
  token: string,
  params: ClaimParams,
): Promise<ClaimResult> {
  const { login, subdomain } = params

  const built = buildDomainFile(params)
  if (built.error) return { ok: false, error: `Invalid record: ${built.error}` }

  const fork = await ensureFork(token, login)
  if (!fork.ok) return fork

  await syncForkDefaultBranch(token, login)

  const upstreamBase =
    (await getDefaultBranch(token, UPSTREAM_OWNER, UPSTREAM_REPO)) ?? "main"

  // Base the claim branch on UPSTREAM's head, not the fork's.
  //
  // The PR targets upstream, so anything upstream has merged since the user
  // last synced their fork shows up in the diff as a revert. A claim opened
  // from a stale fork arrives proposing to undo other people's merged changes
  // — and CI fails it on files the claimant never touched. A fork forked once
  // and never updated again is the normal case, not the exception.
  //
  // Creating a ref in the fork at an upstream SHA is fine: a fork shares its
  // object store with the upstream network, so the commit is already there.
  const refRes = await fetch(
    `${API}/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/git/ref/heads/${upstreamBase}`,
    { headers: headers(token), cache: "no-store" },
  )
  if (!refRes.ok) {
    return { ok: false, error: `Could not read the domains repo's ${upstreamBase} branch.` }
  }
  const refData = (await refRes.json()) as { object?: { sha?: string } }
  const baseSha = refData.object?.sha
  if (!baseSha) return { ok: false, error: "Could not determine the base commit." }

  const branch = `claim/portfolio-${subdomain}`
  const createRef = await fetch(
    `${API}/repos/${login}/${UPSTREAM_REPO}/git/refs`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
    },
  )

  if (!createRef.ok) {
    if (createRef.status !== 422) {
      return { ok: false, error: `Could not create a branch (${createRef.status}).` }
    }
    // 422 = the branch already exists from an earlier submit of this same
    // claim. Reusing it as-is would inherit whatever base it was cut from,
    // which is the stale-fork problem again one resubmit later. Reset it onto
    // the current upstream head instead — the branch is named for this claim
    // and holds nothing else worth keeping.
    const resetRef = await fetch(
      `${API}/repos/${login}/${UPSTREAM_REPO}/git/refs/heads/${branch}`,
      {
        method: "PATCH",
        headers: headers(token),
        body: JSON.stringify({ sha: baseSha, force: true }),
      },
    )
    if (!resetRef.ok) {
      return {
        ok: false,
        error: `Could not reset your existing ${branch} branch (${resetRef.status}).`,
      }
    }
  }

  const putFile = await fetch(
    `${API}/repos/${login}/${UPSTREAM_REPO}/contents/subdomains/${subdomain}.json`,
    {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({
        message: `feat: add portfolio subdomain ${subdomain}`,
        content: Buffer.from(built.content).toString("base64"),
        branch,
      }),
    },
  )
  if (!putFile.ok) {
    return {
      ok: false,
      error: `Could not add the subdomain file (${putFile.status}). It may already exist on this branch.`,
    }
  }

  const prTitle = `Add portfolio subdomain: ${subdomain}`
  const prBody = [
    `Claims \`${subdomain}.is-pinoy.dev\` as a hosted portfolio for @${login}.`,
    "",
    `- Template: \`${params.portfolio.template}\``,
    params.portfolio.theme ? `- Theme: \`${params.portfolio.theme}\`` : null,
    "",
    "Opened from the is-pinoy.dev dashboard.",
  ]
    .filter((l) => l !== null)
    .join("\n")

  const prRes = await fetch(
    `${API}/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/pulls`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        title: prTitle,
        head: `${login}:${branch}`,
        base: upstreamBase,
        body: prBody,
        maintainer_can_modify: true,
      }),
    },
  )

  if (prRes.ok) {
    const pr = (await prRes.json()) as { html_url?: string }
    if (pr.html_url) return { ok: true, prUrl: pr.html_url }
    return { ok: false, error: "PR was created but no URL was returned." }
  }

  // A PR for this head may already exist — surface it instead of erroring.
  if (prRes.status === 422) {
    const list = await fetch(
      `${API}/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/pulls?head=${login}:${branch}&state=open`,
      { headers: headers(token), cache: "no-store" },
    )
    if (list.ok) {
      const prs = (await list.json()) as { html_url?: string }[]
      const url = prs[0]?.html_url
      if (url) return { ok: true, prUrl: url }
    }
  }

  return { ok: false, error: `Could not open the pull request (${prRes.status}).` }
}
