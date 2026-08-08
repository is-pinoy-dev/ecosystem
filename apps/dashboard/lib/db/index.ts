import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy"

import { d1Query, type D1Config } from "./d1"
import * as schema from "./schema"

export type Db = SqliteRemoteDatabase<typeof schema>

// Cache the client on globalThis so dev-server hot reloads and route handlers
// reuse one instance instead of rebuilding it per import.
const globalForDb = globalThis as unknown as { __dashboardDb?: Db }

function readConfig(): Partial<D1Config> {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
    token: process.env.CLOUDFLARE_D1_API_TOKEN,
  }
}

export function hasDatabase(): boolean {
  const { accountId, databaseId, token } = readConfig()
  return Boolean(accountId && databaseId && token)
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
