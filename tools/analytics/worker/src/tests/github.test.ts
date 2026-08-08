import { describe, it, expect, vi, beforeEach } from "vitest"
import { fetchSubdomains } from "../github"

const TOKEN = "tok"

/** A tree entry as GraphQL returns it: the record body arrives as blob text. */
function entry(name: string, body: unknown) {
  return {
    name,
    object: body === null ? null : { text: JSON.stringify(body) },
  }
}

function mockTree(entries: unknown[]) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({ data: { repository: { object: { entries } } } }),
      { status: 200 }
    )
  )
}

const RECORDS = [entry("juan.json", {}), entry("maria.json", {})]

describe("fetchSubdomains", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("returns subdomain names stripped from .json filenames", async () => {
    mockTree(RECORDS)
    expect(await fetchSubdomains(TOKEN)).toEqual(["juan", "maria"])
  })

  // The whole point of the GraphQL rewrite: the free plan allows 50 external
  // subrequests per invocation, and one-per-record left no budget for dates.
  it("reads the entire registry in a single subrequest", async () => {
    const spy = mockTree(RECORDS)
    await fetchSubdomains(TOKEN)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(String(spy.mock.calls[0][0])).toBe("https://api.github.com/graphql")
  })

  it("ignores entries that are not .json records", async () => {
    mockTree([...RECORDS, entry("README.md", {}), { name: "subdir", object: {} }])
    expect(await fetchSubdomains(TOKEN)).toEqual(["juan", "maria"])
  })

  it("collects for records that say nothing about analytics", async () => {
    mockTree([entry("juan.json", { features: {} }), entry("maria.json", {})])
    expect(await fetchSubdomains(TOKEN)).toEqual(["juan", "maria"])
  })

  it("collects when analytics is explicitly true", async () => {
    mockTree([entry("juan.json", { features: { analytics: true } })])
    expect(await fetchSubdomains(TOKEN)).toContain("juan")
  })

  it("drops a subdomain that opted out", async () => {
    mockTree([
      entry("juan.json", { features: { analytics: false } }),
      entry("maria.json", {}),
    ])
    expect(await fetchSubdomains(TOKEN)).toEqual(["maria"])
  })

  it("does not treat a non-false value as an opt-out", async () => {
    mockTree([entry("juan.json", { features: { analytics: "no" } })])
    expect(await fetchSubdomains(TOKEN)).toContain("juan")
  })

  it("aborts when a blob has no text, rather than storing a partial day", async () => {
    mockTree([{ name: "juan.json", object: { text: null } }, RECORDS[1]])
    await expect(fetchSubdomains(TOKEN)).rejects.toThrow(
      "Could not read 1/2 subdomain records (juan) — aborting"
    )
  })

  it("treats malformed JSON as unreadable rather than as consent", async () => {
    mockTree([{ name: "juan.json", object: { text: "{ not json" } }])
    await expect(fetchSubdomains(TOKEN)).rejects.toThrow("Could not read 1/1")
  })

  it("names only the first few unreadable records", async () => {
    mockTree(
      Array.from({ length: 7 }, (_, i) => ({
        name: `s${i}.json`,
        object: { text: null },
      }))
    )
    await expect(fetchSubdomains(TOKEN)).rejects.toThrow(/Could not read 7\/7 .*, …/)
  })

  it("authenticates the request", async () => {
    const spy = mockTree(RECORDS)
    await fetchSubdomains(TOKEN)
    const init = spy.mock.calls[0][1] as RequestInit
    const sent = init.headers as Record<string, string>
    expect(sent.Authorization).toBe(`Bearer ${TOKEN}`)
    expect(init.method).toBe("POST")
  })

  // GraphQL rejects anonymous callers outright, so failing before the request
  // says what is wrong instead of surfacing a bare 401.
  it("refuses to run without a token", async () => {
    const spy = vi.spyOn(globalThis, "fetch")
    await expect(fetchSubdomains()).rejects.toThrow("GITHUB_TOKEN is not set")
    expect(spy).not.toHaveBeenCalled()
  })

  it("throws on non-ok HTTP response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 401 })
    )
    await expect(fetchSubdomains(TOKEN)).rejects.toThrow("GitHub API error: 401")
  })

  it("surfaces a GraphQL-level error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ message: "Bad credentials" }] }), {
        status: 200,
      })
    )
    await expect(fetchSubdomains(TOKEN)).rejects.toThrow(
      "GitHub GraphQL error: Bad credentials"
    )
  })

  // A repo or path that resolves to nothing must not read as "no subdomains",
  // which the caller would otherwise treat as a registry that emptied itself.
  it("throws when the tree is missing entirely", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { repository: { object: null } } }), {
        status: 200,
      })
    )
    await expect(fetchSubdomains(TOKEN)).rejects.toThrow("No tree at")
  })

  it("returns an empty list when the directory has no .json files", async () => {
    mockTree([entry("README.md", {})])
    expect(await fetchSubdomains(TOKEN)).toEqual([])
  })
})
