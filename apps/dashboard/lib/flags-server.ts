import "server-only"

import { vercelAdapter } from "@flags-sdk/vercel"
import { dedupe, flag } from "flags/next"
import { auth } from "@/auth"
import { FLAG_IDS, FLAGS, type FlagId, type FlagSet } from "./flags"

// Resolves the registry in lib/flags.ts against Vercel Flags. Every decision —
// targeting, rollout percentage, per-environment state — belongs to the rules
// configured in the Vercel dashboard; nothing here second-guesses them.
//
// Requires the FLAGS connection string, which Vercel sets on the project once
// it is connected to Vercel Flags. Locally, pull it with `vercel env pull` so
// `pnpm dev` resolves against the same rules; without it every flag reads false
// and the flagged features stay hidden.

/**
 * Entities handed to Vercel Flags for targeting. Any attribute a dashboard rule
 * matches on has to appear here — `user.id` and `user.login` are both the
 * GitHub username, which is how a rule names a specific developer.
 */
export interface FlagEntities {
  user?: {
    id: string
    login: string
  }
}

/**
 * Establish who is asking. Wrapped in `dedupe` so auth() runs once per request
 * no matter how many flags consult it — the dashboard already calls auth() in
 * the layout, the page, and the claim action.
 */
export const identify = dedupe(async (): Promise<FlagEntities> => {
  const session = await auth()
  const login = session?.user?.login?.toLowerCase()
  return {
    user: login ? { id: login, login } : undefined,
  }
})

function createFlag(id: FlagId) {
  const declaration = {
    key: id,
    description: FLAGS[id].description,
    // Used when a flag is not configured yet or cannot be read. Failing closed
    // is right for an unlaunched feature: a broken lookup hides it rather than
    // exposing it.
    defaultValue: false,
    identify,
  }

  try {
    // vercelAdapter() builds its client eagerly and throws right here when FLAGS
    // is missing or malformed. This module is imported by the dashboard's shared
    // layout, so an uncaught throw would return 500 for every page rather than
    // just hiding the flagged feature — catch it and leave the flag off.
    return flag<boolean, FlagEntities>({
      ...declaration,
      adapter: vercelAdapter(),
    })
  } catch (error) {
    console.error(
      `flags: Vercel Flags unavailable for "${id}", leaving it off`,
      error
    )
    return flag<boolean, FlagEntities>({
      ...declaration,
      decide: () => false,
    })
  }
}

/** Every flag in the registry, as callable Flags SDK flags. */
export const dashboardFlags = Object.fromEntries(
  FLAG_IDS.map((id) => [id, createFlag(id)])
) as Record<FlagId, ReturnType<typeof createFlag>>

/**
 * Resolve one flag, and never throw. Resolution can fail per request — a
 * network blip, a revoked key — and the SDK's `defaultValue` does not catch
 * every case. Flags are read in the shared layout, so an uncaught throw would
 * take the whole dashboard down instead of one feature.
 */
export async function isFlagOn(id: FlagId): Promise<boolean> {
  try {
    return await dashboardFlags[id]()
  } catch (error) {
    console.error(`flags: "${id}" could not be resolved, leaving it off`, error)
    return false
  }
}

/** The Claim tab and /claim route. */
export const claimsEnabled = () => isFlagOn("claims")

/**
 * Resolve every flag for this request, for handing to client components as
 * plain booleans.
 */
export async function resolveFlagSet(): Promise<FlagSet> {
  const entries = await Promise.all(
    FLAG_IDS.map(async (id) => [id, await isFlagOn(id)] as const)
  )
  return Object.fromEntries(entries) as FlagSet
}
