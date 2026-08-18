import { describe, it, expect, vi, afterEach } from "vitest"
import { verifyTurnstile } from "../turnstile"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("verifyTurnstile", () => {
  it("returns success on a passing challenge", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true })))
    vi.stubGlobal("fetch", fetchMock)

    const result = await verifyTurnstile("tok", "secret")
    expect(result.success).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("posts form-encoded fields to Cloudflare's siteverify endpoint", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true })))
    vi.stubGlobal("fetch", fetchMock)

    await verifyTurnstile("tok", "secret", "1.2.3.4")

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify")
    expect(init.method).toBe("POST")
    const body = new URLSearchParams(init.body as string)
    expect(body.get("secret")).toBe("secret")
    expect(body.get("response")).toBe("tok")
    expect(body.get("remoteip")).toBe("1.2.3.4")
  })

  it("fails without ever calling out when the token is empty", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const result = await verifyTurnstile("", "secret")
    expect(result.success).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("reports Cloudflare's failure codes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] }),
          ),
      ),
    )

    const result = await verifyTurnstile("bad-token", "secret")
    expect(result.success).toBe(false)
    expect(result.errorCodes).toEqual(["invalid-input-response"])
  })

  it("treats a thrown fetch as a failure, not a crash", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network")
      }),
    )

    const result = await verifyTurnstile("tok", "secret")
    expect(result.success).toBe(false)
  })

  it("treats a non-ok HTTP response as a failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })))

    const result = await verifyTurnstile("tok", "secret")
    expect(result.success).toBe(false)
  })
})
