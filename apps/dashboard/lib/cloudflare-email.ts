import "server-only"

// Registering and checking verified Cloudflare Email Routing destination
// addresses — the prerequisite the Contact Form feature gates on.
//
// Unlike every other Cloudflare call in this repo (DNS records, Worker
// routes — see packages/registry/src/providers/cloudflare/client.ts), this one
// is account-scoped rather than zone-scoped
// (`/accounts/{account_id}/email/routing/addresses`, not
// `/zones/{zone_id}/...`), so it gets its own small `cfRequest`-shaped helper
// here rather than importing the registry's — the dashboard does not depend
// on @is-pinoy-dev/registry, and the two are not interchangeable anyway (a
// zone-scoped token cannot call an account-scoped endpoint).
//
// Cloudflare never skips verification, whether the address is added via this
// API or the dashboard: adding one only sends the owner a confirmation
// email, and `verified` stays null until they click the link in it. There is
// no way to poll that faster than the owner checking their inbox.

const ADDRESSES_PER_PAGE = 50

export interface CloudflareEmailAddress {
  tag: string
  email: string
  /** ISO timestamp once the owner confirms, null until then. */
  verified: string | null
  created: string
  modified: string
}

export type DestinationAddressStatus = "verified" | "pending" | "absent"

function accountId(): string | null {
  return process.env.CLOUDFLARE_ACCOUNT_ID || null
}

function apiToken(): string | null {
  return process.env.CLOUDFLARE_EMAIL_API_TOKEN || null
}

/** Whether both env vars this module needs are actually set. */
export function hasEmailRouting(): boolean {
  return Boolean(accountId() && apiToken())
}

async function emailRoutingRequest<T>(
  path: string,
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const account = accountId()
  const token = apiToken()
  if (!account || !token) {
    throw new Error(
      "Cloudflare Email Routing is not configured: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_EMAIL_API_TOKEN"
    )
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/email/routing/addresses${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    }
  )

  const json = (await res.json()) as {
    success: boolean
    result: T
    errors: unknown[]
  }

  if (!json.success) {
    // Extract only the human-readable message, matching the registry's own
    // `cfRequest` — never surface Cloudflare's raw error shape to a caller.
    const first = Array.isArray(json.errors)
      ? (json.errors[0] as { message?: string })
      : null
    throw new Error(
      `Cloudflare API error: ${first?.message ?? "unknown error"}`
    )
  }

  return json.result
}

/**
 * Register a destination address. Idempotent from the caller's point of
 * view: re-registering an address that already exists (verified or still
 * pending) is a normal, expected call — the owner may click "Verify email"
 * again while waiting on Cloudflare's confirmation link — so a "duplicate
 * address" response from Cloudflare is treated as success rather than an
 * error.
 */
export async function createDestinationAddress(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await emailRoutingRequest<CloudflareEmailAddress>("", "POST", { email })
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/already exists|duplicate/i.test(message)) return { ok: true }
    return {
      ok: false,
      error:
        "Could not register this address with Cloudflare. Please try again.",
    }
  }
}

/**
 * Every destination address on the account. Cloudflare caps `per_page` at 50
 * and offers no filter by email, so past 50 total addresses across every
 * subdomain owner a single request silently truncates — this paginates until
 * a page comes back short, with a generous hard cap so a pathological
 * response (or an API change) can't spin forever.
 */
const MAX_PAGES = 100

export async function listDestinationAddresses(): Promise<
  CloudflareEmailAddress[]
> {
  const all: CloudflareEmailAddress[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await emailRoutingRequest<CloudflareEmailAddress[]>(
      `?per_page=${ADDRESSES_PER_PAGE}&page=${page}`,
      "GET"
    )
    all.push(...batch)
    if (batch.length < ADDRESSES_PER_PAGE) return all
  }
  console.warn(
    `[cloudflare-email] listDestinationAddresses stopped at ${MAX_PAGES} pages — the account may have more addresses than were returned.`
  )
  return all
}

/** Read a status off an already-fetched list — no extra request per email. */
export function statusFromList(
  list: CloudflareEmailAddress[],
  email: string
): DestinationAddressStatus {
  const match = list.find(
    (address) => address.email.toLowerCase() === email.toLowerCase()
  )
  if (!match) return "absent"
  return match.verified ? "verified" : "pending"
}

/**
 * One address's status. Prefer `listDestinationAddresses` + `statusFromList`
 * when checking several owners at once — this fetches the same list on every
 * call.
 */
export async function getDestinationAddressStatus(
  email: string
): Promise<DestinationAddressStatus> {
  const list = await listDestinationAddresses()
  return statusFromList(list, email)
}
