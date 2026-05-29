import { describe, it, expect } from 'vitest'
import { generateBadgeSvg, generatePresetSvg, generateBannerSvg, type BadgeVariant } from '../lib/svg.ts'

describe('generateBadgeSvg', () => {
  it('includes subdomain in output', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', variant: 'default', notFound: false })
    expect(svg).toContain('juan.is-pinoy.dev')
  })

  it('uses muted color and not-found label when notFound=true', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', variant: 'default', notFound: true })
    expect(svg).toContain('#888888')
    expect(svg).toContain('not found')
    expect(svg).not.toContain('juan.is-pinoy.dev')
  })

  it('default variant has dark background', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', variant: 'default', notFound: false })
    expect(svg).toContain('#0D0D0D')
    expect(svg).toContain('#F5C800')
  })

  it('flat variant has gold background', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', variant: 'flat', notFound: false })
    expect(svg).toContain('fill="#F5C800"')
  })

  it('pixel variant has gold shadow', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', variant: 'pixel', notFound: false })
    // Shadow rect rendered with gold fill
    expect(svg).toMatch(/fill="#F5C800"/)
  })

  it('outline variant has transparent background', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', variant: 'outline', notFound: false })
    expect(svg).toContain('fill="transparent"')
  })

  it('is valid XML (starts with <svg)', () => {
    const svg = generateBadgeSvg({ subdomain: 'juan', variant: 'default', notFound: false })
    expect(svg.trim()).toMatch(/^<svg/)
  })
})

describe('generatePresetSvg', () => {
  it('powered-by contains is-pinoy.dev branding', () => {
    const svg = generatePresetSvg('powered-by', 'pixel')
    expect(svg).toContain('is-pinoy.dev')
  })

  it('filipino-dev contains Filipino Dev label', () => {
    const svg = generatePresetSvg('filipino-dev', 'pixel')
    expect(svg).toContain('Filipino Dev')
  })
})

describe('generateBannerSvg', () => {
  it('is 640 wide', () => {
    const svg = generateBannerSvg('juan')
    expect(svg).toContain('width="640"')
  })

  it('contains subdomain', () => {
    const svg = generateBannerSvg('juan')
    expect(svg).toContain('juan.is-pinoy.dev')
  })
})
