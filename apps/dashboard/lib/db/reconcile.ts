import { subdomains, type SubdomainRow, type SyncStatus } from "./schema"

type InsertValues = typeof subdomains.$inferInsert
type UpdateSet = Partial<Omit<InsertValues, "name">>

// One incoming domain from the sync-event payload (already validated upstream).
// Git-derived dates arrive as optional ISO strings.
export interface IncomingDomain {
  subdomain: string
  owner: { github: string; email?: string }
  records: Record<string, unknown>
  status: SyncStatus
  error?: string | null
  createdAt?: string
  updatedAt?: string
}

export type ReconcileStatement =
  | { type: "insert"; values: InsertValues }
  | { type: "update"; name: string; set: UpdateSet }
  | { type: "delete"; name: string }

export interface ReconcileResult {
  statements: ReconcileStatement[]
  counts: { inserted: number; updated: number; deleted: number; total: number }
}

// Pure reconciliation of the current table against a full registry snapshot.
// Produces the insert/update/delete statements to apply (order-independent —
// each row is keyed by its unique name) plus the counts the handler reports.
// Kept free of any database access so it can be unit-tested directly.
export function reconcile(
  existing: SubdomainRow[],
  incoming: IncomingDomain[],
  syncedAt: Date,
): ReconcileResult {
  const existingByName = new Map(existing.map((row) => [row.name, row]))
  const incomingNames = new Set(incoming.map((d) => d.subdomain))

  const statements: ReconcileStatement[] = []
  let inserted = 0
  let updated = 0

  for (const domain of incoming) {
    const current = existingByName.get(domain.subdomain)
    const createdAt = domain.createdAt ? new Date(domain.createdAt) : null
    const contentUpdatedAt = domain.updatedAt ? new Date(domain.updatedAt) : null
    const syncFields = {
      syncStatus: domain.status,
      lastError:
        domain.status === "failed" ? (domain.error ?? "unknown error") : null,
      lastSyncedAt: syncedAt,
    }

    if (!current) {
      statements.push({
        type: "insert",
        values: {
          name: domain.subdomain,
          ownerGithub: domain.owner.github,
          ownerEmail: domain.owner.email ?? null,
          records: domain.records,
          ...syncFields,
          // Prefer git-derived dates so a backfill of an old registry keeps
          // real registration dates instead of the insert time.
          ...(createdAt && { createdAt }),
          ...((contentUpdatedAt ?? createdAt) && {
            updatedAt: contentUpdatedAt ?? createdAt ?? undefined,
          }),
        },
      })
      inserted++
      continue
    }

    const contentChanged =
      current.ownerGithub !== domain.owner.github ||
      (current.ownerEmail ?? undefined) !== domain.owner.email ||
      JSON.stringify(current.records) !== JSON.stringify(domain.records)

    // Payload dates correct rows that were first inserted without git dates
    // (their timestamps are the backfill time, not registration or the last
    // real content change).
    const createdAtDrifted =
      createdAt !== null && current.createdAt.getTime() !== createdAt.getTime()
    const updatedAtDrifted =
      !contentChanged &&
      contentUpdatedAt !== null &&
      current.updatedAt.getTime() !== contentUpdatedAt.getTime()

    statements.push({
      type: "update",
      name: domain.subdomain,
      set: {
        ...syncFields,
        ...(createdAtDrifted && { createdAt: createdAt ?? undefined }),
        ...(updatedAtDrifted && { updatedAt: contentUpdatedAt ?? undefined }),
        // Only bump updatedAt when the record content actually changed — a
        // routine resync of unchanged domains is not an update.
        ...(contentChanged && {
          ownerGithub: domain.owner.github,
          ownerEmail: domain.owner.email ?? null,
          records: domain.records,
          updatedAt: contentUpdatedAt ?? syncedAt,
        }),
      },
    })
    if (contentChanged) updated++
  }

  const toDelete = existing.filter((row) => !incomingNames.has(row.name))
  for (const row of toDelete) {
    statements.push({ type: "delete", name: row.name })
  }

  return {
    statements,
    counts: { inserted, updated, deleted: toDelete.length, total: incoming.length },
  }
}
