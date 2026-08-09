import { describe, it, expect, vi } from "vitest";

vi.mock("../core/loader.js", () => ({
  loadDomains: vi.fn(),
}));

import { loadDomains } from "../core/loader.js";
import { validateDomains } from "../core/validate.js";

describe("validateDomains", () => {
  it("returns ok when all domains are valid", () => {
    vi.mocked(loadDomains).mockReturnValue([
      {
        subdomain: "jun",
        owner: { github: "bosquejun" },
        records: { CNAME: { value: "jun.vercel.app" } },
        file: "jun.json",
      },
    ]);

    const result = validateDomains();
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("reports duplicate subdomains", () => {
    vi.mocked(loadDomains).mockReturnValue([
      {
        subdomain: "jun",
        owner: { github: "a" },
        records: { CNAME: { value: "a.vercel.app" } },
        file: "jun.json",
      },
      {
        subdomain: "jun",
        owner: { github: "b" },
        records: { CNAME: { value: "b.vercel.app" } },
        file: "jun2.json",
      },
    ]);

    const result = validateDomains();
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Duplicate subdomain: jun");
  });

  it("reports filename mismatch", () => {
    vi.mocked(loadDomains).mockReturnValue([
      {
        subdomain: "jun",
        owner: { github: "bosquejun" },
        records: { CNAME: { value: "jun.vercel.app" } },
        file: "wrong.json",
      },
    ]);

    const result = validateDomains();
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "Filename mismatch: jun.json vs wrong.json",
    );
  });

  it("reports reserved subdomains", () => {
    vi.mocked(loadDomains).mockReturnValue([
      {
        subdomain: "www",
        owner: { github: "hacker" },
        records: { CNAME: { value: "evil.vercel.app" } },
        file: "www.json",
      },
    ]);

    const result = validateDomains();
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Reserved subdomain: www");
  });
});

describe("validateDomains — per-owner quota", () => {
  const portfolio = (subdomain: string, github: string, id?: number) => ({
    subdomain,
    owner: { github, ...(id ? { id } : {}) },
    portfolio: { template: "terminal" as const },
    records: { CNAME: { value: "portfolio.is-pinoy.dev" } },
    file: `${subdomain}.json`,
  });
  const custom = (subdomain: string, github: string, id?: number) => ({
    subdomain,
    owner: { github, ...(id ? { id } : {}) },
    records: { CNAME: { value: "x.vercel-dns-016.com" } },
    file: `${subdomain}.json`,
  });

  it("warns rather than errors, so one over-quota account can't red the whole registry", () => {
    vi.mocked(loadDomains).mockReturnValue([
      custom("one", "juan"),
      custom("two", "juan"),
    ]);

    const result = validateDomains();
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      "@juan holds 2 custom subdomains (limit 1): one, two",
    ]);
  });

  it("counts a renamed account's records as one owner via the numeric ID", () => {
    // Renaming the GitHub account is the only route to a second portfolio.
    // Keyed on the login these would look like two different people.
    vi.mocked(loadDomains).mockReturnValue([
      portfolio("oldname", "oldname", 42),
      portfolio("newname", "newname", 42),
    ]);

    const result = validateDomains();
    expect(result.warnings).toEqual([
      "@oldname holds 2 hosted portfolios (limit 1): oldname, newname",
    ]);
  });

  it("stays quiet at exactly one of each", () => {
    vi.mocked(loadDomains).mockReturnValue([
      portfolio("juan", "juan", 7),
      custom("juan-blog", "juan", 7),
    ]);

    expect(validateDomains().warnings).toEqual([]);
  });

  it("ignores records marked for destruction", () => {
    vi.mocked(loadDomains).mockReturnValue([
      { ...custom("one", "juan"), destroy: true },
      custom("two", "juan"),
    ]);

    expect(validateDomains().warnings).toEqual([]);
  });
});
