# Site Audit: SEO Coverage Improvements + Accordion Detail Rows

**Date:** 2026-05-27  
**Scope:** `tools/site-audit`

## Problem

The site-audit tool currently:
- Truncates field values to 60 characters with no way to see the full value
- Shows `message` only in the issues list (non-passing items only)
- Provides no guidelines or SEO impact context per field
- Missing 7 useful SEO checks: `theme-color`, `apple-touch-icon`, `manifest`, `hreflang`, `preload hints`, JSON-LD type detection, JSON-LD validity

## Solution

Replace flat table rows with accordion rows so each item can be expanded to reveal full detail. Add 7 new checks across the SEO and OG categories.

## Architecture

No new routes, no new dependencies, no schema changes. The `Accordion` component already exists in `@is-pinoy-dev/ui`. `AuditField.message` already exists in `packages/schemas/src/audit.ts`.

A new static file `src/lib/guidelines.ts` provides a lookup map keyed by field label:

```ts
type Guideline = { guideline: string; impact: string }
const GUIDELINES: Record<string, Guideline>
```

This covers all existing fields (19) and all new fields (7), totalling 26 entries.

## Components

### `audit-table.tsx`

Refactored from a plain `<table>` with `<tr>` rows to an Accordion list.

**Collapsed state (trigger):** identical to current layout — FIELD / truncated VALUE / STATUS badge.  
**Expanded state (content):** three stacked lines:
1. **Full value** — untruncated, `font-mono`
2. **Guideline** — short rule from `GUIDELINES[field.label].guideline`
3. **Impact** — one sentence from `GUIDELINES[field.label].impact`

The accordion uses `type="multiple"` so multiple rows can be open simultaneously. The existing pixel-art border and color-coded status styling is preserved on the trigger row.

### `guidelines.ts` (new)

Static lookup map. Example entries:

```ts
"Meta Description": {
  guideline: "Should be 50–160 characters.",
  impact: "Directly affects click-through rate in search results."
},
"JSON-LD type": {
  guideline: "Use a recognized schema.org @type (Article, FAQPage, Product, etc.).",
  impact: "Enables rich results (star ratings, FAQs, breadcrumbs) in Google Search."
}
```

## New Checks

### SEO category additions (7)

| Field | Element | Status logic |
|---|---|---|
| `theme-color` | `<meta name="theme-color">` | fail if absent |
| `apple-touch-icon` | `<link rel="apple-touch-icon">` | fail if absent |
| `manifest` | `<link rel="manifest">` | fail if absent |
| `hreflang` | `<link rel="alternate" hreflang>` | warn if absent (optional for single-lang sites) |
| `preload hints` | `<link rel="preload">` | warn if absent |
| `JSON-LD type` | Detects `@type` in JSON-LD; recognizes Article, FAQPage, Product, WebSite, Organization, LocalBusiness, BreadcrumbList | fail if no JSON-LD; warn if type unrecognized |
| `JSON-LD valid` | Parses JSON-LD content as valid JSON | fail if invalid JSON; pass if valid |

`hreflang` and `preload hints` are `warn` on absence — they are beneficial but not required, so they won't tank scores for sites that omit them intentionally.

JSON-LD type and JSON-LD valid are placed in the SEO category alongside the existing `Structured Data` check — not OG — since they describe document structure, not social sharing metadata.

## File Changes

| File | Type | Description |
|---|---|---|
| `tools/site-audit/src/components/audit-table.tsx` | Modify | Refactor rows to Accordion items |
| `tools/site-audit/src/lib/parse-audit.ts` | Modify | Add 5 SEO + 2 OG checks |
| `tools/site-audit/src/lib/guidelines.ts` | Create | Static guidelines + impact map (26 entries) |
| `packages/schemas/src/audit.ts` | No change | `AuditField.message` already exists |

## Score Impact

Scores are derived from `fields.filter(f => f.status === "pass").length / fields.length * 100`. Adding 7 new fields means a site missing all 7 will see score drops, but:
- 5 are `fail` on absence (legitimate signal)
- 2 (`hreflang`, `preload`) are `warn` only — softer signal

## Out of Scope

- Audit history / trend tracking
- Export to CSV/PDF
- Lighthouse performance / accessibility checks
- Content quality checks (word count, keyword density)
- Per-check customization / toggles
