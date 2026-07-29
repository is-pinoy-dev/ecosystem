import "server-only"
import { domainSchema, type PortfolioConfig } from "@is-pinoy-dev/schemas"

// Opens a portfolio-claim pull request against the public domains repo.
//
// Two routes, chosen by whether DOMAINS_CLAIM_TOKEN is configured:
//
//   direct — push the claim branch straight to the domains repo with an
//     org-owned token, then open the PR within that repo.
//   fork   — the original path: fork the repo under the signed-in user, branch
//     there, and open a cross-repo PR with their own OAuth token.
//
// Direct is preferred because the fork route depends on the state of a
// repository we don't control. A fork that has *diverged* from upstream — its
// default branch carrying commits whose content upstream has since changed —
// produces a claim whose diff reverts other people's merged work, and CI fails
// it on files the claimant never touched. GitHub offers no way to repair that
// from the API: merge-upstream refuses on divergence, and every alternative
// needs an upstream object the fork's network may not hold. Only the user can
// fix it, from the web UI. Pushing to upstream sidesteps the fork entirely, so
// a claim is a one-file PR no matter what any fork looks like.
//
// The cost is attribution: the PR is authored by the token's identity rather
// than the claimant. Governance is unchanged — maintainers still review and
// merge, and `owner.github` in the file records who the subdomain is for.
//
// The generated file is validated against the real domainSchema first, so a
// claim never opens a PR that the repo's schema check would reject. That
// validation also gates every value interpolated into a path or ref below:
// `subdomain` is constrained to /^[a-z0-9-]+$/ before it reaches them.

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

/** Whether `subdomains/<subdomain>.json` exists on `owner`'s copy at `ref`. */
async function fileExists(
  token: string,
  owner: string,
  subdomain: string,
  ref: string,
): Promise<boolean> {
  const res = await fetch(
    `${API}/repos/${owner}/${UPSTREAM_REPO}/contents/subdomains/${subdomain}.json?ref=${ref}`,
    { headers: headers(token), cache: "no-store" },
  )
  return res.ok
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

  // An org-owned token pushes the branch to the domains repo itself; without
  // one we fall back to the user's fork. See the note at the top of this file
  // for why direct is preferred.
  const claimToken = process.env.DOMAINS_CLAIM_TOKEN
  const direct = Boolean(claimToken)
  const writeToken = claimToken ?? token
  const writeOwner = direct ? UPSTREAM_OWNER : login

  const upstreamBase =
    (await getDefaultBranch(token, UPSTREAM_OWNER, UPSTREAM_REPO)) ?? "main"

  // Refuse a name that already has a record on the default branch. In the fork
  // route a duplicate could only ever land in the user's own fork and stall in
  // review; writing to upstream directly, and upserting the file, it would
  // instead open a PR proposing to overwrite somebody else's subdomain.
  if (await fileExists(token, UPSTREAM_OWNER, subdomain, upstreamBase)) {
    return {
      ok: false,
      error: `${subdomain}.is-pinoy.dev is already registered. Please choose another name.`,
    }
  }

  if (!direct) {
    const fork = await ensureFork(token, login)
    if (!fork.ok) return fork
    await syncForkDefaultBranch(token, login)
  }

  // Base the claim branch on UPSTREAM's head.
  //
  // In the fork route the PR targets upstream, so anything upstream merged
  // since the user last synced their fork shows up in the diff as a revert. A
  // fork forked once and never updated again is the normal case, not the
  // exception.
  const upstreamSha = await headSha(token, UPSTREAM_OWNER, upstreamBase)
  if (!upstreamSha) {
    return { ok: false, error: `Could not read the domains repo's ${upstreamBase} branch.` }
  }

  const branch = `claim/portfolio-${subdomain}`
  const createBranch = (sha: string) =>
    fetch(`${API}/repos/${writeOwner}/${UPSTREAM_REPO}/git/refs`, {
      method: "POST",
      headers: headers(writeToken),
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
    })

  let baseSha = upstreamSha
  let createRef = await createBranch(baseSha)

  // Fork route only: a fork carries the upstream commits its network has
  // actually fetched, and one that hasn't caught up rejects a ref created at
  // an upstream SHA it doesn't hold. Fall back to its own head rather than
  // dead-ending — usually the same commit, since syncForkDefaultBranch has
  // just fast-forwarded it. Writing to upstream, the SHA is by definition
  // present, so a failure there is real and shouldn't be papered over.
  if (!direct && !createRef.ok && createRef.status !== 422) {
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
      `${API}/repos/${writeOwner}/${UPSTREAM_REPO}/git/refs/heads/${branch}`,
      {
        method: "PATCH",
        headers: headers(writeToken),
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
    `${API}/repos/${writeOwner}/${UPSTREAM_REPO}/${filePath}?ref=${branch}`,
    { headers: headers(writeToken), cache: "no-store" },
  )
  const existingSha = existing.ok
    ? ((await existing.json()) as { sha?: string }).sha
    : undefined

  const putFile = await fetch(
    `${API}/repos/${writeOwner}/${UPSTREAM_REPO}/${filePath}`,
    {
      method: "PUT",
      headers: headers(writeToken),
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
      headers: headers(writeToken),
      body: JSON.stringify({
        title: prTitle,
        head: direct ? branch : `${login}:${branch}`,
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
      `${API}/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/pulls?head=${direct ? UPSTREAM_OWNER : login}:${branch}&state=open`,
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
