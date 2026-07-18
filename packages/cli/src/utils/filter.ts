import path from "path";

interface HasFile {
  file: string;
}

/**
 * Restricts loaded domains to only those whose JSON file appears in `changed`.
 *
 * `changed` is a list of file paths (e.g. from `git diff --name-only`), which may
 * include full repo-relative paths, non-JSON files, and files outside the domains
 * directory. Matching is done on the basename so `subdomains/jun.json` matches a
 * domain whose `file` is `jun.json`. This lets CI scope a diff/dry-run strictly to
 * the subdomains touched by a PR instead of the entire registry.
 */
export function filterDomainsByChangedFiles<T extends HasFile>(
  domains: T[],
  changed: string[],
): T[] {
  const changedBasenames = new Set(
    changed
      .map((f) => f.trim())
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.basename(f)),
  );

  return domains.filter((d) => changedBasenames.has(path.basename(d.file)));
}
