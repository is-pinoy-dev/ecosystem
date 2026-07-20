import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@is-pinoy-dev/registry", () => ({
  loadDomains: vi.fn(),
  findVercelCleanupCandidates: vi.fn(),
  probeVercelDomain: vi.fn(),
  stripVercelVerificationTxt: vi.fn(),
}));

import {
  loadDomains,
  findVercelCleanupCandidates,
  probeVercelDomain,
} from "@is-pinoy-dev/registry";
import { handleVercelCleanup } from "../commands/registry/vercel-cleanup.js";

const candidate = {
  file: "alice.json",
  subdomain: "alice",
  fqdn: "alice.is-pinoy.dev",
  verificationValues: ["vc-domain-verify=alice.is-pinoy.dev,tok"],
};

describe("handleVercelCleanup --check", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // loadDomains result is only forwarded to the (mocked) candidate finder.
    vi.mocked(loadDomains).mockReturnValue([] as never);
  });

  it("exits 1 when a scoped file re-adds a TXT for an already-verified domain", async () => {
    vi.mocked(findVercelCleanupCandidates).mockReturnValue({
      candidates: [candidate],
      skipped: [],
    });
    vi.mocked(probeVercelDomain).mockResolvedValue({
      fqdn: candidate.fqdn,
      healthy: true,
      reason: "ok",
      status: 200,
    });

    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    await handleVercelCleanup("./subdomains", {
      write: false,
      json: false,
      check: true,
      timeout: 10_000,
      only: ["alice.json"],
    });

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("does not exit 1 when the domain is not yet verified (new registration)", async () => {
    vi.mocked(findVercelCleanupCandidates).mockReturnValue({
      candidates: [candidate],
      skipped: [],
    });
    vi.mocked(probeVercelDomain).mockResolvedValue({
      fqdn: candidate.fqdn,
      healthy: false,
      reason: "vercel-error",
      detail: "NOT_FOUND",
      status: 404,
    });

    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);

    await handleVercelCleanup("./subdomains", {
      write: false,
      json: false,
      check: true,
      timeout: 10_000,
      only: ["alice.json"],
    });

    expect(exitSpy).not.toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  it("check mode never writes even when a violation is eligible", async () => {
    vi.mocked(findVercelCleanupCandidates).mockReturnValue({
      candidates: [candidate],
      skipped: [],
    });
    vi.mocked(probeVercelDomain).mockResolvedValue({
      fqdn: candidate.fqdn,
      healthy: true,
      reason: "ok",
      status: 200,
    });

    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation(() => undefined as never);
    // stripVercelVerificationTxt is the only path to a file write; it must not
    // be invoked in check mode.
    const registry = await import("@is-pinoy-dev/registry");

    await handleVercelCleanup("./subdomains", {
      write: true, // even with --write, --check must stay read-only
      json: false,
      check: true,
      timeout: 10_000,
    });

    expect(registry.stripVercelVerificationTxt).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
