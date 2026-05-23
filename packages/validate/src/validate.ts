import { Domain, domainSchema } from "@is-pinoy-dev/schemas"
import reservedSubdomains from "./reserved_subdomains.json" with { type: "json" }

export function validateDomain(json: Partial<Domain>): {
  ok: boolean
  errors: string[]
} {
  const parsed = domainSchema.safeParse(json)

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)"
      return `${path}: ${issue.message}`
    })
    return { ok: false, errors }
  }

  const domain = parsed.data
  const errors: string[] = []

  if (reservedSubdomains.includes(domain.subdomain)) {
    errors.push(`Reserved subdomain: ${domain.subdomain}`)
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

  return { ok: errors.length === 0, errors }
}
