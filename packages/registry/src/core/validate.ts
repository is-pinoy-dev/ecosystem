import { validateDomain } from "@is-pinoy-dev/validate";
import { loadDomains } from "./loader.js";

export function validateDomains(dir?: string) {
  const domains = loadDomains(dir);

  const errors: string[] = [];
  const seen = new Set<string>();

  for (const domain of domains) {
    const expectedFile = `${domain.subdomain}.json`;

    if (seen.has(domain.subdomain)) {
      errors.push(`Duplicate subdomain: ${domain.subdomain}`);
    }
    seen.add(domain.subdomain);

    if (expectedFile !== domain.file) {
      errors.push(`Filename mismatch: ${expectedFile} vs ${domain.file}`);
    }

    // ResolvedDomain includes a `file` field not in domainSchema — Zod strips unknown keys, so this is safe.
    const result = validateDomain(domain);
    errors.push(...result.errors);
  }

  return { ok: errors.length === 0, errors };
}
