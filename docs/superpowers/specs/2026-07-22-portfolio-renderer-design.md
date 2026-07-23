# GitHub-profile portfolio renderer

**Date:** 2026-07-22
**Status:** Approved (design)
**Scope:** New `apps/portfolio` renderer app + a `portfolio` config block on the
domain schema + a dashboard onboarding flow. No change to the existing
registry/sync engine or the DNS record model.

## Problem

Many Filipino developers want to claim an `is-pinoy.dev` subdomain but have **no
web-based portfolio to point it at** — the current claiming flow assumes the
user already hosts a site somewhere (Vercel, Netlify, GitHub Pages) and only
issues a DNS record that points at *their* host.

We want a hosted option: a user picks a **template/theme**, we render a
portfolio **from the content they already maintain — their GitHub profile
README** (`github.com/<user>/<user>` → `README.md`) plus public profile
metadata, and we issue them a subdomain that serves it. No site of their own
required.

## Constraints & key facts

- Subdomains are `subdomains/<name>.json` files in the separate
  `is-pinoy-dev/domains` repo, claimed via **pull request**, validated by the
  registry, and synced to Cloudflare DNS. This is the single source of truth
  and must stay that way.
- The domain schema (`@is-pinoy-dev/schemas`) already carries a per-domain
  `features` flag block (`tools: { "site-audit", "og" }`) — there is precedent
  for per-domain configuration living in the JSON.
- `apps/dashboard` already authenticates users with **GitHub OAuth
  (NextAuth)** — we already know a logged-in user's GitHub login.
- ISR + CDN caching is the house pattern (`revalidate = 3600`,
  `stale-while-revalidate`, cached GitHub fetches in `lib/subdomains.ts`).
- The diff/sync engine (`packages/registry/src/core/diff.ts`) only ever
  **deletes** records for `destroy: true` domains, matching destroyed TXT
  values, and orphaned `_vercel.*` verification TXTs. It does **not** prune
  arbitrary unmanaged records.
- Design system is retro pixel-art (`DESIGN.md`): gold on dark, Press Start 2P,
  zero border-radius, hard pixel shadows. Components live in `@is-pinoy-dev/ui`.

## Decisions locked in

1. **DNS model — per-record CNAME (not a wildcard).** Each portfolio subdomain
   is an ordinary `subdomains/<name>.json` file whose CNAME points at our own
   renderer host (`portfolio.is-pinoy.dev`), `proxied: true`. The renderer reads
   the `Host` header to resolve which user to render.
2. **Config lives in the domains-repo JSON, added via GitHub PR** — a new
   optional `portfolio` block. Git-tracked, PR-reviewable, consistent with the
   existing model. No separate database of template choices.
3. **Freshness is pure ISR revalidation** — no GitHub webhook. Content
   re-fetches on the revalidation window.

### Why not a wildcard `*.is-pinoy.dev`

Rejected. An explicit record always beats a wildcard (RFC 4592), so existing
subdomains would be unaffected — but a wildcard would:

- make **every** unclaimed name resolve to the renderer (typos, bots, probes),
  turning NXDOMAIN — currently a meaningful "not claimed" signal — into noise;
- make **destroyed** subdomains silently resolve again instead of going dark;
- be **un-representable as a JSON file** (`subdomain` must match
  `^[a-z0-9-]+$`, min 3), so it would have to be hand-created in Cloudflare
  **outside git** — a permanent split-brain the registry can't see or audit.

Per-record CNAMEs cost nothing on Cloudflare and preserve every invariant.

## Design

### 1. Schema — `packages/schemas/src/domain/index.ts`

Add an optional `portfolio` block to `domainSchema` (mirrors the existing
`features` pattern):

```ts
export const portfolioSchema = z.object({
  template: z.enum(["terminal", "pixel-card", "minimal"]),
  theme: z.enum(["gold-dark", "mono", "matrix"]).optional(),
  // Optional opt-in / reordering of README sections by heading slug.
  sections: z.array(z.string()).optional(),
}).optional()

export const domainSchema = z.object({
  // ...existing...
  features: domainFeaturesSchema,
  portfolio: portfolioSchema,
  destroy: z.boolean().optional(),
})
```

Regenerate the JSON Schema (`generate:schema`) so the domains-repo PR CI
validates the new block. A portfolio subdomain's file looks like:

```jsonc
{
  "subdomain": "juan",
  "owner": { "github": "juanDL" },
  "portfolio": { "template": "terminal", "theme": "gold-dark" },
  "records": {
    "CNAME": { "value": "portfolio.is-pinoy.dev", "proxied": true }
  }
}
```

To the registry/sync engine this is just another CNAME — **zero engine
changes.** The `portfolio` block is inert to DNS; only the renderer reads it.

### 2. Renderer app — `apps/portfolio` (new Next 16 app)

Request lifecycle for `juan.is-pinoy.dev`:

- **`middleware.ts`** — extract the leading label (`juan`) from the `Host`
  header; reject apex/`www`/reserved labels.
- **Resolver** — look up `subdomains/juan.json` in the domains repo (same
  cached GitHub-fetch approach as `apps/web/lib/subdomains.ts`) → returns
  `{ github, portfolio }`. No file, or no `portfolio` block → **clean 404**.
- **Fetcher** — GitHub REST: `GET /repos/{u}/{u}/readme` (profile README) +
  `GET /users/{u}` (name, avatar, bio, location, blog) + top repos. Pinned
  repos, if wanted, need the GraphQL API. All cached via ISR.
- **Parser** — markdown → sanitized, normalized `PortfolioData` (see §3).
- **Template registry** — select the component by `portfolio.template`, apply
  `theme` tokens, render. ISR-cached HTML.

TLS: `proxied: true` + Cloudflare Universal SSL already covers
`*.is-pinoy.dev` (one level) — **no per-user cert provisioning.**

### 3. Normalized model — decouple templates from GitHub

```ts
interface PortfolioData {
  profile: { name; login; avatar; bio; location; links: Link[] }
  readme: RenderedSection[]   // sanitized profile README, split by heading
  repos: Repo[]               // top/pinned
  stats: { followers; contributions? }
}
```

Templates consume `PortfolioData` only, never raw GitHub payloads — so adding a
template or swapping the data source touches one layer, not all of them.

### 4. Template registry & themes

Each template is a React component tree taking `PortfolioData`, built from
`@is-pinoy-dev/ui` primitives so it inherits the pixel-art design system.
Themes are token/CSS-variable overrides layered on top. Adding a template =
adding one component + one enum value in the schema. No routing changes.

### 5. Security — README sanitization (non-negotiable)

Profile READMEs are arbitrary user markdown **and HTML**, served on
`*.is-pinoy.dev`. Unsanitized, that is **stored XSS on our own domain**
(cookie/session theft across subdomains). The parser must:

- run `rehype-sanitize` with a strict allowlist;
- strip `<script>`, event handlers, `javascript:` URLs, `<style>`/CSS injection;
- proxy or allowlist external images (README shields/badges), never inline raw
  remote HTML.

This constraint shapes the parser and is a hard gate for the first template.

### 6. Onboarding — extend `apps/dashboard`

The dashboard already has GitHub auth, so we know the user's login:

1. User logs in → pick a subdomain (reuse the existing `SubdomainChecker`
   availability check — confirm it keys off the JSON files, not DNS).
2. **Live preview** — render the user's *actual* README in each template so
   they choose visually before committing.
3. On confirm → **auto-open a PR** to `is-pinoy-dev/domains` (GitHub API, user
   authenticated) adding `subdomains/<name>.json` with `owner.github`, the
   `portfolio` block, and the `CNAME → portfolio.is-pinoy.dev` record.
4. Merge → registry syncs DNS → portfolio is live. Same PR governance as today.

## Rollout (phased)

1. **Schema** ✅ — `portfolio` block added, JSON Schema regenerated, additive
   and backward-compatible.
2. **Spike** ✅ — `apps/portfolio` fetcher + sanitizing parser + terminal
   template. Sanitizer proven against an XSS matrix.
3. **Routing** ✅ — `proxy.ts` extracts the subdomain from the Host header into
   `x-portfolio-subdomain`; `getRenderContext()` resolves it against the domains
   repo and loads the portfolio; unresolved → 404. Route is dynamic per
   subdomain, upstream GitHub fetches ISR-cached (1h).
4. **Templates + themes** ✅ — terminal, pixel-card, minimal templates;
   gold-dark / mono / matrix themes via token re-scoping in a shared shell.
5. **Onboarding** ✅ — `apps/dashboard` `/claim` flow: subdomain input, template
   + theme selectors, live Preview link (renderer `?preview=` mode), and
   **auto-open PR** to the domains repo (chosen over the prefilled-link option).
   The GitHub OAuth provider now requests `public_repo`; the token is persisted
   in the encrypted JWT only and read server-side to fork → branch → add the
   file → open the PR.

## Status of pre-build open items

- ✅ **`SubdomainChecker` keys off git, not DNS.** Confirmed: it fetches
  `raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains/<name>.json`.
  Availability is DNS-agnostic, as the design assumed.
- ✅ **GitHub API rate limits.** `lib/github.ts` reuses the
  `GITHUB_TOKEN`/`GH_TOKEN` pattern and ISR-caches all fetches. (In sandbox,
  unauthenticated `api.github.com` returns 403; the renderer degrades to a clean
  404 — a token is required for live rendering.)
- ⬜ **Deployment host behind `portfolio.is-pinoy.dev`.** Still to decide; the
  portfolio subdomains' CNAME target depends on it.

## Phase 5 decision (resolved) — auto-open PR

Resolved in favor of **auto-open**: on confirm, the dashboard forks the domains
repo and opens the claim PR using the user's `public_repo` OAuth token. The PR
is authored by the user, keeping the same maintainer-merge governance as the
manual flow — only the mechanics are automated. Security posture: the access
token lives solely in the encrypted session JWT (never the client session) and
is decoded server-side per request.

## Remaining before production

- **Deployment host behind `portfolio.is-pinoy.dev`** — still to decide; the
  portfolio subdomains' CNAME target depends on it.
- **`GITHUB_TOKEN` for the renderer** — required for live rendering (anonymous
  `api.github.com` is rate-limited/403).
- **Live OAuth + PR creation** — exercisable only outside the sandbox (needs a
  real GitHub OAuth app and API access).
