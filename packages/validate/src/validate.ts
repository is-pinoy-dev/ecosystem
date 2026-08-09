import { Domain, domainSchema } from "@is-pinoy-dev/schemas"
import { RESERVED_SUBDOMAINS as reservedSubdomains } from "./reserved.js"

// Vercel issues a project-specific `*.vercel-dns-*.com` CNAME target only
// after a custom domain is added in that project's dashboard. A CNAME
// pointed at the bare `*.vercel.app` deployment alias instead usually means
// that step was skipped, and Vercel's edge will 404 the domain until it is
// (see is-pinoy-dev/domains docs/providers/vercel.md).
const VERCEL_APP_ALIAS_PATTERN = /\.vercel\.app\.?$/i

export function validateDomain(json: Partial<Domain>): {
  ok: boolean
  errors: string[]
  warnings: string[]
} {
  const parsed = domainSchema.safeParse(json)

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)"
      return `${path}: ${issue.message}`
    })
    return { ok: false, errors, warnings: [] }
  }

  const domain = parsed.data
  const errors: string[] = []
  const warnings: string[] = []

  if (reservedSubdomains.includes(domain.subdomain)) {
    errors.push(`Reserved subdomain: ${domain.subdomain}`)
  }

  // A hosted portfolio renders `owner.github`'s GitHub profile at
  // `<subdomain>.is-pinoy.dev`. If those two disagree, the address advertises
  // one person and the page shows another's profile — which is the whole
  // mechanism of an impersonation claim, not a cosmetic mismatch. The
  // dashboard can no longer produce such a record; this closes the same door
  // for a hand-written pull request, where nothing else would catch it.
  //
  // Only hosted portfolios are constrained. A subdomain pointed at your own
  // host carries no `portfolio` block and stays free to be called anything.
  // A record marked for destruction is mid-teardown and about to stop
  // existing. Holding it to the rule would block the very pull request that
  // retires a non-conforming portfolio — the one change that fixes it.
  if (domain.portfolio && !domain.destroy) {
    const expected = domain.owner.github.toLowerCase()
    if (domain.subdomain !== expected) {
      errors.push(
        `${domain.subdomain}: a hosted portfolio must use its owner's GitHub username as the subdomain — expected "${expected}.is-pinoy.dev" for @${domain.owner.github}. Rename the file to ${expected}.json, or drop the "portfolio" block to keep this as an ordinary subdomain.`
      )
    }
  }

  // Belt-and-suspenders: Zod's min(1)/ipv4/ipv6 constraints already enforce non-empty
  // values, so this loop is unreachable under the current schema. It guards against
  // future schema relaxation that could allow empty values through.
  for (const records of Object.values(domain.records)) {
    if (!records) continue
    const list = Array.isArray(records) ? records : [records]
    for (const record of list) {
      if (!record.value) {
        errors.push(`${domain.subdomain}: empty record value`)
      }
    }
  }

  const cnames = domain.records.CNAME
    ? Array.isArray(domain.records.CNAME)
      ? domain.records.CNAME
      : [domain.records.CNAME]
    : []
  for (const record of cnames) {
    if (VERCEL_APP_ALIAS_PATTERN.test(record.value)) {
      warnings.push(
        `${domain.subdomain}: CNAME target "${record.value}" looks like a Vercel deployment alias (*.vercel.app), not the vercel-dns-*.com target Vercel issues for a custom domain — confirm this domain has been added in the Vercel project's dashboard, or it will 404`
      )
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}
