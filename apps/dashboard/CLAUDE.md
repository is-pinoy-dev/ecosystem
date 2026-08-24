# CLAUDE.md — apps/dashboard

Guidance for working in the `dashboard` app specifically. See the root
`CLAUDE.md` for monorepo-wide commands, the Banig Grid v2 design system, and
component/styling rules — all of it applies here.

## What this is

Sign-in-with-GitHub dashboard where subdomain owners see and manage the
records registered to them in the `is-pinoy-dev/domains` registry. Auth.js v5
(`next-auth@beta`) with the GitHub provider and stateless JWT sessions — no
session database. Ownership is matched by GitHub username against each
record's `owner.github`.

## Commands

```bash
pnpm --filter dashboard dev         # http://localhost:3001
pnpm --filter dashboard build
pnpm --filter dashboard typecheck
pnpm --filter dashboard lint
pnpm --filter dashboard test        # vitest run
pnpm --filter dashboard db:generate # drizzle-kit generate
pnpm --filter dashboard db:push     # drizzle-kit push (dev)
pnpm --filter dashboard db:migrate  # drizzle-kit migrate (apply schema)
pnpm --filter dashboard db:check    # diagnose the D1 credentials (read-only)
```

Setup requires a GitHub OAuth app (callback
`http://localhost:3001/api/auth/callback/github` locally) and `.env.local`
copied from `.env.example` — see that file for every variable and what each
one unlocks. In particular:

- `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` — required to sign in.
- `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_D1_DATABASE_ID` / `CLOUDFLARE_D1_API_TOKEN`
  — all three or none. With them, registry reads come from the D1 read model;
  without them, the dashboard falls back to the slower GitHub-API path. When
  they are set but refused, the log line is
  `[domains] registry database unavailable` — run `db:check`, which names the
  offending variable, and see README.md's Troubleshooting section.
- `REGISTRY_SYNC_SECRET` — authenticates the domains-repo sync workflow's
  `POST /api/registry/events` snapshot that keeps D1 current. This POST is the
  *only* thing that refreshes the read model: without it the dashboard serves a
  frozen list, and the fallback to GitHub never kicks in because D1 is
  reachable and simply stale. It must be set on the domains repo too.
- `DASHBOARD_URL` — repo variable on the domains repo pointing at this
  deployment; defaults to `https://dashboard.is-pinoy.dev`.

## Architecture

- Git (`is-pinoy-dev/domains`) is always the source of truth for DNS. The D1
  database is a **read model** — a rebuildable projection plus last-sync
  status — never the authority. A failed D1 write must never affect DNS.
- `POST /api/registry/events` reconciles the full registry snapshot
  (upsert + delete, `updated_at` bumped only on real content change) — it's
  idempotent, so replayed or lost deliveries self-heal on the next sync.
- Screenshot generation for the showcase runs out-of-band in the
  `tools/screenshots` Worker (Browser Rendering + Queue + D1 + R2), triggered
  by a bounded enqueue call after the registry-event response completes —
  never inline in a dashboard request. See `tools/screenshots/README.md`.
- Structure: `app/(dashboard)` (authenticated routes), `app/login`,
  `app/api`, `lib/db` (Drizzle schema + D1 HTTP client), `lib/screenshots`,
  `drizzle/` (generated migrations — don't hand-edit).

## Key notes

- `db:push` is for local iteration only; real schema changes go through
  `db:generate` + a committed migration, applied with `db:migrate`.
- A local `verify` skill exists at `.claude/skills/verify` scoped to this app
  — prefer it over the repo-root `run`/verify flow when testing dashboard
  changes end to end.
- Feature flags live in `lib/flags.ts` / `lib/flags-server.ts`, server-only;
  targeting rules live in the Vercel dashboard, not this repo.
