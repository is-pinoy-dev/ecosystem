import { afterEach, describe, expect, it, vi } from "vitest"

import { getContactFormEmail } from "./contact-form-config"

function respondWith(body: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 404,
      json: async () => body,
    })
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("getContactFormEmail", () => {
  it("reads the email off the record", async () => {
    respondWith({
      owner: { github: "juandelacruz" },
      contactForm: { email: "juan@example.com" },
      records: { CNAME: { value: "portfolio.is-pinoy.dev", proxied: true } },
    })
    await expect(getContactFormEmail("juandelacruz")).resolves.toBe(
      "juan@example.com"
    )
  })

  it("returns null for a record with no contactForm block", async () => {
    respondWith({
      owner: { github: "juandelacruz" },
      records: { CNAME: { value: "juan.github.io" } },
    })
    await expect(getContactFormEmail("juandelacruz")).resolves.toBeNull()
  })

  it("returns null for a contactForm block the schema rejects", async () => {
    respondWith({
      owner: { github: "juandelacruz" },
      contactForm: { email: "not-an-email" },
    })
    await expect(getContactFormEmail("juandelacruz")).resolves.toBeNull()
  })

  it("returns null when the record does not exist", async () => {
    respondWith({}, false)
    await expect(getContactFormEmail("nobody")).resolves.toBeNull()
  })

  it("returns null when the registry read throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    await expect(getContactFormEmail("juandelacruz")).resolves.toBeNull()
  })

  it("returns null when the response body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token")
        },
      })
    )
    await expect(getContactFormEmail("juandelacruz")).resolves.toBeNull()
  })
})
