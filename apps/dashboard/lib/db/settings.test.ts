import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({ getDb: vi.fn(), hasDatabase: vi.fn() }))

const { getDb, hasDatabase } = await import("@/lib/db")
const { writeFeaturesOverride, writePortfolioOverride } = await import(
  "./settings"
)

const configured = vi.mocked(hasDatabase)
const db = vi.mocked(getDb)

beforeEach(() => {
  configured.mockReset()
  db.mockReset()
})

function mockUpdate(run: () => Promise<unknown>) {
  db.mockReturnValue({
    update: () => ({
      set: () => ({
        where: run,
      }),
    }),
  } as unknown as ReturnType<typeof getDb>)
}

describe("writeFeaturesOverride", () => {
  it("fails without touching the database when none is configured", async () => {
    configured.mockReturnValue(false)
    const result = await writeFeaturesOverride("juan", { analytics: false })
    expect(result).toEqual({
      ok: false,
      error: "Feature settings need the database, which is not configured.",
    })
    expect(db).not.toHaveBeenCalled()
  })

  it("writes the override and reports success", async () => {
    configured.mockReturnValue(true)
    mockUpdate(() => Promise.resolve())
    const result = await writeFeaturesOverride("juan", { analytics: false })
    expect(result).toEqual({ ok: true })
  })

  it("reports a friendly error when the write throws", async () => {
    configured.mockReturnValue(true)
    mockUpdate(() => Promise.reject(new Error("D1 query failed")))
    const warn = vi.spyOn(console, "error").mockImplementation(() => {})
    const result = await writeFeaturesOverride("juan", { analytics: false })
    expect(result).toEqual({ ok: false, error: "Could not save. Please try again." })
    expect(warn).toHaveBeenCalledOnce()
  })
})

describe("writePortfolioOverride", () => {
  it("fails without touching the database when none is configured", async () => {
    configured.mockReturnValue(false)
    const result = await writePortfolioOverride("juan", { template: "noir" })
    expect(result).toEqual({
      ok: false,
      error: "Portfolio style needs the database, which is not configured.",
    })
    expect(db).not.toHaveBeenCalled()
  })

  it("writes the override and reports success", async () => {
    configured.mockReturnValue(true)
    mockUpdate(() => Promise.resolve())
    const result = await writePortfolioOverride("juan", {
      template: "terminal",
      theme: "matrix",
    })
    expect(result).toEqual({ ok: true })
  })

  it("reports a friendly error when the write throws", async () => {
    configured.mockReturnValue(true)
    mockUpdate(() => Promise.reject(new Error("D1 query failed")))
    const warn = vi.spyOn(console, "error").mockImplementation(() => {})
    const result = await writePortfolioOverride("juan", { template: "noir" })
    expect(result).toEqual({ ok: false, error: "Could not save. Please try again." })
    expect(warn).toHaveBeenCalledOnce()
  })
})
