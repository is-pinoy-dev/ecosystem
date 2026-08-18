import { createMimeMessage, Mailbox } from "mimetext/browser"
import { EmailMessage } from "cloudflare:email"

/**
 * Delivering a submission to its owner via Cloudflare Email Routing's
 * `send_email` binding.
 *
 * `mimetext/browser` rather than the package's default `mimetext` entry: the
 * default build reaches for `node:os` and `Buffer`, which do not exist on a
 * plain Worker (no `nodejs_compat` here — see wrangler.toml). The browser
 * build uses `js-base64` instead and needs nothing from the runtime.
 *
 * Sender is a fixed address so Cloudflare Email Routing only ever needs one
 * verified *sending* identity (verified once, for the whole zone, as part of
 * enabling Email Routing — see wrangler.toml). `reply-to` carries the
 * visitor's own address so the owner can hit reply directly without ever
 * needing to see or copy it — there is deliberately no submissions viewer to
 * look it up in.
 */
const SENDER_ADDRESS = "contact@is-pinoy.dev"
const SENDER_NAME = "is-pinoy.dev contact form"

export interface ContactSubmission {
  name: string
  email: string
  message: string
  subdomain: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildMessage(to: string, submission: ContactSubmission): string {
  const { name, email, message, subdomain } = submission
  const msg = createMimeMessage()
  msg.setSender({ name: SENDER_NAME, addr: SENDER_ADDRESS })
  msg.setRecipient(to)
  msg.setSubject(`New message from ${subdomain}.is-pinoy.dev`)
  // The submitter's own address, not ours — replying goes straight to them.
  // `setHeader` validates a mailbox-typed field against `instanceof Mailbox`,
  // so a bare string is rejected; wrap it explicitly.
  msg.setHeader("Reply-To", new Mailbox(email))
  msg.addMessage({
    contentType: "text/plain",
    data:
      `You have a new message from the contact form on ${subdomain}.is-pinoy.dev.\n\n` +
      `From: ${name} <${email}>\n\n` +
      `${message}\n\n` +
      `---\nReply to this email to respond directly to ${name}.`,
  })
  msg.addMessage({
    contentType: "text/html",
    data:
      `<p>You have a new message from the contact form on ` +
      `<strong>${escapeHtml(subdomain)}.is-pinoy.dev</strong>.</p>` +
      `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>` +
      `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>` +
      `<hr><p>Reply to this email to respond directly to ${escapeHtml(name)}.</p>`,
  })
  return msg.asRaw()
}

export type SendResult = { ok: true } | { ok: false; error: string }

/**
 * Send a submission to the owner. Failures are caught here rather than left
 * to the caller — the most likely cause is an unverified destination
 * address, and Cloudflare's own error text for that is not something to hand
 * a visitor.
 */
export async function sendSubmission(
  email: SendEmail,
  ownerEmail: string,
  submission: ContactSubmission,
): Promise<SendResult> {
  try {
    const raw = buildMessage(ownerEmail, submission)
    const message = new EmailMessage(SENDER_ADDRESS, ownerEmail, raw)
    await email.send(message)
    return { ok: true }
  } catch (error) {
    console.error(
      `[contact-form] send failed subdomain=${submission.subdomain}`,
      error instanceof Error ? error.message : String(error),
    )
    return { ok: false, error: "Could not deliver the message." }
  }
}
