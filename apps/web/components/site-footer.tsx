"use client"

import Link from "next/link"
import { GitHubIcon, DiscordIcon } from "@/components/icons"

function FooterLink({ href, external, children }: {
  href: string
  external?: boolean
  children: React.ReactNode
}) {
  const linkStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "13px",
    color: "#888888",
    textDecoration: "none",
    transition: "color 0.1s ease",
    lineHeight: 1.7,
  }

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#F5C800" }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#888888" }}
      >
        {children}
      </a>
    )
  }

  return (
    <Link
      href={href}
      style={linkStyle}
      onMouseEnter={(e) => { e.currentTarget.style.color = "#F5C800" }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "#888888" }}
    >
      {children}
    </Link>
  )
}

function IconLink({ href, label, children }: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        border: "2px solid #2A2A2A",
        color: "#888888",
        backgroundColor: "#0D0D0D",
        transition: "border-color 0.1s ease, color 0.1s ease",
        boxShadow: "3px 3px 0 #111",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#F5C800"
        e.currentTarget.style.color = "#F5C800"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2A2A2A"
        e.currentTarget.style.color = "#888888"
      }}
    >
      {children}
    </a>
  )
}

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "2px solid #F5C800", backgroundColor: "#0D0D0D" }}>
      {/* Main footer grid */}
      <div className="footer-grid" style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "48px 40px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "40px",
        alignItems: "start",
      }}>
        {/* Left: Logo + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{
            fontFamily: "var(--font-pixel)",
            fontSize: "0.65rem",
            color: "#F5C800",
            lineHeight: 1.6,
            letterSpacing: "0.05em",
          }}>
            is-pinoy.dev
          </span>
          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            color: "#888888",
            lineHeight: 1.7,
            maxWidth: "220px",
          }}>
            Free subdomains for Filipino developers. Open source, community-driven, forever free.
          </span>
        </div>

        {/* Center: Link groups */}
        <div style={{ display: "flex", gap: "40px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "7px",
              color: "#FAFAF5",
              letterSpacing: "0.1em",
              lineHeight: 1.6,
              marginBottom: "4px",
            }}>
              PRODUCT
            </span>
            <FooterLink href="https://docs.is-pinoy.dev" external>Docs</FooterLink>
            <FooterLink href="https://docs.is-pinoy.dev/cli" external>CLI</FooterLink>
            <FooterLink href="https://docs.is-pinoy.dev/registry" external>Registry Schema</FooterLink>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "7px",
              color: "#FAFAF5",
              letterSpacing: "0.1em",
              lineHeight: 1.6,
              marginBottom: "4px",
            }}>
              LEGAL
            </span>
            <FooterLink href="/tos">Terms of Service</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
          </div>
        </div>

        {/* Right: Social + pride */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <IconLink href={process.env.NEXT_PUBLIC_DISCORD_LINK ?? "#"} label="Join Discord">
              <DiscordIcon />
            </IconLink>
            <IconLink href="https://github.com/is-pinoy-dev" label="GitHub">
              <GitHubIcon />
            </IconLink>
          </div>
          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "#888888",
            lineHeight: 1.7,
          }}>
            Made with pride 🇵🇭
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bar" style={{
        borderTop: "1px solid #1A1A1A",
        padding: "16px 40px",
        textAlign: "center",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "#444444",
          letterSpacing: "0.0625em",
          textTransform: "uppercase",
        }}>
          © 2026 is-pinoy.dev
        </span>
      </div>
    </footer>
  )
}
