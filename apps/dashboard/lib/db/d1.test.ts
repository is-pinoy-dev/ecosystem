import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { D1QueryError, d1Query, resetD1Breaker } from "./d1"
import { readEnv, resetCleanedEnvVars } from "./env"

const CONFIG = {
  accountId: "0123456789abcdef0123456789abcdef",
  databaseId: "f0b338c1-b5d4-48db-8b42-0435a24ef430",
  token: "cf-token",
}

function respond(
  status: number,
  body: unknown,
  init?: { text?: string }
): void {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(init?.text ?? JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  )
}

/** Cloudflare's answer to a token it will not accept. */
function authError(): void {
  respond(400, {
    success: false,
    errors: [{ code: 10000, message: "Authentication error" }],
  })
}

beforeEach(() => {
  resetD1Breaker()
  resetCleanedEnvVars()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => vi.restoreAllMocks())

describe("d1Query", () => {
  it("returns the first statement's rows", async () => {
    respond(200, {
      success: true,
      result: [{ results: [{ name: "juan" }], success: true }],
    })
    await expect(
      d1Query(CONFIG, "SELECT name FROM subdomains", [])
    ).resolves.toEqual([{ name: "juan" }])
  })

  it("returns no rows for a statement that produced none", async () => {
    respond(200, { success: true, result: [{ results: [], success: true }] })
    await expect(d1Query(CONFIG, "SELECT 1", [])).resolves.toEqual([])
  })

  // "Authentication error" is all Cloudflare says, for a revoked token, a
  // token from another account and a missing D1 permission alike. Whatever
  // reaches the log has to carry the rest.
  it("explains a rejected credential rather than repeating Cloudflare", async () => {
    authError()
    const error = await d1Query(CONFIG, "SELECT 1", []).catch((e) => e)

    expect(error).toBeInstanceOf(D1QueryError)
    expect(error.kind).toBe("credentials")
    expect(error.status).toBe(400)
    expect(error.code).toBe(10000)
    expect(error.message).toContain("Authentication error")
    expect(error.message).toContain("Cloudflare code 10000")
    expect(error.message).toContain("CLOUDFLARE_D1_API_TOKEN")
    expect(error.message).toContain("Account → D1 → Edit")
    // Masked, not whole: both ends are what you compare against the dashboard.
    expect(error.message).toContain("0123…cdef")
    expect(error.message).not.toContain(CONFIG.accountId)
    expect(error.message).not.toContain(CONFIG.token)
  })

  it("names a variable that arrived with whitespace as a likely cause", async () => {
    const before = process.env.CLOUDFLARE_D1_API_TOKEN
    process.env.CLOUDFLARE_D1_API_TOKEN = " padded "
    readEnv("CLOUDFLARE_D1_API_TOKEN")
    if (before === undefined) delete process.env.CLOUDFLARE_D1_API_TOKEN
    else process.env.CLOUDFLARE_D1_API_TOKEN = before

    authError()
    const error = await d1Query(CONFIG, "SELECT 1", []).catch((e) => e)
    expect(error.message).toContain(
      "CLOUDFLARE_D1_API_TOKEN arrived with surrounding whitespace or quotes"
    )
  })

  it("blames the identifiers, not the token, when the route does not resolve", async () => {
    respond(404, {
      success: false,
      errors: [{ code: 7003, message: "Could not route to /d1/database" }],
    })
    const error = await d1Query(CONFIG, "SELECT 1", []).catch((e) => e)

    expect(error.kind).toBe("target")
    expect(error.message).toContain("CLOUDFLARE_D1_DATABASE_ID")
  })

  // /domains renders per request. Without the cool-off, every view pays a full
  // round trip to Cloudflare to be told the same thing before falling back to
  // GitHub, and writes the same stack trace again.
  it("stops calling Cloudflare while a credential is known to be rejected", async () => {
    authError()
    const first = await d1Query(CONFIG, "SELECT 1", []).catch((e) => e)
    const second = await d1Query(CONFIG, "SELECT 2", []).catch((e) => e)

    expect(globalThis.fetch).toHaveBeenCalledOnce()
    expect(second).toBe(first)
    // Logged once per cool-off, not once per query.
    expect(console.error).toHaveBeenCalledOnce()
  })

  it("retries once the cool-off has passed", async () => {
    authError()
    await d1Query(CONFIG, "SELECT 1", []).catch(() => {})
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 31_000)
    try {
      await d1Query(CONFIG, "SELECT 1", []).catch(() => {})
      expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  // A rejected statement is the caller's bug, not a broken credential, and
  // must not take the connection out for every other query behind it.
  it("does not cool off after a query error", async () => {
    respond(500, {
      success: false,
      errors: [{ code: 7500, message: "no such table: nope" }],
    })
    const error = await d1Query(CONFIG, "SELECT * FROM nope", []).catch(
      (e) => e
    )
    expect(error.kind).toBe("query")

    await d1Query(CONFIG, "SELECT * FROM nope", []).catch(() => {})
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  it("reports the status when the response is not JSON at all", async () => {
    respond(502, null, { text: "<html>bad gateway</html>" })
    const error = await d1Query(CONFIG, "SELECT 1", []).catch((e) => e)
    expect(error.message).toContain("HTTP 502")
  })

  it("marks a request that never got an answer as a network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fetch failed"))
    const error = await d1Query(CONFIG, "SELECT 1", []).catch((e) => e)
    expect(error.kind).toBe("network")
    expect(error.message).toContain("fetch failed")
  })
})
