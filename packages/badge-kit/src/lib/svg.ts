import { PRESS_START_2P_WOFF2_BASE64, IBM_PLEX_MONO_TTF_BASE64 } from './font.ts'

// ─── Public types ──────────────────────────────────────────────────────────────

export type BadgeType = 'subdomain' | 'member' | 'pinoy-made' | 'certified'

export type BannerType = 'readme' | 'profile'

export type Theme = 'dark' | 'gold' | 'light' | 'outlined'

export type OutputFormat = 'svg' | 'png' | 'webp'

export const LABEL_MAX_LENGTH = 15
export const DEFAULT_SUBDOMAIN_LABEL = 'DEPLOYED ON'

export interface BadgeOptions {
  subdomain: string
  type: BadgeType
  theme: Theme
  notFound: boolean
  label?: string
}

export interface BannerOptions {
  subdomain: string
  type: BannerType
  theme: Theme
}

// ─── Default / valid themes ─────────────────────────────────────────────────

export const DEFAULT_BADGE_THEME: Record<BadgeType, Theme> = {
  subdomain: 'dark',
  member: 'dark',
  'pinoy-made': 'dark',
  certified: 'gold',
}

export const DEFAULT_BANNER_THEME: Record<BannerType, Theme> = {
  readme: 'dark',
  profile: 'gold',
}

export const VALID_BADGE_THEMES: Record<BadgeType, Theme[]> = {
  subdomain: ['dark', 'gold', 'light', 'outlined'],
  member: ['dark', 'gold', 'light', 'outlined'],
  'pinoy-made': ['dark', 'gold', 'light', 'outlined'],
  certified: ['dark', 'gold', 'light', 'outlined'],
}

export const VALID_BANNER_THEMES: Record<BannerType, Theme[]> = {
  readme: ['dark', 'gold'],
  profile: ['gold', 'dark'],
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function fontFaceStyles(): string {
  return (
    `@font-face{font-family:'Press Start 2P';src:url('data:font/woff2;base64,${PRESS_START_2P_WOFF2_BASE64}') format('woff2');}` +
    `@font-face{font-family:'IBM Plex Mono';src:url('data:font/ttf;base64,${IBM_PLEX_MONO_TTF_BASE64}') format('truetype');}`
  )
}

function pixelSun(cx: number, cy: number, size: number, color: string): string {
  const scale = size / 100
  const rays = [0, 45, 90, 135, 180, 225, 270, 315]
    .map(
      (a) =>
        `<rect x="44" y="4" width="12" height="46" rx="2" fill="${color}" transform="rotate(${a},50,50)"/>`
    )
    .join('')
  return `<g transform="translate(${cx - size / 2},${cy - size / 2}) scale(${scale})">${rays}</g>`
}

// Press Start 2P: ~1.25 advance ratio
function pw(text: string, size: number): number {
  return Math.ceil(text.length * size * 1.25)
}

// IBM Plex Mono: ~0.6em advance
function mw(text: string, size: number): number {
  return Math.ceil(text.length * size * 0.6)
}

function badge(
  W: number,
  H: number,
  bg: string,
  border: string,
  borderW: number,
  shadow: string | null,
  shadowOff: number,
  inner: string,
  retroBorder: boolean,
  children: string,
): string {
  const totalW = shadow ? W + shadowOff : W
  const totalH = shadow ? H + shadowOff : H
  const shadowEl = shadow
    ? `<rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="${shadow}"/>`
    : ''
  const retroEl = retroBorder
    ? `<rect x="5" y="5" width="${W - 10}" height="${H - 10}" stroke="${border}" stroke-width="1.5" fill="none" stroke-dasharray="0"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
  <defs><style>${fontFaceStyles()}</style></defs>
  ${shadowEl}
  <rect x="0" y="0" width="${W}" height="${H}" fill="${bg}" stroke="${border}" stroke-width="${borderW}"/>
  ${retroEl}${inner}${children}
</svg>`
}

// ─── Badge generators ────────────────────────────────────────────────────────

function subdomainBadgeSvg(subdomain: string, label: string, theme: Theme, notFound: boolean): string {
  type C = { bg: string; bd: string; sun: string; lbl: string; val: string; sfx: string; shadow: string | null }
  const palette: Record<string, C> = {
    dark:     { bg: '#0D0D0D', bd: '#F5C800', sun: '#F5C800', lbl: '#666',    val: '#F5C800', sfx: '#777',    shadow: 'rgba(245,200,0,0.2)' },
    gold:     { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', lbl: '#7a6000', val: '#0D0D0D', sfx: '#9a8020', shadow: '#0D0D0D'            },
    light:    { bg: '#FAFAF5', bd: '#0D0D0D', sun: '#F5C800', lbl: '#999',    val: '#0D0D0D', sfx: '#bbb',    shadow: 'rgba(0,0,0,0.12)'   },
    outlined: { bg: 'transparent', bd: '#F5C800', sun: '#F5C800', lbl: '#666', val: '#F5C800', sfx: '#777',   shadow: null                  },
  }
  const c = palette[theme] ?? palette['dark']!

  const H = 56
  const sunSize = 24
  const shadowOff = c.retro ? 6 : 4
  const PAD = 12
  const sunCx = PAD + sunSize / 2
  const sunCy = H / 2
  const sepX = PAD + sunSize + 8
  const textX = sepX + 8
  const eyebrowY = H / 2 - 4
  const mainY    = H / 2 + 12

  const contentW = notFound
    ? pw('not found', 8)
    : Math.max(mw(label, 10), pw(subdomain, 8) + mw('.is-pinoy.dev', 12))
  const W = textX + contentW + PAD

  const sun = pixelSun(sunCx, sunCy, sunSize, notFound ? '#444' : c.sun)
  const sep = `<line x1="${sepX}" y1="8" x2="${sepX}" y2="${H - 8}" stroke="#2a2a2a" stroke-width="1"/>`

  const content = notFound
    ? `<text x="${textX}" y="${H / 2 + 4}" font-family="'Press Start 2P',monospace" font-size="8" fill="#444">not found</text>`
    : `<text x="${textX}" y="${eyebrowY}" font-family="'IBM Plex Mono',monospace" font-size="10" fill="${c.lbl}" letter-spacing="0.5">${label}</text>
  <text x="${textX}" y="${mainY}" font-family="'Press Start 2P',monospace" font-size="8" fill="${c.val}">${subdomain}<tspan font-family="'IBM Plex Mono',monospace" font-size="12" fill="${c.sfx}">.is-pinoy.dev</tspan></text>`

  return badge(W, H, c.bg, c.bd, 2, c.shadow, shadowOff, sun + sep, false, content)
}

function memberSvg(subdomain: string, theme: Theme, notFound: boolean): string {
  type C = { bg: string; bd: string; sun: string; brand: string; divider: string; handle: string; shadow: string | null }
  const palette: Record<string, C> = {
    dark:     { bg: '#0D0D0D', bd: '#333',    sun: '#F5C800', brand: '#F5C800', divider: '#222',            handle: '#777',    shadow: '#333'              },
    gold:     { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', brand: '#0D0D0D', divider: 'rgba(0,0,0,0.2)', handle: '#7a6000', shadow: '#0D0D0D'           },
    light:    { bg: '#FAFAF5', bd: '#0D0D0D', sun: '#F5C800', brand: '#0D0D0D', divider: '#ddd',            handle: '#555',    shadow: 'rgba(0,0,0,0.12)' },
    outlined: { bg: 'transparent', bd: '#F5C800', sun: '#F5C800', brand: '#F5C800', divider: '#333',        handle: '#888',    shadow: null                },
  }
  const c = palette[theme] ?? palette['dark']!

  const H = 36
  const sunSize = 16
  const shadowOff = 3
  const PAD = 10
  const sunCx = PAD + sunSize / 2
  const sunCy = H / 2
  const brandX = PAD + sunSize + 7
  const brandW = mw('is-pinoy.dev', 10)
  const divX = brandX + brandW + 7
  const handleX = divX + 7
  const textY = H / 2 + 4

  const W = notFound
    ? brandX + mw('not found', 10) + PAD
    : handleX + mw(subdomain, 10) + PAD

  const sun = pixelSun(sunCx, sunCy, sunSize, notFound ? '#444' : c.sun)

  const content = notFound
    ? `<text x="${brandX}" y="${textY}" font-family="'IBM Plex Mono',monospace" font-size="10" fill="#444">not found</text>`
    : `<text x="${brandX}" y="${textY}" font-family="'IBM Plex Mono',monospace" font-size="10" fill="${c.brand}">is-pinoy.dev</text>
  <rect x="${divX}" y="${H / 2 - 5}" width="1" height="10" fill="${c.divider}"/>
  <text x="${handleX}" y="${textY}" font-family="'IBM Plex Mono',monospace" font-size="10" fill="${c.handle}">${subdomain}</text>`

  return badge(W, H, c.bg, c.bd, 1, c.shadow, shadowOff, sun, false, content)
}

function certifiedSvg(theme: Theme): string {
  type C = { bg: string; bd: string; sun: string; eyebrow: string; main: string; shadow: string | null }
  const palette: Record<string, C> = {
    dark:     { bg: '#0D0D0D', bd: '#F5C800', sun: '#F5C800', eyebrow: '#555',    main: '#F5C800', shadow: 'rgba(245,200,0,0.2)' },
    gold:     { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', eyebrow: '#7a6000', main: '#0D0D0D', shadow: '#0D0D0D'            },
    light:    { bg: '#FAFAF5', bd: '#0D0D0D', sun: '#F5C800', eyebrow: '#999',    main: '#0D0D0D', shadow: 'rgba(0,0,0,0.12)'  },
    outlined: { bg: 'transparent', bd: '#F5C800', sun: '#F5C800', eyebrow: '#666', main: '#F5C800', shadow: null               },
  }
  const c = palette[theme] ?? palette['gold']!

  const H = 56
  const sunSize = 26
  const shadowOff = 4
  const PAD = 12
  const sunCx = PAD + sunSize / 2
  const sunCy = H / 2
  const textX = PAD + sunSize + 10
  const eyebrowY = H / 2 - 4
  const mainY    = H / 2 + 12

  const contentW = Math.max(mw('// CERTIFIED', 10), pw('PINOY DEV', 10))
  const W = textX + contentW + PAD

  const sun = pixelSun(sunCx, sunCy, sunSize, c.sun)

  const content = `<text x="${textX}" y="${eyebrowY}" font-family="'IBM Plex Mono',monospace" font-size="10" fill="${c.eyebrow}" letter-spacing="0.5">// CERTIFIED</text>
  <text x="${textX}" y="${mainY}" font-family="'Press Start 2P',monospace" font-size="10" fill="${c.main}">PINOY DEV</text>`

  return badge(W, H, c.bg, c.bd, 2, c.shadow, shadowOff, sun, false, content)
}

function pinoyMadeSvg(theme: Theme): string {
  type C = { bg: string; bd: string; sun: string; text: string; shadow: string | null }
  const palette: Record<string, C> = {
    dark:     { bg: '#0D0D0D', bd: '#333',    sun: '#F5C800', text: '#FAFAF5', shadow: '#333'              },
    gold:     { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', text: '#0D0D0D', shadow: '#0D0D0D'           },
    light:    { bg: '#FAFAF5', bd: '#0D0D0D', sun: '#F5C800', text: '#0D0D0D', shadow: 'rgba(0,0,0,0.12)' },
    outlined: { bg: 'transparent', bd: '#F5C800', sun: '#F5C800', text: '#F5C800', shadow: null           },
  }
  const c = palette[theme] ?? palette['dark']!

  const H = 44
  const sunSize = 20
  const shadowOff = 4
  const PAD = 12
  const FS = 9
  const sunCx = PAD + sunSize / 2
  const textX = PAD + sunSize + 10
  const W = textX + pw('PINOY-MADE', FS) + PAD

  const sun = pixelSun(sunCx, H / 2, sunSize, c.sun)
  const content = `<text x="${textX}" y="${H / 2 + 4}" font-family="'Press Start 2P',monospace" font-size="${FS}" fill="${c.text}">PINOY-MADE</text>`

  return badge(W, H, c.bg, c.bd, 2, c.shadow, shadowOff, sun, false, content)
}

// ─── Banner generators ───────────────────────────────────────────────────────

function readmeBannerSvg(subdomain: string, theme: Theme): string {
  type C = { bg: string; bd: string; sun: string; eyebrow: string; val: string; sfx: string; subByLbl: string; subByVal: string; shadow: string }
  const palette: Record<string, C> = {
    dark: { bg: '#0D0D0D', bd: '#F5C800', sun: '#F5C800', eyebrow: '#666', val: '#F5C800', sfx: '#888', subByLbl: '#333', subByVal: '#666', shadow: '#C49A00' },
    gold: { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', eyebrow: '#7a6000', val: '#0D0D0D', sfx: '#9a8020', subByLbl: '#7a6000', subByVal: '#0D0D0D', shadow: '#0D0D0D' },
  }
  const c = palette[theme] ?? palette['dark']!

  const W = 640
  const H = 88
  const shadowOff = 6
  const sunSize = 44
  const PAD = 24
  const sunCx = PAD + sunSize / 2
  const sunCy = H / 2
  const textX = PAD + sunSize + 14
  const eyebrowY = H / 2 - 8
  const mainY    = H / 2 + 10
  const rightX = W - PAD
  const sun = pixelSun(sunCx, sunCy, sunSize, c.sun)
  const sep = `<line x1="${PAD + sunSize + 6}" y1="10" x2="${PAD + sunSize + 6}" y2="${H - 10}" stroke="#2a2a2a" stroke-width="1"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W + shadowOff}" height="${H + shadowOff}">
  <defs><style>${fontFaceStyles()}</style></defs>
  <rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="${c.shadow}"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="${c.bg}" stroke="${c.bd}" stroke-width="2"/>
  ${sun}${sep}
  <text x="${textX}" y="${eyebrowY}" font-family="'IBM Plex Mono',monospace" font-size="10" fill="${c.eyebrow}" letter-spacing="0.5">BUILT BY</text>
  <text x="${textX}" y="${mainY}" font-family="'Press Start 2P',monospace" font-size="12" fill="${c.val}">${subdomain}<tspan font-family="'IBM Plex Mono',monospace" font-size="12" fill="${c.sfx}">.is-pinoy.dev</tspan></text>
  <text x="${rightX}" y="${H / 2 - 4}" font-family="'IBM Plex Mono',monospace" font-size="10" fill="${c.subByLbl}" text-anchor="end" letter-spacing="0.5">SUBDOMAIN BY</text>
  <text x="${rightX}" y="${H / 2 + 12}" font-family="'Press Start 2P',monospace" font-size="8" fill="${c.subByVal}" text-anchor="end">is-pinoy.dev</text>
</svg>`
}

function profileBannerSvg(subdomain: string, theme: Theme): string {
  type C = { bg: string; bd: string; sun: string; eyebrow: string; main: string; tagline: string; shadow: string | null }
  const palette: Record<string, C> = {
    gold: { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', eyebrow: '#7a6000', main: '#0D0D0D', tagline: '#7a6000', shadow: '#0D0D0D' },
    dark: { bg: '#0D0D0D', bd: '#F5C800', sun: '#F5C800', eyebrow: '#444',    main: '#F5C800', tagline: '#555',    shadow: null },
  }
  const c = palette[theme] ?? palette['gold']!

  const W = 720
  const H = 120
  const shadowOff = 6
  const sunSize = 52
  const PAD = 32
  const sunCx = PAD + sunSize / 2
  const sunCy = H / 2
  const textX = PAD + sunSize + 20
  const eyebrowY = H / 2 - 20
  const mainY    = H / 2 + 4
  const taglineY = H / 2 + 20

  const shadowEl = c.shadow
    ? `<rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="${c.shadow}"/>`
    : ''
  const sun = pixelSun(sunCx, sunCy, sunSize, c.sun)

  const scanlines = `<defs>
    <pattern id="sl" x="0" y="0" width="1" height="4" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="1" height="2" fill="rgba(0,0,0,0.04)"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#sl)"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W + (c.shadow ? shadowOff : 0)}" height="${H + (c.shadow ? shadowOff : 0)}">
  <defs><style>${fontFaceStyles()}</style></defs>
  ${shadowEl}
  <rect x="0" y="0" width="${W}" height="${H}" fill="${c.bg}" stroke="${c.bd}" stroke-width="2"/>
  ${scanlines}
  ${sun}
  <text x="${textX}" y="${eyebrowY}" font-family="'IBM Plex Mono',monospace" font-size="8" fill="${c.eyebrow}" letter-spacing="0.5">// PINOY DEV AT LARGE</text>
  <text x="${textX}" y="${mainY}" font-family="'Press Start 2P',monospace" font-size="13" fill="${c.main}">${subdomain}.is-pinoy.dev</text>
  <text x="${textX}" y="${taglineY}" font-family="'IBM Plex Mono',monospace" font-size="10" fill="${c.tagline}">Building on the free subdomain network for Filipino developers.</text>
</svg>`
}

// ─── Main exported functions ─────────────────────────────────────────────────

export function generateBadgeSvg(opts: BadgeOptions): string {
  const { subdomain, type, theme, notFound, label } = opts
  switch (type) {
    case 'subdomain':  return subdomainBadgeSvg(subdomain, label ?? DEFAULT_SUBDOMAIN_LABEL, theme, notFound)
    case 'member':     return memberSvg(subdomain, theme, notFound)
    case 'pinoy-made': return pinoyMadeSvg(theme)
    case 'certified':  return certifiedSvg(theme)
  }
}

export function generateBannerSvg(opts: BannerOptions): string {
  const { subdomain, type, theme } = opts
  switch (type) {
    case 'readme':   return readmeBannerSvg(subdomain, theme)
    case 'profile':  return profileBannerSvg(subdomain, theme)
  }
}
