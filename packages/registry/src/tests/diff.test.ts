import { describe, it, expect, beforeEach } from "vitest";
import { diff } from "../core/diff.js";
import type { Domain, CloudflareRecord } from "@is-pinoy-dev/schemas";

describe("diff", () => {
  beforeEach(() => {
    process.env.DOMAIN = "is-pinoy.dev";
  });

  it("creates missing DNS record", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "jun.vercel.app" } },
      },
    ];
    const actual: CloudflareRecord[] = [];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("CREATE");
  });

  it("updates changed DNS record", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "new.vercel.app" } },
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "123",
        name: "jun.is-pinoy.dev",
        type: "CNAME",
        content: "old.vercel.app",
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("UPDATE");
  });

  it("deletes removed DNS record when destroy is true", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "jun.vercel.app" } },
        destroy: true,
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "123",
        name: "jun.is-pinoy.dev",
        type: "CNAME",
        content: "jun.vercel.app",
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("DELETE");
  });

  it("does NOT delete when destroy is absent", () => {
    const desired: Domain[] = [];
    const actual: CloudflareRecord[] = [
      {
        id: "123",
        name: "jun.is-pinoy.dev",
        type: "CNAME",
        content: "jun.vercel.app",
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("does NOT delete when destroy is false", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "jun.vercel.app" } },
        destroy: false,
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "123",
        name: "jun.is-pinoy.dev",
        type: "CNAME",
        content: "jun.vercel.app",
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("TXT records use _{provider}.{domain} naming", () => {
    const desired: Domain[] = [
      {
        subdomain: "test",
        owner: { github: "test" },
        records: {
          TXT: {
            value: "vc-domain-verify=test.is-pinoy.dev,abc123",
            provider: "vercel",
          },
        },
      },
    ];
    const actual: CloudflareRecord[] = [];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("CREATE");
    expect(result[0]?.fqdn).toBe("_vercel.is-pinoy.dev");
  });

  it("TXT records match existing _{provider}.{domain} records", () => {
    const desired: Domain[] = [
      {
        subdomain: "test",
        owner: { github: "test" },
        records: {
          TXT: {
            value: "vc-domain-verify=test.is-pinoy.dev,abc123",
            provider: "vercel",
          },
        },
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "456",
        name: "_vercel.is-pinoy.dev",
        type: "TXT",
        content: '"vc-domain-verify=test.is-pinoy.dev,abc123"',
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("TXT value without quotes matches Cloudflare value with quotes", () => {
    const desired: Domain[] = [
      {
        subdomain: "test",
        owner: { github: "test" },
        records: {
          TXT: {
            value: "vc-domain-verify=test.is-pinoy.dev,abc123",
            provider: "vercel",
          },
        },
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "456",
        name: "_vercel.is-pinoy.dev",
        type: "TXT",
        content: '"vc-domain-verify=test.is-pinoy.dev,abc123"',
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("does not generate duplicate CREATE when multiple A records already exist", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { A: [{ value: "1.2.3.4" }, { value: "5.6.7.8" }] },
      },
    ];
    const actual: CloudflareRecord[] = [
      { id: "cf1", name: "jun.is-pinoy.dev", type: "A", content: "1.2.3.4" },
      { id: "cf2", name: "jun.is-pinoy.dev", type: "A", content: "5.6.7.8" },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("creates only the missing record when one of multiple A records is new", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { A: [{ value: "1.2.3.4" }, { value: "9.9.9.9" }] },
      },
    ];
    const actual: CloudflareRecord[] = [
      { id: "cf1", name: "jun.is-pinoy.dev", type: "A", content: "1.2.3.4" },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("CREATE");
    if (result[0]?.type === "CREATE") {
      expect(result[0].record.value).toBe("9.9.9.9");
    }
  });

  it("does not attempt to update a record when an identical one already exists alongside it", () => {
    // Regression: find() without content check would always return the first
    // actual record, causing a bogus UPDATE that Cloudflare rejects with 81058.
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { A: [{ value: "1.2.3.4" }, { value: "5.6.7.8" }] },
      },
    ];
    // Cloudflare returns records in reverse order from what we expect.
    const actual: CloudflareRecord[] = [
      { id: "cf1", name: "jun.is-pinoy.dev", type: "A", content: "5.6.7.8" },
      { id: "cf2", name: "jun.is-pinoy.dev", type: "A", content: "1.2.3.4" },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("destroy deletes both CNAME and TXT records", () => {
    const desired: Domain[] = [
      {
        subdomain: "test",
        owner: { github: "test" },
        records: {
          CNAME: { value: "test.vercel.app" },
          TXT: {
            value: "vc-domain-verify=test.is-pinoy.dev,abc123",
            provider: "vercel",
          },
        },
        destroy: true,
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "1",
        name: "test.is-pinoy.dev",
        type: "CNAME",
        content: "test.vercel.app",
      },
      {
        id: "2",
        name: "_vercel.is-pinoy.dev",
        type: "TXT",
        content: '"vc-domain-verify=test.is-pinoy.dev,abc123"',
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(2);
    expect(result[0]?.type).toBe("DELETE");
    expect(result[1]?.type).toBe("DELETE");
  });
});
