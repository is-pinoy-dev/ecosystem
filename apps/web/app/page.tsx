"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

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
            textAlign: "right",
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
              right: "8px",
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

      <main style={{ minHeight: "100vh" }}>
        {/* Hero Section */}
        <section style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 40px 100px",
          textAlign: "center",
          gap: "32px",
        }}>
          {/* Floating jeepney logo */}
          <Image
            src="/logo.png"
            alt="is-pinoy.dev jeepney"
            width={140}
            height={140}
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
      </main>
    </>
  )
}
