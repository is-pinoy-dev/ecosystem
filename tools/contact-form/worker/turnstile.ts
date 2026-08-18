/**
 * Cloudflare Turnstile verification.
 *
 * One global site key (public, served from `/config`) plus one global secret
 * (`TURNSTILE_SECRET_KEY`, a Worker secret) — not per-subdomain. See the plan
 * for why: per-subdomain keys would need new Cloudflare provisioning and
 * per-subdomain secret storage that has no precedent in this repo, for no v1
 * benefit.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export interface TurnstileResult {
  success: boolean
  /** Only present on failure — Cloudflare's machine-readable reason codes. */
  errorCodes?: string[]
}

/**
 * Verify a widget token server-side. Never trust the client's own read of
 * whether the challenge passed — this is the only check that counts.
 */
export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteip?: string,
): Promise<TurnstileResult> {
  if (!token) return { success: false, errorCodes: ["missing-input-response"] }

  const body = new URLSearchParams({ secret, response: token })
  if (remoteip) body.set("remoteip", remoteip)

  let res: Response
  try {
    res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
  } catch {
    console.warn("[contact-form] turnstile siteverify threw")
    return { success: false, errorCodes: ["internal-error"] }
  }

  if (!res.ok) {
    console.warn(`[contact-form] turnstile siteverify failed status=${res.status}`)
    return { success: false, errorCodes: ["internal-error"] }
  }

  const json = (await res.json()) as {
    success?: boolean
    "error-codes"?: string[]
  }

  return {
    success: json.success === true,
    errorCodes: json["error-codes"],
  }
}
