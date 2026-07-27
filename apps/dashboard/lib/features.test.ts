import { describe, expect, it } from "vitest"

import {
  BUILTIN_FEATURES,
  FEATURES,
  findFeature,
  isFeatureEnabled,
  setFeatureEnabled,
  TOGGLEABLE_FEATURES,
  type PlatformFeature,
} from "./features"

const siteAudit = findFeature("site-audit")!
const analytics = findFeature("analytics")!
const og = findFeature("og")!

describe("feature registry", () => {
  it("splits switchable features from built-ins", () => {
    expect(TOGGLEABLE_FEATURES.every((f) => f.kind === "toggle")).toBe(true)
    expect(BUILTIN_FEATURES.every((f) => f.kind === "builtin")).toBe(true)
  })

  it("treats Site Audit as opt-in, matching its worker and the docs", () => {
    expect(siteAudit.kind).toBe("toggle")
    expect(siteAudit.defaultEnabled).toBe(false)
    expect(siteAudit.flagPath).toEqual(["tools", "site-audit"])
  })

  it("treats analytics as opt-out, since proxied traffic is measured anyway", () => {
    expect(analytics.kind).toBe("toggle")
    expect(analytics.defaultEnabled).toBe(true)
    expect(analytics.flagPath).toEqual(["analytics"])
  })

  it("treats OG as built-in with no flag to write", () => {
    expect(og.kind).toBe("builtin")
    expect(og.flagPath).toEqual([])
    expect(TOGGLEABLE_FEATURES.map((f) => f.id)).not.toContain("og")
  })

  it("gives every feature docs to link to", () => {
    expect(FEATURES.every((f) => f.docsUrl.startsWith("https://"))).toBe(true)
  })
})

describe("isFeatureEnabled", () => {
  it("reads an explicit flag", () => {
    expect(isFeatureEnabled({ tools: { "site-audit": true } }, siteAudit)).toBe(
      true
    )
  })

  it("falls back to the default when the flag is absent", () => {
    expect(isFeatureEnabled({}, siteAudit)).toBe(false)
    expect(isFeatureEnabled({}, analytics)).toBe(true)
    expect(isFeatureEnabled(null, analytics)).toBe(true)
    expect(isFeatureEnabled(undefined, siteAudit)).toBe(false)
  })

  it("honours an explicit opt-out", () => {
    expect(isFeatureEnabled({ analytics: false }, analytics)).toBe(false)
  })

  it("falls back to the default for a non-boolean value", () => {
    expect(isFeatureEnabled({ analytics: "no" }, analytics)).toBe(true)
    expect(
      isFeatureEnabled({ tools: { "site-audit": "yes" } }, siteAudit)
    ).toBe(false)
  })

  it("always reports a built-in as on", () => {
    expect(isFeatureEnabled(null, og)).toBe(true)
    expect(isFeatureEnabled({ tools: { og: false } }, og)).toBe(true)
  })
})

describe("setFeatureEnabled", () => {
  it("writes a top-level flag", () => {
    expect(setFeatureEnabled(null, analytics, false)).toEqual({
      analytics: false,
    })
  })

  it("builds missing nesting for a nested flag", () => {
    expect(setFeatureEnabled(null, siteAudit, true)).toEqual({
      tools: { "site-audit": true },
    })
  })

  it("does not mutate the input", () => {
    const features = { tools: { "site-audit": false } }
    const updated = setFeatureEnabled(features, siteAudit, true)

    expect(updated).toEqual({ tools: { "site-audit": true } })
    expect(features.tools["site-audit"]).toBe(false)
  })

  it("leaves siblings at both levels untouched", () => {
    const features = { analytics: false, tools: { og: true } }
    expect(setFeatureEnabled(features, siteAudit, true)).toEqual({
      analytics: false,
      tools: { og: true, "site-audit": true },
    })
  })

  it("writes an explicit false rather than dropping the key", () => {
    expect(
      setFeatureEnabled({ tools: { "site-audit": true } }, siteAudit, false)
    ).toEqual({ tools: { "site-audit": false } })
  })

  it("is a no-op for a built-in, which has no flag", () => {
    const features = { analytics: true }
    expect(setFeatureEnabled(features, og, false)).toEqual(features)
  })

  it("handles a deeper path than the registry currently uses", () => {
    const deep: PlatformFeature = {
      ...siteAudit,
      flagPath: ["a", "b", "c"],
    }
    expect(setFeatureEnabled({ keep: 1 }, deep, true)).toEqual({
      keep: 1,
      a: { b: { c: true } },
    })
  })
})
