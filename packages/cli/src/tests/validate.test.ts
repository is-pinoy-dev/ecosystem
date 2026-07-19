import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@is-pinoy-dev/registry/core/validate.js", () => ({
  validateDomains: vi.fn(),
}));

import { validateDomains } from "@is-pinoy-dev/registry/core/validate.js";
import { handleValidate } from "../commands/registry/validate.js";

describe("handleValidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exits 0 when all domains are valid", () => {
    vi.mocked(validateDomains).mockReturnValue({
      ok: true,
      errors: [],
      warnings: [],
    });

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    handleValidate("./domains");

    expect(validateDomains).toHaveBeenCalledWith("./domains");
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });

  it("exits 1 when validation has errors", () => {
    vi.mocked(validateDomains).mockReturnValue({
      ok: false,
      errors: ["Duplicate subdomain: test", "Reserved subdomain: admin"],
      warnings: [],
    });

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    handleValidate("./domains");

    expect(validateDomains).toHaveBeenCalledWith("./domains");
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
