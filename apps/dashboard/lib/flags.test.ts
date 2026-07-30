import { describe, expect, it } from "vitest"

import {
  buildFlagContext,
  FLAGS,
  FLAG_IDS,
  isFlagEnabled,
  parseFlagOverrides,
  parseRemoteSource,
  parseTesters,
  readDeployEnv,
  readEnvSource,
  readFlagContext,
  resolveFlags,
  type FlagContext,
} from "./flags"

function context(overrides: Partial<FlagContext> = {}): FlagContext {
  return {
    env: "production",
    overrides: {},
    testers: [],
    login: null,
    ...overrides,
  }
}

describe("flag registry", () => {
  it("ships the claim flow off in production and on everywhere else", () => {
    expect(FLAGS.claim.enabledIn).toEqual(["development", "preview"])
  })

  it("describes every flag, so a stale one can be recognised", () => {
    expect(FLAG_IDS.every((id) => FLAGS[id].description.length > 0)).toBe(true)
  })
})

describe("readDeployEnv", () => {
  it("trusts VERCEL_ENV when it is one of the three deployment targets", () => {
    expect(readDeployEnv({ VERCEL_ENV: "production" })).toBe("production")
    expect(readDeployEnv({ VERCEL_ENV: "preview" })).toBe("preview")
    expect(readDeployEnv({ VERCEL_ENV: "development" })).toBe("development")
  })

  it("falls back to NODE_ENV off Vercel, where nothing is a preview", () => {
    expect(readDeployEnv({ NODE_ENV: "production" })).toBe("production")
    expect(readDeployEnv({ NODE_ENV: "development" })).toBe("development")
    expect(readDeployEnv({})).toBe("development")
  })

  it("ignores a VERCEL_ENV it does not recognise", () => {
    expect(
      readDeployEnv({ VERCEL_ENV: "staging", NODE_ENV: "production" })
    ).toBe("production")
  })
})

describe("parseFlagOverrides", () => {
  it("reads on and off, in the spellings an operator is likely to type", () => {
    expect(parseFlagOverrides("claim=on")).toEqual({ claim: true })
    expect(parseFlagOverrides("claim=true")).toEqual({ claim: true })
    expect(parseFlagOverrides("claim=1")).toEqual({ claim: true })
    expect(parseFlagOverrides("claim=off")).toEqual({ claim: false })
    expect(parseFlagOverrides("claim=false")).toEqual({ claim: false })
    expect(parseFlagOverrides("claim=0")).toEqual({ claim: false })
  })

  it("treats a bare name as on", () => {
    expect(parseFlagOverrides("claim")).toEqual({ claim: true })
  })

  it("tolerates whitespace and casing", () => {
    expect(parseFlagOverrides("  CLAIM = OFF  ")).toEqual({ claim: false })
  })

  it("returns nothing for an absent or empty value", () => {
    expect(parseFlagOverrides(undefined)).toEqual({})
    expect(parseFlagOverrides(null)).toEqual({})
    expect(parseFlagOverrides("")).toEqual({})
  })

  it("ignores unknown names rather than inventing flags", () => {
    expect(parseFlagOverrides("nope=on,claim=off")).toEqual({ claim: false })
  })

  it("ignores an unrecognised value, leaving the declared behaviour in place", () => {
    expect(parseFlagOverrides("claim=maybe")).toEqual({})
  })

  it("lets the last entry win when a flag is named twice", () => {
    expect(parseFlagOverrides("claim=on,claim=off")).toEqual({ claim: false })
  })
})

describe("parseTesters", () => {
  it("splits, trims, and lowercases logins", () => {
    expect(parseTesters(" Octocat , HUBOT ")).toEqual(["octocat", "hubot"])
  })

  it("drops empty entries from a trailing or doubled comma", () => {
    expect(parseTesters("octocat,,")).toEqual(["octocat"])
    expect(parseTesters(undefined)).toEqual([])
  })
})

describe("isFlagEnabled", () => {
  it("is off in production by default", () => {
    expect(isFlagEnabled("claim", context({ env: "production" }))).toBe(false)
  })

  it("is on in the environments the flag declares", () => {
    expect(isFlagEnabled("claim", context({ env: "development" }))).toBe(true)
    expect(isFlagEnabled("claim", context({ env: "preview" }))).toBe(true)
  })

  it("turns on in production for a listed tester", () => {
    expect(
      isFlagEnabled(
        "claim",
        context({ env: "production", testers: ["octocat"], login: "octocat" })
      )
    ).toBe(true)
  })

  it("stays off in production for everyone not listed", () => {
    expect(
      isFlagEnabled(
        "claim",
        context({ env: "production", testers: ["octocat"], login: "hubot" })
      )
    ).toBe(false)
  })

  it("stays off in production for a signed-out visitor", () => {
    expect(
      isFlagEnabled(
        "claim",
        context({ env: "production", testers: ["octocat"], login: null })
      )
    ).toBe(false)
  })

  it("lets an explicit override launch a flag without a deploy", () => {
    expect(
      isFlagEnabled(
        "claim",
        context({ env: "production", overrides: { claim: true } })
      )
    ).toBe(true)
  })

  it("lets an explicit off beat the tester allowlist, so it is a real kill switch", () => {
    expect(
      isFlagEnabled(
        "claim",
        context({
          env: "production",
          overrides: { claim: false },
          testers: ["octocat"],
          login: "octocat",
        })
      )
    ).toBe(false)
  })

  it("lets an explicit off beat the flag's own environment list", () => {
    expect(
      isFlagEnabled(
        "claim",
        context({ env: "development", overrides: { claim: false } })
      )
    ).toBe(false)
  })
})

describe("readFlagContext", () => {
  it("builds a context from the environment and the session", () => {
    expect(
      readFlagContext(
        {
          VERCEL_ENV: "production",
          DASHBOARD_FLAGS: "claim=off",
          DASHBOARD_FLAG_TESTERS: "Octocat",
        },
        "OctoCat"
      )
    ).toEqual({
      env: "production",
      overrides: { claim: false },
      testers: ["octocat"],
      login: "octocat",
    })
  })

  it("matches a tester regardless of how GitHub cased the login", () => {
    const resolved = readFlagContext(
      { VERCEL_ENV: "production", DASHBOARD_FLAG_TESTERS: "octocat" },
      "OctoCat"
    )
    expect(isFlagEnabled("claim", resolved)).toBe(true)
  })

  it("treats a missing login as signed out", () => {
    expect(readFlagContext({}, undefined).login).toBe(null)
    expect(readFlagContext({}, null).login).toBe(null)
  })
})

describe("readEnvSource", () => {
  it("gathers both environment variables into one source", () => {
    expect(
      readEnvSource({
        DASHBOARD_FLAGS: "claim=off",
        DASHBOARD_FLAG_TESTERS: "Octocat",
      })
    ).toEqual({ overrides: { claim: false }, testers: ["octocat"] })
  })

  it("is empty when neither variable is set", () => {
    expect(readEnvSource({})).toEqual({ overrides: {}, testers: [] })
  })
})

describe("parseRemoteSource", () => {
  it("reads the Edge Config shape", () => {
    expect(
      parseRemoteSource({ overrides: { claim: true }, testers: ["Octocat"] })
    ).toEqual({ overrides: { claim: true }, testers: ["octocat"] })
  })

  it("treats a missing or non-object value as no configuration", () => {
    for (const raw of [undefined, null, "claim=on", 42, []]) {
      expect(parseRemoteSource(raw)).toEqual({ overrides: {}, testers: [] })
    }
  })

  it("ignores unknown flag names", () => {
    expect(
      parseRemoteSource({ overrides: { claim: true, mystery: true } })
    ).toEqual({ overrides: { claim: true }, testers: [] })
  })

  it("drops a non-boolean override instead of coercing it", () => {
    // "false" and 0 are both truthy/falsy traps a hand-edited JSON blob can
    // easily contain; neither should decide a flag.
    expect(parseRemoteSource({ overrides: { claim: "true" } })).toEqual({
      overrides: {},
      testers: [],
    })
    expect(parseRemoteSource({ overrides: { claim: 1 } })).toEqual({
      overrides: {},
      testers: [],
    })
  })

  it("keeps an explicit false, which is the kill switch", () => {
    expect(parseRemoteSource({ overrides: { claim: false } })).toEqual({
      overrides: { claim: false },
      testers: [],
    })
  })

  it("drops non-string and blank testers", () => {
    expect(
      parseRemoteSource({ testers: ["Octocat", 7, null, "  ", "hubot"] })
    ).toEqual({ overrides: {}, testers: ["octocat", "hubot"] })
  })

  it("ignores a testers value that is not an array", () => {
    expect(parseRemoteSource({ testers: "octocat" })).toEqual({
      overrides: {},
      testers: [],
    })
  })

  it("resolves through the same rules as the environment source", () => {
    const source = parseRemoteSource({ testers: ["octocat"] })
    const context = buildFlagContext({
      env: "production",
      source,
      login: "OctoCat",
    })
    expect(isFlagEnabled("claim", context)).toBe(true)
    expect(
      isFlagEnabled(
        "claim",
        buildFlagContext({ env: "production", source, login: "hubot" })
      )
    ).toBe(false)
  })
})

describe("buildFlagContext", () => {
  it("lowercases the login so GitHub's casing never matters", () => {
    expect(
      buildFlagContext({
        env: "production",
        source: { overrides: {}, testers: ["octocat"] },
        login: "OctoCat",
      })
    ).toEqual({
      env: "production",
      overrides: {},
      testers: ["octocat"],
      login: "octocat",
    })
  })

  it("treats a missing login as signed out", () => {
    const source = { overrides: {}, testers: [] }
    expect(
      buildFlagContext({ env: "production", source, login: undefined }).login
    ).toBe(null)
    expect(
      buildFlagContext({ env: "production", source, login: "" }).login
    ).toBe(null)
  })
})

describe("resolveFlags", () => {
  it("answers for every flag in the registry", () => {
    expect(Object.keys(resolveFlags(context()))).toEqual(FLAG_IDS)
  })

  it("hides the claim flow from a production visitor", () => {
    expect(resolveFlags(context({ env: "production" }))).toEqual({
      claim: false,
    })
  })
})
