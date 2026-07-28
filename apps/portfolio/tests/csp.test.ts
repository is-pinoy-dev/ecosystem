import { describe, expect, it } from "vitest"
import nextConfig, { IMAGE_HOSTS } from "../next.config.mjs"
import { IMG_ALLOW_HOSTS } from "../lib/parse"

// The image allow-list exists in three places that must agree: the sanitizer
// (which strips <img> from other hosts), the CSP (which blocks the request even
// if one slips through), and next/image's remotePatterns (which would otherwise
// refuse to optimize a legitimate badge). Two of those are in next.config.mjs
// and derived from one array; this suite ties that array to the sanitizer's.

async function headerMap(): Promise<Map<string, string>> {
  const routes = await nextConfig.headers!()
  const entries = routes.flatMap((r) =>
    (r.headers as { key: string; value: string }[]).map(
      (h) => [h.key, h.value] as const,
    ),
  )
  return new Map(entries)
}

describe("image allow-list", () => {
  it("is identical in the sanitizer and next.config.mjs", () => {
    expect([...IMAGE_HOSTS].sort()).toEqual([...IMG_ALLOW_HOSTS].sort())
  })

  it("is mirrored by next/image remotePatterns, https only", () => {
    const patterns = nextConfig.images!.remotePatterns as {
      protocol: string
      hostname: string
    }[]
    expect(patterns.map((p) => p.hostname).sort()).toEqual(
      [...IMG_ALLOW_HOSTS].sort(),
    )
    expect(patterns.every((p) => p.protocol === "https")).toBe(true)
  })
})

describe("security headers", () => {
  it("sets a valid Referrer-Policy token", async () => {
    // Regression: the value was `strict-no-referrer-when-downgrade`, which is
    // not a real token — browsers discard the header and use their own default.
    const valid = new Set([
      "no-referrer",
      "no-referrer-when-downgrade",
      "origin",
      "origin-when-cross-origin",
      "same-origin",
      "strict-origin",
      "strict-origin-when-cross-origin",
      "unsafe-url",
    ])
    const policy = (await headerMap()).get("Referrer-Policy")
    expect(policy).toBeDefined()
    for (const token of policy!.split(",")) {
      expect(valid).toContain(token.trim())
    }
  })

  it("confines CSP img-src to the allow-listed hosts", async () => {
    const csp = (await headerMap()).get("Content-Security-Policy")
    expect(csp).toBeDefined()
    const imgSrc = csp!
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith("img-src "))
    expect(imgSrc).toBeDefined()

    const sources = imgSrc!.replace("img-src ", "").split(/\s+/)
    for (const host of IMG_ALLOW_HOSTS) {
      expect(sources).toContain(`https://${host}`)
    }
    // No wildcard or scheme-wide escape hatch that would readmit every host.
    expect(sources).not.toContain("*")
    expect(sources).not.toContain("https:")
    expect(sources).not.toContain("http:")
  })

  it("closes the non-script exits a sanitizer bypass would need", async () => {
    const csp = (await headerMap()).get("Content-Security-Policy")!
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("form-action 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("base-uri 'self'")
  })

  it("does not restrict scripts, which would break hydration", async () => {
    // Intentional: Next emits inline hydration scripts, so a script-src without
    // per-request nonces would break the page. Asserted so nobody adds a
    // half-configured one and ships a blank portfolio.
    const csp = (await headerMap()).get("Content-Security-Policy")!
    expect(csp).not.toContain("default-src")
    expect(csp).not.toContain("script-src")
  })

  it("keeps 'unsafe-inline' in style-src so the page still renders", async () => {
    // Same failure mode as script-src, one layer over: Next emits inline styles
    // and the designer templates use React `style={{}}` attributes, which
    // `style-src-attr` governs — and that falls back to `style-src`. Tightening
    // this without per-request nonces strips the styling off every portfolio,
    // so the directive is deliberately permissive about *inline* CSS.
    const csp = (await headerMap()).get("Content-Security-Policy")!
    const styleSrc = directive(csp, "style-src")
    expect(styleSrc).toBeDefined()
    expect(styleSrc).toContain("'unsafe-inline'")
  })

  it("still denies remote stylesheets and fonts", async () => {
    // What style-src/font-src are actually here for. `'unsafe-inline'` permits
    // an inline <style>, but a stylesheet *fetched* by `@import url(https://…)`
    // resolves against the source list — so this is what stops a reviewed
    // community theme from swapping its contents after approval, and what
    // closes `@font-face { src: url(https://…) }` as an exfiltration beacon.
    const csp = (await headerMap()).get("Content-Security-Policy")!

    for (const name of ["style-src", "font-src"]) {
      const sources = directive(csp, name)!.split(/\s+/).slice(1)
      expect(sources, `${name} must allow 'self'`).toContain("'self'")
      for (const escape of ["*", "https:", "http:", "data:"]) {
        expect(sources, `${name} must not readmit every host`).not.toContain(
          escape,
        )
      }
      // No explicit remote origins either.
      expect(
        sources.filter((s) => s.includes("//")),
        `${name} must not allow remote origins`,
      ).toEqual([])
    }
  })
})

/** Pull one directive out of a CSP header value, or undefined if unset. */
function directive(csp: string, name: string): string | undefined {
  return csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d === name || d.startsWith(`${name} `))
}
