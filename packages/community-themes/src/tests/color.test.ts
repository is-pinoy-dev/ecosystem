import { describe, it, expect } from "vitest"
import { parseColor } from "../color.js"

// SECURITY — this suite is the gate, not an optional check.
//
// It is the community-themes counterpart to apps/portfolio's parse.test.ts, and
// carries the same rule: add a case for any new vector before changing
// color.ts. A regression here is not a styling bug. A token value is written
// into a CSS declaration served on *.is-pinoy.dev, so a value that escapes its
// declaration block buys the author arbitrary CSS on the platform's own origin
// — which is a phishing overlay and, historically, an exfiltration channel.

describe("accepted color forms", () => {
  it("accepts hex in every length CSS defines", () => {
    for (const v of ["#fff", "#ffff", "#0b1f44", "#0b1f44ff", "#FFF", "#0B1F44"]) {
      expect(parseColor(v).ok, v).toBe(true)
    }
  })

  it("accepts the numeric color functions, comma and space separated", () => {
    for (const v of [
      "rgb(255, 0, 0)",
      "rgb(255 0 0)",
      "rgba(255, 0, 0, 0.5)",
      "rgb(255 0 0 / 50%)",
      "hsl(210, 50%, 50%)",
      "hsl(210deg 50% 50% / 0.5)",
      "oklch(0.7 0.1 200)",
      "oklch(70% 0.1 200deg / 50%)",
      "oklab(0.7 -0.1 0.1)",
      "lab(50% 40 30)",
      "lch(50% 40 30)",
      "hwb(210 20% 30%)",
    ]) {
      expect(parseColor(v).ok, v).toBe(true)
    }
  })

  it("accepts named colors and the two keywords", () => {
    for (const v of ["white", "White", "rebeccapurple", "transparent", "currentcolor"]) {
      expect(parseColor(v).ok, v).toBe(true)
    }
  })

  it("normalizes case for hex and names, and trims", () => {
    expect(parseColor("  #0B1F44  ")).toEqual({ ok: true, value: "#0b1f44" })
    expect(parseColor("WHITE")).toEqual({ ok: true, value: "white" })
  })
})

describe("component arity", () => {
  // Not a security control — a malformed color is dropped by the browser. This
  // is so a typo fails in CI rather than shipping a token that never applies.
  it("rejects the wrong number of components", () => {
    for (const v of [
      "rgb(255, 0)",
      "rgb(255)",
      "rgb(255, 0, 0, 0)", // rgb() has no legacy 4th
      "oklch(0.7 0.1)",
      "hsl(210 50%)",
    ]) {
      expect(parseColor(v).ok, v).toBe(false)
    }
  })

  it("allows the legacy fourth component only for rgba/hsla", () => {
    expect(parseColor("rgba(255, 0, 0, 0.5)").ok).toBe(true)
    expect(parseColor("hsla(210, 50%, 50%, 0.5)").ok).toBe(true)
    expect(parseColor("oklch(0.7, 0.1, 200, 0.5)").ok).toBe(false)
  })

  it("rejects more than one alpha separator", () => {
    expect(parseColor("rgb(255 0 0 / 50% / 20%)").ok).toBe(false)
  })

  it("rejects non-numeric components", () => {
    for (const v of ["rgb(red, green, blue)", "oklch(a b c)", "rgb(255 0 zero)"]) {
      expect(parseColor(v).ok, v).toBe(false)
    }
  })

  it("accepts the `none` keyword modern syntax allows", () => {
    expect(parseColor("oklch(0.7 none 200)").ok).toBe(true)
  })
})

describe("declaration-block escapes", () => {
  // The headline vector. Each of these is a "color" that closes its own
  // declaration and opens new rules — the payloads are drawn from the threat
  // model in docs/superpowers/specs/2026-07-28-community-themes-design.md.
  const escapes = [
    `red; } #pf-root::before { content: ""; position: fixed; inset: 0 } .x {`,
    "red; }",
    "red;}",
    "red } body {",
    "#fff; background: url(https://evil.example/b.png)",
    "#fff;;",
    "red; position: fixed",
  ]

  for (const payload of escapes) {
    it(`rejects ${JSON.stringify(payload.slice(0, 40))}`, () => {
      expect(parseColor(payload).ok).toBe(false)
    })
  }
})

describe("fetching and exfiltration", () => {
  it("rejects url() in every disguise", () => {
    for (const v of [
      "url(https://evil.example/b.png)",
      "URL(https://evil.example/b.png)",
      "url('https://evil.example/b.png')",
      "  url( https://evil.example/b.png )  ",
      "image-set(url(https://evil.example/b.png) 1x)",
      "image(https://evil.example/b.png)",
    ]) {
      expect(parseColor(v).ok, v).toBe(false)
    }
  })

  it("rejects CSS escape sequences that could spell a function name", () => {
    // \75 rl(...) is url(...) after the parser resolves escapes. The value
    // grammar admits no backslash at all, which is why this is rejected before
    // anyone has to reason about escape resolution.
    for (const v of ["\\75 rl(https://evil.example/b.png)", "\\ured", "re\\64"]) {
      expect(parseColor(v).ok, v).toBe(false)
    }
  })

  it("rejects indirection through other CSS functions", () => {
    for (const v of [
      "var(--something)",
      "env(safe-area-inset-top)",
      "attr(data-x)",
      "expression(alert(1))",
      "color-mix(in srgb, red, blue)",
      "color(display-p3 1 0 0)",
    ]) {
      expect(parseColor(v).ok, v).toBe(false)
    }
  })

  it("rejects nested function calls", () => {
    expect(parseColor("rgb(var(--x), 0, 0)").ok).toBe(false)
    expect(parseColor("rgb(calc(1 + 1), 0, 0)").ok).toBe(false)
  })
})

describe("malformed and hostile input", () => {
  it("rejects comments", () => {
    expect(parseColor("red /* } */").ok).toBe(false)
    expect(parseColor("/* */red").ok).toBe(false)
  })

  it("rejects markup and quote characters", () => {
    for (const v of ["<script>", 'red"', "red'", "red`", "<", ">"]) {
      expect(parseColor(v).ok, v).toBe(false)
    }
  })

  it("rejects non-strings and empties", () => {
    for (const v of [undefined, null, 42, {}, [], true, "", "   "]) {
      expect(parseColor(v).ok, JSON.stringify(v)).toBe(false)
    }
  })

  it("rejects absurdly long values", () => {
    expect(parseColor(`#${"a".repeat(200)}`).ok).toBe(false)
    // A long value that would otherwise parse is still refused, so the output
    // size stays bounded by the token count.
    expect(parseColor(`rgb(${"0".repeat(100)}, 0, 0)`).ok).toBe(false)
  })

  it("rejects near-misses that are not colors", () => {
    for (const v of [
      "#ff",
      "#fffff",
      "#gggggg",
      "rgb(255, 0)",
      "rgb()",
      "rgb(red, green, blue)",
      "notacolor",
      "0b1f44",
      "rgb 255 0 0",
    ]) {
      expect(parseColor(v).ok, v).toBe(false)
    }
  })

  it("gives a reason for every rejection", () => {
    // CI surfaces these to theme authors; a blank reason is a bad review comment.
    for (const v of ["", "url(x)", "red; }", "notacolor", "#ff"]) {
      const r = parseColor(v)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.reason.length).toBeGreaterThan(0)
    }
  })
})
