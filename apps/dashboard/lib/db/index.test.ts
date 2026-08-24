import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ACCOUNT = "0123456789abcdef0123456789abcdef"
const DATABASE = "f0b338c1-b5d4-48db-8b42-0435a24ef430"

/**
 * The shape warning is deliberately once per process, so each case needs a
 * fresh module registry rather than a reset.
 */
async function loadDb() {
  vi.resetModules()
  return import("./index")
}

beforeEach(() => {
  process.env.CLOUDFLARE_ACCOUNT_ID = ACCOUNT
  process.env.CLOUDFLARE_D1_DATABASE_ID = DATABASE
  process.env.CLOUDFLARE_D1_API_TOKEN = "cf-token"
})

afterEach(() => {
  delete process.env.CLOUDFLARE_ACCOUNT_ID
  delete process.env.CLOUDFLARE_D1_DATABASE_ID
  delete process.env.CLOUDFLARE_D1_API_TOKEN
  delete (globalThis as { __dashboardDb?: unknown }).__dashboardDb
  vi.restoreAllMocks()
})

describe("hasDatabase", () => {
  it("is true only with all three values", async () => {
    const { hasDatabase } = await loadDb()
    expect(hasDatabase()).toBe(true)
    delete process.env.CLOUDFLARE_D1_API_TOKEN
    expect(hasDatabase()).toBe(false)
  })

  // A variable set to a newline is how a cleared secret often looks. Reading
  // it as unset takes the documented GitHub fallback instead of spending a
  // round trip to be told the token is invalid.
  it("treats an all-whitespace value as unset", async () => {
    const { hasDatabase } = await loadDb()
    process.env.CLOUDFLARE_D1_API_TOKEN = "\n"
    expect(hasDatabase()).toBe(false)
  })

  it("accepts a value stored with quotes around it", async () => {
    const { hasDatabase } = await loadDb()
    process.env.CLOUDFLARE_D1_DATABASE_ID = `"${DATABASE}"`
    expect(hasDatabase()).toBe(true)
  })
})

describe("getDb", () => {
  it("says nothing when both identifiers have the shape Cloudflare uses", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { getDb } = await loadDb()
    getDb()
    expect(warn).not.toHaveBeenCalled()
  })

  // Cloudflare answers a mistyped identifier with the same "Authentication
  // error" it gives a bad token, so a wrong account id reads as a credential
  // problem for as long as nobody looks at the value itself.
  it("warns once about an identifier that cannot be right", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "my-account"
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { getDb } = await loadDb()

    getDb()
    delete (globalThis as { __dashboardDb?: unknown }).__dashboardDb
    getDb()

    expect(warn).toHaveBeenCalledOnce()
    expect(String(warn.mock.calls[0]![0])).toContain("CLOUDFLARE_ACCOUNT_ID")
  })

  it("refuses to build a client with a value missing", async () => {
    delete process.env.CLOUDFLARE_D1_DATABASE_ID
    const { getDb } = await loadDb()
    expect(() => getDb()).toThrow("D1 is not configured")
  })
})
