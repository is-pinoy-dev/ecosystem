"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/auth"
import { getSubdomainsForOwner } from "@/lib/domains"
import {
  findFeature,
  isFeatureEnabled,
  TOGGLEABLE_FEATURES,
} from "@/lib/features"
import { getGitHubAccessToken } from "@/lib/github-token"
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

  const { owned } = await getSubdomainsForOwner(login)
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
