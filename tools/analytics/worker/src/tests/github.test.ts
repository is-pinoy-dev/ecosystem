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

  it("drops a subdomain whose record cannot be read, rather than assuming consent", async () => {
    mockRegistry(FILES, { juan: null, maria: {} })
    expect(await fetchSubdomains()).toEqual(["maria"])
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

  it("returns empty array when directory has no .json files", async () => {
    mockRegistry([{ name: "README.md", type: "file" }])
    expect(await fetchSubdomains()).toEqual([])
  })
})
