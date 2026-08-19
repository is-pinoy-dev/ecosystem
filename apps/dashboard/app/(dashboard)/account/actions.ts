"use server"

import { auth } from "@/auth"
import {
  createDestinationAddress,
  getDestinationAddressStatus,
  type DestinationAddressStatus,
} from "@/lib/cloudflare-email"
import { getContactEmail, setContactEmail } from "@/lib/contact-email"
import { contactFormEnabled } from "@/lib/flags-server"

export interface VerifyEmailResult {
  ok: boolean
  status: DestinationAddressStatus
  error?: string
}

/**
 * "Verify email" — the only action that registers an address with
 * Cloudflare Email Routing, separate from (and a prerequisite for) switching
 * Contact Form on for any subdomain this account owns.
 *
 * The address is always the caller's own GitHub account email
 * (`session.user.email`), never a client-supplied string — there is no
 * free-text email field anywhere in this flow. That is a deliberate
 * decision, not an oversight: an earlier version of this feature accepted
 * whatever the browser sent, which is how a stale, unrelated value ended up
 * registered in production instead of the signed-in owner's actual GitHub
 * address. Locking it to the OAuth session's own email is what "the GitHub-
 * configured email address" in the original feature request actually meant.
 *
 * Account-scoped, not subdomain-scoped, on purpose: Cloudflare Email
 * Routing's own destination-address list is account-wide, so this writes
 * one row to the `contact_emails` D1 table (lib/contact-email.ts) — never
 * git, never a pull request — keyed by GitHub account id. Any subdomain
 * this account owns shares the result.
 *
 * Never touches `features.tools["contact-form"]` on any subdomain — turning
 * the feature on is `saveSettings`'s job, once this reports "verified".
 */
export async function verifyContactEmail(): Promise<VerifyEmailResult> {
  const session = await auth()
  if (!session?.user?.login || !session.user.githubId) {
    return {
      ok: false,
      status: "absent",
      error: "You must be signed in to verify an email.",
    }
  }

  const email = session.user.email
  if (!email) {
    return {
      ok: false,
      status: "absent",
      error:
        "Your GitHub account has no email address available. Make sure your GitHub account has a public or primary email set, then sign out and back in.",
    }
  }

  // A server action stays reachable by its own ID once deployed, whatever
  // the page does — the flag has to be checked here too, not only on the
  // panel that calls it (see app/(dashboard)/claim/actions.ts for the same
  // reasoning against the "claims" flag).
  if (!(await contactFormEnabled())) {
    return {
      ok: false,
      status: "absent",
      error: "Contact Form is not available yet.",
    }
  }

  const saved = await setContactEmail(
    session.user.githubId,
    session.user.login,
    email
  )
  if (!saved.ok) {
    return {
      ok: false,
      status: "absent",
      error: "Could not save your email right now. Please try again.",
    }
  }

  const registered = await createDestinationAddress(email)
  if (!registered.ok) {
    return { ok: false, status: "absent", error: registered.error }
  }

  const status = await getDestinationAddressStatus(email).catch(
    (): DestinationAddressStatus => "pending"
  )
  return { ok: true, status }
}

/**
 * Re-read the currently registered email's verification status from
 * Cloudflare — backs the "Recheck" button, since there is no way for
 * Cloudflare to push the result of the owner clicking its confirmation link.
 *
 * Reads the address from the `contact_emails` D1 table via
 * `getContactEmail`, never from client input — same reasoning as
 * `verifyContactEmail`: accepting an arbitrary email here would make this a
 * general oracle for whether any address is a verified destination on the
 * platform's account.
 */
export async function checkContactEmailStatus(): Promise<
  { status: DestinationAddressStatus } | { error: string }
> {
  const session = await auth()
  if (!session?.user?.login || !session.user.githubId) {
    return { error: "You must be signed in." }
  }

  // Same reasoning as verifyContactEmail above: this action is reachable on
  // its own regardless of whether the panel that normally calls it is
  // rendered.
  if (!(await contactFormEnabled())) {
    return { error: "Contact Form is not available yet." }
  }

  const email = await getContactEmail(session.user.githubId)
  if (!email) return { status: "absent" }

  try {
    return { status: await getDestinationAddressStatus(email) }
  } catch {
    return { error: "Could not reach Cloudflare. Please try again." }
  }
}
