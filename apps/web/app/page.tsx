import { MainNav } from "@/components/main-nav"
import { ScanlineOverlay } from "@/components/scanline-overlay"
import { TopMarquee } from "@/components/top-marquee"
import { SubdomainChecker } from "@/components/subdomain-checker"
import { ProviderGuides } from "@/components/provider-guides"
import { DocsSection } from "@/components/docs-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { ReportAbuseSection } from "@/components/report-abuse-section"
import { SiteFooter } from "@/components/site-footer"

export default function Page() {
  return (
    <>
      <ScanlineOverlay />
      <TopMarquee />
      <MainNav />

      <main className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <section className="xs:px-3.5 flex flex-1 flex-col items-center justify-center gap-8 px-10 pt-[220px] pb-[100px] text-center sm:px-5 sm:pt-[180px] sm:pb-[60px]">
          {/* Eyebrow badge */}
          <div
            className="border-2 border-primary bg-primary/10 px-4 py-2 font-pixel text-[8px] tracking-[0.1875em] text-primary uppercase"
            style={{ animation: "glow-pulse 2s ease-in-out infinite" }}
          >
            {"// FREE FOR FILIPINO DEVS"}
          </div>

          {/* Headline */}
          <h1
            className="m-0 flex max-w-[900px] flex-col items-center gap-4 font-pixel leading-[1.6] text-foreground"
            style={{ fontSize: "clamp(0.875rem, 2.5vw, 1.625rem)" }}
          >
            <span>Claim your</span>
            <span
              className="inline-block bg-primary px-8 py-3 tracking-[0.05em] text-background"
              style={{
                fontSize: "clamp(1.25rem, 4vw, 2.75rem)",
                animation:
                  "stamp-in 0.4s cubic-bezier(0.22,0.61,0.36,1) both, gold-flicker 6s ease-in-out 1s infinite",
              }}
            >
              PINOY PRIDE
            </span>
            <span>on the Web.</span>
          </h1>

          {/* Subheadline */}
          <p className="m-0 max-w-[480px] font-sans text-[15px] leading-[1.7] text-muted-foreground">
            A free subdomain for every Filipino developer. Open source,
            community-driven, forever free.
          </p>

          {/* Subdomain checker */}
          <SubdomainChecker />
        </section>

        {/* Documentation */}
        <DocsSection />

        {/* Provider Guides */}
        <ProviderGuides />

        {/* FAQ */}
        {/*<FAQSection />*/}

        {/* Report Abuse */}
        <ReportAbuseSection />

        {/* CTA */}
        <CTASection />

        {/* Footer */}
        <SiteFooter />
      </main>
    </>
  )
}
