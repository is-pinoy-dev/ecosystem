import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchSubdomains } from "../github";

describe("fetchSubdomains", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns subdomain names stripped from .json filenames", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { name: "juan.json", type: "file" },
          { name: "maria.json", type: "file" },
          { name: "README.md", type: "file" },
          { name: "subdir", type: "dir" },
        ]),
        { status: 200 }
      )
    );

    const result = await fetchSubdomains();
    expect(result).toEqual(["juan", "maria"]);
  });

  it("throws on non-ok HTTP response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Not Found", { status: 404 })
    );
    await expect(fetchSubdomains()).rejects.toThrow("GitHub API error: 404");
  });

  it("returns empty array when directory has no .json files", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([{ name: "README.md", type: "file" }]), { status: 200 })
    );
    const result = await fetchSubdomains();
    expect(result).toEqual([]);
  });
});
