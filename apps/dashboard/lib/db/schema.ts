import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const SYNC_STATUSES = ["pending", "synced", "failed"] as const
export type SyncStatus = (typeof SYNC_STATUSES)[number]

// Read model of the is-pinoy-dev/domains repo plus the outcome of the last
// Cloudflare sync. Git stays the source of truth — every row here can be
// rebuilt from the repo, so the table is deliberately a single flat snapshot.
//
// Backed by Cloudflare D1 (SQLite): JSON columns are stored as text and
// timestamps as epoch-millisecond integers, both round-tripped by Drizzle so
// the TypeScript shape matches the previous Postgres model exactly.
export const subdomains = sqliteTable(
  "subdomains",
  {
    name: text("name").primaryKey(),
    ownerGithub: text("owner_github").notNull(),
    ownerEmail: text("owner_email"),
    records: text("records", { mode: "json" })
      .notNull()
      .$type<Record<string, unknown>>(),
    syncStatus: text("sync_status", { enum: SYNC_STATUSES })
      .notNull()
      .default("pending"),
    lastError: text("last_error"),
    lastSyncedAt: integer("last_synced_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("subdomains_owner_github_idx").on(table.ownerGithub)],
)

export type SubdomainRow = typeof subdomains.$inferSelect
