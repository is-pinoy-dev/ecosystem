# Analytics Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a Cloudflare Worker at `tools/analytics` that intercepts all requests to proxied `*.is-pinoy.dev` subdomains, logs navigation visits (subdomain + country + timestamp) to Analytics Engine non-blocking, then proxies the request to origin transparently.

**Architecture:** Standalone Cloudflare Worker on route `*.is-pinoy.dev/*`. Checks `Accept: text/html` to identify navigation requests, extracts subdomain from hostname, writes one Analytics Engine data point per navigation visit via `ctx.waitUntil`, then calls `fetch(request)` to proxy to origin. No frontend, no workspace dependencies — pure worker.

**Tech Stack:** Cloudflare Workers, Cloudflare Analytics Engine, TypeScript, Wrangler 4, GitHub Actions

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `tools/analytics/package.json` | Create | Package manifest, scripts (dev, deploy, typecheck) |
| `tools/analytics/worker/wrangler.toml` | Create | Cloudflare config: route, AE binding, observability |
| `tools/analytics/worker/tsconfig.json` | Create | TypeScript config for the worker (Workers types, no emit) |
| `tools/analytics/worker/index.ts` | Create | Worker entry: navigate check, subdomain extract, AE write, fetch proxy |
| `.github/workflows/deploy-analytics.yml` | Create | CI/CD: deploy on push to main or manual trigger |
| `apps/web/app/privacy/page.mdx` | Modify | Add section 6 (Platform Analytics), update section 5 |
| `apps/web/app/tos/page.mdx` | Modify | Update section 3 and section 10 with analytics disclosure |

---

## Task 1: Scaffold `tools/analytics` package

**Files:**
- Create: `tools/analytics/package.json`
- Create: `tools/analytics/worker/tsconfig.json`

- [ ] **Step 1: Create `tools/analytics/package.json`**

```json
{
  "name": "analytics",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev -c worker/wrangler.toml",
    "deploy": "wrangler deploy -c worker/wrangler.toml",
    "typecheck": "tsc -p worker/tsconfig.json --noEmit"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20260527.1",
    "typescript": "catalog:",
    "wrangler": "^4.95.0"
  }
}
```

- [ ] **Step 2: Create `tools/analytics/worker/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["./**/*"]
}
```

- [ ] **Step 3: Install dependencies**

Run from repo root:
```bash
pnpm install
```

Expected: pnpm adds `tools/analytics` to workspace and installs its deps.

- [ ] **Step 4: Commit**

```bash
git add tools/analytics/package.json tools/analytics/worker/tsconfig.json
git commit -m "feat(analytics): scaffold analytics worker package"
```

---

## Task 2: Write `worker/wrangler.toml`

**Files:**
- Create: `tools/analytics/worker/wrangler.toml`

- [ ] **Step 1: Create `tools/analytics/worker/wrangler.toml`**

```toml
name = "tools-analytics"
main = "index.ts"
compatibility_date = "2026-05-27"

[[routes]]
pattern = "*.is-pinoy.dev/*"
zone_name = "is-pinoy.dev"

[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "subdomain_visits"

[observability]
enabled = true
head_sampling_rate = 1

[observability.logs]
enabled = true
head_sampling_rate = 1
persist = true
invocation_logs = true
```

Notes on key decisions:
- Route `*.is-pinoy.dev/*` catches all proxied subdomain requests. More-specific routes (e.g. `*.is-pinoy.dev/_tools/site-audit*`) handled by their own workers take precedence — `/_tools/*` traffic is not logged by this worker, which is intentional.
- No `nodejs_compat` flag needed — this worker uses no Node.js APIs.
- Analytics Engine dataset name `subdomain_visits` must match what's used in `index.ts`.

- [ ] **Step 2: Commit**

```bash
git add tools/analytics/worker/wrangler.toml
git commit -m "feat(analytics): add wrangler config with Analytics Engine binding"
```

---

## Task 3: Write the worker entry point

**Files:**
- Create: `tools/analytics/worker/index.ts`

- [ ] **Step 1: Create `tools/analytics/worker/index.ts`**

```typescript
export interface Env {
  ANALYTICS: AnalyticsEngineDataset;
}

function isNavigationRequest(request: Request): boolean {
  const accept = request.headers.get("Accept") ?? "";
  return accept.includes("text/html");
}

function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split(".");
  // Only subdomains (e.g. juan.is-pinoy.dev) — skip apex
  if (parts.length <= 2) return null;
  return parts.slice(0, parts.length - 2).join(".");
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (isNavigationRequest(request)) {
      const url = new URL(request.url);
      const subdomain = extractSubdomain(url.hostname);
      if (subdomain) {
        const country = (request.cf?.country as string | undefined) ?? "XX";
        ctx.waitUntil(
          Promise.resolve(
            env.ANALYTICS.writeDataPoint({
              indexes: [subdomain],
              blobs: [country],
            })
          )
        );
      }
    }
    return fetch(request);
  },
} satisfies ExportedHandler<Env>;
```

Notes:
- `ctx.waitUntil` ensures the AE write does not block the proxied response.
- `fetch(request)` inside a Cloudflare Worker proxies to the origin, bypassing the worker itself (no infinite loop).
- Country falls back to `"XX"` when `request.cf` is absent (e.g., local `wrangler dev`).
- Apex domain (`is-pinoy.dev` with no subdomain) returns `null` from `extractSubdomain` and skips logging.

- [ ] **Step 2: Typecheck**

Run from repo root:
```bash
pnpm --filter analytics typecheck
```

Expected: `0 errors` output (or silent success).

- [ ] **Step 3: Verify locally with wrangler dev**

Run from `tools/analytics`:
```bash
pnpm dev
```

In a second terminal, test a navigation request:
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Accept: text/html" \
  http://localhost:8787/
```

Expected: HTTP 200 (proxied response). In wrangler dev output you should see the request logged with no errors.

Test a non-navigation request (should not log):
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Accept: application/json" \
  http://localhost:8787/api/data
```

Expected: HTTP 200, no AE write attempted.

Stop the dev server with `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add tools/analytics/worker/index.ts
git commit -m "feat(analytics): add passthrough worker with Analytics Engine visit logging"
```

---

## Task 4: Add GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy-analytics.yml`

- [ ] **Step 1: Create `.github/workflows/deploy-analytics.yml`**

```yaml
name: Deploy analytics

on:
  push:
    branches:
      - main
    paths:
      - "tools/analytics/**"
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Cloudflare Workers
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.4
          run_install: false

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Deploy
        working-directory: tools/analytics
        run: pnpm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_WORKER_DEPLOY_TOKEN }}
```

Note: No workspace dependency build step — `tools/analytics` has no `@is-pinoy-dev/*` dependencies.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy-analytics.yml
git commit -m "ci: add deploy workflow for analytics worker"
```

---

## Task 5: Update Privacy Policy

**Files:**
- Modify: `apps/web/app/privacy/page.mdx`

- [ ] **Step 1: Update section 5 to list Analytics Engine**

Find this line in `apps/web/app/privacy/page.mdx`:
```
- **Cloudflare** — DNS record hosting, traffic proxying (when `"proxied": true` is set on your record), and Worker infrastructure for built-in tools ([cloudflare.com/privacypolicy](https://www.cloudflare.com/privacypolicy/))
```

Replace with:
```
- **Cloudflare** — DNS record hosting, traffic proxying (when `"proxied": true` is set on your record), Worker infrastructure for built-in tools, and Analytics Engine for platform visit metrics ([cloudflare.com/privacypolicy](https://www.cloudflare.com/privacypolicy/))
```

- [ ] **Step 2: Add section 6 (Platform Analytics) before section 6 (Data Retention)**

Find `## 6. Data Retention` in `apps/web/app/privacy/page.mdx` and insert the following block immediately before it:

```markdown
## 6. Platform Analytics

To monitor platform health and understand aggregate traffic patterns, we passively log visits to proxied subdomains on `*.is-pinoy.dev`.

**What we log per visit:**

- The **subdomain name** (e.g. `juan` from `juan.is-pinoy.dev`)
- The visitor's **country** (ISO 2-letter code, derived from Cloudflare edge metadata — no geolocation lookup is performed and no IP address is stored)
- A **timestamp** (provided automatically by Cloudflare Analytics Engine)

We do **not** log paths, query strings, IP addresses, user-agent strings, referrers, or any other request details at the platform level.

**This logging only applies to proxied subdomains.** If your DNS record has `"proxied": false` (DNS-only mode), your subdomain's traffic goes directly to your origin and is never intercepted by our infrastructure — no visit data is collected for DNS-only subdomains.

Platform traffic requests to `/_tools/*` paths (such as Site Audit) are handled by separate tool workers and are not logged by the platform analytics system.

Visit data is stored in **Cloudflare Analytics Engine** and is subject to [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/). Data is used solely for aggregate platform reporting and is not shared, sold, or used for advertising purposes. This processing is carried out in compliance with the **Philippine Data Privacy Act of 2012 (RA 10173)**.

```

- [ ] **Step 3: Renumber Data Retention and subsequent sections**

After inserting the new section 6, the old sections 6–11 shift to 7–12. Update the heading numbers:

- `## 6. Data Retention` → `## 7. Data Retention`
- `## 7. Your Rights` → `## 8. Your Rights`
- `## 8. Security` → `## 9. Security`
- `## 9. Children's Privacy` → `## 10. Children's Privacy`
- `## 10. Changes to This Policy` → `## 11. Changes to This Policy`
- `## 11. Contact` → `## 12. Contact`

- [ ] **Step 4: Verify the file renders correctly**

Run the Next.js dev server:
```bash
pnpm --filter web dev
```

Open `http://localhost:3000/privacy` in a browser. Confirm:
- Section 6 "Platform Analytics" appears with correct content
- Sections 7–12 are numbered sequentially
- No broken MDX syntax

Stop the dev server with `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/privacy/page.mdx
git commit -m "docs(privacy): add platform analytics disclosure (section 6)"
```

---

## Task 6: Update Terms of Service

**Files:**
- Modify: `apps/web/app/tos/page.mdx`

- [ ] **Step 1: Update section 3 (What We Provide)**

Find this paragraph in `## 3. What We Provide`:
```
is-pinoy.dev offers free `yourname.is-pinoy.dev` subdomains to developers. This is a community-operated service run by the **is-pinoy-dev** open source organization on GitHub. We provide no uptime guarantee, SLA, or warranty of any kind. The service may be modified, suspended, or discontinued at any time.
```

Replace with:
```
is-pinoy.dev offers free `yourname.is-pinoy.dev` subdomains to developers. This is a community-operated service run by the **is-pinoy-dev** open source organization on GitHub. We provide no uptime guarantee, SLA, or warranty of any kind. The service may be modified, suspended, or discontinued at any time.

**Platform Analytics:** Visit traffic to proxied subdomains (where `"proxied": true`) is logged at the platform level. Each visit records the subdomain name, visitor country, and timestamp. No paths, IP addresses, or personal identifiers are collected. DNS-only subdomains (`"proxied": false`) are not subject to platform-level logging. By registering a subdomain, you acknowledge this. See our [Privacy Policy](/privacy) for full details.
```

- [ ] **Step 2: Update section 10 (Privacy)**

Find the opening of `## 10. Privacy`:
```
We do not collect or process personal data beyond what is necessary to operate the service.
```

Replace with:
```
We do not collect or process personal data beyond what is necessary to operate the service. This includes platform-level visit analytics for proxied subdomains — see our [Privacy Policy](/privacy) for details on what is collected and how it is used.
```

- [ ] **Step 3: Verify the file renders correctly**

Run the Next.js dev server:
```bash
pnpm --filter web dev
```

Open `http://localhost:3000/tos` in a browser. Confirm:
- Section 3 includes the Platform Analytics paragraph
- Section 10 links to `/privacy`
- No broken MDX syntax

Stop the dev server with `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/tos/page.mdx
git commit -m "docs(tos): add platform analytics disclosure in sections 3 and 10"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All spec sections covered — worker scaffold, wrangler config, AE write, navigation filter, passthrough proxy, GitHub Actions, Privacy update, TOS update
- [x] **Placeholder scan:** No TBD/TODO. All code blocks are complete.
- [x] **Type consistency:** `Env.ANALYTICS: AnalyticsEngineDataset` used in Task 3 only. `isNavigationRequest` and `extractSubdomain` defined and used in `index.ts` only. No cross-task type drift.
- [x] **Proxied-only constraint:** Documented in worker notes (Task 3), Privacy (Task 5), TOS (Task 6).
- [x] **Dataset name consistency:** `subdomain_visits` used in `wrangler.toml` (Task 2) — `index.ts` does not repeat the dataset name (bound via `ANALYTICS` env binding).
