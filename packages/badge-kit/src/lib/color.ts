import type { PaletteOverride } from './svg.ts'

// Query-param colors are interpolated straight into SVG `fill`/`stroke`
// attributes, so they must be validated strictly — never echo raw user input
// into the markup. Only hex (#RGB, #RGBA, #RRGGBB, #RRGGBBAA, with or without
// the leading '#') and the keyword `transparent` are accepted; anything else
// returns null and the caller falls back to the theme color.

const HEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export function parseColor(raw: string | undefined | null): string | null {
  if (!raw) return null
  const value = raw.trim()
  if (value.toLowerCase() === 'transparent') return 'transparent'
  if (HEX.test(value)) return value.startsWith('#') ? value : `#${value}`
  return null
}

// Named color query params → palette slots. `bg` also has no effect on the
// mark cell (that is `markbg`); `border` drives the divider so the two rules
// stay visually consistent.
const PARAM_TO_SLOT = {
  bg: 'bg',
  text: 'text',
  muted: 'muted',
  border: 'border',
  mark: 'mark',
  markbg: 'markBg',
} as const

// Build a PaletteOverride from a query getter. Returns undefined when no valid
// color param is present, so the theme is used untouched.
export function parseOverrides(
  get: (key: string) => string | undefined
): PaletteOverride | undefined {
  const override: PaletteOverride = {}
  let has = false
  for (const [param, slot] of Object.entries(PARAM_TO_SLOT)) {
    const color = parseColor(get(param))
    if (color) {
      override[slot] = color
      has = true
    }
  }
  return has ? override : undefined
}
