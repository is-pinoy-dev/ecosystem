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
            requests
          }
        }
      }
    }
  }
`;

interface GQLGroup {
  dimensions: { clientRequestHTTPHost: string; clientCountryName: string };
  sum: { requests: number };
}

interface GQLResponse {
  data?: { viewer: { zones: Array<{ httpRequestsAdaptiveGroups: GQLGroup[] }> } };
  errors?: Array<{ message: string }>;
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
    requests: g.sum.requests,
  }));
}
