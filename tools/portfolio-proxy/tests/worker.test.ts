import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import worker, { type Env } from "../worker/index"

const SECRET = "test-secret"

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    ROOT_DOMAIN: "is-pinoy.dev",
    RENDERER_HOST: "portfolio.is-pinoy.dev",
    PORTFOLIO_PROXY_SECRET: SECRET,
    OG: { fetch: vi.fn(async () => new Response("og")) },
    SITE_AUDIT: { fetch: vi.fn(async () => new Response("audit")) },
    ...overrides,
  } as unknown as Env
}

let upstream: ReturnType<typeof vi.fn>

beforeEach(() => {
  upstream = vi.fn(async () => new Response("rendered"))
  vi.stubGlobal("fetch", upstream)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** The Request the worker sent upstream. */
function sentRequest(): Request {
  expect(upstream).toHaveBeenCalledTimes(1)
  return upstream.mock.calls[0]![0] as Request
}

describe("portfolio proxy", () => {
  it("rewrites a claimed subdomain onto the renderer host", async () => {
    await worker.fetch(
      new Request("https://juan.is-pinoy.dev/some/path?x=1"),
      makeEnv()
    )

    const sent = sentRequest()
    const url = new URL(sent.url)
    expect(url.hostname).toBe("portfolio.is-pinoy.dev")
    // Vercel routes on Host alone, so only the hostname may change — the path
    // and query still belong to the visitor's request.
    expect(url.pathname).toBe("/some/path")
    expect(url.search).toBe("?x=1")
  })

  it("carries the label and the shared secret", async () => {
    await worker.fetch(new Request("https://juan.is-pinoy.dev/"), makeEnv())

    const sent = sentRequest()
    expect(sent.headers.get("x-portfolio-subdomain")).toBe("juan")
    expect(sent.headers.get("x-portfolio-proxy-secret")).toBe(SECRET)
  })

  it("overwrites headers a visitor tried to supply", async () => {
    await worker.fetch(
      new Request("https://juan.is-pinoy.dev/", {
        headers: {
          "x-portfolio-subdomain": "maria",
          "x-portfolio-proxy-secret": "guessed",
        },
      }),
      makeEnv()
    )

    const sent = sentRequest()
    expect(sent.headers.get("x-portfolio-subdomain")).toBe("juan")
    expect(sent.headers.get("x-portfolio-proxy-secret")).toBe(SECRET)
  })

  it("keeps the tool endpoints on their own workers", async () => {
    const env = makeEnv()

    const og = await worker.fetch(
      new Request("https://juan.is-pinoy.dev/_tools/og/image"),
      env
    )
    expect(await og.text()).toBe("og")

    const audit = await worker.fetch(
      new Request("https://juan.is-pinoy.dev/_tools/site-audit"),
      env
    )
    expect(await audit.text()).toBe("audit")

    // Neither may reach the renderer — page.tsx's OG card depends on it.
    expect(upstream).not.toHaveBeenCalled()
  })

  it("passes the renderer host straight through rather than looping", async () => {
    await worker.fetch(
      new Request("https://portfolio.is-pinoy.dev/"),
      makeEnv()
    )

    const sent = sentRequest()
    expect(new URL(sent.url).hostname).toBe("portfolio.is-pinoy.dev")
    expect(sent.headers.get("x-portfolio-proxy-secret")).toBeNull()
  })

  it("passes through hosts with no usable label", async () => {
    for (const url of [
      "https://is-pinoy.dev/",
      "https://a.b.is-pinoy.dev/",
      "https://evil-is-pinoy.dev/",
    ]) {
      upstream.mockClear()
      await worker.fetch(new Request(url), makeEnv())
      const sent = sentRequest()
      expect(sent.headers.get("x-portfolio-proxy-secret")).toBeNull()
    }
  })

  it("only forwards labels the registry could actually have claimed", async () => {
    // lib/resolve.ts interpolates the label into a raw.githubusercontent.com
    // path, so the shape is a guarantee this end owes it rather than something
    // to assume from "it came from a hostname".
    upstream.mockClear()
    await worker.fetch(new Request("https://ju_an.is-pinoy.dev/"), makeEnv())
    const sent = sentRequest()
    expect(sent.headers.get("x-portfolio-subdomain")).toBeNull()
  })
})

// The renderer computes this same tag over its own copy of the secret (see
// apps/portfolio/lib/diagnostics.ts) and pins this identical constant in its
// own suite. Comparing the two `config` lines is only meaningful while the two
// implementations agree, so both are locked to a known answer rather than to
// each other — the packages share no dependency.
const FINGERPRINT_OF_SECRET = "9caf06bb"

describe("portfolio proxy — config logging", () => {
  /** Fresh module: the config line is memoized per isolate by design. */
  async function freshWorker() {
    vi.resetModules()
    return (await import("../worker/index")).default
  }

  it("names the secret's fingerprint, not the secret", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    const w = await freshWorker()

    await w.fetch(new Request("https://juan.is-pinoy.dev/"), makeEnv())

    const line = log.mock.calls[0]![0] as string
    expect(line).toContain("[portfolio-proxy] config")
    expect(line).toContain("proxySecret=set")
    expect(line).toContain(`proxySecretFp=${FINGERPRINT_OF_SECRET}`)
    expect(line).not.toContain(SECRET)
  })

  it("logs once per isolate, not once per request", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    const w = await freshWorker()

    for (let i = 0; i < 3; i++) {
      await w.fetch(new Request("https://juan.is-pinoy.dev/"), makeEnv())
    }

    expect(log).toHaveBeenCalledTimes(1)
  })

  // Each of these fails silently in its own way: no secret and the renderer
  // ignores every label we send; no binding and a portfolio's OG card renders
  // the portfolio's own HTML.
  it("warns, and says MISSING, when setup is incomplete", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const w = await freshWorker()

    await w.fetch(
      new Request("https://juan.is-pinoy.dev/"),
      makeEnv({ PORTFOLIO_PROXY_SECRET: undefined, OG: undefined })
    )

    const line = warn.mock.calls[0]![0] as string
    expect(line).toContain("proxySecret=MISSING")
    expect(line).toContain("og=MISSING")
    expect(line).toContain("siteAudit=bound")
    // No secret to tag, so no tag — not an empty or bogus one.
    expect(line).not.toContain("proxySecretFp=")
  })

  it("stays out of the warning filter when fully configured", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "log").mockImplementation(() => {})
    const w = await freshWorker()

    await w.fetch(new Request("https://juan.is-pinoy.dev/"), makeEnv())

    expect(warn).not.toHaveBeenCalled()
  })
})
