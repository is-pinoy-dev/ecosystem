"use client"

import Link from "next/link"

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

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
      <div style={{
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
