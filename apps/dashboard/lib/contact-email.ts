import "server-only"

import { eq } from "drizzle-orm"

import { getDb, hasDatabase } from "@/lib/db"
import { contactEmails } from "@/lib/db/schema"

// The Contact Form feature's delivery address, read from and written to the
// dedicated `contact_emails` D1 table (see lib/db/schema.ts) — never git.
// One row per GitHub account, keyed by `githubId`, because Cloudflare Email
// Routing's own destination-address list is account-wide: an owner with
// several subdomains has exactly one address to verify.

/** The signed-in GitHub account's registered contact email, or null. */
export async function getContactEmail(
  githubId: number
): Promise<string | null> {
  if (!hasDatabase()) return null

  try {
    const rows = await getDb()
      .select({ email: contactEmails.email })
      .from(contactEmails)
      .where(eq(contactEmails.githubId, githubId))
    return rows[0]?.email ?? null
  } catch (error) {
    console.error("[contact-email] read failed", error)
    return null
  }
}

/**
 * Upsert the delivery address for one GitHub account. Returns whether it
 * succeeded rather than throwing, matching `getContactEmail`'s shape — a
 * deployment with D1 unconfigured, or a transient write failure, should
 * surface as a normal `{ ok: false }` result from the calling server action,
 * not an uncaught exception.
 */
export async function setContactEmail(
  githubId: number,
  githubLogin: string,
  email: string
): Promise<{ ok: true } | { ok: false }> {
  if (!hasDatabase()) return { ok: false }

  try {
    const updatedAt = new Date()
    await getDb()
      .insert(contactEmails)
      .values({ githubId, githubLogin, email, updatedAt })
      .onConflictDoUpdate({
        target: contactEmails.githubId,
        set: { githubLogin, email, updatedAt },
      })
    return { ok: true }
  } catch (error) {
    console.error("[contact-email] write failed", error)
    return { ok: false }
  }
}
