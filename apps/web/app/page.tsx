import { Suspense } from "react"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import {
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@is-pinoy-dev/ui/components/section-header"
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
import { ProgressLink } from "@/components/progress-link"
import {
  ShowcaseHighlights,
  ShowcaseHighlightsSkeleton,
} from "@/components/showcase-grid"
import { resolveFlagSet } from "@/lib/flags-server"

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

export default async function Page() {
  // The header resolves its own flags in the root layout; this reads them for the
  // two sections below, which are gated by the same `claims` flag as the nav
  // entries pointing at them.
  const flags = await resolveFlagSet()

  return (
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
      {/* Both sections lead to the dashboard's claim flow, which is behind
            the same flag — while it is off there is nothing to send people to. */}
      {flags.claims ? (
        <>
          <PortfolioFeature />
          <ThemeMarketplace />
        </>
      ) : null}

      <section
        className="border-b border-border bg-surface-subtle py-12 sm:py-14 lg:py-20"
        aria-labelledby="showcase-title"
      >
        <Container>
          <div className="mb-8 grid gap-6 border-b border-border pb-8 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.48fr)] md:items-end lg:mb-10 lg:pb-10">
            <SectionHeader>
              <SectionEyebrow>Community showcase</SectionEyebrow>
              <SectionTitle
                id="showcase-title"
                className="max-w-[560px] lg:text-[40px] lg:leading-[1.1]"
              >
                Built by Pinoy developers, shared with the world.
              </SectionTitle>
            </SectionHeader>

            <div className="flex flex-col items-start gap-5 md:items-end">
              <SectionDescription className="md:max-w-[390px] md:text-right">
                Explore portfolios, experiments, and ideas from developers
                across the Filipino community.
              </SectionDescription>
              <Button asChild variant="outline" className="bg-card">
                <ProgressLink href="/showcase">
                  View the full showcase
                  <ArrowRight aria-hidden="true" />
                </ProgressLink>
              </Button>
            </div>
          </div>

          <Suspense fallback={<ShowcaseHighlightsSkeleton />}>
            <ShowcaseHighlights />
          </Suspense>
        </Container>
      </section>

      <ProviderGuides />
      <CommunitySection />
      <ReportAbuseSection />
    </main>
  )
}
