import { describe, it, expect, beforeEach } from "vitest";
import {
  findVercelCleanupCandidates,
  pointsAtVercel,
  probeVercelDomain,
  stripVercelVerificationTxt,
  verificationTargetFqdn,
} from "../core/vercel.js";
import type { ResolvedDomains, Domain } from "@is-pinoy-dev/schemas";

const VERIFY_TXT = {
  value: "vc-domain-verify=juan.is-pinoy.dev,abc123",
  provider: "vercel" as const,
};

function domain(overrides: Partial<ResolvedDomains[number]>): ResolvedDomains[number] {
  return {
    file: "juan.json",
    subdomain: "juan",
    owner: { github: "juan" },
    records: { CNAME: { value: "cname.vercel-dns.com." }, TXT: VERIFY_TXT },
    ...overrides,
  };
}

describe("pointsAtVercel", () => {
  it("matches vercel-dns CNAME targets including numbered hosts", () => {
    expect(pointsAtVercel({ CNAME: { value: "cname.vercel-dns.com." } })).toBe(true);
    expect(pointsAtVercel({ CNAME: { value: "abc123.vercel-dns-017.com." } })).toBe(true);
  });

  it("matches Vercel A records", () => {
    expect(pointsAtVercel({ A: { value: "76.76.21.21" } })).toBe(true);
  });

  it("rejects non-Vercel targets", () => {
    expect(pointsAtVercel({ CNAME: { value: "juan.github.io" } })).toBe(false);
    expect(pointsAtVercel({ A: { value: "203.0.113.10" } })).toBe(false);
  });
});

describe("findVercelCleanupCandidates", () => {
  beforeEach(() => {
    process.env.DOMAIN = "is-pinoy.dev";
  });

  it("selects active domains with a verification TXT pointing at Vercel", () => {
    const { candidates, skipped } = findVercelCleanupCandidates([domain({})]);
    expect(skipped).toHaveLength(0);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      subdomain: "juan",
      fqdn: "juan.is-pinoy.dev",
      verificationValues: [VERIFY_TXT.value],
    });
  });

  it("ignores domains without a verification TXT", () => {
    const { candidates, skipped } = findVercelCleanupCandidates([
      domain({ records: { CNAME: { value: "cname.vercel-dns.com." } } }),
    ]);
    expect(candidates).toHaveLength(0);
    expect(skipped).toHaveLength(0);
  });

  it("skips domains whose records no longer point at Vercel", () => {
    const { candidates, skipped } = findVercelCleanupCandidates([
      domain({ records: { CNAME: { value: "juan.github.io" }, TXT: VERIFY_TXT } }),
    ]);
    expect(candidates).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]?.reason).toContain("do not point at Vercel");
  });

  it("ignores destroyed domains", () => {
    const { candidates } = findVercelCleanupCandidates([domain({ destroy: true })]);
    expect(candidates).toHaveLength(0);
  });
});

describe("probeVercelDomain", () => {
  function fakeFetch(status: number, headers: Record<string, string>): typeof fetch {
    return (async () => new Response(null, { status, headers })) as typeof fetch;
  }

  it("healthy when served by Vercel without x-vercel-error", async () => {
    const probe = await probeVercelDomain("juan.is-pinoy.dev", {
      fetchImpl: fakeFetch(200, { server: "Vercel" }),
    });
    expect(probe).toMatchObject({ healthy: true, reason: "ok", status: 200 });
  });

  it("healthy even when the app itself returns a 404", async () => {
    const probe = await probeVercelDomain("juan.is-pinoy.dev", {
      fetchImpl: fakeFetch(404, { server: "Vercel", "x-vercel-id": "sfo1::abc" }),
    });
    expect(probe.healthy).toBe(true);
  });

  it("unhealthy on x-vercel-error (unverified/unassigned domain)", async () => {
    const probe = await probeVercelDomain("juan.is-pinoy.dev", {
      fetchImpl: fakeFetch(404, { server: "Vercel", "x-vercel-error": "DEPLOYMENT_NOT_FOUND" }),
    });
    expect(probe).toMatchObject({
      healthy: false,
      reason: "vercel-error",
      detail: "DEPLOYMENT_NOT_FOUND",
    });
  });

  it("inconclusive when not served by Vercel", async () => {
    const probe = await probeVercelDomain("juan.is-pinoy.dev", {
      fetchImpl: fakeFetch(200, { server: "GitHub.com" }),
    });
    expect(probe).toMatchObject({ healthy: false, reason: "not-vercel" });
  });

  it("unreachable when fetch rejects", async () => {
    const failing = (async () => {
      throw new Error("getaddrinfo ENOTFOUND");
    }) as unknown as typeof fetch;
    const probe = await probeVercelDomain("juan.is-pinoy.dev", { fetchImpl: failing });
    expect(probe).toMatchObject({ healthy: false, reason: "unreachable" });
  });
});

describe("stripVercelVerificationTxt", () => {
  it("removes a single verification TXT and drops the key", () => {
    const records: Domain["records"] = {
      CNAME: { value: "cname.vercel-dns.com." },
      TXT: VERIFY_TXT,
    };
    const { records: next, removed } = stripVercelVerificationTxt(records);
    expect(removed).toEqual([VERIFY_TXT.value]);
    expect(next.TXT).toBeUndefined();
    expect(next.CNAME).toEqual(records.CNAME);
  });

  it("keeps non-verification TXT entries and collapses to single form", () => {
    const other = { value: "some-other-value", provider: "vercel" as const };
    const records: Domain["records"] = { TXT: [VERIFY_TXT, other] };
    const { records: next, removed } = stripVercelVerificationTxt(records);
    expect(removed).toEqual([VERIFY_TXT.value]);
    expect(next.TXT).toEqual(other);
  });

  it("is a no-op without verification TXT entries", () => {
    const records: Domain["records"] = { CNAME: { value: "juan.github.io" } };
    const { records: next, removed } = stripVercelVerificationTxt(records);
    expect(removed).toEqual([]);
    expect(next).toBe(records);
  });
});

describe("verificationTargetFqdn", () => {
  it("extracts the target fqdn, handling Cloudflare quoting", () => {
    expect(verificationTargetFqdn("vc-domain-verify=juan.is-pinoy.dev,abc")).toBe(
      "juan.is-pinoy.dev",
    );
    expect(verificationTargetFqdn('"vc-domain-verify=juan.is-pinoy.dev,abc"')).toBe(
      "juan.is-pinoy.dev",
    );
  });

  it("returns null for non-verification content", () => {
    expect(verificationTargetFqdn("v=spf1 -all")).toBeNull();
  });
});
