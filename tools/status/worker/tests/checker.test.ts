import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkDns, checkHttp, deriveOverall } from "../checker";

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

  it("returns up when fetch resolves", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ status: 200 } as Response);

    expect(await checkHttp("foo.is-pinoy.dev")).toBe("up");
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
