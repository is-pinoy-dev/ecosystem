import { describe, it, expect } from 'vitest'
import { generateBadgeSvg, generateBannerSvg } from '../lib/svg.ts'

const NAVY = '#0B1F44'
const GOLD = '#F5C800'
const WHITE = '#FFFFFF'

describe('generateBadgeSvg — subdomain badge', () => {
  it('includes subdomain and domain in output', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'light', notFound: false })
    expect(svg).toContain('juan')
    expect(svg).toContain('.is-pinoy.dev')
  })

  it('uses default DEPLOYED ON label', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'light', notFound: false })
    expect(svg).toContain('DEPLOYED ON')
  })

  it('uses custom label when provided', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'light', notFound: false, label: 'BUILT BY' })
    expect(svg).toContain('BUILT BY')
  })

  it('shows not-found state without leaking the handle', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'light', notFound: true })
    expect(svg).toContain('not found')
    expect(svg).not.toContain('>juan<')
    expect(svg).not.toContain('juan.is-pinoy.dev')
  })

  it('dark theme has navy background and gold mark', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'dark', notFound: false })
    expect(svg).toContain(NAVY)
    expect(svg).toContain(GOLD)
  })

  it('gold theme has gold background', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'gold', notFound: false })
    expect(svg).toContain(`fill="${GOLD}"`)
  })

  it('light theme has a white surface', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'light', notFound: false })
    expect(svg).toContain(`fill="${WHITE}"`)
  })

  it('outlined theme has a transparent surface', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'outlined', notFound: false })
    expect(svg).toContain('fill="transparent"')
  })

  it('is valid XML (starts with <svg)', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'light', notFound: false })
    expect(svg.trim()).toMatch(/^<svg/)
  })

  it('escapes markup in the subdomain', () => {
    const svg = generateBadgeSvg({ subdomain: '<x>', type: 'subdomain', theme: 'light', notFound: false })
    expect(svg).not.toContain('<x>')
    expect(svg).toContain('&lt;x&gt;')
  })
})

describe('generateBadgeSvg — member badge', () => {
  it('light theme has brand and subdomain', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'member', theme: 'light', notFound: false })
    expect(svg).toContain('is-pinoy.dev')
    expect(svg).toContain('juan')
  })

  it('gold theme has gold background', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'member', theme: 'gold', notFound: false })
    expect(svg).toContain(`fill="${GOLD}"`)
  })

  it('outlined theme has a transparent surface', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'member', theme: 'outlined', notFound: false })
    expect(svg).toContain('fill="transparent"')
  })
})

describe('generateBadgeSvg — platform badges', () => {
  it('pinoy-made dark contains PINOY-MADE label', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'pinoy-made', theme: 'dark', notFound: false })
    expect(svg).toContain('PINOY-MADE')
    expect(svg).toContain(NAVY)
  })

  it('pinoy-made gold has gold background', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'pinoy-made', theme: 'gold', notFound: false })
    expect(svg).toContain(`fill="${GOLD}"`)
  })

  it('pinoy-made light has a white surface', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'pinoy-made', theme: 'light', notFound: false })
    expect(svg).toContain(`fill="${WHITE}"`)
  })

  it('pinoy-made outlined has a transparent surface', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'pinoy-made', theme: 'outlined', notFound: false })
    expect(svg).toContain('fill="transparent"')
  })

  it('certified gold has PINOY DEV and CERTIFIED labels', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'certified', theme: 'gold', notFound: false })
    expect(svg).toContain('PINOY DEV')
    expect(svg).toContain('CERTIFIED')
  })

  it('certified light has a white surface', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'certified', theme: 'light', notFound: false })
    expect(svg).toContain(`fill="${WHITE}"`)
  })

  it('certified outlined has a transparent surface', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'certified', theme: 'outlined', notFound: false })
    expect(svg).toContain('fill="transparent"')
  })
})

describe('generateBannerSvg', () => {
  it('readme banner is 640 wide', () => {
    const svg = generateBannerSvg({ subdomain: 'juan', type: 'readme', theme: 'light' })
    expect(svg).toContain('width="640"')
  })

  it('readme banner contains subdomain', () => {
    const svg = generateBannerSvg({ subdomain: 'juan', type: 'readme', theme: 'light' })
    expect(svg).toContain('juan')
    expect(svg).toContain('is-pinoy.dev')
  })

  it('profile banner is 720 wide', () => {
    const svg = generateBannerSvg({ subdomain: 'juan', type: 'profile', theme: 'gold' })
    expect(svg).toContain('width="720"')
  })

  it('profile banner contains subdomain and tagline', () => {
    const svg = generateBannerSvg({ subdomain: 'juan', type: 'profile', theme: 'gold' })
    expect(svg).toContain('juan.is-pinoy.dev')
    expect(svg).toContain('IS-PINOY.DEV NETWORK')
  })
})
