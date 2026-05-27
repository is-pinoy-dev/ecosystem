# Cloudflare Worker — Site Audit Tool

**Date:** 2026-05-27
**Status:** Approved

## Overview

Deploy the existing `tools/site-audit` React Router 7 app as a Cloudflare Worker so that any subdomain owner can visit `{subdomain}.is-pinoy.dev/_tools/site-audit` and instantly see an SEO/OG audit of their site — no configuration required.

The Worker intercepts all requests matching `*.is-pinoy.dev/_tools/site-audit*` (and the apex `is-pinoy.dev/_tools/site-audit*`), serves the React Router SSR shell, and handles the `audit-proxy` fetch on the edge. The React app already uses `window.location.origin` as the audit target in production, so `john.is-pinoy.dev/_tools/site-audit` automatically audits `https://john.is-pinoy.dev` with no additional logic.

## New Files

### `tools/site-audit/worker/index.ts`

Worker entry point (~10 lines). Imports the React Router server build and delegates all requests to `createRequestHandler` from `@react-router/cloudflare`.

```ts
import { createRequestHandler } from "@react-router/cloudflare";
import * as build from "../build/server";

const handler = createRequestHandler(build);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return handler(request, { cloudflare: { env, ctx } });
  },
};
```

### `tools/site-audit/worker/wrangler.toml`

Registers two Cloudflare routes and binds the client build as static assets.

```toml
name = "site-audit"
main = "index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "../build/client"

[[routes]]
pattern = "is-pinoy.dev/_tools/site-audit*"
zone_name = "is-pinoy.dev"

[[routes]]
pattern = "*.is-pinoy.dev/_tools/site-audit*"
zone_name = "is-pinoy.dev"
```

## Changes to Existing Files

### `vite.config.ts`

Add `cloudflareDevProxy()` plugin (from `@react-router/dev/vite/cloudflare`) before the `reactRouter()` plugin. This enables Cloudflare bindings in local dev via `wrangler dev`.

### `src/routes/audit-proxy.tsx`

Replace `import.meta.env.DEV` SSRF bypass with `import.meta.env.MODE !== "development"`. In Workers, `import.meta.env.DEV` is always `false` — the change preserves SSRF protection in production while keeping local dev bypass working.

```ts
// before
if (!import.meta.env.DEV) { /* SSRF check */ }

// after
if (import.meta.env.MODE !== "development") { /* SSRF check */ }
```

### `src/routes.ts`

Move the audit-proxy route under the `/_tools/site-audit` prefix so the Worker intercepts it:

```ts
// before
route("/audit-proxy", "routes/audit-proxy.tsx"),

// after
route("/_tools/site-audit/audit-proxy", "routes/audit-proxy.tsx"),
```

### `src/routes/layout.tsx`

Update the fetch URL to match the new route:

```ts
// before
fetch(`/audit-proxy?url=${encodeURIComponent(target)}`, ...)

// after
fetch(`/_tools/site-audit/audit-proxy?url=${encodeURIComponent(target)}`, ...)
```

### `package.json`

- Add `@react-router/cloudflare` to `dependencies`
- Add `wrangler` to `devDependencies`
- Add `"deploy"` script: `react-router build && wrangler deploy -c worker/wrangler.toml`

## Data Flow

```
1. Browser → john.is-pinoy.dev/_tools/site-audit
2. Cloudflare route match: *.is-pinoy.dev/_tools/site-audit*
3. Worker → createRequestHandler → React Router SSR renders layout shell
4. HTML → browser, React hydrates
5. layout.tsx useEffect → fetch /_tools/site-audit/audit-proxy?url=https://john.is-pinoy.dev
   (window.location.origin = https://john.is-pinoy.dev)
6. Worker intercepts /_tools/site-audit/audit-proxy → audit-proxy.tsx loader runs on Cloudflare edge
7. Edge fetches https://john.is-pinoy.dev → parses HTML → returns to client
8. Client renders audit dashboard
```

**Important:** The client fetch for the audit proxy must be under the `/_tools/site-audit*` route pattern so the Worker intercepts it. The `/audit-proxy` route is moved to `/_tools/site-audit/audit-proxy` — this requires two small changes:

- `src/routes.ts`: change `route("/audit-proxy", ...)` → `route("/_tools/site-audit/audit-proxy", ...)`
- `src/routes/layout.tsx`: change the fetch URL from `/audit-proxy?url=...` → `/_tools/site-audit/audit-proxy?url=...`

Without this, the client-side fetch to `/audit-proxy` would hit the subdomain's actual site instead of the Worker.

## Error Handling

All existing error handling in `audit-proxy.tsx` is preserved:
- Missing `url` param → 400
- Invalid URL → 400
- Private/loopback IP → 400 (always enforced in Workers; `MODE !== "development"` fix ensures this)
- Fetch timeout (10s) → 502
- Response > 1MB → truncated

No new failure modes are introduced by the Worker layer. Cloudflare 500s are caught by the existing React error boundary.

## Local Development

```bash
# In tools/site-audit
wrangler dev -c worker/wrangler.toml
```

`cloudflareDevProxy` in `vite.config.ts` intercepts SSR requests so the dev experience matches production. `VITE_AUDIT_TARGET` still works for pointing the audit at a local site.

## Deployment

```bash
pnpm --filter site-audit deploy
# expands to: react-router build && wrangler deploy -c worker/wrangler.toml
```

**Prerequisites:**
- `CLOUDFLARE_API_TOKEN` env var (already in `turbo.json` for other packages)
- `is-pinoy.dev` zone must exist in Cloudflare — one-time manual setup before first deploy

## Out of Scope

- Auth or rate limiting on `/_tools/site-audit` (public tool)
- Caching audit results in KV
- Removing the Dockerfile (can be left or deleted separately)
