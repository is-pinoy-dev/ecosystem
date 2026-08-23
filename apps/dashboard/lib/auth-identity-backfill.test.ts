import { afterEach, describe, expect, it, vi } from "vitest"

import { backfillIdentity } from "./auth-identity-backfill"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("backfillIdentity", () => {
  it("leaves a fully-populated token untouched, without calling GitHub", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const token = { login: "juan", githubId: 42, accessToken: "gho_abc" }
    await expect(backfillIdentity(token)).resolves.toBe(token)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("does nothing when there is no access token to backfill with", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const token = { login: undefined, githubId: undefined }
    await backfillIdentity(token)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("fills in a missing githubId from the GitHub API using the stored access token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ login: "juan", id: 42 }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const token = { login: "juan", githubId: undefined, accessToken: "gho_abc" }
    const result = await backfillIdentity(token)

    expect(result.githubId).toBe(42)
    expect(result.login).toBe("juan")
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/user",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer gho_abc" }),
      })
    )
  })

  it("fills in both login and githubId when neither was ever set", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ login: "juan", id: 42 }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const token: { login?: string; githubId?: number; accessToken?: string } =
      { accessToken: "gho_abc" }
    const result = await backfillIdentity(token)

    expect(result.login).toBe("juan")
    expect(result.githubId).toBe(42)
  })

  it("leaves the token unchanged when the GitHub API call fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false })
    vi.stubGlobal("fetch", fetchMock)

    const token = { login: undefined, githubId: undefined, accessToken: "gho_abc" }
    const result = await backfillIdentity(token)

    expect(result.login).toBeUndefined()
    expect(result.githubId).toBeUndefined()
  })

  it("leaves the token unchanged when fetch throws", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"))
    vi.stubGlobal("fetch", fetchMock)

    const token = { login: undefined, githubId: undefined, accessToken: "gho_abc" }
    await expect(backfillIdentity(token)).resolves.toEqual(token)
  })

  it("ignores a non-integer id from the API rather than mis-keying ownership", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ login: "juan", id: 42.5 }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const token = { login: undefined, githubId: undefined, accessToken: "gho_abc" }
    const result = await backfillIdentity(token)

    expect(result.githubId).toBeUndefined()
    expect(result.login).toBe("juan")
  })
})
