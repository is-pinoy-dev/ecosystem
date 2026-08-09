import "server-only"
import { domainSchema, type PortfolioConfig } from "@is-pinoy-dev/schemas"
import { portfolioSubdomain } from "./portfolio-subdomain"

// Opens a portfolio-claim pull request against the public domains repo on the
// signed-in user's behalf, using their OAuth token (public_repo scope):
//   fork the domains repo (if needed) → create a branch → add the subdomain
//   JSON file → open a PR from the fork to upstream.
//
// The generated file is validated against the real domainSchema first, so a
// claim never opens a PR that the repo's schema check would reject.
//
// The claimed name is not a parameter. A hosted portfolio is that person's
// GitHub profile, so its address is their GitHub username, derived here from
// the login — there is no argument a caller could pass to claim anything else.

const UPSTREAM_OWNER = "is-pinoy-dev"
const UPSTREAM_REPO = "domains"
/** Every hosted portfolio CNAMEs here; the proxy routes by subdomain. */
export const CNAME_TARGET = "portfolio.is-pinoy.dev"
const API = "https://api.github.com"

export interface ClaimParams {
  /**
   * Signed-in user's GitHub login — fork owner, record owner, and (folded to
   * lowercase) the claimed subdomain itself.
   */
  login: string
  /**
   * GitHub's numeric account ID, written into the record so ownership survives
   * a username change. Optional only because a session minted before the field
   * existed won't carry one until its owner signs in again.
   */
  githubId?: number
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
    subdomain: portfolioSubdomain(params.login),
    owner: {
      github: params.login,
      ...(params.githubId ? { id: params.githubId } : {}),
    },
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

/** Head commit of `owner`'s copy of the domains repo on `branch`, or null. */
async function headSha(
  token: string,
  owner: string,
  branch: string,
): Promise<string | null> {
  const res = await fetch(
    `${API}/repos/${owner}/${UPSTREAM_REPO}/git/ref/heads/${branch}`,
    { headers: headers(token), cache: "no-store" },
  )
  if (!res.ok) return null
  const data = (await res.json()) as { object?: { sha?: string } }
  return data.object?.sha ?? null
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
  const { login } = params
  const subdomain = portfolioSubdomain(login)

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
  const upstreamSha = await headSha(token, UPSTREAM_OWNER, upstreamBase)
  if (!upstreamSha) {
    return { ok: false, error: `Could not read the domains repo's ${upstreamBase} branch.` }
  }

  const branch = `claim/portfolio-${subdomain}`
  const createBranch = (sha: string) =>
    fetch(`${API}/repos/${login}/${UPSTREAM_REPO}/git/refs`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
    })

  let baseSha = upstreamSha
  let createRef = await createBranch(baseSha)

  // A fork only carries the upstream commits its network has actually fetched.
  // A recently-created fork, or one whose network hasn't caught up, rejects a
  // ref created at an upstream SHA it doesn't hold — so fall back to the fork's
  // own head rather than dead-ending the claim.
  //
  // This is usually no worse: syncForkDefaultBranch has just fast-forwarded the
  // fork, so its head is upstream's head and the diff stays a single file. It
  // is only a stale base when the fork had diverged and couldn't be
  // fast-forwarded, and a claim with a noisy diff still beats no claim at all.
  if (!createRef.ok && createRef.status !== 422) {
    const forkBranch = await getDefaultBranch(token, login, UPSTREAM_REPO)
    const forkSha = forkBranch ? await headSha(token, login, forkBranch) : null
    if (forkSha && forkSha !== baseSha) {
      baseSha = forkSha
      createRef = await createBranch(baseSha)
    }
  }

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

  const filePath = `contents/subdomains/${subdomain}.json`

  // The contents API refuses to overwrite a file without its blob sha, so a
  // resubmit of the same claim — picking a different template, or retrying
  // after a failure further down — would 422 on a file the previous attempt
  // committed. Look it up first and pass the sha when it's there, making the
  // write an upsert: the branch ends up holding the claim as submitted, not
  // whichever version happened to land first.
  const existing = await fetch(
    `${API}/repos/${login}/${UPSTREAM_REPO}/${filePath}?ref=${branch}`,
    { headers: headers(token), cache: "no-store" },
  )
  const existingSha = existing.ok
    ? ((await existing.json()) as { sha?: string }).sha
    : undefined

  const putFile = await fetch(
    `${API}/repos/${login}/${UPSTREAM_REPO}/${filePath}`,
    {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({
        message: `feat: add portfolio subdomain ${subdomain}`,
        content: Buffer.from(built.content).toString("base64"),
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    },
  )
  if (!putFile.ok) {
    return {
      ok: false,
      error: `Could not write the subdomain file (${putFile.status}). Please try again.`,
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
