import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchSubdomains } from "../github";

describe("fetchSubdomains", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns subdomain names stripped of .json extension", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: "juan.json", type: "file" },
        { name: "maria.json", type: "file" },
        { name: "README.md", type: "file" },
        { name: "archive", type: "dir" },
      ],
    } as Response);

    const result = await fetchSubdomains();
    expect(result).toEqual(["juan", "maria"]);
  });

  it("throws on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
    } as Response);

    await expect(fetchSubdomains()).rejects.toThrow("GitHub API error: 403");
  });
});
