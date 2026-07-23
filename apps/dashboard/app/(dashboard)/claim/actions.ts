"use server"

import { z } from "zod"
import { portfolioSchema } from "@is-pinoy-dev/schemas"
import { validateDomain } from "@is-pinoy-dev/validate"
import { auth } from "@/auth"
import { getGitHubAccessToken } from "@/lib/github-token"
import {
  buildDomainRecord,
  openPortfolioPR,
  type ClaimResult,
} from "@/lib/claim-portfolio"

// portfolioSchema is optional at the domain level; here a template is required.
const claimInput = z.object({
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63)
    .regex(/^[a-z0-9-]+$/, "Use only lowercase letters, numbers, and hyphens"),
  portfolio: z.object({
    template: z.enum(["terminal", "pixel-card", "minimal"]),
    theme: z
      .enum(["gold-dark", "mono", "matrix", "midnight", "crimson", "sunset"])
      .optional(),
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

export async function claimPortfolio(input: ClaimInput): Promise<ClaimResult> {
  const session = await auth()
  if (!session?.user?.login) {
    return { ok: false, error: "You must be signed in to claim a subdomain." }
  }
  const login = session.user.login

  const parsed = claimInput.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }
  }
  const { subdomain, portfolio } = parsed.data

  // Validate the full record (schema + reserved-name rules) before touching
  // GitHub, and confirm portfolio is well-formed.
  const portfolioParsed = portfolioSchema.safeParse(portfolio)
  if (!portfolioParsed.success || !portfolioParsed.data) {
    return { ok: false, error: "Invalid template or theme." }
  }
  const record = buildDomainRecord({ login, subdomain, portfolio: portfolioParsed.data })
  const validation = validateDomain(record)
  if (!validation.ok) {
    return { ok: false, error: validation.errors[0] ?? "Invalid record." }
  }

  if (await isTaken(subdomain)) {
    return { ok: false, error: `${subdomain}.is-pinoy.dev is already claimed.` }
  }

  const token = await getGitHubAccessToken()
  if (!token) {
    return {
      ok: false,
      error: "Your GitHub authorization is missing the required access. Sign out and sign in again to grant it.",
    }
  }

  return openPortfolioPR(token, { login, subdomain, portfolio: portfolioParsed.data })
}
