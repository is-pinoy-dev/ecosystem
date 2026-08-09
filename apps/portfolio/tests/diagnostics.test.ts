import { describe, it, expect, vi, afterEach } from "vitest"
import { fingerprint } from "../lib/diagnostics"

const SECRET = "test-secret"

// tools/portfolio-proxy pins this identical constant over the same input. The
// whole point of the fingerprint is comparing the Worker's `config` line against
// the renderer's, which only means anything while both compute it the same way —
// so each side is locked to a known answer rather than to the other, the two
// packages sharing no dependency to import across.
const FINGERPRINT_OF_SECRET = "9caf06bb"

/** Fresh module: the config line is memoized per cold start by design. */
async function freshDiagnostics() {
  vi.resetModules()
  return import("../lib/diagnostics")
}

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.PORTFOLIO_PROXY_SECRET
  delete process.env.GITHUB_TOKEN
  delete process.env.GH_TOKEN
  delete process.env.PORTFOLIO_ROOT_DOMAIN
})

describe("fingerprint", () => {
  it("matches the tag the Worker computes for the same secret", async () => {
    expect(await fingerprint(SECRET)).toBe(FINGERPRINT_OF_SECRET)
  })

  it("is stable, short, and hex", async () => {
    expect(await fingerprint(SECRET)).toBe(await fingerprint(SECRET))
    expect(await fingerprint(SECRET)).toMatch(/^[0-9a-f]{8}$/)
  })

  // Otherwise two different secrets could tag alike and read as "in sync".
  it("separates values that differ by one character", async () => {
    expect(await fingerprint("secret-a")).not.toBe(await fingerprint("secret-b"))
    expect(await fingerprint(SECRET)).not.toBe(await fingerprint(SECRET + "\n"))
  })

  it("does not carry the value it tags", async () => {
    expect(await fingerprint(SECRET)).not.toContain(SECRET)
  })
})

describe("logConfigOnce", () => {
  it("names the fingerprint, not the secret", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {})
    process.env.PORTFOLIO_PROXY_SECRET = SECRET
    process.env.GITHUB_TOKEN = "ghp_notarealtoken"

    const { logConfigOnce } = await freshDiagnostics()
    await logConfigOnce()

    const line = info.mock.calls[0]![0] as string
    expect(line).toContain("[portfolio] config")
    expect(line).toContain("proxySecret=set")
    expect(line).toContain(`proxySecretFp=${FINGERPRINT_OF_SECRET}`)
    expect(line).not.toContain(SECRET)
    expect(line).not.toContain("ghp_notarealtoken")
  })

  // The two failures this exists to surface: no secret and every claimed
  // portfolio 404s while previews still work; no token and the renderer serves
  // ~20 pages an hour before they all 404 at once.
  it("warns and says MISSING when either is absent", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

    const { logConfigOnce } = await freshDiagnostics()
    await logConfigOnce()

    const line = warn.mock.calls[0]![0] as string
    expect(line).toContain("proxySecret=MISSING")
    expect(line).toContain("githubToken=MISSING")
    // No secret to tag, so no tag — not an empty or bogus one.
    expect(line).not.toContain("proxySecretFp=")
  })

  it("accepts GH_TOKEN as the alias the client honours", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    process.env.GH_TOKEN = "ghp_notarealtoken"

    const { logConfigOnce } = await freshDiagnostics()
    await logConfigOnce()

    expect(warn.mock.calls[0]![0] as string).toContain("githubToken=set")
  })

  it("reports the root domain, marking the unset default as such", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

    const { logConfigOnce } = await freshDiagnostics()
    await logConfigOnce()

    expect(warn.mock.calls[0]![0] as string).toContain(
      "rootDomain=is-pinoy.dev(default)"
    )
  })

  it("stays out of the warning filter when fully configured", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "info").mockImplementation(() => {})
    process.env.PORTFOLIO_PROXY_SECRET = SECRET
    process.env.GITHUB_TOKEN = "ghp_notarealtoken"

    const { logConfigOnce } = await freshDiagnostics()
    await logConfigOnce()

    expect(warn).not.toHaveBeenCalled()
  })

  // getRenderContext awaits this on every request, including concurrent ones.
  it("logs once however many callers race for it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

    const { logConfigOnce } = await freshDiagnostics()
    await Promise.all([logConfigOnce(), logConfigOnce(), logConfigOnce()])
    await logConfigOnce()

    expect(warn).toHaveBeenCalledOnce()
  })
})
