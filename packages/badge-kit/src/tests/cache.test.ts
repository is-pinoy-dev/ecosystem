import { describe, it, expect } from 'vitest'
import { badgeCacheHeaders } from '../lib/cache.ts'

describe('badgeCacheHeaders', () => {
  it('returns public 1-day Cache-Control header', () => {
    const headers = badgeCacheHeaders()
    expect(headers['Cache-Control']).toBe('public, max-age=86400')
  })
})
