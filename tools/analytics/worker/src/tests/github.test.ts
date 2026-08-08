import { describe, it, expect, vi, beforeEach } from "vitest"
import { fetchSubdomains } from "../github"

/**
 * Mock the listing call plus the per-record fetches the opt-out check makes.
 * `records` maps a subdomain to its record body, or to null for a fetch that
 * fails.
 */
function mockRegistry(
  listing: unknown,
  records: Record<string, unknown | null> = {}
) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes("api.github.com")) {
      return new Response(JSON.stringify(listing), { status: 200 })
    }
    const name = url
      .split("/")
      .pop()!
      .replace(/\.json$/, "")
    const body = records[name]
    if (body === null || body === undefined) {
      return new Response("Not Found", { status: 404 })
    }
    return new Response(JSON.stringify(body), { status: 200 })
  })
}

const FILES = [
  { name: "juan.json", type: "file" },
  { name: "maria.json", type: "file" },
  { name: "README.md", type: "file" },
  { name: "subdir", type: "dir" },
]

describe("fetchSubdomains", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("returns subdomain names stripped from .json filenames", async () => {
    mockRegistry(FILES, { juan: {}, maria: {} })
    expect(await fetchSubdomains()).toEqual(["juan", "maria"])
  })

  it("collects for records that say nothing about analytics", async () => {
    mockRegistry(FILES, { juan: { features: {} }, maria: {} })
    expect(await fetchSubdomains()).toEqual(["juan", "maria"])
  })

  it("collects when analytics is explicitly true", async () => {
    mockRegistry(FILES, {
      juan: { features: { analytics: true } },
      maria: {},
    })
    expect(await fetchSubdomains()).toContain("juan")
  })

  it("drops a subdomain that opted out", async () => {
    mockRegistry(FILES, {
      juan: { features: { analytics: false } },
      maria: {},
    })
    expect(await fetchSubdomains()).toEqual(["maria"])
  })

  // Never treated as consent — but not dropped silently either. A rate-limited
  // run used to store the day for whichever records happened to answer, and
  // that partial day then looked complete to every later run.
  it("aborts when a record cannot be read, rather than storing a partial day", async () => {
    mockRegistry(FILES, { juan: null, maria: {} })
    await expect(fetchSubdomains()).rejects.toThrow(
      "Could not read 1/2 subdomain records (juan) — aborting"
    )
  })

  it("names only the first few unreadable records", async () => {
    const many = Array.from({ length: 7 }, (_, i) => ({
      name: `s${i}.json`,
      type: "file",
    }))
    mockRegistry(many)
    await expect(fetchSubdomains()).rejects.toThrow(/Could not read 7\/7 .*, …/)
  })

  it("does not treat a non-false value as an opt-out", async () => {
    mockRegistry(FILES, {
      juan: { features: { analytics: "no" } },
      maria: {},
    })
    expect(await fetchSubdomains()).toContain("juan")
  })

  it("throws on non-ok HTTP response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Not Found", { status: 404 })
    )
    await expect(fetchSubdomains()).rejects.toThrow("GitHub API error: 404")
  })

  // The failure this actually hits in production, so the message has to say
  // what to do about it rather than just the status code.
  it("names the missing token on an unauthenticated 403", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("rate limited", { status: 403 })
    )
    await expect(fetchSubdomains()).rejects.toThrow(/403.*GITHUB_TOKEN/s)
  })

  it("does not blame the token when one was supplied", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("forbidden", { status: 403 })
    )
    await expect(fetchSubdomains("tok")).rejects.toThrow(
      "GitHub API error: 403"
    )
    await expect(fetchSubdomains("tok")).rejects.not.toThrow(/GITHUB_TOKEN/)
  })

  it("authenticates both the listing and the record reads", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) =>
      String(input).includes("api.github.com")
        ? new Response(JSON.stringify([{ name: "juan.json", type: "file" }]), {
            status: 200,
          })
        : new Response("{}", { status: 200 })
    )
    await fetchSubdomains("tok")
    expect(spy).toHaveBeenCalledTimes(2)
    for (const [, init] of spy.mock.calls) {
      const sent = (init as RequestInit).headers as Record<string, string>
      expect(sent.Authorization).toBe("Bearer tok")
    }
  })

  it("sends no Authorization header when there is no token", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 })
    )
    await fetchSubdomains()
    const sent = (spy.mock.calls[0][1] as RequestInit).headers as Record<
      string,
      string
    >
    expect(sent.Authorization).toBeUndefined()
  })

  it("returns empty array when directory has no .json files", async () => {
    mockRegistry([{ name: "README.md", type: "file" }])
    expect(await fetchSubdomains()).toEqual([])
  })
})
