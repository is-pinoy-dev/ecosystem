// Read-only access to the dashboard's registry database over its HTTP API —
// this app has no Workers runtime and so no D1 binding, the same situation
// apps/dashboard/lib/db/d1.ts is in. Deliberately not shared with that
// module: this app only ever issues one SELECT, so pulling in Drizzle and the
// dashboard's schema for it would cost more than it saves.

interface D1Config {
  accountId: string
  databaseId: string
  token: string
}

interface D1QueryResponse {
  success: boolean
  errors?: { code?: number; message: string }[]
  result?: { results?: Record<string, unknown>[]; success?: boolean }[]
}

function readConfig(): Partial<D1Config> {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID,
    token: process.env.CLOUDFLARE_D1_API_TOKEN,
  }
}

export function hasDatabase(): boolean {
  const { accountId, databaseId, token } = readConfig()
  return Boolean(accountId && databaseId && token)
}

/** Run a single statement and return its rows as objects keyed by column name. */
export async function d1Query(
  sql: string,
  params: unknown[]
): Promise<Record<string, unknown>[]> {
  const { accountId, databaseId, token } = readConfig()
  if (!accountId || !databaseId || !token) {
    throw new Error(
      "D1 is not configured: set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and CLOUDFLARE_D1_API_TOKEN"
    )
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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
