# Cloudflare Worker — Site Audit Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy `tools/site-audit` as a Cloudflare Worker so any `{subdomain}.is-pinoy.dev/_tools/site-audit` request auto-audits that subdomain's site.

**Architecture:** Use `@react-router/cloudflare` adapter — the Worker entry delegates all requests to React Router's `createRequestHandler`. Static assets are served via Wrangler's `assets` binding. The `audit-proxy` route is moved under `/_tools/site-audit/audit-proxy` so it falls within the Worker's intercepted path pattern.

**Tech Stack:** React Router 7, `@react-router/cloudflare`, Wrangler (Cloudflare Workers CLI), Vite, TypeScript

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `tools/site-audit/package.json` | Add deps + `deploy` script |
| Modify | `tools/site-audit/vite.config.ts` | Add `cloudflareDevProxy` plugin |
| Modify | `tools/site-audit/react-router.config.ts` | No change needed (ssr: true is correct) |
| Modify | `tools/site-audit/src/routes.ts` | Move audit-proxy route under `/_tools/site-audit/audit-proxy` |
| Modify | `tools/site-audit/src/routes/layout.tsx` | Update fetch URL to `/_tools/site-audit/audit-proxy` |
| Modify | `tools/site-audit/src/routes/audit-proxy.tsx` | Fix SSRF env check: `DEV` → `MODE !== "development"` |
| Create | `tools/site-audit/worker/index.ts` | Worker entry point |
| Create | `tools/site-audit/worker/wrangler.toml` | Wrangler config (routes, assets) |

---

### Task 1: Install dependencies

**Files:**
- Modify: `tools/site-audit/package.json`

- [ ] **Step 1: Add `@react-router/cloudflare`, `wrangler`, and `@cloudflare/workers-types`**

Run from `tools/site-audit/`:

```bash
pnpm add @react-router/cloudflare
pnpm add -D wrangler @cloudflare/workers-types
```

`@cloudflare/workers-types` provides the `Env` and `ExecutionContext` globals used in `worker/index.ts`.

- [ ] **Step 2: Add `@cloudflare/workers-types` to `tsconfig.json`**

Open `tools/site-audit/tsconfig.json`. In `compilerOptions.types`, add `"@cloudflare/workers-types"`:

```json
"types": ["node", "vite/client", "@cloudflare/workers-types"]
```

- [ ] **Step 3: Verify they appear in `package.json`**

```bash
grep -E "react-router/cloudflare|wrangler|workers-types" package.json
```

Expected output (versions may differ):
```
"@react-router/cloudflare": "7.x.x",
"@cloudflare/workers-types": "^x.x.x",
"wrangler": "^x.x.x",
```

- [ ] **Step 3: Add `deploy` script to `package.json`**

Open `tools/site-audit/package.json`. In the `"scripts"` section, add:

```json
"deploy": "react-router build && wrangler deploy -c worker/wrangler.toml"
```

Full scripts section after change:
```json
"scripts": {
  "build": "react-router build",
  "dev": "react-router dev",
  "start": "react-router-serve ./build/server/index.js",
  "typecheck": "react-router typegen && tsc",
  "deploy": "react-router build && wrangler deploy -c worker/wrangler.toml"
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json tsconfig.json pnpm-lock.yaml
git commit -m "chore(site-audit): add @react-router/cloudflare, wrangler, and workers-types deps"
```

---

### Task 2: Update `vite.config.ts` for Cloudflare dev proxy

**Files:**
- Modify: `tools/site-audit/vite.config.ts`

- [ ] **Step 1: Add `cloudflareDevProxy` to the Vite config**

Replace the entire contents of `tools/site-audit/vite.config.ts` with:

```ts
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [cloudflareDevProxy(), tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
```

`cloudflareDevProxy()` must come before `reactRouter()`.

- [ ] **Step 2: Verify typecheck passes**

```bash
pnpm typecheck
```

Expected: no errors. If `cloudflareDevProxy` has a type error, ensure `@react-router/cloudflare` was installed in Task 1.

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat(site-audit): add cloudflareDevProxy plugin for Cloudflare Worker build"
```

---

### Task 3: Fix SSRF env check in `audit-proxy.tsx`

**Files:**
- Modify: `tools/site-audit/src/routes/audit-proxy.tsx`

- [ ] **Step 1: Replace `import.meta.env.DEV` with `MODE` check**

In Workers, `import.meta.env.DEV` is always `false`, so the private-IP bypass would never activate even in `wrangler dev`. The fix uses `MODE` which Vite sets to `"development"` during dev.

Open `tools/site-audit/src/routes/audit-proxy.tsx`. Change line 27:

```ts
// before
if (!import.meta.env.DEV) {

// after
if (import.meta.env.MODE !== "development") {
```

Full file after change:

```ts
import type { Route } from "./+types/audit-proxy";

const BLOCKED_HOSTNAME_RE =
  /^(localhost|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|::1|\[::1\])$/i;

const MAX_BYTES = 1_000_000;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(target);
  } catch {
    return new Response("Invalid url parameter", { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedTarget.protocol)) {
    return new Response("Only http and https URLs are allowed", { status: 400 });
  }

  if (import.meta.env.MODE !== "development") {
    const hostname = parsedTarget.hostname.replace(/^\[|\]$/g, "");
    if (BLOCKED_HOSTNAME_RE.test(hostname)) {
      return new Response("Private and loopback addresses are not allowed", { status: 400 });
    }
  }

  try {
    const response = await fetch(parsedTarget.toString(), {
      headers: { "User-Agent": "is-pinoy-dev-site-audit/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    const buffer = await response.arrayBuffer();
    const slice = buffer.byteLength > MAX_BYTES ? buffer.slice(0, MAX_BYTES) : buffer;
    const html = new TextDecoder().decode(slice);

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch {
    return new Response("Failed to fetch target URL", { status: 502 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/audit-proxy.tsx
git commit -m "fix(site-audit): use MODE check for SSRF bypass (DEV is always false in Workers)"
```

---

### Task 4: Move audit-proxy route under `/_tools/site-audit/`

**Files:**
- Modify: `tools/site-audit/src/routes.ts`
- Modify: `tools/site-audit/src/routes/layout.tsx`

The Wrangler route pattern only intercepts `*.is-pinoy.dev/_tools/site-audit*`. Without this change, the client-side fetch to `/audit-proxy` goes to the subdomain's actual site instead of the Worker.

- [ ] **Step 1: Update `src/routes.ts`**

Replace the entire contents of `tools/site-audit/src/routes.ts` with:

```ts
import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/overview.tsx"),
    route("/seo", "routes/seo.tsx"),
    route("/og", "routes/og.tsx"),
  ]),
  route("/_tools/site-audit/audit-proxy", "routes/audit-proxy.tsx"),
] satisfies RouteConfig;
```

- [ ] **Step 2: Update the fetch URL in `src/routes/layout.tsx`**

Open `tools/site-audit/src/routes/layout.tsx`. Change line 23 (the `fetch` call inside `runAudit`):

```ts
// before
const res = await fetch(
  `/audit-proxy?url=${encodeURIComponent(target)}`,
  signal ? { signal } : undefined
);

// after
const res = await fetch(
  `/_tools/site-audit/audit-proxy?url=${encodeURIComponent(target)}`,
  signal ? { signal } : undefined
);
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes.ts src/routes/layout.tsx
git commit -m "fix(site-audit): move audit-proxy route under /_tools/site-audit/ for Worker interception"
```

---

### Task 5: Create the Worker entry point

**Files:**
- Create: `tools/site-audit/worker/index.ts`

- [ ] **Step 1: Create the `worker/` directory and `index.ts`**

Create `tools/site-audit/worker/index.ts` with:

```ts
import { createRequestHandler } from "@react-router/cloudflare";
import * as build from "../build/server";

const handler = createRequestHandler(build);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handler(request, { cloudflare: { env, ctx } });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add worker/index.ts
git commit -m "feat(site-audit): add Cloudflare Worker entry point"
```

---

### Task 6: Create `wrangler.toml`

**Files:**
- Create: `tools/site-audit/worker/wrangler.toml`

- [ ] **Step 1: Create `tools/site-audit/worker/wrangler.toml`**

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

All paths are relative to `worker/wrangler.toml`:
- `main = "index.ts"` → `worker/index.ts`
- `directory = "../build/client"` → `tools/site-audit/build/client`

- [ ] **Step 2: Commit**

```bash
git add worker/wrangler.toml
git commit -m "feat(site-audit): add wrangler.toml for Cloudflare Worker deployment"
```

---

### Task 7: Verify the build and local dev

**Files:** none (verification only)

- [ ] **Step 1: Run the React Router build**

From `tools/site-audit/`:

```bash
pnpm build
```

Expected: `build/client/` and `build/server/index.js` are produced with no errors.

- [ ] **Step 2: Run `wrangler dev` for local Worker testing**

```bash
pnpm exec wrangler dev -c worker/wrangler.toml
```

Expected: Wrangler starts on `http://localhost:8787`. Open it in a browser — the site-audit dashboard should load and begin auditing `http://localhost:8787` (or whatever `VITE_AUDIT_TARGET` is set to in `.env`).

If you see `Cannot find module '../build/server'`, the build output is missing — run `pnpm build` first.

- [ ] **Step 3: Verify the audit-proxy route works**

With `wrangler dev` running, in a separate terminal:

```bash
curl "http://localhost:8787/_tools/site-audit/audit-proxy?url=https://example.com"
```

Expected: HTML content from `https://example.com` (not a 404 or 502).

- [ ] **Step 4: Run typecheck one final time**

```bash
pnpm typecheck
```

Expected: no errors.

---

### Task 8: Deploy to Cloudflare (manual gate)

**Files:** none

> **Prerequisites before this task:**
> 1. A `is-pinoy.dev` zone must exist in your Cloudflare account
> 2. `CLOUDFLARE_API_TOKEN` env var must be set (or run `wrangler login`)

- [ ] **Step 1: Authenticate with Cloudflare (if not already)**

```bash
pnpm exec wrangler login
```

This opens a browser to complete OAuth. Skip if `CLOUDFLARE_API_TOKEN` is already set.

- [ ] **Step 2: Deploy**

From `tools/site-audit/`:

```bash
pnpm deploy
```

This runs `react-router build && wrangler deploy -c worker/wrangler.toml`.

Expected output includes:
```
Uploaded site-audit (x.xx sec)
Published site-audit (x.xx sec)
  is-pinoy.dev/_tools/site-audit*
  *.is-pinoy.dev/_tools/site-audit*
```

- [ ] **Step 3: Smoke test on the live domain**

Visit `https://is-pinoy.dev/_tools/site-audit` in a browser.

Expected: the site-audit dashboard loads and begins auditing `https://is-pinoy.dev`.

If you have a registered subdomain (e.g., `test.is-pinoy.dev`), also visit `https://test.is-pinoy.dev/_tools/site-audit` and verify it audits `https://test.is-pinoy.dev`.
