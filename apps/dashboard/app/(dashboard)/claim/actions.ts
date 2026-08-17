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
import { type OwnerIdentity } from "@/lib/domains"
import { portfolioSubdomainFor } from "@/lib/portfolio-subdomain"
import { claimBlockMessage } from "@/lib/portfolio-claim-block"
import { getClaimBlock } from "@/lib/portfolio-claim-status"
import {
  buildDomainRecord,
  openPortfolioPR,
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

  // The name is already spoken for, or this person already has a portfolio —
  // the same check the claim page ran to decide whether to offer the button at
  // all, re-run here because that answer was a snapshot and the page cannot be
  // trusted to have obeyed it.
  //
  // `checkPending: false`: an open claim pull request is not a reason to refuse
  // here. openPortfolioPR resets the branch and upserts the file so that
  // resubmitting revises the claim in place, which is the only way to change a
  // template before a maintainer merges it.
  const block = await getClaimBlock(owner, subdomain, { checkPending: false })
  if (block) {
    return { ok: false, error: claimBlockMessage(block) }
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
