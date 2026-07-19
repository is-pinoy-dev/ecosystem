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

  it("TXT records use the shared _{provider}.{zone} naming", () => {
    // Not _{provider}.{subdomain}.{zone}: Vercel's own ownership check
    // resolves at the registrable-domain boundary, which for a non-PSL zone
    // is the zone itself — a per-subdomain name is never queried by Vercel.
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

  it("TXT records match existing records at the shared _{provider}.{zone} name", () => {
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

  it("generates UPDATE when proxied changes but content is same", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "jun.vercel.app", proxied: true } },
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "123",
        name: "jun.is-pinoy.dev",
        type: "CNAME",
        content: "jun.vercel.app",
        proxied: false,
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("UPDATE");
  });

  it("generates UPDATE when TTL changes but content is same", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { A: { value: "1.2.3.4", ttl: 3600 } },
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "123",
        name: "jun.is-pinoy.dev",
        type: "A",
        content: "1.2.3.4",
        proxied: false,
        ttl: 1,
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("UPDATE");
  });

  it("does not generate UPDATE when content, proxied, and TTL all match", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "jun.vercel.app", proxied: true } },
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "123",
        name: "jun.is-pinoy.dev",
        type: "CNAME",
        content: "jun.vercel.app",
        proxied: true,
        ttl: 1,
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("does not generate UPDATE when Cloudflare CNAME content has a trailing dot", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "jun.vercel.app" } },
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "123",
        name: "jun.is-pinoy.dev",
        type: "CNAME",
        content: "jun.vercel.app.", // trailing dot from CF
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("does not generate UPDATE when Cloudflare CNAME content has different casing", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "jun.vercel.app" } },
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "123",
        name: "jun.is-pinoy.dev",
        type: "CNAME",
        content: "JUN.VERCEL.APP", // uppercase from CF
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("does not generate UPDATE when Cloudflare CNAME content has both trailing dot and different casing", () => {
    const desired: Domain[] = [
      {
        subdomain: "roasi",
        owner: { github: "roasi" },
        records: { CNAME: { value: "cname.vercel-dns.com" } },
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "456",
        name: "roasi.is-pinoy.dev",
        type: "CNAME",
        content: "Cname.Vercel-Dns.Com.",
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("TXT records for different subdomains do not collide at the shared name", () => {
    // Both foo and bar's TXT records resolve to the same shared
    // _vercel.is-pinoy.dev name. foo's exact value already matches an
    // existing actual record; bar's is new. A byTypeMap fallback keyed on
    // fqdn+type alone would find bar's desired record "matches" foo's
    // unclaimed actual record (same fqdn+type) and emit a bogus UPDATE that
    // overwrites foo's still-valid challenge — then foo, now unable to claim
    // its own already-matching actual record, would also emit a spurious
    // CREATE. Keying on the embedded vc-domain-verify target keeps them apart.
    const desired: Domain[] = [
      {
        subdomain: "foo",
        owner: { github: "foo" },
        records: {
          TXT: {
            value: "vc-domain-verify=foo.is-pinoy.dev,abc",
            provider: "vercel",
          },
        },
      },
      {
        subdomain: "bar",
        owner: { github: "bar" },
        records: {
          TXT: {
            value: "vc-domain-verify=bar.is-pinoy.dev,xyz",
            provider: "vercel",
          },
        },
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "1",
        name: "_vercel.is-pinoy.dev",
        type: "TXT",
        content: '"vc-domain-verify=foo.is-pinoy.dev,abc"',
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "CREATE", fqdn: "_vercel.is-pinoy.dev" });
    if (result[0]?.type === "CREATE") {
      expect(result[0].record.value).toBe("vc-domain-verify=bar.is-pinoy.dev,xyz");
    }
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

  it("deletes an orphaned vc-domain-verify TXT no active domain declares", () => {
    // jun removed the verification TXT from his file after Vercel verified.
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "cname.vercel-dns.com." } },
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "1",
        name: "jun.is-pinoy.dev",
        type: "CNAME",
        content: "cname.vercel-dns.com",
      },
      {
        id: "2",
        name: "_vercel.is-pinoy.dev",
        type: "TXT",
        content: '"vc-domain-verify=jun.is-pinoy.dev,abc123"',
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "DELETE", id: "2" });
  });

  it("keeps vc-domain-verify TXT records that are still declared", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: {
          CNAME: { value: "cname.vercel-dns.com." },
          TXT: {
            value: "vc-domain-verify=jun.is-pinoy.dev,abc123",
            provider: "vercel",
          },
        },
      },
    ];
    const actual: CloudflareRecord[] = [
      {
        id: "1",
        name: "jun.is-pinoy.dev",
        type: "CNAME",
        content: "cname.vercel-dns.com",
      },
      {
        id: "2",
        name: "_vercel.is-pinoy.dev",
        type: "TXT",
        content: '"vc-domain-verify=jun.is-pinoy.dev,abc123"',
      },
    ];
    expect(diff(desired, actual)).toHaveLength(0);
  });

  it("never deletes non-verification TXT or apex verification records", () => {
    const desired: Domain[] = [];
    const actual: CloudflareRecord[] = [
      {
        id: "1",
        name: "_vercel.is-pinoy.dev",
        type: "TXT",
        // Verifies the zone apex itself (the org's own record) — protected.
        content: '"vc-domain-verify=is-pinoy.dev,xyz789"',
      },
      {
        id: "2",
        name: "_vercel.is-pinoy.dev",
        type: "TXT",
        content: '"some-unrelated-value"',
      },
      {
        id: "3",
        name: "is-pinoy.dev",
        type: "TXT",
        content: '"v=spf1 -all"',
      },
    ];
    expect(diff(desired, actual)).toHaveLength(0);
  });

  it("deletes orphaned verification TXT at legacy per-subdomain names", () => {
    const desired: Domain[] = [];
    const actual: CloudflareRecord[] = [
      {
        id: "1",
        name: "_vercel.jun.is-pinoy.dev",
        type: "TXT",
        content: '"vc-domain-verify=jun.is-pinoy.dev,abc123"',
      },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ type: "DELETE", id: "1" });
  });
});
