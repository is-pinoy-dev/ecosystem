import fs from "fs";
import path from "path";
import {
  domainSchema,
  resolvedDomainSchema,
  ResolvedDomainsSchema,
} from "@is-pinoy/schemas";
import type { ResolvedDomain, ResolvedDomains } from "@is-pinoy/schemas";

const DOMAIN_DIR = "domains";

export function loadDomains(dir: string = DOMAIN_DIR): ResolvedDomains {
  const files = fs.readdirSync(dir);

  const domains: ResolvedDomain[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const json = JSON.parse(raw);

    const parsed = domainSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`Schema error in ${file}: ${parsed.error.message}`);
    }

    domains.push(
      resolvedDomainSchema.parse({
        ...parsed.data,
        file,
      }),
    );
  }

  return ResolvedDomainsSchema.parse(domains);
}
