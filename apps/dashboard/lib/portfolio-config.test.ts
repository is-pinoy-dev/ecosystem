import { afterEach, describe, expect, it, vi } from "vitest"

import { getPortfolioStyle } from "./portfolio-config"

function respondWith(body: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 404,
      json: async () => body,
    })
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("getPortfolioStyle", () => {
  it("reads the template and palette off the record", async () => {
    respondWith({
      owner: { github: "juandelacruz" },
      portfolio: { template: "terminal", theme: "matrix" },
      records: { CNAME: { value: "portfolio.is-pinoy.dev", proxied: true } },
    })
    await expect(getPortfolioStyle("juandelacruz")).resolves.toEqual({
      template: "terminal",
      theme: "matrix",
    })
  })

  it("omits the palette a designer design does not carry", async () => {
    respondWith({
      owner: { github: "juandelacruz" },
      portfolio: { template: "noir" },
      records: { CNAME: { value: "portfolio.is-pinoy.dev", proxied: true } },
    })
    await expect(getPortfolioStyle("juandelacruz")).resolves.toEqual({
      template: "noir",
    })
  })

  it("returns null for a record with no portfolio block", async () => {
    respondWith({
      owner: { github: "juandelacruz" },
      records: { CNAME: { value: "juan.github.io" } },
    })
    await expect(getPortfolioStyle("juandelacruz")).resolves.toBeNull()
  })

  it("returns null for a portfolio block the schema rejects", async () => {
    respondWith({
      owner: { github: "juandelacruz" },
      portfolio: { template: "not-a-template" },
    })
    await expect(getPortfolioStyle("juandelacruz")).resolves.toBeNull()
  })

  it("returns null when the record does not exist", async () => {
    respondWith({}, false)
    await expect(getPortfolioStyle("nobody")).resolves.toBeNull()
  })

  it("returns null when the registry read throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    await expect(getPortfolioStyle("juandelacruz")).resolves.toBeNull()
  })
})
