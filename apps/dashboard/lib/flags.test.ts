import { describe, expect, it } from "vitest"

import { FLAGS, FLAG_IDS } from "./flags"

// Resolution itself belongs to Vercel Flags and is exercised against the real
// service, not here. What this file protects is the contract between the
// registry and that service: a key typo silently resolves to the flag's
// defaultValue, hiding a feature with no error raised anywhere.

describe("flag registry", () => {
  it("gates the claim flow behind a flag named for its dashboard key", () => {
    expect(FLAG_IDS).toContain("claims")
  })

  it("describes every flag, so a stale one can be recognised", () => {
    expect(FLAG_IDS.every((id) => FLAGS[id].description.length > 0)).toBe(true)
  })

  it("uses keys that can round-trip to the dashboard unchanged", () => {
    // Vercel Flags matches keys literally; stray space or a capital would
    // resolve to nothing and read as "feature off" rather than as an error.
    for (const id of FLAG_IDS) {
      expect(id).toBe(id.trim().toLowerCase())
      expect(id).toMatch(/^[a-z0-9-]+$/)
    }
  })
})
