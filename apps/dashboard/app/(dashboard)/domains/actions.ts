"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { PORTFOLIO_TEMPLATES, PORTFOLIO_THEMES } from "@is-pinoy-dev/schemas"

import { auth } from "@/auth"
import {
  getDestinationAddressStatus,
  type DestinationAddressStatus,
} from "@/lib/cloudflare-email"
import { getContactEmail } from "@/lib/contact-email"
import { writeFeaturesOverride, writePortfolioOverride } from "@/lib/db/settings"
import { getSubdomainsForOwner } from "@/lib/domains"
import {
  findFeature,
  isFeatureEnabled,
  setFeatureEnabled,
  TOGGLEABLE_FEATURES,
} from "@/lib/features"
import { contactFormEnabled } from "@/lib/flags-server"
import { getGitHubAccessToken } from "@/lib/github-token"
import { providerForRecords } from "@/lib/providers"
import {
  getPendingProxyPRs,
  openProxyTogglePR,
  type PendingProxyPR,
} from "@/lib/proxy-pr"
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
// rather than a switch. `theme` is accepted for any template — the caller
// (components/portfolio-style-panel.tsx) already drops it for a designer
// template, since that design ignores `theme` entirely.
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
  /** Present when ok and a proxy change opened one — the pull request carrying it. */
  prUrl?: string
  /** Set when ok and at least one change (a feature or the portfolio style) took
   * effect immediately, with no pull request to wait on. */
  instant?: boolean
  /** Present when not ok — why this subdomain was skipped. */
  error?: string
}

export interface SaveSettingsResult {
  results: SubdomainSaveResult[]
}

function failure(subdomain: string, error: string): SaveSettingsResult {
  return { results: [{ subdomain, ok: false, error }] }
}

/** Two error strings, joined for a subdomain whose feature write and proxy PR
 * were not both attempted, or not both successful. */
function combineErrors(a: string | undefined, b: string): string {
  return a ? `${a} ${b}` : b
}

/**
 * Apply a batch of pending settings edits, one subdomain at a time so one
 * rejected record does not lose the rest of the user's work.
 *
 * The two kinds of change take different paths: a feature flag writes straight
 * to its D1 override and is live immediately (see lib/db/settings.ts) — no
 * pull request, no sync to wait on. A proxy flag still opens a pull request,
 * because the master switch is a Cloudflare setting the registry sync applies,
 * not something the dashboard can flip on its own. A batch touching both kinds
 * for one subdomain does both: the feature write and the PR open independently,
 * and either can fail without rolling back the other.
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

  // Group by subdomain — at most one pull request per record file.
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

  // A GitHub token and the pending-PR check are only needed for a batch that
  // actually touches the proxy switch — a features-only save never opens git.
  const needsGitHub = [...bySubdomain.values()].some((changes) =>
    changes.some((c) => c.kind === "proxy")
  )
  const token = needsGitHub ? await getGitHubAccessToken() : null
  if (needsGitHub && !token) {
    return {
      results: [...bySubdomain.keys()].map((subdomain) => ({
        subdomain,
        ok: false,
        error:
          "Your GitHub authorization is missing the required access. Sign out and sign in again to grant it.",
      })),
    }
  }
  const pending = token
    ? await getPendingProxyPRs(login, token)
    : new Map<string, PendingProxyPR>()

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

    // The proxy value this save leaves the record at — a tool flag is only
    // meaningful if the record ends up proxied, whether it already was or this
    // same batch turns it on.
    const proxyChange = changes.find((c) => c.kind === "proxy")
    const currentlyProxied = PROXYABLE_TYPES.some(
      (type) => readProxyState(domain.records, type)?.proxied === true
    )
    const willBeProxied = proxyChange ? proxyChange.enabled : currentlyProxied

    const proxyApplicable: RecordChange[] = []
    const featureApplicable: { feature: string; enabled: boolean }[] = []
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
        proxyApplicable.push({
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
      // shows as verified (lib/domain-view.ts's contactFormBlockReason), and
      // hides it altogether while the "contact-form" release flag is off
      // (lib/flags.ts) — but both are UI conveniences, not the only guard.
      // Re-checked here the same way the proxy prerequisite above is, since
      // the client controls none of them, and a flag flip is meant to hide
      // the feature without a deploy, not merely to hide its button.
      //
      // The email itself is looked up for the signed-in user, not the
      // subdomain: Cloudflare Email Routing's destination-address list is
      // account-wide, and only the owner can toggle their own subdomain's
      // settings anyway, so "my own contact email" is the only one that can
      // ever be relevant here.
      if (change.feature === "contact-form" && change.enabled) {
        if (!(await contactFormEnabled())) {
          rejection = "Contact Form is not available yet."
          continue
        }
        const email = githubId ? await getContactEmail(githubId) : null
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
      featureApplicable.push({
        feature: change.feature,
        enabled: change.enabled,
      })
    }

    if (proxyApplicable.length === 0 && featureApplicable.length === 0) {
      results.push({
        subdomain,
        ok: false,
        error: rejection ?? "Nothing left to change on this record.",
      })
      continue
    }

    let ok = true
    let error: string | undefined
    let prUrl: string | undefined
    let instant = false

    if (featureApplicable.length > 0) {
      const nextFeatures = featureApplicable.reduce<Record<string, unknown>>(
        (acc, change) => {
          const feature = findFeature(change.feature)
          return feature ? setFeatureEnabled(acc, feature, change.enabled) : acc
        },
        domain.features ?? {}
      )
      const write = await writeFeaturesOverride(subdomain, nextFeatures)
      if (write.ok) {
        instant = true
      } else {
        ok = false
        error = write.error
      }
    }

    if (proxyApplicable.length > 0) {
      const open = pending.get(subdomain)
      if (open) {
        ok = false
        error = combineErrors(
          error,
          `A change is already open as pull request #${open.number}. Merge or close it first.`
        )
      } else if (!token) {
        ok = false
        error = combineErrors(
          error,
          "Your GitHub authorization is missing the required access."
        )
      } else {
        const result = await openProxyTogglePR(token, {
          login,
          subdomain,
          changes: proxyApplicable,
        })
        if (result.ok) {
          prUrl = result.prUrl
        } else {
          ok = false
          error = combineErrors(error, result.error)
        }
      }
    }

    results.push({ subdomain, ok, ...(prUrl && { prUrl }), instant, error })
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
 * Restyle a hosted portfolio — a direct write to its D1 override, live as soon
 * as this returns. No pull request: the renderer checks the override before
 * falling back to git (lib/portfolio-config.ts), so there is nothing for a PR
 * to accomplish here that the write does not already do. Ownership and the
 * hosted-portfolio requirement are re-checked here; the client controls
 * neither.
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
  if (providerForRecords(domain.records)?.id !== "portfolio") {
    return {
      subdomain,
      ok: false,
      error: `${subdomain}.is-pinoy.dev is not a hosted portfolio.`,
    }
  }

  const write = await writePortfolioOverride(subdomain, {
    template,
    ...(theme ? { theme } : {}),
  })
  if (!write.ok) {
    return { subdomain, ok: false, error: write.error }
  }

  revalidatePath("/domains")
  revalidatePath(`/domains/${subdomain}`)
  return { subdomain, ok: true, instant: true }
}
