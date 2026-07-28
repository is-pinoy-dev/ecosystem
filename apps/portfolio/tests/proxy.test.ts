import { describe, it, expect } from "vitest"
import { NextRequest } from "next/server"
import proxy from "../proxy"

// `NextResponse.next({ request: { headers } })` doesn't hand the rewritten
// request back directly — it encodes the overrides onto the response as
// `x-middleware-request-<name>`, which is what the page later reads as an
// ordinary request header. Reading them back is the only way to assert on what
// lib/context.ts will actually see.
function subdomainSeenByPage(res: Response): string | null {
  return res.headers.get("x-middleware-request-x-portfolio-subdomain")
}

function run(host: string, headers: Record<string, string> = {}) {
  return proxy(
    new NextRequest("https://ignored.example/", { headers: { host, ...headers } })
  )
}

describe("proxy — Host → subdomain", () => {
  it("extracts the label from a claimed subdomain", () => {
    expect(subdomainSeenByPage(run("juan.is-pinoy.dev"))).toBe("juan")
  })

  it("ignores the port", () => {
    expect(subdomainSeenByPage(run("juan.is-pinoy.dev:3002"))).toBe("juan")
  })

  it("sets no label for the apex or the renderer host", () => {
    for (const host of ["is-pinoy.dev", "portfolio.is-pinoy.dev"]) {
      expect(subdomainSeenByPage(run(host))).toBeNull()
    }
  })

  it("sets no label for a foreign host", () => {
    for (const host of [
      "portfolio.vercel.app",
      "localhost",
      // Suffix match must be on the dotted boundary, not the raw string.
      "evil-is-pinoy.dev",
      "is-pinoy.dev.evil.test",
    ]) {
      expect(subdomainSeenByPage(run(host))).toBeNull()
    }
  })

  it("rejects nested labels", () => {
    expect(subdomainSeenByPage(run("a.b.is-pinoy.dev"))).toBeNull()
  })

  it("rejects reserved names the registry would never let anyone claim", () => {
    for (const host of [
      "www.is-pinoy.dev",
      "dashboard.is-pinoy.dev",
      "docs.is-pinoy.dev",
      "status.is-pinoy.dev",
      "api.is-pinoy.dev",
    ]) {
      expect(subdomainSeenByPage(run(host))).toBeNull()
    }
  })
})

describe("proxy — header spoofing", () => {
  // The renderer answers on hosts with no label of their own
  // (portfolio.is-pinoy.dev, the *.vercel.app URL, localhost). If an inbound
  // `x-portfolio-subdomain` survived on those, anyone could render any
  // subdomain's portfolio on an origin that isn't theirs.
  it("drops a client-supplied header when the Host carries no label", () => {
    const res = run("portfolio.is-pinoy.dev", {
      "x-portfolio-subdomain": "juan",
    })
    expect(subdomainSeenByPage(res)).toBeNull()
  })

  it("does not let a client-supplied header override the real Host", () => {
    const res = run("juan.is-pinoy.dev", {
      "x-portfolio-subdomain": "maria",
    })
    expect(subdomainSeenByPage(res)).toBe("juan")
  })
})
