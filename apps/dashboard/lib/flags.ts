// Dashboard feature flags: shipping a route to production with it switched off,
// while still being able to open it yourself on the production deployment.
//
// Not to be confused with lib/features.ts. That is the *platform* feature
// registry — per-subdomain flags a developer owns, stored in the domains repo
// and edited from the dashboard. These are *release* flags: they gate whether a
// slice of the dashboard exists at all.
//
// This module is only the registry and its types. It deliberately holds no
// resolution logic: Vercel Flags owns every decision, including who sees an
// unlaunched feature and in which environments, and those rules are configured
// in the Vercel dashboard. lib/flags-server.ts talks to it; this file exists so
// client components can name a flag without importing server-only code.
//
// Each key here must match a flag key in the Vercel dashboard exactly.

export interface FlagDefinition {
  /** Why the flag exists, and what removing it would ship. */
  description: string
}

export const FLAGS = {
  claims: {
    description:
      "The Claim tab and /claim route — the portfolio subdomain claim flow.",
  },
  "contact-form": {
    description:
      "The Contact Form platform feature: its switch in the platform panel and " +
      "the Contact email settings panel. Depends on Cloudflare Email Routing " +
      "and a Turnstile site being provisioned first (see apps/dashboard/.env.example) " +
      "— keep this off until those are in place.",
  },
} as const satisfies Record<string, FlagDefinition>

export type FlagId = keyof typeof FLAGS

export type FlagSet = Record<FlagId, boolean>

export const FLAG_IDS = Object.keys(FLAGS) as FlagId[]
