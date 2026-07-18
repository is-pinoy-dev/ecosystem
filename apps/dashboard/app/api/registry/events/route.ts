import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { getDb, hasDatabase } from "@/lib/db"
import { subdomains } from "@/lib/db/schema"

// Called by the domains-repo sync workflow after each Cloudflare sync run.
// The payload is a full snapshot of the registry plus per-domain sync results;
// the handler reconciles the table against it (upsert + delete), so replayed
// or out-of-order deliveries converge on the same state.

const domainSchema = z.object({
  subdomain: z
    .string()
    .min(1)
    .max(63)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/),
  owner: z.object({
    github: z.string().min(1),
    email: z.string().optional(),
  }),
  records: z.record(z.string(), z.unknown()),
  status: z.enum(["synced", "failed", "pending"]).default("synced"),
  error: z.string().nullish(),
})

const payloadSchema = z.object({
  syncedAt: z.iso.datetime().optional(),
  domains: z.array(domainSchema).max(10_000),
})

function isAuthorized(request: Request): boolean {
  const secret = process.env.REGISTRY_SYNC_SECRET
  if (!secret) return false
  const header = request.headers.get("authorization") ?? ""
  const presented = Buffer.from(header.replace(/^Bearer\s+/i, ""))
  const expected = Buffer.from(secret)
  return (
    presented.length === expected.length && timingSafeEqual(presented, expected)
  )
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 })
  }

  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid payload", issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { domains } = parsed.data
  const syncedAt = parsed.data.syncedAt ? new Date(parsed.data.syncedAt) : new Date()

  const db = getDb()
  const counts = await db.transaction(async (tx) => {
    const existing = await tx.select().from(subdomains)
    const existingByName = new Map(existing.map((row) => [row.name, row]))
    const incomingNames = new Set(domains.map((d) => d.subdomain))

    let inserted = 0
    let updated = 0

    for (const domain of domains) {
      const current = existingByName.get(domain.subdomain)
      const syncFields = {
        syncStatus: domain.status,
        lastError: domain.status === "failed" ? (domain.error ?? "unknown error") : null,
        lastSyncedAt: syncedAt,
      }

      if (!current) {
        await tx.insert(subdomains).values({
          name: domain.subdomain,
          ownerGithub: domain.owner.github,
          ownerEmail: domain.owner.email ?? null,
          records: domain.records,
          ...syncFields,
        })
        inserted++
        continue
      }

      const contentChanged =
        current.ownerGithub !== domain.owner.github ||
        (current.ownerEmail ?? undefined) !== domain.owner.email ||
        JSON.stringify(current.records) !== JSON.stringify(domain.records)

      await tx
        .update(subdomains)
        .set({
          ...syncFields,
          // Only bump updatedAt when the record content actually changed —
          // a routine resync of unchanged domains is not an update.
          ...(contentChanged && {
            ownerGithub: domain.owner.github,
            ownerEmail: domain.owner.email ?? null,
            records: domain.records,
            updatedAt: syncedAt,
          }),
        })
        .where(eq(subdomains.name, domain.subdomain))
      if (contentChanged) updated++
    }

    const toDelete = existing.filter((row) => !incomingNames.has(row.name))
    for (const row of toDelete) {
      await tx.delete(subdomains).where(eq(subdomains.name, row.name))
    }

    return { inserted, updated, deleted: toDelete.length, total: domains.length }
  })

  return NextResponse.json({ ok: true, ...counts })
}
