import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"

vi.mock("../lib/d1", () => ({ d1Query: vi.fn(), hasDatabase: vi.fn() }))

import { resolveSubdomain, resolveOrLog } from "../lib/resolve"
import { d1Query, hasDatabase } from "../lib/d1"

const configured = vi.mocked(hasDatabase)
const query = vi.mocked(d1Query)

// The resolver's four dead ends are four different operator problems. They used
// to be one `null`, which is how the first hosted portfolio's 404 came to look
// exactly like a subdomain nobody had claimed.

function respond(body: unknown, status = 200): Response {
  const text = typeof body === "string" ? body : JSON.stringify(body)
  return new Response(text, { status })
}

function stubFetch(res: Response) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(res)
}

const PORTFOLIO_FILE = {
  subdomain: "juan",
  owner: { github: "juandelacruz" },
  portfolio: { template: "bubblegum" },
  records: { CNAME: { value: "portfolio.is-pinoy.dev", proxied: true } },
}

beforeEach(() => {
  // No database configured by default — the override tests opt back in.
  configured.mockReset().mockReturnValue(false)
  query.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("resolveSubdomain", () => {
  it("resolves a claimed portfolio to its owner and config", async () => {
    stubFetch(respond(PORTFOLIO_FILE))
    const result = await resolveSubdomain("juan")

    expect(result).toEqual({
      ok: true,
      value: {
        github: "juandelacruz",
        portfolio: { template: "bubblegum" },
      },
    })
  })

  it("reads the file from the domains repo's main branch", async () => {
    const fetchSpy = stubFetch(respond(PORTFOLIO_FILE))
    await resolveSubdomain("juan")

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains/juan.json",
      expect.anything()
    )
  })

  it("calls a missing file an unknown subdomain", async () => {
    stubFetch(respond("404: Not Found", 404))
    expect(await resolveSubdomain("nobody")).toEqual({
      ok: false,
      reason: "unknown-subdomain",
    })
  })

  // A subdomain pointing at its owner's own host is a perfectly good registry
  // entry — it just isn't ours to render. Distinct from never having existed.
  it("separates a subdomain with no portfolio block from one that is missing", async () => {
    stubFetch(
      respond({
        subdomain: "juan",
        owner: { github: "juandelacruz" },
        records: { CNAME: { value: "juan.vercel.app", proxied: false } },
      })
    )
    expect(await resolveSubdomain("juan")).toEqual({
      ok: false,
      reason: "no-portfolio-block",
    })
  })

  it("reports an unparseable or ownerless file as unreadable", async () => {
    stubFetch(respond("{ not json"))
    expect(await resolveSubdomain("juan")).toEqual({
      ok: false,
      reason: "registry-unreadable",
    })

    vi.restoreAllMocks()
    stubFetch(respond({ subdomain: "juan", portfolio: { template: "grid" } }))
    expect(await resolveSubdomain("juan")).toEqual({
      ok: false,
      reason: "registry-unreadable",
    })
  })

  // GitHub rate-limiting or refusing us is our outage, not an unclaimed name,
  // and it takes every portfolio down at once rather than one.
  it("separates an upstream refusal from a missing file", async () => {
    stubFetch(respond("rate limited", 429))
    expect(await resolveSubdomain("juan")).toEqual({
      ok: false,
      reason: "registry-unreachable",
    })
  })

  it("prefers a saved dashboard override over git's template/theme, keeping git's other fields", async () => {
    stubFetch(
      respond({
        ...PORTFOLIO_FILE,
        portfolio: { template: "bubblegum", sections: ["about", "projects"] },
      })
    )
    configured.mockReturnValue(true)
    query.mockResolvedValue([
      {
        portfolio_override: JSON.stringify({
          template: "terminal",
          theme: "matrix",
        }),
      },
    ])

    const result = await resolveSubdomain("juan")

    expect(result).toEqual({
      ok: true,
      value: {
        github: "juandelacruz",
        portfolio: {
          template: "terminal",
          theme: "matrix",
          sections: ["about", "projects"],
        },
      },
    })
  })

  it("drops git's theme when the override moves to a designer template with none", async () => {
    stubFetch(
      respond({ ...PORTFOLIO_FILE, portfolio: { template: "grid", theme: "matrix" } })
    )
    configured.mockReturnValue(true)
    query.mockResolvedValue([
      { portfolio_override: JSON.stringify({ template: "noir" }) },
    ])

    const result = await resolveSubdomain("juan")

    expect(result).toEqual({
      ok: true,
      value: { github: "juandelacruz", portfolio: { template: "noir" } },
    })
  })

  it("falls back to git's style when there is no override yet", async () => {
    stubFetch(respond(PORTFOLIO_FILE))
    configured.mockReturnValue(true)
    query.mockResolvedValue([{ portfolio_override: null }])

    expect(await resolveSubdomain("juan")).toEqual({
      ok: true,
      value: { github: "juandelacruz", portfolio: { template: "bubblegum" } },
    })
  })

  it("falls back to git's style when the override lookup throws", async () => {
    stubFetch(respond(PORTFOLIO_FILE))
    configured.mockReturnValue(true)
    query.mockRejectedValue(new Error("D1 query failed"))
    const error = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(await resolveSubdomain("juan")).toEqual({
      ok: true,
      value: { github: "juandelacruz", portfolio: { template: "bubblegum" } },
    })
    expect(error).toHaveBeenCalledOnce()
  })

  it("never queries the database for a subdomain with no portfolio block", async () => {
    stubFetch(
      respond({
        subdomain: "juan",
        owner: { github: "juandelacruz" },
        records: { CNAME: { value: "juan.vercel.app", proxied: false } },
      })
    )
    configured.mockReturnValue(true)

    await resolveSubdomain("juan")

    expect(query).not.toHaveBeenCalled()
  })
})

describe("resolveOrLog", () => {
  it("names the reason and the subdomain on one line", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    stubFetch(respond("404: Not Found", 404))

    expect(await resolveOrLog("nobody")).toBeNull()
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]![0]).toBe(
      "[portfolio] miss reason=unknown-subdomain subdomain=nobody"
    )
  })

  it("says nothing when the portfolio resolves", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    stubFetch(respond(PORTFOLIO_FILE))

    expect(await resolveOrLog("juan")).toEqual({
      github: "juandelacruz",
      portfolio: { template: "bubblegum" },
    })
    expect(warn).not.toHaveBeenCalled()
  })
})
