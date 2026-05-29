import { PRESS_START_2P_WOFF2_BASE64, IBM_PLEX_MONO_WOFF2_BASE64 } from './font.ts'

export type BadgeVariant = 'default' | 'outline' | 'flat' | 'pixel'
export type PresetType = 'powered-by' | 'filipino-dev'
export type OutputFormat = 'svg' | 'png' | 'webp'

export interface BadgeOptions {
  subdomain: string
  variant: BadgeVariant
  notFound: boolean
}

interface VariantStyle {
  bg: string
  stroke: string | null
  shadow: string | null
  sunColor: string
  textColor: string
  eyebrowColor: string
  separatorColor: string
}

// Design tokens from DESIGN.md
const STYLES: Record<BadgeVariant, VariantStyle> = {
  default: {
    bg: '#0D0D0D',
    stroke: '#F5C800',
    shadow: '#000000',
    sunColor: '#F5C800',
    textColor: '#FAFAF5',
    eyebrowColor: '#888888',
    separatorColor: '#444444',
  },
  pixel: {
    bg: '#0D0D0D',
    stroke: '#F5C800',
    // Gold-dark shadow for the retro/pixel double-depth effect
    shadow: '#D4A800',
    sunColor: '#F5C800',
    textColor: '#FAFAF5',
    eyebrowColor: '#888888',
    separatorColor: '#444444',
  },
  flat: {
    bg: '#F5C800',
    stroke: '#0D0D0D',
    shadow: null,
    sunColor: '#0D0D0D',
    textColor: '#0D0D0D',
    eyebrowColor: '#6b5200',
    separatorColor: '#0D0D0D',
  },
  outline: {
    bg: 'transparent',
    stroke: '#F5C800',
    shadow: null,
    sunColor: '#F5C800',
    textColor: '#F5C800',
    eyebrowColor: '#888888',
    separatorColor: '#444444',
  },
}

function fontFaceStyles(): string {
  return (
    `@font-face{font-family:'Press Start 2P';src:url('data:font/woff2;base64,${PRESS_START_2P_WOFF2_BASE64}') format('woff2');}` +
    `@font-face{font-family:'IBM Plex Mono';src:url('data:font/woff2;base64,${IBM_PLEX_MONO_WOFF2_BASE64}') format('woff2');}`
  )
}

// 8-ray pixel sun: 4 crossing rects at 0/45/90/135° on a shared center point
function pixelSun(cx: number, cy: number, size: number, color: string): string {
  const hw = Math.ceil(size * 0.14)
  return [0, 45, 90, 135]
    .map(a =>
      `<rect x="${cx - hw}" y="${cy - Math.floor(size / 2)}" width="${hw * 2}" height="${size}" fill="${color}" transform="rotate(${a},${cx},${cy})"/>`
    )
    .join('')
}

export function generateBadgeSvg(opts: BadgeOptions): string {
  const { subdomain, variant, notFound } = opts
  const s = STYLES[variant]

  const shadowRect = s.shadow
    ? `<rect x="5" y="5" width="280" height="56" fill="${s.shadow}"/>`
    : ''
  const strokeAttr = s.stroke ? `stroke="${s.stroke}" stroke-width="2"` : ''

  const sun = pixelSun(22, 28, 24, notFound ? '#444444' : s.sunColor)

  if (notFound) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="284" height="60">
  <defs><style>${fontFaceStyles()}</style></defs>
  ${shadowRect}
  <rect x="0" y="0" width="280" height="56" fill="${s.bg}" ${strokeAttr}/>
  ${sun}
  <line x1="44" y1="6" x2="44" y2="50" stroke="${s.separatorColor}" stroke-width="1"/>
  <text x="52" y="33" font-family="'Press Start 2P',monospace" font-size="8" fill="#888888">not found</text>
</svg>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="284" height="60">
  <defs><style>${fontFaceStyles()}</style></defs>
  ${shadowRect}
  <rect x="0" y="0" width="280" height="56" fill="${s.bg}" ${strokeAttr}/>
  ${sun}
  <line x1="44" y1="6" x2="44" y2="50" stroke="${s.separatorColor}" stroke-width="1"/>
  <text x="52" y="19" font-family="'IBM Plex Mono',monospace" font-size="7" fill="${s.eyebrowColor}">DEPLOYED ON</text>
  <text x="52" y="38" font-family="'Press Start 2P',monospace" font-size="8" fill="${s.textColor}">${subdomain}.is-pinoy.dev</text>
</svg>`
}

export function generatePresetSvg(type: PresetType, variant: BadgeVariant): string {
  const s = STYLES[variant]

  const shadowRect = s.shadow
    ? `<rect x="5" y="5" width="280" height="56" fill="${s.shadow}"/>`
    : ''
  const strokeAttr = s.stroke ? `stroke="${s.stroke}" stroke-width="2"` : ''
  const sun = pixelSun(22, 28, 24, s.sunColor)

  if (type === 'powered-by') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="284" height="60">
  <defs><style>${fontFaceStyles()}</style></defs>
  ${shadowRect}
  <rect x="0" y="0" width="280" height="56" fill="${s.bg}" ${strokeAttr}/>
  ${sun}
  <line x1="44" y1="6" x2="44" y2="50" stroke="${s.separatorColor}" stroke-width="1"/>
  <text x="52" y="19" font-family="'IBM Plex Mono',monospace" font-size="7" fill="${s.eyebrowColor}">BUILT WITH</text>
  <text x="52" y="38" font-family="'Press Start 2P',monospace" font-size="8" fill="${s.textColor}">is-pinoy.dev</text>
</svg>`
  }

  // filipino-dev → proud pinoy dev identity badge
  return `<svg xmlns="http://www.w3.org/2000/svg" width="284" height="60">
  <defs><style>${fontFaceStyles()}</style></defs>
  ${shadowRect}
  <rect x="0" y="0" width="280" height="56" fill="${s.bg}" ${strokeAttr}/>
  ${sun}
  <line x1="44" y1="6" x2="44" y2="50" stroke="${s.separatorColor}" stroke-width="1"/>
  <text x="52" y="19" font-family="'IBM Plex Mono',monospace" font-size="7" fill="${s.eyebrowColor}">PROUD</text>
  <text x="52" y="38" font-family="'Press Start 2P',monospace" font-size="8" fill="${s.textColor}">PINOY DEV</text>
</svg>`
}

export function generateBannerSvg(subdomain: string): string {
  const sun = pixelSun(50, 44, 44, '#F5C800')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="645" height="93">
  <defs>
    <style>${fontFaceStyles()}</style>
    <pattern id="sl" x="0" y="0" width="1" height="4" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="1" height="2" fill="rgba(0,0,0,0.05)"/>
    </pattern>
  </defs>
  <rect x="5" y="5" width="640" height="88" fill="#D4A800"/>
  <rect x="0" y="0" width="640" height="88" fill="#0D0D0D" stroke="#F5C800" stroke-width="2"/>
  <rect x="0" y="0" width="640" height="88" fill="url(#sl)"/>
  ${sun}
  <line x1="100" y1="8" x2="100" y2="80" stroke="#444444" stroke-width="1"/>
  <text x="116" y="30" font-family="'IBM Plex Mono',monospace" font-size="9" fill="#888888">SUBDOMAIN</text>
  <text x="116" y="54" font-family="'Press Start 2P',monospace" font-size="14" fill="#FAFAF5">${subdomain}.is-pinoy.dev</text>
  <text x="116" y="74" font-family="'IBM Plex Mono',monospace" font-size="9" fill="#888888">is-pinoy.dev — free subdomains for Filipino devs</text>
</svg>`
}
