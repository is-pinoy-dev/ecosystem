import { PRESS_START_2P_WOFF2_BASE64, IBM_PLEX_MONO_WOFF2_BASE64 } from './font.ts'

// ─── Public types ──────────────────────────────────────────────────────────────

export type BadgeType =
  | 'deployed-on'
  | 'built-by'
  | 'proud-pinoy-dev'
  | 'certified'
  | 'member'
  | 'pinoy-made'

export type BannerType = 'readme' | 'profile'

export type Theme = 'dark' | 'gold' | 'light' | 'outlined' | 'retro' | 'split'

export type OutputFormat = 'svg' | 'png' | 'webp'

export interface BadgeOptions {
  subdomain: string // ignored for pinoy-made
  type: BadgeType
  theme: Theme
  notFound: boolean // when subdomain not registered, show grayed-out state
}

export interface BannerOptions {
  subdomain: string
  type: BannerType
  theme: Theme
}

// ─── Default / valid themes ─────────────────────────────────────────────────

export const DEFAULT_BADGE_THEME: Record<BadgeType, Theme> = {
  'deployed-on': 'dark',
  'pinoy-made': 'split',
  'built-by': 'dark',
  'proud-pinoy-dev': 'dark',
  certified: 'gold',
  member: 'dark',
}

export const DEFAULT_BANNER_THEME: Record<BannerType, Theme> = {
  readme: 'dark',
  profile: 'gold',
}

export const VALID_BADGE_THEMES: Record<BadgeType, Theme[]> = {
  'deployed-on': ['dark', 'light', 'gold', 'retro'],
  'pinoy-made': ['split', 'dark', 'gold'],
  'built-by': ['dark', 'gold', 'outlined'],
  'proud-pinoy-dev': ['dark', 'gold', 'outlined'],
  certified: ['gold', 'retro', 'dark'],
  member: ['dark', 'gold', 'outlined'],
}

export const VALID_BANNER_THEMES: Record<BannerType, Theme[]> = {
  readme: ['dark', 'gold'],
  profile: ['gold', 'dark'],
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function fontFaceStyles(): string {
  return (
    `@font-face{font-family:'Press Start 2P';src:url('data:font/woff2;base64,${PRESS_START_2P_WOFF2_BASE64}') format('woff2');}` +
    `@font-face{font-family:'IBM Plex Mono';src:url('data:font/woff2;base64,${IBM_PLEX_MONO_WOFF2_BASE64}') format('woff2');}`
  )
}

/**
 * Renders a pixel sun as a <g> element positioned so its centre is at (cx, cy)
 * and its bounding box is size×size. Matches the HTML mockup's sunSVG function:
 * 8 rays at 0/45/90/135/180/225/270/315 degrees on a 100×100 viewBox.
 */
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

// ─── Badge generators ────────────────────────────────────────────────────────

function deployedOnSvg(subdomain: string, theme: Theme, notFound: boolean): string {
  type C = {
    bg: string
    bd: string
    sun: string
    lbl: string
    val: string
    sfx: string
    shadow: string | null
    retro: boolean
  }
  const palette: Record<string, C> = {
    dark: {
      bg: '#0D0D0D',
      bd: '#F5C800',
      sun: '#F5C800',
      lbl: '#888',
      val: '#F5C800',
      sfx: '#555',
      shadow: 'rgba(245,200,0,0.25)',
      retro: false,
    },
    light: {
      bg: '#FAFAF5',
      bd: '#0D0D0D',
      sun: '#F5C800',
      lbl: '#888',
      val: '#0D0D0D',
      sfx: '#aaa',
      shadow: 'rgba(0,0,0,0.15)',
      retro: false,
    },
    gold: {
      bg: '#F5C800',
      bd: '#0D0D0D',
      sun: '#0D0D0D',
      lbl: '#6b5200',
      val: '#0D0D0D',
      sfx: '#6b5200',
      shadow: '#0D0D0D',
      retro: false,
    },
    retro: {
      bg: '#0D0D0D',
      bd: '#F5C800',
      sun: '#F5C800',
      lbl: '#888',
      val: '#F5C800',
      sfx: '#555',
      shadow: '#D4A800',
      retro: true,
    },
  }
  const c = palette[theme] ?? palette['dark']!

  const W = 315
  const H = 60
  const sunSize = 28
  const shadowOff = c.retro ? 8 : 5
  const totalW = W + shadowOff
  const totalH = H + shadowOff

  const sunCx = 18 + sunSize / 2
  const sunCy = H / 2
  const sepX = 18 + sunSize + 10
  const textX = sepX + 14
  const eyebrowY = H / 2 - 8
  const mainY = H / 2 + 10

  const notFoundSunColor = '#444'
  const notFoundTextColor = '#555'

  let shadowEl = ''
  if (c.shadow) {
    shadowEl = `<rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="${c.shadow}"/>`
  }

  let retroInner = ''
  if (c.retro) {
    retroInner = `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" stroke="#0D0D0D" stroke-width="3" fill="none"/>`
  }

  const sun = pixelSun(sunCx, sunCy, sunSize, notFound ? notFoundSunColor : c.sun)

  let content: string
  if (notFound) {
    content = `
  <text x="${textX}" y="${H / 2 + 4}" font-family="'Press Start 2P',monospace" font-size="8" fill="${notFoundTextColor}">not found</text>`
  } else {
    // Blink dot: 6×6 at right edge, y centred
    const blinkX = W - 14
    const blinkY = H / 2 - 3
    content = `
  <text x="${textX}" y="${eyebrowY}" font-family="'IBM Plex Mono',monospace" font-size="7" fill="${c.lbl}" text-anchor="start">DEPLOYED ON</text>
  <text x="${textX}" y="${mainY}" font-family="'Press Start 2P',monospace" font-size="10" fill="${c.val}" text-anchor="start">${subdomain}<tspan font-size="7" fill="${c.sfx}">.is-pinoy.dev</tspan></text>
  <rect x="${blinkX}" y="${blinkY}" width="6" height="6" fill="${c.bd}"/>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
  <defs><style>${fontFaceStyles()}</style></defs>
  ${shadowEl}
  <rect x="0" y="0" width="${W}" height="${H}" fill="${c.bg}" stroke="${c.bd}" stroke-width="3"/>
  ${retroInner}
  ${sun}
  <line x1="${sepX}" y1="8" x2="${sepX}" y2="${H - 8}" stroke="#333" stroke-width="1"/>
  ${content}
</svg>`
}

function pinoyMadeSvg(theme: Theme): string {
  if (theme === 'split') {
    const leftW = 52 // padding 10+14 each side + sun 24 = 52
    const rightW = 158 // padding 10+18 each side + text ~122
    const W = leftW + rightW
    const H = 52
    const shadowOff = 5
    const totalW = W + shadowOff
    const totalH = H + shadowOff
    const sunCx = leftW / 2
    const sunCy = H / 2
    const sun = pixelSun(sunCx, sunCy, 24, '#F5C800')
    const textX = leftW + 18
    const textY = H / 2 + 4
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
  <defs><style>${fontFaceStyles()}</style></defs>
  <rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="#D4A800"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#F5C800" stroke="#F5C800" stroke-width="3"/>
  <rect x="0" y="0" width="${leftW}" height="${H}" fill="#0D0D0D"/>
  <line x1="${leftW}" y1="0" x2="${leftW}" y2="${H}" stroke="#F5C800" stroke-width="3"/>
  ${sun}
  <text x="${textX}" y="${textY}" font-family="'Press Start 2P',monospace" font-size="11" fill="#0D0D0D" text-anchor="start">PINOY-MADE</text>
</svg>`
  }

  if (theme === 'gold') {
    const W = 200
    const H = 50
    const shadowOff = 5
    const totalW = W + shadowOff
    const totalH = H + shadowOff
    const sunCx = 18 + 12
    const sunCy = H / 2
    const sun = pixelSun(sunCx, sunCy, 24, '#0D0D0D')
    const textX = 18 + 24 + 12
    const textY = H / 2 + 4
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
  <defs><style>${fontFaceStyles()}</style></defs>
  <rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="#0D0D0D"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#F5C800" stroke="#0D0D0D" stroke-width="3"/>
  ${sun}
  <text x="${textX}" y="${textY}" font-family="'Press Start 2P',monospace" font-size="11" fill="#0D0D0D" text-anchor="start">PINOY-MADE</text>
</svg>`
  }

  // dark (default)
  const W = 200
  const H = 50
  const shadowOff = 5
  const totalW = W + shadowOff
  const totalH = H + shadowOff
  const sunCx = 18 + 12
  const sunCy = H / 2
  const sun = pixelSun(sunCx, sunCy, 24, '#F5C800')
  const textX = 18 + 24 + 12
  const textY = H / 2 + 4
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
  <defs><style>${fontFaceStyles()}</style></defs>
  <rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="#444"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#0D0D0D" stroke="#444" stroke-width="3"/>
  ${sun}
  <text x="${textX}" y="${textY}" font-family="'Press Start 2P',monospace" font-size="11" fill="#FAFAF5" text-anchor="start">PINOY-MADE</text>
</svg>`
}

function builtBySvg(subdomain: string, theme: Theme, notFound: boolean): string {
  type C = { bg: string; bd: string; sun: string; lbl: string; val: string; sfx: string; shadow: string | null }
  const palette: Record<string, C> = {
    dark: { bg: '#0D0D0D', bd: '#F5C800', sun: '#F5C800', lbl: '#888', val: '#F5C800', sfx: '#555', shadow: 'rgba(245,200,0,0.25)' },
    gold: { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', lbl: '#6b5200', val: '#0D0D0D', sfx: '#6b5200', shadow: '#0D0D0D' },
    outlined: { bg: 'transparent', bd: '#F5C800', sun: '#F5C800', lbl: '#888', val: '#F5C800', sfx: '#555', shadow: null },
  }
  const c = palette[theme] ?? palette['dark']!

  const W = 315
  const H = 60
  const sunSize = 28
  const shadowOff = 5
  const totalW = c.shadow ? W + shadowOff : W
  const totalH = c.shadow ? H + shadowOff : H

  const sunCx = 18 + sunSize / 2
  const sunCy = H / 2
  const sepX = 18 + sunSize + 10
  const textX = sepX + 14
  const eyebrowY = H / 2 - 8
  const mainY = H / 2 + 10

  let shadowEl = ''
  if (c.shadow) {
    shadowEl = `<rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="${c.shadow}"/>`
  }

  const sun = pixelSun(sunCx, sunCy, sunSize, notFound ? '#444' : c.sun)

  let content: string
  if (notFound) {
    content = `<text x="${textX}" y="${H / 2 + 4}" font-family="'Press Start 2P',monospace" font-size="8" fill="#555">not found</text>`
  } else {
    content = `
  <text x="${textX}" y="${eyebrowY}" font-family="'IBM Plex Mono',monospace" font-size="7" fill="${c.lbl}" text-anchor="start">BUILT BY A PINOY DEV</text>
  <text x="${textX}" y="${mainY}" font-family="'Press Start 2P',monospace" font-size="10" fill="${c.val}" text-anchor="start">${subdomain}<tspan font-size="7" fill="${c.sfx}">.is-pinoy.dev</tspan></text>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
  <defs><style>${fontFaceStyles()}</style></defs>
  ${shadowEl}
  <rect x="0" y="0" width="${W}" height="${H}" fill="${c.bg}" stroke="${c.bd}" stroke-width="3"/>
  ${sun}
  <line x1="${sepX}" y1="8" x2="${sepX}" y2="${H - 8}" stroke="#333" stroke-width="1"/>
  ${content}
</svg>`
}

function proudPinoyDevSvg(subdomain: string, theme: Theme, notFound: boolean): string {
  type C = { bg: string; bd: string; sun: string; main: string; handle: string; shadow: string | null }
  const palette: Record<string, C> = {
    dark: { bg: '#0D0D0D', bd: '#F5C800', sun: '#F5C800', main: '#FAFAF5', handle: '#888', shadow: 'rgba(245,200,0,0.25)' },
    gold: { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', main: '#0D0D0D', handle: '#6b5200', shadow: '#0D0D0D' },
    outlined: { bg: 'transparent', bd: '#F5C800', sun: '#F5C800', main: '#F5C800', handle: '#555', shadow: null },
  }
  const c = palette[theme] ?? palette['dark']!

  const W = 310
  const H = 64
  const sunSize = 30
  const shadowOff = 5
  const totalW = c.shadow ? W + shadowOff : W
  const totalH = c.shadow ? H + shadowOff : H

  const sunCx = 18 + sunSize / 2
  const sunCy = H / 2
  const textX = 18 + sunSize + 14
  const line1Y = H / 2 - 6
  const line2Y = H / 2 + 12

  let shadowEl = ''
  if (c.shadow) {
    shadowEl = `<rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="${c.shadow}"/>`
  }

  const sun = pixelSun(sunCx, sunCy, sunSize, notFound ? '#444' : c.sun)

  let content: string
  if (notFound) {
    content = `<text x="${textX}" y="${H / 2 + 4}" font-family="'Press Start 2P',monospace" font-size="8" fill="#555">not found</text>`
  } else {
    content = `
  <text x="${textX}" y="${line1Y}" font-family="'Press Start 2P',monospace" font-size="10" fill="${c.main}" text-anchor="start">PROUD PINOY DEV</text>
  <text x="${textX}" y="${line2Y}" font-family="'IBM Plex Mono',monospace" font-size="11" fill="${c.handle}" text-anchor="start">${subdomain}.is-pinoy.dev</text>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
  <defs><style>${fontFaceStyles()}</style></defs>
  ${shadowEl}
  <rect x="0" y="0" width="${W}" height="${H}" fill="${c.bg}" stroke="${c.bd}" stroke-width="3"/>
  ${sun}
  ${content}
</svg>`
}

function certifiedSvg(subdomain: string, theme: Theme, notFound: boolean): string {
  type C = { bg: string; bd: string; sun: string; eyebrow: string; main: string; handle: string; shadow: string | null; retro: boolean }
  const palette: Record<string, C> = {
    gold: { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', eyebrow: '#6b5200', main: '#0D0D0D', handle: '#6b5200', shadow: '#0D0D0D', retro: false },
    retro: { bg: '#F5C800', bd: '#0D0D0D', sun: '#0D0D0D', eyebrow: '#6b5200', main: '#0D0D0D', handle: '#6b5200', shadow: '#0D0D0D', retro: true },
    dark: { bg: '#0D0D0D', bd: '#F5C800', sun: '#F5C800', eyebrow: '#555', main: '#F5C800', handle: '#888', shadow: '#D4A800', retro: false },
  }
  const c = palette[theme] ?? palette['gold']!

  const W = 310
  const H = 76
  const sunSize = 34
  const shadowOff = c.retro ? 8 : 5
  const totalW = W + shadowOff
  const totalH = H + shadowOff

  const sunCx = 18 + sunSize / 2
  const sunCy = H / 2
  const textX = 18 + sunSize + 16
  const eyebrowY = H / 2 - 16
  const mainY = H / 2 + 2
  const handleY = H / 2 + 18

  let retroInner = ''
  if (c.retro) {
    retroInner = `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" stroke="#0D0D0D" stroke-width="3" fill="none"/>`
  }

  const shadowEl = `<rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="${c.shadow}"/>`
  const sun = pixelSun(sunCx, sunCy, sunSize, notFound ? '#444' : c.sun)

  let content: string
  if (notFound) {
    content = `<text x="${textX}" y="${H / 2 + 4}" font-family="'Press Start 2P',monospace" font-size="8" fill="#555">not found</text>`
  } else {
    content = `
  <text x="${textX}" y="${eyebrowY}" font-family="'IBM Plex Mono',monospace" font-size="7" fill="${c.eyebrow}" text-anchor="start">// CERTIFIED</text>
  <text x="${textX}" y="${mainY}" font-family="'Press Start 2P',monospace" font-size="12" fill="${c.main}" text-anchor="start">PINOY DEV</text>
  <text x="${textX}" y="${handleY}" font-family="'IBM Plex Mono',monospace" font-size="11" fill="${c.handle}" text-anchor="start">${subdomain}.is-pinoy.dev</text>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
  <defs><style>${fontFaceStyles()}</style></defs>
  ${shadowEl}
  <rect x="0" y="0" width="${W}" height="${H}" fill="${c.bg}" stroke="${c.bd}" stroke-width="3"/>
  ${retroInner}
  ${sun}
  ${content}
</svg>`
}

function memberSvg(subdomain: string, theme: Theme, notFound: boolean): string {
  type C = { bg: string; bd: string; bdW: number; sun: string; brand: string; divider: string; handle: string; shadow: string | null }
  const palette: Record<string, C> = {
    dark: { bg: '#0D0D0D', bd: '#444', bdW: 2, sun: '#F5C800', brand: '#F5C800', divider: '#2A2A2A', handle: '#888', shadow: '#444' },
    gold: { bg: '#F5C800', bd: '#0D0D0D', bdW: 2, sun: '#0D0D0D', brand: '#0D0D0D', divider: 'rgba(0,0,0,0.25)', handle: '#6b5200', shadow: '#0D0D0D' },
    outlined: { bg: 'transparent', bd: '#F5C800', bdW: 2, sun: '#F5C800', brand: '#F5C800', divider: '#333', handle: '#888', shadow: null },
  }
  const c = palette[theme] ?? palette['dark']!

  const W = 200
  const H = 38
  const sunSize = 16
  const shadowOff = 3
  const totalW = c.shadow ? W + shadowOff : W
  const totalH = c.shadow ? H + shadowOff : H

  // Layout: 8px left pad | sun 16 | 8px gap | brand text | 8px gap | divider 1px | 8px gap | handle | 8px right pad
  const sunCx = 8 + sunSize / 2
  const sunCy = H / 2
  const brandX = 8 + sunSize + 8
  const dividerX = brandX + 68 // approx IBM Plex Mono 9.6px × 11 chars
  const handleX = dividerX + 10
  const textY = H / 2 + 4

  let shadowEl = ''
  if (c.shadow) {
    shadowEl = `<rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="${c.shadow}"/>`
  }

  const sun = pixelSun(sunCx, sunCy, sunSize, notFound ? '#444' : c.sun)

  let content: string
  if (notFound) {
    content = `<text x="${brandX}" y="${textY}" font-family="'IBM Plex Mono',monospace" font-size="9" fill="#555" text-anchor="start">not found</text>`
  } else {
    content = `
  <text x="${brandX}" y="${textY}" font-family="'IBM Plex Mono',monospace" font-size="9" fill="${c.brand}" text-anchor="start">is-pinoy.dev</text>
  <rect x="${dividerX}" y="${H / 2 - 6}" width="1" height="12" fill="${c.divider}"/>
  <text x="${handleX}" y="${textY}" font-family="'IBM Plex Mono',monospace" font-size="9" fill="${c.handle}" text-anchor="start">${subdomain}</text>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
  <defs><style>${fontFaceStyles()}</style></defs>
  ${shadowEl}
  <rect x="0" y="0" width="${W}" height="${H}" fill="${c.bg}" stroke="${c.bd}" stroke-width="${c.bdW}"/>
  ${sun}
  ${content}
</svg>`
}

// ─── Banner generators ───────────────────────────────────────────────────────

function readmeBannerSvg(subdomain: string, theme: Theme): string {
  type C = { bg: string; bd: string; sun: string; eyebrow: string; val: string; sfx: string; subByLbl: string; subByVal: string; shadow: string }
  const palette: Record<string, C> = {
    dark: {
      bg: '#0D0D0D',
      bd: '#F5C800',
      sun: '#F5C800',
      eyebrow: '#888',
      val: '#F5C800',
      sfx: '#555',
      subByLbl: '#444',
      subByVal: '#888',
      shadow: '#D4A800',
    },
    gold: {
      bg: '#F5C800',
      bd: '#0D0D0D',
      sun: '#0D0D0D',
      eyebrow: '#6b5200',
      val: '#0D0D0D',
      sfx: '#6b5200',
      subByLbl: '#6b5200',
      subByVal: '#0D0D0D',
      shadow: '#0D0D0D',
    },
  }
  const c = palette[theme] ?? palette['dark']!

  const W = 640
  const H = 88
  const shadowOff = 6
  const totalW = W + shadowOff
  const totalH = H + shadowOff
  const sunSize = 44

  const sunCx = 28 + sunSize / 2
  const sunCy = H / 2
  const textX = 28 + sunSize + 16
  const eyebrowY = H / 2 - 8
  const mainY = H / 2 + 10

  // Right column: "Subdomain by" + "is-pinoy.dev"
  const rightX = W - 28
  const rightLine1Y = H / 2 - 4
  const rightLine2Y = H / 2 + 14

  const sun = pixelSun(sunCx, sunCy, sunSize, c.sun)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
  <defs><style>${fontFaceStyles()}</style></defs>
  <rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="${c.shadow}"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="${c.bg}" stroke="${c.bd}" stroke-width="3"/>
  ${sun}
  <line x1="${28 + sunSize + 8}" y1="10" x2="${28 + sunSize + 8}" y2="${H - 10}" stroke="#333" stroke-width="1"/>
  <text x="${textX}" y="${eyebrowY}" font-family="'IBM Plex Mono',monospace" font-size="7" fill="${c.eyebrow}" text-anchor="start">BUILT BY A PINOY DEV</text>
  <text x="${textX}" y="${mainY}" font-family="'Press Start 2P',monospace" font-size="12" fill="${c.val}" text-anchor="start">${subdomain}<tspan font-size="8" fill="${c.sfx}">.is-pinoy.dev</tspan></text>
  <text x="${rightX}" y="${rightLine1Y}" font-family="'IBM Plex Mono',monospace" font-size="8" fill="${c.subByLbl}" text-anchor="end">SUBDOMAIN BY</text>
  <text x="${rightX}" y="${rightLine2Y}" font-family="'Press Start 2P',monospace" font-size="8" fill="${c.subByVal}" text-anchor="end">is-pinoy.dev</text>
</svg>`
}

function profileBannerSvg(subdomain: string, theme: Theme): string {
  type C = { bg: string; bd: string; sun: string; eyebrow: string; main: string; tagline: string; shadow: string | null }
  const palette: Record<string, C> = {
    gold: {
      bg: '#F5C800',
      bd: '#0D0D0D',
      sun: '#0D0D0D',
      eyebrow: '#6b5200',
      main: '#0D0D0D',
      tagline: '#6b5200',
      shadow: '#0D0D0D',
    },
    dark: {
      bg: '#0D0D0D',
      bd: '#F5C800',
      sun: '#F5C800',
      eyebrow: '#444',
      main: '#F5C800',
      tagline: '#555',
      shadow: null,
    },
  }
  const c = palette[theme] ?? palette['gold']!

  const W = 720
  const H = 120
  const shadowOff = 6
  const totalW = c.shadow ? W + shadowOff : W
  const totalH = c.shadow ? H + shadowOff : H
  const sunSize = 52

  const sunCx = 36 + sunSize / 2
  const sunCy = H / 2
  const textX = 36 + sunSize + 24
  const eyebrowY = H / 2 - 20
  const mainY = H / 2 + 4
  const taglineY = H / 2 + 22

  let shadowEl = ''
  if (c.shadow) {
    shadowEl = `<rect x="${shadowOff}" y="${shadowOff}" width="${W}" height="${H}" fill="${c.shadow}"/>`
  }

  const sun = pixelSun(sunCx, sunCy, sunSize, c.sun)

  // CRT scanlines pattern
  const scanlines = `
  <defs>
    <pattern id="sl" x="0" y="0" width="1" height="4" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="1" height="2" fill="rgba(0,0,0,0.05)"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#sl)"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
  <defs><style>${fontFaceStyles()}</style></defs>
  ${shadowEl}
  <rect x="0" y="0" width="${W}" height="${H}" fill="${c.bg}" stroke="${c.bd}" stroke-width="3"/>
  ${scanlines}
  ${sun}
  <text x="${textX}" y="${eyebrowY}" font-family="'IBM Plex Mono',monospace" font-size="8" fill="${c.eyebrow}" text-anchor="start">// PINOY DEV AT LARGE</text>
  <text x="${textX}" y="${mainY}" font-family="'Press Start 2P',monospace" font-size="14" fill="${c.main}" text-anchor="start">${subdomain}.is-pinoy.dev</text>
  <text x="${textX}" y="${taglineY}" font-family="'IBM Plex Mono',monospace" font-size="11" fill="${c.tagline}" text-anchor="start">Building on the free subdomain network for Filipino developers.</text>
</svg>`
}

// ─── Main exported functions ─────────────────────────────────────────────────

export function generateBadgeSvg(opts: BadgeOptions): string {
  const { subdomain, type, theme, notFound } = opts
  switch (type) {
    case 'deployed-on':
      return deployedOnSvg(subdomain, theme, notFound)
    case 'pinoy-made':
      return pinoyMadeSvg(theme)
    case 'built-by':
      return builtBySvg(subdomain, theme, notFound)
    case 'proud-pinoy-dev':
      return proudPinoyDevSvg(subdomain, theme, notFound)
    case 'certified':
      return certifiedSvg(subdomain, theme, notFound)
    case 'member':
      return memberSvg(subdomain, theme, notFound)
  }
}

export function generateBannerSvg(opts: BannerOptions): string {
  const { subdomain, type, theme } = opts
  switch (type) {
    case 'readme':
      return readmeBannerSvg(subdomain, theme)
    case 'profile':
      return profileBannerSvg(subdomain, theme)
  }
}
