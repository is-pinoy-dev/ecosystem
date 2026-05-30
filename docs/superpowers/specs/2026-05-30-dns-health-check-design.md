# DNS Health Check Status Page — Design Spec

**Date:** 2026-05-30
**Feature:** `status.is-pinoy.dev` — real-time subdomain health monitoring

## Problem

After a subdomain PR is merged and the Cloudflare DNS record is added via the registry CLI, there is a window where:
- DNS hasn't propagated yet (subdomain doesn't resolve publicly)
- Or DNS has propagated but the portfolio behind it isn't responding

Users have no visibility into which state they're in.

## Solution

A dedicated status page at `status.is-pinoy.dev` that lists all registered subdomains with their current DNS and HTTP health, checked every 5 minutes by a Cloudflare Worker cron trigger and persisted to D1.

## Architecture

### New app: `tools/status/`

Follows the same pattern as `tools/site-audit/` — React Router 7 + Vite frontend served by a Cloudflare Worker.

```
tools/status/
├── worker/
│   ├── index.ts         — cron handler + fetch handler (serves the app)
│   ├── checker.ts       — DNS (DoH) + HTTP health check logic
│   ├── db.ts            — D1 queries (upsert status, read all)
│   └── github.ts        — fetch subdomain list from is-pinoy-dev/domains repo
├── src/
│   ├── app/
│   │   └── routes/
│   │       └── _index.tsx  — status table page
│   └── components/
│       └── status-badge.tsx
├── wrangler.toml
└── package.json
```

### Data Flow

1. Cron fires every 5 minutes → Worker fetches subdomain list from GitHub (`is-pinoy-dev/domains`)
2. For each subdomain:
   - DNS check via Cloudflare DoH: query both `A` and `CNAME` types (3s timeout). Considered live if either returns a valid answer. NXDOMAIN on both → `propagating`. DoH request fails/times out → `error`.
   - HTTP check (only if DNS is live): `fetch("https://{sub}.is-pinoy.dev")` with 5s timeout
3. If status changed → upsert D1 row with new status + `since` timestamp
4. If status unchanged → update `last_checked` only (no `since` change)
5. Status page (`GET /`) reads all D1 rows, renders table

### D1 Schema

```sql
CREATE TABLE subdomain_status (
  subdomain     TEXT PRIMARY KEY,
  dns_status    TEXT NOT NULL,  -- 'live' | 'propagating' | 'error'
  http_status   TEXT NOT NULL,  -- 'up' | 'down' | 'unchecked'
  overall       TEXT NOT NULL,  -- 'operational' | 'degraded' | 'propagating'
  since         TEXT NOT NULL,  -- ISO timestamp of last state change
  last_checked  TEXT NOT NULL   -- ISO timestamp of last check attempt
);
```

### Overall Status Logic

| DNS Status | HTTP Status | Overall |
|------------|-------------|---------|
| propagating | unchecked | `propagating` |
| live | up | `operational` |
| live | down | `degraded` |
| error | unchecked | `degraded` |

## UI Design

Retro pixel-art aesthetic consistent with `apps/web` and the project design system.

- **Font:** Press Start 2P for headings and badges
- **Colors:** Gold `#F5C800` on dark background; zero `border-radius` everywhere
- **Borders:** Hard pixel borders with pixel-offset box shadows (`4px 4px 0px #000`)
- **Scanline overlay:** Same global CSS as `apps/web`
- **Components:** `@is-pinoy-dev/ui` — `Badge`, `Card`, `Table`

### Page Layout

```
[ IS-PINOY.DEV STATUS ]

X OPERATIONAL · Y DEGRADED · Z PROPAGATING

[search input]

| Subdomain              | DNS          | Site    | Status      | Since   |
|------------------------|--------------|---------|-------------|---------|
| foo.is-pinoy.dev       | ✅ Live      | ✅ Up   | OPERATIONAL | 2h ago  |
| bar.is-pinoy.dev       | ⏳ Propagating | —     | PROPAGATING | 14m ago |
| baz.is-pinoy.dev       | ✅ Live      | ❌ Down | DEGRADED    | 1h ago  |

LAST CHECKED: 3 MIN AGO
```

### Status Badges

- `OPERATIONAL` — green pixel badge
- `PROPAGATING` — gold pixel badge
- `DEGRADED` — red pixel badge

All badges: no border-radius, hard pixel border, Press Start 2P font.

## Error Handling

- **GitHub fetch fails** — cron run skipped entirely; existing D1 data preserved
- **Empty/malformed subdomain list** — guard clause prevents wiping D1 rows
- **DNS check timeout / DoH request failure** — `dns_status: 'error'`, overall `'degraded'`. Distinguished from `'propagating'` which means the DoH request succeeded but returned NXDOMAIN.
- **HTTP check timeout** — 5s timeout, `http_status: 'down'`
- **HTTP check skipped** — when `dns_status` is `'propagating'`, HTTP check is not attempted (`http_status: 'unchecked'`)
- **D1 write fails** — logged, non-fatal; stale data served
- **No D1 data yet** — status page shows empty state: `NO DATA YET — FIRST CHECK PENDING`

## Testing

- Unit tests in `worker/checker.test.ts` — mock DoH + HTTP responses, verify status derivation
- Unit tests in `worker/db.test.ts` — verify upsert logic and state-change detection
- Vitest, consistent with rest of monorepo

## Deployment

- `wrangler.toml`: cron trigger `"*/5 * * * *"`, route `status.is-pinoy.dev/*`
- D1 database binding: `STATUS_DB`
- Environment secrets: none required (GitHub domains repo is public; Cloudflare DoH is public)
