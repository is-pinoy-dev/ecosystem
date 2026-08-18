"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { PORTFOLIO_TEMPLATES, PORTFOLIO_THEMES } from "@is-pinoy-dev/schemas"

import { auth } from "@/auth"
import {
  createDestinationAddress,
  getDestinationAddressStatus,
  type DestinationAddressStatus,
} from "@/lib/cloudflare-email"
import { getSubdomainsForOwner } from "@/lib/domains"
import {
  findFeature,
  isFeatureEnabled,
  TOGGLEABLE_FEATURES,
} from "@/lib/features"
import { getGitHubAccessToken } from "@/lib/github-token"
import { providerForRecords } from "@/lib/providers"
import { getPendingProxyPRs, openProxyTogglePR } from "@/lib/proxy-pr"
import {
  PROXYABLE_TYPES,
  proxyPolicy,
  readProxyState,
  type RecordChange,
} from "@/lib/proxy-record"

const subdomainField = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9-]+$/)

const emailField = z.string().trim().pipe(z.email())

const changeInput = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("proxy"),
    subdomain: subdomainField,
    type: z.enum(PROXYABLE_TYPES),
    enabled: z.boolean(),
  }),
  z.object({
    kind: z.literal("feature"),
    subdomain: subdomainField,
    // Only features the dashboard offers a switch for — a client cannot invent
    // a flag, nor write one for a built-in that has none.
    feature: z.enum(
      TOGGLEABLE_FEATURES.map((f) => f.id) as [string, ...string[]]
    ),
    enabled: z.boolean(),
  }),
])

const saveInput = z.array(changeInput).min(1).max(50)

// The style edit is its own action rather than a member of `changeInput`: it is
// a separate panel with its own submit, and its payload is a pair of enums
// rather than a switch. `theme` is accepted for any template and discarded
// downstream when the template is a designer design — see buildToggledFile.
const portfolioStyleInput = z.object({
  subdomain: subdomainField,
  template: z.enum(PORTFOLIO_TEMPLATES),
  theme: z.enum(PORTFOLIO_THEMES).optional(),
})

export type PortfolioStyleInput = z.infer<typeof portfolioStyleInput>

export type SettingChangeInput = z.infer<typeof changeInput>

/** What happened to one subdomain's worth of changes. */
export interface SubdomainSaveResult {
  subdomain: string
  ok: boolean
  /** Present when ok — the pull request now carrying the change. */
  prUrl?: string
  /** Present when not ok — why this subdomain was skipped. */
  error?: string
}

export interface SaveSettingsResult {
  results: SubdomainSaveResult[]
}

function failure(subdomain: string, error: string): SaveSettingsResult {
  return { results: [{ subdomain, ok: false, error }] }
}

/**
 * Open pull requests for a batch of pending settings edits — one per subdomain,
 * since the branch name and the "one change in flight" rule are both keyed by
 * subdomain. Each subdomain succeeds or fails independently so one rejected
 * record does not lose the rest of the user's work.
 *
 * Ownership, the provider's proxy policy, the proxy prerequisite for opt-in
 * tools, and the no-op case are all re-checked here: the client controls none
 * of them.
 */
export async function saveSettings(
  input: SettingChangeInput[]
): Promise<SaveSettingsResult> {
  const session = await auth()
  if (!session?.user?.login) {
    return failure("", "You must be signed in to change a record.")
  }
  const login = session.user.login
  const githubId = session.user.githubId

  const parsed = saveInput.safeParse(input)
  if (!parsed.success) return failure("", "Invalid request.")

  // Group by subdomain — one pull request per record file.
  const bySubdomain = new Map<string, SettingChangeInput[]>()
  for (const change of parsed.data) {
    const existing = bySubdomain.get(change.subdomain) ?? []
    // Last write wins if the same switch somehow appears twice.
    const key = change.kind === "proxy" ? change.type : change.feature
    const deduped = existing.filter(
      (c) =>
        c.kind !== change.kind ||
        (c.kind === "proxy" ? c.type : c.feature) !== key
    )
    deduped.push(change)
    bySubdomain.set(change.subdomain, deduped)
  }

  const { owned } = await getSubdomainsForOwner({ login, githubId })
  const token = await getGitHubAccessToken()
  if (!token) {
    return {
      results: [...bySubdomain.keys()].map((subdomain) => ({
        subdomain,
        ok: false,
        error:
          "Your GitHub authorization is missing the required access. Sign out and sign in again to grant it.",
      })),
    }
  }

  const pending = await getPendingProxyPRs(login, token)
  const results: SubdomainSaveResult[] = []

  for (const [subdomain, changes] of bySubdomain) {
    const domain = owned.find((d) => d.subdomain === subdomain)
    if (!domain) {
      results.push({
        subdomain,
        ok: false,
        error: `You do not own ${subdomain}.is-pinoy.dev.`,
      })
      continue
    }

    const open = pending.get(subdomain)
    if (open) {
      results.push({
        subdomain,
        ok: false,
        error: `A change is already open as pull request #${open.number}. Merge or close it first.`,
      })
      continue
    }

    // The proxy value this save leaves the record at — a tool flag is only
    // meaningful if the record ends up proxied, whether it already was or this
    // same batch turns it on.
    const proxyChange = changes.find((c) => c.kind === "proxy")
    const currentlyProxied = PROXYABLE_TYPES.some(
      (type) => readProxyState(domain.records, type)?.proxied === true
    )
    const willBeProxied = proxyChange ? proxyChange.enabled : currentlyProxied

    const applicable: RecordChange[] = []
    let rejection: string | null = null

    for (const change of changes) {
      if (change.kind === "proxy") {
        const policy = proxyPolicy(domain.records, change.type)
        if (policy.pinnedTo !== null && change.enabled !== policy.pinnedTo) {
          rejection = policy.note ?? "This record's proxy setting is fixed."
          continue
        }
        const state = readProxyState(domain.records, change.type)
        if (!state) continue
        if (!state.mixed && state.proxied === change.enabled) continue
        applicable.push({
          kind: "proxy",
          type: change.type,
          enabled: change.enabled,
        })
        continue
      }

      const feature = findFeature(change.feature)
      if (!feature) continue

      // An opt-in tool is meaningless on an unproxied record; an opt-out like
      // analytics is still worth recording, so it is exempt.
      if (change.enabled && !feature.defaultEnabled && !willBeProxied) {
        rejection =
          "Platform tools need the platform switched on. Enable it in the same save."
        continue
      }
      // The dashboard disables Contact Form's switch until the owner's email
      // shows as verified (lib/domain-view.ts's contactFormBlockReason), but
      // that is a UI convenience, not the only guard — re-checked here the
      // same way the proxy prerequisite above is, since the client controls
      // neither.
      if (change.feature === "contact-form" && change.enabled) {
        const email = domain.owner.email
        const status: DestinationAddressStatus | null = email
          ? await getDestinationAddressStatus(email).catch(() => null)
          : "absent"
        if (status !== "verified") {
          rejection =
            "Contact Form needs a verified email first. Use Verify email above."
          continue
        }
      }
      if (isFeatureEnabled(domain.features, feature) === change.enabled)
        continue
      applicable.push({
        kind: "feature",
        feature: change.feature,
        enabled: change.enabled,
      })
    }

    if (applicable.length === 0) {
      results.push({
        subdomain,
        ok: false,
        error: rejection ?? "Nothing left to change on this record.",
      })
      continue
    }

    const result = await openProxyTogglePR(token, {
      login,
      subdomain,
      changes: applicable,
    })
    results.push(
      result.ok
        ? { subdomain, ok: true, prUrl: result.prUrl }
        : { subdomain, ok: false, error: result.error }
    )
  }

  const saved = results.filter((result) => result.ok)
  if (saved.length > 0) {
    revalidatePath("/domains")
    for (const result of saved) {
      revalidatePath(`/domains/${result.subdomain}`)
    }
  }
  return { results }
}

/**
 * Open a pull request restyling a hosted portfolio.
 *
 * Same route as every other settings edit — the style lives in the record file,
 * so changing it is a commit against the domains repo, not a write to anything
 * we control. Ownership, the hosted-portfolio requirement, and the one-change-
 * in-flight rule are all re-checked here; the client controls none of them.
 *
 * Not gated on the claims flag: that flag governs handing out new subdomains,
 * and this only touches a record its owner already holds.
 */
export async function savePortfolioStyle(
  input: PortfolioStyleInput
): Promise<SubdomainSaveResult> {
  const session = await auth()
  if (!session?.user?.login) {
    return {
      subdomain: "",
      ok: false,
      error: "You must be signed in to change a portfolio.",
    }
  }
  const login = session.user.login

  const parsed = portfolioStyleInput.safeParse(input)
  if (!parsed.success) {
    return { subdomain: "", ok: false, error: "Invalid template or theme." }
  }
  const { subdomain, template, theme } = parsed.data

  const { owned } = await getSubdomainsForOwner({
    login,
    githubId: session.user.githubId,
  })
  const domain = owned.find((d) => d.subdomain === subdomain)
  if (!domain) {
    return {
      subdomain,
      ok: false,
      error: `You do not own ${subdomain}.is-pinoy.dev.`,
    }
  }

  // A style only means something on a record pointed at our own renderer.
  // Checked before touching GitHub so a nonsense request costs one lookup
  // rather than a fork, a branch, and a file read.
  if (providerForRecords(domain.records)?.id !== "portfolio") {
    return {
      subdomain,
      ok: false,
      error: `${subdomain}.is-pinoy.dev is not a hosted portfolio.`,
    }
  }

  const token = await getGitHubAccessToken()
  if (!token) {
    return {
      subdomain,
      ok: false,
      error:
        "Your GitHub authorization is missing the required access. Sign out and sign in again to grant it.",
    }
  }

  const pending = await getPendingProxyPRs(login, token)
  const open = pending.get(subdomain)
  if (open) {
    return {
      subdomain,
      ok: false,
      error: `A change is already open as pull request #${open.number}. Merge or close it first.`,
    }
  }

  const result = await openProxyTogglePR(token, {
    login,
    subdomain,
    changes: [{ kind: "portfolio", template, ...(theme ? { theme } : {}) }],
  })
  if (!result.ok) {
    return { subdomain, ok: false, error: result.error }
  }

  revalidatePath("/domains")
  revalidatePath(`/domains/${subdomain}`)
  return { subdomain, ok: true, prUrl: result.prUrl }
}

const verifyEmailInput = z.object({
  subdomain: subdomainField,
  email: emailField,
})

export interface VerifyEmailResult {
  ok: boolean
  status: DestinationAddressStatus
  /** Present when this call also opened a pull request updating owner.email. */
  prUrl?: string
  error?: string
}

/**
 * "Verify email" — the only action that registers an address with
 * Cloudflare Email Routing, separate from (and a prerequisite for) switching
 * Contact Form on. Two things happen, in order:
 *
 *  1. If the email differs from what git currently has for this subdomain,
 *     open a pull request writing it to `owner.email` — the same PR-per-edit
 *     path every other setting goes through, so git stays the source of
 *     truth for the address a submission is ultimately addressed to.
 *  2. Register the address as a Cloudflare Email Routing destination. This
 *     is what actually triggers Cloudflare's one-time confirmation email —
 *     it runs whether or not step 1 did anything, since re-clicking "Verify
 *     email" while a confirmation is still pending is an expected retry, not
 *     an error.
 *
 * Never touches `features.tools["contact-form"]` — turning the feature on is
 * `saveSettings`'s job, once this reports "verified".
 */
export async function verifyContactFormEmail(
  input: z.infer<typeof verifyEmailInput>
): Promise<VerifyEmailResult> {
  const session = await auth()
  if (!session?.user?.login) {
    return {
      ok: false,
      status: "absent",
      error: "You must be signed in to verify an email.",
    }
  }
  const login = session.user.login

  const parsed = verifyEmailInput.safeParse(input)
  if (!parsed.success) {
    return { ok: false, status: "absent", error: "Invalid email address." }
  }
  const { subdomain, email } = parsed.data

  const { owned } = await getSubdomainsForOwner({
    login,
    githubId: session.user.githubId,
  })
  const domain = owned.find((d) => d.subdomain === subdomain)
  if (!domain) {
    return {
      ok: false,
      status: "absent",
      error: `You do not own ${subdomain}.is-pinoy.dev.`,
    }
  }

  let prUrl: string | undefined
  if (domain.owner.email !== email) {
    const token = await getGitHubAccessToken()
    if (!token) {
      return {
        ok: false,
        status: "absent",
        error:
          "Your GitHub authorization is missing the required access. Sign out and sign in again to grant it.",
      }
    }

    const pending = await getPendingProxyPRs(login, token)
    const open = pending.get(subdomain)
    if (open) {
      return {
        ok: false,
        status: "absent",
        error: `A change is already open as pull request #${open.number}. Merge or close it first.`,
      }
    }

    const result = await openProxyTogglePR(token, {
      login,
      subdomain,
      changes: [{ kind: "owner-email", email }],
    })
    if (!result.ok) {
      return { ok: false, status: "absent", error: result.error }
    }
    prUrl = result.prUrl
    revalidatePath("/domains")
    revalidatePath(`/domains/${subdomain}`)
  }

  const registered = await createDestinationAddress(email)
  if (!registered.ok) {
    return { ok: false, status: "absent", error: registered.error, prUrl }
  }

  const status = await getDestinationAddressStatus(email).catch(
    (): DestinationAddressStatus => "pending"
  )
  return { ok: true, status, prUrl }
}

const recheckInput = z.object({ subdomain: subdomainField, email: emailField })

/**
 * Re-read an email's verification status from Cloudflare — backs the
 * "Recheck" button, since there is no way for Cloudflare to push the result
 * of the owner clicking its confirmation link.
 *
 * Ownership is checked the same as every other action here, even though this
 * one is read-only against Cloudflare: without it, a signed-in user could
 * use this as a general oracle for whether an arbitrary address is a
 * verified destination on the platform's account.
 */
export async function checkContactFormEmailStatus(
  input: z.infer<typeof recheckInput>
): Promise<{ status: DestinationAddressStatus } | { error: string }> {
  const session = await auth()
  if (!session?.user?.login) {
    return { error: "You must be signed in." }
  }

  const parsed = recheckInput.safeParse(input)
  if (!parsed.success) return { error: "Invalid request." }
  const { subdomain, email } = parsed.data

  const { owned } = await getSubdomainsForOwner({
    login: session.user.login,
    githubId: session.user.githubId,
  })
  if (!owned.some((d) => d.subdomain === subdomain)) {
    return { error: `You do not own ${subdomain}.is-pinoy.dev.` }
  }

  try {
    return { status: await getDestinationAddressStatus(email) }
  } catch {
    return { error: "Could not reach Cloudflare. Please try again." }
  }
}
