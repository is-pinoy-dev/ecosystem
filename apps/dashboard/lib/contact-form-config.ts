import "server-only"

import { contactFormSchema } from "@is-pinoy-dev/schemas"

// The `contactForm` block of one record, read straight from the domains repo.
//
// Read here rather than from the dashboard's D1 read model on purpose. The
// read model carries `records` and `features` but not `contactForm` (see
// lib/domains.ts), and it is populated by the sync workflow in the domains
// repo — a surface we would have to change in lockstep to widen it. The block
// is also inert to Cloudflare sync: only tools/contact-form reads it, so its
// state is exactly the file in git and nothing else. One cached fetch of the
// file the edit would rewrite is both the cheapest and the freshest answer.
//
// Deliberately separate from `owner.email`, the older, general-purpose
// maintainer-contact field on the D1-mirrored record — that field is a
// different, unrelated value with its own documented meaning and must never
// be conflated with the Contact Form feature's delivery address.

const DOMAINS_REPO = "is-pinoy-dev/domains"
const REVALIDATE_SECONDS = 300

/** The record's Contact Form delivery address, or null when it has none (or is unreadable). */
export async function getContactFormEmail(
  subdomain: string
): Promise<string | null> {
  let res: Response
  try {
    res = await fetch(
      `https://raw.githubusercontent.com/${DOMAINS_REPO}/main/subdomains/${subdomain}.json`,
      { next: { revalidate: REVALIDATE_SECONDS } }
    )
  } catch {
    // The email panel is one section of a page that has plenty else to show;
    // a registry read that fails simply hides it.
    return null
  }
  if (!res.ok) return null

  let file: { contactForm?: unknown }
  try {
    file = (await res.json()) as { contactForm?: unknown }
  } catch {
    return null
  }

  // contactFormSchema is `.optional()`, so a record with no block parses
  // successfully to `undefined` — that is the "never used Contact Form" case,
  // not a failure.
  const parsed = contactFormSchema.safeParse(file.contactForm)
  if (!parsed.success || !parsed.data) return null

  return parsed.data.email
}
