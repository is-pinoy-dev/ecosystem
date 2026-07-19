# Dashboard DB layer: Postgres → Cloudflare D1 (over HTTP)

**Date:** 2026-07-19
**Status:** Approved (design)
**Scope:** `apps/dashboard` data layer only. No hosting change.

## Problem

The dashboard is a read-model of the `is-pinoy-dev/domains` registry. Its DB
layer is written for Postgres (`drizzle-orm/postgres-js` + the `postgres`
driver, `pgTable`/`jsonb`/timezone timestamps, a Postgres migration). We want
to back it with **Cloudflare D1** (serverless SQLite) instead, while keeping
the app hosted on **Vercel** alongside `web` and `docs`.

## Constraints & key facts

- D1 is SQLite, not Postgres — schema, migrations, and driver must change.
- The app runs on Vercel, **not** Cloudflare Workers, so there is **no native
  D1 binding**. D1 is reached over its HTTP REST API.
- The D1 HTTP API has **no interactive transactions**. The sync-event write
  path currently uses an interactive transaction and must be reworked to an
  atomic **batch**.
- The GitHub-API fallback (no-database mode) stays unchanged.
- The sync-event HTTP contract (`POST /api/registry/events`) is unchanged.

## Approaches considered

1. **Stay on Vercel, reach D1 over HTTP (chosen).** Drizzle `sqlite-proxy`
   driver posting SQL to the D1 query endpoint. Keeps current hosting; forces
   the transaction→batch rewrite.
2. **Move dashboard to Cloudflare Workers/Pages** (`@opennextjs/cloudflare`).
   Native D1 binding + transactions, lowest latency, but re-platforms the app
   away from Vercel and diverges from the other apps. Rejected: out of scope.
3. **Keep Postgres on Neon.** Zero code change. Rejected: user wants D1.

## Design

### 1. Access & driver — `lib/db/index.ts`
Replace `postgres-js`/`postgres` with Drizzle **`sqlite-proxy`**. A fetch
client posts to:

```
POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query
Authorization: Bearer {D1_TOKEN}
body: { sql, params }
```

- Implement both the single-query callback and the **batch** callback
  `sqlite-proxy` needs for `db.batch()`.
- Map the D1 response shape (`result[0].results`) to the rows array drizzle
  expects; surface non-2xx / `success:false` responses as thrown errors.
- New env: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`,
  `CLOUDFLARE_D1_API_TOKEN`. `hasDatabase()` is true only when all three set.
  Remove `DATABASE_URL`.
- Drop the `postgres` dependency; keep `drizzle-orm`.

### 2. Schema — `lib/db/schema.ts`
- `pgTable` → `sqliteTable`; `text` columns unchanged.
- `jsonb records` → `text("records", { mode: "json" }).$type<Record<string, unknown>>()`
  (drizzle auto-serializes; JS shape identical).
- `sync_status` enum → `text("sync_status", { enum: SYNC_STATUSES })`.
- timezone `timestamp` → `integer(..., { mode: "timestamp_ms" })` — stored as
  epoch ms, returned as `Date`, so `.getTime()` comparisons keep working.
- `defaultNow()` → `$defaultFn(() => new Date())` (all writes go via drizzle).
- `owner_github` index retained (supported in sqlite-core).

### 3. Write path — `app/api/registry/events/route.ts`
Rework reconciliation to avoid interactive transactions:
1. `select()` all existing rows.
2. Compute insert/update/delete statements in JS — **semantics unchanged**
   (same content-changed and date-drift rules, same returned counts).
3. Commit atomically via `db.batch([...])`.

Extract the diff into a pure `reconcile(existing, incoming, syncedAt)`
function returning `{ statements, counts }`, so it is unit-testable without a
database and the route handler stays thin.

### 4. Migrations / DDL — `drizzle.config.ts`
- `dialect: "sqlite"`, `driver: "d1-http"`, credentials from the three env vars.
- Delete the Postgres migration + snapshot under `drizzle/`, regenerate SQLite
  DDL with `drizzle-kit generate`, apply with `drizzle-kit migrate` (d1-http).
- Update `db:*` scripts in `package.json` as needed.

### 5. Provisioning (first implementation step)
- Cloudflare API token with **D1 Edit** (user-created).
- `wrangler d1 create is-pinoy-dev-dashboard` → capture `database_id`.
- Set `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_D1_DATABASE_ID` in Vercel
  (identifiers). User sets `CLOUDFLARE_D1_API_TOKEN` (secret) via `vercel env add`.
- Update `.env.example`.

### 6. Unchanged
`lib/domains.ts` fallback and read path are untouched except `hasDatabase()`'s
check. Read path (`select ... order by name`) works identically on D1.

### 7. Docs
Update `README.md` "Database" section: Postgres → D1, new env vars, wrangler
provisioning steps.

## Testing
Add Vitest to `apps/dashboard` and unit-test the pure `reconcile()` function
(insert/update/delete classification, content-changed detection, date-drift
correction). No live-DB integration test in scope.

## Out of scope (YAGNI)
Hosting change / Workers move; changes to the sync-event contract or the
GitHub-API fallback; new heavyweight dependencies; multi-table schema changes.
