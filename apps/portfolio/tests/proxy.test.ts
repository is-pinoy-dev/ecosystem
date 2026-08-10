import { describe, it, expect, afterEach } from "vitest"
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

function verdict(res: Response): string | null {
  return res.headers.get("x-portfolio-route")
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

describe("proxy — the Worker's label", () => {
  const SECRET = "shared-with-the-worker"

  afterEach(() => {
    delete process.env.PORTFOLIO_PROXY_SECRET
  })

  // A proxied request arrives on this host, so Host carries no label of its own
  // and the Worker supplies it — see tools/portfolio-proxy.
  function proxied(headers: Record<string, string>) {
    return subdomainSeenByPage(run("portfolio.is-pinoy.dev", headers))
  }

  it("accepts the label when the secret matches", () => {
    process.env.PORTFOLIO_PROXY_SECRET = SECRET
    expect(
      proxied({
        "x-portfolio-subdomain": "juan",
        "x-portfolio-proxy-secret": SECRET,
      })
    ).toBe("juan")
  })

  it("rejects a wrong, absent, or truncated secret", () => {
    process.env.PORTFOLIO_PROXY_SECRET = SECRET
    for (const secret of [undefined, "", "wrong", SECRET.slice(0, -1), SECRET + "x"]) {
      expect(
        proxied({
          "x-portfolio-subdomain": "juan",
          ...(secret === undefined ? {} : { "x-portfolio-proxy-secret": secret }),
        })
      ).toBeNull()
    }
  })

  it("honours nothing when no secret is configured", () => {
    // No Worker deployed — the header is just an anonymous request header.
    expect(
      proxied({
        "x-portfolio-subdomain": "juan",
        "x-portfolio-proxy-secret": SECRET,
      })
    ).toBeNull()
  })

  it("rejects a label that could escape the resolver's fetch path", () => {
    process.env.PORTFOLIO_PROXY_SECRET = SECRET
    for (const label of ["../../etc/passwd", "juan/../maria", "JUAN", "ju_an", ""]) {
      expect(
        proxied({
          "x-portfolio-subdomain": label,
          "x-portfolio-proxy-secret": SECRET,
        })
      ).toBeNull()
    }
  })

  it("never forwards the secret header to the page", () => {
    process.env.PORTFOLIO_PROXY_SECRET = SECRET
    const res = run("portfolio.is-pinoy.dev", {
      "x-portfolio-subdomain": "juan",
      "x-portfolio-proxy-secret": SECRET,
    })
    expect(
      res.headers.get("x-middleware-request-x-portfolio-proxy-secret")
    ).toBeNull()
  })
})

// Every one of these ends in the same 404 page. The header is the only thing
// that says which of them happened, so an operator holding a 404 can tell a
// stale Vercel env var from a name nobody claimed without opening a dashboard.
describe("proxy — the x-portfolio-route verdict", () => {
  const SECRET = "shared-with-the-worker"

  afterEach(() => {
    delete process.env.PORTFOLIO_PROXY_SECRET
  })

  it("reports a Host-derived label", () => {
    expect(verdict(run("juan.is-pinoy.dev"))).toBe("host")
  })

  it("reports an accepted Worker label", () => {
    process.env.PORTFOLIO_PROXY_SECRET = SECRET
    const res = run("portfolio.is-pinoy.dev", {
      "x-portfolio-subdomain": "juan",
      "x-portfolio-proxy-secret": SECRET,
    })
    expect(verdict(res)).toBe("worker")
  })

  // The reported failure: the Worker forwards correctly, the renderer has no
  // secret, and the portfolio 404s. Vercel binds env vars to a deployment, so
  // this is what "set the var but never redeployed" looks like from outside.
  it("distinguishes a deployment with no secret from a wrong one", () => {
    const proxied = () =>
      run("portfolio.is-pinoy.dev", {
        "x-portfolio-subdomain": "juan",
        "x-portfolio-proxy-secret": SECRET,
      })

    expect(verdict(proxied())).toBe("no-secret")

    process.env.PORTFOLIO_PROXY_SECRET = SECRET + "-rotated"
    expect(verdict(proxied())).toBe("secret-mismatch")
  })

  // The usual cause of a mismatch, called out in tools/portfolio-proxy/README:
  // a value pasted into Vercel with a trailing newline. It can only bite from
  // this side — a newline in the *Worker's* copy rides in a header value, and
  // HTTP normalization trims it back off before we ever compare.
  it("reports a trailing newline in the stored secret as a mismatch", () => {
    process.env.PORTFOLIO_PROXY_SECRET = SECRET + "\n"
    const res = run("portfolio.is-pinoy.dev", {
      "x-portfolio-subdomain": "juan",
      "x-portfolio-proxy-secret": SECRET,
    })
    expect(verdict(res)).toBe("secret-mismatch")
    expect(subdomainSeenByPage(res)).toBeNull()
  })

  it("reports a malformed label separately from a bad secret", () => {
    process.env.PORTFOLIO_PROXY_SECRET = SECRET
    const res = run("portfolio.is-pinoy.dev", {
      "x-portfolio-subdomain": "../../etc/passwd",
      "x-portfolio-proxy-secret": SECRET,
    })
    expect(verdict(res)).toBe("bad-label")
    expect(subdomainSeenByPage(res)).toBeNull()
  })

  // An apex hit or a `?preview=1` render is not a misconfigured proxy, and
  // shouldn't read like one when someone greps for these.
  it("does not call an ordinary unproxied request a failure", () => {
    for (const host of ["is-pinoy.dev", "portfolio.is-pinoy.dev", "localhost"]) {
      expect(verdict(run(host))).toBe("unlabelled")
    }
    process.env.PORTFOLIO_PROXY_SECRET = SECRET
    expect(verdict(run("portfolio.is-pinoy.dev"))).toBe("unlabelled")
  })
})

// robots.txt, the sitemap and the manifest carry no <meta robots> of their own,
// so the header is the only indexing signal on them. It has to reach the same
// verdict app/page.tsx does, or a preview gets crawled on our host.
describe("proxy — X-Robots-Tag", () => {
  const SECRET = "shared-with-the-worker"

  afterEach(() => {
    delete process.env.PORTFOLIO_PROXY_SECRET
  })

  function robots(res: Response): string | null {
    return res.headers.get("x-robots-tag")
  }

  it("lets a claimed portfolio be indexed in full", () => {
    const res = run("juan.is-pinoy.dev")
    expect(robots(res)).toContain("index")
    expect(robots(res)).not.toContain("noindex")
    expect(robots(res)).toContain("max-image-preview:large")
  })

  it("applies to a label the Worker carried, not just a Host label", () => {
    process.env.PORTFOLIO_PROXY_SECRET = SECRET
    const res = run("portfolio.is-pinoy.dev", {
      "x-portfolio-subdomain": "juan",
      "x-portfolio-proxy-secret": SECRET,
    })
    expect(robots(res)).not.toContain("noindex")
  })

  // A `?preview=` renders an arbitrary GitHub login on the renderer host — the
  // same content at an address that isn't its home.
  it("keeps every unlabelled host out of the index", () => {
    for (const host of [
      "is-pinoy.dev",
      "portfolio.is-pinoy.dev",
      "portfolio.vercel.app",
      "localhost",
    ]) {
      expect(robots(run(host)), host).toBe("noindex, nofollow")
    }
  })

  it("keeps a spoofed label out of the index along with its label", () => {
    process.env.PORTFOLIO_PROXY_SECRET = SECRET
    const res = run("portfolio.is-pinoy.dev", {
      "x-portfolio-subdomain": "juan",
      "x-portfolio-proxy-secret": "wrong",
    })
    expect(subdomainSeenByPage(res)).toBeNull()
    expect(robots(res)).toBe("noindex, nofollow")
  })
})
