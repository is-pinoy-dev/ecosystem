import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("../domains", () => ({
  lookupSubdomain: vi.fn(),
  isToolEnabled: (record: { features?: { tools?: Record<string, boolean> } }, tool: string) =>
    record.features?.tools?.[tool] === true,
}))
vi.mock("../turnstile", () => ({
  verifyTurnstile: vi.fn(),
}))
vi.mock("../mail", () => ({
  sendSubmission: vi.fn(),
}))

const worker = (await import("../index")).default
const { lookupSubdomain } = await import("../domains")
const { verifyTurnstile } = await import("../turnstile")
const { sendSubmission } = await import("../mail")

function ctx(): ExecutionContext {
  return { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext
}

/** A minimal fake CONTACT_EMAILS_DB — enough of the D1 prepare/bind/first chain. */
function mockContactEmailsDb(
  rows: { githubId?: number; githubLogin?: string; email: string }[] = [],
): D1Database {
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
  } as unknown as D1Database
}

function env(emails: { githubId?: number; githubLogin?: string; email: string }[] = []) {
  return {
    EMAIL: { send: vi.fn() },
    TURNSTILE_SITE_KEY: "site-key",
    TURNSTILE_SECRET_KEY: "secret-key",
    CONTACT_EMAILS_DB: mockContactEmailsDb(emails),
  }
}

const ENABLED_RECORD = {
  owner: { github: "juan", id: 1 },
  features: { tools: { "contact-form": true } },
}
const JUAN_EMAIL = { githubId: 1, githubLogin: "juan", email: "juan@example.com" }

beforeEach(() => {
  vi.mocked(lookupSubdomain).mockReset()
  vi.mocked(verifyTurnstile).mockReset()
  vi.mocked(sendSubmission).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("GET /_tools/contact-form/widget.js", () => {
  it("serves the widget script as JavaScript with a long cache header", async () => {
    const res = await worker.fetch(
      new Request("https://juan.is-pinoy.dev/_tools/contact-form/widget.js"),
      env(),
      ctx(),
    )
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toContain("application/javascript")
    expect(res.headers.get("Cache-Control")).toContain("max-age")
    const body = await res.text()
    expect(body).toContain("turnstile")
  })
})

describe("GET /_tools/contact-form/config", () => {
  it("reports enabled with the public site key for an enabled subdomain", async () => {
    vi.mocked(lookupSubdomain).mockResolvedValue({ status: "found", record: ENABLED_RECORD })

    const res = await worker.fetch(
      new Request("https://juan.is-pinoy.dev/_tools/contact-form/config"),
      env([JUAN_EMAIL]),
      ctx(),
    )
    const body = (await res.json()) as { enabled: boolean; turnstileSiteKey: string }
    expect(body.enabled).toBe(true)
    expect(body.turnstileSiteKey).toBe("site-key")
  })

  it("reports disabled when the owner has no registered contact email, even if the flag is on", async () => {
    vi.mocked(lookupSubdomain).mockResolvedValue({ status: "found", record: ENABLED_RECORD })

    const res = await worker.fetch(
      new Request("https://juan.is-pinoy.dev/_tools/contact-form/config"),
      env([]),
      ctx(),
    )
    expect(((await res.json()) as { enabled: boolean }).enabled).toBe(false)
  })

  it("reports disabled for an unclaimed subdomain", async () => {
    vi.mocked(lookupSubdomain).mockResolvedValue({ status: "unclaimed" })

    const res = await worker.fetch(
      new Request("https://nobody.is-pinoy.dev/_tools/contact-form/config"),
      env(),
      ctx(),
    )
    expect(((await res.json()) as { enabled: boolean }).enabled).toBe(false)
  })

  it("reports disabled when the domains repo is unreachable — fails closed, unlike site-audit", async () => {
    vi.mocked(lookupSubdomain).mockResolvedValue({ status: "unavailable" })

    const res = await worker.fetch(
      new Request("https://juan.is-pinoy.dev/_tools/contact-form/config"),
      env(),
      ctx(),
    )
    expect(((await res.json()) as { enabled: boolean }).enabled).toBe(false)
  })
})

const VALID_SUBMISSION = {
  name: "Maria",
  email: "maria@example.com",
  message: "Hi there, loved your work!",
  token: "turnstile-token",
}

function submitRequest(body: unknown, hostname = "juan.is-pinoy.dev") {
  return new Request(`https://${hostname}/_tools/contact-form/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /_tools/contact-form/submit", () => {
  it("sends mail on a fully valid submission", async () => {
    vi.mocked(lookupSubdomain).mockResolvedValue({ status: "found", record: ENABLED_RECORD })
    vi.mocked(verifyTurnstile).mockResolvedValue({ success: true })
    vi.mocked(sendSubmission).mockResolvedValue({ ok: true })

    const res = await worker.fetch(submitRequest(VALID_SUBMISSION), env([JUAN_EMAIL]), ctx())

    expect(res.status).toBe(200)
    expect(sendSubmission).toHaveBeenCalledTimes(1)
    const [, destinationEmail] = vi.mocked(sendSubmission).mock.calls[0]!
    expect(destinationEmail).toBe("juan@example.com")
  })

  it("looks the address up by login when the record has no owner id", async () => {
    vi.mocked(lookupSubdomain).mockResolvedValue({
      status: "found",
      record: { owner: { github: "juan" }, features: { tools: { "contact-form": true } } },
    })
    vi.mocked(verifyTurnstile).mockResolvedValue({ success: true })
    vi.mocked(sendSubmission).mockResolvedValue({ ok: true })

    const res = await worker.fetch(
      submitRequest(VALID_SUBMISSION),
      env([{ githubLogin: "juan", email: "juan@example.com" }]),
      ctx(),
    )

    expect(res.status).toBe(200)
    const [, destinationEmail] = vi.mocked(sendSubmission).mock.calls[0]!
    expect(destinationEmail).toBe("juan@example.com")
  })

  it("rejects a malformed body without looking anything up", async () => {
    const res = await worker.fetch(
      submitRequest({ name: "", email: "not-an-email", message: "" }),
      env(),
      ctx(),
    )
    expect(res.status).toBe(400)
    expect(lookupSubdomain).not.toHaveBeenCalled()
  })

  it("re-checks enablement server-side rather than trusting the client", async () => {
    vi.mocked(lookupSubdomain).mockResolvedValue({
      status: "found",
      record: { owner: { github: "juan", id: 1 }, features: { tools: { "contact-form": false } } },
    })

    const res = await worker.fetch(submitRequest(VALID_SUBMISSION), env([JUAN_EMAIL]), ctx())

    expect(res.status).toBe(403)
    expect(verifyTurnstile).not.toHaveBeenCalled()
  })

  it("rejects when the owner has no registered contact email even though the flag is on", async () => {
    vi.mocked(lookupSubdomain).mockResolvedValue({ status: "found", record: ENABLED_RECORD })

    const res = await worker.fetch(submitRequest(VALID_SUBMISSION), env([]), ctx())
    expect(res.status).toBe(403)
  })

  it("rejects when the record carries no owner to look an email up for", async () => {
    vi.mocked(lookupSubdomain).mockResolvedValue({
      status: "found",
      record: { features: { tools: { "contact-form": true } } },
    })

    const res = await worker.fetch(submitRequest(VALID_SUBMISSION), env([JUAN_EMAIL]), ctx())
    expect(res.status).toBe(403)
  })

  it("rejects a failed Turnstile challenge before sending mail", async () => {
    vi.mocked(lookupSubdomain).mockResolvedValue({ status: "found", record: ENABLED_RECORD })
    vi.mocked(verifyTurnstile).mockResolvedValue({ success: false })

    const res = await worker.fetch(submitRequest(VALID_SUBMISSION), env([JUAN_EMAIL]), ctx())

    expect(res.status).toBe(400)
    expect(sendSubmission).not.toHaveBeenCalled()
  })

  it("returns a generic error when delivery fails, never Cloudflare's own message", async () => {
    vi.mocked(lookupSubdomain).mockResolvedValue({ status: "found", record: ENABLED_RECORD })
    vi.mocked(verifyTurnstile).mockResolvedValue({ success: true })
    vi.mocked(sendSubmission).mockResolvedValue({ ok: false, error: "internal cf detail" })

    const res = await worker.fetch(submitRequest(VALID_SUBMISSION), env([JUAN_EMAIL]), ctx())

    expect(res.status).toBe(502)
    const body = (await res.json()) as { error: string }
    expect(body.error).not.toContain("internal cf detail")
  })

  it("passes the visitor's IP through to Turnstile verification", async () => {
    vi.mocked(lookupSubdomain).mockResolvedValue({ status: "found", record: ENABLED_RECORD })
    vi.mocked(verifyTurnstile).mockResolvedValue({ success: true })
    vi.mocked(sendSubmission).mockResolvedValue({ ok: true })

    const request = submitRequest(VALID_SUBMISSION)
    request.headers.set("cf-connecting-ip", "203.0.113.9")
    await worker.fetch(request, env([JUAN_EMAIL]), ctx())

    expect(verifyTurnstile).toHaveBeenCalledWith(
      "turnstile-token",
      "secret-key",
      "203.0.113.9",
    )
  })
})

describe("unmatched routes", () => {
  it("404s anything outside the three known endpoints", async () => {
    const res = await worker.fetch(
      new Request("https://juan.is-pinoy.dev/_tools/contact-form/nope"),
      env(),
      ctx(),
    )
    expect(res.status).toBe(404)
  })
})
