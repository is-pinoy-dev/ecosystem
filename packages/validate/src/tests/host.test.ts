import { describe, it, expect } from "vitest"
import {
  hostProviderForRecords,
  hostProviderForTarget,
  normalizeHostTarget,
} from "../host.js"

describe("hostProviderForTarget", () => {
  it("matches Vercel's per-project DNS target", () => {
    expect(hostProviderForTarget("9d4debd2682df60d.vercel-dns-017.com.")).toBe(
      "vercel"
    )
  })

  it("matches a bare vercel.app alias", () => {
    expect(hostProviderForTarget("my-site.vercel.app")).toBe("vercel")
  })

  it("matches GitHub Pages", () => {
    expect(hostProviderForTarget("juandelacruz.github.io")).toBe("github")
  })

  it("matches Netlify", () => {
    expect(hostProviderForTarget("my-site.netlify.app")).toBe("netlify")
  })

  it("matches Cloudflare Pages", () => {
    expect(hostProviderForTarget("my-site.pages.dev")).toBe("cloudflare")
  })

  it("matches our own renderer before anything else", () => {
    expect(hostProviderForTarget("portfolio.is-pinoy.dev")).toBe("portfolio")
  })

  it("ignores a trailing dot and casing", () => {
    expect(hostProviderForTarget("Juan.GitHub.IO.")).toBe("github")
  })

  it("returns null for a host it does not know", () => {
    expect(hostProviderForTarget("example.com")).toBeNull()
  })

  it("does not match a lookalike suffix on another domain", () => {
    expect(hostProviderForTarget("notgithub.io")).toBeNull()
    expect(hostProviderForTarget("evil-vercel.app.example.com")).toBeNull()
  })

  // A hostname with a path glued onto it is a malformed CNAME. Identification
  // must not paper over it — the registry entry is what needs fixing.
  it("returns null for a target that is not a bare hostname", () => {
    expect(hostProviderForTarget("juan.github.io./portfolio.")).toBeNull()
  })
})

describe("normalizeHostTarget", () => {
  it("strips surrounding space, one trailing dot, and casing", () => {
    expect(normalizeHostTarget("  Juan.GitHub.IO. ")).toBe("juan.github.io")
  })
})

describe("hostProviderForRecords", () => {
  it("reads the host off a CNAME", () => {
    expect(hostProviderForRecords({ CNAME: { value: "juan.github.io" } })).toBe(
      "github"
    )
  })

  it("handles a bare-string CNAME", () => {
    expect(hostProviderForRecords({ CNAME: "my-site.netlify.app" })).toBe(
      "netlify"
    )
  })

  it("takes the first recognised entry of an array", () => {
    const records = {
      CNAME: [{ value: "unknown.example.com" }, { value: "juan.github.io" }],
    }
    expect(hostProviderForRecords(records)).toBe("github")
  })

  it("returns null for an A record, which identifies no host", () => {
    expect(hostProviderForRecords({ A: { value: "1.2.3.4" } })).toBeNull()
  })

  it("returns null when there is no CNAME at all", () => {
    const records = { TXT: { value: "vc-domain-verify=x", provider: "vercel" } }
    expect(hostProviderForRecords(records)).toBeNull()
  })
})
