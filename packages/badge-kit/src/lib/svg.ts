import { PRESS_START_2P_WOFF2_BASE64 } from './font.ts'

export type BadgeVariant = 'default' | 'outline' | 'flat' | 'pixel'
export type PresetType = 'powered-by' | 'filipino-dev'
export type OutputFormat = 'svg' | 'png' | 'webp'

export interface BadgeOptions {
  subdomain: string
  variant: BadgeVariant
  notFound: boolean
}

interface VariantStyle {
  background: string
  stroke: string | null
  shadow: string | null
  textColor: string
  separatorColor: string | null
}

const VARIANT_STYLES: Record<BadgeVariant, VariantStyle> = {
  default: {
    background: '#0D0D0D',
    stroke: '#F5C800',
    shadow: '#000000',
    textColor: '#FAFAF5',
    separatorColor: '#F5C800',
  },
  outline: {
    background: 'transparent',
    stroke: '#F5C800',
    shadow: null,
    textColor: '#F5C800',
    separatorColor: '#F5C800',
  },
  flat: {
    background: '#F5C800',
    stroke: null,
    shadow: null,
    textColor: '#0D0D0D',
    separatorColor: '#0D0D0D',
  },
  pixel: {
    background: '#0D0D0D',
    stroke: '#F5C800',
    shadow: '#F5C800',
    textColor: '#FAFAF5',
    separatorColor: '#F5C800',
  },
}

function fontFaceStyle(): string {
  return `<style>@font-face{font-family:'Press Start 2P';src:url('data:font/woff2;base64,${PRESS_START_2P_WOFF2_BASE64}') format('woff2');}</style>`
}

export function generateBadgeSvg(opts: BadgeOptions): string {
  const { subdomain, variant, notFound } = opts
  const style = VARIANT_STYLES[variant]
  const label = notFound ? 'not found' : `${subdomain}.is-pinoy.dev`
  const textColor = notFound ? '#888888' : style.textColor

  const shadowRect = style.shadow
    ? `<rect x="4" y="4" width="280" height="56" fill="${style.shadow}"/>`
    : ''

  const border = style.stroke
    ? `stroke="${style.stroke}" stroke-width="2"`
    : ''

  const separator = style.separatorColor
    ? `<line x1="42" y1="8" x2="42" y2="48" stroke="${style.separatorColor}" stroke-width="2"/>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="284" height="60">
  <defs>${fontFaceStyle()}</defs>
  ${shadowRect}
  <rect x="0" y="0" width="280" height="56" fill="${style.background}" ${border}/>
  ${separator}
  <text x="21" y="36" font-size="20" text-anchor="middle">🇵🇭</text>
  <text x="50" y="32" font-family="'Press Start 2P',monospace" font-size="7" fill="${textColor}">${label}</text>
</svg>`
}

export function generatePresetSvg(type: PresetType, variant: BadgeVariant): string {
  const style = VARIANT_STYLES[variant]

  const shadowRect = style.shadow
    ? `<rect x="4" y="4" width="280" height="56" fill="${style.shadow}"/>`
    : ''

  const border = style.stroke
    ? `stroke="${style.stroke}" stroke-width="2"`
    : ''

  const separator = style.separatorColor
    ? `<line x1="42" y1="8" x2="42" y2="48" stroke="${style.separatorColor}" stroke-width="2"/>`
    : ''

  const [line1, line2] =
    type === 'powered-by'
      ? ['Powered by', 'is-pinoy.dev']
      : ['🇵🇭', 'Filipino Dev']

  return `<svg xmlns="http://www.w3.org/2000/svg" width="284" height="60">
  <defs>${fontFaceStyle()}</defs>
  ${shadowRect}
  <rect x="0" y="0" width="280" height="56" fill="${style.background}" ${border}/>
  ${separator}
  <text x="21" y="36" font-size="20" text-anchor="middle">🇵🇭</text>
  <text x="50" y="26" font-family="'Press Start 2P',monospace" font-size="6" fill="${style.textColor}">${line1}</text>
  <text x="50" y="40" font-family="'Press Start 2P',monospace" font-size="7" fill="${style.textColor}">${line2}</text>
</svg>`
}

export function generateBannerSvg(subdomain: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="644" height="164">
  <defs>${fontFaceStyle()}</defs>
  <rect x="4" y="4" width="640" height="160" fill="#F5C800"/>
  <rect x="0" y="0" width="640" height="160" fill="#0D0D0D" stroke="#F5C800" stroke-width="2"/>
  <text x="40" y="70" font-family="'Press Start 2P',monospace" font-size="32" fill="#F5C800">🇵🇭</text>
  <text x="40" y="104" font-family="'Press Start 2P',monospace" font-size="14" fill="#FAFAF5">${subdomain}.is-pinoy.dev</text>
  <text x="40" y="128" font-family="'Press Start 2P',monospace" font-size="8" fill="#888888">is-pinoy.dev — free subdomains for Filipino devs</text>
</svg>`
}
