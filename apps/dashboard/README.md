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
