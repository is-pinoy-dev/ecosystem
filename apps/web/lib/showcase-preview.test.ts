import { afterEach, describe, expect, it, vi } from "vitest"

import { previewFallbackUrl, previewStatusFor } from "./showcase-preview"

describe("previewFallbackUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("asks the apex so externally hosted portfolios are covered too", () => {
    expect(previewFallbackUrl("juan")).toBe("/_tools/og/preview?subdomain=juan")
  })

  it("encodes the subdomain it is given", () => {
    expect(previewFallbackUrl("a b")).toBe("/_tools/og/preview?subdomain=a%20b")
  })

  it("can point local previews at the public worker", () => {
    vi.stubEnv("NEXT_PUBLIC_OG_WORKER_ORIGIN", "https://is-pinoy.dev/")

    expect(previewFallbackUrl("juan")).toBe(
      "https://is-pinoy.dev/_tools/og/preview?subdomain=juan"
    )
  })
})

describe("previewStatusFor", () => {
  it("reports a subdomain the manifest never mentions as unknown", () => {
    expect(previewStatusFor(undefined)).toBe("unknown")
  })

  it("passes through the status the worker reported", () => {
    expect(previewStatusFor({ screenshotStatus: "ready" })).toBe("ready")
    expect(previewStatusFor({ screenshotStatus: "pending" })).toBe("pending")
  })
})
