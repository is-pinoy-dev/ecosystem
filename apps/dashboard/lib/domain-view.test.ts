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
})
