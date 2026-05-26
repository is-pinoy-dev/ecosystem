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

      <main className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center pt-[220px] px-10 pb-[100px] text-center gap-8 sm:pt-[180px] sm:px-5 sm:pb-[60px] xs:px-3.5">
          {/* Eyebrow badge */}
          <div
            className="font-pixel text-[8px] text-primary bg-primary/10 border-2 border-primary px-4 py-2 tracking-[0.1875em] uppercase"
            style={{ animation: "glow-pulse 2s ease-in-out infinite" }}
          >
            {"// FREE FOR FILIPINO DEVS"}
          </div>

          {/* Headline */}
          <h1
            className="font-pixel text-foreground leading-[1.6] m-0 max-w-[900px] flex flex-col items-center gap-4"
            style={{ fontSize: "clamp(0.875rem, 2.5vw, 1.625rem)" }}
          >
            <span>Claim your</span>
            <span
              className="text-background bg-primary px-8 py-3 tracking-[0.05em] inline-block"
              style={{
                fontSize: "clamp(1.25rem, 4vw, 2.75rem)",
                animation: "stamp-in 0.4s cubic-bezier(0.22,0.61,0.36,1) both, gold-flicker 6s ease-in-out 1s infinite",
              }}
            >
              PINOY PRIDE
            </span>
            <span>on the Web.</span>
          </h1>

          {/* Subheadline */}
          <p className="font-sans text-[15px] text-muted-foreground leading-[1.7] m-0 max-w-[480px]">
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
