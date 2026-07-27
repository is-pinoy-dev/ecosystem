"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/auth"
import { getSubdomainsForOwner } from "@/lib/domains"
import { getGitHubAccessToken } from "@/lib/github-token"
import { getPendingProxyPRs, openProxyTogglePR } from "@/lib/proxy-pr"
import {
  PROXYABLE_TYPES,
  proxyLockReason,
  readProxyState,
  type ProxyChange,
} from "@/lib/proxy-record"

const changeInput = z.object({
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9-]+$/),
  type: z.enum(PROXYABLE_TYPES),
  proxied: z.boolean(),
})

const saveInput = z.array(changeInput).min(1).max(50)

export type ProxyChangeInput = z.infer<typeof changeInput>

/** What happened to one subdomain's worth of changes. */
export interface SubdomainSaveResult {
  subdomain: string
  ok: boolean
  /** Present when ok — the pull request now carrying the change. */
  prUrl?: string
  /** Present when not ok — why this subdomain was skipped. */
  error?: string
}

export interface SaveProxyChangesResult {
  results: SubdomainSaveResult[]
}

/**
 * Open pull requests for a batch of pending proxy edits — one per subdomain,
 * since the branch name and the "one change in flight" rule are both keyed by
 * subdomain. Each subdomain succeeds or fails independently so one rejected
 * record does not lose the rest of the user's work.
 *
 * Ownership, the pinned-portfolio lock, and the no-op case are all re-checked
 * here: the client controls none of them.
 */
export async function saveProxyChanges(
  input: ProxyChangeInput[]
): Promise<SaveProxyChangesResult> {
  const session = await auth()
  if (!session?.user?.login) {
    return {
      results: [
        {
          subdomain: "",
          ok: false,
          error: "You must be signed in to change a record.",
        },
      ],
    }
  }
  const login = session.user.login

  const parsed = saveInput.safeParse(input)
  if (!parsed.success) {
    return {
      results: [{ subdomain: "", ok: false, error: "Invalid request." }],
    }
  }

  // Group by subdomain — one pull request per record file.
  const bySubdomain = new Map<string, ProxyChange[]>()
  for (const change of parsed.data) {
    const existing = bySubdomain.get(change.subdomain) ?? []
    // Last write wins if the same type somehow appears twice.
    const deduped = existing.filter((c) => c.type !== change.type)
    deduped.push({ type: change.type, proxied: change.proxied })
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
        error: `A proxy change is already open as pull request #${open.number}. Merge or close it first.`,
      })
      continue
    }

    // Drop anything locked or already at the requested value, then only open a
    // pull request if something real is left.
    const applicable = changes.filter((change) => {
      if (proxyLockReason(domain.records, change.type)) return false
      const state = readProxyState(domain.records, change.type)
      if (!state) return false
      return state.mixed || state.proxied !== change.proxied
    })

    if (applicable.length === 0) {
      results.push({
        subdomain,
        ok: false,
        error: "Nothing left to change on this record.",
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

  if (results.some((r) => r.ok)) revalidatePath("/domains")
  return { results }
}
