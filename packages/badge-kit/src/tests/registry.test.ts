import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isSubdomainRegistered } from '../lib/registry.ts'

const mockEnv = {
  CLOUDFLARE_API_TOKEN: 'test-token',
  CLOUDFLARE_ZONE_ID: 'test-zone-id',
}

describe('isSubdomainRegistered', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when DNS record exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, result: [{ id: 'abc', type: 'TXT' }] }),
    }))

    const result = await isSubdomainRegistered('juan', mockEnv)
    expect(result).toBe(true)
  })

  it('returns false when DNS record is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, result: [] }),
    }))

    const result = await isSubdomainRegistered('nobody', mockEnv)
    expect(result).toBe(false)
  })

  it('returns false when API returns an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, result: [], errors: [{ message: 'Unauthorized' }] }),
    }))

    const result = await isSubdomainRegistered('juan', mockEnv)
    expect(result).toBe(false)
  })

  it('calls Cloudflare DNS API with correct URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, result: [] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await isSubdomainRegistered('juan', mockEnv)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/zones/test-zone-id/dns_records?type=TXT&name=juan.is-pinoy.dev',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
  })
})
