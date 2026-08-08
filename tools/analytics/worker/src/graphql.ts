import type { AnalyticsRow } from "./types";

const GRAPHQL_URL = "https://api.cloudflare.com/client/v4/graphql";

const QUERY = `
  query VisitsBySubdomain($zoneTag: String!, $date: Date!) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        httpRequestsAdaptiveGroups(
          filter: { date_geq: $date, date_leq: $date }
          limit: 10000
        ) {
          dimensions {
            clientRequestHTTPHost
            clientCountryName
          }
          sum {
            visits
          }
        }
      }
    }
  }
`;

interface GQLGroup {
  dimensions: { clientRequestHTTPHost: string; clientCountryName: string };
  sum: { visits: number };
}

interface GQLResponse {
  data?: { viewer: { zones: Array<{ httpRequestsAdaptiveGroups: GQLGroup[] }> } };
  errors?: Array<{ message: string }>;
}

/**
 * Whether a failure means "that day is gone" rather than "that day failed".
 *
 * Zone analytics retention is finite and plan-dependent — ours currently serves
 * about eight days, and answers anything older with
 *
 *   cannot request data older than 1w1d, but your query requests data from …
 *
 * No retry will ever satisfy that, so counting it as a failure would mark every
 * run that reaches past the window as failed and bury real errors in the noise.
 * The caller skips these and reports them separately.
 */
export function isBeyondRetention(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes("cannot request data older than")
}

export async function fetchAnalytics(
  apiToken: string,
  zoneTag: string,
  date: string
): Promise<AnalyticsRow[]> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({ query: QUERY, variables: { zoneTag, date } }),
  });

  if (!res.ok) throw new Error(`GraphQL HTTP error: ${res.status}`);

  const json = (await res.json()) as GQLResponse;
  if (json.errors?.length) throw new Error(`GraphQL error: ${json.errors[0].message}`);

  const groups = json.data?.viewer.zones[0]?.httpRequestsAdaptiveGroups ?? [];
  return groups.map((g) => ({
    host: g.dimensions.clientRequestHTTPHost,
    country: g.dimensions.clientCountryName,
    requests: g.sum.visits,
  }));
}
