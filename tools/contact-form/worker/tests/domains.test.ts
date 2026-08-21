import { describe, it, expect, vi, afterEach } from "vitest"
import type { D1Database } from "@cloudflare/workers-types"
import { lookupSubdomain, isToolEnabled, readFeaturesOverride } from "../domains"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("lookupSubdomain", () => {
  it("reads a record it could fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ owner: { github: "juan" } }))),
    )

    const lookup = await lookupSubdomain("juan")
    expect(lookup.status).toBe("found")
  })

  it("reports a 404 as unclaimed, not as an outage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("404: Not Found", { status: 404 })),
    )

    expect((await lookupSubdomain("nobody")).status).toBe("unclaimed")
  })

  it("reports any other refusal as unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limited", { status: 429 })),
    )

    expect((await lookupSubdomain("juan")).status).toBe("unavailable")
  })

  it("reports a thrown fetch as unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network")
      }),
    )

    expect((await lookupSubdomain("juan")).status).toBe("unavailable")
  })

  it("reports an unparseable record as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not json")))

    expect((await lookupSubdomain("juan")).status).toBe("unavailable")
  })

  // Node has no `caches` global — this package's own test run must not throw
  // reaching for one, the same way it must not throw in a real Worker that
  // simply has nothing cached yet.
  it("works with no edge cache available (e.g. this test environment)", async () => {
    expect(typeof caches).toBe("undefined")
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ owner: {} }))),
    )
    const lookup = await lookupSubdomain("juan")
    expect(lookup.status).toBe("found")
  })
})

describe("isToolEnabled", () => {
  it("requires the flag to be exactly true", () => {
    expect(
      isToolEnabled({ features: { tools: { "contact-form": true } } }, "contact-form"),
    ).toBe(true)
    expect(
      isToolEnabled({ features: { tools: {} } }, "contact-form"),
    ).toBe(false)
    expect(isToolEnabled({}, "contact-form")).toBe(false)
  })
})

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
      features_override: JSON.stringify({ tools: { "contact-form": true } }),
    }))
    await expect(readFeaturesOverride(db, "juan")).resolves.toEqual({
      tools: { "contact-form": true },
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
