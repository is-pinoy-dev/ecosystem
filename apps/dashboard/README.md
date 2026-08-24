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

The read model is backed by **Cloudflare D1** (serverless SQLite), reached over
the D1 HTTP API — no Worker required, so it runs the same on Vercel as it does
locally. Without the D1 env vars the dashboard falls back to reading the repo
via the GitHub API (slower, rate-limited, no timestamps or sync status).

### Setup

1. Create the database and note its `database_id`:
   `pnpm dlx wrangler d1 create dashboard-db`
2. Set `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, and a `D1:Edit`
   `CLOUDFLARE_D1_API_TOKEN` (all three are required for the DB path to activate).
3. Apply the schema: `pnpm --filter dashboard db:migrate`
   (or `db:push` during development).
4. Set `REGISTRY_SYNC_SECRET` (e.g. `openssl rand -hex 32`) in the dashboard
   deployment and in the domains repo's Actions secrets.
5. Confirm the credentials work: `pnpm --filter dashboard db:check`.

### Troubleshooting

> `[domains] registry database unavailable, serving from GitHub instead`
> `Error: D1 query failed: Authentication error`

The dashboard is up and correct — git is the source of truth and the listing
fell back to reading the repo — but the read model is not being used, so sync
status, registration dates, showcase screenshots and saved settings are all
missing until it is fixed.

Cloudflare says the same three words, _Authentication error_, for every cause
of a refused request, so start by asking it narrower questions:

```bash
pnpm --filter dashboard db:check
```

It checks the token, then the token's D1 access to `CLOUDFLARE_ACCOUNT_ID`,
then whether `CLOUDFLARE_D1_DATABASE_ID` names a database that account owns,
then a real query — and the first step that fails names the variable to fix.
It reads `.env.local` when run locally; against a deployment, export the same
three variables the deployment sets and run it with those.

The usual causes, in the order they turn up:

- **The token was rotated or revoked** and only some of the places that store
  it were updated. It lives in three: the Vercel project, the
  `Production – is-pinoy-dev-dashboard` GitHub Environment (which
  `.github/workflows/migrate-dashboard-db.yml` reads), and each developer's
  `.env.local`.
- **The token lacks `Account → D1 → Edit`**, or was issued for a different
  Cloudflare account than `CLOUDFLARE_ACCOUNT_ID` names.
- **The stored value has whitespace or quotes around it** — a newline from a
  `cat`-ed file, or the quotes from a `KEY="value"` line pasted into a form.
  The app strips these when reading (`lib/db/env.ts`) and says so in the log,
  but `drizzle-kit` and `wrangler` read the raw value, so fix it at the source.
- **`CLOUDFLARE_ACCOUNT_ID` or `CLOUDFLARE_D1_DATABASE_ID` is wrong.** A
  mistyped identifier comes back as an authentication failure too, rather
  than as a 404. The app warns at startup when either is the wrong shape.

While the credentials are refused, the client stops calling Cloudflare for 30
seconds at a time rather than spending a failed round trip on every render, and
logs the reason once per cool-off instead of once per query. A corrected value
takes effect on its own; no redeploy is needed to clear it.

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
(`TZ=UTC git log --format=%cd --date=format-local:%Y-%m-%dT%H:%M:%SZ --
subdomains/<name>.json` — last line is the first commit, first line the
latest). When provided they become the row's registration and last-change
dates — including retroactively, so rows from an earlier backfill without dates
are corrected on the next sync. Without them, insert time and `syncedAt` are
used.

Two details of that command matter. The date is forced to UTC with a literal
`Z` because `createdAt`/`updatedAt` are validated with `z.iso.datetime()`,
which rejects a numeric offset — `%cI` produces `+08:00` and fails the whole
payload with a 400. And there is deliberately no `--follow`: a subdomain file
is usually created by copying a neighbour, and git's rename detection scores
that as a rename, so `--follow` dates `bosquejun.json` from `mee.json` and
reports a registration date from before the subdomain existed. Rows are keyed
by subdomain name, so even a real rename is a new row rather than a
continuation.

The handler reconciles the table against the snapshot (upsert + delete +
`updated_at` bumped only when a record's content actually changed), so
duplicate or replayed deliveries are idempotent. Because it is a full
snapshot, a lost delivery heals itself on the next sync — and a manual
backfill is just re-running the same POST.

This POST is what keeps the dashboard's list current, and nothing else does.
It lives in the domains repo's `.github/workflows/sync.yml`, which builds
`snapshot.json` with `scripts/build-snapshot.sh` and posts it after the
Cloudflare sync step. Two things there are load-bearing:

- the sync job checks out with `fetch-depth: 0`, since a shallow clone has no
  history to date the records from;
- the POST runs under `if: always()` and reports `status: failed` when the
  Cloudflare sync failed, so a bad run marks the rows rather than leaving the
  read model silently untouched.

The step fails the job when `REGISTRY_SYNC_SECRET` is unset or the endpoint
rejects the snapshot. That is deliberate: while this POST was missing entirely,
the dashboard served a frozen snapshot for weeks — subdomains registered since
never appeared, and one deleted from the registry kept being listed — with
nothing anywhere reporting a problem. A red sync run is the cheaper failure.

## Automated showcase screenshots

Screenshot metadata is stored on the existing `subdomains` D1 row. After a
synced registration is inserted, becomes active, or changes target records,
the registry event schedules a bounded enqueue call after the response has
completed. Screenshot generation never runs in the dashboard request.

The dedicated Cloudflare Worker under `tools/screenshots` owns Browser Run,
Queue, D1, and R2 bindings. Configure these server-only Vercel variables:

```text
SCREENSHOT_WORKER_URL=https://screenshots-api.is-pinoy.dev
SCREENSHOT_WORKER_SECRET=<same secret as the Worker binding>
PORTFOLIO_SCREENSHOT_MANUAL_COOLDOWN_HOURS=24
```

Owners can use **Refresh preview** on `/domains`. The action verifies the
Auth.js GitHub login against `ownerGithub`, applies the cooldown, and sends only
the portfolio ID and reason to the Worker. See
[`tools/screenshots/README.md`](../../tools/screenshots/README.md) for
Cloudflare provisioning and deployment.
