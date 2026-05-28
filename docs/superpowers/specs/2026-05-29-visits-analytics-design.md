# Visits Analytics — Design Spec

**Date:** 2026-05-29
**Branch:** feat/visits-analytics
**Status:** Approved

## Overview

Replace the existing passthrough Analytics Engine Worker with a pure scheduled Cloudflare Worker. Every night the Worker queries Cloudflare's Analytics GraphQL API for the previous day's traffic across all `is-pinoy.dev` subdomains and persists the snapshots into a D1 database. This preserves visit counts permanently before Cloudflare's rolling data window expires.

## Architecture

```
Cron trigger (0 1 * * * — 1am UTC)
  → fetchSubdomains()   — GitHub API: list active subdomain names
  → fetchAnalytics()    — Cloudflare GraphQL: yesterday's httpRequestsAdaptiveGroups
  → persistSnapshots()  — D1 batch upsert: totals + per-country
```

The existing `tools/analytics/worker/index.ts` fetch handler and the Analytics Engine binding are removed entirely. Cloudflare's native HTTP log collection is the data source; no custom request interception is needed.

## Package Location

`tools/analytics/` — existing package. No new package created.

## wrangler.toml Changes

- **Remove:** `[[routes]]` (no HTTP handler)
- **Remove:** `[[analytics_engine_datasets]]` (Analytics Engine no longer used)
- **Add:** `[triggers] crons = ["0 1 * * *"]`
- **Add:** `[[d1_databases]]` binding (`ANALYTICS_DB`)

## Secrets

Stored via `wrangler secret put`, never in `wrangler.toml`:

| Secret | Purpose |
|---|---|
| `CF_API_TOKEN` | Cloudflare API token — Analytics Read permission |
| `CF_ACCOUNT_ID` | Cloudflare account ID (GraphQL endpoint) |
| `CF_ZONE_ID` | Zone ID for `is-pinoy.dev` |

## D1 Schema

Two tables — one per dimension type. New dimensions (e.g. HTTP status, bot traffic) are added as new tables with migrations, keeping queries clean and typed.

```sql
CREATE TABLE IF NOT EXISTS visits_daily (
  subdomain TEXT    NOT NULL,
  date      TEXT    NOT NULL,  -- YYYY-MM-DD
  visits    INTEGER NOT NULL,
  PRIMARY KEY (subdomain, date)
);

CREATE TABLE IF NOT EXISTS visits_daily_by_country (
  subdomain TEXT    NOT NULL,
  date      TEXT    NOT NULL,  -- YYYY-MM-DD
  country   TEXT    NOT NULL,  -- ISO 3166-1 alpha-2, e.g. "PH"
  visits    INTEGER NOT NULL,
  PRIMARY KEY (subdomain, date, country)
);
```

Upserts use `INSERT OR REPLACE` — re-running the cron for the same date is fully idempotent.

All-time total query: `SELECT SUM(visits) FROM visits_daily WHERE subdomain = ?`

## Worker Code Structure

Single file `worker/index.ts` with three functions:

### `fetchSubdomains()`
- Calls `https://api.github.com/repos/is-pinoy-dev/domains/contents/subdomains`
- Lists all `.json` files, strips extension → array of subdomain names
- Used to validate/filter GraphQL results (only store known subdomains)

### `fetchAnalytics(yesterday: string)`
- Single GraphQL query to `https://api.cloudflare.com/client/v4/graphql`
- Dataset: `httpRequestsAdaptiveGroups`
- Dimensions: `clientRequestHTTPHost`, `clientCountryName`
- Filter: `zoneTag = CF_ZONE_ID`, `date = yesterday`
- Aggregation: `sum { requests }`
- Returns rows: `{ host, country, requests }[]`

### `persistSnapshots(db, subdomains, rows, date)`
- Groups rows by hostname → subdomain
- Filters to only subdomains present in the GitHub list
- Computes per-subdomain totals
- Builds two batches: `visits_daily` inserts + `visits_daily_by_country` inserts
- Executes via `db.batch()` in a single round-trip

### `scheduled()` handler
```
1. Compute yesterday = toISODateString(now - 1 day)
2. subdomains = await fetchSubdomains()
3. rows = await fetchAnalytics(yesterday)
4. await persistSnapshots(env.ANALYTICS_DB, subdomains, rows, yesterday)
```

## Error Handling

- GitHub fetch failure → throw (Worker logs error, cron retries per Cloudflare default behavior)
- GraphQL failure → throw (same)
- D1 batch failure → throw (idempotent, safe to retry)
- Empty GraphQL result (zero traffic day) → persist nothing, no error
- Empty subdomain list from GitHub (API failure returns `[]`) → throw early, skip persistence (avoids wiping valid data with an empty allowlist)

## What Is Removed

- `fetch()` handler in `worker/index.ts`
- `[[routes]]` in `wrangler.toml`
- `[[analytics_engine_datasets]]` binding
- `ANALYTICS: AnalyticsEngineDataset` in `Env` interface
