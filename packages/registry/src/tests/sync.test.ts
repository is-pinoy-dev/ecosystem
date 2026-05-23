import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../providers/cloudflare/client.js", () => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
}));

import { sync } from "../core/sync.js";
import * as cloudflare from "../providers/cloudflare/client.js";

describe("sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles CREATE action", async () => {
    vi.mocked(cloudflare.createRecord).mockResolvedValue({
      type: "CNAME",
      content: "jun.vercel.app",
      id: "1",
      name: "jun.is-pinoy.dev",
    });

    await sync([
      {
        type: "CREATE",
        fqdn: "jun.is-pinoy.dev",
        record: { type: "CNAME", value: "jun.vercel.app" },
      },
    ]);

    expect(cloudflare.createRecord).toHaveBeenCalledTimes(1);
    expect(cloudflare.createRecord).toHaveBeenCalledWith(
      { type: "CNAME", value: "jun.vercel.app" },
      "jun.is-pinoy.dev",
    );
  });

  it("handles UPDATE action", async () => {
    vi.mocked(cloudflare.updateRecord).mockResolvedValue({
      type: "CNAME",
      content: "new.vercel.app",
      id: "123",
      name: "jun.is-pinoy.dev",
    });

    await sync([
      {
        type: "UPDATE",
        id: "123",
        fqdn: "jun.is-pinoy.dev",
        record: { type: "CNAME", value: "new.vercel.app" },
      },
    ]);

    expect(cloudflare.updateRecord).toHaveBeenCalledTimes(1);
    expect(cloudflare.updateRecord).toHaveBeenCalledWith(
      "123",
      { type: "CNAME", value: "new.vercel.app" },
      "jun.is-pinoy.dev",
    );
  });

  it("handles DELETE action", async () => {
    vi.mocked(cloudflare.deleteRecord).mockResolvedValue({
      type: "CNAME",
      content: "jun.vercel.app",
      id: "123",
      name: "jun.is-pinoy.dev",
    });

    await sync([
      {
        type: "DELETE",
        id: "123",
        fqdn: "jun.is-pinoy.dev",
      },
    ]);

    expect(cloudflare.deleteRecord).toHaveBeenCalledTimes(1);
    expect(cloudflare.deleteRecord).toHaveBeenCalledWith("123");
  });
});
