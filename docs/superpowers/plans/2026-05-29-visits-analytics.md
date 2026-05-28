# Visits Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the passthrough Analytics Engine Worker with a nightly scheduled Cloudflare Worker that queries Cloudflare's Analytics GraphQL API and persists daily visit snapshots into a D1 database.

**Architecture:** A single scheduled Cloudflare Worker (`tools/analytics/worker/index.ts`) fires at 1am UTC daily. It fetches the active subdomain list from GitHub, queries yesterday's traffic grouped by host + country from Cloudflare's GraphQL API, and batch-upserts the results into two D1 tables (`visits_daily`, `visits_daily_by_country`).

**Tech Stack:** Cloudflare Workers (scheduled), D1 (SQLite), Cloudflare Analytics GraphQL API, GitHub Contents API, Vitest 3, TypeScript 5, Wrangler 4

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `tools/analytics/worker/wrangler.toml` | Remove routes + Analytics Engine; add cron trigger + D1 binding |
| Create | `tools/analytics/worker/migrations/0001_init.sql` | D1 schema: `visits_daily` + `visits_daily_by_country` |
| Create | `tools/analytics/vitest.config.ts` | Vitest config for analytics package tests |
| Modify | `tools/analytics/package.json` | Add `test` script + `vitest` dev dependency |
| Create | `tools/analytics/worker/src/types.ts` | Shared `AnalyticsRow` interface |
| Create | `tools/analytics/worker/src/github.ts` | `fetchSubdomains()` — GitHub API |
| Create | `tools/analytics/worker/src/graphql.ts` | `fetchAnalytics()` — Cloudflare GraphQL |
| Create | `tools/analytics/worker/src/db.ts` | `persistSnapshots()` — D1 batch upsert |
| Replace | `tools/analytics/worker/index.ts` | `Env` interface + `scheduled()` handler |
| Create | `tools/analytics/worker/src/tests/github.test.ts` | Tests for `fetchSubdomains` |
| Create | `tools/analytics/worker/src/tests/graphql.test.ts` | Tests for `fetchAnalytics` |
| Create | `tools/analytics/worker/src/tests/db.test.ts` | Tests for `persistSnapshots` |

---

## Task 1: D1 Migration + wrangler.toml

**Files:**
- Create: `tools/analytics/worker/migrations/0001_init.sql`
- Modify: `tools/analytics/worker/wrangler.toml`

- [ ] **Step 1: Create the D1 migration file**

Create `tools/analytics/worker/migrations/0001_init.sql`:

```sql
CREATE TABLE IF NOT EXISTS visits_daily (
  subdomain TEXT    NOT NULL,
  date      TEXT    NOT NULL,
  visits    INTEGER NOT NULL,
  PRIMARY KEY (subdomain, date)
);

CREATE TABLE IF NOT EXISTS visits_daily_by_country (
  subdomain TEXT    NOT NULL,
  date      TEXT    NOT NULL,
  country   TEXT    NOT NULL,
  visits    INTEGER NOT NULL,
  PRIMARY KEY (subdomain, date, country)
);
```

- [ ] **Step 2: Replace wrangler.toml**

Replace `tools/analytics/worker/wrangler.toml` entirely with:

```toml
name = "tools-analytics"
main = "index.ts"
compatibility_date = "2026-05-27"

[triggers]
crons = ["0 1 * * *"]

[[d1_databases]]
binding = "ANALYTICS_DB"
database_name = "analytics-db"
database_id = "PLACEHOLDER"
migrations_dir = "migrations"

[observability]
enabled = true
head_sampling_rate = 1

[observability.logs]
enabled = true
head_sampling_rate = 1
persist = true
invocation_logs = true
```

> Note: `database_id` will be replaced with the real ID in Task 8 (deploy).

- [ ] **Step 3: Commit**

```bash
git add tools/analytics/worker/migrations/0001_init.sql tools/analytics/worker/wrangler.toml
git commit -m "feat(analytics): replace passthrough config with cron + D1 binding"
```

---

## Task 2: Test Infrastructure

**Files:**
- Create: `tools/analytics/vitest.config.ts`
- Modify: `tools/analytics/package.json`

- [ ] **Step 1: Create vitest config**

Create `tools/analytics/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["worker/src/tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 2: Update package.json**

In `tools/analytics/package.json`, add `"test": "vitest run"` to `scripts` and add `"vitest": "catalog:"` to `devDependencies`:

```json
{
  "name": "analytics",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev -c worker/wrangler.toml",
    "deploy": "wrangler deploy -c worker/wrangler.toml",
    "typecheck": "tsc -p worker/tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20260527.1",
    "typescript": "catalog:",
    "vitest": "catalog:",
    "wrangler": "^4.95.0"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
pnpm install
```

- [ ] **Step 4: Commit**

```bash
git add tools/analytics/vitest.config.ts tools/analytics/package.json pnpm-lock.yaml
git commit -m "chore(analytics): add vitest test infrastructure"
```

---

## Task 3: Shared Types

**Files:**
- Create: `tools/analytics/worker/src/types.ts`

- [ ] **Step 1: Create types file**

Create `tools/analytics/worker/src/types.ts`:

```typescript
export interface AnalyticsRow {
  host: string;
  country: string;
  requests: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add tools/analytics/worker/src/types.ts
git commit -m "feat(analytics): add shared AnalyticsRow type"
```

---

## Task 4: TDD — fetchSubdomains

**Files:**
- Create: `tools/analytics/worker/src/github.ts`
- Create: `tools/analytics/worker/src/tests/github.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tools/analytics/worker/src/tests/github.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm --filter analytics test
```

Expected: `Cannot find module '../github'`

- [ ] **Step 3: Implement fetchSubdomains**

Create `tools/analytics/worker/src/github.ts`:

```typescript
const GITHUB_URL =
  "https://api.github.com/repos/is-pinoy-dev/domains/contents/subdomains";

interface GitHubEntry {
  name: string;
  type: string;
}

export async function fetchSubdomains(): Promise<string[]> {
  const res = await fetch(GITHUB_URL, {
    headers: { "User-Agent": "is-pinoy.dev analytics worker" },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const files = (await res.json()) as GitHubEntry[];
  return files
    .filter((f) => f.type === "file" && f.name.endsWith(".json"))
    .map((f) => f.name.replace(/\.json$/, ""));
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm --filter analytics test
```

Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add tools/analytics/worker/src/github.ts tools/analytics/worker/src/tests/github.test.ts
git commit -m "feat(analytics): implement fetchSubdomains with tests"
```

---

## Task 5: TDD — fetchAnalytics

**Files:**
- Create: `tools/analytics/worker/src/graphql.ts`
- Create: `tools/analytics/worker/src/tests/graphql.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tools/analytics/worker/src/tests/graphql.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchAnalytics } from "../graphql";

const MOCK_GROUPS = [
  {
    dimensions: { clientRequestHTTPHost: "juan.is-pinoy.dev", clientCountryName: "PH" },
    sum: { requests: 42 },
  },
  {
    dimensions: { clientRequestHTTPHost: "juan.is-pinoy.dev", clientCountryName: "US" },
    sum: { requests: 8 },
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
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm --filter analytics test
```

Expected: `Cannot find module '../graphql'`

- [ ] **Step 3: Implement fetchAnalytics**

Create `tools/analytics/worker/src/graphql.ts`:

```typescript
import type { AnalyticsRow } from "./types";

const GRAPHQL_URL = "https://api.cloudflare.com/client/v4/graphql";

const QUERY = `
  query VisitsBySubdomain($zoneTag: String!, $date: String!) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        httpRequestsAdaptiveGroups(
          filter: { date: $date }
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
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm --filter analytics test
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add tools/analytics/worker/src/graphql.ts tools/analytics/worker/src/tests/graphql.test.ts
git commit -m "feat(analytics): implement fetchAnalytics with tests"
```

---

## Task 6: TDD — persistSnapshots

**Files:**
- Create: `tools/analytics/worker/src/db.ts`
- Create: `tools/analytics/worker/src/tests/db.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tools/analytics/worker/src/tests/db.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { persistSnapshots } from "../db";
import type { AnalyticsRow } from "../types";

interface MockStmt {
  sql: string;
  bindings: unknown[];
}

function makeD1Mock() {
  const stmts: MockStmt[] = [];
  const batch = vi.fn().mockResolvedValue([]);

  const db = {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => {
        const stmt = { sql, bindings: args };
        stmts.push(stmt);
        return stmt;
      },
    }),
    batch,
  } as unknown as D1Database;

  return { db, stmts, batch };
}

describe("persistSnapshots", () => {
  it("does nothing when rows array is empty", async () => {
    const { db, batch } = makeD1Mock();
    await persistSnapshots(db, ["juan"], [], "2026-05-28");
    expect(batch).not.toHaveBeenCalled();
  });

  it("does nothing when no rows match the subdomain allowlist", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "unknown.is-pinoy.dev", country: "PH", requests: 10 },
    ];
    await persistSnapshots(db, ["juan"], rows, "2026-05-28");
    expect(batch).not.toHaveBeenCalled();
  });

  it("batches 1 total row + N country rows per subdomain", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "juan.is-pinoy.dev", country: "PH", requests: 30 },
      { host: "juan.is-pinoy.dev", country: "US", requests: 12 },
    ];
    await persistSnapshots(db, ["juan"], rows, "2026-05-28");
    expect(batch).toHaveBeenCalledOnce();
    const calls = batch.mock.calls[0][0] as MockStmt[];
    // 1 total + 2 country rows = 3
    expect(calls).toHaveLength(3);
  });

  it("computes correct total across countries", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "juan.is-pinoy.dev", country: "PH", requests: 30 },
      { host: "juan.is-pinoy.dev", country: "US", requests: 12 },
    ];
    await persistSnapshots(db, ["juan"], rows, "2026-05-28");
    const calls = batch.mock.calls[0][0] as MockStmt[];
    const totalStmt = calls.find((s) =>
      s.sql.includes("visits_daily") && !s.sql.includes("by_country")
    )!;
    expect(totalStmt.bindings).toEqual(["juan", "2026-05-28", 42]);
  });

  it("skips apex domain and unknown subdomains", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "is-pinoy.dev", country: "PH", requests: 5 },
      { host: "unknown.is-pinoy.dev", country: "PH", requests: 5 },
      { host: "juan.is-pinoy.dev", country: "PH", requests: 20 },
    ];
    await persistSnapshots(db, ["juan"], rows, "2026-05-28");
    expect(batch).toHaveBeenCalledOnce();
    const calls = batch.mock.calls[0][0] as MockStmt[];
    // 1 total + 1 country = 2 (only juan)
    expect(calls).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
pnpm --filter analytics test
```

Expected: `Cannot find module '../db'`

- [ ] **Step 3: Implement persistSnapshots**

Create `tools/analytics/worker/src/db.ts`:

```typescript
import type { AnalyticsRow } from "./types";

export async function persistSnapshots(
  db: D1Database,
  subdomains: string[],
  rows: AnalyticsRow[],
  date: string
): Promise<void> {
  if (rows.length === 0) return;

  const allowed = new Set(subdomains);

  const bySubdomain = new Map<string, AnalyticsRow[]>();
  for (const row of rows) {
    const parts = row.host.split(".");
    if (parts.length <= 2) continue;
    const subdomain = parts.slice(0, parts.length - 2).join(".");
    if (!allowed.has(subdomain)) continue;
    const bucket = bySubdomain.get(subdomain) ?? [];
    bucket.push(row);
    bySubdomain.set(subdomain, bucket);
  }

  if (bySubdomain.size === 0) return;

  const totalStmts: D1PreparedStatement[] = [];
  const countryStmts: D1PreparedStatement[] = [];

  for (const [subdomain, subRows] of bySubdomain) {
    const total = subRows.reduce((sum, r) => sum + r.requests, 0);
    totalStmts.push(
      db
        .prepare(
          "INSERT OR REPLACE INTO visits_daily (subdomain, date, visits) VALUES (?, ?, ?)"
        )
        .bind(subdomain, date, total)
    );
    for (const row of subRows) {
      countryStmts.push(
        db
          .prepare(
            "INSERT OR REPLACE INTO visits_daily_by_country (subdomain, date, country, visits) VALUES (?, ?, ?, ?)"
          )
          .bind(subdomain, date, row.country, row.requests)
      );
    }
  }

  await db.batch([...totalStmts, ...countryStmts]);
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
pnpm --filter analytics test
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add tools/analytics/worker/src/db.ts tools/analytics/worker/src/tests/db.test.ts
git commit -m "feat(analytics): implement persistSnapshots with tests"
```

---

## Task 7: Wire Up Scheduled Handler

**Files:**
- Replace: `tools/analytics/worker/index.ts`

- [ ] **Step 1: Replace index.ts entirely**

Replace the contents of `tools/analytics/worker/index.ts` with:

```typescript
import { fetchSubdomains } from "./src/github";
import { fetchAnalytics } from "./src/graphql";
import { persistSnapshots } from "./src/db";

export interface Env {
  ANALYTICS_DB: D1Database;
  CF_API_TOKEN: string;
  CF_ZONE_ID: string;
}

function yesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const date = yesterday();

    const subdomains = await fetchSubdomains();
    if (subdomains.length === 0) {
      throw new Error("Empty subdomain list from GitHub — aborting to avoid data loss");
    }

    const rows = await fetchAnalytics(env.CF_API_TOKEN, env.CF_ZONE_ID, date);
    await persistSnapshots(env.ANALYTICS_DB, subdomains, rows, date);
  },
} satisfies ExportedHandler<Env>;
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm --filter analytics typecheck
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
pnpm --filter analytics test
```

Expected: all 12 tests pass.

- [ ] **Step 4: Commit**

```bash
git add tools/analytics/worker/index.ts
git commit -m "feat(analytics): wire up scheduled handler, remove passthrough fetch"
```

---

## Task 8: Deploy

> This task requires Cloudflare credentials. Run commands from `tools/analytics/`.

- [ ] **Step 1: Create the D1 database**

```bash
cd tools/analytics
pnpm wrangler d1 create analytics-db
```

Copy the `database_id` from the output (a UUID like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

- [ ] **Step 2: Update wrangler.toml with the real database_id**

In `tools/analytics/worker/wrangler.toml`, replace `"PLACEHOLDER"` with the UUID from step 1:

```toml
[[d1_databases]]
binding = "ANALYTICS_DB"
database_name = "analytics-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
migrations_dir = "migrations"
```

- [ ] **Step 3: Apply D1 migrations**

```bash
pnpm wrangler d1 migrations apply analytics-db -c worker/wrangler.toml
```

Expected output: `Migrations applied: 0001_init.sql`

- [ ] **Step 4: Set secrets**

```bash
pnpm wrangler secret put CF_API_TOKEN -c worker/wrangler.toml
# paste your Cloudflare API token (Analytics Read permission)

pnpm wrangler secret put CF_ZONE_ID -c worker/wrangler.toml
# paste the zone ID for is-pinoy.dev

# CF_ACCOUNT_ID is inferred from wrangler login; no secret needed
```

- [ ] **Step 5: Deploy the Worker**

```bash
pnpm wrangler deploy -c worker/wrangler.toml
```

Expected: Worker deployed as `tools-analytics` with cron trigger `0 1 * * *`.

- [ ] **Step 6: Trigger a test run**

In the Cloudflare dashboard → Workers → `tools-analytics` → Triggers → run the cron manually. Verify in Worker logs that the scheduled handler fires without errors.

- [ ] **Step 7: Commit the updated wrangler.toml**

```bash
git add tools/analytics/worker/wrangler.toml
git commit -m "chore(analytics): update D1 database_id after creation"
```
