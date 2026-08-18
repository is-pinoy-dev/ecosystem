import { describe, it, expect, vi, afterEach } from "vitest"
import {
  lookupSubdomain,
  isHostedPortfolio,
  isToolEnabled,
} from "../src/lib/domains"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("lookupSubdomain", () => {
  it("reads a record it could fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ portfolio: {} })))
    )

    const lookup = await lookupSubdomain("juan")

    expect(lookup.status).toBe("found")
  })

  it("reports a 404 as unclaimed, not as an outage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("404: Not Found", { status: 404 }))
    )

    expect((await lookupSubdomain("nobody")).status).toBe("unclaimed")
  })

  // The distinction the old boolean could not carry: a blip from GitHub used
  // to read exactly like a subdomain that had opted out.
  it("reports any other refusal as unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limited", { status: 429 }))
    )

    expect((await lookupSubdomain("juan")).status).toBe("unavailable")
  })

  it("reports a thrown fetch as unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network")
      })
    )

    expect((await lookupSubdomain("juan")).status).toBe("unavailable")
  })

  it("reports an unparseable record as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not json")))

    expect((await lookupSubdomain("juan")).status).toBe("unavailable")
  })
})

describe("isHostedPortfolio", () => {
  it("is true only for a record carrying a portfolio block", () => {
    expect(isHostedPortfolio({ portfolio: { template: "terminal" } })).toBe(true)
    expect(isHostedPortfolio({ owner: { github: "juan" } })).toBe(false)
  })
})

describe("isToolEnabled", () => {
  it("requires the flag to be exactly true", () => {
    expect(
      isToolEnabled({ features: { tools: { "site-audit": true } } }, "site-audit")
    ).toBe(true)
    expect(isToolEnabled({ features: { tools: {} } }, "site-audit")).toBe(false)
    expect(isToolEnabled({}, "site-audit")).toBe(false)
  })
})
