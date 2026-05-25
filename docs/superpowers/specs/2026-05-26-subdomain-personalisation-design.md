# Subdomain Personalisation in Docs

**Date:** 2026-05-26  
**Status:** Approved

## Problem

The docs use `yourname` as a placeholder throughout code blocks and prose (filenames, CLI commands, JSON fields). Readers must mentally substitute their own subdomain on every occurrence, which is error-prone and breaks copy-paste flow.

## Goal

Let users type their subdomain once and have `yourname` replaced everywhere in the docs — in code blocks and inline text — persisted across page loads.

## Approach

Zustand store (persisted to localStorage) + custom MDX `pre`/`code` components that substitute `yourname` at render time + a `<SubdomainInput />` component authors embed in MDX.

## Architecture

```
apps/docs/src/
  store/
    subdomain.ts            ← Zustand store, key "subdomain-name", default "yourname"
  components/
    subdomain-input.tsx     ← Input widget, reads/writes the store
    mdx.tsx                 ← existing; add pre and code overrides
```

## Components

### `store/subdomain.ts`
- Single field: `name: string` (default `"yourname"`)
- `setName(name: string)` action
- Persisted to localStorage under key `"ispinoydev-subdomain"`
- Validation: lowercase alphanumeric + hyphens, 1–63 chars; silently ignore invalid input

### `SubdomainInput` (`components/subdomain-input.tsx`)
- Client component
- Renders a styled text input pre-filled with the current store value
- Updates the store on change (debounced 300ms)
- Shows a live preview: `{value}.is-pinoy.dev`
- Styled to match the landing page subdomain widget (pixel font, gold border)
- Embeddable in MDX as `<SubdomainInput />`

### Custom `pre` and `code` MDX overrides (`components/mdx.tsx`)
- Both are client components that read `name` from the store
- Replace all occurrences of `yourname` in their text content with `name`
- `pre`: wraps `defaultMdxComponents.pre`, extracts raw text from children, runs replace, passes modified children through
- `code` (inline): same pattern for inline code spans
- Substitution is pure string replace — no regex needed since placeholder is a fixed string

## Data Flow

```
User types in <SubdomainInput />
  → store.setName("jun")
    → pre/code components re-render
      → "yourname" → "jun" in all code blocks
```

## What It Does NOT Do

- Does not substitute `yourname` in plain prose text (only `pre` and `code` blocks) — prose is static MDX, not easily patched at runtime without walking the DOM
- Does not validate on the server — client-only
- Does not sync across tabs (localStorage reads happen once on mount)

## Dependencies

- `zustand` (new, ~3kb gzipped) — install in `apps/docs`
