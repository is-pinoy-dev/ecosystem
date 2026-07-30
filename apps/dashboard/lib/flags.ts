// Dashboard feature flags: shipping a route to production with it switched off,
// while still being able to open it yourself on the production deployment.
//
// Not to be confused with lib/features.ts. That is the *platform* feature
// registry — per-subdomain flags a developer owns, stored in the domains repo
// and edited from the dashboard. These are *release* flags: they gate whether
// a slice of the dashboard exists at all, and are configured by operators
// through the environment.
//
// A flag resolves from three inputs, highest precedence first:
//
//   DASHBOARD_FLAGS         "claim=on,other=off" — an explicit operator
//                           override. Wins over everything, so `=off` is a
//                           kill switch that no allowlist can reopen, and
//                           `=on` is a launch that needs no deploy.
//   DASHBOARD_FLAG_TESTERS  "octocat,hubot" — GitHub logins that get every
//                           not-yet-launched flag, in every environment. This
//                           is what makes a flag testable in production
//                           without exposing it to anyone else.
//   enabledIn               The environments where a flag is on for everyone.
//                           A flag's normal life is to start at
//                           ["development", "preview"] and gain "production"
//                           when it launches.
//
// Resolution happens on the server, in a server component, and the resolved
// booleans are passed to client components as props — so neither the override
// string nor the tester allowlist is ever serialised to the browser.
//
// Kept free of server-only imports so it can be unit tested.

/** Vercel's three deployment targets, which `VERCEL_ENV` reports directly. */
export type DeployEnv = "development" | "preview" | "production"

export interface FlagDefinition {
  /** Why the flag exists, and what removing it would ship. */
  description: string
  /** Environments where the flag is on for everyone, absent an override. */
  enabledIn: readonly DeployEnv[]
}

export const FLAGS = {
  claim: {
    description:
      "The Claim tab and /claim route — the portfolio subdomain claim flow.",
    enabledIn: ["development", "preview"],
  },
} as const satisfies Record<string, FlagDefinition>

export type FlagId = keyof typeof FLAGS

/**
 * The slice of the environment flags read. Narrower than `NodeJS.ProcessEnv`,
 * which `process.env` satisfies — so callers pass `process.env` directly while
 * tests build a literal with only the keys under test.
 */
export interface FlagEnv {
  VERCEL_ENV?: string | undefined
  NODE_ENV?: string | undefined
  DASHBOARD_FLAGS?: string | undefined
  DASHBOARD_FLAG_TESTERS?: string | undefined
}

export type FlagSet = Record<FlagId, boolean>

export const FLAG_IDS = Object.keys(FLAGS) as FlagId[]

/**
 * Everything flag resolution depends on, gathered so the resolver itself stays
 * pure and testable.
 */
export interface FlagContext {
  env: DeployEnv
  /** Explicit per-flag overrides parsed from `DASHBOARD_FLAGS`. */
  overrides: Partial<Record<FlagId, boolean>>
  /** Lowercased GitHub logins allowed to see unlaunched flags. */
  testers: readonly string[]
  /** GitHub login of the signed-in developer, lowercased; null when signed out. */
  login: string | null
}

function isFlagId(value: string): value is FlagId {
  return Object.hasOwn(FLAGS, value)
}

/**
 * Read `VERCEL_ENV`, which Vercel sets on every deployment. Off-Vercel (local
 * `next start`, CI, tests) there is no such thing as a preview, so `NODE_ENV`
 * decides between the two remaining answers.
 */
export function readDeployEnv(env: FlagEnv): DeployEnv {
  const vercel = env.VERCEL_ENV
  if (
    vercel === "production" ||
    vercel === "preview" ||
    vercel === "development"
  ) {
    return vercel
  }
  return env.NODE_ENV === "production" ? "production" : "development"
}

/**
 * Parse `DASHBOARD_FLAGS`. Entries are comma-separated and take the form
 * `name=on` / `name=off`; a bare `name` means on. Unknown names and
 * unrecognised values are ignored rather than guessed at, so a typo leaves the
 * declared behaviour in place instead of silently flipping a different flag.
 */
export function parseFlagOverrides(
  value: string | undefined | null
): Partial<Record<FlagId, boolean>> {
  const overrides: Partial<Record<FlagId, boolean>> = {}
  if (!value) return overrides

  for (const entry of value.split(",")) {
    const [rawName, rawValue] = entry.split("=", 2)
    const name = rawName?.trim().toLowerCase()
    if (!name || !isFlagId(name)) continue

    if (rawValue === undefined) {
      overrides[name] = true
      continue
    }
    const setting = rawValue.trim().toLowerCase()
    if (setting === "on" || setting === "true" || setting === "1") {
      overrides[name] = true
    } else if (setting === "off" || setting === "false" || setting === "0") {
      overrides[name] = false
    }
  }
  return overrides
}

/** Parse `DASHBOARD_FLAG_TESTERS` — GitHub logins, which compare caselessly. */
export function parseTesters(value: string | undefined | null): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((login) => login.trim().toLowerCase())
    .filter((login) => login.length > 0)
}

/** Gather a resolution context from the process environment and the session. */
export function readFlagContext(
  env: FlagEnv,
  login: string | null | undefined
): FlagContext {
  return {
    env: readDeployEnv(env),
    overrides: parseFlagOverrides(env.DASHBOARD_FLAGS),
    testers: parseTesters(env.DASHBOARD_FLAG_TESTERS),
    login: login ? login.toLowerCase() : null,
  }
}

export function isFlagEnabled(id: FlagId, context: FlagContext): boolean {
  const override = context.overrides[id]
  if (typeof override === "boolean") return override

  if (context.login && context.testers.includes(context.login)) return true

  // `as const` narrows each `enabledIn` to its literal members; widen it back
  // so any DeployEnv can be looked up.
  const enabledIn: readonly DeployEnv[] = FLAGS[id].enabledIn
  return enabledIn.includes(context.env)
}

/**
 * Resolve every flag at once. Server components hand the result to client
 * components, which read plain booleans and know nothing about how they were
 * decided.
 */
export function resolveFlags(context: FlagContext): FlagSet {
  return Object.fromEntries(
    FLAG_IDS.map((id) => [id, isFlagEnabled(id, context)])
  ) as FlagSet
}
