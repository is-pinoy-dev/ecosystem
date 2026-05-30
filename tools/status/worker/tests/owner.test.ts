import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseOwner, fetchOwnerInfo } from "../../src/lib/owner";

describe("parseOwner", () => {
  it("extracts github handle and first record type", () => {
    const result = parseOwner({
      subdomain: "juan",
      owner: { github: "juandelacruz", email: "secret@example.com" },
      records: { CNAME: { value: "x.vercel.app." } },
    });
    expect(result).toEqual({ github: "juandelacruz", recordType: "CNAME" });
  });

  it("returns null when owner.github is missing", () => {
    expect(parseOwner({ records: { A: { value: "1.2.3.4" } } })).toBeNull();
  });

  it("returns null recordType when records is absent", () => {
    expect(parseOwner({ owner: { github: "juan" } })).toEqual({
      github: "juan",
      recordType: null,
    });
  });
});

describe("fetchOwnerInfo", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  it("returns parsed owner on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        owner: { github: "juan" },
        records: { CNAME: { value: "x.vercel.app." } },
      }),
    } as Response);
    expect(await fetchOwnerInfo("juan")).toEqual({
      github: "juan",
      recordType: "CNAME",
    });
  });

  it("returns null on 404", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    expect(await fetchOwnerInfo("ghost")).toBeNull();
  });

  it("returns null on fetch failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));
    expect(await fetchOwnerInfo("juan")).toBeNull();
  });
});
