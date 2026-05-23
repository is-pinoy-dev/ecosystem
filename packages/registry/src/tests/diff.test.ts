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
