/**
 * The subdomain's record in the is-pinoy-dev/domains repo.
 *
 * Adapted from tools/site-audit/src/lib/domains.ts — same fetch, same
 * three-outcome lookup, same edge cache. This tool has no equivalent to that
 * one's `src/` (DOM-typed) half, so there is only one copy to keep in step
 * with `@cloudflare/workers-types` here.
 */

const DOMAINS_RAW_BASE =
  "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains"

const CACHE_TTL_SECONDS = 300

/** Only the fields this tool reads. The file carries more. */
export interface DomainRecord {
  contactForm?: { email?: string }
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

interface EdgeCache {
  match(key: string): Promise<Response | undefined>
  put(key: string, response: Response): Promise<void>
}

/**
 * `caches.default` is a Workers extension that does not exist under plain
 * Node — including in this package's own Vitest run (`environment: "node"`).
 * Checked before use rather than assumed, the same way
 * tools/site-audit/src/lib/domains.ts guards it.
 */
function edgeCache(): EdgeCache | null {
  if (typeof caches === "undefined" || !("default" in caches)) return null
  return (caches as unknown as { default: EdgeCache }).default
}

/** Keyed on a hostname we do not own, so it can never collide with a real URL. */
const cacheKeyFor = (subdomain: string) =>
  `https://feature-cache.internal/contact-form/domains/${subdomain}.json`

export async function lookupSubdomain(
  subdomain: string,
  ctx?: ExecutionContext,
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
    console.warn(`[contact-form] domains lookup threw subdomain=${subdomain}`)
    return { status: "unavailable" }
  }

  if (res.status === 404) return { status: "unclaimed" }
  if (!res.ok) {
    console.warn(
      `[contact-form] domains lookup failed subdomain=${subdomain} status=${res.status}`,
    )
    return { status: "unavailable" }
  }

  const body = await res.text()
  const record = parseRecord(body)
  if (!record) {
    console.warn(`[contact-form] domains record unreadable subdomain=${subdomain}`)
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

/** Whether a named tool is switched on for this record. */
export function isToolEnabled(record: DomainRecord, tool: string): boolean {
  return record.features?.tools?.[tool] === true
}
