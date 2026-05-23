"use client"

import { useState } from "react"
import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { ScanlineOverlay } from "@/components/scanline-overlay"

function SubdomainInput() {
  const [value, setValue] = useState("")

  const handleClaim = () => {
    window.open("https://github.com/is-pinoy-dev/domains", "_blank", "noopener,noreferrer")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleClaim()
  }

  const monoStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
    lineHeight: 1,
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "stretch",
      border: "3px solid #F5C800",
      boxShadow: "6px 6px 0 #FAFAF5, 0 0 24px rgba(245,200,0,0.12)",
      maxWidth: "560px",
      width: "100%",
    }}>
      {/* Input zone: input + suffix share one dark background */}
      <div style={{
        position: "relative",
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        backgroundColor: "#0D0D0D",
      }}>
        {/* Real input — placeholder hidden, replaced by overlay below */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
        {/* Animated placeholder — visible only when input is empty */}
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
      <div style={{
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

      {/* Claim button */}
      <button
        onClick={handleClaim}
        style={{
          fontFamily: "var(--font-pixel)",
          fontSize: "9px",
          color: "#0D0D0D",
          backgroundColor: "#F5C800",
          border: "none",
          padding: "18px 24px",
          cursor: "pointer",
          letterSpacing: "0.05em",
          transition: "background-color 0.1s ease",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#FFE566" }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F5C800" }}
      >
        CLAIM
      </button>
    </div>
  )
}

export default function Page() {
  return (
    <>
      <ScanlineOverlay />
      <MainNav />

      <main style={{ minHeight: "100vh" }}>
        {/* Gold Marquee Strip — top, below fixed nav */}
        <div style={{
          marginTop: "64px",
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
            {[0, 1].map((i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-pixel)",
                  fontSize: "10px",
                  color: "#0D0D0D",
                  whiteSpace: "nowrap",
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

        {/* Hero Section */}
        <section style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 40px 100px",
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

          {/* Subdomain input */}
          <SubdomainInput />
        </section>

        {/* Footer */}
        <footer style={{
          padding: "24px 40px",
          textAlign: "center",
          borderTop: "2px solid #1A1A1A",
        }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "#444444",
            letterSpacing: "0.0625em",
            textTransform: "uppercase",
          }}>
            © 2026 is-pinoy-dev
            {" · "}
            <Link
              href="/tos"
              style={{
                color: "#888888",
                textDecoration: "none",
                transition: "color 0.1s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#F5C800" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#888888" }}
            >
              Terms of Service
            </Link>
          </span>
        </footer>
      </main>
    </>
  )
}
