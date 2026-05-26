"use client"

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
