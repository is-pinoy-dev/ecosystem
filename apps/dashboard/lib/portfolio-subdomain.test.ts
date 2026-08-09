import { describe, expect, it } from "vitest"

import {
  portfolioSubdomain,
  portfolioSubdomainFor,
} from "./portfolio-subdomain"

describe("portfolioSubdomain", () => {
  it("is the login, lowercased", () => {
    expect(portfolioSubdomain("JuanDelaCruz")).toBe("juandelacruz")
  })

  it("keeps the hyphens GitHub allows in a login", () => {
    expect(portfolioSubdomain("juan-dela-cruz")).toBe("juan-dela-cruz")
  })
})

describe("portfolioSubdomainFor", () => {
  it("accepts an ordinary GitHub username", () => {
    expect(portfolioSubdomainFor("juan")).toEqual({
      ok: true,
      subdomain: "juan",
    })
  })

  it("rejects a login below the registry's three-character floor", () => {
    // GitHub still honours one- and two-character legacy usernames; the
    // domains repo's schema does not, and "must be at least 3 characters" on a
    // field the claimant cannot edit reads as a bug unless we explain it.
    const result = portfolioSubdomainFor("jd")
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error).toContain("@jd")
  })

  it("rejects a login that isn't a usable DNS label", () => {
    const result = portfolioSubdomainFor("-juan-")
    expect(result.ok).toBe(false)
  })
})
