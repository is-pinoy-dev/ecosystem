import "server-only"

import { vercelAdapter } from "@flags-sdk/vercel"
import { flag } from "flags/next"
import { FLAG_IDS, FLAGS, type FlagId, type FlagSet } from "./flags"

// Resolves the registry in lib/flags.ts against Vercel Flags. Every decision —
// rollout percentage, per-environment state — belongs to the rules configured in
// the Vercel dashboard; nothing here second-guesses them.
//
// On Vercel this needs no configuration: deployments carry VERCEL_OIDC_TOKEN and
// the client authenticates with it. Elsewhere it reads the FLAGS SDK key — note
// that an empty FLAGS is worse than an absent one, since the client only
// validates the key when it is defined and throws otherwise (see .env.example).
// With neither, every flag reads false and the sections behind them stay hidden;
// the site still runs.
//
// Unlike the dashboard, this app has no session, so no `identify` is supplied
// and no entities reach Vercel Flags. A rule targeting one GitHub login can
// therefore open the dashboard's claim flow for that developer without also
// announcing it on the public site: out here `claims` follows the flag's
// environment and rollout rules only.

function createFlag(id: FlagId) {
  const declaration = {
    key: id,
    description: FLAGS[id].description,
    // Used when a flag is not configured yet or cannot be read. Failing closed
    // is right for an unlaunched feature: a broken lookup hides it rather than
    // exposing it.
    defaultValue: false,
  }

  try {
    // vercelAdapter() builds its client eagerly and throws right here when FLAGS
    // is missing or malformed. This module is imported by the landing page, so an
    // uncaught throw would return 500 for the whole page rather than just hiding
    // the flagged sections — catch it and leave the flag off.
    return flag<boolean>({
      ...declaration,
      adapter: vercelAdapter(),
    })
  } catch (error) {
    console.error(
      `flags: Vercel Flags unavailable for "${id}", leaving it off`,
      error
    )
    return flag<boolean>({
      ...declaration,
      decide: () => false,
    })
  }
}

/** Every flag in the registry, as callable Flags SDK flags. */
export const webFlags = Object.fromEntries(
  FLAG_IDS.map((id) => [id, createFlag(id)])
) as Record<FlagId, ReturnType<typeof createFlag>>

/**
 * Resolve one flag, and never throw. Resolution can fail per request — a network
 * blip, a revoked key — and the SDK's `defaultValue` does not catch every case.
 * Flags are read while rendering the landing page, so an uncaught throw would
 * take the page down instead of one section.
 */
export async function isFlagOn(id: FlagId): Promise<boolean> {
  try {
    return await webFlags[id]()
  } catch (error) {
    console.error(`flags: "${id}" could not be resolved, leaving it off`, error)
    return false
  }
}

/** The hosted-portfolio and theme-marketplace sections, and their nav entries. */
export const claimsEnabled = () => isFlagOn("claims")

/**
 * Resolve every flag for this request, for handing to client components as plain
 * booleans.
 */
export async function resolveFlagSet(): Promise<FlagSet> {
  const entries = await Promise.all(
    FLAG_IDS.map(async (id) => [id, await isFlagOn(id)] as const)
  )
  return Object.fromEntries(entries) as FlagSet
}
