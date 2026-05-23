# Terms of Service Page Design

**Date:** 2026-05-23  
**Status:** Approved  
**Scope:** `apps/web` — `/tos` route with MDX content and shared doc layout

---

## Overview

A Terms of Service page at `/tos` rendered via MDX. Content lives in `app/tos/page.mdx`. A reusable `DocLayout` component in `apps/web/components/doc-layout.tsx` wraps the MDX with nav, scanline overlay, and doc-specific typography — designed to be reused for future legal/doc pages (privacy policy, FAQ, etc.).

Operator: the **is-pinoy-dev GitHub organization** (community-run, no single legal entity).

---

## Architecture

- **MDX rendering:** `@next/mdx` + Next.js App Router native MDX support
- **Content:** `apps/web/app/tos/page.mdx`
- **Layout:** `apps/web/components/doc-layout.tsx` — imported in `apps/web/app/tos/layout.tsx`
- **Nav update:** Add `TOS` link in the landing page footer or as a subtle nav text link

### File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/web/next.config.mjs` | Modify | Enable `@next/mdx` MDX processing |
| `apps/web/components/doc-layout.tsx` | Create | Shared layout: nav, scanline, doc typography wrapper |
| `apps/web/app/tos/layout.tsx` | Create | Wraps page.mdx with DocLayout |
| `apps/web/app/tos/page.mdx` | Create | Full ToS content in MDX |
| `apps/web/app/page.tsx` | Modify | Add footer link to `/tos` |

---

## DocLayout Component

**Fixed nav** — identical to landing page: logo left, GITHUB button right (same styles, same links).

**Full-page overlays** — scanline CRT overlay (`position: fixed`, `z-index: 9999`) and pixel grid background (via `body` styles already in `globals.css`).

**Content column:**
- `max-width: 700px`, `margin: 0 auto`
- `padding: 120px 40px 80px` desktop, `60px 20px 60px` mobile (≤600px)

**Header block (top of content):**
- Eyebrow badge: `// LEGAL` — `Press Start 2P 8px`, gold text, faint gold bg, gold border, same style as hero eyebrow
- Page title passed as a prop — rendered in `Press Start 2P 1.625rem` (heading-lg), `color: #FAFAF5`
- Effective date passed as a prop — `IBM Plex Mono 11px`, `color: #888888`, `text-transform: uppercase`
- Gold divider: `3px solid #F5C800`, full width, `margin: 32px 0`

**MDX content typography:**
- `h2` — `Press Start 2P 0.6875rem` (heading-sm), `color: #FAFAF5`, `line-height: 1.6`, `margin-top: 48px`
- `p` — `IBM Plex Sans 15px`, `color: #FAFAF5`, `line-height: 1.7`, `margin: 16px 0`
- `ul` / `li` — `IBM Plex Sans 15px`, `color: #FAFAF5`, `line-height: 1.7`, list-style gold square (`■`)
- `strong` — `color: #F5C800` (gold)
- `a` — `color: #1E90FF` (accent-blue), no underline at rest, underline on hover

**Footer:**
- `← BACK TO HOME` link — `IBM Plex Mono 11px`, `color: #888888`, links to `/`, hover turns gold
- `margin-top: 64px`

---

## ToS Content

**Title:** Terms of Service  
**Effective date:** May 23, 2026

### Sections

1. **Acceptance of Terms** — By registering or using a subdomain on is-pinoy.dev, you agree to these terms. If you don't agree, don't use the service.

2. **What We Provide** — is-pinoy.dev offers free `yourname.is-pinoy.dev` subdomains for developers. This is a community-operated service run by the is-pinoy-dev open source organization. We provide no uptime guarantee, SLA, or warranty of any kind.

3. **Who Can Use This** — The service is open to all developers who respect these rules. You don't need to be Filipino to register — but you do need to be a developer building something real.

4. **Subdomain Rules** — You may not register or use a subdomain for:
   - Impersonating any person, brand, company, or organization
   - Phishing, malware distribution, spam, or any illegal activity
   - Squatting — registering names you don't actively use within 30 days
   - Content that is hateful, abusive, or violates applicable law
   - Reserved names (e.g. `www`, `api`, `mail`, `admin`, `help`, `support`, `status`)
   - Your subdomain must point to a real developer project: a portfolio, application, API, tool, or similar.

5. **Registration Process** — Subdomains are registered by opening a pull request to the `is-pinoy-dev/domains` GitHub repository. Maintainers may reject any request at their discretion, including for names they deem inappropriate, confusing, or in conflict with existing entries.

6. **Revocation** — The is-pinoy-dev maintainers reserve the right to remove any subdomain at any time, with or without prior notice, if it violates these terms or is otherwise deemed harmful to the community or service.

7. **No Warranty** — This is a best-effort community service provided **as-is**, with no guarantees of availability, reliability, or continued operation. We are not liable for any damages arising from your use of or inability to use this service.

8. **Changes to These Terms** — We may update these terms at any time. Continued use of your subdomain after changes are published constitutes acceptance of the new terms. Changes will be announced via the GitHub organization.

9. **Contact** — For questions, abuse reports, or removal requests, open an issue at **github.com/is-pinoy-dev**.

---

## Landing Page Update

Add a minimal footer to `apps/web/app/page.tsx` below the marquee strip:

- `color: #444444`, `IBM Plex Mono 11px`, centered
- Text: `© 2026 is-pinoy-dev · ` + `Terms of Service` link (→ `/tos`) in `#888888`, hover gold
- `padding: 24px 40px`

---

## Constraints

- Zero border-radius everywhere
- No blurred shadows
- `Press Start 2P` only for headings and eyebrow — never for body copy
- MDX prose rendered via `DocLayout` typography styles, not Tailwind prose plugin
