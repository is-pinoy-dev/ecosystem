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

function line(head: string, f: Fields): void {
  const rest = fields(f)
  console.warn(rest ? `${head} ${rest}` : head)
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
