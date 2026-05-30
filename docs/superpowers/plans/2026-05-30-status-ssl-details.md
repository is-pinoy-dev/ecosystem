# Status SSL Checks + Subdomain Details Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SSL certificate checking (validity + expiry via CT logs) to the status worker, and a per-subdomain details page showing DNS, HTTP, SSL, and public owner info.

**Architecture:** SSL validity is derived from existing HTTPS reachability; expiry/issuer come from crt.sh (Certificate Transparency logs). SSL is re-checked at most every ~12h to spare crt.sh. A new React Router dynamic route renders a details page whose loader queries D1 and fetches public owner info from the `domains` repo (never the email).

**Tech Stack:** TypeScript, Cloudflare Workers, D1 (SQLite), React Router 7, Vitest, Tailwind v4 (retro pixel theme).

---

## File Structure

- `packages/status/src/types.ts` — add `SslStatus`, `SslResult`; extend `SubdomainCheck`/`SubdomainStatus` with SSL fields.
- `packages/status/src/checker.ts` — add `checkSsl()`.
- `tools/status/worker/types.ts` — re-export new types.
- `tools/status/src/types.ts` — re-export new types.
- `tools/status/worker/checker.ts` — re-export `checkSsl`.
- `tools/status/worker/migrations/0002_add_ssl.sql` — add SSL columns.
- `tools/status/worker/db.ts` — persist SSL columns in `upsertStatus`.
- `tools/status/worker/index.ts` — SSL refresh orchestration in `runChecks`.
- `tools/status/src/lib/owner.ts` — fetch+parse public owner info (new).
- `tools/status/src/components/status-badge.tsx` — add `SslBadge`.
- `tools/status/src/routes/subdomain.tsx` — details page (new).
- `tools/status/src/routes.ts` — register `:subdomain` route.
- `tools/status/src/routes/_index.tsx` — link rows + SSL column.
- Tests: `tools/status/worker/tests/checker.test.ts`, `tools/status/worker/tests/db.test.ts`, `tools/status/worker/tests/owner.test.ts` (new).

**Key constraint:** `@is-pinoy-dev/status` resolves to `dist/`, so after editing the package you MUST rebuild it before the worker tests see changes. Vitest only includes `worker/tests/**/*.test.ts`.

---

### Task 1: Add SSL types to `@is-pinoy-dev/status`

**Files:**
- Modify: `packages/status/src/types.ts`
- Modify: `tools/status/worker/types.ts`
- Modify: `tools/status/src/types.ts`

- [ ] **Step 1: Add SSL types and extend interfaces**

Replace the entire contents of `packages/status/src/types.ts` with:

```ts
export type DnsStatus = "live" | "propagating" | "error";
export type HttpStatus = "up" | "down" | "unchecked";
export type OverallStatus = "operational" | "degraded" | "propagating";
export type SslStatus = "valid" | "expiring" | "expired" | "unknown";

export interface SslResult {
  status: SslStatus;
  expiresAt: string | null;
  issuer: string | null;
}

export interface SubdomainCheck {
  subdomain: string;
  dns_status: DnsStatus;
  http_status: HttpStatus;
  overall: OverallStatus;
  ssl_status: SslStatus | null;
  ssl_expires_at: string | null;
  ssl_issuer: string | null;
  ssl_checked_at: string | null;
  last_checked: string;
}

export interface SubdomainStatus extends SubdomainCheck {
  since: string;
}
```

- [ ] **Step 2: Update the worker type re-export**

Replace the contents of `tools/status/worker/types.ts` with:

```ts
export type {
  DnsStatus,
  HttpStatus,
  OverallStatus,
  SslStatus,
  SslResult,
  SubdomainCheck,
  SubdomainStatus,
} from "@is-pinoy-dev/status";
```

- [ ] **Step 3: Update the frontend type re-export**

Replace the contents of `tools/status/src/types.ts` with:

```ts
// Re-exported from the shared @is-pinoy-dev/status package.
export type {
  DnsStatus,
  HttpStatus,
  OverallStatus,
  SslStatus,
  SslResult,
  SubdomainCheck,
  SubdomainStatus,
} from "@is-pinoy-dev/status";
```

- [ ] **Step 4: Build the package so consumers see the new types**

Run: `pnpm --filter @is-pinoy-dev/status build`
Expected: `tsc` exits 0, no output.

- [ ] **Step 5: Commit**

```bash
git add packages/status/src/types.ts tools/status/worker/types.ts tools/status/src/types.ts
git commit -m "feat(status): add SSL types to status package"
```

---

### Task 2: Implement `checkSsl`

**Files:**
- Modify: `packages/status/src/checker.ts`
- Modify: `tools/status/worker/checker.ts`
- Test: `tools/status/worker/tests/checker.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tools/status/worker/tests/checker.test.ts` (and add `checkSsl` to the existing import on line 2 so it reads `import { checkDns, checkHttp, deriveOverall, checkSsl } from "../checker";`):

```ts
describe("checkSsl", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  function crtResponse(entries: { not_after: string; issuer_name: string }[]) {
    return { ok: true, status: 200, json: async () => entries } as Response;
  }

  it("returns unknown without querying when http is unreachable", async () => {
    const result = await checkSsl("foo.is-pinoy.dev", false);
    expect(result).toEqual({ status: "unknown", expiresAt: null, issuer: null });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns valid for a cert far from expiry", async () => {
    const future = new Date(Date.now() + 90 * 86_400_000).toISOString();
    vi.mocked(fetch).mockResolvedValueOnce(
      crtResponse([{ not_after: future, issuer_name: "Let's Encrypt" }])
    );
    const result = await checkSsl("foo.is-pinoy.dev", true);
    expect(result.status).toBe("valid");
    expect(result.issuer).toBe("Let's Encrypt");
    expect(result.expiresAt).not.toBeNull();
  });

  it("returns expiring when under 14 days remain", async () => {
    const soon = new Date(Date.now() + 5 * 86_400_000).toISOString();
    vi.mocked(fetch).mockResolvedValueOnce(
      crtResponse([{ not_after: soon, issuer_name: "Let's Encrypt" }])
    );
    expect((await checkSsl("foo.is-pinoy.dev", true)).status).toBe("expiring");
  });

  it("returns expired when not_after is in the past", async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    vi.mocked(fetch).mockResolvedValueOnce(
      crtResponse([{ not_after: past, issuer_name: "Let's Encrypt" }])
    );
    expect((await checkSsl("foo.is-pinoy.dev", true)).status).toBe("expired");
  });

  it("picks the entry with the latest not_after", async () => {
    const older = new Date(Date.now() + 10 * 86_400_000).toISOString();
    const newer = new Date(Date.now() + 100 * 86_400_000).toISOString();
    vi.mocked(fetch).mockResolvedValueOnce(
      crtResponse([
        { not_after: older, issuer_name: "Old" },
        { not_after: newer, issuer_name: "New" },
      ])
    );
    const result = await checkSsl("foo.is-pinoy.dev", true);
    expect(result.status).toBe("valid");
    expect(result.issuer).toBe("New");
  });

  it("returns unknown when crt.sh returns a non-OK status", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 502 } as Response);
    expect((await checkSsl("foo.is-pinoy.dev", true)).status).toBe("unknown");
  });

  it("returns unknown when crt.sh returns an empty array", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(crtResponse([]));
    expect((await checkSsl("foo.is-pinoy.dev", true)).status).toBe("unknown");
  });

  it("returns unknown on fetch failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));
    expect((await checkSsl("foo.is-pinoy.dev", true)).status).toBe("unknown");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter status test -- checker`
Expected: FAIL — `checkSsl is not a function` / `not exported`.

- [ ] **Step 3: Implement `checkSsl` in the package**

Append to `packages/status/src/checker.ts` (and add `SslResult, SslStatus` to the existing type import on line 1 so it reads `import type { DnsStatus, HttpStatus, OverallStatus, SslResult, SslStatus } from "./types.js";`):

```ts
interface CrtShEntry {
  not_after: string;
  issuer_name: string;
}

const SSL_EXPIRING_DAYS = 14;

export async function checkSsl(
  fqdn: string,
  httpReachable: boolean
): Promise<SslResult> {
  if (!httpReachable) {
    return { status: "unknown", expiresAt: null, issuer: null };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(
      `https://crt.sh/?q=${encodeURIComponent(fqdn)}&output=json`,
      {
        headers: { "User-Agent": "is-pinoy.dev status worker" },
        signal: controller.signal,
      }
    );
    if (!res.ok) return { status: "unknown", expiresAt: null, issuer: null };

    const entries = (await res.json()) as CrtShEntry[];
    if (!Array.isArray(entries) || entries.length === 0) {
      return { status: "unknown", expiresAt: null, issuer: null };
    }

    const latest = entries.reduce((a, b) =>
      new Date(b.not_after).getTime() > new Date(a.not_after).getTime() ? b : a
    );
    const expiresAt = new Date(latest.not_after).toISOString();
    const daysLeft =
      (new Date(expiresAt).getTime() - Date.now()) / 86_400_000;
    const status: SslStatus =
      daysLeft < 0 ? "expired" : daysLeft < SSL_EXPIRING_DAYS ? "expiring" : "valid";

    return { status, expiresAt, issuer: latest.issuer_name ?? null };
  } catch {
    return { status: "unknown", expiresAt: null, issuer: null };
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 4: Re-export from the worker checker**

Replace the contents of `tools/status/worker/checker.ts` with:

```ts
export { checkDns, checkHttp, deriveOverall, checkSsl } from "@is-pinoy-dev/status";
```

- [ ] **Step 5: Rebuild the package and run tests**

Run: `pnpm --filter @is-pinoy-dev/status build && pnpm --filter status test -- checker`
Expected: PASS — all `checkSsl` tests green, existing `checkDns`/`checkHttp`/`deriveOverall` tests still green.

- [ ] **Step 6: Commit**

```bash
git add packages/status/src/checker.ts tools/status/worker/checker.ts tools/status/worker/tests/checker.test.ts
git commit -m "feat(status): add checkSsl using crt.sh certificate transparency logs"
```

---

### Task 3: Migration + persist SSL columns in `upsertStatus`

**Files:**
- Create: `tools/status/worker/migrations/0002_add_ssl.sql`
- Modify: `tools/status/worker/db.ts`
- Test: `tools/status/worker/tests/db.test.ts`

- [ ] **Step 1: Create the migration**

Create `tools/status/worker/migrations/0002_add_ssl.sql`:

```sql
ALTER TABLE subdomain_status ADD COLUMN ssl_status TEXT;
ALTER TABLE subdomain_status ADD COLUMN ssl_expires_at TEXT;
ALTER TABLE subdomain_status ADD COLUMN ssl_issuer TEXT;
ALTER TABLE subdomain_status ADD COLUMN ssl_checked_at TEXT;
```

- [ ] **Step 2: Update the test mock and BASE, add an SSL assertion**

In `tools/status/worker/tests/db.test.ts`, replace the `run()` body (lines 18-29) so it destructures and stores the new columns:

```ts
            async run(): Promise<void> {
              const [
                subdomain,
                dns_status,
                http_status,
                overall,
                since,
                last_checked,
                ssl_status,
                ssl_expires_at,
                ssl_issuer,
                ssl_checked_at,
              ] = args as (string | null)[];
              store.set(subdomain as string, {
                subdomain: subdomain as string,
                dns_status: dns_status as string,
                http_status: http_status as string,
                overall: overall as string,
                since: since as string,
                last_checked: last_checked as string,
                ssl_status: ssl_status as string,
                ssl_expires_at: ssl_expires_at as string,
                ssl_issuer: ssl_issuer as string,
                ssl_checked_at: ssl_checked_at as string,
              });
            },
```

Replace the `BASE` constant (lines 38-44) with:

```ts
const BASE: SubdomainCheck = {
  subdomain: "juan",
  dns_status: "live",
  http_status: "up",
  overall: "operational",
  ssl_status: "valid",
  ssl_expires_at: "2026-08-28T23:59:59.000Z",
  ssl_issuer: "Let's Encrypt",
  ssl_checked_at: "2026-05-30T00:00:00.000Z",
  last_checked: "2026-05-30T00:00:00.000Z",
};
```

Add this test inside the `describe("upsertStatus", ...)` block:

```ts
  it("persists SSL columns", async () => {
    const db = makeDb();
    await upsertStatus(db, BASE);

    const row = db._store.get("juan")!;
    expect(row.ssl_status).toBe("valid");
    expect(row.ssl_expires_at).toBe("2026-08-28T23:59:59.000Z");
    expect(row.ssl_issuer).toBe("Let's Encrypt");
    expect(row.ssl_checked_at).toBe("2026-05-30T00:00:00.000Z");
  });
```

- [ ] **Step 3: Run tests to verify failure**

Run: `pnpm --filter status test -- db`
Expected: FAIL — `ssl_status` is `undefined` (upsertStatus does not bind SSL columns yet).

- [ ] **Step 4: Update `upsertStatus`**

Replace the contents of `tools/status/worker/db.ts` with:

```ts
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
         (subdomain, dns_status, http_status, overall, since, last_checked,
          ssl_status, ssl_expires_at, ssl_issuer, ssl_checked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(subdomain) DO UPDATE SET
         dns_status     = excluded.dns_status,
         http_status    = excluded.http_status,
         overall        = excluded.overall,
         since          = excluded.since,
         last_checked   = excluded.last_checked,
         ssl_status     = excluded.ssl_status,
         ssl_expires_at = excluded.ssl_expires_at,
         ssl_issuer     = excluded.ssl_issuer,
         ssl_checked_at = excluded.ssl_checked_at`
    )
    .bind(
      check.subdomain,
      check.dns_status,
      check.http_status,
      check.overall,
      since,
      check.last_checked,
      check.ssl_status,
      check.ssl_expires_at,
      check.ssl_issuer,
      check.ssl_checked_at
    )
    .run();
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter status test -- db`
Expected: PASS — all `upsertStatus` tests green (since logic + SSL persistence).

- [ ] **Step 6: Commit**

```bash
git add tools/status/worker/migrations/0002_add_ssl.sql tools/status/worker/db.ts tools/status/worker/tests/db.test.ts
git commit -m "feat(status): persist SSL columns and add migration 0002"
```

---

### Task 4: SSL refresh orchestration in `runChecks`

**Files:**
- Modify: `tools/status/worker/index.ts:25-57`

- [ ] **Step 1: Update imports**

In `tools/status/worker/index.ts`, replace the import on line 6:

```ts
import { checkDns, checkHttp, deriveOverall, checkSsl } from "./checker";
```

and add to the type import (line 5 area) — if there is no type import yet, add this line after the existing imports:

```ts
import type { SslStatus } from "./types";
```

- [ ] **Step 2: Replace `runChecks` with SSL-aware orchestration**

Replace the entire `runChecks` function (lines 25-57) with:

```ts
const SSL_REFRESH_MS = 12 * 60 * 60 * 1000;

interface PriorSsl {
  ssl_status: SslStatus | null;
  ssl_expires_at: string | null;
  ssl_issuer: string | null;
  ssl_checked_at: string | null;
}

function shouldRefreshSsl(prev: PriorSsl | null): boolean {
  if (!prev || !prev.ssl_checked_at) return true;
  if (prev.ssl_status === "expiring" || prev.ssl_status === "expired") return true;
  return Date.now() - new Date(prev.ssl_checked_at).getTime() > SSL_REFRESH_MS;
}

async function runChecks(env: Env): Promise<void> {
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

      const prev = await env.STATUS_DB.prepare(
        "SELECT ssl_status, ssl_expires_at, ssl_issuer, ssl_checked_at FROM subdomain_status WHERE subdomain = ?"
      )
        .bind(subdomain)
        .first<PriorSsl>();

      let ssl_status = prev?.ssl_status ?? null;
      let ssl_expires_at = prev?.ssl_expires_at ?? null;
      let ssl_issuer = prev?.ssl_issuer ?? null;
      let ssl_checked_at = prev?.ssl_checked_at ?? null;

      if (shouldRefreshSsl(prev)) {
        const ssl = await checkSsl(fqdn, http === "up");
        ssl_status = ssl.status;
        ssl_expires_at = ssl.expiresAt;
        ssl_issuer = ssl.issuer;
        ssl_checked_at = now;
      }

      await upsertStatus(env.STATUS_DB, {
        subdomain,
        dns_status: dns,
        http_status: http,
        overall,
        ssl_status,
        ssl_expires_at,
        ssl_issuer,
        ssl_checked_at,
        last_checked: now,
      });
    })
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Subdomain check failed:", result.reason);
    }
  }
}
```

- [ ] **Step 3: Typecheck the worker**

Run: `pnpm --filter status typecheck`
Expected: PASS — `react-router typegen && tsc` exits 0.

- [ ] **Step 4: Run the full worker test suite (no regressions)**

Run: `pnpm --filter status test`
Expected: PASS — all existing tests green.

- [ ] **Step 5: Commit**

```bash
git add tools/status/worker/index.ts
git commit -m "feat(status): refresh SSL at most every 12h in runChecks"
```

---

### Task 5: Owner-info fetch helper

**Files:**
- Create: `tools/status/src/lib/owner.ts`
- Test: `tools/status/worker/tests/owner.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tools/status/worker/tests/owner.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseOwner, fetchOwnerInfo } from "../../src/lib/owner";

describe("parseOwner", () => {
  it("extracts github handle and first record type", () => {
    const result = parseOwner({
      subdomain: "juan",
      owner: { github: "juandelacruz", email: "secret@example.com" },
      records: { CNAME: { value: "x.vercel.app." } },
    });
    expect(result).toEqual({ github: "juandelacruz", recordType: "CNAME" });
  });

  it("returns null when owner.github is missing", () => {
    expect(parseOwner({ records: { A: { value: "1.2.3.4" } } })).toBeNull();
  });

  it("returns null recordType when records is absent", () => {
    expect(parseOwner({ owner: { github: "juan" } })).toEqual({
      github: "juan",
      recordType: null,
    });
  });
});

describe("fetchOwnerInfo", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));

  it("returns parsed owner on success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        owner: { github: "juan" },
        records: { CNAME: { value: "x.vercel.app." } },
      }),
    } as Response);
    expect(await fetchOwnerInfo("juan")).toEqual({
      github: "juan",
      recordType: "CNAME",
    });
  });

  it("returns null on 404", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    expect(await fetchOwnerInfo("ghost")).toBeNull();
  });

  it("returns null on fetch failure", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network error"));
    expect(await fetchOwnerInfo("juan")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter status test -- owner`
Expected: FAIL — cannot resolve `../../src/lib/owner`.

- [ ] **Step 3: Implement the helper**

Create `tools/status/src/lib/owner.ts`:

```ts
// Fetches PUBLIC owner info from the domains registry. Never reads owner.email.
export interface OwnerInfo {
  github: string;
  recordType: string | null;
}

interface RegistryRecord {
  owner?: { github?: string };
  records?: Record<string, unknown>;
}

const RAW_BASE =
  "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains";

export function parseOwner(json: unknown): OwnerInfo | null {
  const data = (json ?? {}) as RegistryRecord;
  const github = data.owner?.github;
  if (typeof github !== "string" || github.length === 0) return null;
  const records = data.records;
  const recordType =
    records && typeof records === "object"
      ? (Object.keys(records)[0] ?? null)
      : null;
  return { github, recordType };
}

export async function fetchOwnerInfo(
  subdomain: string
): Promise<OwnerInfo | null> {
  try {
    const res = await fetch(`${RAW_BASE}/${subdomain}.json`, {
      headers: { "User-Agent": "is-pinoy.dev status worker" },
    });
    if (!res.ok) return null;
    return parseOwner(await res.json());
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter status test -- owner`
Expected: PASS — all `parseOwner` and `fetchOwnerInfo` tests green.

- [ ] **Step 5: Commit**

```bash
git add tools/status/src/lib/owner.ts tools/status/worker/tests/owner.test.ts
git commit -m "feat(status): add public owner-info fetch helper"
```

---

### Task 6: SSL badge component

**Files:**
- Modify: `tools/status/src/components/status-badge.tsx`

- [ ] **Step 1: Add the SSL config and `SslBadge`**

In `tools/status/src/components/status-badge.tsx`, update the import on line 1 to include `SslStatus`:

```ts
import type { DnsStatus, HttpStatus, OverallStatus, SslStatus } from "~/types";
```

Add this config object after `HTTP_CONFIG` (after line 82):

```ts
const SSL_CONFIG: Record<SslStatus, Config> = {
  valid: {
    label: "VALID",
    dot: "bg-green-500",
    badge: "bg-green-500/10 border border-green-500/40 text-green-400",
    pulse: true,
  },
  expiring: {
    label: "EXPIRING",
    dot: "bg-primary",
    badge: "bg-primary/10 border border-primary/40 text-primary",
    blink: true,
  },
  expired: {
    label: "EXPIRED",
    dot: "bg-red-500",
    badge: "bg-red-500/10 border border-red-500/40 text-red-400",
  },
  unknown: {
    label: "—",
    dot: "bg-muted-foreground/40",
    badge: "bg-muted/20 border border-border text-muted-foreground",
  },
};
```

Add this exported component at the end of the file:

```ts
export function SslBadge({ status }: { status: SslStatus | null }) {
  return <Badge {...SSL_CONFIG[status ?? "unknown"]} />;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter status typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tools/status/src/components/status-badge.tsx
git commit -m "feat(status): add SSL status badge"
```

---

### Task 7: Subdomain details page

**Files:**
- Create: `tools/status/src/routes/subdomain.tsx`
- Modify: `tools/status/src/routes.ts`

- [ ] **Step 1: Register the route**

Replace the contents of `tools/status/src/routes.ts` with:

```ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route(":subdomain", "routes/subdomain.tsx"),
] satisfies RouteConfig;
```

- [ ] **Step 2: Create the details route**

Create `tools/status/src/routes/subdomain.tsx`:

```tsx
import { Link, useLoaderData } from "react-router";
import { NavBar } from "~/components/nav-bar";
import {
  DnsBadge,
  HttpBadge,
  StatusBadge,
  SslBadge,
} from "~/components/status-badge";
import { fetchOwnerInfo } from "~/lib/owner";
import type { Route } from "./+types/subdomain";
import type { SubdomainStatus } from "~/types";

export const meta: Route.MetaFunction = ({ params }) => [
  { title: `${params.subdomain}.is-pinoy.dev — Status` },
];

export async function loader({ params, context }: Route.LoaderArgs) {
  const subdomain = params.subdomain;
  const status = await context.cloudflare.env.STATUS_DB.prepare(
    "SELECT * FROM subdomain_status WHERE subdomain = ?"
  )
    .bind(subdomain)
    .first<SubdomainStatus>();

  if (!status) {
    throw new Response("Not Found", { status: 404 });
  }

  const owner = await fetchOwnerInfo(subdomain);
  return { status, owner };
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysUntil(iso: string | null): string {
  if (!iso) return "";
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d ago`;
  return `in ${days}d`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-pixel text-[8px] text-muted-foreground">{label}</span>
      <div className="font-mono text-xs text-foreground">{children}</div>
    </div>
  );
}

export default function SubdomainDetails() {
  const { status, owner } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="pt-20 px-6 pb-6 md:px-10 md:pb-10 max-w-3xl mx-auto">
        <Link
          to="/"
          className="font-pixel text-[8px] text-muted-foreground hover:text-primary"
        >
          ← BACK
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <h1 className="font-mono text-base md:text-lg text-foreground">
            {status.subdomain}.is-pinoy.dev
          </h1>
          <StatusBadge status={status.overall} />
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-2 border-border p-6 shadow-[4px_4px_0px_#000]">
          <Field label="DNS">
            <DnsBadge status={status.dns_status} />
          </Field>
          <Field label="SITE">
            <HttpBadge status={status.http_status} />
          </Field>
          <Field label="SSL CERTIFICATE">
            <SslBadge status={status.ssl_status} />
          </Field>
          <Field label="CERTIFICATE EXPIRES">
            <span>
              {formatDate(status.ssl_expires_at)}{" "}
              <span className="text-muted-foreground">
                {daysUntil(status.ssl_expires_at)}
              </span>
            </span>
            <div className="mt-1 font-pixel text-[7px] text-muted-foreground">
              {status.ssl_issuer ? `${status.ssl_issuer} · ` : ""}VIA CT LOGS
            </div>
          </Field>
          <Field label="SINCE">{formatDate(status.since)}</Field>
          <Field label="LAST CHECKED">{formatDate(status.last_checked)}</Field>
        </div>

        {owner && (
          <div className="mt-6 flex items-center gap-4 border-2 border-border p-6 shadow-[4px_4px_0px_#000]">
            <img
              src={`https://github.com/${owner.github}.png?size=64`}
              alt={owner.github}
              width={48}
              height={48}
              className="shrink-0 border-2 border-primary [image-rendering:pixelated]"
            />
            <div className="flex flex-col gap-2">
              <a
                href={`https://github.com/${owner.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-foreground hover:text-primary"
              >
                @{owner.github}
              </a>
              {owner.recordType && (
                <span className="font-pixel text-[8px] text-muted-foreground">
                  {owner.recordType} RECORD
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="pt-20 px-6 pb-6 md:px-10 md:pb-10 max-w-3xl mx-auto">
        <Link
          to="/"
          className="font-pixel text-[8px] text-muted-foreground hover:text-primary"
        >
          ← BACK
        </Link>
        <p className="mt-8 font-pixel text-[10px] text-muted-foreground">
          SUBDOMAIN NOT FOUND — NO STATUS DATA.
        </p>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck (regenerates route types)**

Run: `pnpm --filter status typecheck`
Expected: PASS — `react-router typegen` generates `./+types/subdomain`, then `tsc` exits 0.

- [ ] **Step 4: Commit**

```bash
git add tools/status/src/routes/subdomain.tsx tools/status/src/routes.ts
git commit -m "feat(status): add subdomain details page"
```

---

### Task 8: Link index rows + add SSL column

**Files:**
- Modify: `tools/status/src/routes/_index.tsx`

- [ ] **Step 1: Import `SslBadge` and `Link`**

In `tools/status/src/routes/_index.tsx`, update line 1 and line 3:

```ts
import { Link, useLoaderData } from "react-router";
```

```ts
import { DnsBadge, HttpBadge, StatusBadge, SslBadge } from "~/components/status-badge";
```

- [ ] **Step 2: Add the SSL column header**

In the `<thead>` row, add an `SSL` header cell between the `SITE` header (lines 113-115) and the `STATUS` header (line 116). Insert after the `SITE` `</th>`:

```tsx
                <th className="text-left p-4 text-muted-foreground font-normal">
                  SSL
                </th>
```

- [ ] **Step 3: Make the subdomain cell a link and add the SSL cell**

Replace the subdomain `<td>` (lines 133-135) with:

```tsx
                  <td className="p-4 font-mono text-xs">
                    <Link
                      to={`/${s.subdomain}`}
                      className="text-foreground hover:text-primary"
                    >
                      {s.subdomain}.is-pinoy.dev
                    </Link>
                  </td>
```

Add this SSL cell immediately after the SITE cell (after the `HttpBadge` `</td>` on line 141):

```tsx
                  <td className="p-4">
                    <SslBadge status={s.ssl_status} />
                  </td>
```

- [ ] **Step 4: Typecheck and run tests**

Run: `pnpm --filter status typecheck && pnpm --filter status test`
Expected: PASS — typecheck clean, all worker tests green.

- [ ] **Step 5: Build to confirm the app compiles**

Run: `pnpm --filter status build`
Expected: `react-router build` completes without errors.

- [ ] **Step 6: Commit**

```bash
git add tools/status/src/routes/_index.tsx
git commit -m "feat(status): link rows to details page and show SSL column"
```

---

## Manual Verification (after all tasks)

1. Apply the migration locally:
   `cd tools/status && pnpm exec wrangler d1 migrations apply status-db --local -c worker/wrangler.toml`
2. Run `pnpm --filter status dev`, trigger a refresh (the `↺ REFRESH` button or `POST /api/refresh`).
3. Confirm the index table shows an SSL column with badges.
4. Click a subdomain row → details page renders DNS/SITE/SSL/expiry/owner.
5. Visit `/does-not-exist` → friendly "SUBDOMAIN NOT FOUND" error page.
6. Confirm `owner.email` appears nowhere in the rendered HTML or network responses.

## Notes

- A Changeset is required for `@is-pinoy-dev/status` (it gains `SslStatus`, `SslResult`, `checkSsl`, and extended interfaces) — add a `minor` bump in a final step before opening the PR. `tools/status` is private (not published) so it needs no changeset itself.
- The production deploy workflow (`.github/workflows/deploy-status.yml`) already runs `wrangler d1 migrations apply status-db --remote`, so migration `0002` ships automatically on merge.
