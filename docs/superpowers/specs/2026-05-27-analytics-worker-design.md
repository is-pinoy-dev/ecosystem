# Analytics Worker — Design Spec

**Date:** 2026-05-27
**Status:** Approved
**Scope:** MVP — platform-level visit logging for proxied subdomains

---

## Overview

A new standalone Cloudflare Worker (`tools/analytics`) that intercepts all requests to `*.is-pinoy.dev`, logs navigation visits to Cloudflare Analytics Engine, then transparently proxies the request to the origin. No feature flag required for MVP — logging is always-on at the platform level for proxied subdomains only. DNS-only subdomains are never intercepted.

---

## Architecture

### Worker Structure

```
tools/analytics/
  worker/
    index.ts        — worker entry point (intercept, log, proxy)
    wrangler.toml   — Cloudflare config + Analytics Engine binding
    tsconfig.json
  package.json
```

Mirrors the `tools/site-audit` structure. No workspace package dependencies — the worker is self-contained.

### Request Flow

1. Request arrives at `*.is-pinoy.dev/*`
2. Worker checks if `Accept` header includes `text/html` (navigation request)
3. If yes → write Analytics Engine event via `ctx.waitUntil` (non-blocking)
4. Forward request to origin via `fetch(request)` and return the response unchanged

Non-navigation requests (assets, API calls, etc.) are proxied immediately with no logging.

### Cloudflare Worker Route

```toml
[[routes]]
pattern = "*.is-pinoy.dev/*"
zone_name = "is-pinoy.dev"
```

---

## Data Model

**Analytics Engine dataset:** `subdomain_visits`

| Field | AE Type | Example |
|---|---|---|
| `subdomain` | index | `juan` |
| `country` | index | `PH` |

Timestamp is provided automatically by Analytics Engine. No paths, IPs, user-agents, or referrers are stored at the platform level. Country is derived from `request.cf.country` (Cloudflare edge metadata — no geolocation lookup required).

---

## Deployment

### GitHub Actions Workflow

New file: `.github/workflows/deploy-analytics.yml`

- **Triggers:** push to `main` paths `tools/analytics/**` + `workflow_dispatch` (manual trigger)
- **Steps:** checkout → pnpm 10 setup → Node 22 → `pnpm install --frozen-lockfile` → `wrangler deploy`
- **Secret:** `CF_WORKER_DEPLOY_TOKEN` (reuses existing secret)
- No workspace dependency build step needed

---

## Privacy & TOS Updates

### Privacy Policy (`apps/web/app/privacy/page.mdx`)

**New section — "6. Platform Analytics":**
- All visits to proxied `*.is-pinoy.dev` subdomains are passively logged at the platform level
- Data collected per visit: subdomain name, visitor country (ISO 2-letter code), and timestamp
- This data is used solely for platform health monitoring and aggregate traffic reporting
- No paths, IP addresses, user-agents, or referrers are collected at the platform level
- **DNS-only subdomains** (`"proxied": false`) are never intercepted by Cloudflare Workers and are therefore never logged — only proxied subdomains are subject to platform analytics
- Data is stored in Cloudflare Analytics Engine and governed by Cloudflare's privacy policy
- Compliant with the Philippine Data Privacy Act of 2012 (RA 10173)

**Update section 5 (Third-Party Services):**
- Add Cloudflare Analytics Engine as a listed service for platform traffic metrics

### Terms of Service (`apps/web/app/tos/page.mdx`)

**Update section 3 (What We Provide):**
- Add a clause noting that visit traffic to proxied subdomains is logged at the platform level (subdomain, country, timestamp) for operational and monitoring purposes
- Clarify that DNS-only subdomains are not subject to platform-level logging
- Subdomain owners acknowledge this by registering

---

## Constraints & Decisions

- **Always-on, no feature flag** — platform-level logging requires no opt-in for MVP. A future `features.tools.analytics: true` flag may enable owner-level analytics (path, referrer, UA) in a follow-up.
- **Navigation requests only** — `Accept: text/html` check filters out asset fetches, keeping event volume low and data meaningful
- **Non-blocking logging** — `ctx.waitUntil` ensures the write to Analytics Engine never delays the proxied response
- **Proxied subdomains only** — DNS-only records bypass Cloudflare entirely; this is documented transparently in Privacy and TOS
- **No UI for MVP** — Analytics Engine data is queryable via Cloudflare GraphQL API; a dashboard is out of scope for this iteration

---

## Out of Scope (MVP)

- Per-subdomain analytics dashboard
- Owner-level opt-in analytics (path, referrer, user-agent)
- Bot filtering
- Unique visitor deduplication
