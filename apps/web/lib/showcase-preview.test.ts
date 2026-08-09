import { describe, expect, it } from "vitest"

import { previewFallbackUrl, previewStatusFor } from "./showcase-preview"

describe("previewFallbackUrl", () => {
  it("asks the apex so externally hosted portfolios are covered too", () => {
    expect(previewFallbackUrl("juan")).toBe("/_tools/og/preview?subdomain=juan")
  })

  it("encodes the subdomain it is given", () => {
    expect(previewFallbackUrl("a b")).toBe("/_tools/og/preview?subdomain=a%20b")
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
