"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/auth"
import { getSubdomainsForOwner } from "@/lib/domains"
import { getGitHubAccessToken } from "@/lib/github-token"
import {
  getPendingProxyPRs,
  openProxyTogglePR,
  type ProxyToggleResult,
} from "@/lib/proxy-pr"
import {
  PROXYABLE_TYPES,
  proxyLockReason,
  readProxyState,
} from "@/lib/proxy-record"

const toggleInput = z.object({
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

export type ProxyToggleInput = z.infer<typeof toggleInput>

/**
 * Open a pull request that flips `proxied` on one record type of one of the
 * caller's subdomains. Ownership, the pinned-portfolio lock, and the no-op case
 * are all re-checked server-side — the client controls none of them.
 */
export async function toggleProxy(
  input: ProxyToggleInput
): Promise<ProxyToggleResult> {
  const session = await auth()
  if (!session?.user?.login) {
    return { ok: false, error: "You must be signed in to change a record." }
  }
  const login = session.user.login

  const parsed = toggleInput.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." }
  }
  const { subdomain, type, proxied } = parsed.data

  // Authorization: the registry is the authority on who owns what, so re-read
  // it rather than trusting anything the client sent.
  const { owned } = await getSubdomainsForOwner(login)
  const domain = owned.find((d) => d.subdomain === subdomain)
  if (!domain) {
    return { ok: false, error: `You do not own ${subdomain}.is-pinoy.dev.` }
  }

  const locked = proxyLockReason(domain.records, type)
  if (locked) return { ok: false, error: locked }

  const state = readProxyState(domain.records, type)
  if (!state) {
    return {
      ok: false,
      error: `${subdomain}.is-pinoy.dev has no ${type} record to proxy.`,
    }
  }
  // A mixed-state record is never a no-op — flipping it aligns every entry.
  if (!state.mixed && state.proxied === proxied) {
    return {
      ok: false,
      error: `The ${type} record is already ${proxied ? "proxied" : "unproxied"}.`,
    }
  }

  const token = await getGitHubAccessToken()
  if (!token) {
    return {
      ok: false,
      error:
        "Your GitHub authorization is missing the required access. Sign out and sign in again to grant it.",
    }
  }

  // One change in flight per subdomain: a second PR against the same branch
  // would either collide or quietly supersede the first. Surface the open one.
  const pending = await getPendingProxyPRs(login, token)
  const open = pending.get(subdomain)
  if (open) {
    return {
      ok: false,
      error: `A proxy change for ${subdomain}.is-pinoy.dev is already open as pull request #${open.number}. Merge or close it first.`,
    }
  }

  const result = await openProxyTogglePR(token, {
    login,
    subdomain,
    type,
    proxied,
  })

  if (result.ok) revalidatePath("/domains")
  return result
}
