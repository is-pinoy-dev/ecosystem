import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy"

import { d1Query, type D1Config } from "./d1"
import { readEnv } from "./env"
import * as schema from "./schema"

export type Db = SqliteRemoteDatabase<typeof schema>

// Cache the client on globalThis so dev-server hot reloads and route handlers
// reuse one instance instead of rebuilding it per import.
const globalForDb = globalThis as unknown as { __dashboardDb?: Db }

function readConfig(): Partial<D1Config> {
  return {
    accountId: readEnv("CLOUDFLARE_ACCOUNT_ID"),
    databaseId: readEnv("CLOUDFLARE_D1_DATABASE_ID"),
    token: readEnv("CLOUDFLARE_D1_API_TOKEN"),
  }
}

export function hasDatabase(): boolean {
  const { accountId, databaseId, token } = readConfig()
  return Boolean(accountId && databaseId && token)
}

// A Cloudflare account id is 32 hex characters; a D1 database id is a UUID.
const ACCOUNT_ID = /^[0-9a-f]{32}$/i
const DATABASE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

let warnedShape = false

/**
 * Say so when an identifier cannot be the thing it is supposed to be — a
 * swapped pair, a truncated paste, a database *name* where its id belongs.
 * Cloudflare answers all of those with the same "Authentication error" it
 * gives a revoked token, so without this the wrong variable gets suspected.
 *
 * A warning rather than a refusal: the shapes are Cloudflare's to change, and
 * being wrong about one should not disable a database that works.
 */
function warnOnSuspectShapeOnce(config: D1Config): void {
  if (warnedShape) return
  const suspect = [
    !ACCOUNT_ID.test(config.accountId) &&
      "CLOUDFLARE_ACCOUNT_ID is not 32 hex characters",
    !DATABASE_ID.test(config.databaseId) &&
      "CLOUDFLARE_D1_DATABASE_ID is not a UUID",
  ].filter((note): note is string => typeof note === "string")
  if (suspect.length === 0) return

  warnedShape = true
  console.warn(
    `[d1] ${suspect.join("; ")}. Cloudflare answers a malformed identifier with the ` +
      `same "Authentication error" it gives a bad token — check both against the ` +
      `Cloudflare dashboard, or run \`pnpm --filter dashboard db:check\`.`
  )
}

function requireConfig(): D1Config {
  const { accountId, databaseId, token } = readConfig()
  if (!accountId || !databaseId || !token) {
    throw new Error(
      "D1 is not configured: set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and CLOUDFLARE_D1_API_TOKEN"
    )
  }
  return { accountId, databaseId, token }
}

// drizzle-orm/sqlite-proxy expects each row as an array of column values in
// SELECT order. D1 returns objects; Object.values preserves that order.
function toPositionalRows(
  rows: Record<string, unknown>[],
  method: string
): { rows: unknown[] } {
  const values = rows.map((row) => Object.values(row))
  if (method === "get") {
    return { rows: values[0] ?? [] }
  }
  return { rows: values }
}

export function getDb(): Db {
  if (!globalForDb.__dashboardDb) {
    const config = requireConfig()
    warnOnSuspectShapeOnce(config)
    globalForDb.__dashboardDb = drizzle(
      async (sql, params, method) => {
        const rows = await d1Query(config, sql, params)
        return toPositionalRows(rows, method)
      },
      // Batch callback: the D1 HTTP API has no interactive transactions, so we
      // run the statements as a sequence of individual queries. Callers use
      // this only for the sync-event reconciliation, which is a full-snapshot
      // upsert — a partial failure self-heals on the next sync.
      async (queries) => {
        const out: { rows: unknown[] }[] = []
        for (const query of queries) {
          const rows = await d1Query(config, query.sql, query.params)
          out.push(toPositionalRows(rows, query.method))
        }
        return out
      },
      { schema }
    )
  }
  return globalForDb.__dashboardDb
}
