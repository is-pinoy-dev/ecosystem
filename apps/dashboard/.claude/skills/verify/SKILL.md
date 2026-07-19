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

The read model is **Cloudflare D1** over the HTTP API — there is no local
database to stand up. Point the app at a real D1 by setting all three env vars,
then apply the schema against it:

```bash
export CLOUDFLARE_ACCOUNT_ID=<account id>
export CLOUDFLARE_D1_DATABASE_ID=<database id>
export CLOUDFLARE_D1_API_TOKEN=<D1:Edit token>
pnpm --filter dashboard db:migrate
```

Use a throwaway database so test writes stay out of production:
`pnpm dlx wrangler d1 create dashboard-verify` and pass its id.

Start the server with those three vars plus `REGISTRY_SYNC_SECRET=<secret>`,
then drive `POST /api/registry/events` (`Authorization: Bearer <secret>`, full
snapshot payload — see README contract). Checks worth repeating: 401 without/
with wrong secret, 400 on bad JSON/payload, replayed snapshot → all counts 0,
changed records → `updated:1` and `updated_at` = payload `updatedAt` (or
`syncedAt` when absent), missing domain → deleted, payload `createdAt`/
`updatedAt` retroactively heal rows inserted without git dates. When the D1 env
vars are unset the pages fall back to the GitHub fetch and the events endpoint
refuses everything.

## Gotchas

- The registry fetch (`lib/domains.ts`) hits `api.github.com` for
  `is-pinoy-dev/domains`. Remote sandbox proxies return 403 for repos outside
  session scope, so counts show 0 and the empty state renders — that's the
  environment, not a bug.
- Screenshots: `playwright-core` + `executablePath: "/opt/pw-browsers/chromium"`
  (pre-installed browser; don't run `playwright install`). Dark theme:
  `localStorage.setItem("theme", "dark")` then reload.
