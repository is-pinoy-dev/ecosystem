import { describe, expect, it } from "vitest"

import { FLAGS, FLAGS_OFF, FLAG_IDS } from "./flags"

// Resolution itself belongs to Vercel Flags and is exercised against the real
// service, not here. What this file protects is the contract between the
// registry and that service: a key typo silently resolves to the flag's
// defaultValue, hiding a section with no error raised anywhere.

describe("flag registry", () => {
  it("gates the portfolio sections behind a flag named for its dashboard key", () => {
    // Same key as apps/dashboard/lib/flags.ts, on purpose: one switch has to
    // move the claim flow and everything on the public site that advertises it.
    expect(FLAG_IDS).toContain("claims")
  })

  it("describes every flag, so a stale one can be recognised", () => {
    expect(FLAG_IDS.every((id) => FLAGS[id].description.length > 0)).toBe(true)
  })

  it("uses keys that can round-trip to the dashboard unchanged", () => {
    // Vercel Flags matches keys literally; a stray space or a capital would
    // resolve to nothing and read as "feature off" rather than as an error.
    for (const id of FLAG_IDS) {
      expect(id).toBe(id.trim().toLowerCase())
      expect(id).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it("offers an all-off set covering every flag", () => {
    // What pages that do not resolve flags hand to the nav: present for every
    // key, and never accidentally on.
    expect(Object.keys(FLAGS_OFF).sort()).toEqual([...FLAG_IDS].sort())
    expect(Object.values(FLAGS_OFF).every((on) => on === false)).toBe(true)
  })
})
