import { describe, expect, it } from "vitest"

import {
  effectiveTheme,
  isDesignerTemplate,
  sameStyle,
} from "./portfolio-style"

describe("isDesignerTemplate", () => {
  it("recognises a self-contained design", () => {
    expect(isDesignerTemplate("noir")).toBe(true)
  })

  it("does not claim a recolorable layout", () => {
    expect(isDesignerTemplate("terminal")).toBe(false)
  })
})

describe("effectiveTheme", () => {
  it("keeps the palette a layout renders with", () => {
    expect(effectiveTheme("minimal", "mono")).toBe("mono")
  })

  it("drops a palette a design would never read", () => {
    expect(effectiveTheme("bento", "mono")).toBeUndefined()
  })
})

describe("sameStyle", () => {
  it("matches identical layouts", () => {
    expect(
      sameStyle(
        { template: "terminal", theme: "mono" },
        { template: "terminal", theme: "mono" }
      )
    ).toBe(true)
  })

  it("separates two palettes of the same layout", () => {
    expect(
      sameStyle(
        { template: "terminal", theme: "mono" },
        { template: "terminal", theme: "matrix" }
      )
    ).toBe(false)
  })

  it("ignores the palette on a design that has none", () => {
    expect(
      sameStyle({ template: "noir" }, { template: "noir", theme: "crimson" })
    ).toBe(true)
  })
})
