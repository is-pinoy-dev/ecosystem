import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const SYNC_STATUSES = ["pending", "synced", "failed"] as const
export type SyncStatus = (typeof SYNC_STATUSES)[number]

export const SCREENSHOT_STATUSES = [
  "pending",
  "processing",
  "ready",
  "failed",
] as const
export type ScreenshotStatus = (typeof SCREENSHOT_STATUSES)[number]

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
    // GitHub's numeric account ID (`owner.id` in the record file). Nullable:
    // records written before the field existed don't carry one. Ownership
    // lookups prefer it over the login, which a user can rename out from
    // under us — and which someone else can then claim.
    ownerId: integer("owner_id"),
    ownerEmail: text("owner_email"),
    records: text("records", { mode: "json" })
      .notNull()
      .$type<Record<string, unknown>>(),
    // Opt-in platform tools (`features.tools.*` in the record file). Stored
    // alongside records because the dashboard renders both as one settings
    // surface; still a read model — the repo remains the source of truth.
    features: text("features", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    // Dashboard-owned overrides, layered on top of the git-derived columns
    // above. Unlike `features`/`records`, these are never written by the sync
    // workflow — only by a dashboard save — and stay `null` until someone
    // edits a setting from here instead of by pull request. A `null` value
    // means "no override yet"; readers fall back to the git-derived value.
    featuresOverride: text("features_override", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    portfolioOverride: text("portfolio_override", { mode: "json" }).$type<{
      template: string
      theme?: string
    }>(),
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
    screenshotStatus: text("screenshot_status", {
      enum: SCREENSHOT_STATUSES,
    })
      .notNull()
      .default("pending"),
    screenshotKey: text("screenshot_key"),
    screenshotUrl: text("screenshot_url"),
    screenshotCapturedAt: integer("screenshot_captured_at", {
      mode: "timestamp_ms",
    }),
    screenshotRequestedAt: integer("screenshot_requested_at", {
      mode: "timestamp_ms",
    }),
    screenshotFailureReason: text("screenshot_failure_reason"),
    screenshotRetryCount: integer("screenshot_retry_count")
      .notNull()
      .default(0),
    screenshotVersion: integer("screenshot_version").notNull().default(0),
  },
  (table) => [
    index("subdomains_owner_github_idx").on(table.ownerGithub),
    index("subdomains_owner_id_idx").on(table.ownerId),
    index("subdomains_screenshot_status_idx").on(table.screenshotStatus),
    index("subdomains_screenshot_captured_at_idx").on(
      table.screenshotCapturedAt
    ),
    index("subdomains_screenshot_refresh_eligible_idx").on(
      table.screenshotStatus,
      table.screenshotCapturedAt,
      table.screenshotRequestedAt
    ),
  ]
)

export type SubdomainRow = typeof subdomains.$inferSelect

// Directly-written source of truth for the Contact Form feature's delivery
// address — NOT a git-derived read model like `subdomains` above. One row
// per GitHub account (never per subdomain), written only by the "Verify
// email" action on /account, because Cloudflare Email Routing's own
// destination-address list is account-wide too: a user who owns several
// subdomains has exactly one address to verify, not one per subdomain.
export const contactEmails = sqliteTable("contact_emails", {
  githubId: integer("github_id").primaryKey(),
  githubLogin: text("github_login").notNull(),
  email: text("email").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type ContactEmailRow = typeof contactEmails.$inferSelect
