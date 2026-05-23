"use client"

import Link from "next/link"
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

      <main className="doc-main" style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "120px 40px 80px",
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
          display: "inline-block",
          marginBottom: "24px",
        }}>
          {"// LEGAL"}
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "var(--font-pixel)",
          fontSize: "clamp(0.875rem, 2.5vw, 1.625rem)",
          color: "#FAFAF5",
          lineHeight: 1.6,
          margin: "0 0 16px",
        }}>
          {title}
        </h1>

        {/* Effective date */}
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "#888888",
          textTransform: "uppercase",
          letterSpacing: "0.0625em",
          margin: "0 0 32px",
        }}>
          Effective: {effectiveDate}
        </p>

        {/* Gold divider */}
        <div style={{
          height: "3px",
          backgroundColor: "#F5C800",
          marginBottom: "48px",
        }} />

        {/* MDX content */}
        <article className="doc-content">
          {children}
        </article>

        {/* Back link */}
        <div style={{ marginTop: "64px", paddingTop: "32px", borderTop: "2px solid #2A2A2A" }}>
          <Link
            href="/"
            aria-label="Back to home"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#888888",
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.0625em",
              transition: "color 0.1s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#F5C800" }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#888888" }}
          >
            ← BACK TO HOME
          </Link>
        </div>
      </main>
    </>
  )
}
