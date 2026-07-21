import { describe, it, expect } from 'vitest'
import { parseColor, parseOverrides } from '../lib/color.ts'
import { generateBadgeSvg } from '../lib/svg.ts'

describe('parseColor', () => {
  it('accepts 6-digit hex with and without a hash', () => {
    expect(parseColor('#1E90FF')).toBe('#1E90FF')
    expect(parseColor('1E90FF')).toBe('#1E90FF')
  })

  it('accepts 3-, 4-, and 8-digit hex', () => {
    expect(parseColor('#abc')).toBe('#abc')
    expect(parseColor('abcd')).toBe('#abcd')
    expect(parseColor('#11223344')).toBe('#11223344')
  })

  it('accepts the transparent keyword', () => {
    expect(parseColor('transparent')).toBe('transparent')
    expect(parseColor('TRANSPARENT')).toBe('transparent')
  })

  it('rejects anything that is not hex or transparent', () => {
    expect(parseColor('red')).toBeNull()
    expect(parseColor('rgb(1,2,3)')).toBeNull()
    expect(parseColor('#12')).toBeNull()
    expect(parseColor('#xyzxyz')).toBeNull()
    expect(parseColor('')).toBeNull()
    expect(parseColor(undefined)).toBeNull()
  })

  it('rejects an attempted attribute-injection payload', () => {
    expect(parseColor('red" onload="alert(1)')).toBeNull()
  })
})

describe('parseOverrides', () => {
  it('returns undefined when no valid color params are present', () => {
    expect(parseOverrides(() => undefined)).toBeUndefined()
    expect(parseOverrides((k) => (k === 'bg' ? 'notacolor' : undefined))).toBeUndefined()
  })

  it('maps params to palette slots, normalizing and dropping invalid ones', () => {
    const get = (k: string): string | undefined =>
      ({ bg: '0B1F44', mark: '#F5C800', markbg: 'transparent', border: 'bogus' })[k]
    expect(parseOverrides(get)).toEqual({
      bg: '#0B1F44',
      mark: '#F5C800',
      markBg: 'transparent',
    })
  })
})

describe('generateBadgeSvg — color overrides', () => {
  it('applies a validated override over the theme', () => {
    const svg = generateBadgeSvg({
      subdomain: 'juan',
      type: 'subdomain',
      theme: 'light',
      notFound: false,
      overrides: { bg: '#123456', mark: '#abcdef' },
    })
    expect(svg).toContain('#123456')
    expect(svg).toContain('#abcdef')
  })

  it('renders identically to the theme when no overrides are given', () => {
    const base = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'light', notFound: false })
    const withUndefined = generateBadgeSvg({ subdomain: 'juan', type: 'subdomain', theme: 'light', notFound: false, overrides: undefined })
    expect(withUndefined).toBe(base)
  })
})
