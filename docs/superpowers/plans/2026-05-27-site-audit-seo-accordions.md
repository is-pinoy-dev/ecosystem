# Site Audit: SEO Coverage Improvements + Accordion Detail Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 7 new SEO checks to the site-audit tool and replace flat table rows with accordion rows that expand to show the full value, a guideline, and SEO impact.

**Architecture:** A new static `guidelines.ts` file provides a lookup map keyed by field label. `parse-audit.ts` gains 7 new checks (5 SEO + 2 JSON-LD). `audit-table.tsx` is refactored from a plain list to an Accordion where each row expands to show detail. No new dependencies — `Accordion` already exists in `@is-pinoy-dev/ui`.

**Tech Stack:** React Router 7, Vite, TypeScript, Tailwind CSS v4, Radix UI Accordion via `@is-pinoy-dev/ui`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `tools/site-audit/src/lib/guidelines.ts` | Create | Static map: field label → `{ guideline, impact }` for all 31 fields |
| `tools/site-audit/src/lib/parse-audit.ts` | Modify | Add 7 new SEO checks (theme-color, apple-touch-icon, manifest, hreflang, preload hints, JSON-LD type, JSON-LD valid) |
| `tools/site-audit/src/components/audit-table.tsx` | Modify | Refactor rows to Accordion items with expanded detail panel |

---

### Task 1: Create `guidelines.ts`

**Files:**
- Create: `tools/site-audit/src/lib/guidelines.ts`

- [ ] **Step 1: Create the file**

```ts
type Guideline = { guideline: string; impact: string }

export const GUIDELINES: Record<string, Guideline> = {
  // SEO — existing
  "Title": {
    guideline: "Should be 10–60 characters and describe the page clearly.",
    impact: "The title is the primary clickable link in search results — it directly drives click-through rate.",
  },
  "Meta Description": {
    guideline: "Should be 50–160 characters and summarise the page content.",
    impact: "Displayed as the snippet under the title in search results; affects click-through rate.",
  },
  "Canonical URL": {
    guideline: "Set a canonical link to prevent duplicate-content penalties across URL variants.",
    impact: "Tells search engines which URL is the authoritative version of the page.",
  },
  "Robots": {
    guideline: "Use 'index, follow' to allow indexing, or 'noindex' to block it explicitly.",
    impact: "Controls whether search engines crawl and index this page.",
  },
  "H1 Tag": {
    guideline: "Every page should have exactly one H1 that matches the page topic.",
    impact: "The H1 is a strong relevance signal — search engines use it to understand page content.",
  },
  "HTML lang": {
    guideline: "Set the lang attribute on <html> (e.g. lang=\"en\") to declare the page language.",
    impact: "Helps search engines serve the correct language version to users and aids screen readers.",
  },
  "Viewport": {
    guideline: "Include <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
    impact: "Required for mobile-friendly rendering; Google penalises pages that fail mobile usability.",
  },
  "Charset": {
    guideline: "Declare charset (typically UTF-8) early in <head>.",
    impact: "Prevents character encoding errors that can corrupt visible text and metadata.",
  },
  "Structured Data": {
    guideline: "Add JSON-LD structured data using schema.org types relevant to your content.",
    impact: "Enables rich results (FAQ dropdowns, star ratings, breadcrumbs) in Google Search.",
  },
  "Favicon": {
    guideline: "Provide a favicon via <link rel=\"icon\">.",
    impact: "Improves brand recognition in browser tabs, bookmarks, and search result favicons.",
  },
  "Author": {
    guideline: "Add <meta name=\"author\" content=\"...\"> to attribute the content creator.",
    impact: "Contributes to E-E-A-T (Experience, Expertise, Authoritativeness, Trust) signals.",
  },
  "Image Alt Texts": {
    guideline: "Every meaningful image should have a descriptive alt attribute.",
    impact: "Required for accessibility (WCAG) and helps search engines index image content.",
  },
  // SEO — new
  "theme-color": {
    guideline: "Add <meta name=\"theme-color\" content=\"#hexcolor\"> to brand the browser chrome.",
    impact: "Colours the browser address bar on mobile Chrome; improves PWA and brand perception.",
  },
  "apple-touch-icon": {
    guideline: "Provide <link rel=\"apple-touch-icon\" href=\"/icon.png\"> at 180×180px.",
    impact: "Used when a user adds the site to their iOS home screen; missing it shows a screenshot instead.",
  },
  "manifest": {
    guideline: "Link a Web App Manifest via <link rel=\"manifest\" href=\"/manifest.json\">.",
    impact: "Required for PWA install prompts and proper display in Google's mobile search features.",
  },
  "hreflang": {
    guideline: "Add <link rel=\"alternate\" hreflang=\"x\"> for each language/region variant of the page.",
    impact: "Prevents duplicate-content issues between language variants and serves the correct locale to users.",
  },
  "preload hints": {
    guideline: "Use <link rel=\"preload\"> to hint the browser to fetch critical assets early.",
    impact: "Reduces render-blocking and improves LCP (Largest Contentful Paint), a Core Web Vital.",
  },
  "JSON-LD type": {
    guideline: "Use a recognised schema.org @type: Article, FAQPage, Product, WebSite, Organization, LocalBusiness, or BreadcrumbList.",
    impact: "A recognised type unlocks specific rich result formats (FAQ accordions, product prices, breadcrumbs) in Google.",
  },
  "JSON-LD valid": {
    guideline: "The JSON-LD script must be valid JSON — no trailing commas, unquoted keys, or syntax errors.",
    impact: "Invalid JSON-LD is silently ignored by Google; none of the structured data benefits apply.",
  },
  // OG
  "og:title": {
    guideline: "Should match or closely relate to the page <title>; ideally 40–95 characters.",
    impact: "The headline shown when the URL is shared on Facebook, LinkedIn, and other platforms.",
  },
  "og:description": {
    guideline: "A compelling 2–4 sentence summary; aim for 155–200 characters.",
    impact: "Displayed below the title in social shares; affects click-through rate from social channels.",
  },
  "og:image": {
    guideline: "Provide a 1200×630px image for best quality across all platforms.",
    impact: "The preview image shown in social cards — high-impact visual that drives engagement.",
  },
  "og:url": {
    guideline: "Set to the canonical URL of the page.",
    impact: "Ensures share counts aggregate on the canonical URL rather than splitting across variants.",
  },
  "og:type": {
    guideline: "Set to 'website' for most pages; use 'article' for blog posts.",
    impact: "Tells social platforms how to classify and display the content.",
  },
  "og:locale": {
    guideline: "Set to the locale of the page content (e.g. en_US, en_PH).",
    impact: "Helps social platforms serve the correct language version of the share card.",
  },
  "og:site_name": {
    guideline: "Set to your brand or site name.",
    impact: "Displayed as attribution in the share card on Facebook and LinkedIn.",
  },
  // Twitter
  "twitter:card": {
    guideline: "Use 'summary_large_image' for a big image card, or 'summary' for a small thumbnail.",
    impact: "Determines the visual layout of the card when the URL is shared on X/Twitter.",
  },
  "twitter:title": {
    guideline: "Should be under 70 characters for best display on Twitter/X.",
    impact: "The headline shown in the Twitter card; truncated beyond 70 characters.",
  },
  "twitter:description": {
    guideline: "Keep under 200 characters.",
    impact: "Shown below the title in the Twitter card; longer values are truncated.",
  },
  "twitter:image": {
    guideline: "Use a 1200×628px image with a 2:1 aspect ratio for large cards.",
    impact: "The preview image in the Twitter card — major driver of engagement on the platform.",
  },
  "twitter:site": {
    guideline: "Set to your Twitter/X @handle (e.g. @yoursite).",
    impact: "Displayed as attribution in the card and allows Twitter analytics to attribute traffic.",
  },
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter site-audit typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add tools/site-audit/src/lib/guidelines.ts
git commit -m "feat(site-audit): add SEO guidelines and impact lookup map"
```

---

### Task 2: Add 7 new checks to `parse-audit.ts`

**Files:**
- Modify: `tools/site-audit/src/lib/parse-audit.ts`

- [ ] **Step 1: Add new DOM extractions after the existing ones (after line 48, before `const seoFields`)**

Add these extractions after `const imagesWithoutAlt` block and before `const seoFields: AuditField[] = [`:

```ts
  const themeColor = getMeta(doc, "theme-color");
  const appleTouchIcon =
    doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href") ?? null;
  const manifest =
    doc.querySelector('link[rel="manifest"]')?.getAttribute("href") ?? null;
  const hreflang =
    doc.querySelector('link[rel="alternate"][hreflang]')?.getAttribute("hreflang") ?? null;
  const preloadHint =
    doc.querySelector('link[rel="preload"]')?.getAttribute("href") ?? null;

  const jsonLdScript = doc.querySelector('script[type="application/ld+json"]');
  const jsonLdText = jsonLdScript?.textContent ?? null;
  let jsonLdType: string | null = null;
  let jsonLdIsValid = false;
  if (jsonLdText) {
    try {
      const parsed = JSON.parse(jsonLdText) as Record<string, unknown>;
      jsonLdIsValid = true;
      jsonLdType = typeof parsed["@type"] === "string" ? parsed["@type"] : null;
    } catch {
      jsonLdIsValid = false;
    }
  }
```

- [ ] **Step 2: Append 7 new entries at the end of the `seoFields` array (after the `Image Alt Texts` entry, before the closing `]`)**

```ts
    themeColor
      ? { label: "theme-color", value: themeColor, status: "pass" }
      : { label: "theme-color", value: null, status: "fail", message: "Missing theme-color meta tag" },
    appleTouchIcon
      ? { label: "apple-touch-icon", value: appleTouchIcon, status: "pass" }
      : { label: "apple-touch-icon", value: null, status: "fail", message: "Missing apple-touch-icon link" },
    manifest
      ? { label: "manifest", value: manifest, status: "pass" }
      : { label: "manifest", value: null, status: "fail", message: "Missing web app manifest link" },
    hreflang
      ? { label: "hreflang", value: hreflang, status: "pass" }
      : { label: "hreflang", value: null, status: "warn", message: "No hreflang alternate links — add if serving multiple languages/regions" },
    preloadHint
      ? { label: "preload hints", value: preloadHint, status: "pass" }
      : { label: "preload hints", value: null, status: "warn", message: "No preload hints found — consider preloading critical fonts or images" },
    ((): AuditField => {
      const KNOWN_TYPES = ["Article", "FAQPage", "Product", "WebSite", "Organization", "LocalBusiness", "BreadcrumbList"];
      if (!jsonLdText)
        return { label: "JSON-LD type", value: null, status: "fail", message: "No JSON-LD found — add structured data first" };
      if (!jsonLdType || !KNOWN_TYPES.includes(jsonLdType))
        return { label: "JSON-LD type", value: jsonLdType ?? "unknown", status: "warn", message: `@type "${jsonLdType ?? "not set"}" is not a recognised rich-result type` };
      return { label: "JSON-LD type", value: jsonLdType, status: "pass" };
    })(),
    ((): AuditField => {
      if (!jsonLdText)
        return { label: "JSON-LD valid", value: null, status: "fail", message: "No JSON-LD script found" };
      if (!jsonLdIsValid)
        return { label: "JSON-LD valid", value: null, status: "fail", message: "JSON-LD script contains invalid JSON" };
      return { label: "JSON-LD valid", value: "Valid JSON", status: "pass" };
    })(),
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter site-audit typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add tools/site-audit/src/lib/parse-audit.ts
git commit -m "feat(site-audit): add 7 new SEO checks (theme-color, apple-touch-icon, manifest, hreflang, preload, JSON-LD type, JSON-LD valid)"
```

---

### Task 3: Refactor `audit-table.tsx` to Accordion rows

**Files:**
- Modify: `tools/site-audit/src/components/audit-table.tsx`

- [ ] **Step 1: Replace the file contents entirely**

```tsx
import type { AuditField } from "@is-pinoy-dev/schemas"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@is-pinoy-dev/ui/components/accordion"
import { GUIDELINES } from "../lib/guidelines"
import { StatusBadge } from "./status-badge"

interface AuditTableProps {
  fields: AuditField[]
}

function truncate(value: string, max = 60): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
}

export function AuditTable({ fields }: AuditTableProps) {
  return (
    <div className="border-2 border-border bg-card shadow-[4px_4px_0_var(--color-muted)]">
      <div className="grid grid-cols-[1fr_2fr_auto] gap-4 border-b-2 border-border px-4 py-2">
        <p className="font-pixel text-[11px] text-muted-foreground">FIELD</p>
        <p className="font-pixel text-[11px] text-muted-foreground">VALUE</p>
        <p className="font-pixel text-[11px] text-muted-foreground">STATUS</p>
      </div>
      <Accordion type="multiple" className="divide-y divide-border">
        {fields.map((field) => (
          <AccordionItem key={field.label} value={field.label} className="border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&>svg]:ml-2 [&>svg]:shrink-0">
              <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-4 w-full">
                <p className="text-[11px] text-foreground text-left">{field.label}</p>
                <p className="font-mono text-[11px] break-all text-muted-foreground text-left">
                  {field.value ? (
                    truncate(field.value)
                  ) : (
                    <span className="text-destructive">Not found</span>
                  )}
                </p>
                <StatusBadge status={field.status} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="flex flex-col gap-2 pt-1 border-t border-border/50 mt-1">
                {field.value && (
                  <div>
                    <span className="font-pixel text-[9px] text-muted-foreground uppercase tracking-wider">Full value</span>
                    <p className="font-mono text-[11px] text-foreground break-all mt-1">{field.value}</p>
                  </div>
                )}
                {field.message && (
                  <div>
                    <span className="font-pixel text-[9px] text-muted-foreground uppercase tracking-wider">Issue</span>
                    <p className="text-[11px] text-destructive mt-1">{field.message}</p>
                  </div>
                )}
                {GUIDELINES[field.label] && (
                  <>
                    <div>
                      <span className="font-pixel text-[9px] text-muted-foreground uppercase tracking-wider">Guideline</span>
                      <p className="text-[11px] text-foreground mt-1">{GUIDELINES[field.label].guideline}</p>
                    </div>
                    <div>
                      <span className="font-pixel text-[9px] text-muted-foreground uppercase tracking-wider">SEO Impact</span>
                      <p className="text-[11px] text-muted-foreground mt-1">{GUIDELINES[field.label].impact}</p>
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter site-audit typecheck
```

Expected: no errors.

- [ ] **Step 3: Build to confirm no runtime issues**

```bash
pnpm --filter site-audit build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add tools/site-audit/src/components/audit-table.tsx
git commit -m "feat(site-audit): refactor audit rows to accordion with full value, guideline, and SEO impact"
```
