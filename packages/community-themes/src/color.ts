/**
 * Value grammar for theme tokens.
 *
 * SECURITY — hard gate. This is the community-themes analogue of
 * `apps/portfolio/lib/parse.ts`, and it exists for the same reason: a theme is
 * third-party input rendered on `*.is-pinoy.dev`.
 *
 * The mistake this module exists to prevent is treating a token file as data.
 * A CSS custom property's value is arbitrary CSS *text*, so a "color" like
 *
 *     red; } #pf-root::before { content: ""; position: fixed; inset: 0 } .x {
 *
 * escapes its declaration block and lands the author a full-page overlay on a
 * genuine origin under a genuine certificate. Every token value therefore has
 * to match one of a small number of known color forms — a positive allow-list,
 * never a blocklist of bad characters.
 *
 * Nothing here permits a function call that can fetch (`url()`, `image-set()`),
 * a nested function, a string literal, an escape sequence, or a comment.
 */

/** Longest accepted value. Nothing legitimate is close to this. */
const MAX_VALUE_LENGTH = 64

/** #rgb, #rgba, #rrggbb, #rrggbbaa — the only hex forms CSS defines. */
const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * Color functions that take plain numeric components. `color-mix()` and
 * `color()` are deliberately absent: both nest other color values, and a
 * grammar that permits nesting is one that has to be reasoned about
 * recursively.
 */
const COLOR_FUNCTIONS = [
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
] as const

const FUNCTIONAL = new RegExp(
  `^(?:${COLOR_FUNCTIONS.join("|")})\\(([^()]*)\\)$`,
  "i",
)

/**
 * Legal characters inside a color function's parentheses: digits, a decimal
 * point, sign, percent, the slash used for alpha, separators, and letters for
 * units (`deg`, `turn`, `grad`, `rad`) and the `none` keyword.
 *
 * Note what is missing — parentheses (so no nesting), backslash (so no CSS
 * escape sequences, which could otherwise spell `url`), quotes, semicolons,
 * braces, and the `*` needed to open a comment.
 */
const FUNCTION_ARGS = /^[0-9a-z.%,\s/+-]*$/i

/** CSS named colors, plus the two keywords. A fixed string set carries no risk. */
const NAMED_COLORS = new Set(
  `transparent currentcolor aliceblue antiquewhite aqua aquamarine azure beige
   bisque black blanchedalmond blue blueviolet brown burlywood cadetblue
   chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue
   darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta
   darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
   darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink
   deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen
   fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey
   honeydew hotpink indianred indigo ivory khaki lavender lavenderblush
   lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow
   lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
   lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime
   limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid
   mediumpurple mediumseagreen mediumslateblue mediumspringgreen
   mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
   navajowhite navy oldlace olive olivedrab orange orangered orchid
   palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff
   peru pink plum powderblue purple rebeccapurple red rosybrown royalblue
   saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue
   slateblue slategray slategrey snow springgreen steelblue tan teal thistle
   tomato turquoise violet wheat white whitesmoke yellow yellowgreen`
    .split(/\s+/)
    .filter(Boolean),
)

export interface ColorRejection {
  ok: false
  reason: string
}

export type ColorResult = { ok: true; value: string } | ColorRejection

/**
 * Validate one token value as a color.
 *
 * Returns the normalized value on success. The returned string is safe to place
 * on the right-hand side of a custom property declaration — but callers should
 * still emit it through `compile.ts`, which re-serializes rather than
 * concatenating.
 */
export function parseColor(input: unknown): ColorResult {
  if (typeof input !== "string") {
    return { ok: false, reason: "value must be a string" }
  }

  const value = input.trim()

  if (value === "") return { ok: false, reason: "value is empty" }
  if (value.length > MAX_VALUE_LENGTH) {
    return { ok: false, reason: `value exceeds ${MAX_VALUE_LENGTH} characters` }
  }

  // Checked ahead of the grammars purely so the rejection message names the
  // real problem. The grammars below would reject these anyway.
  if (/[;{}\\<>"'`]/.test(value)) {
    return {
      ok: false,
      reason:
        "value contains CSS syntax characters — a token holds a color, not a declaration",
    }
  }
  if (value.includes("/*") || value.includes("*/")) {
    return { ok: false, reason: "value contains a comment" }
  }
  // Belt and braces: no grammar below admits these, but naming them makes the
  // failure obvious to a theme author reading CI output.
  if (/\b(url|image|image-set|src|expression|attr|var|env)\s*\(/i.test(value)) {
    return { ok: false, reason: "value calls a non-color function" }
  }

  if (HEX.test(value)) return { ok: true, value: value.toLowerCase() }

  if (NAMED_COLORS.has(value.toLowerCase())) {
    return { ok: true, value: value.toLowerCase() }
  }

  const fn = FUNCTIONAL.exec(value)
  if (fn) {
    const name = value.slice(0, value.indexOf("(")).toLowerCase()
    const args = fn[1] ?? ""
    if (!FUNCTION_ARGS.test(args)) {
      return { ok: false, reason: "color function has unexpected arguments" }
    }
    return checkComponents(name, args) ?? { ok: true, value }
  }

  return {
    ok: false,
    reason: "not a recognized color (use hex, rgb/hsl/oklch(), or a named color)",
  }
}

/** One numeric component: a number with an optional unit, or the `none` keyword. */
const COMPONENT = /^(?:none|[+-]?(?:\d+\.?\d*|\.\d+)(?:%|deg|rad|grad|turn)?)$/i

/**
 * Check a color function's arity and components.
 *
 * Not a security control — an invalid color is simply dropped by the browser,
 * so a wrong component count is a broken theme, not a dangerous one. It is here
 * so a theme author gets told about the typo in CI instead of shipping a token
 * that silently never applies.
 *
 * Every function in COLOR_FUNCTIONS takes three components plus an optional
 * alpha, written either after a slash (modern) or as a fourth comma-separated
 * value (legacy `rgba()`/`hsla()`).
 */
function checkComponents(name: string, args: string): ColorRejection | null {
  const slashParts = args.split("/")
  if (slashParts.length > 2) {
    return { ok: false, reason: "color function has more than one alpha component" }
  }

  const [main, alpha] = slashParts
  const components = (main ?? "").split(/[,\s]+/).filter(Boolean)
  const legacyAlpha = alpha === undefined && components.length === 4

  if (legacyAlpha && name !== "rgba" && name !== "hsla") {
    return {
      ok: false,
      reason: `${name}() takes 3 components with an optional "/ alpha"`,
    }
  }

  const expected = legacyAlpha ? 4 : 3
  if (components.length !== expected) {
    return {
      ok: false,
      reason: `${name}() expects ${expected} components, got ${components.length}`,
    }
  }

  const all = alpha === undefined ? components : [...components, ...alpha.split(/\s+/).filter(Boolean)]
  for (const c of all) {
    if (!COMPONENT.test(c)) {
      return { ok: false, reason: `"${c}" is not a valid color component` }
    }
  }

  return null
}
