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

  it("warns when a CNAME points at a bare vercel.app alias", () => {
    const result = validateDomain({
      subdomain: "jun",
      owner: { github: "bosquejun" },
      records: { CNAME: { value: "jun.vercel.app" } },
    })
    expect(result.ok).toBe(true)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain("jun.vercel.app")
  })

  it("does not warn for a proper vercel-dns CNAME target", () => {
    const result = validateDomain({
      subdomain: "jun",
      owner: { github: "bosquejun" },
      records: { CNAME: { value: "abc123.vercel-dns-017.com." } },
    })
    expect(result.ok).toBe(true)
    expect(result.warnings).toEqual([])
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

  it("rejects TXT providers other than vercel", () => {
    for (const provider of ["netlify", "github", "cloudflare", "fly"]) {
      const result = validateDomain({
        subdomain: "jun",
        owner: { github: "bosquejun" },
        records: {
          // @ts-expect-error — only "vercel" is a supported provider
          TXT: { value: `${provider}-challenge-abc123`, provider },
        },
      })
      expect(result.ok).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    }
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

describe("hosted portfolio identity", () => {
  const record = (subdomain: string, github: string) => ({
    subdomain,
    owner: { github },
    portfolio: { template: "terminal" as const },
    records: { CNAME: { value: "portfolio.is-pinoy.dev" } },
  });

  it("accepts a portfolio addressed by its owner's username", () => {
    expect(validateDomain(record("juan", "juan")).ok).toBe(true);
  });

  it("matches the username case-insensitively", () => {
    // GitHub keeps a login's registered case; the subdomain is always lower.
    expect(validateDomain(record("juandelacruz", "JuanDelaCruz")).ok).toBe(true);
  });

  it("rejects a portfolio rendering someone else's profile", () => {
    // The impersonation shape: the address says one person, the page shows
    // another's GitHub profile.
    const result = validateDomain(record("famous-dev", "someone-else"));
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("someone-else.is-pinoy.dev");
  });

  it("leaves subdomains without a portfolio block free to be named anything", () => {
    const result = validateDomain({
      subdomain: "anything",
      owner: { github: "juan" },
      records: { CNAME: { value: "juan.github.io" } },
    });
    expect(result.ok).toBe(true);
  });
});
