import "server-only"

import { get } from "@vercel/edge-config"
import { dedupe, flag } from "flags/next"
import { auth } from "@/auth"
import {
  buildFlagContext,
  emptyFlagSource,
  FLAG_IDS,
  FLAGS,
  isFlagEnabled,
  readDeployEnv,
  readEnvSource,
  parseRemoteSource,
  type DeployEnv,
  type FlagId,
  type FlagSet,
  type FlagSource,
} from "./flags"

// The Flags SDK half of lib/flags.ts: it supplies the two things the pure
// resolver cannot work out for itself — who is asking, and what the remote
// state currently is — then defers to `isFlagEnabled` for the actual decision.
//
// Remote state lives in one Vercel Edge Config key so a flag can be flipped
// without a deploy. Edge Config reads are sub-millisecond and propagate
// globally in seconds, which is the whole reason for preferring it to
// environment variables: on Vercel, env vars are injected at deploy time, so
// changing one only takes effect on the next deploy.

/** The single Edge Config key holding every flag's remote state. */
export const EDGE_CONFIG_KEY = "dashboardFlags"

/** What `decide` is told about the caller. */
export interface FlagEntities {
  /** Lowercased GitHub login, or null when signed out. */
  login: string | null
  env: DeployEnv
}

/**
 * Establish who is asking. Wrapped in `dedupe` so that `auth()` runs once per
 * request no matter how many flags consult it — the dashboard already calls
 * `auth()` in the layout, the page, and the claim action.
 */
export const identify = dedupe(async (): Promise<FlagEntities> => {
  const session = await auth()
  return {
    login: session?.user?.login?.toLowerCase() ?? null,
    env: readDeployEnv(process.env),
  }
})

/**
 * Read the remote source, preferring Edge Config and falling back to the
 * environment variables when it is not configured — which keeps local
 * development, CI, and `next start` working with no Vercel connection.
 *
 * A failed read also falls back rather than throwing. With no Edge Config and
 * no env vars set the result is an empty source, so every flag lands on its
 * declared `enabledIn` default: an outage can never switch an unlaunched
 * feature on.
 */
export const readFlagSource = dedupe(async (): Promise<FlagSource> => {
  if (process.env.EDGE_CONFIG) {
    try {
      const raw = await get(EDGE_CONFIG_KEY)
      return raw === undefined ? emptyFlagSource() : parseRemoteSource(raw)
    } catch {
      // Fall through to the environment below.
    }
  }
  return readEnvSource(process.env)
})

function createFlag(id: FlagId) {
  return flag<boolean, FlagEntities>({
    key: id,
    description: FLAGS[id].description,
    // Last-resort value if `decide` throws. Failing closed is right for a
    // not-yet-launched feature: a broken decision hides it rather than
    // exposing it.
    defaultValue: false,
    identify,
    async decide({ entities }) {
      const source = await readFlagSource()
      return isFlagEnabled(
        id,
        buildFlagContext({
          env: entities?.env ?? readDeployEnv(process.env),
          source,
          login: entities?.login ?? null,
        })
      )
    },
  })
}

/** Every flag in the registry, as callable Flags SDK flags. */
export const dashboardFlags = Object.fromEntries(
  FLAG_IDS.map((id) => [id, createFlag(id)])
) as Record<FlagId, ReturnType<typeof createFlag>>

/** The Claim tab and /claim route. */
export const claimFlag = dashboardFlags.claim

/**
 * Resolve every flag for this request, for handing to client components as
 * plain booleans.
 */
export async function resolveFlagSet(): Promise<FlagSet> {
  const entries = await Promise.all(
    FLAG_IDS.map(async (id) => [id, await dashboardFlags[id]()] as const)
  )
  return Object.fromEntries(entries) as FlagSet
}
