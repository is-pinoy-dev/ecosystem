import { describe, it, expect } from "vitest"
import { validateDomain } from "../validate.js"

describe("validateDomain", () => {
  it("returns ok for a valid CNAME domain", () => {
    const result = validateDomain({
      subdomain: "jun",
      owner: { github: "bosquejun" },
      records: { CNAME: { value: "jun.vercel.app" } },
    })
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  it("returns errors for invalid schema (missing owner)", () => {
    const result = validateDomain({
      subdomain: "jun",
      records: { CNAME: { value: "jun.vercel.app" } },
    })
    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("returns error for reserved subdomain", () => {
    const result = validateDomain({
      subdomain: "www",
      owner: { github: "hacker" },
      records: { CNAME: { value: "evil.vercel.app" } },
    })
    expect(result.ok).toBe(false)
    expect(result.errors).toContain("Reserved subdomain: www")
  })

  it("returns error for empty record value", () => {
    const result = validateDomain({
      subdomain: "jun",
      owner: { github: "bosquejun" },
      records: { CNAME: { value: "" } },
    })
    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("returns error for subdomain with invalid characters", () => {
    const result = validateDomain({
      subdomain: "Jun_Bad",
      owner: { github: "bosquejun" },
      records: { CNAME: { value: "jun.vercel.app" } },
    })
    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("returns error for subdomain shorter than 3 characters", () => {
    const result = validateDomain({
      subdomain: "ab",
      owner: { github: "bosquejun" },
      records: { CNAME: { value: "ab.vercel.app" } },
    })
    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("returns error for single-character subdomain", () => {
    const result = validateDomain({
      subdomain: "a",
      owner: { github: "bosquejun" },
      records: { CNAME: { value: "a.vercel.app" } },
    })
    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("returns ok for a valid TXT domain", () => {
    const result = validateDomain({
      subdomain: "jun",
      owner: { github: "bosquejun" },
      records: {
        TXT: { value: "vercel-challenge-abc123", provider: "vercel" },
      },
    })
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  it("accepts all supported TXT providers", () => {
    for (const provider of ["vercel", "netlify", "github", "cloudflare"] as const) {
      const result = validateDomain({
        subdomain: "jun",
        owner: { github: "bosquejun" },
        records: {
          TXT: { value: `${provider}-challenge-abc123`, provider },
        },
      })
      expect(result.ok).toBe(true)
      expect(result.errors).toEqual([])
    }
  })

  it("rejects an unknown TXT provider", () => {
    const result = validateDomain({
      subdomain: "jun",
      owner: { github: "bosquejun" },
      records: {
        // @ts-expect-error — "fly" is not a supported provider
        TXT: { value: "fly-challenge-abc123", provider: "fly" },
      },
    })
    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("returns ok for a valid A record domain", () => {
    const result = validateDomain({
      subdomain: "jun",
      owner: { github: "bosquejun" },
      records: { A: { value: "76.76.21.21" } },
    })
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  it("returns ok for multiple A records", () => {
    const result = validateDomain({
      subdomain: "jun",
      owner: { github: "bosquejun" },
      records: { A: [{ value: "76.76.21.21" }, { value: "76.76.21.22" }] },
    })
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })
})
