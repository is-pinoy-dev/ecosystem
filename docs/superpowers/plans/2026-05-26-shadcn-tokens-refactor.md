# Shadcn Components & Design Tokens Refactor — apps/web

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all native HTML tags with `@is-pinoy-dev/ui` shadcn components and all arbitrary Tailwind color/font values with semantic design tokens across every component file in `apps/web`.

**Architecture:** Install Card, Input, Badge shadcn components into `packages/ui` first, then update each `apps/web` component file independently. Files are parallel-safe after Task 1 completes. Token mapping: `#F5C800` → `text/bg/border-primary`, `#FAFAF5` → `text/bg-foreground`, `#0D0D0D` → `text/bg-background`, `#888888` → `text-muted-foreground`, `#2A2A2A` → `bg/border-card`, `#444444` → `border-border`/`text-muted`, `#D4A800` → `text/bg-primary-dark`, `#FFE566` → `bg-primary-light`. Font classes: `font-[family-name:var(--font-pixel)]` → `font-pixel`, `font-[family-name:var(--font-sans)]` → `font-sans`, `font-[family-name:var(--font-mono)]` → `font-mono`. Box-shadow values keep arbitrary syntax but use `var(--color-*)` references where a token exists.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, shadcn/ui (radix-lyra style), `@is-pinoy-dev/ui`

---

### Task 1: Install shadcn Card, Input, Badge into packages/ui

**Files:**
- Create: `packages/ui/src/components/card.tsx`
- Create: `packages/ui/src/components/input.tsx`
- Create: `packages/ui/src/components/badge.tsx`

- [ ] **Step 1: Install components**

```bash
pnpm --filter @is-pinoy-dev/ui dlx shadcn@latest add card input badge --yes
```

Expected: 3 new files in `packages/ui/src/components/`

- [ ] **Step 2: Verify files exist**

```bash
ls packages/ui/src/components/
```

Expected output: `badge.tsx  button.tsx  card.tsx  input.tsx`

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/components/card.tsx packages/ui/src/components/input.tsx packages/ui/src/components/badge.tsx
git commit -m "feat(ui): add card, input, badge shadcn components"
```

---

### Task 2: Refactor apps/web/app/page.tsx

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Replace arbitrary values with tokens**

Full file content:

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

      <main className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center pt-[220px] px-10 pb-[100px] text-center gap-8 sm:pt-[180px] sm:px-5 sm:pb-[60px] xs:px-3.5">
          {/* Eyebrow badge */}
          <div
            className="font-pixel text-[8px] text-primary bg-primary/10 border-2 border-primary px-4 py-2 tracking-[0.1875em] uppercase"
            style={{ animation: "glow-pulse 2s ease-in-out infinite" }}
          >
            {"// FREE FOR FILIPINO DEVS"}
          </div>

          {/* Headline */}
          <h1
            className="font-pixel text-foreground leading-[1.6] m-0 max-w-[900px] flex flex-col items-center gap-4"
            style={{ fontSize: "clamp(0.875rem, 2.5vw, 1.625rem)" }}
          >
            <span>Claim your</span>
            <span
              className="text-background bg-primary px-8 py-3 tracking-[0.05em] inline-block"
              style={{
                fontSize: "clamp(1.25rem, 4vw, 2.75rem)",
                animation:
                  "stamp-in 0.4s cubic-bezier(0.22,0.61,0.36,1) both, gold-flicker 6s ease-in-out 1s infinite",
              }}
            >
              PINOY PRIDE
            </span>
            <span>on the Web.</span>
          </h1>

          {/* Subheadline */}
          <p className="font-sans text-[15px] text-muted-foreground leading-[1.7] m-0 max-w-[480px]">
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

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @is-pinoy-dev/web typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "refactor(web): apply design tokens to page.tsx"
```

---

### Task 3: Refactor apps/web/components/scanline-overlay.tsx

**Files:**
- Modify: `apps/web/components/scanline-overlay.tsx`

- [ ] **Step 1: Convert positioning inline styles to Tailwind**

Full file content:

```tsx
export function ScanlineOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 2px, transparent 2px, transparent 4px)",
      }}
      aria-hidden="true"
    />
  )
}
```

The `backgroundImage` stays as inline style — repeating-linear-gradient cannot be expressed as a Tailwind utility.

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/scanline-overlay.tsx
git commit -m "refactor(web): convert ScanlineOverlay to Tailwind classes"
```

---

### Task 4: Refactor apps/web/components/top-marquee.tsx

**Files:**
- Modify: `apps/web/components/top-marquee.tsx`

- [ ] **Step 1: Convert inline styles to Tailwind + tokens**

Full file content:

```tsx
export function TopMarquee() {
  return (
    <div className="fixed top-0 right-0 left-0 z-[101] overflow-hidden bg-primary border-b-[3px] border-b-background py-[14px]">
      <div
        className="flex w-max"
        style={{ animation: "marquee-scroll 20s linear infinite" }}
      >
        {[0, 1].map((i) => (
          <span
            key={i}
            className="font-pixel text-[10px] text-background whitespace-nowrap"
          >
            <span className="text-primary-dark">★</span>
            {" LIBRE "}
            <span className="text-primary-dark">★</span>
            {" PARA SA MGA PINOY DEVELOPER "}
            <span className="text-primary-dark">★</span>
            {" FREE SUBDOMAINS "}
            <span className="text-primary-dark">★</span>
            {" IS-PINOY.DEV "}
            <span className="text-primary-dark">★</span>
            {" CLAIM YOURS NOW "}
            <span className="text-primary-dark">★</span>
            {" LIBRE "}
            <span className="text-primary-dark">★</span>
            {" PARA SA MGA PINOY DEVELOPER "}
            <span className="text-primary-dark">★</span>
            {" FREE SUBDOMAINS "}
            <span className="text-primary-dark">★</span>
            {" IS-PINOY.DEV "}
            <span className="text-primary-dark">★</span>
            {" CLAIM YOURS NOW "}
          </span>
        ))}
      </div>
    </div>
  )
}
```

The `animation` stays as inline style — keyframe animations defined in globals.css cannot be referenced via a standard Tailwind utility.

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/top-marquee.tsx
git commit -m "refactor(web): convert TopMarquee to Tailwind classes"
```

---

### Task 5: Refactor apps/web/components/main-nav.tsx

**Files:**
- Modify: `apps/web/components/main-nav.tsx`

- [ ] **Step 1: Replace `<a>` NavButton with Button asChild + tokens**

Full file content:

```tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { GitHubIcon, DiscordIcon } from "@/components/icons"

const btnBase =
  "font-pixel text-[9px] tracking-[0.05em] transition-all duration-100 px-4 py-[10px] hover:translate-x-[2px] hover:translate-y-[2px] h-auto"
const btnSolid =
  "text-background bg-primary shadow-[3px_3px_0_var(--color-foreground)] hover:bg-primary-light hover:shadow-[1px_1px_0_var(--color-foreground)]"
const btnOutline =
  "text-primary bg-transparent border-2 border-primary shadow-[3px_3px_0_var(--color-primary)] hover:bg-primary/10 hover:shadow-[1px_1px_0_var(--color-primary)]"

function NavButton({
  href,
  label,
  variant = "solid",
  children,
}: {
  href: string
  label: string
  variant?: "solid" | "outline"
  children: React.ReactNode
}) {
  return (
    <Button
      asChild
      className={`nav-btn ${btnBase} ${variant === "outline" ? btnOutline : btnSolid}`}
      aria-label={label}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    </Button>
  )
}

export function MainNav() {
  return (
    <nav className="nav-root fixed top-[46px] right-0 left-0 z-[100] flex h-16 items-center justify-between border-b-[3px] border-b-primary bg-background/85 px-8 backdrop-blur">
      <Link href="/" className="flex items-center gap-3 no-underline">
        <Image
          src="/logo.png"
          alt="is-pinoy.dev logo"
          width={48}
          height={48}
          className="h-10 w-auto [image-rendering:pixelated] hover:animate-spin"
        />
        <Image
          src="/banner.gif"
          alt="is-pinoy.dev"
          width={200}
          height={40}
          unoptimized
          className="-ml-4 hidden h-9 w-auto md:block"
        />
      </Link>
      <div className="flex gap-3">
        <NavButton
          href={process.env.NEXT_PUBLIC_DISCORD_LINK ?? "#"}
          label="Join is-pinoy-dev on Discord"
          variant="outline"
        >
          <DiscordIcon size={14} />
          <span className="nav-btn-text">DISCORD</span>
        </NavButton>
        <NavButton
          href="https://github.com/is-pinoy-dev"
          label="Visit is-pinoy-dev on GitHub"
        >
          <GitHubIcon size={14} />
          <span className="nav-btn-text">GITHUB</span>
        </NavButton>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @is-pinoy-dev/web typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/main-nav.tsx
git commit -m "refactor(web): use Button asChild in MainNav, apply design tokens"
```

---

### Task 6: Refactor apps/web/components/subdomain-checker.tsx

**Files:**
- Modify: `apps/web/components/subdomain-checker.tsx`

- [ ] **Step 1: Replace `<input>` with Input, `<button>` and `<a>` with Button, apply tokens**

Full file content:

```tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { RESERVED_SUBDOMAINS } from "@is-pinoy-dev/validate"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Input } from "@is-pinoy-dev/ui/components/input"

type CheckStatus = "idle" | "loading" | "taken" | "available" | "error"

interface SubdomainRecord {
  subdomain: string
  owner: { github: string; email: string }
  records: { CNAME?: { value: string } }
}

function ResultCard({
  status,
  subdomain,
  record,
}: {
  status: "taken" | "available" | "error"
  subdomain: string
  record: SubdomainRecord | null
}) {
  if (status === "error") {
    return (
      <div className="mt-4 flex w-full max-w-[560px] items-center gap-3 border-[3px] border-border bg-background px-5 py-4 shadow-[5px_5px_0_#000]">
        <span className="font-mono text-[13px] leading-none text-muted-foreground">
          Unable to check — try again.
        </span>
      </div>
    )
  }

  if (status === "taken" && !record) {
    return (
      <div className="mt-4 flex w-fit items-center gap-3 border-[3px] border-border bg-background px-5 py-4 shadow-[5px_5px_0_#000]">
        <span className="font-mono text-[13px] leading-none text-muted-foreground">
          <span className="text-primary">{subdomain}</span>.is-pinoy.dev is reserved.
        </span>
      </div>
    )
  }

  if (status === "taken" && record) {
    return (
      <div className="mt-4 flex w-fit items-center gap-4 border-[3px] border-primary bg-background px-5 py-4 shadow-[5px_5px_0_#000]">
        <Image
          src={`https://github.com/${record.owner.github}.png?size=48`}
          alt={record.owner.github}
          width={48}
          height={48}
          className="shrink-0 border-[2px] border-primary [image-rendering:pixelated]"
          unoptimized
        />
        <div className="flex flex-col items-start gap-[6px]">
          <span className="font-mono text-[14px] leading-none text-foreground">
            @{record.owner.github}
          </span>
          <span className="font-sans text-[13px] text-muted-foreground">
            <span className="font-mono text-primary">{subdomain}</span>
            .is-pinoy.dev is already claimed.
          </span>
        </div>
      </div>
    )
  }

  // available
  return (
    <div className="mt-4 flex w-full max-w-[560px] flex-wrap items-center justify-between gap-4 border-[3px] border-primary px-6 py-5 shadow-[5px_5px_0_var(--color-primary-dark)]">
      <span className="font-pixel text-[9px] leading-[1.6]">
        ✓ <span className="text-primary">{subdomain}</span>.is-pinoy.dev is available!
      </span>
      <Button
        asChild
        className="font-pixel text-[9px] tracking-[0.05em] text-background bg-primary shadow-[3px_3px_0_var(--color-primary-dark)] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-primary-light hover:shadow-[1px_1px_0_var(--color-primary-dark)] h-auto px-5 py-3"
      >
        <a
          href="https://docs.is-pinoy.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          CLAIM IT →
        </a>
      </Button>
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

    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      setRecord(null)
      setStatus("taken")
      return
    }

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
    <div className="flex w-full max-w-[560px] flex-col items-center">
      {/* Input row */}
      <div className="flex w-full items-stretch border-[3px] border-primary shadow-[6px_6px_0_var(--color-foreground),0_0_24px_rgba(245,200,0,0.12)]">
        {/* Input zone */}
        <div className="relative flex min-w-0 flex-1 items-center bg-background">
          <Input
            type="text"
            aria-label="Subdomain"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="relative z-[1] w-full border-none bg-transparent py-[18px] pr-2 pl-4 font-mono text-[13px] leading-none text-foreground caret-primary outline-none shadow-none focus-visible:ring-0 h-auto"
          />
          {value === "" && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 bottom-0 left-4 z-0 flex items-center gap-px font-mono text-[13px] leading-none text-muted"
            >
              <span>yourname</span>
              <span className="blink text-primary">█</span>
            </div>
          )}
        </div>

        {/* Suffix */}
        <div className="flex shrink-0 items-center bg-background py-[18px] pr-3 pl-0 font-mono text-[13px] leading-none whitespace-nowrap text-muted select-none max-[639px]:pr-1 sm:pr-[12px]">
          .is-pinoy.dev
        </div>

        {/* Divider */}
        <div className="w-[3px] shrink-0 bg-primary" />

        {/* Check button */}
        <Button
          type="button"
          aria-label={
            status === "loading" ? "Checking availability" : "Check availability"
          }
          onClick={handleCheck}
          disabled={status === "loading"}
          className={`shrink-0 border-none px-6 py-[18px] font-pixel text-[9px] tracking-[0.05em] whitespace-nowrap text-background transition-colors duration-100 hover:enabled:bg-primary-light h-auto max-[639px]:px-[14px] ${
            status === "loading" ? "bg-primary-dark" : "bg-primary"
          }`}
        >
          {status === "loading" ? "..." : "CHECK"}
        </Button>
      </div>

      {/* Result card */}
      {(status === "taken" || status === "available" || status === "error") && (
        <ResultCard
          status={status}
          subdomain={checkedSubdomain}
          record={record}
        />
      )}
    </div>
  )
}
```

Note: Removed stray `console.log` debug line from the original. The `Input` component's default border/ring is stripped via `border-none shadow-none focus-visible:ring-0` so it adopts the parent row's border. Conditional bg on the CHECK button now uses Tailwind classes instead of inline `style={{ backgroundColor: ... }}`.

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @is-pinoy-dev/web typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/subdomain-checker.tsx
git commit -m "refactor(web): use Button + Input in SubdomainChecker, apply design tokens"
```

---

### Task 7: Refactor apps/web/components/provider-guides.tsx

**Files:**
- Modify: `apps/web/components/provider-guides.tsx`

- [ ] **Step 1: Replace card div with Card, badge div with Badge, apply tokens**

Full file content:

```tsx
import Link from "next/link"
import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"
import { Badge } from "@is-pinoy-dev/ui/components/badge"

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
  const card = (
    <Card
      className={`border-[3px] bg-background flex flex-col items-center gap-4 p-7 relative transition-all duration-100 ${
        provider.active
          ? "border-primary shadow-[5px_5px_0_var(--color-primary-dark)] cursor-pointer hover:shadow-[6px_6px_0_var(--color-primary-dark)] hover:-translate-x-px hover:-translate-y-px"
          : "border-card shadow-[5px_5px_0_#111] opacity-40 cursor-not-allowed"
      }`}
    >
      <CardContent className="flex flex-col items-center gap-4 p-0 w-full relative">
        {!provider.active && (
          <Badge
            variant="outline"
            className="absolute top-0 right-0 font-pixel text-[7px] text-muted-foreground border-border px-[6px] py-[3px] tracking-[0.05em]"
          >
            COMING SOON
          </Badge>
        )}
        <div className="h-9 flex items-center justify-center">
          {provider.logo}
        </div>
        <span
          className={`font-pixel text-[8px] tracking-[0.05em] leading-[1.6] text-center ${
            provider.active ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {provider.name}
        </span>
      </CardContent>
    </Card>
  )

  if (provider.active && provider.href) {
    return (
      <Link href={provider.href} target="_blank" rel="noopener noreferrer" className="no-underline">
        {card}
      </Link>
    )
  }

  return card
}

export function ProviderGuides() {
  return (
    <section className="w-full max-w-[960px] mx-auto py-20 px-10">
      <div className="h-[2px] bg-primary mb-16 shadow-[0_2px_0_var(--color-primary-dark)]" />
      <h2
        className="font-pixel text-primary tracking-[0.1em] mb-10 leading-[1.6]"
        style={{ fontSize: "clamp(0.5rem, 1.5vw, 0.75rem)" }}
      >
        {"// PROVIDER GUIDES"}
      </h2>
      <div className="grid grid-cols-4 gap-4 max-sm:grid-cols-2">
        {PROVIDERS.map((p) => (
          <ProviderCard key={p.name} provider={p} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @is-pinoy-dev/web typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/provider-guides.tsx
git commit -m "refactor(web): use Card + Badge in ProviderGuides, apply design tokens"
```

---

### Task 8: Refactor apps/web/components/docs-section.tsx

**Files:**
- Modify: `apps/web/components/docs-section.tsx`

- [ ] **Step 1: Replace card div with Card, apply tokens**

Full file content:

```tsx
import Link from "next/link"
import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"

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
      className="no-underline group"
    >
      <Card className="border-[3px] border-card shadow-[5px_5px_0_#000] bg-background p-7 flex flex-col gap-4 h-full min-h-[160px] relative transition-all duration-100 cursor-pointer group-hover:border-primary group-hover:shadow-[6px_6px_0_var(--color-primary-dark)] group-hover:-translate-x-px group-hover:-translate-y-px">
        <CardContent className="flex flex-col gap-4 p-0">
          <span className="font-mono text-[18px] text-primary leading-none">
            {card.icon}
          </span>
          <span className="font-pixel text-[0.6rem] text-foreground leading-[1.6] tracking-[0.03em]">
            {card.title}
          </span>
          <span className="font-sans text-[14px] text-muted-foreground leading-[1.7]">
            {card.description}
          </span>
          <span className="absolute bottom-5 right-5 font-mono text-[16px] text-primary">
            →
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}

export function DocsSection() {
  return (
    <section className="w-full max-w-[960px] mx-auto px-10 pb-20">
      <h2
        className="font-pixel text-primary tracking-[0.1em] mb-10 leading-[1.6]"
        style={{ fontSize: "clamp(0.5rem, 1.5vw, 0.75rem)" }}
      >
        {"// DOCUMENTATION"}
      </h2>
      <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
        {DOCS.map((doc) => (
          <DocCard key={doc.href} card={doc} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @is-pinoy-dev/web typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/docs-section.tsx
git commit -m "refactor(web): use Card in DocsSection, apply design tokens"
```

---

### Task 9: Refactor apps/web/components/site-footer.tsx

**Files:**
- Modify: `apps/web/components/site-footer.tsx`

- [ ] **Step 1: Replace FooterLink `<a>`/`<Link>` and IconLink `<a>` with Button asChild, apply tokens**

Full file content:

```tsx
import Link from "next/link"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { GitHubIcon, DiscordIcon } from "@/components/icons"

function FooterLink({
  href,
  external,
  children,
}: {
  href: string
  external?: boolean
  children: React.ReactNode
}) {
  const linkClass =
    "font-sans text-[13px] text-muted-foreground no-underline leading-[1.7] transition-colors duration-100 hover:text-primary h-auto p-0 justify-start"

  if (external) {
    return (
      <Button asChild variant="link" className={linkClass}>
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      </Button>
    )
  }

  return (
    <Button asChild variant="link" className={linkClass}>
      <Link href={href}>{children}</Link>
    </Button>
  )
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="border-2 border-card text-muted-foreground bg-background shadow-[3px_3px_0_#111] transition-all duration-100 hover:border-primary hover:text-primary hover:bg-background"
      aria-label={label}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    </Button>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-primary bg-background">
      <div className="max-w-[960px] mx-auto py-12 px-10 grid grid-cols-3 gap-10 items-start max-sm:grid-cols-1">
        {/* Left: Logo + tagline */}
        <div className="flex flex-col gap-4">
          <span className="font-pixel text-[0.65rem] text-primary leading-[1.6] tracking-[0.05em]">
            is-pinoy.dev
          </span>
          <span className="font-sans text-[13px] text-muted-foreground leading-[1.7] max-w-[220px]">
            Free subdomains for Filipino developers. Open source, community-driven, forever free.
          </span>
        </div>

        {/* Center: Link groups */}
        <div className="flex gap-10">
          <div className="flex flex-col gap-3">
            <span className="font-pixel text-[7px] text-foreground tracking-[0.1em] leading-[1.6] mb-1">
              PRODUCT
            </span>
            <FooterLink href="https://docs.is-pinoy.dev" external>Docs</FooterLink>
            <FooterLink href="https://docs.is-pinoy.dev/cli" external>CLI</FooterLink>
            <FooterLink href="https://docs.is-pinoy.dev/registry" external>Registry Schema</FooterLink>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-pixel text-[7px] text-foreground tracking-[0.1em] leading-[1.6] mb-1">
              LEGAL
            </span>
            <FooterLink href="/tos">Terms of Service</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
          </div>
        </div>

        {/* Right: Social + pride */}
        <div className="flex flex-col gap-4 items-end">
          <div className="flex gap-2">
            <IconLink href={process.env.NEXT_PUBLIC_DISCORD_LINK ?? "#"} label="Join Discord">
              <DiscordIcon />
            </IconLink>
            <IconLink href="https://github.com/is-pinoy-dev" label="GitHub">
              <GitHubIcon />
            </IconLink>
          </div>
          <span className="font-sans text-[12px] text-muted-foreground leading-[1.7]">
            Made with pride 🇵🇭
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#1A1A1A] py-4 px-10 text-center max-sm:px-5 max-[479px]:px-3.5">
        <span className="font-mono text-[11px] text-muted tracking-[0.0625em] uppercase">
          © 2026 is-pinoy.dev
        </span>
      </div>
    </footer>
  )
}
```

Note: `border-[#1A1A1A]` in the bottom bar has no matching design token (`#1A1A1A` is between `--background` and `--card`) so it stays as an arbitrary value.

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @is-pinoy-dev/web typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/site-footer.tsx
git commit -m "refactor(web): use Button asChild in SiteFooter, apply design tokens"
```

---

### Task 10: Refactor apps/web/components/doc-layout.tsx

**Files:**
- Modify: `apps/web/components/doc-layout.tsx`

- [ ] **Step 1: Convert all inline styles to Tailwind + tokens, replace back-link with Button asChild**

Full file content:

```tsx
"use client"

import Link from "next/link"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { MainNav } from "@/components/main-nav"
import { ScanlineOverlay } from "@/components/scanline-overlay"
import { TopMarquee } from "@/components/top-marquee"

interface DocLayoutProps {
  title: string
  effectiveDate: string
  children: React.ReactNode
}

export function DocLayout({ title, effectiveDate, children }: DocLayoutProps) {
  return (
    <>
      <ScanlineOverlay />
      <TopMarquee />
      <MainNav />

      <main className="doc-main max-w-[700px] mx-auto pt-[150px] px-10 pb-20">
        {/* Eyebrow badge */}
        <div className="font-pixel text-[8px] text-primary bg-primary/10 border-2 border-primary px-4 py-2 tracking-[0.1875em] uppercase inline-block mb-6">
          {"// LEGAL"}
        </div>

        {/* Title */}
        <h1
          className="font-pixel text-foreground leading-[1.6] m-0 mb-4"
          style={{ fontSize: "clamp(0.875rem, 2.5vw, 1.625rem)" }}
        >
          {title}
        </h1>

        {/* Effective date */}
        <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.0625em] m-0 mb-8">
          Effective: {effectiveDate}
        </p>

        {/* Gold divider */}
        <div className="h-[3px] bg-primary mb-12" />

        {/* MDX content */}
        <article className="doc-content">{children}</article>

        {/* Back link */}
        <div className="mt-16 pt-8 border-t-2 border-card">
          <Button
            asChild
            variant="link"
            className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.0625em] transition-colors duration-100 hover:text-primary p-0 h-auto"
          >
            <Link href="/" aria-label="Back to home">
              ← BACK TO HOME
            </Link>
          </Button>
        </div>
      </main>
    </>
  )
}
```

Note: The `onMouseEnter`/`onMouseLeave` JS-based hover color toggle is replaced by `hover:text-primary` Tailwind class. All 7 inline style objects are now Tailwind classes.

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter @is-pinoy-dev/web typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/doc-layout.tsx
git commit -m "refactor(web): convert DocLayout inline styles to Tailwind, use Button asChild"
```

---

### Task 11: Final verification

- [ ] **Step 1: Full typecheck**

```bash
pnpm typecheck
```

Expected: no errors across all packages

- [ ] **Step 2: Lint**

```bash
pnpm lint
```

Expected: no errors

- [ ] **Step 3: Confirm no arbitrary color values remain in apps/web**

```bash
grep -r "text-\[#\|bg-\[#\|border-\[#\|text-\[rgba\|bg-\[rgba\|font-\[family" apps/web/app apps/web/components --include="*.tsx" -l
```

Expected: no files listed (or only files with legitimately untokenizable values like `border-[#1A1A1A]` in site-footer bottom bar)
