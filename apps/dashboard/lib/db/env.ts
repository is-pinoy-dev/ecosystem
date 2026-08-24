// Reading the Cloudflare credentials out of the environment.
//
// Every one of these values is copied by hand at least once — into
// `.env.local`, into a Vercel project variable, into a GitHub Environment
// secret — and a copy carries whatever the source had around it. A trailing
// newline from a `cat`-ed token file, a stray space from a double-click
// selection, or the quotes from a `KEY="value"` line pasted into a form all
// survive into `process.env` intact.
//
// Cloudflare does not tell you that is what happened. `Bearer <token> ` is
// simply not a token it knows, so the API answers 400 "Authentication error"
// — the same thing it says for a revoked token or one missing the D1
// permission — and the dashboard drops to the GitHub fallback with no way to
// tell the three apart. Normalising here removes the one cause that is
// actually ours to remove, and `cleanedEnvVars()` names the variable that
// needed it so the log can say so out loud.

/** Variables whose raw value was not what the deployment meant to set. */
const cleaned = new Set<string>()

function unquote(value: string): string {
  const quoted =
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  return quoted ? value.slice(1, -1).trim() : value
}

/**
 * `process.env[name]`, with surrounding whitespace and a wrapping pair of
 * quotes removed, and an all-whitespace value reported as unset rather than as
 * a credential that can only fail.
 */
export function readEnv(name: string): string | undefined {
  const raw = process.env[name]
  if (raw === undefined) return undefined

  const value = unquote(raw.trim())
  if (value !== raw) cleaned.add(name)
  return value === "" ? undefined : value
}

/** Names `readEnv` has had to repair, for diagnostics. Sorted, deduplicated. */
export function cleanedEnvVars(): string[] {
  return [...cleaned].sort()
}

/** Test seam — the set above is process-wide by design. */
export function resetCleanedEnvVars(): void {
  cleaned.clear()
}
