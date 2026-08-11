import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Domain, CloudflareWorkerRoute } from "@is-pinoy-dev/schemas";
import { diffWorkerRoutes } from "../core/routes.js";

const SCRIPT = "tools-portfolio-proxy";

function portfolioDomain(subdomain: string, extra: Partial<Domain> = {}): Domain {
  return {
    subdomain,
    owner: { github: `${subdomain}-dev` },
    portfolio: { template: "terminal" },
    records: {
      CNAME: { type: "CNAME", value: "portfolio.is-pinoy.dev", proxied: true },
    },
    ...extra,
  } as Domain;
}

function plainDomain(subdomain: string): Domain {
  return {
    subdomain,
    owner: { github: `${subdomain}-dev` },
    records: { CNAME: { type: "CNAME", value: "example.vercel-dns.com" } },
  } as Domain;
}

function route(
  id: string,
  pattern: string,
  script: string | undefined = SCRIPT,
): CloudflareWorkerRoute {
  return { id, pattern, script };
}

beforeEach(() => {
  process.env.CLOUDFLARE_API_TOKEN = "token";
  process.env.CLOUDFLARE_ZONE_ID = "zone";
  process.env.DOMAIN = "is-pinoy.dev";
  process.env.PORTFOLIO_WORKER = SCRIPT;
});

afterEach(() => {
  delete process.env.PORTFOLIO_WORKER;
});

describe("diffWorkerRoutes", () => {
  it("creates a route for a claimed portfolio", () => {
    expect(diffWorkerRoutes([portfolioDomain("juan")], [])).toEqual([
      { type: "CREATE_ROUTE", pattern: "juan.is-pinoy.dev/*", script: SCRIPT },
    ]);
  });

  it("leaves an existing route alone", () => {
    const actual = [route("r1", "juan.is-pinoy.dev/*")];
    expect(diffWorkerRoutes([portfolioDomain("juan")], actual)).toEqual([]);
  });

  it("ignores subdomains that point at their owner's own host", () => {
    expect(diffWorkerRoutes([plainDomain("derf")], [])).toEqual([]);
  });

  it("deletes the route when a portfolio block is removed", () => {
    const actual = [route("r1", "juan.is-pinoy.dev/*")];
    expect(diffWorkerRoutes([plainDomain("juan")], actual)).toEqual([
      { type: "DELETE_ROUTE", id: "r1", pattern: "juan.is-pinoy.dev/*" },
    ]);
  });

  it("deletes the route for a destroyed portfolio", () => {
    const actual = [route("r1", "juan.is-pinoy.dev/*")];
    const domain = portfolioDomain("juan", { destroy: true });
    expect(diffWorkerRoutes([domain], actual)).toEqual([
      { type: "DELETE_ROUTE", id: "r1", pattern: "juan.is-pinoy.dev/*" },
    ]);
  });

  it("never touches routes belonging to another worker", () => {
    // The zone also carries the tools and status routes.
    const actual = [
      route("r1", "*.is-pinoy.dev/_tools/og*", "tools-og"),
      route("r2", "status.is-pinoy.dev/*", "tools-status"),
      route("r3", "is-pinoy.dev/_tools/site-audit*", "tools-site-audit"),
    ];
    expect(diffWorkerRoutes([], actual)).toEqual([]);
  });

  it("leaves a hand-added route that isn't a subdomain of the zone", () => {
    const actual = [route("r1", "example.com/*")];
    expect(diffWorkerRoutes([], actual)).toEqual([]);
  });

  it("does not delete out-of-scope routes under a scoped diff", () => {
    // `--only` hands us one changed domain; every other portfolio's route is
    // unknown here, not orphaned.
    const actual = [
      route("r1", "juan.is-pinoy.dev/*"),
      route("r2", "maria.is-pinoy.dev/*"),
    ];
    const actions = diffWorkerRoutes([plainDomain("juan")], actual, {
      scoped: true,
    });
    expect(actions).toEqual([
      { type: "DELETE_ROUTE", id: "r1", pattern: "juan.is-pinoy.dev/*" },
    ]);
  });

  it("does nothing at all when PORTFOLIO_WORKER is unset", () => {
    // The published CLI runs from the domains repo; an environment that
    // predates this feature must be a no-op, not a teardown.
    delete process.env.PORTFOLIO_WORKER;
    const actual = [route("r1", "juan.is-pinoy.dev/*")];
    expect(diffWorkerRoutes([portfolioDomain("maria")], actual)).toEqual([]);
  });

  // A portfolio whose route was never created serves 525, because its CNAME
  // points at a host that holds no certificate for it. Silence is what makes
  // that take an afternoon to find.
  it("names the portfolios it stranded when PORTFOLIO_WORKER is unset", () => {
    delete process.env.PORTFOLIO_WORKER;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    diffWorkerRoutes([portfolioDomain("maria"), portfolioDomain("juan")], []);
    expect(warn).toHaveBeenCalledOnce();
    const message = warn.mock.calls[0]![0] as string;
    expect(message).toContain("maria");
    expect(message).toContain("juan");
    expect(message).toContain("525");
    expect(message).toContain("PORTFOLIO_WORKER");
    warn.mockRestore();
  });

  it("stays quiet when there are no portfolios to strand", () => {
    delete process.env.PORTFOLIO_WORKER;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    diffWorkerRoutes([plainDomain("maria")], []);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  // A record on its way out needs no route, so it is not stranded.
  it("does not count a destroyed portfolio as stranded", () => {
    delete process.env.PORTFOLIO_WORKER;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    diffWorkerRoutes([portfolioDomain("maria", { destroy: true })], []);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
