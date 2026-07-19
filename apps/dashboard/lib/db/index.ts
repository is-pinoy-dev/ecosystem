import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

export type Db = PostgresJsDatabase<typeof schema>

// Cache the client on globalThis so dev-server hot reloads and route handlers
// share one connection pool instead of opening a new one per import.
const globalForDb = globalThis as unknown as { __dashboardDb?: Db }

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export function getDb(): Db {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set")
  }
  if (!globalForDb.__dashboardDb) {
    // prepare: false keeps the client compatible with transaction-mode
    // poolers (pgbouncer, Supabase pooled URLs, Neon).
    const client = postgres(url, { prepare: false, max: 5 })
    globalForDb.__dashboardDb = drizzle(client, { schema })
  }
  return globalForDb.__dashboardDb
}
