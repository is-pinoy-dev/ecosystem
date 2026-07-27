import { describe, expect, it } from "vitest"

import { providerForRecords, providerForTarget, PROVIDERS } from "./providers"

describe("providerForTarget", () => {
  it("matches Vercel's per-project DNS target", () => {
    expect(providerForTarget("9d4debd2682df60d.vercel-dns-017.com.")?.id).toBe(
      "vercel"
    )
  })

  it("matches a bare vercel.app alias", () => {
    expect(providerForTarget("my-site.vercel.app")?.id).toBe("vercel")
  })

  it("matches GitHub Pages", () => {
    expect(providerForTarget("juandelacruz.github.io")?.id).toBe("github")
  })

  it("matches Netlify", () => {
    expect(providerForTarget("my-site.netlify.app")?.id).toBe("netlify")
  })

  it("matches Cloudflare Pages", () => {
    expect(providerForTarget("my-site.pages.dev")?.id).toBe("cloudflare")
  })

  it("matches our own hosted portfolio before anything else", () => {
    expect(providerForTarget("portfolio.is-pinoy.dev")?.id).toBe("portfolio")
  })

  it("ignores a trailing dot and casing", () => {
    expect(providerForTarget("Juan.GitHub.IO.")?.id).toBe("github")
  })

  it("returns null for a host it does not know", () => {
    expect(providerForTarget("example.com")).toBeNull()
  })

  it("does not match a lookalike suffix on another domain", () => {
    expect(providerForTarget("notgithub.io")).toBeNull()
    expect(providerForTarget("evil-vercel.app.example.com")).toBeNull()
  })
})

describe("providerForRecords", () => {
  it("reads the provider off a CNAME", () => {
    const records = { CNAME: { value: "juan.github.io" } }
    expect(providerForRecords(records)?.name).toBe(PROVIDERS.github.name)
  })

  it("handles a bare-string CNAME", () => {
    expect(providerForRecords({ CNAME: "my-site.netlify.app" })?.id).toBe(
      "netlify"
    )
  })

  it("takes the first recognised entry of an array", () => {
    const records = {
      CNAME: [{ value: "unknown.example.com" }, { value: "juan.github.io" }],
    }
    expect(providerForRecords(records)?.id).toBe("github")
  })

  it("returns null for an A record, which identifies no host", () => {
    expect(providerForRecords({ A: { value: "1.2.3.4" } })).toBeNull()
  })

  it("returns null when there is no CNAME at all", () => {
    const records = { TXT: { value: "vc-domain-verify=x", provider: "vercel" } }
    expect(providerForRecords(records)).toBeNull()
  })
})
