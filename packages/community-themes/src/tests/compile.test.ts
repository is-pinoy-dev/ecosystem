import { describe, it, expect } from "vitest"
import { compileTheme, THEME_SCOPE_ATTRIBUTE } from "../compile.js"
import { THEMEABLE_TOKENS } from "../tokens.js"

const valid = {
  id: "@maria-santos/brutal-grid",
  version: "1.2.0",
  title: "Brutal Grid",
  author: { github: "maria-santos" },
  license: "MIT",
  tokens: { background: "#e8e8e6", foreground: "#0a0a0a" },
}

describe("compileTheme", () => {
  it("compiles a valid manifest to scoped CSS", () => {
    const result = compileTheme(valid)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.theme.css).toContain(
      `[${THEME_SCOPE_ATTRIBUTE}="@maria-santos/brutal-grid"]`,
    )
    expect(result.theme.css).toContain("--background: #e8e8e6;")
    expect(result.theme.css).toContain("--foreground: #0a0a0a;")
    expect(result.theme.base).toBe("dark")
  })

  it("scopes every declaration inside one block the author cannot open", () => {
    const result = compileTheme(valid)
    if (!result.ok) throw new Error("expected success")

    // Exactly one rule, so nothing can sit outside the scope selector.
    expect(result.theme.css.match(/\{/g)).toHaveLength(1)
    expect(result.theme.css.match(/\}/g)).toHaveLength(1)
    expect(result.theme.css.trimStart().startsWith("[")).toBe(true)
  })

  it("hashes the compiled CSS, not the manifest", () => {
    const a = compileTheme(valid)
    const b = compileTheme({ ...valid, title: "A Different Title" })
    if (!a.ok || !b.ok) throw new Error("expected success")

    // Same tokens, different metadata — the artifact is identical, so the hash
    // that identifies it must be too.
    expect(a.theme.hash).toBe(b.theme.hash)
    expect(a.theme.hash).toMatch(/^[0-9a-f]{64}$/)

    const c = compileTheme({ ...valid, tokens: { background: "#000000" } })
    if (!c.ok) throw new Error("expected success")
    expect(c.theme.hash).not.toBe(a.theme.hash)
  })

  it("accepts every themeable token", () => {
    const tokens = Object.fromEntries(THEMEABLE_TOKENS.map((t) => [t, "#123456"]))
    const result = compileTheme({ ...valid, tokens })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    for (const token of THEMEABLE_TOKENS) {
      expect(result.theme.css).toContain(`--${token}: #123456;`)
    }
  })
})

describe("rejections", () => {
  it("rejects a hostile token value and names the field", () => {
    const result = compileTheme({
      ...valid,
      tokens: { background: `red; } body { background: url(https://evil.example/b) } .x {` },
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors[0]?.path).toBe("tokens.background")
  })

  it("refuses tokens outside the allow-list", () => {
    // --destructive is semantic per DESIGN.md; a theme repainting it could make
    // a failure state look like a success one.
    for (const token of ["destructive", "success", "warning", "radius", "font-family-sans"]) {
      const result = compileTheme({ ...valid, tokens: { [token]: "#123456" } })
      expect(result.ok, token).toBe(false)
    }
  })

  it("never emits a token the compiler does not know, whatever the input", () => {
    // Guards the iterate-the-allow-list property directly: even if the schema
    // were loosened to admit extra keys, they cannot reach the output.
    const result = compileTheme({
      ...valid,
      tokens: { ...valid.tokens, "evil-token": "#000000" },
    })
    if (result.ok) {
      expect(result.theme.css).not.toContain("evil-token")
    } else {
      expect(result.ok).toBe(false)
    }
  })

  it("reports every bad token at once, not just the first", () => {
    const result = compileTheme({
      ...valid,
      tokens: { background: "url(https://a.example)", foreground: "red; }", accent: "nope" },
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toHaveLength(3)
    expect(result.errors.map((e) => e.path).sort()).toEqual([
      "tokens.accent",
      "tokens.background",
      "tokens.foreground",
    ])
  })

  it("rejects version ranges", () => {
    for (const version of ["^1.2.0", "~1.2.0", "latest", "1.x", "1.2"]) {
      expect(compileTheme({ ...valid, version }).ok, version).toBe(false)
    }
  })

  it("rejects a malformed theme id", () => {
    for (const id of ["brutal-grid", "@maria/", "@-maria/x", "@maria/Brutal"]) {
      expect(compileTheme({ ...valid, id }).ok, id).toBe(false)
    }
  })

  it("rejects a theme that sets nothing", () => {
    const result = compileTheme({ ...valid, tokens: {} })
    expect(result.ok).toBe(false)
  })

  it("rejects non-objects", () => {
    for (const input of [null, undefined, "theme", 42, []]) {
      expect(compileTheme(input).ok, JSON.stringify(input)).toBe(false)
    }
  })
})
