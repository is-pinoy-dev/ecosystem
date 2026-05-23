"use client"

import Image from "next/image"
import Link from "next/link"

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
      border: "3px solid #F5C800",
      boxShadow: "6px 6px 0 #FAFAF5, 0 0 24px rgba(245,200,0,0.12)",
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
          border: "none",
          padding: "18px 16px",
          flex: 1,
          minWidth: 0,
          outline: "none",
          caretColor: "#F5C800",
        }}
      />
      {/* Suffix */}
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
        color: "#555555",
        backgroundColor: "#0D0D0D",
        padding: "18px 0 18px 2px",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}>
        .is-pinoy.dev
      </div>
      {/* Divider */}
      <div style={{
        width: "3px",
        backgroundColor: "#F5C800",
        flexShrink: 0,
      }} />
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
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#FFE566"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#F5C800"
        }}
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
              color: "#F5C800",
              border: "3px solid #F5C800",
              padding: "12px 28px",
              boxShadow: "5px 5px 0 #D4A800, 8px 8px 0 rgba(212,168,0,0.3)",
              letterSpacing: "0.05em",
              display: "inline-block",
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
