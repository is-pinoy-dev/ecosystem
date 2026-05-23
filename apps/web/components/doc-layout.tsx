"use client"

import Image from "next/image"
import Link from "next/link"

interface DocLayoutProps {
  title: string
  effectiveDate: string
  children: React.ReactNode
}

export function DocLayout({ title, effectiveDate, children }: DocLayoutProps) {
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
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image
            src="/logo.png"
            alt="is-pinoy.dev logo"
            width={48}
            height={48}
            style={{ height: "48px", width: "auto", imageRendering: "pixelated" }}
          />
        </Link>
        <a
          href="https://github.com/is-pinoy-dev"
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
          GITHUB
        </a>
      </nav>

      {/* Doc content */}
      <main style={{
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

        {/* MDX content with doc typography */}
        <div className="doc-content">
          {children}
        </div>

        {/* Footer back link */}
        <div style={{ marginTop: "64px", paddingTop: "32px", borderTop: "2px solid #2A2A2A" }}>
          <Link
            href="/"
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
