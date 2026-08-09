"use server"

import { z } from "zod"
import {
  PORTFOLIO_TEMPLATES,
  PORTFOLIO_THEMES,
  portfolioSchema,
} from "@is-pinoy-dev/schemas"
import { validateDomain } from "@is-pinoy-dev/validate"
import { auth } from "@/auth"
import { claimsEnabled } from "@/lib/flags-server"
import { getGitHubAccessToken } from "@/lib/github-token"
import { getSubdomainsForOwner, type OwnerIdentity } from "@/lib/domains"
import { portfolioSubdomainFor } from "@/lib/portfolio-subdomain"
import {
  buildDomainRecord,
  openPortfolioPR,
  CNAME_TARGET,
  type ClaimResult,
} from "@/lib/claim-portfolio"

// The subdomain is deliberately not an input. A hosted portfolio renders the
// claimant's GitHub profile, so its address is their GitHub username, taken
// from the session below — a hand-rolled call to this action's ID cannot ask
// for a name that isn't theirs, because there is nowhere to put one.
//
// portfolioSchema is optional at the domain level; here a template is required.
const claimInput = z.object({
  portfolio: z.object({
    template: z.enum(PORTFOLIO_TEMPLATES),
    theme: z.enum(PORTFOLIO_THEMES).optional(),
  }),
})

export type ClaimInput = z.infer<typeof claimInput>

/** Is this subdomain already claimed? Backed by the git-tracked JSON files. */
async function isTaken(subdomain: string): Promise<boolean> {
  const res = await fetch(
    `https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains/${subdomain}.json`,
    { cache: "no-store" },
  )
  return res.ok
}

/**
 * A hosted portfolio a user already holds, or null.
 *
 * Matched through `isOwnedBy`, so it finds the portfolio someone claimed under
 * a previous GitHub username. That is the only way to reach a second portfolio
 * now that the address is the login: rename the account, come back, and claim
 * again. Without this check a rename quietly resets the quota.
 *
 * Hosted portfolios are the records pointed at the portfolio renderer. The
 * registry's own marker is the `portfolio` block (see `portfolioRoutePattern`
 * in @is-pinoy-dev/registry), which the dashboard's read model doesn't carry —
 * the CNAME target is the same set in practice, and the authoritative check
 * runs in CI on the pull request this action opens.
 */
async function existingPortfolio(
  owner: OwnerIdentity,
): Promise<string | null> {
  try {
    const { owned } = await getSubdomainsForOwner(owner)
    const held = owned.find((domain) => {
      const cname = domain.records?.CNAME
      const entries = Array.isArray(cname) ? cname : [cname]
      return entries.some(
        (entry) =>
          typeof (entry as { value?: string })?.value === "string" &&
          (entry as { value: string }).value.toLowerCase() === CNAME_TARGET,
      )
    })
    return held?.subdomain ?? null
  } catch {
    // The registry read is a courtesy check that saves the user a doomed pull
    // request. If it fails, let the claim proceed — CI still counts.
    return null
  }
}

export async function claimPortfolio(input: ClaimInput): Promise<ClaimResult> {
  const session = await auth()
  if (!session?.user?.login) {
    return { ok: false, error: "You must be signed in to claim a subdomain." }
  }
  const login = session.user.login
  const owner: OwnerIdentity = {
    login,
    githubId: session.user.githubId,
  }

  // A server action stays reachable by its own ID once deployed, whatever the
  // page does — so the flag has to be checked here too, not only on /claim.
  if (!(await claimsEnabled())) {
    return { ok: false, error: "Portfolio claims are not available right now." }
  }

  const parsed = claimInput.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }
  const { portfolio } = parsed.data

  const derived = portfolioSubdomainFor(login)
  if (!derived.ok) return { ok: false, error: derived.error }
  const { subdomain } = derived

  // Validate the full record (schema + reserved-name rules) before touching
  // GitHub, and confirm portfolio is well-formed.
  const portfolioParsed = portfolioSchema.safeParse(portfolio)
  if (!portfolioParsed.success || !portfolioParsed.data) {
    return { ok: false, error: "Invalid template or theme." }
  }
  const record = buildDomainRecord({
    login,
    githubId: owner.githubId,
    portfolio: portfolioParsed.data,
  })
  const validation = validateDomain(record)
  if (!validation.ok) {
    return { ok: false, error: validation.errors[0] ?? "Invalid record." }
  }

  if (await isTaken(subdomain)) {
    return { ok: false, error: `${subdomain}.is-pinoy.dev is already claimed.` }
  }

  // One hosted portfolio per person. Worth naming the address they already
  // hold: after a GitHub rename it won't be the one they expect, and "you
  // already have a portfolio" on its own would read as a bug.
  const held = await existingPortfolio(owner)
  if (held) {
    return {
      ok: false,
      error:
        held === subdomain
          ? `You already have a hosted portfolio at ${held}.is-pinoy.dev.`
          : `You already have a hosted portfolio at ${held}.is-pinoy.dev, claimed under a previous GitHub username. One portfolio per account — ask a maintainer to move it to ${subdomain}.is-pinoy.dev.`,
    }
  }

  const token = await getGitHubAccessToken()
  if (!token) {
    return {
      ok: false,
      error: "Your GitHub authorization is missing the required access. Sign out and sign in again to grant it.",
    }
  }

  return openPortfolioPR(token, {
    login,
    githubId: owner.githubId,
    portfolio: portfolioParsed.data,
  })
}
