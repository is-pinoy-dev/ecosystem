import { createHash } from "node:crypto"
import { themeManifestSchema, type CompiledTheme } from "./schema.js"
import { isThemeableToken, THEMEABLE_TOKENS } from "./tokens.js"
import { parseColor } from "./color.js"

export interface CompileError {
  /** Dotted path to the offending field, e.g. `tokens.background`. */
  path: string
  message: string
}

export type CompileResult =
  | { ok: true; theme: CompiledTheme }
  | { ok: false; errors: CompileError[] }

/**
 * The attribute a compiled theme is scoped to. The renderer sets this on the
 * portfolio shell; every rule the theme produces is nested inside it, so a
 * theme cannot reach the surrounding document.
 */
export const THEME_SCOPE_ATTRIBUTE = "data-community-theme"

/**
 * Compile an authored theme manifest into servable CSS.
 *
 * Two properties matter more than anything else here, and both are structural
 * rather than a matter of getting a regex right:
 *
 *  1. **Re-serialization, not interpolation.** The output is built from the
 *     token *name* (checked against a fixed list) and a value that
 *     `parseColor` has already reduced to one of a few known forms. An input
 *     string never reaches the output unexamined, so there is no path by which
 *     unreviewed text becomes CSS.
 *
 *  2. **Scoping is applied here, not asked for.** The author does not write
 *     selectors at all in this tier, so they cannot fail to scope one.
 *
 * Collects every error rather than failing on the first, so a theme author sees
 * one CI comment listing everything wrong instead of one problem per push.
 */
export function compileTheme(input: unknown): CompileResult {
  const parsed = themeManifestSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => ({
        path: i.path.join(".") || "(root)",
        message: i.message,
      })),
    }
  }

  const manifest = parsed.data
  const errors: CompileError[] = []
  const declarations: string[] = []

  // Iterate the allow-list, not the input's own keys: a token the manifest
  // carries but this build does not know about can never reach the output,
  // whatever the schema happened to permit.
  for (const token of THEMEABLE_TOKENS) {
    const raw = manifest.tokens[token]
    if (raw === undefined) continue

    const color = parseColor(raw)
    if (!color.ok) {
      errors.push({ path: `tokens.${token}`, message: color.reason })
      continue
    }
    declarations.push(`  --${token}: ${color.value};`)
  }

  if (declarations.length === 0 && errors.length === 0) {
    errors.push({
      path: "tokens",
      message: "theme sets no tokens — it would render identically to the default",
    })
  }

  if (errors.length > 0) return { ok: false, errors }

  const selector = `[${THEME_SCOPE_ATTRIBUTE}="${cssAttributeValue(manifest.id)}"]`
  const css = `${selector} {\n${declarations.join("\n")}\n}\n`

  return {
    ok: true,
    theme: {
      id: manifest.id,
      version: manifest.version,
      title: manifest.title,
      ...(manifest.description ? { description: manifest.description } : {}),
      author: manifest.author,
      license: manifest.license,
      base: manifest.base,
      css,
      hash: createHash("sha256").update(css).digest("hex"),
    },
  }
}

/**
 * Escape a value for use inside a CSS attribute selector's quotes.
 *
 * The id has already matched the manifest schema's pattern, which admits no
 * quotes or backslashes — so this is defence in depth against that pattern
 * being loosened later without anyone rechecking this call site.
 */
function cssAttributeValue(id: string): string {
  return id.replace(/["\\]/g, (c) => `\\${c}`)
}

/** Re-exported so callers validating a token name share this module's list. */
export { isThemeableToken }
