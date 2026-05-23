"use client"

import Image from "next/image"
import Link from "next/link"

export function MainNav() {
  return (
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
        aria-label="Visit is-pinoy-dev on GitHub"
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
  )
}
