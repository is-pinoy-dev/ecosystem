// Talking to D1 over its HTTP API.
//
// The dashboard runs on a platform with no Workers runtime, so it has no D1
// binding to use. Cloudflare's REST API is the supported way in, and it is the
// same one drizzle-kit uses for migrations (see drizzle.config.ts) — so app
// queries and schema changes reach the database by an identical route.
//
// Two databases are read through here: the dashboard's own registry read model
// (lib/db/index.ts) and the analytics worker's visit totals (lib/analytics.ts).
// They are separate databases on purpose — see lib/analytics.ts.

export interface D1Config {
  accountId: string
  databaseId: string
  token: string
}

interface D1QueryResponse {
  success: boolean
  errors?: { code?: number; message: string }[]
  result?: { results?: Record<string, unknown>[]; success?: boolean }[]
}

/**
 * Run a single statement and return its rows as objects keyed by column name.
 */
export async function d1Query(
  config: D1Config,
  sql: string,
  params: unknown[]
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    }
  )

  const body = (await res.json()) as D1QueryResponse
  if (!res.ok || !body.success) {
    const message =
      body.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}`
    throw new Error(`D1 query failed: ${message}`)
  }
  return body.result?.[0]?.results ?? []
}
