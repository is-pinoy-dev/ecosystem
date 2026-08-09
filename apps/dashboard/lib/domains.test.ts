import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({ getDb: vi.fn(), hasDatabase: vi.fn() }))

const { getDb, hasDatabase } = await import("@/lib/db")
const { getRegistrySubdomains } = await import("./domains")

const configured = vi.mocked(hasDatabase)
const db = vi.mocked(getDb)

/** Answers the listing call plus one raw fetch per record. */
function mockGitHub(records: Record<string, unknown>) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input)
    if (url.includes("api.github.com")) {
      return new Response(
        JSON.stringify(Object.keys(records).map((n) => ({ name: `${n}.json` }))),
        { status: 200 }
      )
    }
    const name = url.split("/").pop()!.replace(/\.json$/, "")
    return new Response(JSON.stringify(records[name]), { status: 200 })
  })
}

const RECORD = {
  owner: { github: "juandelacruz" },
  records: { CNAME: "juandelacruz.github.io" },
}

beforeEach(() => {
  vi.restoreAllMocks()
  configured.mockReset()
  db.mockReset()
})

afterEach(() => vi.restoreAllMocks())

describe("getRegistrySubdomains", () => {
  it("reads GitHub when no database is configured", async () => {
    configured.mockReturnValue(false)
    mockGitHub({ juan: RECORD })
    const result = await getRegistrySubdomains()
    expect(result.map((r) => r.subdomain)).toEqual(["juan"])
    expect(db).not.toHaveBeenCalled()
  })

  // A misconfigured database used to be worse than an absent one: with no
  // credentials the page served from GitHub, with a bad token it threw and took
  // the whole listing down. Git is the source of truth either way.
  it("falls back to GitHub when the database query fails", async () => {
    configured.mockReturnValue(true)
    db.mockReturnValue({
      select: () => ({
        from: () => ({
          orderBy: () => Promise.reject(new Error("D1 query failed: Authentication error")),
        }),
      }),
    } as unknown as ReturnType<typeof getDb>)
    const warn = vi.spyOn(console, "error").mockImplementation(() => {})
    mockGitHub({ juan: RECORD })

    const result = await getRegistrySubdomains()

    expect(result.map((r) => r.subdomain)).toEqual(["juan"])
    // Recovered, but not silently — a page permanently on the slow path with
    // nothing in the log is its own failure.
    expect(warn).toHaveBeenCalledOnce()
    expect(String(warn.mock.calls[0]![0])).toContain(
      "registry database unavailable"
    )
  })

  it("does not touch GitHub when the database answers", async () => {
    configured.mockReturnValue(true)
    db.mockReturnValue({
      select: () => ({
        from: () => ({
          orderBy: () =>
            Promise.resolve([
              {
                name: "juan",
                ownerGithub: "juandelacruz",
                ownerEmail: null,
                records: { CNAME: "juandelacruz.github.io" },
                features: null,
                syncStatus: "synced",
                lastError: null,
                lastSyncedAt: null,
                createdAt: null,
                updatedAt: null,
              },
            ]),
        }),
      }),
    } as unknown as ReturnType<typeof getDb>)
    const fetchSpy = vi.spyOn(globalThis, "fetch")

    const result = await getRegistrySubdomains()

    expect(result.map((r) => r.subdomain)).toEqual(["juan"])
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

const { isOwnedBy } = await import("./domains")

/** Minimal record shape for ownership matching. */
const owned = (owner: { github: string; id?: number }) =>
  ({ subdomain: "x", owner, records: {} }) as Parameters<typeof isOwnedBy>[0]

describe("isOwnedBy", () => {
  it("matches on the login when neither side has a numeric ID", () => {
    // Every record written before owner.id existed takes this path.
    expect(isOwnedBy(owned({ github: "JuanDelaCruz" }), { login: "juandelacruz" })).toBe(true)
    expect(isOwnedBy(owned({ github: "juan" }), { login: "maria" })).toBe(false)
  })

  it("keeps a record attached to its owner after a GitHub rename", () => {
    // The login on the record is stale; the ID is not.
    expect(
      isOwnedBy(owned({ github: "oldname", id: 42 }), { login: "newname", githubId: 42 })
    ).toBe(true)
  })

  it("does not hand a freed login to whoever registers it next", () => {
    // The dangerous half of a rename: someone else takes "oldname". Login
    // matching alone would give them another person's records.
    expect(
      isOwnedBy(owned({ github: "oldname", id: 42 }), { login: "oldname", githubId: 99 })
    ).toBe(false)
  })

  it("falls back to the login when only one side carries an ID", () => {
    expect(isOwnedBy(owned({ github: "juan" }), { login: "juan", githubId: 42 })).toBe(true)
    expect(isOwnedBy(owned({ github: "juan", id: 42 }), { login: "juan" })).toBe(true)
  })
})
