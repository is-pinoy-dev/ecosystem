# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the `apps/web` landing page by upgrading the hero input to a subdomain availability checker and adding Provider Guides, Docs, and an improved Footer section.

**Architecture:** Four new/refactored components (`SubdomainChecker`, `ProviderGuides`, `DocsSection`, `SiteFooter`) are extracted from or replace inline code in `page.tsx`. All components use client-side React with inline styles following the existing pixel-art design system. The subdomain checker fetches from `raw.githubusercontent.com` directly in the browser (CORS allowed).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, inline styles matching the existing pixel-art design system (Press Start 2P + IBM Plex Sans + IBM Plex Mono fonts, `#F5C800` gold, `#0D0D0D` bg, hard pixel box-shadows, `border-radius: 0`).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/web/components/subdomain-checker.tsx` | **Create** | Input + CHECK button + result cards (taken/available/loading/error) |
| `apps/web/components/provider-guides.tsx` | **Create** | Provider guides grid section |
| `apps/web/components/docs-section.tsx` | **Create** | Documentation links grid section |
| `apps/web/components/site-footer.tsx` | **Create** | Full 3-column improved footer |
| `apps/web/app/page.tsx` | **Modify** | Import new components, remove inline `SubdomainInput` and old footer |
| `apps/web/app/globals.css` | **Modify** | Add responsive CSS classes for new sections |

---

## Task 1: Create `SubdomainChecker` component

**Files:**
- Create: `apps/web/components/subdomain-checker.tsx`

- [ ] **Step 1: Create the file with full implementation**

```tsx
"use client"

import { useState } from "react"
import Image from "next/image"

type CheckStatus = "idle" | "loading" | "taken" | "available" | "error"

interface SubdomainRecord {
  subdomain: string
  owner: { github: string; email: string }
  records: { CNAME?: { value: string } }
}

const monoStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "13px",
  lineHeight: 1,
}

const pixelStyle: React.CSSProperties = {
  fontFamily: "var(--font-pixel)",
}

const sansStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
}

function ResultCard({ status, subdomain, record }: {
  status: "taken" | "available" | "error"
  subdomain: string
  record: SubdomainRecord | null
}) {
  if (status === "error") {
    return (
      <div style={{
        marginTop: "16px",
        padding: "16px 20px",
        border: "3px solid #444444",
        boxShadow: "5px 5px 0 #000",
        backgroundColor: "#0D0D0D",
        maxWidth: "560px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <span style={{ ...monoStyle, color: "#888888" }}>
          Unable to check — try again.
        </span>
      </div>
    )
  }

  if (status === "taken" && record) {
    return (
      <div style={{
        marginTop: "16px",
        padding: "16px 20px",
        border: "3px solid #F5C800",
        boxShadow: "5px 5px 0 #000",
        backgroundColor: "#0D0D0D",
        maxWidth: "560px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <Image
          src={`https://github.com/${record.owner.github}.png?size=48`}
          alt={record.owner.github}
          width={48}
          height={48}
          style={{ imageRendering: "pixelated", border: "2px solid #F5C800", flexShrink: 0 }}
          unoptimized
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ ...monoStyle, color: "#FAFAF5", fontSize: "14px" }}>
            @{record.owner.github}
          </span>
          <span style={{ ...sansStyle, fontSize: "13px", color: "#888888" }}>
            {subdomain}.is-pinoy.dev is already claimed.
          </span>
        </div>
      </div>
    )
  }

  // available
  return (
    <div style={{
      marginTop: "16px",
      padding: "20px 24px",
      border: "3px solid #F5C800",
      boxShadow: "5px 5px 0 #D4A800",
      backgroundColor: "rgba(245,200,0,0.06)",
      maxWidth: "560px",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      flexWrap: "wrap",
    }}>
      <span style={{
        ...pixelStyle,
        fontSize: "9px",
        color: "#F5C800",
        lineHeight: 1.6,
      }}>
        ✓ {subdomain}.is-pinoy.dev is available!
      </span>
      <a
        href="https://docs.is-pinoy.dev"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          ...pixelStyle,
          fontSize: "9px",
          color: "#0D0D0D",
          backgroundColor: "#F5C800",
          border: "none",
          padding: "12px 20px",
          cursor: "pointer",
          letterSpacing: "0.05em",
          textDecoration: "none",
          display: "inline-block",
          transition: "background-color 0.1s ease, box-shadow 0.1s ease, transform 0.1s ease",
          boxShadow: "3px 3px 0 #D4A800",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#FFE566"
          e.currentTarget.style.boxShadow = "1px 1px 0 #D4A800"
          e.currentTarget.style.transform = "translate(2px, 2px)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#F5C800"
          e.currentTarget.style.boxShadow = "3px 3px 0 #D4A800"
          e.currentTarget.style.transform = "translate(0, 0)"
        }}
      >
        CLAIM IT →
      </a>
    </div>
  )
}

export function SubdomainChecker() {
  const [value, setValue] = useState("")
  const [status, setStatus] = useState<CheckStatus>("idle")
  const [record, setRecord] = useState<SubdomainRecord | null>(null)
  const [checkedSubdomain, setCheckedSubdomain] = useState("")

  const handleCheck = async () => {
    const subdomain = value.trim().toLowerCase()
    if (!subdomain) return

    setStatus("loading")
    setCheckedSubdomain(subdomain)

    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains/${subdomain}.json`,
        { cache: "no-store" }
      )

      if (res.ok) {
        const data: SubdomainRecord = await res.json()
        setRecord(data)
        setStatus("taken")
      } else if (res.status === 404) {
        setRecord(null)
        setStatus("available")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCheck()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    if (status !== "idle") setStatus("idle")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "560px" }}>
      {/* Input row */}
      <div style={{
        display: "flex",
        alignItems: "stretch",
        border: "3px solid #F5C800",
        boxShadow: "6px 6px 0 #FAFAF5, 0 0 24px rgba(245,200,0,0.12)",
        width: "100%",
      }}>
        {/* Input zone */}
        <div style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          backgroundColor: "#0D0D0D",
        }}>
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            style={{
              ...monoStyle,
              color: "#FAFAF5",
              backgroundColor: "transparent",
              border: "none",
              padding: "18px 8px 18px 16px",
              width: "100%",
              outline: "none",
              caretColor: "#F5C800",
              position: "relative",
              zIndex: 1,
            }}
          />
          {value === "" && (
            <div
              aria-hidden="true"
              style={{
                ...monoStyle,
                position: "absolute",
                left: "16px",
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
                color: "#444444",
                zIndex: 0,
                gap: "1px",
              }}
            >
              <span>yourname</span>
              <span className="blink" style={{ color: "#F5C800" }}>█</span>
            </div>
          )}
        </div>

        {/* Suffix */}
        <div className="subdomain-suffix" style={{
          ...monoStyle,
          color: "#3A3A3A",
          backgroundColor: "#0D0D0D",
          padding: "18px 12px 18px 0",
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          userSelect: "none",
          flexShrink: 0,
        }}>
          .is-pinoy.dev
        </div>

        {/* Divider */}
        <div style={{ width: "3px", backgroundColor: "#F5C800", flexShrink: 0 }} />

        {/* Check button */}
        <button
          onClick={handleCheck}
          disabled={status === "loading"}
          className="subdomain-claim-btn"
          style={{
            ...pixelStyle,
            fontSize: "9px",
            color: "#0D0D0D",
            backgroundColor: status === "loading" ? "#D4A800" : "#F5C800",
            border: "none",
            padding: "18px 24px",
            cursor: status === "loading" ? "not-allowed" : "pointer",
            letterSpacing: "0.05em",
            transition: "background-color 0.1s ease",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (status !== "loading") e.currentTarget.style.backgroundColor = "#FFE566"
          }}
          onMouseLeave={(e) => {
            if (status !== "loading") e.currentTarget.style.backgroundColor = "#F5C800"
          }}
        >
          {status === "loading" ? "..." : "CHECK"}
        </button>
      </div>

      {/* Result card */}
      {(status === "taken" || status === "available" || status === "error") && (
        <ResultCard status={status} subdomain={checkedSubdomain} record={record} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/junbosque/IsPinoyDev/ecosystem
pnpm --filter @is-pinoy-dev/web typecheck 2>&1 | head -30
```

Expected: no errors related to `subdomain-checker.tsx`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/subdomain-checker.tsx
git commit -m "feat(web): add SubdomainChecker component with GitHub availability check"
```

---

## Task 2: Create `ProviderGuides` component

**Files:**
- Create: `apps/web/components/provider-guides.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from "next/link"

const pixelStyle: React.CSSProperties = {
  fontFamily: "var(--font-pixel)",
}

const sansStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
}

interface Provider {
  name: string
  href: string | null
  active: boolean
  logo: React.ReactNode
}

function VercelLogo() {
  return (
    <svg width="32" height="28" viewBox="0 0 76 65" fill="#FAFAF5" aria-hidden="true">
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  )
}

function NetlifyLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 128 128" fill="#00C7B7" aria-hidden="true">
      <path d="M69.3 36.4l-4.4-4.4-25.5 25.5 4.4 4.4 25.5-25.5zM58.7 91.6l4.4 4.4 25.5-25.5-4.4-4.4-25.5 25.5z"/>
      <path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64 64-28.7 64-64S99.3 0 64 0zm0 120c-30.9 0-56-25.1-56-56s25.1-56 56-56 56 25.1 56 56-25.1 56-56 56z"/>
    </svg>
  )
}

function GitHubPagesLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="#FAFAF5" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function CloudflareLogo() {
  return (
    <svg width="36" height="24" viewBox="0 0 109 44" fill="#F6821F" aria-hidden="true">
      <path d="M87.1 17.8c-.4-1.4-1-2.7-1.8-3.9-2.7-4.2-7.3-6.9-12.4-6.9-1.9 0-3.8.4-5.5 1.1C65.3 3.5 60 0 54 0c-9.3 0-16.9 7.1-17.5 16.2C30 17.7 24 23.7 24 31c0 7.2 5.8 13 13 13h49c6.1 0 11-4.9 11-11 0-6.8-5.8-12.2-9.9-15.2z"/>
    </svg>
  )
}

const PROVIDERS: Provider[] = [
  {
    name: "Vercel",
    href: "https://docs.is-pinoy.dev/providers/vercel",
    active: true,
    logo: <VercelLogo />,
  },
  {
    name: "Netlify",
    href: null,
    active: false,
    logo: <NetlifyLogo />,
  },
  {
    name: "GitHub Pages",
    href: null,
    active: false,
    logo: <GitHubPagesLogo />,
  },
  {
    name: "Cloudflare Pages",
    href: null,
    active: false,
    logo: <CloudflareLogo />,
  },
]

function ProviderCard({ provider }: { provider: Provider }) {
  const cardContent = (
    <div
      style={{
        border: "3px solid",
        borderColor: provider.active ? "#F5C800" : "#2A2A2A",
        boxShadow: provider.active ? "5px 5px 0 #D4A800" : "5px 5px 0 #111",
        backgroundColor: "#0D0D0D",
        padding: "28px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        position: "relative",
        opacity: provider.active ? 1 : 0.4,
        cursor: provider.active ? "pointer" : "not-allowed",
        transition: provider.active
          ? "box-shadow 0.1s ease, transform 0.1s ease"
          : undefined,
      }}
      onMouseEnter={provider.active ? (e) => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = "6px 6px 0 #D4A800"
        el.style.transform = "translate(-1px, -1px)"
      } : undefined}
      onMouseLeave={provider.active ? (e) => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = "5px 5px 0 #D4A800"
        el.style.transform = "translate(0, 0)"
      } : undefined}
    >
      {/* Coming soon badge */}
      {!provider.active && (
        <div style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          ...pixelStyle,
          fontSize: "7px",
          color: "#888888",
          border: "1px solid #444",
          padding: "3px 6px",
          letterSpacing: "0.05em",
        }}>
          COMING SOON
        </div>
      )}

      {/* Logo */}
      <div style={{ height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {provider.logo}
      </div>

      {/* Name */}
      <span style={{
        ...pixelStyle,
        fontSize: "8px",
        color: provider.active ? "#FAFAF5" : "#888888",
        letterSpacing: "0.05em",
        lineHeight: 1.6,
        textAlign: "center",
      }}>
        {provider.name}
      </span>
    </div>
  )

  if (provider.active && provider.href) {
    return (
      <Link href={provider.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        {cardContent}
      </Link>
    )
  }

  return cardContent
}

export function ProviderGuides() {
  return (
    <section style={{
      width: "100%",
      maxWidth: "960px",
      margin: "0 auto",
      padding: "80px 40px",
    }}>
      {/* Divider */}
      <div style={{
        height: "2px",
        backgroundColor: "#F5C800",
        marginBottom: "64px",
        boxShadow: "0 2px 0 #D4A800",
      }} />

      {/* Heading */}
      <h2 style={{
        fontFamily: "var(--font-pixel)",
        fontSize: "clamp(0.5rem, 1.5vw, 0.75rem)",
        color: "#F5C800",
        letterSpacing: "0.1em",
        marginBottom: "40px",
        lineHeight: 1.6,
      }}>
        {"// PROVIDER GUIDES"}
      </h2>

      {/* Grid */}
      <div className="provider-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
      }}>
        {PROVIDERS.map((p) => (
          <ProviderCard key={p.name} provider={p} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Add responsive CSS for provider grid to `globals.css`**

Open `apps/web/app/globals.css` and add before the final closing line:

```css
/* Provider guides grid responsive */
@media (max-width: 639px) {
  .provider-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/provider-guides.tsx apps/web/app/globals.css
git commit -m "feat(web): add ProviderGuides section component"
```

---

## Task 3: Create `DocsSection` component

**Files:**
- Create: `apps/web/components/docs-section.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from "next/link"

const pixelStyle: React.CSSProperties = {
  fontFamily: "var(--font-pixel)",
}

const sansStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
}

interface DocCard {
  icon: string
  title: string
  description: string
  href: string
}

const DOCS: DocCard[] = [
  {
    icon: "▶",
    title: "Getting Started",
    description: "Set up your subdomain in minutes.",
    href: "https://docs.is-pinoy.dev",
  },
  {
    icon: "$_",
    title: "CLI Reference",
    description: "Validate, diff, and sync via terminal.",
    href: "https://docs.is-pinoy.dev/cli",
  },
  {
    icon: "{ }",
    title: "Registry Schema",
    description: "Understand the JSON record format.",
    href: "https://docs.is-pinoy.dev/registry",
  },
]

function DocCard({ card }: { card: DocCard }) {
  return (
    <Link
      href={card.href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          border: "3px solid #2A2A2A",
          boxShadow: "5px 5px 0 #000",
          backgroundColor: "#0D0D0D",
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          height: "100%",
          minHeight: "160px",
          position: "relative",
          transition: "box-shadow 0.1s ease, transform 0.1s ease, border-color 0.1s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = "#F5C800"
          el.style.boxShadow = "6px 6px 0 #D4A800"
          el.style.transform = "translate(-1px, -1px)"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = "#2A2A2A"
          el.style.boxShadow = "5px 5px 0 #000"
          el.style.transform = "translate(0, 0)"
        }}
      >
        {/* Icon */}
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "18px",
          color: "#F5C800",
          lineHeight: 1,
        }}>
          {card.icon}
        </span>

        {/* Title */}
        <span style={{
          ...pixelStyle,
          fontSize: "0.6rem",
          color: "#FAFAF5",
          lineHeight: 1.6,
          letterSpacing: "0.03em",
        }}>
          {card.title}
        </span>

        {/* Description */}
        <span style={{
          ...sansStyle,
          fontSize: "14px",
          color: "#888888",
          lineHeight: 1.7,
        }}>
          {card.description}
        </span>

        {/* Arrow */}
        <span style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          fontFamily: "var(--font-mono)",
          fontSize: "16px",
          color: "#F5C800",
        }}>
          →
        </span>
      </div>
    </Link>
  )
}

export function DocsSection() {
  return (
    <section style={{
      width: "100%",
      maxWidth: "960px",
      margin: "0 auto",
      padding: "0 40px 80px",
    }}>
      {/* Heading */}
      <h2 style={{
        fontFamily: "var(--font-pixel)",
        fontSize: "clamp(0.5rem, 1.5vw, 0.75rem)",
        color: "#F5C800",
        letterSpacing: "0.1em",
        marginBottom: "40px",
        lineHeight: 1.6,
      }}>
        {"// DOCUMENTATION"}
      </h2>

      {/* Grid */}
      <div className="docs-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
      }}>
        {DOCS.map((doc) => (
          <DocCard key={doc.href} card={doc} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Add responsive CSS for docs grid to `globals.css`**

Open `apps/web/app/globals.css` and inside the existing `@media (max-width: 639px)` block, add:

```css
  .docs-grid {
    grid-template-columns: 1fr !important;
  }
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/docs-section.tsx apps/web/app/globals.css
git commit -m "feat(web): add DocsSection component"
```

---

## Task 4: Create `SiteFooter` component

**Files:**
- Create: `apps/web/components/site-footer.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from "next/link"

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

function FooterLink({ href, external, children }: {
  href: string
  external?: boolean
  children: React.ReactNode
}) {
  const linkStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "13px",
    color: "#888888",
    textDecoration: "none",
    transition: "color 0.1s ease",
    lineHeight: 1.7,
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#F5C800" }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#888888" }}
      >
        {children}
      </a>
    )
  }

  return (
    <Link
      href={href}
      style={linkStyle}
      onMouseEnter={(e) => { e.currentTarget.style.color = "#F5C800" }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "#888888" }}
    >
      {children}
    </Link>
  )
}

function IconLink({ href, label, children }: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        border: "2px solid #2A2A2A",
        color: "#888888",
        backgroundColor: "#0D0D0D",
        transition: "border-color 0.1s ease, color 0.1s ease",
        boxShadow: "3px 3px 0 #111",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#F5C800"
        e.currentTarget.style.color = "#F5C800"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2A2A2A"
        e.currentTarget.style.color = "#888888"
      }}
    >
      {children}
    </a>
  )
}

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "2px solid #F5C800", backgroundColor: "#0D0D0D" }}>
      {/* Main footer grid */}
      <div className="footer-grid" style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "48px 40px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "40px",
        alignItems: "start",
      }}>
        {/* Left: Logo + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{
            fontFamily: "var(--font-pixel)",
            fontSize: "0.65rem",
            color: "#F5C800",
            lineHeight: 1.6,
            letterSpacing: "0.05em",
          }}>
            is-pinoy.dev
          </span>
          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            color: "#888888",
            lineHeight: 1.7,
            maxWidth: "220px",
          }}>
            Free subdomains for Filipino developers. Open source, community-driven, forever free.
          </span>
        </div>

        {/* Center: Link groups */}
        <div style={{ display: "flex", gap: "40px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "7px",
              color: "#FAFAF5",
              letterSpacing: "0.1em",
              lineHeight: 1.6,
              marginBottom: "4px",
            }}>
              PRODUCT
            </span>
            <FooterLink href="https://docs.is-pinoy.dev" external>Docs</FooterLink>
            <FooterLink href="https://docs.is-pinoy.dev/cli" external>CLI</FooterLink>
            <FooterLink href="https://docs.is-pinoy.dev/registry" external>Registry Schema</FooterLink>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "7px",
              color: "#FAFAF5",
              letterSpacing: "0.1em",
              lineHeight: 1.6,
              marginBottom: "4px",
            }}>
              LEGAL
            </span>
            <FooterLink href="/tos">Terms of Service</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
          </div>
        </div>

        {/* Right: Social + pride */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <IconLink href={process.env.NEXT_PUBLIC_DISCORD_LINK ?? "#"} label="Join Discord">
              <DiscordIcon />
            </IconLink>
            <IconLink href="https://github.com/is-pinoy-dev" label="GitHub">
              <GitHubIcon />
            </IconLink>
          </div>
          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "#888888",
            lineHeight: 1.7,
          }}>
            Made with pride 🇵🇭
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: "1px solid #1A1A1A",
        padding: "16px 40px",
        textAlign: "center",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "#444444",
          letterSpacing: "0.0625em",
          textTransform: "uppercase",
        }}>
          © 2026 is-pinoy.dev
        </span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Add responsive CSS for footer grid to `globals.css`**

Inside the existing `@media (max-width: 639px)` block in `apps/web/app/globals.css`, add:

```css
  .footer-grid {
    grid-template-columns: 1fr !important;
  }
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/site-footer.tsx apps/web/app/globals.css
git commit -m "feat(web): add SiteFooter component"
```

---

## Task 5: Update `page.tsx` to wire everything together

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Replace the full contents of `apps/web/app/page.tsx`**

```tsx
import { MainNav } from "@/components/main-nav"
import { ScanlineOverlay } from "@/components/scanline-overlay"
import { TopMarquee } from "@/components/top-marquee"
import { SubdomainChecker } from "@/components/subdomain-checker"
import { ProviderGuides } from "@/components/provider-guides"
import { DocsSection } from "@/components/docs-section"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <>
      <ScanlineOverlay />
      <TopMarquee />
      <MainNav />

      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Hero Section */}
        <section className="hero-section" style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "110px 40px 100px",
          textAlign: "center",
          gap: "32px",
        }}>
          {/* Eyebrow badge */}
          <div style={{
            fontFamily: "var(--font-pixel)",
            fontSize: "8px",
            color: "#F5C800",
            backgroundColor: "rgba(245,200,0,0.1)",
            border: "2px solid #F5C800",
            padding: "8px 16px",
            letterSpacing: "0.1875em",
            textTransform: "uppercase",
            animation: "glow-pulse 2s ease-in-out infinite",
          }}>
            {"// FREE FOR FILIPINO DEVS"}
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "var(--font-pixel)",
            fontSize: "clamp(0.875rem, 2.5vw, 1.625rem)",
            color: "#FAFAF5",
            lineHeight: 1.6,
            margin: 0,
            maxWidth: "900px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}>
            <span>Claim your</span>
            <span style={{
              fontSize: "clamp(1.25rem, 4vw, 2.75rem)",
              color: "#0D0D0D",
              backgroundColor: "#F5C800",
              padding: "12px 32px",
              letterSpacing: "0.05em",
              display: "inline-block",
              animation: "stamp-in 0.4s cubic-bezier(0.22,0.61,0.36,1) both, gold-flicker 6s ease-in-out 1s infinite",
            }}>
              PINOY PRIDE
            </span>
            <span>on the Web.</span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontFamily: "var(--font-sans)",
            fontSize: "15px",
            color: "#888888",
            lineHeight: 1.7,
            margin: 0,
            maxWidth: "480px",
          }}>
            A free subdomain for every Filipino developer. Open source, community-driven, forever free.
          </p>

          {/* Subdomain checker */}
          <SubdomainChecker />
        </section>

        {/* Provider Guides */}
        <ProviderGuides />

        {/* Documentation */}
        <DocsSection />

        {/* Footer */}
        <SiteFooter />
      </main>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles clean**

```bash
cd /home/junbosque/IsPinoyDev/ecosystem
pnpm --filter @is-pinoy-dev/web typecheck 2>&1 | head -40
```

Expected: no errors.

- [ ] **Step 3: Run dev server and visually verify**

```bash
pnpm dev
```

Open `http://localhost:3000` and verify:
- Hero still renders with marquee, scanlines, nav
- Typing a subdomain and clicking CHECK shows loading state → taken card (with avatar) or available card
- Provider Guides section shows 4 cards (Vercel active, 3 dimmed with COMING SOON badge)
- Docs section shows 3 cards linking to docs
- Footer shows 3-column layout with links, social icons, "Made with pride 🇵🇭"
- Mobile viewport: provider grid is 2-col, docs grid is 1-col, footer stacks

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat(web): wire up redesigned landing page with all new sections"
```

---

## Task 6: Run lint and typecheck before PR

- [ ] **Step 1: Run typecheck and lint**

```bash
cd /home/junbosque/IsPinoyDev/ecosystem
pnpm typecheck && pnpm lint
```

Expected: no errors or warnings blocking the build.

- [ ] **Step 2: Fix any lint issues, then commit if needed**

If lint auto-fixes are applied:

```bash
git add -p
git commit -m "chore(web): lint fixes"
```

- [ ] **Step 3: Confirm dev server looks correct, then you're done**

The branch `feat/redesign-landing` is ready to open a PR to `main`.
