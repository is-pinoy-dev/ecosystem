import { describe, expect, it } from "vitest"
import { renderReadme, slugifyHeading } from "../lib/parse"

// `portfolio.sections` in a subdomain's JSON is an allow-list of README heading
// slugs plus a render order. These tests pin the slug rules and the selection
// semantics, including which content is exempt from the allow-list.

const README = [
  `<p align="center"><img src="https://avatars.githubusercontent.com/u/1?v=4" alt="me"></p>`,
  "",
  "## About Me",
  "",
  "Dev from Manila.",
  "",
  "## 🛠 Tech Stack",
  "",
  "TypeScript, Go.",
  "",
  "### Nested detail",
  "",
  "Stays with Tech Stack.",
  "",
  "## Contact",
  "",
  "me@example.test",
].join("\n")

describe("slugifyHeading", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyHeading("About Me")).toBe("about-me")
    expect(slugifyHeading("  Tech   Stack  ")).toBe("tech-stack")
  })

  it("drops emoji and punctuation, keeps hyphens", () => {
    expect(slugifyHeading("🛠 Tech Stack")).toBe("tech-stack")
    expect(slugifyHeading("What's up?")).toBe("whats-up")
    expect(slugifyHeading("Open-Source Work")).toBe("open-source-work")
  })

  it("keeps non-Latin letters", () => {
    expect(slugifyHeading("Tungkol sa Akin")).toBe("tungkol-sa-akin")
  })
})

describe("renderReadme — section selection", () => {
  it("renders everything when sections is omitted or empty", async () => {
    for (const sections of [undefined, []]) {
      const html = await renderReadme(README, sections)
      expect(html).toContain("Dev from Manila.")
      expect(html).toContain("TypeScript, Go.")
      expect(html).toContain("me@example.test")
    }
  })

  it("keeps only the listed sections", async () => {
    const html = await renderReadme(README, ["about-me"])
    expect(html).toContain("Dev from Manila.")
    expect(html).not.toContain("TypeScript, Go.")
    expect(html).not.toContain("me@example.test")
  })

  it("renders sections in the listed order, not document order", async () => {
    const html = await renderReadme(README, ["contact", "about-me"])
    expect(html.indexOf("me@example.test")).toBeLessThan(
      html.indexOf("Dev from Manila."),
    )
  })

  it("always keeps the pre-heading avatar/badge block", async () => {
    const html = await renderReadme(README, ["contact"])
    expect(html).toContain("avatars.githubusercontent.com")
  })

  it("matches headings whose text has emoji or odd spacing", async () => {
    const html = await renderReadme(README, ["tech-stack"])
    expect(html).toContain("TypeScript, Go.")
  })

  it("accepts un-slugified names in config and slugifies them", async () => {
    const html = await renderReadme(README, ["About Me"])
    expect(html).toContain("Dev from Manila.")
  })

  it("carries deeper sub-headings along with their parent section", async () => {
    const html = await renderReadme(README, ["tech-stack"])
    expect(html).toContain("Nested detail")
    expect(html).toContain("Stays with Tech Stack.")
  })

  it("ignores slugs that match no heading", async () => {
    const html = await renderReadme(README, ["about-me", "does-not-exist"])
    expect(html).toContain("Dev from Manila.")
    expect(html).not.toContain("me@example.test")
  })

  it("yields only the preamble when no slug matches", async () => {
    const html = await renderReadme(README, ["nope"])
    expect(html).toContain("avatars.githubusercontent.com")
    expect(html).not.toContain("Dev from Manila.")
    expect(html).not.toContain("me@example.test")
  })

  it("splits on the shallowest heading level the README actually uses", async () => {
    // No `##` here at all — sections are delimited by `###`.
    const deep = ["### One", "", "first", "", "### Two", "", "second"].join("\n")
    const html = await renderReadme(deep, ["two"])
    expect(html).toContain("second")
    expect(html).not.toContain("first")
  })

  it("is a no-op on a README with no headings", async () => {
    const html = await renderReadme("Just a paragraph.", ["anything"])
    expect(html).toContain("Just a paragraph.")
  })

  it("still sanitizes the sections it keeps", async () => {
    const hostile = [
      "## Keep",
      "",
      `<img src="https://evil.test/x.png" onerror="alert(1)">`,
      `<script>alert(1)</script>`,
      "",
      "## Drop",
      "",
      "dropped",
    ].join("\n")
    const html = await renderReadme(hostile, ["keep"])
    expect(html).not.toMatch(/<script/i)
    expect(html).not.toMatch(/\bon[a-z]+\s*=/i)
    expect(html).not.toContain("evil.test")
    expect(html).not.toContain("dropped")
  })
})
