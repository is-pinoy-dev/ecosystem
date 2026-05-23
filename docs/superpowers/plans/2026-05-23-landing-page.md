# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the is-pinoy.dev landing page — a full-viewport pixel-art hero with subdomain input + marquee strip in `apps/web`.

**Architecture:** Single `page.tsx` with all sections inlined as JSX blocks (no separate component files — the page is small enough to hold in context). A new `apps/web/app/globals.css` holds the pixel-specific styles (marquee animation, scanline overlay, pixel grid). `layout.tsx` loads the three required Google Fonts and imports both the workspace globals and the app globals.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, Google Fonts (Press Start 2P, IBM Plex Sans, IBM Plex Mono), plain CSS animations (no JS for marquee).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/web/public/logo.png` | Create (copy) | Serves the jeepney pixel-art logo via Next.js `<Image>` |
| `apps/web/app/globals.css` | Create | Marquee keyframe, scanline overlay, pixel grid, base resets |
| `apps/web/app/layout.tsx` | Modify | Load Press Start 2P / IBM Plex Sans / IBM Plex Mono, import globals.css, force dark base |
| `apps/web/app/page.tsx` | Modify | Full landing page: Nav + Hero + Marquee |

---

## Task 1: Copy logo and create public directory

**Files:**
- Create: `apps/web/public/logo.png`

- [ ] **Step 1: Create public dir and copy logo**

```bash
mkdir -p apps/web/public
cp logo.png apps/web/public/logo.png
```

- [ ] **Step 2: Verify**

```bash
ls apps/web/public/
```
Expected: `logo.png`

- [ ] **Step 3: Commit**

```bash
git add apps/web/public/logo.png
git commit -m "chore: add logo to web public assets"
```

---

## Task 2: Create app-level CSS with pixel-art styles

**Files:**
- Create: `apps/web/app/globals.css`

- [ ] **Step 1: Create the file**

```css
/* apps/web/app/globals.css */

/* Marquee scroll animation */
@keyframes marquee-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Jeepney logo float animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

/* Eyebrow badge glow pulse */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(245, 200, 0, 0.3); }
  50% { box-shadow: 0 0 20px rgba(245, 200, 0, 0.6); }
}

/* Pixel grid background - applied to body */
body {
  background-color: #0D0D0D;
  background-image:
    linear-gradient(rgba(245, 200, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245, 200, 0, 0.03) 1px, transparent 1px);
  background-size: 24px 24px;
  color: #FAFAF5;
}

/* Force no border-radius anywhere */
* {
  border-radius: 0 !important;
}
```

- [ ] **Step 2: Verify the file saved correctly**

```bash
head -5 apps/web/app/globals.css
```
Expected: first line is `/* apps/web/app/globals.css */`

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "feat: add pixel-art CSS animations and base styles"
```

---

## Task 3: Update layout.tsx with correct fonts and imports

**Files:**
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
import { Press_Start_2P, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import "@workspace/ui/globals.css"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
})

const sansFont = IBM_Plex_Sans({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-sans",
})

const monoFont = IBM_Plex_Mono({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <body className={`${pixelFont.variable} ${sansFont.variable} ${monoFont.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Start the dev server and verify no font errors**

```bash
cd apps/web && pnpm dev
```

Open `http://localhost:3000` — should load without console errors. Page will still show placeholder content; that's fine.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/layout.tsx
git commit -m "feat: configure pixel-art fonts for landing page"
```

---

## Task 4: Build the scanline overlay component (inline in page.tsx)

This is a `position: fixed` overlay — it must render as a client component or as a server component with inline styles. We'll use a simple `<div>` with inline styles in `page.tsx`.

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Replace page.tsx with the scanline overlay + shell**

```tsx
export default function Page() {
  return (
    <>
      {/* Scanline CRT overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 2px, transparent 2px, transparent 4px)",
          pointerEvents: "none",
          zIndex: 9999,
        }}
        aria-hidden="true"
      />

      <main style={{ minHeight: "100vh" }}>
        {/* Sections go here */}
      </main>
    </>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:3000` — you should see the dark background with a subtle CRT scanline effect across the full viewport (look closely — thin horizontal bands).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat: add scanline CRT overlay"
```

---

## Task 5: Build the fixed nav bar

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Add the nav section inside `<main>`**

Replace the `{/* Sections go here */}` comment with:

```tsx
{/* Fixed Navigation */}
<nav style={{
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 32px",
  height: "64px",
  backgroundColor: "rgba(13,13,13,0.85)",
  backdropFilter: "blur(8px)",
  borderBottom: "3px solid #F5C800",
}}>
  {/* Logo */}
  <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
    <img
      src="/logo.png"
      alt="is-pinoy.dev logo"
      style={{ height: "48px", width: "auto", imageRendering: "pixelated" }}
    />
  </a>

  {/* Nav CTA */}
  <a
    href="https://github.com/is-pinoy-dev/domains"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      fontFamily: "var(--font-pixel)",
      fontSize: "9px",
      color: "#0D0D0D",
      backgroundColor: "#F5C800",
      border: "3px solid #0D0D0D",
      padding: "10px 16px",
      textDecoration: "none",
      boxShadow: "3px 3px 0 #FAFAF5",
      display: "inline-block",
      transition: "all 0.1s ease",
      letterSpacing: "0.05em",
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget
      el.style.backgroundColor = "#FFE566"
      el.style.boxShadow = "1px 1px 0 #FAFAF5"
      el.style.transform = "translate(2px, 2px)"
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget
      el.style.backgroundColor = "#F5C800"
      el.style.boxShadow = "3px 3px 0 #FAFAF5"
      el.style.transform = "translate(0, 0)"
    }}
  >
    CLAIM YOUR SUBDOMAIN
  </a>
</nav>
```

Note: The file needs `"use client"` at the top because of `onMouseEnter`/`onMouseLeave`. Add it as the very first line.

- [ ] **Step 2: Add `"use client"` directive**

Add `"use client"` as the very first line of `apps/web/app/page.tsx`.

- [ ] **Step 3: Verify nav in browser**

`http://localhost:3000` — fixed gold-bordered nav bar at top with logo left and gold CTA button right. Hover the button — it should shift 2px and lighten.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat: add fixed pixel-art nav bar"
```

---

## Task 6: Build the hero section

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Add the hero section after the `</nav>` closing tag**

```tsx
{/* Hero Section */}
<section style={{
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: "64px",
  padding: "100px 40px",
  paddingTop: "120px",
  textAlign: "center",
  gap: "32px",
}}>
  {/* Floating jeepney logo */}
  <img
    src="/logo.png"
    alt="is-pinoy.dev jeepney"
    style={{
      width: "140px",
      height: "auto",
      imageRendering: "pixelated",
      animation: "float 5s ease-in-out infinite",
    }}
  />

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
    // FREE FOR FILIPINO DEVS
  </div>

  {/* Headline */}
  <h1 style={{
    fontFamily: "var(--font-pixel)",
    fontSize: "clamp(1rem, 3vw, 2.25rem)",
    color: "#FAFAF5",
    lineHeight: 1.6,
    margin: 0,
    maxWidth: "900px",
  }}>
    YOUR NAME.IS-PINOY.DEV
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

  {/* Subdomain input row */}
  <SubdomainInput />
</section>
```

- [ ] **Step 2: Add the SubdomainInput component before the Page function**

```tsx
function SubdomainInput() {
  const handleClaim = () => {
    window.open("https://github.com/is-pinoy-dev/domains", "_blank", "noopener,noreferrer")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleClaim()
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "stretch",
      boxShadow: "0 0 20px rgba(245,200,0,0.15)",
      maxWidth: "560px",
      width: "100%",
    }}>
      {/* Text input */}
      <input
        type="text"
        placeholder="yourname"
        onKeyDown={handleKeyDown}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          color: "#FAFAF5",
          backgroundColor: "#0D0D0D",
          border: "3px solid #F5C800",
          borderRight: "none",
          padding: "16px",
          flex: 1,
          minWidth: 0,
          outline: "none",
          caretColor: "#F5C800",
        }}
      />
      {/* Suffix label */}
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        color: "#888888",
        backgroundColor: "#0D0D0D",
        border: "3px solid #F5C800",
        borderLeft: "none",
        borderRight: "none",
        padding: "16px 8px 16px 0",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
      }}>
        .is-pinoy.dev
      </div>
      {/* Claim button */}
      <button
        onClick={handleClaim}
        style={{
          fontFamily: "var(--font-pixel)",
          fontSize: "9px",
          color: "#0D0D0D",
          backgroundColor: "#F5C800",
          border: "3px solid #0D0D0D",
          padding: "16px 20px",
          cursor: "pointer",
          letterSpacing: "0.05em",
          boxShadow: "5px 5px 0 #FAFAF5",
          transition: "all 0.1s ease",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.backgroundColor = "#FFE566"
          el.style.boxShadow = "2px 2px 0 #FAFAF5"
          el.style.transform = "translate(3px, 3px)"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.backgroundColor = "#F5C800"
          el.style.boxShadow = "5px 5px 0 #FAFAF5"
          el.style.transform = "translate(0, 0)"
        }}
      >
        CLAIM
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Verify hero in browser**

`http://localhost:3000` — floating jeepney logo, pulsing gold eyebrow badge, large pixel headline, muted subheadline, and the subdomain input row with attached CLAIM button. Clicking CLAIM or pressing Enter opens GitHub in a new tab.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat: add hero section with subdomain input"
```

---

## Task 7: Build the gold marquee strip

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Add the marquee section after the `</section>` closing tag of the hero**

```tsx
{/* Gold Marquee Strip */}
<div style={{
  backgroundColor: "#F5C800",
  borderTop: "3px solid #0D0D0D",
  borderBottom: "3px solid #0D0D0D",
  overflow: "hidden",
  padding: "14px 0",
}}>
  <div style={{
    display: "flex",
    width: "max-content",
    animation: "marquee-scroll 20s linear infinite",
  }}>
    {/* Two copies for seamless loop */}
    {[0, 1].map((i) => (
      <span
        key={i}
        style={{
          fontFamily: "var(--font-pixel)",
          fontSize: "10px",
          color: "#0D0D0D",
          whiteSpace: "nowrap",
          paddingRight: "0",
        }}
      >
        <span style={{ color: "#D4A800" }}>★</span>
        {" LIBRE "}
        <span style={{ color: "#D4A800" }}>★</span>
        {" PARA SA MGA PINOY DEVELOPER "}
        <span style={{ color: "#D4A800" }}>★</span>
        {" FREE SUBDOMAINS "}
        <span style={{ color: "#D4A800" }}>★</span>
        {" IS-PINOY.DEV "}
        <span style={{ color: "#D4A800" }}>★</span>
        {" CLAIM YOURS NOW "}
        <span style={{ color: "#D4A800" }}>★</span>
        {" LIBRE "}
        <span style={{ color: "#D4A800" }}>★</span>
        {" PARA SA MGA PINOY DEVELOPER "}
        <span style={{ color: "#D4A800" }}>★</span>
        {" FREE SUBDOMAINS "}
        <span style={{ color: "#D4A800" }}>★</span>
        {" IS-PINOY.DEV "}
        <span style={{ color: "#D4A800" }}>★</span>
        {" CLAIM YOURS NOW "}
      </span>
    ))}
  </div>
</div>
```

- [ ] **Step 2: Verify marquee in browser**

Scroll to the bottom of the hero — the gold strip with scrolling black text should be visible. Text scrolls continuously from right to left, loops seamlessly, no JS required (pure CSS animation).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat: add gold marquee strip with Filipino dev text"
```

---

## Task 8: Final verification and polish

**Files:**
- Modify: `apps/web/app/page.tsx` (minor fixes if needed)

- [ ] **Step 1: Check mobile layout at 375px width**

In browser DevTools, set viewport to 375px wide. Verify:
- Headline is readable (clamp should reduce it to ~1rem)
- Input row doesn't overflow horizontally
- Nav logo and CTA button both fit
- Marquee still scrolls

If the input row overflows on mobile, add this to the subdomain input outer div:
```tsx
flexWrap: "nowrap",
```
And add `fontSize: "11px"` to the input and suffix spans.

- [ ] **Step 2: Run typecheck**

```bash
cd apps/web && pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Run lint**

```bash
cd apps/web && pnpm lint
```
Expected: no errors (or only pre-existing warnings).

- [ ] **Step 4: Final commit**

```bash
git add apps/web/app/page.tsx
git commit -m "feat: landing page — hero, nav, marquee complete"
```
