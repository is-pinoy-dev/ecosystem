/**
 * The subdomain's record in the is-pinoy-dev/domains repo.
 *
 * Both halves of this tool need it and for different reasons — the Worker to
 * decide whether site-audit is switched on for the host it is being served
 * from, /audit-proxy to decide whether the target is a hosted portfolio or
 * somebody's own origin — so the fetch and its cache live here once rather
 * than twice.
 *
 * Imported by `worker/index.ts`, which typechecks under
 * `@cloudflare/workers-types`, and by `src/`, which typechecks under `DOM`.
 * Nothing here may depend on either: no `caches.default` without the guard
 * below, no `Response.json<T>()`.
 */

const DOMAINS_RAW_BASE =
  "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains"

const CACHE_TTL_SECONDS = 300

/** Only the fields the tools read. The file carries more. */
export interface DomainRecord {
  owner?: { github?: string }
  /**
   * Present only on a hosted portfolio — the block that names its template and
   * theme. A record without one is a subdomain pointing at its owner's own
   * host, which the renderer refuses to serve and this tool must not rewrite.
   */
  portfolio?: Record<string, unknown>
  features?: { tools?: Record<string, boolean | undefined> }
}

/**
 * Three outcomes, not two. "Nobody claimed this name" and "GitHub would not
 * answer" look identical to a caller handed `null`, and they call for opposite
 * defaults: the first is a settled fact, the second is a blip that should not
 * be allowed to reconfigure anything.
 */
export type DomainLookup =
  | { status: "found"; record: DomainRecord }
  | { status: "unclaimed" }
  | { status: "unavailable" }

/** Cloudflare's `ctx`, structurally — the src tsconfig has no ExecutionContext. */
export interface WaitUntil {
  waitUntil(promise: Promise<unknown>): void
}

interface EdgeCache {
  match(key: string): Promise<Response | undefined>
  put(key: string, response: Response): Promise<void>
}

/**
 * `caches.default` is a Workers extension. Under the DOM's `CacheStorage` it
 * does not exist, and in a plain Node test neither does `caches`, so both are
 * checked before the cast rather than assumed.
 */
function edgeCache(): EdgeCache | null {
  if (typeof caches === "undefined" || !("default" in caches)) return null
  return (caches as unknown as { default: EdgeCache }).default
}

/** Keyed on a hostname we do not own, so it can never collide with a real URL. */
const cacheKeyFor = (subdomain: string) =>
  `https://feature-cache.internal/domains/${subdomain}.json`

export async function lookupSubdomain(
  subdomain: string,
  ctx?: WaitUntil,
): Promise<DomainLookup> {
  const cache = edgeCache()
  const cacheKey = cacheKeyFor(subdomain)

  if (cache) {
    const hit = await cache.match(cacheKey)
    if (hit) {
      const record = await readRecord(hit)
      // A cached entry that no longer parses is not worth a second failure
      // mode; fall through and ask GitHub again.
      if (record) return { status: "found", record }
    }
  }

  const url = `${DOMAINS_RAW_BASE}/${subdomain}.json`
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    console.warn(`[site-audit] domains lookup threw subdomain=${subdomain}`)
    return { status: "unavailable" }
  }

  if (res.status === 404) return { status: "unclaimed" }
  if (!res.ok) {
    console.warn(
      `[site-audit] domains lookup failed subdomain=${subdomain} status=${res.status}`,
    )
    return { status: "unavailable" }
  }

  const body = await res.text()
  const record = parseRecord(body)
  if (!record) {
    console.warn(`[site-audit] domains record unreadable subdomain=${subdomain}`)
    return { status: "unavailable" }
  }

  // Only successes are cached, which is what makes a cache hit mean "found"
  // without storing the verdict alongside the bytes.
  if (cache && ctx) {
    ctx.waitUntil(
      cache.put(
        cacheKey,
        new Response(body, {
          headers: { "Cache-Control": `max-age=${CACHE_TTL_SECONDS}` },
        }),
      ),
    )
  }

  return { status: "found", record }
}

async function readRecord(res: Response): Promise<DomainRecord | null> {
  try {
    return parseRecord(await res.text())
  } catch {
    return null
  }
}

function parseRecord(body: string): DomainRecord | null {
  try {
    const parsed: unknown = JSON.parse(body)
    if (!parsed || typeof parsed !== "object") return null
    return parsed as DomainRecord
  } catch {
    return null
  }
}

/**
 * Whether this record describes a portfolio we render, as opposed to a
 * subdomain whose CNAME points at its owner's own host. The renderer decides
 * the same way — see `apps/portfolio/lib/resolve.ts`, where a file with no
 * `portfolio` block resolves to `no-portfolio-block` and 404s.
 */
export function isHostedPortfolio(record: DomainRecord): boolean {
  return Boolean(record.portfolio)
}

/** Whether a named tool is switched on for this record. */
export function isToolEnabled(record: DomainRecord, tool: string): boolean {
  return record.features?.tools?.[tool] === true
}
