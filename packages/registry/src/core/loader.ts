import fs from "fs";
import path from "path";
import type { ZodIssue } from "zod";
import {
  domainSchema,
  resolvedDomainSchema,
  ResolvedDomainsSchema,
} from "@is-pinoy-dev/schemas";
import type { ResolvedDomain, ResolvedDomains } from "@is-pinoy-dev/schemas";

const DOMAIN_DIR = "domains";
const MAX_FILE_SIZE = 64 * 1024; // 64 KB — domain files should never approach this

export interface SchemaIssue {
  path: string;
  message: string;
}

export class SchemaError extends Error {
  constructor(
    public readonly file: string,
    public readonly issues: SchemaIssue[],
  ) {
    super(`Schema error in ${file}`);
    this.name = "SchemaError";
  }
}

function flattenIssues(
  issues: ZodIssue[],
  parentPath: (string | number)[] = [],
): SchemaIssue[] {
  const result: SchemaIssue[] = [];
  for (const issue of issues) {
    const fullPath = [...parentPath, ...(issue.path as (string | number)[])];
    if (issue.code === "invalid_union") {
      // Pick the most specific branch (fewest issues)
      const branches = (issue as unknown as { errors: ZodIssue[][] }).errors
        .map((branchIssues) => flattenIssues(branchIssues, fullPath))
        .sort((a, b) => a.length - b.length);
      result.push(...(branches[0] ?? []));
    } else {
      result.push({
        path: fullPath.length > 0 ? fullPath.join(".") : "(root)",
        message: issue.message,
      });
    }
  }
  return result;
}

export function loadDomains(dir: string = DOMAIN_DIR): ResolvedDomains {
  // Guard against symlinked or non-existent directories.
  const dirStat = fs.lstatSync(dir, { throwIfNoEntry: false });
  if (!dirStat?.isDirectory()) {
    throw new Error(`Domains directory not found or not a directory: ${dir}`);
  }

  const files = fs.readdirSync(dir);
  const domains: ResolvedDomain[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const filePath = path.join(dir, file);

    // Reject symlinks to prevent symlink-based file reads outside the directory.
    const stat = fs.lstatSync(filePath);
    if (stat.isSymbolicLink()) {
      throw new Error(`Symlinks are not permitted in the domains directory: ${file}`);
    }

    // Reject oversized files before parsing to prevent memory exhaustion.
    if (stat.size > MAX_FILE_SIZE) {
      throw new SchemaError(file, [
        { path: "(root)", message: `File exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes` },
      ]);
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);

    const parsed = domainSchema.safeParse(json);
    if (!parsed.success) {
      throw new SchemaError(file, flattenIssues(parsed.error.issues));
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
