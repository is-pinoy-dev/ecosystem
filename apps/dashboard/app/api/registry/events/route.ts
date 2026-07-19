import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { getDb, hasDatabase } from "@/lib/db"
import { reconcile } from "@/lib/db/reconcile"
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
  // Git-derived dates: first commit that added the file and the last commit
  // touching it. Optional — without them, insert time / syncedAt are used.
  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
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

  // D1's HTTP API has no interactive transactions, so we read the current
  // rows, compute the diff in memory, and apply it as one atomic batch. The
  // payload is a full snapshot, so a partial failure heals on the next sync.
  const existing = await db.select().from(subdomains)
  const { statements, counts } = reconcile(existing, domains, syncedAt)

  const ops = statements.map((stmt) => {
    switch (stmt.type) {
      case "insert":
        return db.insert(subdomains).values(stmt.values)
      case "update":
        return db
          .update(subdomains)
          .set(stmt.set)
          .where(eq(subdomains.name, stmt.name))
      case "delete":
        return db.delete(subdomains).where(eq(subdomains.name, stmt.name))
    }
  })

  if (ops.length > 0) {
    await db.batch(ops as [(typeof ops)[number], ...(typeof ops)[number][]])
  }

  return NextResponse.json({ ok: true, ...counts })
}
