import { describe, it, expect, vi } from "vitest"
import type { D1Database } from "@cloudflare/workers-types"
import { readFeaturesOverride } from "../worker/subdomains-db"

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
