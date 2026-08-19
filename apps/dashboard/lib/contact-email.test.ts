import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({ getDb: vi.fn(), hasDatabase: vi.fn() }))

const { getDb, hasDatabase } = await import("@/lib/db")
const { getContactEmail, setContactEmail } = await import("./contact-email")

const configured = vi.mocked(hasDatabase)
const db = vi.mocked(getDb)

beforeEach(() => {
  configured.mockReset()
  db.mockReset()
})

describe("getContactEmail", () => {
  it("returns null when no database is configured, without querying it", async () => {
    configured.mockReturnValue(false)
    await expect(getContactEmail(1)).resolves.toBeNull()
    expect(db).not.toHaveBeenCalled()
  })

  it("returns the stored email for the account", async () => {
    configured.mockReturnValue(true)
    db.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([{ email: "juan@example.com" }]),
        }),
      }),
    } as unknown as ReturnType<typeof getDb>)

    await expect(getContactEmail(1)).resolves.toBe("juan@example.com")
  })

  it("returns null when the account has no row", async () => {
    configured.mockReturnValue(true)
    db.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([]),
        }),
      }),
    } as unknown as ReturnType<typeof getDb>)

    await expect(getContactEmail(1)).resolves.toBeNull()
  })

  it("returns null, logged, when the query throws", async () => {
    configured.mockReturnValue(true)
    db.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => Promise.reject(new Error("D1 query failed")),
        }),
      }),
    } as unknown as ReturnType<typeof getDb>)
    const error = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(getContactEmail(1)).resolves.toBeNull()
    expect(error).toHaveBeenCalledOnce()
  })
})

describe("setContactEmail", () => {
  it("upserts the row, targeting the github id primary key", async () => {
    configured.mockReturnValue(true)
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined)
    const values = vi.fn(() => ({ onConflictDoUpdate }))
    const insert = vi.fn(() => ({ values }))
    db.mockReturnValue({ insert } as unknown as ReturnType<typeof getDb>)

    await expect(
      setContactEmail(1, "juandelacruz", "juan@example.com")
    ).resolves.toEqual({ ok: true })

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        githubId: 1,
        githubLogin: "juandelacruz",
        email: "juan@example.com",
        updatedAt: expect.any(Date),
      })
    )
    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({
          githubLogin: "juandelacruz",
          email: "juan@example.com",
        }),
      })
    )
  })

  it("returns not-ok when no database is configured, without writing", async () => {
    configured.mockReturnValue(false)

    await expect(
      setContactEmail(1, "juandelacruz", "juan@example.com")
    ).resolves.toEqual({ ok: false })
    expect(db).not.toHaveBeenCalled()
  })

  it("returns not-ok, logged, when the write throws", async () => {
    configured.mockReturnValue(true)
    const onConflictDoUpdate = vi
      .fn()
      .mockRejectedValue(new Error("D1 write failed"))
    const values = vi.fn(() => ({ onConflictDoUpdate }))
    const insert = vi.fn(() => ({ values }))
    db.mockReturnValue({ insert } as unknown as ReturnType<typeof getDb>)
    const error = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(
      setContactEmail(1, "juandelacruz", "juan@example.com")
    ).resolves.toEqual({ ok: false })
    expect(error).toHaveBeenCalledOnce()
  })
})
