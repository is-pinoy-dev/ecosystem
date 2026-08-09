import { describe, expect, it } from "vitest"

import { primaryRouteFor, toDomainView } from "./domain-view"

describe("toDomainView", () => {
  it("builds the public, source, and edit URLs for a domain", () => {
    const view = toDomainView({
      subdomain: "juan",
      owner: { github: "juandelacruz" },
      records: { CNAME: "juandelacruz.github.io" },
    })

    expect(view.siteUrl).toBe("https://juan.is-pinoy.dev")
    expect(view.recordUrl).toBe(
      "https://github.com/is-pinoy-dev/domains/blob/main/subdomains/juan.json"
    )
    expect(view.recordEditUrl).toBe(
      "https://github.com/is-pinoy-dev/domains/edit/main/subdomains/juan.json"
    )
  })

  it("prefers a CNAME when summarizing DNS routing", () => {
    const view = toDomainView({
      subdomain: "juan",
      owner: { github: "juandelacruz" },
      records: {
        A: { value: "192.0.2.1" },
        CNAME: { value: "juandelacruz.github.io" },
        TXT: { value: "verification", provider: "vercel" },
      },
    })

    expect(primaryRouteFor(view)).toMatchObject({
      type: "CNAME",
      value: "juandelacruz.github.io",
    })
  })

  it("builds intent-specific links for each platform tool", () => {
    const view = toDomainView({
      subdomain: "juan",
      owner: { github: "juandelacruz" },
      records: {
        CNAME: { value: "cname.vercel-dns.com", proxied: true },
      },
      features: { tools: { "site-audit": true }, analytics: true },
    })

    const siteAudit = view.platform?.features.find(
      (feature) => feature.id === "site-audit"
    )
    const analytics = view.platform?.features.find(
      (feature) => feature.id === "analytics"
    )
    const og = view.platform?.builtins.find((feature) => feature.id === "og")

    expect(siteAudit?.links).toEqual([
      {
        label: "Open Site Audit",
        url: "https://juan.is-pinoy.dev/_tools/site-audit",
        kind: "tool",
      },
      {
        label: "View docs",
        url: "https://docs.is-pinoy.dev/tools/site-audit",
        kind: "resource",
      },
    ])
    expect(analytics?.links).toEqual([
      {
        label: "Privacy policy",
        url: "https://is-pinoy.dev/privacy",
        kind: "resource",
      },
    ])
    expect(og?.links).toEqual([
      {
        label: "Open OG tool",
        url: "https://juan.is-pinoy.dev/_tools/og",
        kind: "tool",
      },
      {
        label: "View docs",
        url: "https://docs.is-pinoy.dev/tools",
        kind: "resource",
      },
    ])
  })
})
