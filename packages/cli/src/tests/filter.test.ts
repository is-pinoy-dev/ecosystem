import { describe, it, expect } from "vitest";
import { filterDomainsByChangedFiles } from "../utils/filter.js";

const domains = [
  { file: "jun.json", subdomain: "jun" },
  { file: "maria.json", subdomain: "maria" },
  { file: "carlo.json", subdomain: "carlo" },
];

describe("filterDomainsByChangedFiles", () => {
  it("keeps only domains whose file is in the changed list", () => {
    const result = filterDomainsByChangedFiles(domains, ["subdomains/jun.json"]);
    expect(result).toHaveLength(1);
    expect(result[0]?.subdomain).toBe("jun");
  });

  it("matches on basename regardless of the changed path prefix", () => {
    const result = filterDomainsByChangedFiles(domains, [
      "any/nested/path/maria.json",
    ]);
    expect(result.map((d) => d.subdomain)).toEqual(["maria"]);
  });

  it("ignores non-JSON changed files", () => {
    const result = filterDomainsByChangedFiles(domains, [
      "README.md",
      "subdomains/carlo.json",
    ]);
    expect(result.map((d) => d.subdomain)).toEqual(["carlo"]);
  });

  it("returns an empty list when no changed file matches a domain", () => {
    const result = filterDomainsByChangedFiles(domains, [
      "subdomains/unknown.json",
    ]);
    expect(result).toHaveLength(0);
  });

  it("handles multiple changed files", () => {
    const result = filterDomainsByChangedFiles(domains, [
      "subdomains/jun.json",
      "subdomains/carlo.json",
    ]);
    expect(result.map((d) => d.subdomain).sort()).toEqual(["carlo", "jun"]);
  });
});
