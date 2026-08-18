import { describe, it, expect, vi, afterEach } from "vitest"
import { lookupSubdomain, isToolEnabled } from "../domains"

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
