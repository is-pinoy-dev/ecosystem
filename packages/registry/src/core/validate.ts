import { validateDomain } from "@is-pinoy-dev/validate";
import type { ResolvedDomain } from "@is-pinoy-dev/schemas";
import { loadDomains } from "./loader.js";

/**
 * How many of each kind of subdomain one person may hold: a hosted portfolio
 * (rendered from their GitHub profile, claimed through the dashboard) and a
 * custom subdomain (pointed at their own host, claimed by pull request).
 */
export const QUOTA = { portfolio: 1, custom: 1 } as const;

/**
 * Who a record belongs to, for counting purposes.
 *
 * The numeric account ID is preferred because it survives a GitHub rename —
 * without it, renaming is a way to reset your own quota. It is absent on every
 * record written before `owner.id` existed, so the lowercased login is the
 * fallback, and a person mid-migration can briefly count as two owners. That
 * undercounts rather than blocking anyone wrongly, which is the right way for
 * this to fail.
 */
function ownerKey(domain: ResolvedDomain): string {
  return domain.owner.id !== undefined
    ? `id:${domain.owner.id}`
    : `login:${domain.owner.github.toLowerCase()}`;
}

export function validateDomains(dir?: string) {
  const domains = loadDomains(dir);

  const errors: string[] = [];
  const warnings: string[] = [];
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
    warnings.push(...result.warnings);
  }

  warnings.push(...quotaWarnings(domains));

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Per-owner quota, reported as warnings rather than errors.
 *
 * This is deliberately not a hard failure. `validateDomains` checks every file
 * in the directory on every run, so promoting this to an error would fail CI
 * on pull requests that touch none of the offending records — including the
 * registry's existing over-quota accounts, which predate the rule. A warning
 * puts the count in front of the maintainer who merges the pull request, which
 * is where an exception can actually be granted.
 *
 * The automated path is enforced properly at the source instead: the dashboard
 * refuses to open a second portfolio claim.
 */
function quotaWarnings(domains: ResolvedDomain[]): string[] {
  const counts = new Map<
    string,
    { login: string; portfolio: string[]; custom: string[] }
  >();

  for (const domain of domains) {
    if (domain.destroy) continue;
    const key = ownerKey(domain);
    const entry = counts.get(key) ?? {
      login: domain.owner.github,
      portfolio: [],
      custom: [],
    };
    (domain.portfolio ? entry.portfolio : entry.custom).push(domain.subdomain);
    counts.set(key, entry);
  }

  const warnings: string[] = [];
  for (const { login, portfolio, custom } of counts.values()) {
    if (portfolio.length > QUOTA.portfolio) {
      warnings.push(
        `@${login} holds ${portfolio.length} hosted portfolios (limit ${QUOTA.portfolio}): ${portfolio.join(", ")}`
      );
    }
    if (custom.length > QUOTA.custom) {
      warnings.push(
        `@${login} holds ${custom.length} custom subdomains (limit ${QUOTA.custom}): ${custom.join(", ")}`
      );
    }
  }
  return warnings;
}
