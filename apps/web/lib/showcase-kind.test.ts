import { describe, expect, it } from "vitest"

import { showcaseKind, showcaseKindLabel } from "./showcase-kind"

describe("showcaseKind", () => {
  it("reads the portfolio block before anything else", () => {
    expect(
      showcaseKind({
        portfolio: { template: "terminal" },
        records: { CNAME: { value: "portfolio.is-pinoy.dev" } },
      })
    ).toBe("github-profile")
  })

  // A claim is written to the registry before sync writes the DNS record, so
  // the block has to be enough on its own.
  it("labels a fresh claim whose DNS has not been synced yet", () => {
    expect(
      showcaseKind({ portfolio: { template: "minimal" }, records: {} })
    ).toBe("github-profile")
  })

  it("recognises the renderer target without a portfolio block", () => {
    expect(
      showcaseKind({ records: { CNAME: { value: "portfolio.is-pinoy.dev" } } })
    ).toBe("github-profile")
  })

  it("treats every self-hosted site as a portfolio, whoever hosts it", () => {
    for (const value of [
      "ninochung.github.io",
      "9d4debd2682df60d.vercel-dns-017.com.",
      "jltc.netlify.app.",
      "lazuee.pages.dev.",
      "cname.example.com",
    ]) {
      expect(showcaseKind({ records: { CNAME: { value } } })).toBe("portfolio")
    }
  })

  // `wingedge` in the live registry. An IP identifies no host, and the card
  // must fall back rather than claim one.
  it("falls back for an A record, which identifies nothing", () => {
    expect(showcaseKind({ records: { A: { value: "1.2.3.4" } } })).toBe(
      "portfolio"
    )
  })

  it("does not treat a destroyed portfolio's block as absent", () => {
    // Filtering destroyed entries is the loader's job; classification only
    // reports what the record says.
    expect(
      showcaseKind({ portfolio: { template: "bubblegum" }, records: {} })
    ).toBe("github-profile")
  })
})

describe("showcaseKindLabel", () => {
  it("gives each kind its card label", () => {
    expect(showcaseKindLabel({ portfolio: {}, records: {} })).toBe(
      "GitHub Profile"
    )
    expect(
      showcaseKindLabel({ records: { CNAME: { value: "juan.github.io" } } })
    ).toBe("Portfolio")
    expect(
      showcaseKindLabel({ records: { CNAME: { value: "juan.vercel.app" } } })
    ).toBe("Portfolio")
  })
})
