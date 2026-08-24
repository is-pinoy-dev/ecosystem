// Talking to D1 over its HTTP API.
//
// The dashboard runs on a platform with no Workers runtime, so it has no D1
// binding to use. Cloudflare's REST API is the supported way in, and it is the
// same one drizzle-kit uses for migrations (see drizzle.config.ts) — so app
// queries and schema changes reach the database by an identical route.
//
// Two databases are read through here: the dashboard's own registry read model
// (lib/db/index.ts) and the analytics worker's visit totals (lib/analytics.ts).
// They are separate databases on purpose — see lib/analytics.ts.

import { cleanedEnvVars } from "./env"

export interface D1Config {
  accountId: string
  databaseId: string
  token: string
}

interface D1QueryResponse {
  success: boolean
  errors?: { code?: number; message: string }[]
  result?: { results?: Record<string, unknown>[]; success?: boolean }[]
}

/**
 * Why a query failed, in the terms that decide what to do about it.
 *
 * - `credentials` — Cloudflare refused the token. Nothing retries its way out.
 * - `target` — the token is fine; the account or database it names is not.
 * - `query` — the statement itself was rejected. A bug in the caller.
 * - `network` — the request never got an answer. Transient, usually.
 */
export type D1FailureKind = "credentials" | "target" | "query" | "network"

export class D1QueryError extends Error {
  readonly kind: D1FailureKind
  readonly status?: number
  readonly code?: number

  constructor(
    message: string,
    options: {
      kind: D1FailureKind
      status?: number
      code?: number
      cause?: unknown
    }
  ) {
    super(message, { cause: options.cause })
    this.name = "D1QueryError"
    this.kind = options.kind
    this.status = options.status
    this.code = options.code
  }

  /** True when re-running the same statement cannot plausibly do better. */
  get isConfigurationFailure(): boolean {
    return this.kind === "credentials" || this.kind === "target"
  }
}

/**
 * An identifier is not a secret, but it is long enough that a whole one in a
 * log is noise. Both ends are what you compare against the Cloudflare
 * dashboard, so keep both ends.
 */
function mask(id: string): string {
  return id.length <= 12 ? id : `${id.slice(0, 4)}…${id.slice(-4)}`
}

/**
 * Cloudflare's own error text for a rejected credential is three words long
 * and identical for every cause of it. This is the part that says which of the
 * three values to go and look at.
 */
function remedyFor(kind: D1FailureKind, config: D1Config): string {
  const cleaned = cleanedEnvVars()
  const pasteNote = cleaned.length
    ? ` Note that ${cleaned.join(" and ")} arrived with surrounding whitespace or quotes, which has been stripped — check the value stored in the deployment.`
    : ""

  switch (kind) {
    case "credentials":
      return (
        `CLOUDFLARE_D1_API_TOKEN was rejected for account ${mask(config.accountId)}. ` +
        `The token must be active, unexpired, issued for that same account, and carry the ` +
        `Account → D1 → Edit permission. Run \`pnpm --filter dashboard db:check\` to see which of ` +
        `the three values is at fault.${pasteNote}`
      )
    case "target":
      return (
        `The token was accepted but account ${mask(config.accountId)} / database ` +
        `${mask(config.databaseId)} could not be reached — check CLOUDFLARE_ACCOUNT_ID and ` +
        `CLOUDFLARE_D1_DATABASE_ID against the Cloudflare dashboard. Run ` +
        `\`pnpm --filter dashboard db:check\` to list the databases this token can see.${pasteNote}`
      )
    default:
      return pasteNote.trim()
  }
}

function classify(status: number, codes: number[]): D1FailureKind {
  // 10000 is Cloudflare's catch-all for "this token may not do that", and is
  // what a D1 read gets back for an expired token, a token minted in another
  // account, and a token without the D1 permission alike.
  if (status === 401 || status === 403 || codes.includes(10000)) {
    return "credentials"
  }
  // 7003/7000 are the routing layer saying an identifier in the path is not
  // one it recognises — a mistyped account or database id, not a bad token.
  if (status === 404 || codes.includes(7003) || codes.includes(7000)) {
    return "target"
  }
  return "query"
}

// A rejected credential is rejected for every request that follows it, and
// /domains is server-rendered per request: without this, every page view pays
// a full round trip to Cloudflare before falling back to GitHub, and writes
// the same stack trace to the log again. The cool-off keeps the fallback
// immediate while staying short enough that a corrected variable takes effect
// on its own — and process-wide state is fine here because the credentials
// are too.
const COOL_OFF_MS = 30_000

const globalForBreaker = globalThis as unknown as {
  __d1Breaker?: Map<string, { until: number; error: D1QueryError }>
}
const breaker = (globalForBreaker.__d1Breaker ??= new Map())

/** Test seam — the cool-off is process-wide by design. */
export function resetD1Breaker(): void {
  breaker.clear()
}

function trip(key: string, error: D1QueryError): void {
  const already = breaker.get(key)
  breaker.set(key, { until: Date.now() + COOL_OFF_MS, error })
  // Once per cool-off rather than once per query, so the log carries the
  // remedy without burying everything else under it.
  if (!already || already.until <= Date.now()) {
    console.error(`[d1] ${error.message}`)
  }
}

/**
 * Run a single statement and return its rows as objects keyed by column name.
 *
 * Throws {@link D1QueryError}; callers that can degrade (every registry read
 * does — git is the source of truth, D1 only a read model) should catch it
 * rather than let a broken read model take a page down.
 */
export async function d1Query(
  config: D1Config,
  sql: string,
  params: unknown[]
): Promise<Record<string, unknown>[]> {
  const key = `${config.accountId}/${config.databaseId}`
  const tripped = breaker.get(key)
  if (tripped) {
    if (tripped.until > Date.now()) throw tripped.error
    breaker.delete(key)
  }

  let res: Response
  try {
    res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql, params }),
      }
    )
  } catch (cause) {
    throw new D1QueryError(
      `D1 query failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      { kind: "network", cause }
    )
  }

  // A gateway or a WAF challenge answers with HTML, and `res.json()` throwing
  // over it would hide the status that actually explains the failure.
  let body: D1QueryResponse | undefined
  try {
    body = (await res.json()) as D1QueryResponse
  } catch {
    body = undefined
  }

  if (!res.ok || !body?.success) {
    const codes = (body?.errors ?? [])
      .map((e) => e.code)
      .filter((code): code is number => typeof code === "number")
    const kind = classify(res.status, codes)
    const reported =
      body?.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`
    const detail = [
      `HTTP ${res.status}`,
      codes.length ? `Cloudflare code ${codes.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(", ")
    const remedy = remedyFor(kind, config)

    const error = new D1QueryError(
      `D1 query failed: ${reported} (${detail}).${remedy ? ` ${remedy}` : ""}`,
      { kind, status: res.status, code: codes[0] }
    )
    if (error.isConfigurationFailure) trip(key, error)
    throw error
  }

  return body.result?.[0]?.results ?? []
}
