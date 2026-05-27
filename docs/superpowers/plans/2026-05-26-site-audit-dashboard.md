# Site Audit Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a retro pixel-art SEO + OpenGraph audit dashboard in `tools/site-audit` that fetches and analyzes the current hostname's meta tags on page load with a re-run button.

**Architecture:** A React Router 7 app with one server-side proxy resource route (`/audit-proxy`) that fetches target HTML to bypass CORS, plus a client-side `parseAudit` utility and tab-based dashboard UI. Schemas and inferred types live in `@is-pinoy-dev/schemas`. The target URL is derived from `window.location.hostname` at runtime.

**Tech Stack:** React Router 7, React 19, Tailwind CSS v4, Zod, `@is-pinoy-dev/schemas`, `@is-pinoy-dev/ui` (shadcn), Press Start 2P font

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/schemas/src/audit.ts` | Create | Zod schemas + inferred types for AuditStatus, AuditField, AuditCategory, AuditResult |
| `packages/schemas/src/index.ts` | Modify | Re-export from audit.ts |
| `tools/site-audit/package.json` | Modify | Add `@is-pinoy-dev/schemas: "workspace:*"` |
| `tools/site-audit/src/app.css` | Modify | Replace with retro design tokens, Press Start 2P font, scanline overlay |
| `tools/site-audit/src/root.tsx` | Modify | Remove Inter font, add dark class to `<html>` |
| `tools/site-audit/src/routes.ts` | Modify | Register `/audit-proxy` resource route |
| `tools/site-audit/src/routes/audit-proxy.tsx` | Create | Resource route: server-side fetch of target URL HTML |
| `tools/site-audit/src/lib/parse-audit.ts` | Create | `parseAudit(html, url): AuditResult` — DOM parsing + scoring |
| `tools/site-audit/src/lib/types.ts` | Create | `Tab` type (`"overview" \| "seo" \| "og"`) shared across components |
| `tools/site-audit/src/components/nav-bar.tsx` | Create | Top nav: logo + tab buttons + re-run button + timestamp |
| `tools/site-audit/src/components/score-card.tsx` | Create | Score percentage card with pass/warn/fail color state |
| `tools/site-audit/src/components/issue-list.tsx` | Create | List of all warn/fail fields with empty state |
| `tools/site-audit/src/components/audit-table.tsx` | Create | Table of audit fields with value + status badge |
| `tools/site-audit/src/routes/home.tsx` | Modify | Full dashboard: state machine, fetch on mount, tab switching |

---

## Task 1: Add Audit Schemas to `packages/schemas`

**Files:**
- Create: `packages/schemas/src/audit.ts`
- Modify: `packages/schemas/src/index.ts`

- [ ] **Step 1: Create `packages/schemas/src/audit.ts`**

```typescript
import { z } from "zod"

export const auditStatusSchema = z.enum(["pass", "warn", "fail"])
export type AuditStatus = z.infer<typeof auditStatusSchema>

export const auditFieldSchema = z.object({
  label: z.string(),
  value: z.string().nullable(),
  status: auditStatusSchema,
  message: z.string().optional(),
})
export type AuditField = z.infer<typeof auditFieldSchema>

export const auditCategorySchema = z.object({
  score: z.number().min(0).max(100),
  fields: z.array(auditFieldSchema),
})
export type AuditCategory = z.infer<typeof auditCategorySchema>

export const auditResultSchema = z.object({
  url: z.string(),
  auditedAt: z.string(),
  seo: auditCategorySchema,
  og: auditCategorySchema,
})
export type AuditResult = z.infer<typeof auditResultSchema>
```

- [ ] **Step 2: Re-export from `packages/schemas/src/index.ts`**

Add this line at the bottom of the existing file:

```typescript
export * from "./audit.js"
```

- [ ] **Step 3: Build schemas package**

```bash
pnpm --filter @is-pinoy-dev/schemas build
```

Expected: exits 0, `packages/schemas/dist/` updated

- [ ] **Step 4: Commit**

```bash
git add packages/schemas/src/audit.ts packages/schemas/src/index.ts
git commit -m "feat(schemas): add audit result schemas and types"
```

---

## Task 2: Wire `@is-pinoy-dev/schemas` into Site-Audit App

**Files:**
- Modify: `tools/site-audit/package.json`

- [ ] **Step 1: Add schemas dependency to `tools/site-audit/package.json`**

In the `"dependencies"` object, add:

```json
"@is-pinoy-dev/schemas": "workspace:*"
```

- [ ] **Step 2: Install**

```bash
pnpm install
```

Expected: `pnpm-lock.yaml` updated, no errors

- [ ] **Step 3: Verify import resolves**

```bash
pnpm --filter site-audit typecheck
```

Expected: exits 0 (or type errors only from existing boilerplate — not from missing `@is-pinoy-dev/schemas`)

- [ ] **Step 4: Commit**

```bash
git add tools/site-audit/package.json pnpm-lock.yaml
git commit -m "chore(site-audit): add @is-pinoy-dev/schemas dependency"
```

---

## Task 3: Set Up Retro Design Styles

**Files:**
- Modify: `tools/site-audit/src/app.css`
- Modify: `tools/site-audit/src/root.tsx`

- [ ] **Step 1: Replace `tools/site-audit/src/app.css`**

```css
@import "tailwindcss";

@import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap");

@custom-variant dark (&:is(.dark *));

:root {
  --background: #0D0D0D;
  --foreground: #FAFAF5;
  --card: #2A2A2A;
  --card-foreground: #FAFAF5;
  --primary: #F5C800;
  --primary-foreground: #0D0D0D;
  --secondary: #2A2A2A;
  --secondary-foreground: #FAFAF5;
  --muted: #444444;
  --muted-foreground: #888888;
  --accent: #444444;
  --accent-foreground: #FAFAF5;
  --destructive: #E63946;
  --border: #444444;
  --ring: #F5C800;
  --radius: 0rem;
  --accent-green: #39D353;
  --accent-red: #E63946;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-accent-green: var(--accent-green);
  --color-accent-red: var(--accent-red);
  --radius-sm: 0rem;
  --radius-md: 0rem;
  --radius-lg: 0rem;
  --font-pixel: "Press Start 2P", monospace;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Scanline overlay */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.05) 2px,
    rgba(0, 0, 0, 0.05) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
```

- [ ] **Step 2: Update `tools/site-audit/src/root.tsx`**

Replace the `links` export and `<html>` tag — remove Inter, add `dark` class:

```typescript
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="font-pixel">{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Start dev server and verify dark background loads**

```bash
pnpm --filter site-audit dev
```

Open `http://localhost:5173` — should show dark `#0D0D0D` background.

- [ ] **Step 4: Commit**

```bash
git add tools/site-audit/src/app.css tools/site-audit/src/root.tsx
git commit -m "feat(site-audit): set up retro pixel-art design system"
```

---

## Task 4: Create Proxy Resource Route

**Files:**
- Create: `tools/site-audit/src/routes/audit-proxy.tsx`
- Modify: `tools/site-audit/src/routes.ts`

- [ ] **Step 1: Create `tools/site-audit/src/routes/audit-proxy.tsx`**

```typescript
import type { Route } from "./+types/audit-proxy";

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

  try {
    const response = await fetch(parsedTarget.toString(), {
      headers: { "User-Agent": "is-pinoy-dev-site-audit/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await response.text();
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch {
    return new Response("Failed to fetch target URL", { status: 502 });
  }
}
```

- [ ] **Step 2: Register route in `tools/site-audit/src/routes.ts`**

```typescript
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/audit-proxy", "routes/audit-proxy.tsx"),
] satisfies RouteConfig;
```

- [ ] **Step 3: Verify route works**

With dev server running, visit `http://localhost:5173/audit-proxy?url=https://example.com` — should return HTML content (not a 404 or error page).

- [ ] **Step 4: Commit**

```bash
git add tools/site-audit/src/routes/audit-proxy.tsx tools/site-audit/src/routes.ts
git commit -m "feat(site-audit): add audit-proxy resource route"
```

---

## Task 5: Create `parseAudit` Utility and Shared Types

**Files:**
- Create: `tools/site-audit/src/lib/types.ts`
- Create: `tools/site-audit/src/lib/parse-audit.ts`

- [ ] **Step 1: Create `tools/site-audit/src/lib/types.ts`**

```typescript
export type Tab = "overview" | "seo" | "og";
```

- [ ] **Step 2: Create `tools/site-audit/src/lib/parse-audit.ts`**

```typescript
import type { AuditResult, AuditField, AuditCategory } from "@is-pinoy-dev/schemas";

function getMeta(doc: Document, name: string): string | null {
  return (
    doc.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ?? null
  );
}

function getOg(doc: Document, property: string): string | null {
  return (
    doc
      .querySelector(`meta[property="${property}"]`)
      ?.getAttribute("content") ?? null
  );
}

function scoreCategory(fields: AuditField[]): AuditCategory {
  const passed = fields.filter((f) => f.status === "pass").length;
  return {
    score: Math.round((passed / fields.length) * 100),
    fields,
  };
}

export function parseAudit(html: string, url: string): AuditResult {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const titleText = doc.querySelector("title")?.textContent ?? null;
  const description = getMeta(doc, "description");
  const canonical =
    doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null;
  const robots = getMeta(doc, "robots");
  const h1s = doc.querySelectorAll("h1");

  const seoFields: AuditField[] = [
    ((): AuditField => {
      if (!titleText)
        return {
          label: "Title",
          value: null,
          status: "fail",
          message: "Missing <title> tag",
        };
      if (titleText.length < 10 || titleText.length > 60)
        return {
          label: "Title",
          value: titleText,
          status: "warn",
          message: `Length ${titleText.length} chars (expected 10–60)`,
        };
      return { label: "Title", value: titleText, status: "pass" };
    })(),
    ((): AuditField => {
      if (!description)
        return {
          label: "Meta Description",
          value: null,
          status: "fail",
          message: "Missing meta description",
        };
      if (description.length < 50 || description.length > 160)
        return {
          label: "Meta Description",
          value: description,
          status: "warn",
          message: `Length ${description.length} chars (expected 50–160)`,
        };
      return { label: "Meta Description", value: description, status: "pass" };
    })(),
    canonical
      ? { label: "Canonical URL", value: canonical, status: "pass" }
      : {
          label: "Canonical URL",
          value: null,
          status: "fail",
          message: "Missing canonical link",
        },
    robots
      ? { label: "Robots", value: robots, status: "pass" }
      : {
          label: "Robots",
          value: null,
          status: "fail",
          message: "Missing robots meta tag",
        },
    ((): AuditField => {
      if (h1s.length === 0)
        return {
          label: "H1 Tag",
          value: null,
          status: "fail",
          message: "No H1 found",
        };
      if (h1s.length > 1)
        return {
          label: "H1 Tag",
          value: `${h1s.length} found`,
          status: "warn",
          message: `${h1s.length} H1 tags found (expected 1)`,
        };
      return { label: "H1 Tag", value: h1s[0].textContent ?? "", status: "pass" };
    })(),
  ];

  const ogFields: AuditField[] = [
    "og:title",
    "og:description",
    "og:image",
    "og:url",
    "og:type",
  ].map((prop): AuditField => {
    const value = getOg(doc, prop);
    return value
      ? { label: prop, value, status: "pass" }
      : { label: prop, value: null, status: "fail", message: `Missing ${prop}` };
  });

  const twitterFields: AuditField[] = [
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
  ].map((name): AuditField => {
    const value = getMeta(doc, name);
    return value
      ? { label: name, value, status: "pass" }
      : {
          label: name,
          value: null,
          status: "fail",
          message: `Missing ${name}`,
        };
  });

  return {
    url,
    auditedAt: new Date().toISOString(),
    seo: scoreCategory(seoFields),
    og: scoreCategory([...ogFields, ...twitterFields]),
  };
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter site-audit typecheck
```

Expected: exits 0

- [ ] **Step 4: Commit**

```bash
git add tools/site-audit/src/lib/types.ts tools/site-audit/src/lib/parse-audit.ts
git commit -m "feat(site-audit): add parseAudit utility and shared Tab type"
```

---

## Task 6: Create NavBar Component

**Files:**
- Create: `tools/site-audit/src/components/nav-bar.tsx`

- [ ] **Step 1: Create `tools/site-audit/src/components/nav-bar.tsx`**

```tsx
import type { Tab } from "../lib/types";

interface NavBarProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onRerun: () => void;
  auditedAt?: string;
  loading: boolean;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "seo", label: "SEO" },
  { id: "og", label: "Open Graph" },
];

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function NavBar({ tab, onTabChange, onRerun, auditedAt, loading }: NavBarProps) {
  return (
    <nav
      className="flex items-center justify-between px-6 h-14 bg-card border-b-2 border-border"
      style={{ boxShadow: "0 4px 0px #000" }}
    >
      {/* Logo */}
      <span className="font-pixel text-primary text-xs tracking-tight whitespace-nowrap">
        is-pinoy.dev
      </span>

      {/* Tabs */}
      <div className="flex items-center gap-0">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={[
              "font-pixel text-[10px] px-4 h-14 border-x border-border transition-colors",
              tab === id
                ? "text-primary border-b-2 border-b-primary bg-background"
                : "text-muted-foreground hover:text-foreground border-b-2 border-b-transparent",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right: timestamp + re-run */}
      <div className="flex items-center gap-4">
        {auditedAt && (
          <span className="font-pixel text-[8px] text-muted-foreground hidden sm:block">
            {formatTimestamp(auditedAt)}
          </span>
        )}
        <button
          onClick={onRerun}
          disabled={loading}
          className="font-pixel text-[9px] px-3 py-2 border-2 border-primary text-primary disabled:opacity-40 hover:bg-primary hover:text-primary-foreground transition-colors"
          style={{ boxShadow: loading ? "none" : "3px 3px 0px #000" }}
        >
          {loading ? "SCANNING..." : "RE-RUN"}
        </button>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter site-audit typecheck
```

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add tools/site-audit/src/components/nav-bar.tsx
git commit -m "feat(site-audit): add NavBar component"
```

---

## Task 7: Create ScoreCard Component

**Files:**
- Create: `tools/site-audit/src/components/score-card.tsx`

- [ ] **Step 1: Create `tools/site-audit/src/components/score-card.tsx`**

```tsx
import type { AuditCategory } from "@is-pinoy-dev/schemas";

interface ScoreCardProps {
  label: string;
  category: AuditCategory;
}

function scoreColor(score: number): string {
  if (score >= 80) return "border-primary text-primary";
  if (score >= 50) return "border-yellow-400 text-yellow-400";
  return "border-destructive text-destructive";
}

function scoreShadow(score: number): string {
  if (score >= 80) return "4px 4px 0px #D4A800";
  if (score >= 50) return "4px 4px 0px #000";
  return "4px 4px 0px #8B0000";
}

export function ScoreCard({ label, category }: ScoreCardProps) {
  const passed = category.fields.filter((f) => f.status === "pass").length;
  const total = category.fields.length;
  const colorClass = scoreColor(category.score);
  const shadow = scoreShadow(category.score);

  return (
    <div
      className={`bg-card border-2 p-6 flex flex-col gap-3 ${colorClass}`}
      style={{ boxShadow: shadow }}
    >
      <p className="font-pixel text-[9px] text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
      <p className={`font-pixel text-4xl ${colorClass.split(" ")[1]}`}>
        {category.score}
        <span className="text-lg">%</span>
      </p>
      <p className="font-pixel text-[8px] text-muted-foreground">
        {passed}/{total} CHECKS PASSED
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter site-audit typecheck
```

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add tools/site-audit/src/components/score-card.tsx
git commit -m "feat(site-audit): add ScoreCard component"
```

---

## Task 8: Create IssueList Component

**Files:**
- Create: `tools/site-audit/src/components/issue-list.tsx`

- [ ] **Step 1: Create `tools/site-audit/src/components/issue-list.tsx`**

```tsx
import type { AuditCategory, AuditField } from "@is-pinoy-dev/schemas";

interface IssueListProps {
  seo: AuditCategory;
  og: AuditCategory;
}

function StatusBadge({ status }: { status: AuditField["status"] }) {
  const styles = {
    pass: "bg-primary text-primary-foreground",
    warn: "bg-yellow-400 text-black",
    fail: "bg-destructive text-white",
  };
  return (
    <span
      className={`font-pixel text-[7px] px-2 py-1 ${styles[status]}`}
      style={{ boxShadow: "2px 2px 0px #000" }}
    >
      {status.toUpperCase()}
    </span>
  );
}

export function IssueList({ seo, og }: IssueListProps) {
  const issues = [
    ...seo.fields.filter((f) => f.status !== "pass").map((f) => ({ ...f, category: "SEO" })),
    ...og.fields.filter((f) => f.status !== "pass").map((f) => ({ ...f, category: "OG" })),
  ];

  if (issues.length === 0) {
    return (
      <div
        className="bg-card border-2 border-primary p-6 text-center"
        style={{ boxShadow: "4px 4px 0px #D4A800" }}
      >
        <p className="font-pixel text-primary text-xs">ALL CHECKS PASSED</p>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-border" style={{ boxShadow: "4px 4px 0px #000" }}>
      <div className="border-b-2 border-border px-4 py-3">
        <p className="font-pixel text-[9px] text-foreground">
          ISSUES ({issues.length})
        </p>
      </div>
      <ul className="divide-y divide-border">
        {issues.map((issue, i) => (
          <li key={i} className="flex items-start gap-4 px-4 py-3">
            <StatusBadge status={issue.status} />
            <div className="flex-1 min-w-0">
              <p className="font-pixel text-[9px] text-foreground">
                <span className="text-muted-foreground">[{issue.category}]</span>{" "}
                {issue.label}
              </p>
              {issue.message && (
                <p className="font-pixel text-[8px] text-muted-foreground mt-1">
                  {issue.message}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter site-audit typecheck
```

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add tools/site-audit/src/components/issue-list.tsx
git commit -m "feat(site-audit): add IssueList component"
```

---

## Task 9: Create AuditTable Component

**Files:**
- Create: `tools/site-audit/src/components/audit-table.tsx`

- [ ] **Step 1: Create `tools/site-audit/src/components/audit-table.tsx`**

```tsx
import type { AuditField } from "@is-pinoy-dev/schemas";

interface AuditTableProps {
  fields: AuditField[];
}

function StatusBadge({ status }: { status: AuditField["status"] }) {
  const styles = {
    pass: "bg-primary text-primary-foreground",
    warn: "bg-yellow-400 text-black",
    fail: "bg-destructive text-white",
  };
  return (
    <span
      className={`font-pixel text-[7px] px-2 py-1 whitespace-nowrap ${styles[status]}`}
      style={{ boxShadow: "2px 2px 0px #000" }}
    >
      {status.toUpperCase()}
    </span>
  );
}

function truncate(value: string, max = 60): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function AuditTable({ fields }: AuditTableProps) {
  return (
    <div
      className="bg-card border-2 border-border"
      style={{ boxShadow: "4px 4px 0px #000" }}
    >
      <div className="grid grid-cols-[1fr_2fr_auto] border-b-2 border-border px-4 py-2 gap-4">
        <p className="font-pixel text-[8px] text-muted-foreground">FIELD</p>
        <p className="font-pixel text-[8px] text-muted-foreground">VALUE</p>
        <p className="font-pixel text-[8px] text-muted-foreground">STATUS</p>
      </div>
      <ul className="divide-y divide-border">
        {fields.map((field, i) => (
          <li
            key={i}
            className="grid grid-cols-[1fr_2fr_auto] items-center gap-4 px-4 py-3"
          >
            <p className="font-pixel text-[9px] text-foreground">{field.label}</p>
            <p className="font-pixel text-[8px] text-muted-foreground break-all">
              {field.value ? truncate(field.value) : (
                <span className="text-destructive">Not found</span>
              )}
            </p>
            <StatusBadge status={field.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter site-audit typecheck
```

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add tools/site-audit/src/components/audit-table.tsx
git commit -m "feat(site-audit): add AuditTable component"
```

---

## Task 10: Wire Up Dashboard in `home.tsx`

**Files:**
- Modify: `tools/site-audit/src/routes/home.tsx`

- [ ] **Step 1: Replace `tools/site-audit/src/routes/home.tsx`**

```tsx
import { useState, useEffect } from "react";
import type { AuditResult } from "@is-pinoy-dev/schemas";
import type { Tab } from "../lib/types";
import { parseAudit } from "../lib/parse-audit";
import { NavBar } from "../components/nav-bar";
import { ScoreCard } from "../components/score-card";
import { IssueList } from "../components/issue-list";
import { AuditTable } from "../components/audit-table";

type State =
  | { status: "loading" }
  | { status: "result"; data: AuditResult }
  | { status: "error"; message: string };

export function meta() {
  return [
    { title: "Site Audit — is-pinoy.dev" },
    { name: "description", content: "SEO and OpenGraph audit tool" },
  ];
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");
  const [state, setState] = useState<State>({ status: "loading" });

  async function runAudit() {
    setState({ status: "loading" });
    const target = `https://${window.location.hostname}`;
    try {
      const res = await fetch(
        `/audit-proxy?url=${encodeURIComponent(target)}`
      );
      if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
      const html = await res.text();
      setState({ status: "result", data: parseAudit(html, target) });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  useEffect(() => {
    runAudit();
  }, []);

  const result = state.status === "result" ? state.data : undefined;

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        tab={tab}
        onTabChange={setTab}
        onRerun={runAudit}
        auditedAt={result?.auditedAt}
        loading={state.status === "loading"}
      />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {state.status === "loading" && (
          <p className="font-pixel text-primary text-xs animate-pulse">
            SCANNING...
          </p>
        )}

        {state.status === "error" && (
          <div className="space-y-4">
            <p className="font-pixel text-destructive text-xs">
              ERROR: {state.message}
            </p>
            <button
              onClick={runAudit}
              className="font-pixel text-[9px] px-4 py-2 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              style={{ boxShadow: "3px 3px 0px #000" }}
            >
              RETRY
            </button>
          </div>
        )}

        {state.status === "result" && result && (
          <>
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <ScoreCard label="SEO Score" category={result.seo} />
                  <ScoreCard label="Open Graph Score" category={result.og} />
                </div>
                <IssueList seo={result.seo} og={result.og} />
              </div>
            )}
            {tab === "seo" && (
              <div className="space-y-4">
                <p className="font-pixel text-[9px] text-muted-foreground">
                  SEO — {result.seo.fields.filter((f) => f.status === "pass").length}/
                  {result.seo.fields.length} PASSED
                </p>
                <AuditTable fields={result.seo.fields} />
              </div>
            )}
            {tab === "og" && (
              <div className="space-y-4">
                <p className="font-pixel text-[9px] text-muted-foreground">
                  OPEN GRAPH — {result.og.fields.filter((f) => f.status === "pass").length}/
                  {result.og.fields.length} PASSED
                </p>
                <AuditTable fields={result.og.fields} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter site-audit typecheck
```

Expected: exits 0

- [ ] **Step 3: Start dev server and manually verify**

```bash
pnpm --filter site-audit dev
```

Open `http://localhost:5173`:
- Dark background with scanline visible
- Nav shows "is-pinoy.dev" logo left, 3 tabs center, "SCANNING..." button right
- After load: score cards appear on Overview tab
- Click SEO tab → field table renders
- Click Open Graph tab → field table renders
- Click RE-RUN → "SCANNING..." state → results reload

- [ ] **Step 4: Commit**

```bash
git add tools/site-audit/src/routes/home.tsx
git commit -m "feat(site-audit): wire up full dashboard with tab navigation"
```

---

## Task 11: Delete Boilerplate

**Files:**
- Delete: `tools/site-audit/src/welcome/welcome.tsx`
- Delete: `tools/site-audit/src/routes/home.tsx` (old import — already replaced in Task 10)

- [ ] **Step 1: Delete welcome boilerplate**

```bash
rm -rf tools/site-audit/src/welcome
```

- [ ] **Step 2: Typecheck to confirm no dangling imports**

```bash
pnpm --filter site-audit typecheck
```

Expected: exits 0

- [ ] **Step 3: Commit**

```bash
git add -A tools/site-audit/src/welcome
git commit -m "chore(site-audit): remove React Router boilerplate"
```
