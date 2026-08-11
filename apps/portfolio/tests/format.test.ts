import { describe, expect, it } from "vitest"
import { compactCount } from "../lib/format"

// Star and follower counts are rendered into fixed-width slots in several
// designs, so the shortening rule is pinned here rather than left to a locale
// formatter that could change its mind about capitalization or separators.
describe("compactCount", () => {
  it("leaves anything under a thousand alone", () => {
    expect(compactCount(0)).toBe("0")
    expect(compactCount(7)).toBe("7")
    expect(compactCount(999)).toBe("999")
  })

  it("keeps one decimal below ten of a unit and none above", () => {
    expect(compactCount(1000)).toBe("1k")
    expect(compactCount(1240)).toBe("1.2k")
    expect(compactCount(9949)).toBe("9.9k")
    expect(compactCount(12_400)).toBe("12k")
    expect(compactCount(128_431)).toBe("128k")
    expect(compactCount(1_300_000)).toBe("1.3m")
  })

  it("carries a rounded-up value into the next unit", () => {
    // 999_999 scales to 1000.0k, which is one million by another name.
    expect(compactCount(999_999)).toBe("1m")
    expect(compactCount(999_999_999)).toBe("1b")
  })

  it("is defensive about values the API should never send", () => {
    expect(compactCount(-5)).toBe("0")
    expect(compactCount(Number.NaN)).toBe("0")
    expect(compactCount(Number.POSITIVE_INFINITY)).toBe("0")
  })

  it("truncates fractions rather than rendering them", () => {
    expect(compactCount(12.7)).toBe("12")
  })
})
