import { describe, it, expect, vi } from "vitest"
import type { D1Database } from "@cloudflare/workers-types"
import {
  readFeaturesOverride,
  saveAuditSnapshot,
  type AuditSnapshot,
} from "../worker/subdomains-db"

/** A D1Database stub carrying just the chain readFeaturesOverride calls. */
function fakeDb(first: () => Promise<unknown>): D1Database {
  return {
    prepare: () => ({
      bind: () => ({ first }),
    }),
  } as unknown as D1Database
}

describe("readFeaturesOverride", () => {
  it("parses a saved override", async () => {
    const db = fakeDb(async () => ({
      features_override: JSON.stringify({ tools: { "site-audit": true } }),
    }))
    await expect(readFeaturesOverride(db, "juan")).resolves.toEqual({
      tools: { "site-audit": true },
    })
  })

  it("returns null when no row exists", async () => {
    const db = fakeDb(async () => null)
    await expect(readFeaturesOverride(db, "juan")).resolves.toBeNull()
  })

  it("returns null when the row has no override saved yet", async () => {
    const db = fakeDb(async () => ({ features_override: null }))
    await expect(readFeaturesOverride(db, "juan")).resolves.toBeNull()
  })

  it("returns null rather than throwing when the query fails", async () => {
    const db = fakeDb(async () => {
      throw new Error("D1 unavailable")
    })
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    await expect(readFeaturesOverride(db, "juan")).resolves.toBeNull()
    expect(warn).toHaveBeenCalledOnce()
  })
})

/** A D1Database stub carrying just the chain saveAuditSnapshot calls. */
function fakeWriteDb(run: (sql: string, params: unknown[]) => Promise<unknown>): D1Database {
  return {
    prepare: (sql: string) => ({
      bind: (...params: unknown[]) => ({ run: () => run(sql, params) }),
    }),
  } as unknown as D1Database
}

const snapshot: AuditSnapshot = {
  url: "https://juan.is-pinoy.dev/",
  seo: { score: 80, fields: [] },
  og: { score: 60, fields: [] },
  psi: null,
  auditedAt: "2026-08-23T12:00:00.000Z",
}

describe("saveAuditSnapshot", () => {
  it("upserts with the subdomain and JSON-encoded categories", async () => {
    const calls: { sql: string; params: unknown[] }[] = []
    const db = fakeWriteDb(async (sql, params) => {
      calls.push({ sql, params })
    })
    await saveAuditSnapshot(db, "juan", snapshot)
    expect(calls).toHaveLength(1)
    expect(calls[0]!.sql).toContain("ON CONFLICT(subdomain) DO UPDATE")
    expect(calls[0]!.params[0]).toBe("juan")
    expect(calls[0]!.params[1]).toBe(snapshot.url)
    expect(calls[0]!.params[2]).toBe(JSON.stringify(snapshot.seo))
    expect(calls[0]!.params[3]).toBe(JSON.stringify(snapshot.og))
    expect(calls[0]!.params[4]).toBeNull()
    expect(calls[0]!.params[5]).toBe(Date.parse(snapshot.auditedAt))
  })

  it("encodes a present psi result rather than leaving it null", async () => {
    const withPsi: AuditSnapshot = {
      ...snapshot,
      psi: { url: snapshot.url, strategy: "mobile", fetchedAt: snapshot.auditedAt, categories: [], vitals: [], opportunities: [] },
    }
    const calls: unknown[][] = []
    const db = fakeWriteDb(async (_sql, params) => {
      calls.push(params)
    })
    await saveAuditSnapshot(db, "juan", withPsi)
    expect(calls[0]![4]).toBe(JSON.stringify(withPsi.psi))
  })

  it("falls back to now() when auditedAt does not parse", async () => {
    const before = Date.now()
    const calls: unknown[][] = []
    const db = fakeWriteDb(async (_sql, params) => {
      calls.push(params)
    })
    await saveAuditSnapshot(db, "juan", { ...snapshot, auditedAt: "not-a-date" })
    const after = Date.now()
    expect(calls[0]![5]).toBeGreaterThanOrEqual(before)
    expect(calls[0]![5]).toBeLessThanOrEqual(after)
  })

  it("does not throw when the write fails", async () => {
    const db = fakeWriteDb(async () => {
      throw new Error("D1 unavailable")
    })
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    await expect(saveAuditSnapshot(db, "juan", snapshot)).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledOnce()
  })
})
