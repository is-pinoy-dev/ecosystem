# Subdomain Status Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `status.is-pinoy.dev` — a Cloudflare Worker that checks DNS + HTTP health of every registered subdomain every 5 minutes, persists results to D1, and renders a retro pixel-art status table.

**Architecture:** A new `tools/status/` Cloudflare Worker with two handlers: a cron trigger (every 5 min) that runs DNS/HTTP health checks and upserts results into D1, and a fetch handler that serves the React Router SSR status page. The frontend reads D1 in a server-side loader and renders a table with `@is-pinoy-dev/ui` components.

**Tech Stack:** Cloudflare Workers, D1 (SQLite), React Router 7 (SSR), Vite, Tailwind CSS v4, `@is-pinoy-dev/ui`, Vitest

---

## File Map

**Created:**
- `tools/status/package.json` — workspace package config with all deps
- `tools/status/tsconfig.json` — frontend TypeScript config (excludes worker/)
- `tools/status/vite.config.ts` — Vite + React Router + Cloudflare dev proxy
- `tools/status/react-router.config.ts` — SSR enabled, appDirectory: src
- `tools/status/vitest.config.ts` — runs worker/tests/**
- `tools/status/worker/wrangler.toml` — D1 binding, cron, route
- `tools/status/worker/tsconfig.json` — Worker TypeScript config
- `tools/status/worker/migrations/0001_init.sql` — D1 schema
- `tools/status/worker/types.ts` — DnsStatus, HttpStatus, OverallStatus, SubdomainCheck, SubdomainStatus
- `tools/status/worker/github.ts` — fetchSubdomains() from GitHub API
- `tools/status/worker/checker.ts` — checkDns(), checkHttp(), deriveOverall()
- `tools/status/worker/db.ts` — upsertStatus()
- `tools/status/worker/index.ts` — Worker entry: cron handler + fetch handler
- `tools/status/worker/tests/github.test.ts`
- `tools/status/worker/tests/checker.test.ts`
- `tools/status/worker/tests/db.test.ts`
- `tools/status/src/env.d.ts` — AppLoadContext type augmentation
- `tools/status/src/app.css` — scanlines + Press Start 2P + Tailwind
- `tools/status/src/root.tsx` — React Router root layout
- `tools/status/src/entry.server.tsx` — SSR entry
- `tools/status/src/routes.ts` — Route config (single index route)
- `tools/status/src/components/status-badge.tsx` — OPERATIONAL / PROPAGATING / DEGRADED badge
- `tools/status/src/routes/_index.tsx` — Status table page with D1 loader

---

## Task 1: Scaffold package structure

**Files:**
- Create: `tools/status/package.json`
- Create: `tools/status/tsconfig.json`
- Create: `tools/status/vite.config.ts`
- Create: `tools/status/react-router.config.ts`
- Create: `tools/status/vitest.config.ts`
- Create: `tools/status/worker/wrangler.toml`
- Create: `tools/status/worker/tsconfig.json`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p tools/status/worker/migrations tools/status/worker/tests tools/status/src/routes tools/status/src/components
```

- [ ] **Step 2: Create `tools/status/package.json`**

```json
{
  "name": "status",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "react-router build",
    "dev": "react-router dev",
    "typecheck": "react-router typegen && tsc",
    "deploy": "react-router build && wrangler deploy -c worker/wrangler.toml",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@is-pinoy-dev/ui": "workspace:*",
    "@react-router/node": "7.15.1",
    "@react-router/serve": "7.15.1",
    "isbot": "^5.1.36",
    "react": "catalog:",
    "react-dom": "catalog:",
    "react-router": "7.15.1"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20260527.1",
    "@fontsource/ibm-plex-mono": "^5.2.7",
    "@fontsource/press-start-2p": "^5.2.7",
    "@react-router/cloudflare": "7.15.1",
    "@react-router/dev": "7.15.1",
    "@tailwindcss/vite": "^4.3.0",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@workspace/typescript-config": "workspace:*",
    "tailwindcss": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:",
    "vite": "^8.0.3",
    "wrangler": "^4.95.0"
  }
}
```

- [ ] **Step 3: Create `tools/status/tsconfig.json`** (frontend — excludes worker/)

```json
{
  "include": [
    "**/*",
    "**/.server/**/*",
    "**/.client/**/*",
    ".react-router/types/**/*"
  ],
  "exclude": ["worker", "node_modules", "build"],
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "types": ["node", "vite/client"],
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "rootDirs": [".", "./.react-router/types"],
    "paths": {
      "~/*": ["./src/*"]
    },
    "esModuleInterop": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true
  }
}
```

- [ ] **Step 4: Create `tools/status/worker/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["./**/*"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create `tools/status/vite.config.ts`**

```typescript
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [cloudflareDevProxy(), tailwindcss(), reactRouter()],
  resolve: { tsconfigPaths: true },
});
```

- [ ] **Step 6: Create `tools/status/react-router.config.ts`**

```typescript
import type { Config } from "@react-router/dev/config";

export default { ssr: true, appDirectory: "src" } satisfies Config;
```

- [ ] **Step 7: Create `tools/status/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["worker/tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 8: Create `tools/status/worker/wrangler.toml`**

```toml
name = "tools-status"
main = "index.ts"
compatibility_date = "2026-05-27"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "../build/client"
binding = "ASSETS"

[[d1_databases]]
binding = "STATUS_DB"
database_name = "status-db"
database_id = "REPLACE_AFTER_RUNNING: wrangler d1 create status-db -c worker/wrangler.toml"
migrations_dir = "migrations"

[triggers]
crons = ["*/5 * * * *"]

[[routes]]
pattern = "status.is-pinoy.dev/*"
zone_name = "is-pinoy.dev"

[observability]
enabled = false
head_sampling_rate = 1

[observability.logs]
enabled = true
head_sampling_rate = 1
persist = true
invocation_logs = true

[observability.traces]
enabled = true
persist = true
head_sampling_rate = 1
```

- [ ] **Step 9: Install dependencies from `tools/status/`**

```bash
cd tools/status && pnpm install
```

Expected: no errors, `node_modules/` created.

- [ ] **Step 10: Commit scaffold**

```bash
git add tools/status/package.json tools/status/tsconfig.json tools/status/vite.config.ts tools/status/react-router.config.ts tools/status/vitest.config.ts tools/status/worker/wrangler.toml tools/status/worker/tsconfig.json
git commit -m "chore(status): scaffold tools/status package"
```

---

## Task 2: D1 migration

**Files:**
- Create: `tools/status/worker/migrations/0001_init.sql`

- [ ] **Step 1: Create `tools/status/worker/migrations/0001_init.sql`**

```sql
CREATE TABLE IF NOT EXISTS subdomain_status (
  subdomain    TEXT NOT NULL PRIMARY KEY,
  dns_status   TEXT NOT NULL,
  http_status  TEXT NOT NULL,
  overall      TEXT NOT NULL,
  since        TEXT NOT NULL,
  last_checked TEXT NOT NULL
);
```

- [ ] **Step 2: Create the D1 database in Cloudflare (run from `tools/status/`)**

```bash
wrangler d1 create status-db -c worker/wrangler.toml
```

Expected output includes a `database_id` UUID. Copy it into `worker/wrangler.toml`, replacing the placeholder value for `database_id`.

- [ ] **Step 3: Apply migration locally**

```bash
wrangler d1 migrations apply status-db --local -c worker/wrangler.toml
```

Expected: `Migrations applied: 0001_init.sql`

- [ ] **Step 4: Commit**

```bash
git add tools/status/worker/migrations/0001_init.sql tools/status/worker/wrangler.toml
git commit -m "chore(status): add D1 schema migration"
```

---

## Task 3: Shared types

**Files:**
- Create: `tools/status/worker/types.ts`

No unit tests — pure type declarations.

- [ ] **Step 1: Create `tools/status/worker/types.ts`**

```typescript
export type DnsStatus = "live" | "propagating" | "error";
export type HttpStatus = "up" | "down" | "unchecked";
export type OverallStatus = "operational" | "degraded" | "propagating";

export interface SubdomainCheck {
  subdomain: string;
  dns_status: DnsStatus;
  http_status: HttpStatus;
  overall: OverallStatus;
  last_checked: string;
}

export interface SubdomainStatus extends SubdomainCheck {
  since: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add tools/status/worker/types.ts
git commit -m "feat(status): add shared status types"
```

---

## Task 4: GitHub subdomain fetcher — TDD

**Files:**
- Create: `tools/status/worker/github.ts`
- Test: `tools/status/worker/tests/github.test.ts`

- [ ] **Step 1: Write the failing test — `tools/status/worker/tests/github.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchSubdomains } from "../github";

describe("fetchSubdomains", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns subdomain names stripped of .json extension", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: "juan.json", type: "file" },
        { name: "maria.json", type: "file" },
        { name: "README.md", type: "file" },
        { name: "archive", type: "dir" },
      ],
    } as Response);

    const result = await fetchSubdomains();
    expect(result).toEqual(["juan", "maria"]);
  });

  it("throws on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
    } as Response);

    await expect(fetchSubdomains()).rejects.toThrow("GitHub API error: 403");
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm --filter status test
```

Expected: FAIL — `Cannot find module '../github'`

- [ ] **Step 3: Create `tools/status/worker/github.ts`**

```typescript
const GITHUB_URL =
  "https://api.github.com/repos/is-pinoy-dev/domains/contents/subdomains";

interface GitHubEntry {
  name: string;
  type: string;
}

export async function fetchSubdomains(): Promise<string[]> {
  const res = await fetch(GITHUB_URL, {
    headers: { "User-Agent": "is-pinoy.dev status worker" },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const files = (await res.json()) as GitHubEntry[];
  return files
    .filter((f) => f.type === "file" && f.name.endsWith(".json"))
    .map((f) => f.name.replace(/\.json$/, ""));
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
pnpm --filter status test
```

Expected: PASS — 2 tests passed

- [ ] **Step 5: Commit**

```bash
git add tools/status/worker/github.ts tools/status/worker/tests/github.test.ts
git commit -m "feat(status): add GitHub subdomain fetcher"
```

---

## Task 5: DNS + HTTP checker — TDD

**Files:**
- Create: `tools/status/worker/checker.ts`
- Test: `tools/status/worker/tests/checker.test.ts`

- [ ] **Step 1: Write the failing test — `tools/status/worker/tests/checker.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkDns, checkHttp, deriveOverall } from "../checker";

describe("deriveOverall", () => {
  it("returns propagating when DNS is propagating", () => {
    expect(deriveOverall("propagating", "unchecked")).toBe("propagating");
  });

  it("returns degraded when DNS is error", () => {
    expect(deriveOverall("error", "unchecked")).toBe("degraded");
  });

  it("returns operational when DNS is live and HTTP is up", () => {
    expect(deriveOverall("live", "up")).toBe("operational");
  });

  it("returns degraded when DNS is live but HTTP is down", () => {
    expect(deriveOverall("live", "down")).toBe("degraded");
  });
});

describe("checkDns", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  it("returns live when A record exists", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ Status: 0, Answer: [{ type: 1, data: "1.2.3.4" }] }),
    } as Response);

    expect(await checkDns("foo.is-pinoy.dev")).toBe("live");
  });

  it("returns live when only CNAME record exists", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({ Status: 0 }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ Status: 0, Answer: [{ type: 5, data: "cname.vercel.app." }] }),
      } as Response);

    expect(await checkDns("foo.is-pinoy.dev")).toBe("live");
  });

  it("returns propagating when no A or CNAME records (NXDOMAIN)", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ json: async () => ({ Status: 3 }) } as Response)
      .mockResolvedValueOnce({ json: async () => ({ Status: 3 }) } as Response);

    expect(await checkDns("foo.is-pinoy.dev")).toBe("propagating");
  });

  it("returns error on fetch failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));

    expect(await checkDns("foo.is-pinoy.dev")).toBe("error");
  });
});

describe("checkHttp", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  it("returns up when fetch resolves", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ status: 200 } as Response);

    expect(await checkHttp("foo.is-pinoy.dev")).toBe("up");
  });

  it("returns down on network error", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("ECONNREFUSED"));

    expect(await checkHttp("foo.is-pinoy.dev")).toBe("down");
  });

  it("returns down on timeout (abort)", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      Object.assign(new Error("The operation was aborted"), { name: "AbortError" })
    );

    expect(await checkHttp("foo.is-pinoy.dev")).toBe("down");
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm --filter status test
```

Expected: FAIL — `Cannot find module '../checker'`

- [ ] **Step 3: Create `tools/status/worker/checker.ts`**

```typescript
import type { DnsStatus, HttpStatus, OverallStatus } from "./types";

interface DohResponse {
  Status: number;
  Answer?: unknown[];
}

export async function checkDns(fqdn: string): Promise<DnsStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const headers = { accept: "application/dns-json" };
    const signal = controller.signal;

    const aRes = await fetch(
      `https://1.1.1.1/dns-query?name=${fqdn}&type=A`,
      { headers, signal }
    );
    const a = (await aRes.json()) as DohResponse;
    if (a.Status === 0 && (a.Answer?.length ?? 0) > 0) return "live";

    const cnameRes = await fetch(
      `https://1.1.1.1/dns-query?name=${fqdn}&type=CNAME`,
      { headers, signal }
    );
    const cname = (await cnameRes.json()) as DohResponse;
    if (cname.Status === 0 && (cname.Answer?.length ?? 0) > 0) return "live";

    return "propagating";
  } catch {
    return "error";
  } finally {
    clearTimeout(timer);
  }
}

export async function checkHttp(fqdn: string): Promise<HttpStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(`https://${fqdn}`, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    return "up";
  } catch {
    return "down";
  } finally {
    clearTimeout(timer);
  }
}

export function deriveOverall(dns: DnsStatus, http: HttpStatus): OverallStatus {
  if (dns === "propagating") return "propagating";
  if (dns === "error") return "degraded";
  if (http === "up") return "operational";
  return "degraded";
}
```

- [ ] **Step 4: Run all tests — verify they pass**

```bash
pnpm --filter status test
```

Expected: PASS — all tests passed

- [ ] **Step 5: Commit**

```bash
git add tools/status/worker/checker.ts tools/status/worker/tests/checker.test.ts
git commit -m "feat(status): add DNS and HTTP health checker"
```

---

## Task 6: D1 database layer — TDD

**Files:**
- Create: `tools/status/worker/db.ts`
- Test: `tools/status/worker/tests/db.test.ts`

- [ ] **Step 1: Write the failing test — `tools/status/worker/tests/db.test.ts`**

```typescript
/// <reference types="@cloudflare/workers-types" />
import { describe, it, expect } from "vitest";
import { upsertStatus } from "../db";
import type { SubdomainCheck } from "../types";

function makeDb() {
  const store = new Map<string, Record<string, string>>();

  return {
    prepare(_sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async first<T>(): Promise<T | null> {
              const subdomain = args[0] as string;
              return (store.get(subdomain) ?? null) as T | null;
            },
            async run(): Promise<void> {
              const [subdomain, dns_status, http_status, overall, since, last_checked] =
                args as string[];
              store.set(subdomain, {
                subdomain,
                dns_status,
                http_status,
                overall,
                since,
                last_checked,
              });
            },
          };
        },
      };
    },
    _store: store,
  } as unknown as D1Database & { _store: Map<string, Record<string, string>> };
}

const BASE: SubdomainCheck = {
  subdomain: "juan",
  dns_status: "live",
  http_status: "up",
  overall: "operational",
  last_checked: "2026-05-30T00:00:00.000Z",
};

describe("upsertStatus", () => {
  it("sets since = last_checked on first insert", async () => {
    const db = makeDb();
    await upsertStatus(db, BASE);

    const row = db._store.get("juan")!;
    expect(row.since).toBe("2026-05-30T00:00:00.000Z");
    expect(row.overall).toBe("operational");
  });

  it("updates since when overall status changes", async () => {
    const db = makeDb();
    await upsertStatus(db, {
      ...BASE,
      overall: "propagating",
      dns_status: "propagating",
      http_status: "unchecked",
      last_checked: "2026-05-30T00:00:00.000Z",
    });

    await upsertStatus(db, {
      ...BASE,
      last_checked: "2026-05-30T00:05:00.000Z",
    });

    const row = db._store.get("juan")!;
    expect(row.overall).toBe("operational");
    expect(row.since).toBe("2026-05-30T00:05:00.000Z");
  });

  it("preserves since when overall status is unchanged", async () => {
    const db = makeDb();
    await upsertStatus(db, BASE);

    await upsertStatus(db, {
      ...BASE,
      last_checked: "2026-05-30T00:05:00.000Z",
    });

    const row = db._store.get("juan")!;
    expect(row.since).toBe("2026-05-30T00:00:00.000Z");
    expect(row.last_checked).toBe("2026-05-30T00:05:00.000Z");
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
pnpm --filter status test
```

Expected: FAIL — `Cannot find module '../db'`

- [ ] **Step 3: Create `tools/status/worker/db.ts`**

```typescript
import type { D1Database } from "@cloudflare/workers-types";
import type { OverallStatus, SubdomainCheck } from "./types";

export async function upsertStatus(
  db: D1Database,
  check: SubdomainCheck
): Promise<void> {
  const current = await db
    .prepare(
      "SELECT overall, since FROM subdomain_status WHERE subdomain = ?"
    )
    .bind(check.subdomain)
    .first<{ overall: OverallStatus; since: string }>();

  const since =
    !current || current.overall !== check.overall
      ? check.last_checked
      : current.since;

  await db
    .prepare(
      `INSERT INTO subdomain_status
         (subdomain, dns_status, http_status, overall, since, last_checked)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(subdomain) DO UPDATE SET
         dns_status   = excluded.dns_status,
         http_status  = excluded.http_status,
         overall      = excluded.overall,
         since        = excluded.since,
         last_checked = excluded.last_checked`
    )
    .bind(
      check.subdomain,
      check.dns_status,
      check.http_status,
      check.overall,
      since,
      check.last_checked
    )
    .run();
}
```

- [ ] **Step 4: Run all tests — verify they pass**

```bash
pnpm --filter status test
```

Expected: PASS — all tests passed

- [ ] **Step 5: Commit**

```bash
git add tools/status/worker/db.ts tools/status/worker/tests/db.test.ts
git commit -m "feat(status): add D1 upsert layer"
```

---

## Task 7: Worker entry point

**Files:**
- Create: `tools/status/worker/index.ts`

No unit tests — integration concern. Manual verification via `pnpm dev`.

- [ ] **Step 1: Create `tools/status/worker/index.ts`**

```typescript
import { createRequestHandler } from "@react-router/cloudflare";
// @ts-ignore - build/server is generated at compile time, absent during typecheck
import * as build from "../build/server";

import { fetchSubdomains } from "./github";
import { checkDns, checkHttp, deriveOverall } from "./checker";
import { upsertStatus } from "./db";

export interface Env {
  STATUS_DB: D1Database;
  ASSETS: Fetcher;
}

const handleRequest = createRequestHandler({
  build,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLoadContext: ({ context }: any) => ({
    cloudflare: {
      env: context.cloudflare.env,
      ctx: context.cloudflare.ctx,
    },
  }),
});

export default {
  async scheduled(
    _event: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    const subdomains = await fetchSubdomains();
    if (subdomains.length === 0) {
      throw new Error(
        "Empty subdomain list from GitHub — aborting to avoid data loss"
      );
    }

    const now = new Date().toISOString();

    const results = await Promise.allSettled(
      subdomains.map(async (subdomain) => {
        const fqdn = `${subdomain}.is-pinoy.dev`;
        const dns = await checkDns(fqdn);
        const http =
          dns === "live" ? await checkHttp(fqdn) : ("unchecked" as const);
        const overall = deriveOverall(dns, http);
        await upsertStatus(env.STATUS_DB, {
          subdomain,
          dns_status: dns,
          http_status: http,
          overall,
          last_checked: now,
        });
      })
    );

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Subdomain check failed:", result.reason);
      }
    }
  },

  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (env.ASSETS) {
      try {
        const assetResponse = await env.ASSETS.fetch(
          new Request(request.url, request)
        );
        if (assetResponse.status !== 404) return assetResponse;
      } catch {
        // fall through to SSR
      }
    }

    try {
      const cfContext = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request: request as any,
        functionPath: "",
        waitUntil: ctx.waitUntil.bind(ctx),
        passThroughOnException: ctx.passThroughOnException.bind(ctx),
        next: () => Promise.resolve(new Response("Not Found", { status: 404 })),
        env,
        params: {},
        data: {},
      };
      return await handleRequest(cfContext);
    } catch (err) {
      console.error(
        "[status] React Router threw:",
        err instanceof Error ? err.stack : String(err)
      );
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
```

- [ ] **Step 2: Commit**

```bash
git add tools/status/worker/index.ts
git commit -m "feat(status): add Worker entry point with cron and fetch handlers"
```

---

## Task 8: Frontend scaffold

**Files:**
- Create: `tools/status/src/env.d.ts`
- Create: `tools/status/src/app.css`
- Create: `tools/status/src/root.tsx`
- Create: `tools/status/src/entry.server.tsx`
- Create: `tools/status/src/routes.ts`

- [ ] **Step 1: Create `tools/status/src/env.d.ts`** (AppLoadContext type augmentation)

```typescript
import type { D1Database } from "@cloudflare/workers-types";

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: {
        STATUS_DB: D1Database;
        ASSETS: Fetcher;
      };
      ctx: { waitUntil(promise: Promise<unknown>): void };
    };
  }
}
```

- [ ] **Step 2: Create `tools/status/src/app.css`**

```css
@import "@is-pinoy-dev/ui/globals.css";
@import "@fontsource/press-start-2p/400.css";
@import "@fontsource/ibm-plex-mono/400.css";

@source "../**/*.{ts,tsx}";

@theme inline {
  --font-pixel: "Press Start 2P", monospace;
  --font-sans: "IBM Plex Mono", monospace;
  --font-mono: "IBM Plex Mono", monospace;
}

body::after {
  content: "";
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.05) 2px,
    rgba(0, 0, 0, 0.05) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
```

- [ ] **Step 3: Create `tools/status/src/root.tsx`**

```typescript
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const message =
    isRouteErrorResponse(error) && error.status === 404 ? "404" : "Error";
  const details =
    isRouteErrorResponse(error)
      ? error.status === 404
        ? "Page not found."
        : error.statusText
      : import.meta.env.DEV && error instanceof Error
        ? error.message
        : "An unexpected error occurred.";

  return (
    <main className="p-8 font-pixel">
      <h1 className="text-primary text-base mb-4">{message}</h1>
      <p className="text-muted-foreground text-xs">{details}</p>
    </main>
  );
}
```

- [ ] **Step 4: Create `tools/status/src/entry.server.tsx`**

```typescript
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { renderToReadableStream } from "react-dom/server";
import { isbot } from "isbot";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  let status = responseStatusCode;

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        console.error(
          "[status] SSR error:",
          error instanceof Error ? error.stack : String(error)
        );
        status = 500;
      },
    }
  );

  if (isbot(request.headers.get("user-agent"))) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, { headers: responseHeaders, status });
}
```

- [ ] **Step 5: Create `tools/status/src/routes.ts`**

```typescript
import { type RouteConfig, index } from "@react-router/dev/routes";

export default [index("routes/_index.tsx")] satisfies RouteConfig;
```

- [ ] **Step 6: Commit**

```bash
git add tools/status/src/
git commit -m "feat(status): add React Router frontend scaffold"
```

---

## Task 9: Status badge component

**Files:**
- Create: `tools/status/src/components/status-badge.tsx`

- [ ] **Step 1: Create `tools/status/src/components/status-badge.tsx`**

```typescript
import { Badge } from "@is-pinoy-dev/ui/components/badge";
import type { OverallStatus } from "../../worker/types";

const CONFIG: Record<OverallStatus, { label: string; className: string }> = {
  operational: {
    label: "OPERATIONAL",
    className:
      "rounded-none bg-green-500 text-black border-2 border-black shadow-[2px_2px_0px_#000] font-pixel text-[8px] hover:bg-green-500",
  },
  propagating: {
    label: "PROPAGATING",
    className:
      "rounded-none bg-primary text-black border-2 border-black shadow-[2px_2px_0px_#000] font-pixel text-[8px] hover:bg-primary",
  },
  degraded: {
    label: "DEGRADED",
    className:
      "rounded-none bg-red-500 text-white border-2 border-black shadow-[2px_2px_0px_#000] font-pixel text-[8px] hover:bg-red-500",
  },
};

export function StatusBadge({ status }: { status: OverallStatus }) {
  const { label, className } = CONFIG[status];
  return <Badge className={className}>{label}</Badge>;
}
```

- [ ] **Step 2: Commit**

```bash
git add tools/status/src/components/status-badge.tsx
git commit -m "feat(status): add pixel-art status badge component"
```

---

## Task 10: Status page with D1 loader

**Files:**
- Create: `tools/status/src/routes/_index.tsx`

- [ ] **Step 1: Generate React Router types (run from `tools/status/`)**

```bash
pnpm react-router typegen
```

Expected: `.react-router/types/app/routes/+types/_index.d.ts` created. Required so `Route.LoaderArgs` is available.

- [ ] **Step 2: Create `tools/status/src/routes/_index.tsx`**

```typescript
import { useLoaderData } from "react-router";
import { useState } from "react";
import { StatusBadge } from "~/components/status-badge";
import type { Route } from "./+types/_index";
import type { SubdomainStatus } from "../../../worker/types";

export const meta: Route.MetaFunction = () => [
  { title: "is-pinoy.dev — Status" },
];

export async function loader({ context }: Route.LoaderArgs) {
  const { results } = await context.cloudflare.env.STATUS_DB.prepare(
    "SELECT * FROM subdomain_status ORDER BY subdomain ASC"
  ).all<SubdomainStatus>();
  return { statuses: results };
}

const DNS_LABEL: Record<SubdomainStatus["dns_status"], string> = {
  live: "✅ Live",
  propagating: "⏳ Propagating",
  error: "❌ Error",
};

const HTTP_LABEL: Record<SubdomainStatus["http_status"], string> = {
  up: "✅ Up",
  down: "❌ Down",
  unchecked: "—",
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function StatusPage() {
  const { statuses } = useLoaderData<typeof loader>();
  const [search, setSearch] = useState("");

  const filtered = statuses.filter((s) =>
    s.subdomain.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    operational: statuses.filter((s) => s.overall === "operational").length,
    propagating: statuses.filter((s) => s.overall === "propagating").length,
    degraded: statuses.filter((s) => s.overall === "degraded").length,
  };

  const lastChecked =
    statuses.length > 0
      ? statuses.reduce(
          (latest, s) => (s.last_checked > latest ? s.last_checked : latest),
          statuses[0].last_checked
        )
      : null;

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <h1 className="font-pixel text-primary text-sm md:text-base mb-8 leading-loose">
        [ IS-PINOY.DEV STATUS ]
      </h1>

      <div className="flex flex-wrap gap-6 mb-8 font-pixel text-[9px]">
        <span className="text-green-400">{counts.operational} OPERATIONAL</span>
        <span className="text-primary">{counts.propagating} PROPAGATING</span>
        <span className="text-red-400">{counts.degraded} DEGRADED</span>
      </div>

      <input
        type="text"
        placeholder="SEARCH SUBDOMAIN..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm mb-6 px-4 py-2 bg-card border-2 border-border text-foreground font-pixel text-[9px] outline-none focus:border-primary"
      />

      {filtered.length === 0 ? (
        <p className="font-pixel text-muted-foreground text-[9px]">
          {statuses.length === 0
            ? "NO DATA YET — FIRST CHECK PENDING"
            : "NO RESULTS"}
        </p>
      ) : (
        <div className="overflow-x-auto border-2 border-border shadow-[4px_4px_0px_#000]">
          <table className="w-full text-[9px] font-pixel">
            <thead>
              <tr className="border-b-2 border-border bg-card">
                <th className="text-left p-4 text-muted-foreground font-normal">
                  SUBDOMAIN
                </th>
                <th className="text-left p-4 text-muted-foreground font-normal">
                  DNS
                </th>
                <th className="text-left p-4 text-muted-foreground font-normal">
                  SITE
                </th>
                <th className="text-left p-4 text-muted-foreground font-normal">
                  STATUS
                </th>
                <th className="text-left p-4 text-muted-foreground font-normal">
                  SINCE
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.subdomain}
                  className="border-b border-border hover:bg-card/50 transition-colors"
                >
                  <td className="p-4 text-foreground">
                    {s.subdomain}.is-pinoy.dev
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {DNS_LABEL[s.dns_status]}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {HTTP_LABEL[s.http_status]}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={s.overall} />
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {formatRelative(s.since)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lastChecked && (
        <p className="mt-8 font-pixel text-muted-foreground text-[8px]">
          LAST CHECKED: {formatRelative(lastChecked)}
        </p>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Build and verify no TypeScript errors**

```bash
pnpm --filter status typecheck
```

Expected: No errors. If `.react-router/types` errors appear, run `pnpm react-router typegen` first.

- [ ] **Step 4: Run all tests one final time**

```bash
pnpm --filter status test
```

Expected: PASS — all tests passed

- [ ] **Step 5: Commit**

```bash
git add tools/status/src/routes/_index.tsx
git commit -m "feat(status): add status table page with D1 server loader"
```

---

## Task 11: Apply D1 migration to production and deploy

- [ ] **Step 1: Apply migration to production D1**

```bash
wrangler d1 migrations apply status-db -c worker/wrangler.toml
```

Expected: `Migrations applied: 0001_init.sql`

- [ ] **Step 2: Build and deploy**

```bash
pnpm --filter status deploy
```

Expected: Worker deployed to `status.is-pinoy.dev`

- [ ] **Step 3: Add `status.is-pinoy.dev` DNS CNAME record**

In the Cloudflare dashboard for `is-pinoy.dev`, add:
- Type: CNAME
- Name: `status`
- Target: `tools-status.<your-account>.workers.dev`
- Proxied: ✅

Or configure via the `[[routes]]` in wrangler.toml — the route `status.is-pinoy.dev/*` in wrangler.toml handles routing automatically if the subdomain already points to Cloudflare.

- [ ] **Step 4: Trigger a manual cron run to populate D1**

```bash
wrangler workers tail tools-status -c worker/wrangler.toml
```

Then in another terminal, trigger the cron manually via the Cloudflare dashboard (Workers → tools-status → Triggers → Test scheduled event). Verify logs show subdomain checks running.

- [ ] **Step 5: Verify `status.is-pinoy.dev` renders the status table**

Open `https://status.is-pinoy.dev` in a browser. Confirm:
- Retro pixel-art layout with scanlines renders
- Summary bar shows subdomain counts
- Table shows subdomains with DNS / Site / Status / Since columns
- `LAST CHECKED: Xm ago` appears in footer

- [ ] **Step 6: Commit final state**

```bash
git add -A
git commit -m "feat(status): deploy subdomain health status page"
```

---

## Self-Review Notes

- **Spec coverage:** All spec sections covered — cron checks ✅, D1 schema ✅, DNS (DoH A+CNAME) ✅, HTTP check ✅, state-change timestamp ✅, retro pixel-art UI ✅, empty state ✅, error handling ✅
- **Type consistency:** `SubdomainCheck` used as input to `upsertStatus`, `SubdomainStatus` (extends `SubdomainCheck` + `since`) returned from D1 queries and used in the UI — consistent throughout
- **No placeholders:** All code blocks are complete and executable
