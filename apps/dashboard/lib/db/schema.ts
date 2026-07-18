import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const SYNC_STATUSES = ["pending", "synced", "failed"] as const
export type SyncStatus = (typeof SYNC_STATUSES)[number]

// Read model of the is-pinoy-dev/domains repo plus the outcome of the last
// Cloudflare sync. Git stays the source of truth — every row here can be
// rebuilt from the repo, so the table is deliberately a single flat snapshot.
export const subdomains = pgTable(
  "subdomains",
  {
    name: text("name").primaryKey(),
    ownerGithub: text("owner_github").notNull(),
    ownerEmail: text("owner_email"),
    records: jsonb("records").notNull().$type<Record<string, unknown>>(),
    syncStatus: text("sync_status", { enum: SYNC_STATUSES })
      .notNull()
      .default("pending"),
    lastError: text("last_error"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("subdomains_owner_github_idx").on(table.ownerGithub)],
)

export type SubdomainRow = typeof subdomains.$inferSelect
