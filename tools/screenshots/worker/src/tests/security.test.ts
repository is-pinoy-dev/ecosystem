import { describe, expect, it } from "vitest"

import {
  assertCanonicalPortfolioUrl,
  assertPublicDns,
  assertSafeResourceUrl,
  canonicalPortfolioUrl,
  isPrivateIpAddress,
} from "../security"

describe("portfolio screenshot destination security", () => {
  it("generates the canonical HTTPS hostname", () => {
    expect(canonicalPortfolioUrl("juan").href).toBe(
      "https://juan.is-pinoy.dev/"
    )
  })

  it("rejects subdomain values containing dots", () => {
    expect(() => canonicalPortfolioUrl("juan.evil")).toThrow()
  })

  it.each([
    "https://is-pinoy.dev/",
    "https://juan.is-pinoy.dev.attacker.com/",
    "https://juan.evil.is-pinoy.dev/",
    "http://juan.is-pinoy.dev/",
    "https://user:pass@juan.is-pinoy.dev/",
    "https://juan.is-pinoy.dev:8443/",
    "https://localhost/",
    "https://127.0.0.1/",
  ])("rejects a malicious canonical URL variant: %s", (url) => {
    expect(() => assertCanonicalPortfolioUrl(url, "juan")).toThrow()
  })

  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "172.16.4.2",
    "192.168.1.2",
    "169.254.169.254",
    "::1",
    "0:0:0:0:0:0:0:1",
    "fc00::1",
    "fd12::1",
    "fe80::1",
    "fec0::1",
  ])("recognizes private and local destinations: %s", (ip) => {
    expect(isPrivateIpAddress(ip)).toBe(true)
  })

  it.each([
    "https://localhost/",
    "https://127.0.0.1/",
    "https://10.0.0.1/",
    "https://[::1]/",
    "http://example.com/",
  ])("blocks unsafe browser resource URLs: %s", (url) => {
    expect(() => assertSafeResourceUrl(url)).toThrow()
  })

  it("rejects a hostname that resolves to a private address", async () => {
    const privateDnsFetch = async () =>
      new Response(
        JSON.stringify({
          Status: 0,
          Answer: [{ type: 1, data: "10.0.0.7" }],
        }),
        { headers: { "Content-Type": "application/dns-json" } }
      )

    await expect(
      assertPublicDns("juan.is-pinoy.dev", privateDnsFetch as typeof fetch)
    ).rejects.toThrow()
  })
})
