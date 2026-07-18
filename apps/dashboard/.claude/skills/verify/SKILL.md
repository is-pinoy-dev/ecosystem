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

## Gotchas

- The registry fetch (`lib/domains.ts`) hits `api.github.com` for
  `is-pinoy-dev/domains`. Remote sandbox proxies return 403 for repos outside
  session scope, so counts show 0 and the empty state renders — that's the
  environment, not a bug.
- Screenshots: `playwright-core` + `executablePath: "/opt/pw-browsers/chromium"`
  (pre-installed browser; don't run `playwright install`). Dark theme:
  `localStorage.setItem("theme", "dark")` then reload.
