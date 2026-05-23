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
