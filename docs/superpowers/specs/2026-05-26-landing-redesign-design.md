# Landing Page Redesign + Subdomain Availability Checker

**Date:** 2026-05-26
**Branch:** feat/redesign-landing

## Overview

Redesign the `apps/web` landing page while preserving the retro pixel-art design system. Three new sections are added below the hero (Provider Guides, Docs, improved Footer), and the hero subdomain input is upgraded from a "CLAIM" CTA to an interactive availability checker.

---

## Section 1: Hero + Subdomain Availability Checker

### Layout
Unchanged: full-viewport-height, marquee, scanline overlay, fixed nav. Headline and eyebrow badge remain.

### Subdomain Input Changes
- CTA button label changes from **"CLAIM"** to **"CHECK"**
- On submit: fetch `https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains/{subdomain}.json`
  - `200` → subdomain is **taken**
  - `404` → subdomain is **available**

### Result States

**Loading:** Animated blinking cursor or pixel dots while fetching.

**Taken:** A result card appears below the input showing:
- GitHub avatar: `https://github.com/{username}.png` (username parsed from JSON response)
- GitHub username in IBM Plex Mono
- Muted "already claimed" label
- Gold `3px` border, `5px 5px 0 #000` shadow (standard pixel-art card style)

**Available:** A gold-bordered card showing:
- `✓ {subdomain}.is-pinoy.dev is available!` in Press Start 2P (gold)
- "CLAIM IT →" button linking to `https://docs.is-pinoy.dev` (getting started)
- Same pixel-art card style with gold border

### Data
The GitHub username is read from `owner.github` in the fetched JSON. Example record shape:
```json
{
  "subdomain": "jun",
  "owner": { "github": "bosquejun", "email": "..." },
  "records": { "CNAME": { "value": "..." } }
}
```

---

## Section 2: Provider Guides Grid

### Heading
`// PROVIDER GUIDES` in Press Start 2P, gold color.

### Layout
- 4-column grid on desktop, 2-column on mobile
- Gold `2px` pixel-art divider line separating this section from the hero

### Cards

| Provider | Status | Link |
|----------|--------|------|
| Vercel | **Active** | `https://docs.is-pinoy.dev/providers/vercel` |
| Netlify | Coming Soon | — |
| GitHub Pages | Coming Soon | — |
| Cloudflare Pages | Coming Soon | — |

**Active card (Vercel):**
- Provider logo + "Vercel" name
- Gold `3px` border, `5px 5px 0 #D4A800` shadow
- Full hover lift effect: `translate(-3px, -3px)` + `6px 6px 0 #D4A800`
- Links to provider docs page

**Coming Soon cards:**
- Same card shape, `opacity: 0.4`, `cursor: not-allowed`
- "COMING SOON" badge overlaid (muted color, Press Start 2P, 8px)
- No hover effect, no link

---

## Section 3: Docs Section

### Heading
`// DOCUMENTATION` in Press Start 2P, gold color.

### Layout
3-column grid on desktop, 1-column on mobile.

### Cards

| Title | Description | Link |
|-------|-------------|------|
| Getting Started | Set up your subdomain in minutes | `https://docs.is-pinoy.dev` |
| CLI Reference | Validate, diff, and sync via terminal | `https://docs.is-pinoy.dev/cli` |
| Registry Schema | Understand the JSON record format | `https://docs.is-pinoy.dev/registry` |

Each card:
- Icon (simple pixel-style symbol or emoji prefix)
- Title in Press Start 2P (small, ~0.6rem)
- Short description in IBM Plex Sans
- Gold "→" link indicator at bottom-right
- Gold `3px` border, `5px 5px 0 #000` shadow
- Hover lift effect consistent with design system

---

## Section 4: Improved Footer

### Layout
3-column grid on desktop, stacked on mobile.

| Column | Content |
|--------|---------|
| Left | "is-pinoy.dev" in Press Start 2P + tagline "Free subdomains for Filipino developers." in IBM Plex Sans |
| Center | Two link groups: **Product** (Docs, CLI, Registry Schema) and **Legal** (Terms, Privacy) |
| Right | GitHub + Discord icon buttons, "Made with pride 🇵🇭" line in IBM Plex Sans muted |

### Bottom Bar
- Full-width gold `2px` border top
- Copyright line centered: `© 2026 is-pinoy.dev`
- Dark background (`#0D0D0D`), no rounded corners
- All links turn gold (`#F5C800`) on hover

---

## Availability Checker — Technical Notes

- Fetch is client-side (`"use client"` component or `useState`/`useEffect` in the hero)
- Handle network errors gracefully: show a neutral "Unable to check — try again" state
- Debounce or gate behind the CHECK button (not live-as-you-type) to avoid rate limiting GitHub raw content
- CORS: `raw.githubusercontent.com` allows browser fetches — no proxy needed

---

## Files to Change

| File | Change |
|------|--------|
| `apps/web/app/page.tsx` | Refactor hero input to checker; add Provider Guides, Docs sections |
| `apps/web/components/main-nav.tsx` | No changes expected |
| `apps/web/app/globals.css` | Add any new section animations if needed |
| Footer | Extracted into `apps/web/components/site-footer.tsx` (new component) |
| Provider grid | Extracted into `apps/web/components/provider-guides.tsx` (new component) |
| Docs section | Extracted into `apps/web/components/docs-section.tsx` (new component) |
| Subdomain checker | Extracted into `apps/web/components/subdomain-checker.tsx` (new component) |

---

## Design Constraints (non-negotiable)

- `border-radius: 0` everywhere
- Hard pixel shadows (`5px 5px 0 <color>`)
- Press Start 2P for headings/labels, IBM Plex Sans for body, IBM Plex Mono for code/metadata
- Primary color: `#F5C800` (Jeepney Gold)
- Background: `#0D0D0D`
- No blur in box-shadows
