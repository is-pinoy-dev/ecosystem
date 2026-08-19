import { describe, it, expect } from "vitest"
import { lookupContactEmail } from "../db"

/** A minimal fake CONTACT_EMAILS_DB — enough of the D1 prepare/bind/first chain. */
function mockDb(rows: { githubId?: number; githubLogin?: string; email: string }[]) {
  return {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => ({
        first: async () => {
          if (sql.includes("github_id")) {
            return rows.find((r) => r.githubId === args[0]) ?? null
          }
          if (sql.includes("github_login")) {
            return rows.find((r) => r.githubLogin === args[0]) ?? null
          }
          return null
        },
      }),
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe("lookupContactEmail", () => {
  it("looks up by github id when the owner carries one", async () => {
    const db = mockDb([{ githubId: 1, githubLogin: "juan", email: "juan@example.com" }])
    await expect(lookupContactEmail(db, { id: 1, github: "juan" })).resolves.toBe(
      "juan@example.com",
    )
  })

  it("falls back to the login when there is no id, or the id has no row", async () => {
    const db = mockDb([{ githubLogin: "juan", email: "juan@example.com" }])
    await expect(lookupContactEmail(db, { github: "juan" })).resolves.toBe(
      "juan@example.com",
    )
    await expect(lookupContactEmail(db, { id: 99, github: "juan" })).resolves.toBe(
      "juan@example.com",
    )
  })

  it("returns null when neither lookup finds a row", async () => {
    const db = mockDb([])
    await expect(lookupContactEmail(db, { id: 1, github: "juan" })).resolves.toBeNull()
  })

  it("returns null when the owner carries nothing to look up", async () => {
    const db = mockDb([{ githubId: 1, email: "juan@example.com" }])
    await expect(lookupContactEmail(db, {})).resolves.toBeNull()
  })
})
