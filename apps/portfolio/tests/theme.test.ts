import { describe, it, expect } from "vitest"
import { resolveTheme } from "../lib/context"
import { BUILTIN_THEMES } from "@is-pinoy-dev/schemas"

// `portfolio.theme` became a union when the schema learned about community
// themes, but the shell applies it as a `[data-theme]` attribute — a string.
// Without narrowing, a pinned community theme stringifies to
// "[object Object]", which is a valid-looking attribute that matches no CSS
// rule, so the page renders unstyled instead of failing visibly.
describe("resolveTheme", () => {
  it("passes built-in themes through unchanged", () => {
    for (const theme of BUILTIN_THEMES) {
      expect(resolveTheme(theme)).toBe(theme)
    }
  })

  it("returns undefined when no theme is configured", () => {
    expect(resolveTheme(undefined)).toBeUndefined()
  })

  it("falls back rather than leaking an object into [data-theme]", () => {
    const resolved = resolveTheme({
      id: "@maria-santos/brutal-grid",
      version: "1.2.0",
    })
    expect(resolved).toBeUndefined()
    expect(typeof resolved).not.toBe("object")
  })

  it("never returns a value that stringifies to [object Object]", () => {
    // The property that actually matters, stated directly: whatever comes back
    // is safe to interpolate into an HTML attribute.
    for (const theme of [
      undefined,
      "gold-dark" as const,
      { id: "@a/b", version: "1.0.0" },
    ]) {
      expect(String(resolveTheme(theme))).not.toBe("[object Object]")
    }
  })
})
