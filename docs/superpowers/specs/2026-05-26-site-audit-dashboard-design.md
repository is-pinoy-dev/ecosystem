# Site Audit Dashboard — Design Spec

**Date:** 2026-05-26  
**Status:** Approved  
**App:** `tools/site-audit`

---

## Overview

A standalone React Router 7 app that audits the current subdomain for SEO and OpenGraph health. The target URL is derived at runtime from `window.location.hostname` — so when accessed at `ana.is-pinoy.dev/_tools/site-audit`, it audits `https://ana.is-pinoy.dev`. The `/_tools/*` routing is handled by Cloudflare Workers which proxies to this Node.js app.

---

## Architecture

### Proxy Resource Route

`GET /audit-proxy?url=<target>`

A React Router resource route that fetches the target URL's raw HTML server-side and returns it as `text/html`. This sidesteps CORS — third-party subdomains (`.is-pinoy.dev`) are user-controlled and cannot be assumed to have permissive CORS headers.

### Client-Side Parser

A `parseAudit(html: string, url: string): AuditResult` utility function that:
1. Parses raw HTML using the browser's `DOMParser`
2. Extracts all audited fields
3. Evaluates each field against its rule and assigns `status: 'pass' | 'warn' | 'fail'`
4. Returns a structured `AuditResult` object

### Schema & Types

All schemas and inferred types live in `packages/schemas` (`@is-pinoy-dev/schemas`). The site-audit app imports and uses these — no duplicated type definitions.

Types to define:
- `AuditStatus` — `'pass' | 'warn' | 'fail'`
- `AuditField` — `{ label: string; value: string | null; status: AuditStatus; message?: string }`
- `AuditCategory` — `{ score: number; fields: AuditField[] }`
- `AuditResult` — `{ url: string; auditedAt: string; seo: AuditCategory; og: AuditCategory }`

### State Flow

```
idle → loading → result
               → error
```

- On page mount: trigger fetch automatically
- Re-run button: resets to `loading`, re-fetches
- Error state: show message + retry button

---

## Audited Fields

### SEO

| Field | Rule | Pass | Warn | Fail |
|-------|------|------|------|------|
| `<title>` | Present, length 10–60 chars | Present, in range | Present, out of range | Missing |
| `<meta name="description">` | Present, length 50–160 chars | Present, in range | Present, out of range | Missing |
| `<link rel="canonical">` | Present | Present | — | Missing |
| `<meta name="robots">` | Present | Present | — | Missing |
| H1 tag | Present, exactly 1 | Present, count = 1 | Present, count > 1 | Missing |

### Open Graph

| Field | Rule | Pass | Fail |
|-------|------|------|------|
| `og:title` | Present | Present | Missing |
| `og:description` | Present | Present | Missing |
| `og:image` | Present | Present | Missing |
| `og:url` | Present | Present | Missing |
| `og:type` | Present | Present | Missing |
| `twitter:card` | Present | Present | Missing |
| `twitter:title` | Present | Present | Missing |
| `twitter:description` | Present | Present | Missing |
| `twitter:image` | Present | Present | Missing |

### Scoring

`score = Math.round((passCount / totalCount) * 100)`

Status thresholds:
- `pass` ≥ 80%
- `warn` 50–79%
- `fail` < 50%

---

## UI Layout

### Top Navigation Bar

Full-width pixel-art nav bar (dark background, hard pixel borders):
- **Left:** is-pinoy.dev icon/logo
- **Center:** Tab navigation — `Overview` | `SEO` | `Open Graph`
- **Right:** "Re-run Audit" button + last audited timestamp

Active tab has gold (`#F5C800`) pixel underline. Press Start 2P font throughout.

### Overview Tab (default)

- Two score cards side by side: **SEO Score** and **Open Graph Score**
  - Each shows percentage, check counts (`X / Y passed`), and color state:
    - Pass → gold border
    - Warn → yellow/orange border  
    - Fail → red border
- **Issues list** below: all `warn` and `fail` fields across both categories
  - Each issue: field name + status badge + message (e.g. "title too long: 72 chars, max 60")
  - Empty state: "All checks passed" message when no issues

### SEO Tab

Card/table list of all 5 SEO fields:
- Field name, parsed value (truncated if long), status badge (`PASS` / `WARN` / `FAIL`)
- Null values shown as "Not found"

### Open Graph Tab

Same treatment as SEO tab for all 9 OG + Twitter card fields.

---

## Design System

Follows the retro pixel-art aesthetic defined in `DESIGN.md` and `CLAUDE.md`:
- Font: **Press Start 2P** for headings and UI labels
- Colors: gold `#F5C800` on dark backgrounds; use shadcn CSS variable tokens (`text-primary`, `bg-card`, etc.)
- Borders: hard pixel borders with pixel-offset box shadows (`4px 4px 0px #000`) — no blur, no `rounded-*`
- Scanline overlay: global effect from `globals.css`
- Components: prefer `@is-pinoy-dev/ui` (shadcn) components — `Button`, `Card`, `Badge`, `Tabs`
- Styling: Tailwind utility classes with shadcn tokens first; arbitrary values only when no token exists

---

## File Structure

```
tools/site-audit/src/
  routes/
    home.tsx              # Main dashboard page (client-side state, tab switching)
    audit-proxy.tsx       # Resource route: server-side HTML fetch + return
  lib/
    parse-audit.ts        # parseAudit(html, url): AuditResult
  components/
    nav-bar.tsx           # Top nav with logo + tabs + re-run button
    score-card.tsx        # Score card component (used in Overview)
    issue-list.tsx        # Issues list component (used in Overview)
    audit-field-row.tsx   # Single field row (used in SEO + OG tabs)
    audit-table.tsx       # Field table wrapper (used in SEO + OG tabs)

packages/schemas/src/
  audit.ts                # AuditStatus, AuditField, AuditCategory, AuditResult schemas + types
```

---

## Out of Scope

- Auditing URLs other than the current hostname
- Lighthouse performance metrics
- Persistent storage / audit history
- Auth / user accounts
