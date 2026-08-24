import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { cleanedEnvVars, readEnv, resetCleanedEnvVars } from "./env"

const NAME = "TEST_D1_VALUE"

beforeEach(() => resetCleanedEnvVars())
afterEach(() => delete process.env[NAME])

describe("readEnv", () => {
  it("returns undefined for a variable that is not set", () => {
    expect(readEnv(NAME)).toBeUndefined()
    expect(cleanedEnvVars()).toEqual([])
  })

  it("passes a clean value through untouched", () => {
    process.env[NAME] = "abc123"
    expect(readEnv(NAME)).toBe("abc123")
    expect(cleanedEnvVars()).toEqual([])
  })

  // The failure this exists for: a token copied out of a file or a terminal
  // brings the newline with it, and `Bearer <token>\n` is not a token
  // Cloudflare knows — it answers "Authentication error", exactly as it would
  // for a revoked one.
  it("strips surrounding whitespace and reports the repair", () => {
    process.env[NAME] = "  abc123\n"
    expect(readEnv(NAME)).toBe("abc123")
    expect(cleanedEnvVars()).toEqual([NAME])
  })

  it("strips a wrapping pair of quotes", () => {
    process.env[NAME] = '"abc123"'
    expect(readEnv(NAME)).toBe("abc123")
    process.env[NAME] = "'abc123'"
    expect(readEnv(NAME)).toBe("abc123")
  })

  it("leaves quotes that are part of the value alone", () => {
    process.env[NAME] = 'abc"123'
    expect(readEnv(NAME)).toBe('abc"123')
    expect(cleanedEnvVars()).toEqual([])
  })

  // Treated as unset rather than as a credential that can only be rejected:
  // an empty variable takes the documented GitHub fallback instead of
  // spending a round trip to be told the token is invalid.
  it("reports an all-whitespace value as unset", () => {
    process.env[NAME] = "   "
    expect(readEnv(NAME)).toBeUndefined()
  })
})
