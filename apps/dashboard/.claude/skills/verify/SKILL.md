---
name: verify
description: Build, run, and drive the dashboard app to verify changes end-to-end.
---

# Verifying the dashboard app

```bash
pnpm install                       # from repo root
pnpm --filter dashboard build
AUTH_SECRET="any-long-test-secret" AUTH_GITHUB_ID=dummy AUTH_GITHUB_SECRET=dummy \
  AUTH_TRUST_HOST=true pnpm --filter dashboard start   # port 3001
```

## Drive it

- Unauthenticated `GET /`, `/domains`, `/account` → 307 to `/login`.
- `GET /api/auth/providers` → JSON with the `github` provider.
- Sign-in handoff without real credentials: `GET /api/auth/csrf` (keep the
  cookie jar), then `POST /api/auth/signin/github` with `csrfToken` → 302 to
  `https://github.com/login/oauth/authorize?...`.
- Protected pages: mint a session cookie with the server's own secret — run
  from `apps/dashboard/` so `next-auth` resolves:

  ```js
  import { encode } from "next-auth/jwt"
  const jwt = await encode({
    token: { name: "T", email: "t@t", picture: null, sub: "x", login: "some-gh-user" },
    secret: "any-long-test-secret", salt: "authjs.session-token", maxAge: 3600,
  })
  ```

  Send it as `Cookie: authjs.session-token=<jwt>` — `/`, `/domains`,
  `/account` render; `/login` redirects to `/`.

## Database-backed registry (optional)

Postgres 16 is preinstalled at `/usr/lib/postgresql/16/bin` but must run as
the `postgres` user (root is refused), and the data dir's parent chain needs
`o+x` so that user can traverse into the scratchpad:

```bash
chmod o+x <each scratchpad path component>
mkdir -p $SCRATCH/pgdata $SCRATCH/pgsock && chown postgres:postgres $SCRATCH/pgdata $SCRATCH/pgsock
su postgres -s /bin/bash -c "$PGBIN/initdb -D $SCRATCH/pgdata -U dashuser --auth=trust"
touch $SCRATCH/pg.log && chown postgres:postgres $SCRATCH/pg.log
su postgres -s /bin/bash -c "$PGBIN/pg_ctl -D $SCRATCH/pgdata -o '-p 5433 -k $SCRATCH/pgsock -c listen_addresses=127.0.0.1' -l $SCRATCH/pg.log start"
createdb -h 127.0.0.1 -p 5433 -U dashuser dashboard
DATABASE_URL="postgres://dashuser@127.0.0.1:5433/dashboard" pnpm db:migrate
```

Start the server with `DATABASE_URL` and `REGISTRY_SYNC_SECRET=<secret>`, then
drive `POST /api/registry/events` (`Authorization: Bearer <secret>`, full
snapshot payload — see README contract). Checks worth repeating: 401 without/
with wrong secret, 400 on bad JSON/payload, replayed snapshot → all counts 0,
changed records → `updated:1` and `updated_at` = payload `syncedAt`, missing
domain → deleted. Without `DATABASE_URL` the pages fall back to the GitHub
fetch and the events endpoint refuses everything.

## Gotchas

- The registry fetch (`lib/domains.ts`) hits `api.github.com` for
  `is-pinoy-dev/domains`. Remote sandbox proxies return 403 for repos outside
  session scope, so counts show 0 and the empty state renders — that's the
  environment, not a bug.
- Screenshots: `playwright-core` + `executablePath: "/opt/pw-browsers/chromium"`
  (pre-installed browser; don't run `playwright install`). Dark theme:
  `localStorage.setItem("theme", "dark")` then reload.
