import type { D1Database } from "@cloudflare/workers-types"

/**
 * The Contact Form delivery address for one subdomain's owner, read from the
 * dashboard's `contact_emails` D1 table (apps/dashboard/lib/db/schema.ts).
 * That table is keyed by GitHub account, not subdomain — Cloudflare Email
 * Routing's own destination-address list is account-wide, so this is the
 * one email an owner registers no matter how many subdomains they hold.
 *
 * Prefers the numeric `id` when the git record carries one, the same
 * ownership-matching precedence the dashboard's read model uses (a login can
 * be renamed and then claimed by somebody else; the id cannot). Falls back
 * to the login only for the older records written before `owner.id` existed.
 */
export async function lookupContactEmail(
  db: D1Database,
  owner: { github?: string; id?: number },
): Promise<string | null> {
  if (owner.id !== undefined) {
    const row = await db
      .prepare("SELECT email FROM contact_emails WHERE github_id = ?")
      .bind(owner.id)
      .first<{ email: string }>()
    if (row) return row.email
  }

  if (owner.github) {
    const row = await db
      .prepare("SELECT email FROM contact_emails WHERE github_login = ?")
      .bind(owner.github)
      .first<{ email: string }>()
    if (row) return row.email
  }

  return null
}
