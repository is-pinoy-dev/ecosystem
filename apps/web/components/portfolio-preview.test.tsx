import { describe, expect, it } from "vitest"

import {
  isGitHubLogin,
  normalizeLogin,
  previewUrl,
  type PortfolioDesign,
} from "./portfolio-preview"

const DESIGNER: PortfolioDesign = {
  slug: "phosphor",
  name: "Phosphor",
  description: "CRT glow and shell commands",
  mode: "Dark",
}

const LAYOUT: PortfolioDesign = {
  slug: "terminal",
  name: "Terminal",
  description: "Classic command-line profile",
  mode: "6 palettes",
  theme: "gold-dark",
}

describe("normalizeLogin", () => {
  it("keeps a plain login untouched", () => {
    expect(normalizeLogin("octocat")).toBe("octocat")
  })

  it("accepts what people paste", () => {
    expect(normalizeLogin("  @octocat ")).toBe("octocat")
    expect(normalizeLogin("github.com/octocat")).toBe("octocat")
    expect(normalizeLogin("https://github.com/octocat/")).toBe("octocat")
    expect(normalizeLogin("https://www.github.com/octocat?tab=repos")).toBe(
      "octocat"
    )
  })

  it("keeps the case GitHub displays", () => {
    expect(normalizeLogin("Juan-Dev")).toBe("Juan-Dev")
  })
})

describe("isGitHubLogin", () => {
  it("accepts logins GitHub itself allows", () => {
    expect(isGitHubLogin("octocat")).toBe(true)
    expect(isGitHubLogin("Juan-Dev")).toBe(true)
    expect(isGitHubLogin("a")).toBe(true)
    expect(isGitHubLogin("a".repeat(39))).toBe(true)
  })

  it("rejects everything else", () => {
    expect(isGitHubLogin("")).toBe(false)
    expect(isGitHubLogin("bad name")).toBe(false)
    expect(isGitHubLogin("-leading")).toBe(false)
    expect(isGitHubLogin("trailing-")).toBe(false)
    expect(isGitHubLogin("double--hyphen")).toBe(false)
    expect(isGitHubLogin("a".repeat(40))).toBe(false)
    // A rejected login is what keeps `?github=` free of injected parameters.
    expect(isGitHubLogin("octocat&template=evil")).toBe(false)
  })
})

describe("previewUrl", () => {
  it("sends no theme for a designer template", () => {
    expect(previewUrl("octocat", DESIGNER)).toBe(
      "https://portfolio.is-pinoy.dev/?preview=1&github=octocat&template=phosphor"
    )
  })

  it("sends the palette for a layout template", () => {
    expect(previewUrl("Juan-Dev", LAYOUT)).toBe(
      "https://portfolio.is-pinoy.dev/?preview=1&github=Juan-Dev&template=terminal&theme=gold-dark"
    )
  })
})
