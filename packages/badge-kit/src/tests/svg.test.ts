import { describe, it, expect } from 'vitest'
import { generateBadgeSvg, generateBannerSvg } from '../lib/svg.ts'

describe('generateBadgeSvg — subdomain badge', () => {
  it('includes subdomain and domain in output', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'dark', notFound: false })
    expect(svg).toContain('juan')
    expect(svg).toContain('is-pinoy.dev')
  })

  it('uses default DEPLOYED ON label', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'dark', notFound: false })
    expect(svg).toContain('DEPLOYED ON')
  })

  it('uses custom label when provided', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'dark', notFound: false, label: 'BUILT BY' })
    expect(svg).toContain('BUILT BY')
  })

  it('shows not-found state', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'dark', notFound: true })
    expect(svg).toContain('#444')
    expect(svg).toContain('not found')
    expect(svg).not.toContain('>juan<')
  })

  it('dark theme has dark background and gold accent', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'dark', notFound: false })
    expect(svg).toContain('#0D0D0D')
    expect(svg).toContain('#F5C800')
  })

  it('gold theme has gold background', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'gold', notFound: false })
    expect(svg).toContain('fill="#F5C800"')
  })

  it('light theme has light background', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'light', notFound: false })
    expect(svg).toContain('#FAFAF5')
  })

  it('outlined theme has transparent background', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'outlined', notFound: false })
    expect(svg).toContain('fill="transparent"')
  })

  it('is valid XML (starts with <svg)', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'dark', notFound: false })
    expect(svg.trim()).toMatch(/^<svg/)
  })
})

describe('generateBadgeSvg — member badge', () => {
  it('dark theme has is-pinoy.dev brand and subdomain', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'member', theme: 'dark', notFound: false })
    expect(svg).toContain('is-pinoy.dev')
    expect(svg).toContain('juan')
  })

  it('light theme has light background', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'member', theme: 'light', notFound: false })
    expect(svg).toContain('#FAFAF5')
  })

  it('outlined theme has transparent background', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'member', theme: 'outlined', notFound: false })
    expect(svg).toContain('fill="transparent"')
  })
})

describe('generateBadgeSvg — platform badges', () => {
  it('pinoy-made dark contains PINOY-MADE label', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'pinoy-made', theme: 'dark', notFound: false })
    expect(svg).toContain('PINOY-MADE')
    expect(svg).toContain('#0D0D0D')
  })

  it('pinoy-made gold has gold background', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'pinoy-made', theme: 'gold', notFound: false })
    expect(svg).toContain('fill="#F5C800"')
  })

  it('pinoy-made light has light background', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'pinoy-made', theme: 'light', notFound: false })
    expect(svg).toContain('#FAFAF5')
  })

  it('pinoy-made outlined has transparent background', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'pinoy-made', theme: 'outlined', notFound: false })
    expect(svg).toContain('fill="transparent"')
  })

  it('certified gold has PINOY DEV and // CERTIFIED labels', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'certified', theme: 'gold', notFound: false })
    expect(svg).toContain('PINOY DEV')
    expect(svg).toContain('// CERTIFIED')
  })

  it('certified light has light background', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'certified', theme: 'light', notFound: false })
    expect(svg).toContain('#FAFAF5')
  })

  it('certified outlined has transparent background', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'certified', theme: 'outlined', notFound: false })
    expect(svg).toContain('fill="transparent"')
  })
})

describe('generateBannerSvg', () => {
  it('readme banner is 646 wide', () => {
    const svg = generateBannerSvg({ subdomain: 'juan', type: 'readme', theme: 'dark' })
    expect(svg).toContain('width="646"')
  })

  it('readme banner contains subdomain', () => {
    const svg = generateBannerSvg({ subdomain: 'juan', type: 'readme', theme: 'dark' })
    expect(svg).toContain('juan')
    expect(svg).toContain('is-pinoy.dev')
  })

  it('profile banner is 726 wide', () => {
    const svg = generateBannerSvg({ subdomain: 'juan', type: 'profile', theme: 'gold' })
    expect(svg).toContain('width="726"')
  })

  it('profile banner contains subdomain and tagline', () => {
    const svg = generateBannerSvg({ subdomain: 'juan', type: 'profile', theme: 'gold' })
    expect(svg).toContain('juan.is-pinoy.dev')
    expect(svg).toContain('PINOY DEV AT LARGE')
  })
})
