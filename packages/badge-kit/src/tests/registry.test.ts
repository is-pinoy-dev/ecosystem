import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isSubdomainRegistered } from '../lib/registry.ts'

describe('isSubdomainRegistered', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when file exists and destroy is not set', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ subdomain: 'juan' }),
    }))

    const result = await isSubdomainRegistered('juan')
    expect(result).toBe(true)
  })

  it('returns false when file does not exist (404)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    const result = await isSubdomainRegistered('nobody')
    expect(result).toBe(false)
  })

  it('returns false when destroy=true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ destroy: true }),
    }))

    const result = await isSubdomainRegistered('juan')
    expect(result).toBe(false)
  })

  it('fetches the correct GitHub raw URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    await isSubdomainRegistered('juan')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains/juan.json'
    )
  })
})
