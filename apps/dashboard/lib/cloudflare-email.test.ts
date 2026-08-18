import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

import {
  createDestinationAddress,
  getDestinationAddressStatus,
  hasEmailRouting,
  listDestinationAddresses,
  statusFromList,
  type CloudflareEmailAddress,
} from "./cloudflare-email"

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env.CLOUDFLARE_ACCOUNT_ID = "acct-123"
  process.env.CLOUDFLARE_EMAIL_API_TOKEN = "token-abc"
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function stubFetch(
  handler: (url: string, init?: RequestInit) => Response
): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (input: string, init?: RequestInit) =>
    handler(String(input), init)
  )
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

describe("hasEmailRouting", () => {
  it("is true only when both env vars are set", () => {
    expect(hasEmailRouting()).toBe(true)
    delete process.env.CLOUDFLARE_EMAIL_API_TOKEN
    expect(hasEmailRouting()).toBe(false)
  })
})

describe("createDestinationAddress", () => {
  it("posts the email to the account-scoped addresses endpoint", async () => {
    const fetchMock = stubFetch((url) => {
      expect(url).toBe(
        "https://api.cloudflare.com/client/v4/accounts/acct-123/email/routing/addresses"
      )
      return new Response(
        JSON.stringify({
          success: true,
          result: { tag: "t1", email: "juan@example.com", verified: null },
        })
      )
    })

    const result = await createDestinationAddress("juan@example.com")
    expect(result).toEqual({ ok: true })

    const init = fetchMock.mock.calls[0]![1] as RequestInit
    expect(init.method).toBe("POST")
    expect(init.headers).toMatchObject({ Authorization: "Bearer token-abc" })
    expect(JSON.parse(init.body as string)).toEqual({
      email: "juan@example.com",
    })
  })

  it("treats an already-registered address as success, not an error", async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({
            success: false,
            result: null,
            errors: [{ message: "email address already exists" }],
          })
        )
    )

    const result = await createDestinationAddress("juan@example.com")
    expect(result).toEqual({ ok: true })
  })

  it("returns a generic error rather than leaking Cloudflare's message", async () => {
    stubFetch(
      () =>
        new Response(
          JSON.stringify({
            success: false,
            result: null,
            errors: [{ message: "internal cloudflare detail" }],
          })
        )
    )

    const result = await createDestinationAddress("juan@example.com")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).not.toContain("internal cloudflare detail")
    }
  })

  it("refuses to call out when not configured", async () => {
    delete process.env.CLOUDFLARE_EMAIL_API_TOKEN
    const fetchMock = stubFetch(() => new Response("{}"))

    const result = await createDestinationAddress("juan@example.com")
    expect(result.ok).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

const ADDRESSES: CloudflareEmailAddress[] = [
  {
    tag: "a",
    email: "verified@example.com",
    verified: "2026-01-01T00:00:00Z",
    created: "2026-01-01T00:00:00Z",
    modified: "2026-01-01T00:00:00Z",
  },
  {
    tag: "b",
    email: "pending@example.com",
    verified: null,
    created: "2026-01-01T00:00:00Z",
    modified: "2026-01-01T00:00:00Z",
  },
]

describe("statusFromList", () => {
  it("reports verified for a confirmed address", () => {
    expect(statusFromList(ADDRESSES, "verified@example.com")).toBe("verified")
  })

  it("reports pending for a registered but unconfirmed address", () => {
    expect(statusFromList(ADDRESSES, "pending@example.com")).toBe("pending")
  })

  it("reports absent for an address never registered", () => {
    expect(statusFromList(ADDRESSES, "nobody@example.com")).toBe("absent")
  })

  it("matches case-insensitively", () => {
    expect(statusFromList(ADDRESSES, "Verified@Example.com")).toBe("verified")
  })
})

describe("listDestinationAddresses / getDestinationAddressStatus", () => {
  it("lists every address in one call when a single page covers them all", async () => {
    const fetchMock = stubFetch(
      () => new Response(JSON.stringify({ success: true, result: ADDRESSES }))
    )
    const list = await listDestinationAddresses()
    expect(list).toEqual(ADDRESSES)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("resolves one email's status from the account's list", async () => {
    stubFetch(
      () => new Response(JSON.stringify({ success: true, result: ADDRESSES }))
    )
    expect(await getDestinationAddressStatus("pending@example.com")).toBe(
      "pending"
    )
  })

  it("paginates past a full first page instead of truncating", async () => {
    const fullPage: CloudflareEmailAddress[] = Array.from(
      { length: 50 },
      (_, i) => ({
        tag: `page1-${i}`,
        email: `owner${i}@example.com`,
        verified: null,
        created: "2026-01-01T00:00:00Z",
        modified: "2026-01-01T00:00:00Z",
      })
    )
    const secondPage: CloudflareEmailAddress[] = [
      {
        tag: "page2-0",
        email: "verified@example.com",
        verified: "2026-01-02T00:00:00Z",
        created: "2026-01-01T00:00:00Z",
        modified: "2026-01-01T00:00:00Z",
      },
    ]

    const fetchMock = stubFetch((url) => {
      const page = new URL(url).searchParams.get("page")
      const result = page === "2" ? secondPage : fullPage
      return new Response(JSON.stringify({ success: true, result }))
    })

    const list = await listDestinationAddresses()
    expect(list).toHaveLength(51)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(
      await getDestinationAddressStatus("verified@example.com")
    ).toBe("verified")
  })
})
