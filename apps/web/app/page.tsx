import { MainNav } from "@/components/main-nav"
import { ScanlineOverlay } from "@/components/scanline-overlay"
import { TopMarquee } from "@/components/top-marquee"
import { SubdomainChecker } from "@/components/subdomain-checker"
import { ProviderGuides } from "@/components/provider-guides"
import { DocsSection } from "@/components/docs-section"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <>
      <ScanlineOverlay />
      <TopMarquee />
      <MainNav />

      <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Hero Section */}
        <section className="hero-section" style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "110px 40px 100px",
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

          {/* Subdomain checker */}
          <SubdomainChecker />
        </section>

        {/* Provider Guides */}
        <ProviderGuides />

        {/* Documentation */}
        <DocsSection />

        {/* Footer */}
        <SiteFooter />
      </main>
    </>
  )
}
