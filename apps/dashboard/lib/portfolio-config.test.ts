import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({ getDb: vi.fn(), hasDatabase: vi.fn() }))

const { getDb, hasDatabase } = await import("@/lib/db")
const { getPortfolioStyle } = await import("./portfolio-config")

const configured = vi.mocked(hasDatabase)
const db = vi.mocked(getDb)

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

beforeEach(() => {
  // No database configured by default — the override tests opt back in.
  configured.mockReset().mockReturnValue(false)
  db.mockReset()
})

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

  it("prefers a saved dashboard override over the git style, without touching git", async () => {
    configured.mockReturnValue(true)
    db.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () =>
              Promise.resolve([
                { portfolioOverride: { template: "terminal", theme: "matrix" } },
              ]),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof getDb>)
    const fetchSpy = vi.spyOn(globalThis, "fetch")

    await expect(getPortfolioStyle("juandelacruz")).resolves.toEqual({
      template: "terminal",
      theme: "matrix",
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("falls back to the git style when there is no override yet", async () => {
    configured.mockReturnValue(true)
    db.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ portfolioOverride: null }]),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof getDb>)
    respondWith({
      owner: { github: "juandelacruz" },
      portfolio: { template: "noir" },
      records: { CNAME: { value: "portfolio.is-pinoy.dev", proxied: true } },
    })

    await expect(getPortfolioStyle("juandelacruz")).resolves.toEqual({
      template: "noir",
    })
  })

  it("falls back to the git style when the override lookup throws", async () => {
    configured.mockReturnValue(true)
    db.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.reject(new Error("D1 query failed")),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof getDb>)
    const warn = vi.spyOn(console, "error").mockImplementation(() => {})
    respondWith({
      owner: { github: "juandelacruz" },
      portfolio: { template: "noir" },
      records: { CNAME: { value: "portfolio.is-pinoy.dev", proxied: true } },
    })

    await expect(getPortfolioStyle("juandelacruz")).resolves.toEqual({
      template: "noir",
    })
    expect(warn).toHaveBeenCalledOnce()
  })
})
