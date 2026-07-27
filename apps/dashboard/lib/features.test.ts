import { describe, expect, it } from "vitest"

import {
  AVAILABLE_TOOLS,
  findTool,
  isToolEnabled,
  setToolEnabled,
  TOOLS,
} from "./features"

describe("tool registry", () => {
  it("only offers tools whose worker honours the flag", () => {
    expect(AVAILABLE_TOOLS.every((tool) => tool.enforced)).toBe(true)
  })

  it("offers Site Audit, which gates on features.tools['site-audit']", () => {
    expect(AVAILABLE_TOOLS.map((t) => t.id)).toContain("site-audit")
  })

  it("withholds OG until its worker reads the flag", () => {
    expect(findTool("og")?.enforced).toBe(false)
    expect(AVAILABLE_TOOLS.map((t) => t.id)).not.toContain("og")
  })

  it("gives every tool docs to link to", () => {
    expect(TOOLS.every((tool) => tool.docsUrl.startsWith("https://"))).toBe(
      true
    )
  })
})

describe("isToolEnabled", () => {
  it("reads a set flag", () => {
    expect(isToolEnabled({ tools: { "site-audit": true } }, "site-audit")).toBe(
      true
    )
  })

  it("treats an absent flag, block, or features object as off", () => {
    expect(isToolEnabled({ tools: {} }, "site-audit")).toBe(false)
    expect(isToolEnabled({}, "site-audit")).toBe(false)
    expect(isToolEnabled(null, "site-audit")).toBe(false)
    expect(isToolEnabled(undefined, "site-audit")).toBe(false)
  })

  it("requires exactly true — not a truthy value", () => {
    expect(
      isToolEnabled({ tools: { "site-audit": "yes" } }, "site-audit")
    ).toBe(false)
  })
})

describe("setToolEnabled", () => {
  it("builds the nested shape when the record has no features block", () => {
    expect(setToolEnabled(null, "site-audit", true)).toEqual({
      tools: { "site-audit": true },
    })
  })

  it("sets the flag without mutating the input", () => {
    const features = { tools: { "site-audit": false } }
    const updated = setToolEnabled(features, "site-audit", true)

    expect(updated).toEqual({ tools: { "site-audit": true } })
    expect(features.tools["site-audit"]).toBe(false)
  })

  it("leaves other tools and sibling keys untouched", () => {
    const features = { tools: { og: true }, somethingElse: 1 }
    expect(setToolEnabled(features, "site-audit", true)).toEqual({
      tools: { og: true, "site-audit": true },
      somethingElse: 1,
    })
  })

  it("writes an explicit false rather than dropping the key", () => {
    expect(
      setToolEnabled({ tools: { "site-audit": true } }, "site-audit", false)
    ).toEqual({ tools: { "site-audit": false } })
  })
})
