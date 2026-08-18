import { describe, it, expect, vi, beforeEach } from "vitest"

// `cloudflare:email` only exists inside the Workers runtime. Mocked here so
// this suite can run under plain Node, the same way the domains cache guard
// lets lookupSubdomain run without a `caches` global.
vi.mock("cloudflare:email", () => {
  class EmailMessage {
    from: string
    to: string
    raw: string
    constructor(from: string, to: string, raw: string) {
      this.from = from
      this.to = to
      this.raw = raw
    }
  }
  return { EmailMessage }
})

const { sendSubmission } = await import("../mail")

function submission(overrides: Partial<Parameters<typeof sendSubmission>[2]> = {}) {
  return {
    name: "Juan",
    email: "juan@example.com",
    message: "Hello there!",
    subdomain: "juan",
    ...overrides,
  }
}

describe("sendSubmission", () => {
  let send: ReturnType<typeof vi.fn>

  beforeEach(() => {
    send = vi.fn(async () => undefined)
  })

  it("sends from the fixed platform address to the owner", async () => {
    const result = await sendSubmission(
      { send } as never,
      "owner@example.com",
      submission(),
    )

    expect(result.ok).toBe(true)
    expect(send).toHaveBeenCalledTimes(1)
    const message = send.mock.calls[0]![0] as { from: string; to: string; raw: string }
    expect(message.from).toBe("contact@is-pinoy.dev")
    expect(message.to).toBe("owner@example.com")
  })

  it("sets Reply-To to the visitor's own address, not the platform's", async () => {
    const result = await sendSubmission(
      { send } as never,
      "owner@example.com",
      submission({ email: "visitor@example.com" }),
    )

    expect(result.ok).toBe(true)
    const message = send.mock.calls[0]![0] as { raw: string }
    expect(message.raw).toContain("Reply-To: <visitor@example.com>")
  })

  it("carries the visitor's name, email, and message in the body", async () => {
    await sendSubmission(
      { send } as never,
      "owner@example.com",
      submission({ name: "Maria", message: "Can we collaborate?" }),
    )

    const message = send.mock.calls[0]![0] as { raw: string }
    expect(message.raw).toContain("Maria")
    expect(message.raw).toContain("Can we collaborate?")
  })

  it("returns a generic error rather than leaking Cloudflare's failure detail", async () => {
    send.mockRejectedValueOnce(
      new Error("destination address owner@example.com is not verified"),
    )

    const result = await sendSubmission({ send } as never, "owner@example.com", submission())

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).not.toContain("not verified")
      expect(result.error).toBe("Could not deliver the message.")
    }
  })
})
