import { describe, it, expect } from 'vitest'
import { generateBadgeSvg, generateBannerSvg } from '../lib/svg.ts'

describe('generateBadgeSvg', () => {
  it('includes subdomain in output for deployed-on', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'deployed-on', theme: 'dark', notFound: false })
    expect(svg).toContain('juan')
    expect(svg).toContain('is-pinoy.dev')
  })

  it('uses muted color and not-found label when notFound=true', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'deployed-on', theme: 'dark', notFound: true })
    expect(svg).toContain('#444')
    expect(svg).toContain('not found')
    expect(svg).not.toContain('>juan<')
  })

  it('dark theme has dark background', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'deployed-on', theme: 'dark', notFound: false })
    expect(svg).toContain('#0D0D0D')
    expect(svg).toContain('#F5C800')
  })

  it('gold theme has gold background', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'deployed-on', theme: 'gold', notFound: false })
    expect(svg).toContain('fill="#F5C800"')
  })

  it('retro theme has gold-dark shadow', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'deployed-on', theme: 'retro', notFound: false })
    expect(svg).toContain('#D4A800')
  })

  it('outlined theme has transparent background for built-by', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'built-by', theme: 'outlined', notFound: false })
    expect(svg).toContain('fill="transparent"')
  })

  it('is valid XML (starts with <svg)', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'deployed-on', theme: 'dark', notFound: false })
    expect(svg.trim()).toMatch(/^<svg/)
  })

  it('pinoy-made split contains both panels', () => {
    const svg = generateBadgeSvg({ subdomain: '', type: 'pinoy-made', theme: 'split', notFound: false })
    expect(svg).toContain('PINOY-MADE')
    expect(svg).toContain('#0D0D0D')
    expect(svg).toContain('#F5C800')
  })

  it('certified gold has PINOY DEV label', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'certified', theme: 'gold', notFound: false })
    expect(svg).toContain('PINOY DEV')
    expect(svg).toContain('// CERTIFIED')
  })

  it('member dark has is-pinoy.dev brand', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', type: 'member', theme: 'dark', notFound: false })
    expect(svg).toContain('is-pinoy.dev')
    expect(svg).toContain('juan')
  })
})

describe('generateBannerSvg', () => {
  it('readme banner is 640 wide', () => {
    const svg = generateBannerSvg({ subdomain: 'juan', type: 'readme', theme: 'dark' })
    expect(svg).toContain('width="646"')
  })

  it('readme banner contains subdomain', () => {
    const svg = generateBannerSvg({ subdomain: 'juan', type: 'readme', theme: 'dark' })
    expect(svg).toContain('juan')
    expect(svg).toContain('is-pinoy.dev')
  })

  it('profile banner is 720 wide', () => {
    const svg = generateBannerSvg({ subdomain: 'juan', type: 'profile', theme: 'gold' })
    expect(svg).toContain('width="726"')
  })

  it('profile banner contains subdomain and tagline', () => {
    const svg = generateBannerSvg({ subdomain: 'juan', type: 'profile', theme: 'gold' })
    expect(svg).toContain('juan.is-pinoy.dev')
    expect(svg).toContain('PINOY DEV AT LARGE')
  })
})
