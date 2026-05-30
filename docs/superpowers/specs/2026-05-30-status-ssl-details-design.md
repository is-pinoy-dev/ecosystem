# Status SSL Checks + Subdomain Details Page — Design

**Date:** 2026-05-30
**Status:** Approved
**Scope:** `tools/status` (worker + frontend), `packages/status`

## Goal

Add SSL certificate checking (validity + expiry) to the subdomain status worker, and a per-subdomain details page that surfaces DNS, HTTP, SSL, and public owner info.

## Background

`tools/status` is a React Router 7 app served by a Cloudflare Worker. The worker runs `runChecks()` on a cron schedule and on manual `/api/refresh`, performing a DNS check (DoH) and an HTTP check (HEAD) per subdomain via the `@is-pinoy-dev/status` package, then upserts one row per subdomain into the D1 table `subdomain_status`. The frontend is a single filterable index route. `/api/statuses` exposes the rows.

## Key Constraint: SSL data sourcing

Cloudflare Workers' `fetch()` does **not** expose the TLS certificate of outbound requests, so cert expiry cannot be read directly from a `fetch`. Chosen approach is a hybrid:

- **Validity** is derived from the existing HTTPS reachability. If the `https://` HEAD request succeeds, the TLS handshake passed and the served certificate is valid *at check time*.
- **Expiry + issuer** come from Certificate Transparency logs via crt.sh (`https://crt.sh/?q=<fqdn>&output=json`), reading the most recent `not_after`. Keyless, free, no rate-limit key required.

Caveat: CT logs show *issued* certs, not necessarily the served one. Since these subdomains are CNAMEs to platforms (Vercel/Netlify/GitHub Pages) that auto-renew and serve the latest issued cert, the most-recent `not_after` matches reality in practice. The UI labels the source ("via CT logs") to stay honest.

Rejected alternatives: a TLS-inspection API (accurate but needs a key/rate limit — overkill for a free status board); reachability-only with no expiry (doesn't meet the "expiry" ask).

## Components

### 1. SSL checker — `packages/status/src/checker.ts`

New function:

```ts
export type SslStatus = "valid" | "expiring" | "expired" | "unknown";

export interface SslResult {
  status: SslStatus;
  expiresAt: string | null; // ISO date
  issuer: string | null;
}

export async function checkSsl(fqdn: string, httpReachable: boolean): Promise<SslResult>;
```

Behavior:
- If `httpReachable` is false → no live TLS, return `{ status: "unknown", expiresAt: null, issuer: null }` (we can't assert validity).
- Otherwise query crt.sh with a timeout (~4s) and `AbortController`.
- Parse the entry with the latest `not_after`. Compute days remaining:
  - past `not_after` → `"expired"`
  - < 14 days → `"expiring"`
  - else → `"valid"`
- `issuer` from the CT record's `issuer_name`.
- Any fetch/parse failure → `{ status: "unknown", expiresAt: null, issuer: null }`. Never throws.

### 2. Types — `packages/status/src/types.ts`

Add `SslStatus` and extend the check/status interfaces with `ssl_status`, `ssl_expires_at`, `ssl_issuer`, `ssl_checked_at` (all nullable).

### 3. Data model — `tools/status/worker/migrations/0002_add_ssl.sql`

```sql
ALTER TABLE subdomain_status ADD COLUMN ssl_status TEXT;
ALTER TABLE subdomain_status ADD COLUMN ssl_expires_at TEXT;
ALTER TABLE subdomain_status ADD COLUMN ssl_issuer TEXT;
ALTER TABLE subdomain_status ADD COLUMN ssl_checked_at TEXT;
```

Columns are nullable to represent "unknown" / not-yet-checked.

### 4. Check orchestration — `tools/status/worker/index.ts`

crt.sh is slow/flaky, so SSL is **not** queried every run. In `runChecks`, after the DNS+HTTP check, decide whether to refresh SSL:
- Re-check SSL if `ssl_checked_at` is null, older than ~12h, or the stored `ssl_status` is `expiring`/`expired`.
- Otherwise reuse the stored SSL values (read from the existing row).
- `checkSsl` receives whether the HTTP check found the site reachable.
- `upsertStatus` is extended to persist the four SSL columns and set `ssl_checked_at` when a fresh SSL check ran (otherwise carry forward the prior value).

`db.ts` `upsertStatus` and its `SubdomainCheck` input grow the SSL fields.

### 5. Details page — `tools/status/src/routes/$subdomain.tsx`

New dynamic route, registered in `tools/status/src/routes.ts` alongside the index.

Loader (runs in the worker):
- Query D1 for the single subdomain row. If not found → throw a 404 response.
- Fetch the registry JSON from the `domains` repo for owner info, reusing the `github.ts` fetch pattern. Read **only** `owner.github` and the record type/provider. **Never read or render `owner.email`.** Degrade gracefully (owner card omitted) if the JSON is missing.

Renders, in retro pixel style:
- Header: `<subdomain>.is-pinoy.dev` + overall status badge; back link to index.
- DNS section: status badge only (`live` / `propagating` / `error`). **No resolved target value** — keeps the page health-focused, not a DNS-exposure tool.
- HTTP section: status badge.
- SSL section: validity badge, expiry date, days remaining, issuer, with a subtle "via CT logs" note.
- Owner card: GitHub avatar + handle, provider. No email.
- Timestamps: "since" + last checked.

### 6. Frontend touch-ups

- Index rows link to `/<subdomain>`.
- New **SSL badge** variant in `status-badge.tsx`: valid (green), expiring (gold blink), expired (red), unknown (muted).
- `/api/statuses` automatically includes the SSL columns (it is `SELECT *`); no new endpoint is added — the details loader queries D1 directly.

## Privacy

DNS records are public by nature (queryable via DoH; the `domains` repo is public), but the status page intentionally shows DNS *status* only, not the resolved target, to stay health-focused. The one genuinely sensitive field, `owner.email`, is never read or rendered anywhere.

## Error Handling

- crt.sh failure/timeout → SSL `unknown`; prior stored value retained when present.
- Details page: subdomain not in D1 → 404 with a friendly retro message and a back link.
- Missing registry JSON → owner card omitted; rest of the page still renders.
- SSL check never throws; it cannot break the DNS/HTTP pipeline.

## Testing

- `checkSsl` unit tests (mocked crt.sh fetch): valid, expiring (<14d), expired, unknown (timeout/non-OK/unreachable).
- `upsertStatus` persists SSL columns and carries forward prior values when SSL is skipped.
- Migration `0002` applies cleanly on top of `0001`.
- Details loader: found, not-found (404), missing-registry-JSON fallback.

## Out of Scope (future)

- Historical uptime / SSL timeline (would need a `status_history` table).
- True served-cert inspection via a TLS API.
