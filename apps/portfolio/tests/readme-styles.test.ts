import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

// A profile README is third-party document markup — headings four levels deep,
// badge rows, task lists, tables — dropped into twelve different designs. The
// structure is styled once in app/readme.css and colored per design through the
// --readme-* custom properties, and neither half is much use without the other:
// a design that declares no palette inherits fallbacks mixed from its own text
// color (legible, but generic), and a tag readme.css forgets falls back to
// Tailwind's preflight (block-level badges, unmarked lists, headings at body
// size). These tests hold both halves in place as designs are added.

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8")

const readmeCss = read("../app/readme.css")
const designerCss = read("../app/designer-themes.css")
const globalsCss = read("../app/globals.css")
const templateIndex = read("../templates/index.ts")

/** Flat rule list — enough for a stylesheet with no nesting or media queries. */
function rules(css: string): { selector: string; body: string }[] {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("}")
    .map((chunk) => chunk.split("{"))
    .filter((parts) => parts.length === 2)
    .map(([selector, body]) => ({ selector: selector!.trim(), body: body! }))
}

/** The `.dt-<name>` roots the designer templates render under. */
function designerThemes(): string[] {
  const block = /const DESIGNER_TEMPLATES[^{]*{([^}]*)}/s.exec(templateIndex)
  expect(block, "DESIGNER_TEMPLATES map not found").toBeTruthy()
  return [...block![1]!.matchAll(/^\s*"?([a-z-]+)"?:/gm)].map((m) => m[1]!)
}

describe("README rendering contract", () => {
  it("undoes the preflight resets that break document markup", () => {
    // Each of these has a visible failure mode: images become block-level and
    // stack a badge row one per line, lists lose their markers and indent,
    // headings collapse to body size, and a wide table widens the whole page.
    expect(readmeCss).toMatch(/display:\s*inline-block/)
    expect(readmeCss).toMatch(/list-style:\s*disc/)
    expect(readmeCss).toMatch(/list-style:\s*decimal/)
    expect(readmeCss).toMatch(/overflow-x:\s*auto/)
  })

  it("styles every heading level, not just the ones markdown starts with", () => {
    // lib/parse.ts demotes each heading by one, so `###` — ordinary in a
    // profile README — arrives as an h4, and h6 is reachable.
    for (const tag of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
      const sized = rules(readmeCss).some(
        ({ selector, body }) =>
          new RegExp(`\\b${tag}\\b`).test(selector) && body.includes("font-size"),
      )
      expect(sized, `${tag} is never given a size`).toBe(true)
    }
  })

  it("keeps its own specificity at zero so a design can override it", () => {
    // Every selector is wrapped in :where(). A bare `.portfolio-readme a` here
    // would outrank `.dt-noir .dt-readme :where(a)` and quietly repaint it.
    const selectors = rules(readmeCss).map(({ selector }) => selector)
    expect(selectors.length).toBeGreaterThan(20)
    for (const selector of selectors) {
      // The one exception is the variable block, which has to be reachable by
      // the surface's own class to define the defaults everything else reads.
      if (selector === ".portfolio-readme,\n.dt-readme") continue
      expect(selector, `${selector} is not wrapped in :where()`).toMatch(/^:where\(/)
    }
  })
})

describe("per-design README palettes", () => {
  const themes = designerThemes()

  it("finds the designer templates", () => {
    expect(themes.length).toBeGreaterThanOrEqual(9)
  })

  it.each(themes)("%s colors its README surface", (theme) => {
    const block = new RegExp(`\\.dt-${theme} \\.dt-readme\\s*{([^}]*)}`, "s").exec(
      designerCss,
    )
    expect(block, `.dt-${theme} .dt-readme block not found`).toBeTruthy()
    // Heading and link carry the design's voice; rule and fill are what every
    // border, quote bar, table line and code tint are drawn from.
    for (const prop of [
      "--readme-heading",
      "--readme-link",
      "--readme-rule",
      "--readme-fill",
    ]) {
      expect(block![1], `.dt-${theme} does not set ${prop}`).toContain(prop)
    }
  })

  it("colors the layout templates' surface from the theme tokens", () => {
    // These three are re-colored per palette, so their README has to read the
    // cascading tokens rather than name colors of its own.
    const block = /\.portfolio-readme\s*{([^}]*)}/s.exec(globalsCss)
    expect(block).toBeTruthy()
    expect(block![1]).toContain("--readme-heading: var(--primary)")
    expect(block![1]).toContain("--readme-link: var(--accent)")
    expect(block![1]).toContain("--readme-rule: var(--border)")
  })
})
