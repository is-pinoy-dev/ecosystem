import {
  drizzle,
  type SqliteRemoteDatabase,
} from "drizzle-orm/sqlite-proxy"

import * as schema from "./schema"

export type Db = SqliteRemoteDatabase<typeof schema>

// Cache the client on globalThis so dev-server hot reloads and route handlers
// reuse one instance instead of rebuilding it per import.
const globalForDb = globalThis as unknown as { __dashboardDb?: Db }

interface D1Config {
  accountId: string
  databaseId: string
  token: string
}

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
      "D1 is not configured: set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and CLOUDFLARE_D1_API_TOKEN",
    )
  }
  return { accountId, databaseId, token }
}

interface D1QueryResponse {
  success: boolean
  errors?: { code?: number; message: string }[]
  result?: { results?: Record<string, unknown>[]; success?: boolean }[]
}

// Run a single statement against the D1 HTTP API and return its rows as
// objects keyed by column name.
async function d1Fetch(
  config: D1Config,
  sql: string,
  params: unknown[],
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    },
  )

  const body = (await res.json()) as D1QueryResponse
  if (!res.ok || !body.success) {
    const message =
      body.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`
    throw new Error(`D1 query failed: ${message}`)
  }
  return body.result?.[0]?.results ?? []
}

// drizzle-orm/sqlite-proxy expects each row as an array of column values in
// SELECT order. D1 returns objects; Object.values preserves that order.
function toPositionalRows(
  rows: Record<string, unknown>[],
  method: string,
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
        const rows = await d1Fetch(config, sql, params)
        return toPositionalRows(rows, method)
      },
      // Batch callback: the D1 HTTP API has no interactive transactions, so we
      // run the statements as a sequence of individual queries. Callers use
      // this only for the sync-event reconciliation, which is a full-snapshot
      // upsert — a partial failure self-heals on the next sync.
      async (queries) => {
        const out: { rows: unknown[] }[] = []
        for (const query of queries) {
          const rows = await d1Fetch(config, query.sql, query.params)
          out.push(toPositionalRows(rows, query.method))
        }
        return out
      },
      { schema },
    )
  }
  return globalForDb.__dashboardDb
}
