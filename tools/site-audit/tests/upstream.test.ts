import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { upstreamFor, type PortfolioEnv } from "../src/lib/upstream"

const SECRET = "test-secret"

function makeEnv(overrides: Partial<PortfolioEnv> = {}): PortfolioEnv {
  return {
    ROOT_DOMAIN: "is-pinoy.dev",
    RENDERER_HOST: "portfolio.is-pinoy.dev",
    PORTFOLIO_PROXY_SECRET: SECRET,
    ...overrides,
  }
}

/** A domains-repo record with a `portfolio` block — a portfolio we render. */
const HOSTED = JSON.stringify({
  subdomain: "juan",
  owner: { github: "juan" },
  portfolio: { template: "terminal" },
  records: { CNAME: { value: "portfolio.is-pinoy.dev", proxied: true } },
})

/** One without — a CNAME to the owner's own host. */
const SELF_HOSTED = JSON.stringify({
  subdomain: "jappe",
  owner: { github: "bosquejun" },
  records: { CNAME: { value: "9d4debd2682df60d.vercel-dns-017.com.", proxied: true } },
})

let fetchMock: ReturnType<typeof vi.fn>

/** Every lookup answers with `body`, or 404 when null. */
function registryReturns(body: string | null, status = 200) {
  fetchMock = vi.fn(async () =>
    body === null
      ? new Response("404: Not Found", { status: 404 })
      : new Response(body, { status })
  )
  vi.stubGlobal("fetch", fetchMock)
}

beforeEach(() => {
  registryReturns(HOSTED)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("upstreamFor — hosted portfolios", () => {
  it("rewrites onto the renderer and carries the label and secret", async () => {
    const upstream = await upstreamFor(
      new URL("https://juan.is-pinoy.dev/some/path?x=1"),
      makeEnv()
    )

    expect(upstream.rewritten).toBe(true)
    expect(upstream.url.hostname).toBe("portfolio.is-pinoy.dev")
    // Vercel routes on Host alone, so only the hostname may change.
    expect(upstream.url.pathname).toBe("/some/path")
    expect(upstream.url.search).toBe("?x=1")
    expect(upstream.headers["x-portfolio-subdomain"]).toBe("juan")
    expect(upstream.headers["x-portfolio-proxy-secret"]).toBe(SECRET)
  })

  it("resolves the target's own label, not the host serving the tool", async () => {
    await upstreamFor(new URL("https://juan.is-pinoy.dev/"), makeEnv())

    const url = String(fetchMock.mock.calls[0]![0])
    expect(url).toContain("/subdomains/juan.json")
  })
})

describe("upstreamFor — subdomains pointing at their owner's host", () => {
  // The bug this suite exists for: a record with no `portfolio` block was
  // rewritten onto the renderer anyway, which 404s it (`no-portfolio-block`)
  // while the real site serves 200 to every browser.
  it("fetches the target's own address when there is no portfolio block", async () => {
    registryReturns(SELF_HOSTED)

    const upstream = await upstreamFor(
      new URL("https://jappe.is-pinoy.dev/"),
      makeEnv()
    )

    expect(upstream.rewritten).toBe(false)
    expect(upstream.url.hostname).toBe("jappe.is-pinoy.dev")
    expect(upstream.headers).toEqual({})
  })

  it("does not leak the shared secret to an origin we do not render", async () => {
    registryReturns(SELF_HOSTED)

    const upstream = await upstreamFor(
      new URL("https://jappe.is-pinoy.dev/"),
      makeEnv()
    )

    expect(Object.values(upstream.headers)).not.toContain(SECRET)
  })

  it("fetches an unclaimed name as asked rather than asking the renderer", async () => {
    registryReturns(null)

    const upstream = await upstreamFor(
      new URL("https://nobody.is-pinoy.dev/"),
      makeEnv()
    )

    expect(upstream.rewritten).toBe(false)
  })
})

describe("upstreamFor — targets that are never portfolios", () => {
  it("leaves an external site alone without a lookup", async () => {
    const upstream = await upstreamFor(new URL("https://example.com/"), makeEnv())

    expect(upstream.rewritten).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("leaves the apex alone without a lookup", async () => {
    const upstream = await upstreamFor(new URL("https://is-pinoy.dev/"), makeEnv())

    expect(upstream.rewritten).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("leaves the renderer host itself alone", async () => {
    const upstream = await upstreamFor(
      new URL("https://portfolio.is-pinoy.dev/"),
      makeEnv()
    )

    expect(upstream.rewritten).toBe(false)
  })

  it("leaves a nested label alone", async () => {
    const upstream = await upstreamFor(
      new URL("https://a.b.is-pinoy.dev/"),
      makeEnv()
    )

    expect(upstream.rewritten).toBe(false)
  })
})

describe("upstreamFor — unconfigured or unresolvable", () => {
  it("falls back to the plain fetch with no secret configured", async () => {
    const upstream = await upstreamFor(
      new URL("https://juan.is-pinoy.dev/"),
      makeEnv({ PORTFOLIO_PROXY_SECRET: undefined })
    )

    expect(upstream.rewritten).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // With the registry unreachable we cannot tell the two kinds apart. A
  // connection error at the portfolio's real address is an honest failure;
  // a 404 charged to whoever owns the name is not.
  it("fetches the target's own address when the registry is unreachable", async () => {
    registryReturns("", 500)

    const upstream = await upstreamFor(
      new URL("https://juan.is-pinoy.dev/"),
      makeEnv()
    )

    expect(upstream.rewritten).toBe(false)
  })
})
