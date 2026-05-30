import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkDns, checkHttp, deriveOverall, checkSsl } from "../checker";

describe("deriveOverall", () => {
  it("returns propagating when DNS is propagating", () => {
    expect(deriveOverall("propagating", "unchecked")).toBe("propagating");
  });

  it("returns degraded when DNS is error", () => {
    expect(deriveOverall("error", "unchecked")).toBe("degraded");
  });

  it("returns operational when DNS is live and HTTP is up", () => {
    expect(deriveOverall("live", "up")).toBe("operational");
  });

  it("returns degraded when DNS is live but HTTP is down", () => {
    expect(deriveOverall("live", "down")).toBe("degraded");
  });
});

describe("checkDns", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  it("returns live when A record exists", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ Status: 0, Answer: [{ type: 1, data: "1.2.3.4" }] }),
    } as Response);

    expect(await checkDns("foo.is-pinoy.dev")).toBe("live");
  });

  it("returns live when only CNAME record exists", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({ Status: 0 }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ Status: 0, Answer: [{ type: 5, data: "cname.vercel.app." }] }),
      } as Response);

    expect(await checkDns("foo.is-pinoy.dev")).toBe("live");
  });

  it("returns propagating when no A or CNAME records (NXDOMAIN)", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ json: async () => ({ Status: 3 }) } as Response)
      .mockResolvedValueOnce({ json: async () => ({ Status: 3 }) } as Response);

    expect(await checkDns("foo.is-pinoy.dev")).toBe("propagating");
  });

  it("returns error on fetch failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));

    expect(await checkDns("foo.is-pinoy.dev")).toBe("error");
  });
});

describe("checkHttp", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  it("returns up on 200", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    expect(await checkHttp("foo.is-pinoy.dev")).toBe("up");
  });

  it("returns up on 401 (auth-protected site)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 401 } as Response);
    expect(await checkHttp("foo.is-pinoy.dev")).toBe("up");
  });

  it("returns up on 403 (auth-protected site)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 403 } as Response);
    expect(await checkHttp("foo.is-pinoy.dev")).toBe("up");
  });

  it("returns down on 404 (deployment not found)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    expect(await checkHttp("foo.is-pinoy.dev")).toBe("down");
  });

  it("returns down on 500", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    expect(await checkHttp("foo.is-pinoy.dev")).toBe("down");
  });

  it("returns down on network error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("ECONNREFUSED"));

    expect(await checkHttp("foo.is-pinoy.dev")).toBe("down");
  });

  it("returns down on timeout (abort)", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      Object.assign(new Error("The operation was aborted"), { name: "AbortError" })
    );

    expect(await checkHttp("foo.is-pinoy.dev")).toBe("down");
  });
});

describe("checkSsl", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  function crtResponse(entries: { not_after: string; issuer_name: string }[]) {
    return { ok: true, status: 200, json: async () => entries } as Response;
  }

  it("returns unknown without querying when http is unreachable", async () => {
    const result = await checkSsl("foo.is-pinoy.dev", false);
    expect(result).toEqual({ status: "unknown", expiresAt: null, issuer: null });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns valid for a cert far from expiry", async () => {
    const future = new Date(Date.now() + 90 * 86_400_000).toISOString();
    vi.mocked(fetch).mockResolvedValueOnce(
      crtResponse([{ not_after: future, issuer_name: "Let's Encrypt" }])
    );
    const result = await checkSsl("foo.is-pinoy.dev", true);
    expect(result.status).toBe("valid");
    expect(result.issuer).toBe("Let's Encrypt");
    expect(result.expiresAt).not.toBeNull();
  });

  it("returns expiring when under 14 days remain", async () => {
    const soon = new Date(Date.now() + 5 * 86_400_000).toISOString();
    vi.mocked(fetch).mockResolvedValueOnce(
      crtResponse([{ not_after: soon, issuer_name: "Let's Encrypt" }])
    );
    expect((await checkSsl("foo.is-pinoy.dev", true)).status).toBe("expiring");
  });

  it("returns expired when not_after is in the past", async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    vi.mocked(fetch).mockResolvedValueOnce(
      crtResponse([{ not_after: past, issuer_name: "Let's Encrypt" }])
    );
    expect((await checkSsl("foo.is-pinoy.dev", true)).status).toBe("expired");
  });

  it("picks the entry with the latest not_after", async () => {
    const older = new Date(Date.now() + 10 * 86_400_000).toISOString();
    const newer = new Date(Date.now() + 100 * 86_400_000).toISOString();
    vi.mocked(fetch).mockResolvedValueOnce(
      crtResponse([
        { not_after: older, issuer_name: "Old" },
        { not_after: newer, issuer_name: "New" },
      ])
    );
    const result = await checkSsl("foo.is-pinoy.dev", true);
    expect(result.status).toBe("valid");
    expect(result.issuer).toBe("New");
  });

  it("returns unknown when crt.sh returns a non-OK status", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 502 } as Response);
    expect((await checkSsl("foo.is-pinoy.dev", true)).status).toBe("unknown");
  });

  it("returns unknown when crt.sh returns an empty array", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(crtResponse([]));
    expect((await checkSsl("foo.is-pinoy.dev", true)).status).toBe("unknown");
  });

  it("returns unknown on fetch failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));
    expect((await checkSsl("foo.is-pinoy.dev", true)).status).toBe("unknown");
  });
});
