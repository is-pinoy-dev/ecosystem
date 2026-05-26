"use client"

import Link from "next/link"

const pixelStyle: React.CSSProperties = {
  fontFamily: "var(--font-pixel)",
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
