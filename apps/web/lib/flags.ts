// Public-site feature flags: shipping a landing section to production with it
// switched off, while still being able to see it yourself on the production
// deployment via the Vercel Toolbar.
//
// This is the marketing-site half of the dashboard's registry
// (apps/dashboard/lib/flags.ts). The keys are deliberately the same strings:
// `claims` gates the claim flow in the dashboard and everything that advertises
// it here, so one switch in the Vercel dashboard moves both. A key that drifts
// silently resolves to `defaultValue` — off — with no error raised anywhere,
// which is what lib/flags.test.ts guards.
//
// This module is only the registry and its types. It deliberately holds no
// resolution logic: Vercel Flags owns every decision, and those rules are
// configured in the Vercel dashboard. lib/flags-server.ts talks to it; this file
// exists so client components can name a flag without importing server-only
// code.

export interface FlagDefinition {
  /** Why the flag exists, and what removing it would ship. */
  description: string
}

export const FLAGS = {
  claims: {
    description:
      "The hosted-portfolio and theme-marketplace sections on the landing page, and the navigation entries into them. Matches the dashboard flag of the same name, which gates the claim flow they lead to.",
  },
} as const satisfies Record<string, FlagDefinition>

export type FlagId = keyof typeof FLAGS

export type FlagSet = Record<FlagId, boolean>

export const FLAG_IDS = Object.keys(FLAGS) as FlagId[]

/** Every flag off — what an unconfigured or unreachable Flags service means. */
export const FLAGS_OFF: FlagSet = Object.fromEntries(
  FLAG_IDS.map((id) => [id, false])
) as FlagSet
