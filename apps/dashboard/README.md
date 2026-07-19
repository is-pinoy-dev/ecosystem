# dashboard

The is-pinoy.dev dashboard — sign in with GitHub to see the subdomains and DNS
records registered to your account in the
[is-pinoy-dev/domains](https://github.com/is-pinoy-dev/domains) registry.

## Stack

- Next.js App Router + React Server Components
- [Auth.js v5](https://authjs.dev) (`next-auth@beta`) with the GitHub provider
  and stateless JWT sessions — no database required
- `@is-pinoy-dev/ui` shadcn components with the shared Banig Grid design tokens

## Setup

1. Create a GitHub OAuth app at <https://github.com/settings/developers> with
   the callback URL `http://localhost:3001/api/auth/callback/github`
   (swap the origin in production).
2. Copy `.env.example` to `.env.local` and fill in `AUTH_SECRET`
   (`npx auth secret`), `AUTH_GITHUB_ID`, and `AUTH_GITHUB_SECRET`.
3. Run it:

```bash
pnpm --filter dashboard dev   # http://localhost:3001
```

Ownership is matched by GitHub username: after signing in, the dashboard lists
every registry record whose `owner.github` equals your login.

## Database (optional but recommended)

Git stays the source of truth: the merged JSON in
[is-pinoy-dev/domains](https://github.com/is-pinoy-dev/domains) is authoritative
and CI keeps syncing it to Cloudflare exactly as before. The database is a
**read model** — a projection of the repo plus the outcome of the last sync —
so it can always be rebuilt from the repo and a failed write never affects DNS.

Without `DATABASE_URL` the dashboard falls back to reading the repo via the
GitHub API (slower, rate-limited, no timestamps or sync status).

### Setup

1. Provision any Postgres (Neon, Supabase, self-hosted) and set `DATABASE_URL`.
2. Apply the schema: `pnpm --filter dashboard db:migrate`
   (or `db:push` during development).
3. Set `REGISTRY_SYNC_SECRET` (e.g. `openssl rand -hex 32`) in the dashboard
   deployment and in the domains repo's Actions secrets.

### Sync event contract

After each Cloudflare sync run, the domains-repo workflow POSTs the **full
registry snapshot** with per-domain results to the dashboard:

```
POST /api/registry/events
Authorization: Bearer $REGISTRY_SYNC_SECRET
Content-Type: application/json

{
  "syncedAt": "2026-07-18T10:00:00Z",
  "domains": [
    {
      "subdomain": "juan",
      "owner": { "github": "juandelacruz", "email": "juan@example.com" },
      "records": { "CNAME": "juandelacruz.github.io" },
      "status": "synced",          // "synced" | "failed" | "pending"
      "error": null,                // set when status is "failed"
      "createdAt": "2025-11-02T08:15:00Z",  // optional: first commit that added the file
      "updatedAt": "2026-03-19T14:02:00Z"   // optional: last commit touching the file
    }
  ]
}
```

`createdAt`/`updatedAt` are optional git-derived dates
(`git log --follow --format=%cI -- subdomains/<name>.json` — last line is the
first commit, first line the latest). When provided they become the row's
registration and last-change dates — including retroactively, so rows from an
earlier backfill without dates are corrected on the next sync. Without them,
insert time and `syncedAt` are used.

The handler reconciles the table against the snapshot (upsert + delete +
`updated_at` bumped only when a record's content actually changed), so
duplicate or replayed deliveries are idempotent. Because it is a full
snapshot, a lost delivery heals itself on the next sync — and a manual
backfill is just re-running the same POST.

Example workflow step for the domains repo, after the existing sync step:

```yaml
- name: Notify dashboard
  if: always()
  run: |
    curl -sf -X POST "$DASHBOARD_URL/api/registry/events" \
      -H "Authorization: Bearer ${{ secrets.REGISTRY_SYNC_SECRET }}" \
      -H "Content-Type: application/json" \
      --data @snapshot.json
  env:
    DASHBOARD_URL: https://dashboard.is-pinoy.dev
```

where `snapshot.json` is assembled from the `subdomains/*.json` files plus the
sync results of the run.
