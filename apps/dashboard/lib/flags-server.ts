import "server-only"

import { vercelAdapter } from "@flags-sdk/vercel"
import { dedupe, flag } from "flags/next"
import { auth } from "@/auth"
import {
  buildFlagContext,
  FLAG_IDS,
  FLAGS,
  isFlagEnabled,
  readDeployEnv,
  readEnvSource,
  type DeployEnv,
  type FlagId,
  type FlagSet,
} from "./flags"

// The Flags SDK half of lib/flags.ts. Flags are managed in Vercel Flags: the
// registry here declares them, and the targeting rules — who sees an unlaunched
// feature, and any gradual rollout — are configured in the Vercel dashboard.
//
// `identify` supplies the entities those rules match against. It is wrapped in
// `dedupe` so auth() runs once per request no matter how many flags consult it;
// the dashboard already calls auth() in the layout, the page, and the claim
// action.
//
// Off Vercel there is no flags service to ask, so the adapter is swapped for a
// local `decide` backed by the environment variables and the same
// `isFlagEnabled` rules. That keeps `pnpm dev`, CI, and `next start` working
// with no Vercel connection and no flag-request quota being spent, and means a
// developer can switch a flag on locally without touching production config.

/**
 * Entities handed to Vercel Flags for targeting. Attributes referenced by
 * dashboard rules must appear here — `user.login` is what the tester
 * allowlist matches on.
 */
export interface FlagEntities {
  user?: { id: string; login: string }
  environment: DeployEnv
}

/** True when a Vercel Flags connection is configured (`FLAGS` is set on Vercel). */
const hasFlagsService = Boolean(process.env.FLAGS)

export const identify = dedupe(async (): Promise<FlagEntities> => {
  const session = await auth()
  const login = session?.user?.login?.toLowerCase()
  return {
    user: login ? { id: login, login } : undefined,
    environment: readDeployEnv(process.env),
  }
})

/**
 * The off-Vercel decision: the flag's declared `enabledIn`, overridden by
 * DASHBOARD_FLAGS and DASHBOARD_FLAG_TESTERS. Mirrors what the dashboard rules
 * are expected to express, so local behaviour is predictable rather than
 * simply "off".
 */
function decideLocally(id: FlagId, entities?: FlagEntities): boolean {
  return isFlagEnabled(
    id,
    buildFlagContext({
      env: entities?.environment ?? readDeployEnv(process.env),
      source: readEnvSource(process.env),
      login: entities?.user?.login ?? null,
    })
  )
}

function createFlag(id: FlagId) {
  const declaration = {
    key: id,
    description: FLAGS[id].description,
    // Used when the service is unreachable or the flag is not configured yet.
    // Failing closed is right for an unlaunched feature: a broken lookup hides
    // it rather than exposing it.
    defaultValue: false,
    identify,
  }

  if (hasFlagsService) {
    try {
      // vercelAdapter() builds its client eagerly, and throws right here on a
      // malformed or missing connection string. This module is imported by the
      // dashboard's shared layout, so an uncaught throw would 500 every page
      // rather than just the flagged feature — catch it and degrade instead.
      return flag<boolean, FlagEntities>({
        ...declaration,
        adapter: vercelAdapter(),
      })
    } catch (error) {
      console.error(
        `flags: Vercel Flags unavailable for "${id}", using local rules`,
        error
      )
    }
  }

  return flag<boolean, FlagEntities>({
    ...declaration,
    decide: async ({ entities }) => decideLocally(id, entities),
  })
}

/** Every flag in the registry, as callable Flags SDK flags. */
export const dashboardFlags = Object.fromEntries(
  FLAG_IDS.map((id) => [id, createFlag(id)])
) as Record<FlagId, ReturnType<typeof createFlag>>

/**
 * Resolve one flag, and never throw.
 *
 * A misconfigured or unreachable Vercel Flags connection makes the adapter
 * throw (`Missing sdkKey`, network failures), and the SDK's `defaultValue` does
 * not catch every one of those. Flags are read in the dashboard's shared
 * layout, so an uncaught throw would take every page down rather than just the
 * flagged feature. Falling back to the declared rules keeps the dashboard up,
 * and keeps an unlaunched flag off in production, where DASHBOARD_FLAGS and
 * DASHBOARD_FLAG_TESTERS are deliberately unset.
 */
export async function isFlagOn(id: FlagId): Promise<boolean> {
  try {
    return await dashboardFlags[id]()
  } catch (error) {
    console.error(
      `flags: "${id}" could not be resolved, using local rules`,
      error
    )
    let entities: FlagEntities | undefined
    try {
      entities = await identify()
    } catch {
      // Treat an unreadable session as signed out.
    }
    return decideLocally(id, entities)
  }
}

/** The Claim tab and /claim route. */
export const claimEnabled = () => isFlagOn("claim")

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
