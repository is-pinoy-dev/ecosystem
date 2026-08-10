import { Suspense } from "react"
import type { Metadata } from "next"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { MainNav } from "@/components/main-nav"
import { HeroSection } from "@/components/hero-section"
import { SubdomainChecker } from "@/components/subdomain-checker"
import {
  RecentlyClaimed,
  RecentlyClaimedSkeleton,
} from "@/components/recently-claimed"
import { HowClaimingWorks } from "@/components/how-claiming-works"
import { PortfolioFeature } from "@/components/portfolio-feature"
import { ThemeMarketplace } from "@/components/theme-marketplace"
import { ProviderGuides } from "@/components/provider-guides"
import { CommunitySection } from "@/components/cta-section"
import { ReportAbuseSection } from "@/components/report-abuse-section"
import { SiteFooter } from "@/components/site-footer"
import {
  ShowcaseHighlights,
  ShowcaseHighlightsSkeleton,
} from "@/components/showcase-grid"

export const metadata: Metadata = {
  title: "is-pinoy.dev — Free subdomains for Filipino developers.",
  description:
    "Claim a free is-pinoy.dev subdomain for your portfolio, project, or profile. Community-run for Filipino developers.",
  openGraph: {
    title: "is-pinoy.dev — Free subdomains for Filipino developers.",
    description:
      "Claim a free is-pinoy.dev subdomain for your portfolio, project, or profile. Community-run for Filipino developers.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "is-pinoy.dev — The home of Filipino developers.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "is-pinoy.dev — Free subdomains for Filipino developers.",
    description:
      "Claim a free is-pinoy.dev subdomain for your portfolio, project, or profile. Community-run for Filipino developers.",
    images: ["/opengraph-image"],
  },
}

export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <>
      <MainNav />

      <main className="min-h-screen">
        <HeroSection />

        <section
          id="claim"
          className="scroll-mt-16 border-b border-border bg-card py-10 md:py-12"
        >
          <Container className="flex justify-center">
            <SubdomainChecker />
          </Container>
        </section>

        <Suspense fallback={<RecentlyClaimedSkeleton />}>
          <RecentlyClaimed />
        </Suspense>
        <HowClaimingWorks />
        <PortfolioFeature />
        <ThemeMarketplace />

        <section
          className="border-b border-border py-7 sm:py-10 lg:py-12"
          aria-labelledby="showcase-title"
        >
          <Container>
            <h2 id="showcase-title" className="sr-only">
              Community showcase
            </h2>
            <p className="m-0 mb-4 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
              Built by Pinoy developers
            </p>
            <Suspense fallback={<ShowcaseHighlightsSkeleton />}>
              <ShowcaseHighlights />
            </Suspense>
          </Container>
        </section>

        <ProviderGuides />
        <CommunitySection />
        <ReportAbuseSection />
      </main>

      <SiteFooter />
    </>
  )
}
