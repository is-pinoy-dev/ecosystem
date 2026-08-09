// Why a request ended at `notFound()`.
//
// Every failure in the render path — a name nobody has claimed, a claimed name
// with no `portfolio` block, an exhausted GitHub rate limit, a proxy secret that
// doesn't match — produces the identical 404 page. That is right for visitors
// and useless for operators: the first hosted portfolio 404ing looked exactly
// like a subdomain that was never claimed, and telling those apart meant reading
// four systems' dashboards.
//
// So each dead end names itself here, on one line with a stable prefix, in the
// runtime logs. Nothing in the response body changes.
export type MissReason =
  /** No `x-portfolio-subdomain`, no spike fallback — see the proxy's own header. */
  | "no-subdomain"
  /** No `subdomains/<name>.json` on the domains repo's main branch. */
  | "unknown-subdomain"
  /** The file exists but points at the owner's own host — nothing to render. */
  | "no-portfolio-block"
  /** The registry answered, but not with a domain file we could read. */
  | "registry-unreadable"
  /** raw.githubusercontent.com refused the lookup (not a plain 404). */
  | "registry-unreachable"
  /** The owner resolved, but the GitHub API gave us no user — often rate limit. */
  | "github-unavailable"

type Fields = Record<string, string | number | null | undefined>

/** `key=value` pairs, skipping whatever the branch didn't know. */
function fields(f: Fields): string {
  return Object.entries(f)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join(" ")
}

function line(head: string, f: Fields, level: "warn" | "info" = "warn"): void {
  const rest = fields(f)
  console[level](rest ? `${head} ${rest}` : head)
}

/**
 * A short, non-reversible tag for a shared secret.
 *
 * The point is comparison without disclosure: the Worker logs the fingerprint of
 * its copy, the renderer logs the fingerprint of its own, and equal tags mean
 * equal secrets. `x-portfolio-route: secret-mismatch` says only that the two
 * disagree — this says which side is carrying the stale one.
 *
 * 32 bits of SHA-256, and it stays in operator-visible logs rather than on a
 * response: for the `openssl rand -hex 32` value the runbook prescribes it is
 * not invertible, but a short tag of a *low-entropy* secret would be brute
 * forceable offline, and a log is the right blast radius for that assumption.
 */
export async function fingerprint(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  )
  return Array.from(new Uint8Array(digest).slice(0, 4))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * What this deployment is actually configured with, once per cold start.
 *
 * Both of these are invisible until something breaks, and each breaks in a way
 * that looks like something else: no `PORTFOLIO_PROXY_SECRET` and every claimed
 * portfolio 404s while previews keep working; no `GITHUB_TOKEN` and the renderer
 * serves ~20 pages an hour before every portfolio 404s at once. Naming them at
 * boot means the answer is already in the logs when someone goes looking.
 */
async function logConfig(): Promise<void> {
  const secret = process.env.PORTFOLIO_PROXY_SECRET
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN
  const rootDomain = process.env.PORTFOLIO_ROOT_DOMAIN

  line(
    "[portfolio] config",
    {
      proxySecret: secret ? "set" : "MISSING",
      // Compare against the Worker's `[portfolio-proxy] config` line.
      proxySecretFp: secret ? await fingerprint(secret) : null,
      githubToken: token ? "set" : "MISSING",
      rootDomain: rootDomain ?? "is-pinoy.dev(default)",
    },
    // A healthy deployment shouldn't cry wolf in the warning filter; an
    // incomplete one should be the first thing in it.
    secret && token ? "info" : "warn"
  )
}

let configLogged: Promise<void> | null = null

/** Memoized so concurrent first requests share one line, not one each. */
export function logConfigOnce(): Promise<void> {
  configLogged ??= logConfig()
  return configLogged
}

/**
 * Log one dead end. Stable, greppable prefix:
 * `vercel logs --since 1h | grep 'portfolio. miss'`.
 */
export function logMiss(reason: MissReason, f: Fields = {}): void {
  line(`[portfolio] miss reason=${reason}`, f)
}

/**
 * Log an upstream response that wasn't ok. Separate from `logMiss` because a
 * failed upstream isn't always a miss — `fetchProfileReadme` 404s for every
 * owner without a profile README, which is ordinary.
 *
 * `x-ratelimit-remaining` is the field worth having: an unauthenticated renderer
 * gets 60 requests an hour and spends three per render, so the difference
 * between "this user doesn't exist" and "GITHUB_TOKEN isn't set on the
 * deployment" is a 403 with `rateLimitRemaining=0`.
 */
export function logUpstream(source: string, url: string, res: Response): void {
  line(`[portfolio] upstream source=${source}`, {
    status: res.status,
    // The path only — the host is already implied by `source`.
    path: new URL(url).pathname,
    rateLimitRemaining: res.headers.get("x-ratelimit-remaining"),
  })
}
