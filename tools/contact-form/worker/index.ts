import { lookupSubdomain, isToolEnabled, type DomainRecord } from "./domains"
import { verifyTurnstile } from "./turnstile"
import { sendSubmission } from "./mail"
import { WIDGET_SCRIPT } from "./widget"

export interface Env {
  /** Cloudflare Email Routing send binding — see wrangler.toml. */
  EMAIL: SendEmail
  /** Public Turnstile site key. Not secret — served from GET /config. */
  TURNSTILE_SITE_KEY: string
  /** Secret. Set via `wrangler secret put TURNSTILE_SECRET_KEY`. */
  TURNSTILE_SECRET_KEY: string
}

const PREFIX = "/_tools/contact-form"

const JSON_HEADERS = { "Content-Type": "application/json" }

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

function subdomainFor(hostname: string): string | null {
  const parts = hostname.split(".")
  // <label>.is-pinoy.dev — anything else (the apex, or a hostname this tool
  // was not routed for) has no subdomain to look a record up by.
  if (parts.length <= 2) return null
  return parts.slice(0, -2).join(".")
}

const MAX_FIELD_LENGTH = 5000

interface SubmitBody {
  name: string
  email: string
  message: string
  token: string
}

function parseSubmitBody(value: unknown): SubmitBody | null {
  if (!value || typeof value !== "object") return null
  const body = value as Record<string, unknown>
  const { name, email, message, token } = body
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    typeof token !== "string"
  ) {
    return null
  }
  if (!name.trim() || !email.trim() || !message.trim() || !token) return null
  if (
    name.length > MAX_FIELD_LENGTH ||
    email.length > MAX_FIELD_LENGTH ||
    message.length > MAX_FIELD_LENGTH
  ) {
    return null
  }
  // Cheap shape check — real deliverability is Cloudflare's problem once the
  // owner's address is a verified destination.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return { name: name.trim(), email: email.trim(), message: message.trim(), token }
}

/**
 * Whether the tool is enabled for this subdomain AND the record actually has
 * somewhere to deliver mail. Both checks happen here, server-side — never
 * trust what `GET /config` told the widget, since that response is fully
 * visible and replayable by anyone.
 *
 * Unlike tools/site-audit, this fails *closed* when the domains repo cannot
 * be reached. Site Audit fails open because the worst case is a page that
 * runs anyway; here the worst case would be accepting a submission with no
 * verified place to route it — the domains repo is the only source for
 * `contactForm.email`, so "unavailable" and "no address to send to" are the
 * same situation from this endpoint's point of view.
 */
async function resolveEnabled(
  subdomain: string,
  ctx: ExecutionContext,
): Promise<
  | { ok: true; record: DomainRecord; destinationEmail: string }
  | { ok: false; reason: "unclaimed" | "unavailable" | "not-enabled" | "no-email" }
> {
  const lookup = await lookupSubdomain(subdomain, ctx)
  if (lookup.status !== "found") {
    return { ok: false, reason: lookup.status }
  }
  if (!isToolEnabled(lookup.record, "contact-form")) {
    return { ok: false, reason: "not-enabled" }
  }
  const destinationEmail = lookup.record.contactForm?.email
  if (!destinationEmail) {
    return { ok: false, reason: "no-email" }
  }
  return { ok: true, record: lookup.record, destinationEmail }
}

async function handleConfig(
  subdomain: string,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const resolved = await resolveEnabled(subdomain, ctx)
  return json({
    enabled: resolved.ok,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY,
  })
}

async function handleSubmit(
  request: Request,
  subdomain: string,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return json({ error: "Invalid request body." }, 400)
  }

  const body = parseSubmitBody(raw)
  if (!body) {
    return json({ error: "Please fill in every field." }, 400)
  }

  // Re-checked here rather than trusted from /config — enablement and the
  // contact form's destination email are both facts about the record that
  // could have changed, or been spoofed, since the widget last asked.
  const resolved = await resolveEnabled(subdomain, ctx)
  if (!resolved.ok) {
    console.warn(
      `[contact-form] submit blocked subdomain=${subdomain} reason=${resolved.reason}`,
    )
    return json({ error: "This contact form is not available." }, 403)
  }

  const remoteip = request.headers.get("cf-connecting-ip") ?? undefined
  const verified = await verifyTurnstile(body.token, env.TURNSTILE_SECRET_KEY, remoteip)
  if (!verified.success) {
    return json({ error: "Verification failed. Please try again." }, 400)
  }

  const result = await sendSubmission(env.EMAIL, resolved.destinationEmail, {
    name: body.name,
    email: body.email,
    message: body.message,
    subdomain,
  })

  if (!result.ok) {
    // The real cause is almost always an owner address that isn't a verified
    // Cloudflare Email Routing destination yet — never surface that detail to
    // a visitor who has no way to act on it.
    return json(
      { error: "Your message could not be delivered. Please try again later." },
      502,
    )
  }

  return json({ ok: true })
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const subdomain = subdomainFor(url.hostname)

    if (
      request.method === "GET" &&
      url.pathname === `${PREFIX}/widget.js`
    ) {
      return new Response(WIDGET_SCRIPT, {
        headers: {
          "Content-Type": "application/javascript;charset=UTF-8",
          "Cache-Control": "public, max-age=3600",
        },
      })
    }

    if (request.method === "GET" && url.pathname === `${PREFIX}/config`) {
      if (!subdomain) return json({ enabled: false, turnstileSiteKey: "" })
      return handleConfig(subdomain, env, ctx)
    }

    if (request.method === "POST" && url.pathname === `${PREFIX}/submit`) {
      if (!subdomain) return json({ error: "No subdomain in this request." }, 400)
      return handleSubmit(request, subdomain, env, ctx)
    }

    return json({ error: "Not found." }, 404)
  },
} satisfies ExportedHandler<Env>
