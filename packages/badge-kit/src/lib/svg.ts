import { IBM_PLEX_MONO_TTF_BASE64 } from './font.ts'

// ─── Public types ──────────────────────────────────────────────────────────────

export type BadgeType = 'subdomain' | 'member' | 'pinoy-made' | 'certified'

export type BannerType = 'readme' | 'profile'

export type Theme = 'dark' | 'gold' | 'light' | 'outlined'

export type OutputFormat = 'svg' | 'png' | 'webp'

export const LABEL_MAX_LENGTH = 15
export const DEFAULT_SUBDOMAIN_LABEL = 'DEPLOYED ON'

// Per-request color overrides. Any slot left undefined keeps the theme color.
// Populated from validated query params (see lib/color.ts) — callers must never
// pass unvalidated user input here.
export interface PaletteOverride {
  bg?: string
  text?: string
  muted?: string
  border?: string
  mark?: string
  markBg?: string
}

export interface BadgeOptions {
  subdomain: string
  type: BadgeType
  theme: Theme
  notFound: boolean
  label?: string
  overrides?: PaletteOverride
}

export interface BannerOptions {
  subdomain: string
  type: BannerType
  theme: Theme
  overrides?: PaletteOverride
}

// ─── Default / valid themes ─────────────────────────────────────────────────

export const DEFAULT_BADGE_THEME: Record<BadgeType, Theme> = {
  subdomain: 'light',
  member: 'light',
  'pinoy-made': 'light',
  certified: 'gold',
}

export const DEFAULT_BANNER_THEME: Record<BannerType, Theme> = {
  readme: 'light',
  profile: 'gold',
}

export const VALID_BADGE_THEMES: Record<BadgeType, Theme[]> = {
  subdomain: ['light', 'dark', 'gold', 'outlined'],
  member: ['light', 'dark', 'gold', 'outlined'],
  'pinoy-made': ['light', 'dark', 'gold', 'outlined'],
  certified: ['light', 'dark', 'gold', 'outlined'],
}

export const VALID_BANNER_THEMES: Record<BannerType, Theme[]> = {
  readme: ['light', 'dark', 'gold'],
  profile: ['gold', 'dark', 'light'],
}

// ─── Design tokens (from the root DESIGN.md — "Banig Grid" v2.0) ─────────────
//
// The retro system (Press Start 2P, CRT scanlines, glow-pulse, hard pixel
// shadows, the 8-ray pixel sun) is retired. Badges are now calm, square, and
// mono-typed: a navy / warm-white / yellow palette with 1px rules and a single
// minimal brand mark. Yellow appears only as that mark — a moment of
// recognition — never as decoration.

const NAVY = '#0B1F44'
const INK = '#FAF9F5' // warm white text (on navy)
const WHITE = '#FFFFFF'
const GOLD = '#F5C800'
const GOLD_DARK = '#D4A800'
const MUTED = '#667085'
const MUTED_ON_NAVY = '#9DABC6'
const MUTED_ON_GOLD = '#7A6600'
const BORDER = '#DED9CD'
const BORDER_ON_NAVY = '#24365F'
const NOT_FOUND = '#98A2B3'

interface Palette {
  surface: string
  text: string
  muted: string
  border: string
  markBg: string
  markGlyph: string
  divider: string
}

function resolvePalette(theme: Theme): Palette {
  switch (theme) {
    case 'dark':
      return {
        surface: NAVY,
        text: INK,
        muted: MUTED_ON_NAVY,
        border: BORDER_ON_NAVY,
        markBg: GOLD,
        markGlyph: NAVY,
        divider: BORDER_ON_NAVY,
      }
    case 'gold':
      return {
        surface: GOLD,
        text: NAVY,
        muted: MUTED_ON_GOLD,
        border: GOLD_DARK,
        markBg: NAVY,
        markGlyph: GOLD,
        divider: 'rgba(11,31,68,0.22)',
      }
    case 'outlined':
      return {
        surface: 'transparent',
        text: GOLD,
        muted: '#B08A00',
        border: GOLD,
        markBg: 'transparent',
        markGlyph: GOLD,
        divider: 'rgba(245,200,0,0.4)',
      }
    case 'light':
    default:
      return {
        surface: WHITE,
        text: NAVY,
        muted: MUTED,
        border: BORDER,
        markBg: NAVY,
        markGlyph: GOLD,
        divider: BORDER,
      }
  }
}

// Layer validated color overrides on top of a resolved theme palette. `border`
// also drives the divider so the outer and inner rules stay consistent.
function applyOverrides(p: Palette, o?: PaletteOverride): Palette {
  if (!o) return p
  return {
    surface: o.bg ?? p.surface,
    text: o.text ?? p.text,
    muted: o.muted ?? p.muted,
    border: o.border ?? p.border,
    markBg: o.markBg ?? p.markBg,
    markGlyph: o.mark ?? p.markGlyph,
    divider: o.border ?? p.divider,
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

const FONT = "'IBM Plex Mono',ui-monospace,'DejaVu Sans Mono',monospace"

// IBM Plex Mono advance is ~0.6em. Widths are pinned with textLength so the
// layout is identical whether a browser or the resvg rasterizer draws it.
const ADVANCE = 0.6

function fontFaceStyles(): string {
  return `@font-face{font-family:'IBM Plex Mono';font-style:normal;font-weight:400;src:url('data:font/ttf;base64,${IBM_PLEX_MONO_TTF_BASE64}') format('truetype');}`
}

function mw(text: string, size: number): number {
  return text.length * size * ADVANCE
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// The brand mark: a five-square "plus" — a sun reduced to axis-aligned squares.
// Geometric, minimal, and true to the square-geometry brand trait. Drawn to
// fill a `cell` × `cell` region positioned at (x, y).
function mark(x: number, y: number, cell: number, color: string): string {
  const s = Math.max(2, Math.round(cell * 0.15))
  const pitch = s * 2
  const span = s + pitch * 2
  const ox = x + (cell - span) / 2
  const oy = y + (cell - span) / 2
  const cells = [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 2],
  ]
  return cells
    .map(
      ([col, row]) =>
        `<rect x="${(ox + col * pitch).toFixed(2)}" y="${(oy + row * pitch).toFixed(2)}" width="${s}" height="${s}" fill="${color}"/>`
    )
    .join('')
}

function text(
  x: number,
  y: number,
  content: string,
  size: number,
  fill: string,
  opts: { anchor?: 'start' | 'end'; tracking?: number; width?: number } = {}
): string {
  const anchor = opts.anchor ?? 'start'
  const tracking = opts.tracking ? ` letter-spacing="${opts.tracking}"` : ''
  const len =
    opts.width != null
      ? ` textLength="${opts.width.toFixed(2)}" lengthAdjust="spacingAndGlyphs"`
      : ''
  return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-family="${FONT}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="central"${tracking}${len}>${content}</text>`
}

// Standard frame: 1px square border, an optional filled mark cell on the left,
// a 1px divider, and the brand mark. No shadow, no radius.
function frame(
  totalW: number,
  H: number,
  p: Palette,
  markCell: number,
  extra: string
): string {
  const markFill =
    p.markBg === 'transparent'
      ? ''
      : `<rect x="0" y="0" width="${markCell}" height="${H}" fill="${p.markBg}"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${H}" viewBox="0 0 ${totalW} ${H}" role="img">
  <defs><style>${fontFaceStyles()}</style></defs>
  <rect x="0.5" y="0.5" width="${totalW - 1}" height="${H - 1}" fill="${p.surface}" stroke="${p.border}"/>
  ${markFill}
  <line x1="${markCell}" y1="0.5" x2="${markCell}" y2="${H - 0.5}" stroke="${p.divider}"/>
  ${mark(0, 0, markCell, p.markGlyph)}
  ${extra}
</svg>`
}

// ─── Badge generators ────────────────────────────────────────────────────────

function subdomainBadgeSvg(
  subdomain: string,
  label: string,
  p: Palette,
  notFound: boolean
): string {
  const H = 48
  const markCell = H
  const padX = 14
  const textX = markCell + padX

  const eyebrowSize = 10
  const valueSize = 13
  const handle = esc(subdomain)
  const suffix = '.is-pinoy.dev'

  if (notFound) {
    const msg = 'not found'
    const contentW = Math.max(mw(label, eyebrowSize), mw(msg, valueSize))
    const totalW = Math.ceil(textX + contentW + padX)
    const inner =
      text(textX, H / 2 - 8, esc(label), eyebrowSize, p.muted, {
        tracking: 1.2,
        width: mw(label, eyebrowSize),
      }) +
      text(textX, H / 2 + 9, msg, valueSize, NOT_FOUND, {
        width: mw(msg, valueSize),
      })
    return frame(totalW, H, p, markCell, inner)
  }

  const valueW = mw(handle + suffix, valueSize)
  const contentW = Math.max(mw(label, eyebrowSize), valueW)
  const totalW = Math.ceil(textX + contentW + padX)

  const inner =
    text(textX, H / 2 - 8, esc(label), eyebrowSize, p.muted, {
      tracking: 1.2,
      width: mw(label, eyebrowSize),
    }) +
    `<text x="${textX}" y="${(H / 2 + 9).toFixed(2)}" font-family="${FONT}" font-size="${valueSize}" text-anchor="start" dominant-baseline="central" textLength="${valueW.toFixed(2)}" lengthAdjust="spacingAndGlyphs"><tspan fill="${p.text}">${handle}</tspan><tspan fill="${p.muted}">${suffix}</tspan></text>`

  return frame(totalW, H, p, markCell, inner)
}

function memberSvg(subdomain: string, p: Palette, notFound: boolean): string {
  const H = 30
  const markCell = H
  const padX = 12
  const gap = 10
  const size = 11
  const startX = markCell + padX

  const brand = 'is-pinoy.dev'
  const brandW = mw(brand, size)

  if (notFound) {
    const msg = 'not found'
    const totalW = Math.ceil(startX + mw(msg, size) + padX)
    const inner = text(startX, H / 2, msg, size, NOT_FOUND, {
      width: mw(msg, size),
    })
    return frame(totalW, H, p, markCell, inner)
  }

  const handle = esc(subdomain)
  const handleW = mw(subdomain, size)
  const dividerX = startX + brandW + gap
  const handleX = dividerX + gap
  const totalW = Math.ceil(handleX + handleW + padX)

  const inner =
    text(startX, H / 2, brand, size, p.text, { width: brandW }) +
    `<line x1="${dividerX}" y1="${H / 2 - 6}" x2="${dividerX}" y2="${H / 2 + 6}" stroke="${p.divider}"/>` +
    text(handleX, H / 2, handle, size, p.muted, { width: handleW })

  return frame(totalW, H, p, markCell, inner)
}

function pinoyMadeSvg(p: Palette): string {
  const H = 36
  const markCell = H
  const padX = 14
  const size = 12
  const startX = markCell + padX
  const message = 'PINOY-MADE'
  const messageW = mw(message, size)
  const totalW = Math.ceil(startX + messageW + padX)

  const inner = text(startX, H / 2, message, size, p.text, {
    tracking: 1,
    width: messageW,
  })
  return frame(totalW, H, p, markCell, inner)
}

function certifiedSvg(p: Palette): string {
  const H = 48
  const markCell = H
  const padX = 14
  const startX = markCell + padX

  const eyebrow = 'CERTIFIED'
  const value = 'PINOY DEV'
  const eyebrowSize = 10
  const valueSize = 14
  const eyebrowW = mw(eyebrow, eyebrowSize)
  const valueW = mw(value, valueSize)
  const contentW = Math.max(eyebrowW, valueW)
  const totalW = Math.ceil(startX + contentW + padX)

  const inner =
    text(startX, H / 2 - 8, eyebrow, eyebrowSize, p.muted, {
      tracking: 1.4,
      width: eyebrowW,
    }) +
    text(startX, H / 2 + 9, value, valueSize, p.text, { width: valueW })

  return frame(totalW, H, p, markCell, inner)
}

// ─── Banner generators ───────────────────────────────────────────────────────

function readmeBannerSvg(subdomain: string, p: Palette): string {
  const W = 640
  const H = 96
  const markCell = H
  const padX = 28
  const textX = markCell + padX

  const eyebrowSize = 11
  const valueSize = 20
  const handle = esc(subdomain)
  const suffix = '.is-pinoy.dev'
  const valueW = mw(handle + suffix, valueSize)

  const rightX = W - padX

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
  <defs><style>${fontFaceStyles()}</style></defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="${p.surface}" stroke="${p.border}"/>
  ${p.markBg === 'transparent' ? '' : `<rect x="0" y="0" width="${markCell}" height="${H}" fill="${p.markBg}"/>`}
  <line x1="${markCell}" y1="0.5" x2="${markCell}" y2="${H - 0.5}" stroke="${p.divider}"/>
  ${mark(0, 0, markCell, p.markGlyph)}
  ${text(textX, H / 2 - 12, 'DEPLOYED ON', eyebrowSize, p.muted, { tracking: 1.6, width: mw('DEPLOYED ON', eyebrowSize) })}
  <text x="${textX}" y="${H / 2 + 12}" font-family="${FONT}" font-size="${valueSize}" text-anchor="start" dominant-baseline="central" textLength="${valueW.toFixed(2)}" lengthAdjust="spacingAndGlyphs"><tspan fill="${p.text}">${handle}</tspan><tspan fill="${p.muted}">${suffix}</tspan></text>
  ${text(rightX, H / 2 - 10, 'SUBDOMAIN BY', 10, p.muted, { anchor: 'end', tracking: 1.4, width: mw('SUBDOMAIN BY', 10) })}
  ${text(rightX, H / 2 + 10, 'is-pinoy.dev', 13, p.text, { anchor: 'end', width: mw('is-pinoy.dev', 13) })}
</svg>`
}

function profileBannerSvg(subdomain: string, p: Palette): string {
  const W = 720
  const H = 140
  const markCell = H
  const padX = 36
  const textX = markCell + padX

  const handle = esc(subdomain)
  const value = `${handle}.is-pinoy.dev`
  const valueSize = 24
  const valueW = mw(value, valueSize)
  const tagline =
    'The free subdomain network for Filipino developers.'
  const taglineSize = 12
  const eyebrow = 'IS-PINOY.DEV NETWORK'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
  <defs><style>${fontFaceStyles()}</style></defs>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="${p.surface}" stroke="${p.border}"/>
  ${p.markBg === 'transparent' ? '' : `<rect x="0" y="0" width="${markCell}" height="${H}" fill="${p.markBg}"/>`}
  <line x1="${markCell}" y1="0.5" x2="${markCell}" y2="${H - 0.5}" stroke="${p.divider}"/>
  ${mark(0, 0, markCell, p.markGlyph)}
  ${text(textX, H / 2 - 26, eyebrow, 11, p.muted, { tracking: 1.8, width: mw(eyebrow, 11) })}
  ${text(textX, H / 2 + 2, value, valueSize, p.text, { width: valueW })}
  ${text(textX, H / 2 + 28, tagline, taglineSize, p.muted, { width: mw(tagline, taglineSize) })}
</svg>`
}

// ─── Main exported functions ─────────────────────────────────────────────────

export function generateBadgeSvg(opts: BadgeOptions): string {
  const { subdomain, type, theme, notFound, label, overrides } = opts
  const p = applyOverrides(resolvePalette(theme), overrides)
  switch (type) {
    case 'subdomain':
      return subdomainBadgeSvg(subdomain, label ?? DEFAULT_SUBDOMAIN_LABEL, p, notFound)
    case 'member':
      return memberSvg(subdomain, p, notFound)
    case 'pinoy-made':
      return pinoyMadeSvg(p)
    case 'certified':
      return certifiedSvg(p)
  }
}

export function generateBannerSvg(opts: BannerOptions): string {
  const { subdomain, type, theme, overrides } = opts
  const p = applyOverrides(resolvePalette(theme), overrides)
  switch (type) {
    case 'readme':
      return readmeBannerSvg(subdomain, p)
    case 'profile':
      return profileBannerSvg(subdomain, p)
  }
}
