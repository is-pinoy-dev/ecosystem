/**
 * The design tokens a community theme may set.
 *
 * Derived from what the built-in themes in `apps/portfolio/app/themes.css`
 * actually override — not from the full token surface in
 * `packages/ui/src/styles/globals.css`. A theme re-colors the portfolio; it does
 * not get to redefine the design system.
 *
 * Three groups are deliberately absent, per DESIGN.md:
 *
 *   - `--destructive`, `--success`, `--warning` are semantic, "never
 *     decorative". A theme that could repaint the error color could make a
 *     failure state look like a success one.
 *   - `--radius` stays `0` across the system.
 *   - `--font-family-*` would reintroduce web fonts, which `font-src 'self'`
 *     exists to prevent. Themes use the platform stack.
 *
 * Every token here holds a color and nothing else, which is what lets the value
 * grammar in `color.ts` be as narrow as it is.
 */
export const THEMEABLE_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "primary",
  "primary-foreground",
  "primary-dark",
  "secondary",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "border",
  "input",
  "ring",
  "surface",
  "surface-subtle",
  "code-bg",
] as const

export type ThemeableToken = (typeof THEMEABLE_TOKENS)[number]

const TOKEN_SET: ReadonlySet<string> = new Set(THEMEABLE_TOKENS)

export function isThemeableToken(name: string): name is ThemeableToken {
  return TOKEN_SET.has(name)
}
