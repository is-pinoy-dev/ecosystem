import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAnalytics, isBeyondRetention } from "../graphql";

const MOCK_GROUPS = [
  {
    dimensions: { clientRequestHTTPHost: "juan.is-pinoy.dev", clientCountryName: "PH" },
    sum: { visits:42 },
  },
  {
    dimensions: { clientRequestHTTPHost: "juan.is-pinoy.dev", clientCountryName: "US" },
    sum: { visits:8 },
  },
];

function makeGraphQLResponse(groups: typeof MOCK_GROUPS) {
  return JSON.stringify({
    data: { viewer: { zones: [{ httpRequestsAdaptiveGroups: groups }] } },
  });
}

describe("fetchAnalytics", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("maps GraphQL groups to AnalyticsRow array", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(makeGraphQLResponse(MOCK_GROUPS), { status: 200 })
    );

    const rows = await fetchAnalytics("token", "zone123", "2026-05-28");
    expect(rows).toEqual([
      { host: "juan.is-pinoy.dev", country: "PH", requests: 42 },
      { host: "juan.is-pinoy.dev", country: "US", requests: 8 },
    ]);
  });

  it("throws on HTTP error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("error", { status: 500 })
    );
    await expect(fetchAnalytics("token", "zone123", "2026-05-28")).rejects.toThrow(
      "GraphQL HTTP error: 500"
    );
  });

  it("throws when GraphQL errors are present", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ errors: [{ message: "Invalid token" }] }),
        { status: 200 }
      )
    );
    await expect(fetchAnalytics("token", "zone123", "2026-05-28")).rejects.toThrow(
      "GraphQL error: Invalid token"
    );
  });

  it("returns empty array when zones list is empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ data: { viewer: { zones: [] } } }),
        { status: 200 }
      )
    );
    const rows = await fetchAnalytics("token", "zone123", "2026-05-28");
    expect(rows).toEqual([]);
  });
});

describe("isBeyondRetention", () => {
  // The zone answers anything past its window with this, and no retry can
  // satisfy it — so it must not be counted alongside real failures.
  it("recognises the zone retention refusal", () => {
    expect(
      isBeyondRetention(
        new Error(
          'GraphQL error: zone "6461b84" cannot request data older than 1w1d, ' +
            "but your query requests data from 4w2d2h25m10s ago"
        )
      )
    ).toBe(true)
  })

  it("does not swallow a permission error", () => {
    expect(
      isBeyondRetention(
        new Error(
          "GraphQL error: Actor 'com.cloudflare.api.token.9e2b' does not have " +
            "permission 'com.cloudflare.api.account.zone.analytics.read'"
        )
      )
    ).toBe(false)
  })

  it("does not swallow a transport failure", () => {
    expect(isBeyondRetention(new Error("GraphQL HTTP error: 502"))).toBe(false)
  })

  it("handles a non-Error rejection", () => {
    expect(isBeyondRetention("cannot request data older than 1w1d")).toBe(true)
  })
})
