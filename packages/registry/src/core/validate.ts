import { loadDomains } from "./loader.js";
import reservedSubdomains from "../reserved_subdomains.json" with { type: "json" };

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

    if (reservedSubdomains.includes(domain.subdomain)) {
      errors.push(`Reserved subdomain: ${domain.subdomain}`);
    }

    for (const records of Object.values(domain.records)) {
      if (!records) continue;
      const list = Array.isArray(records) ? records : [records];
      for (const record of list) {
        if (!record.value) {
          errors.push(`${domain.subdomain}: empty record value`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
