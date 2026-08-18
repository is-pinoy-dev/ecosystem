import "server-only"

import { claimBranch, CNAME_TARGET } from "@/lib/claim-portfolio"
import {
  getSubdomainsForOwner,
  isOwnedBy,
  type OwnerIdentity,
} from "@/lib/domains"
import type { ClaimBlock } from "@/lib/portfolio-claim-block"

// Why a claim cannot go ahead, worked out before the user clicks rather than
// after. The claim page disables its submit button on the answer; the server
// action re-runs the same check, because this one is a snapshot and can be
// stale by the time the button is pressed.
//
// Both callers share this module on purpose. These checks used to live as
// private helpers inside the claim action, where the page could not reach them
// — so the page promised a claim the action then refused. One implementation is
// what stops the two explanations drifting apart.
//
// Every read here fails open. The registry lookup is a courtesy that saves the
// user a doomed pull request, not the thing that makes a claim correct: CI
// validates the pull request regardless. A rate-limited GitHub or an
// unreachable D1 must never leave /claim with a permanently disabled button.

const DOMAINS_REPO = "is-pinoy-dev/domains"
const UPSTREAM_OWNER = "is-pinoy-dev"
const UPSTREAM_REPO = "domains"
const API = "https://api.github.com"

/** Open pull requests are read fresh-ish; the page is not a live view. */
const PR_REVALIDATE_SECONDS = 30

export interface ClaimBlockOptions {
  /** OAuth token for the pull request listing; buys the higher rate limit. */
  token?: string
  /**
   * Whether an open claim pull request counts as a block.
   *
   * The claim page says yes: a second claim while one is in flight is almost
   * always someone who has forgotten they already claimed. The server action
   * says no, and deliberately — `openPortfolioPR` resets the branch and upserts
   * the file precisely so that resubmitting updates the open pull request with
   * a changed template rather than conflicting with it. Refusing there would
   * take away the only way to revise a claim before it merges.
   */
  checkPending?: boolean
}

/** One record file as this module reads it; everything else is ignored. */
interface RecordFile {
  owner?: { github?: string; id?: number }
  records?: Record<string, unknown>
  destroy?: boolean
}

type FileLookup =
  | { state: "missing" }
  | { state: "present"; file: RecordFile }
  /** The read failed. Distinct from "missing": absence is not established. */
  | { state: "unknown" }

/**
 * Does this record route to our portfolio renderer?
 *
 * Registry entries are either a bare string or `{ value, ... }`, and either one
 * or an array of them, so all four shapes have to be considered. A record
 * pointed at the renderer is a hosted portfolio: the `portfolio` block is the
 * registry's own marker, but the dashboard's read model does not carry it, and
 * in practice the CNAME target is the same set.
 */
function isPortfolioRecord(records: Record<string, unknown> | undefined) {
  const cname = records?.CNAME
  if (cname === undefined) return false
  const entries = Array.isArray(cname) ? cname : [cname]
  return entries.some((entry) => {
    const value =
      typeof entry === "string"
        ? entry
        : (entry as { value?: unknown } | null)?.value
    return typeof value === "string" && value.toLowerCase() === CNAME_TARGET
  })
}

function headers(token?: string): HeadersInit {
  const base: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  if (token) base.Authorization = `Bearer ${token}`
  return base
}

/**
 * The record file for one subdomain, straight from git.
 *
 * Uncached: this decides whether a claim is offered at all, and a five-minute
 * window in which a just-merged claim still looks unclaimed is exactly the
 * window in which someone submits a duplicate.
 */
async function readRecordFile(subdomain: string): Promise<FileLookup> {
  let res: Response
  try {
    res = await fetch(
      `https://raw.githubusercontent.com/${DOMAINS_REPO}/main/subdomains/${subdomain}.json`,
      { cache: "no-store" },
    )
  } catch {
    return { state: "unknown" }
  }

  // 404 is the ordinary "nobody has claimed this". Any other failure means we
  // could not read the registry, which is not the same answer.
  if (res.status === 404) return { state: "missing" }
  if (!res.ok) return { state: "unknown" }

  try {
    return { state: "present", file: (await res.json()) as RecordFile }
  } catch {
    return { state: "unknown" }
  }
}

/**
 * This user's open claim pull request for this address, or null.
 *
 * The `head` filter answers in one request with no pagination — the same
 * listing `openPortfolioPR` already falls back to when its create returns 422.
 * Unauthenticated when no token is available; the repo is public, so a token
 * only buys the higher rate limit.
 *
 * Blind to a claim opened under a previous GitHub username, whose branch
 * carries the old name. That claim is found once it merges, by the owner scan.
 */
async function openClaimPR(
  login: string,
  subdomain: string,
  token?: string,
): Promise<{ url: string; number: number } | null> {
  const head = `${login}:${claimBranch(subdomain)}`
  let res: Response
  try {
    res = await fetch(
      `${API}/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/pulls?state=open&head=${head}&per_page=1`,
      { headers: headers(token), next: { revalidate: PR_REVALIDATE_SECONDS } },
    )
  } catch {
    return null
  }
  if (!res.ok) return null

  try {
    const prs = (await res.json()) as { html_url?: string; number?: number }[]
    const pr = prs[0]
    if (!pr?.html_url || pr.number === undefined) return null
    return { url: pr.html_url, number: pr.number }
  } catch {
    return null
  }
}

/**
 * Any hosted portfolio this user holds, at whatever address, or null.
 *
 * Matched through `isOwnedBy`, so it finds a portfolio claimed under a previous
 * GitHub username — the only way to reach a second portfolio now that the
 * address is the login is to rename the account and claim again, and without
 * this a rename quietly resets the quota.
 *
 * This is the expensive path: with D1 unconfigured, `getSubdomainsForOwner`
 * falls back to reading every record in the registry to find one. It runs only
 * when the cheap single-file read came back missing, which is the sole case
 * where a held portfolio can be hiding under another name.
 */
async function heldPortfolio(owner: OwnerIdentity): Promise<string | null> {
  try {
    const { owned } = await getSubdomainsForOwner(owner)
    return owned.find((domain) => isPortfolioRecord(domain.records))?.subdomain ?? null
  } catch {
    return null
  }
}

/**
 * Why `owner` cannot claim `subdomain`, or null when nothing stands in the way.
 *
 * Precedence is hosted → pending → taken. More than one can hold at once, and
 * they are not equally useful to hear: a portfolio you already have is the most
 * informative, an open pull request is the most actionable, and "taken" is what
 * is left when the name simply belongs to somebody else.
 */
export async function getClaimBlock(
  owner: OwnerIdentity,
  subdomain: string,
  { token, checkPending = true }: ClaimBlockOptions = {},
): Promise<ClaimBlock | null> {
  // Independent reads, so they overlap. The file read alone settles the common
  // case; the pull request read is one request either way.
  const [lookup, pr] = await Promise.all([
    readRecordFile(subdomain),
    checkPending ? openClaimPR(owner.login, subdomain, token) : null,
  ])

  const pending = pr
    ? ({ kind: "pending", subdomain, ...pr } as const)
    : null

  if (lookup.state === "present") {
    const { owner: fileOwner, records, destroy } = lookup.file
    const mine = isOwnedBy(
      {
        subdomain,
        owner: { github: fileOwner?.github ?? "", id: fileOwner?.id },
        records: records ?? {},
      },
      owner,
    )
    // A record flagged for destruction is on its way out of the registry, so it
    // is not a live portfolio — but the file still occupies the name until the
    // removal merges, so the claim is blocked all the same.
    if (mine && !destroy && isPortfolioRecord(records)) {
      return { kind: "hosted", subdomain, renamed: false }
    }
    return pending ?? { kind: "taken", subdomain }
  }

  if (lookup.state === "missing") {
    const held = await heldPortfolio(owner)
    if (held) {
      return held === subdomain
        ? { kind: "hosted", subdomain: held, renamed: false }
        : { kind: "hosted", subdomain: held, renamed: true, wanted: subdomain }
    }
    return pending
  }

  // The registry read failed, so nothing about this address is established and
  // the claim goes ahead. A pull request we did manage to read is still a real
  // finding, and reporting it costs the user nothing.
  return pending
}
