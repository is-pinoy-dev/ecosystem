import { Suspense } from "react"
import { Code2, Sun, Users } from "lucide-react"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { MainNav } from "@/components/main-nav"
import { SubdomainChecker } from "@/components/subdomain-checker"
import {
  RecentlyClaimed,
  RecentlyClaimedSkeleton,
} from "@/components/recently-claimed"
import { HowClaimingWorks } from "@/components/how-claiming-works"
import { ProviderGuides } from "@/components/provider-guides"
import { CommunitySection } from "@/components/cta-section"
import { ReportAbuseSection } from "@/components/report-abuse-section"
import { SiteFooter } from "@/components/site-footer"
import {
  ShowcaseHighlights,
  ShowcaseHighlightsSkeleton,
} from "@/components/showcase-grid"

const TRUST_ITEMS = [
  { icon: Sun, label: "Always free", tone: "text-primary" },
  { icon: Code2, label: "Open source", tone: "text-foreground" },
  { icon: Users, label: "Community-run", tone: "text-foreground" },
]

export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <>
      <MainNav />

      <main className="min-h-screen">
        <section className="border-b border-border">
          <Container className="px-0 sm:px-0 lg:grid lg:min-h-[420px] lg:grid-cols-2 lg:px-0">
            <div className="flex flex-col items-start gap-7 px-5 pt-11 pb-9 md:px-8 md:pt-14 md:pb-11 lg:pt-14 lg:pr-16 lg:pb-10 lg:pl-10">
              <div className="flex max-w-[520px] flex-col items-start gap-7">
                <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
                  Para sa Pinoy developers
                </p>
                <h1 className="m-0 max-w-[520px] text-[40px] leading-[1.08] font-semibold tracking-[-0.04em] text-foreground lg:text-[56px]">
                  A Filipino domain
                  <br />
                  for work
                  <br />
                  worth sharing<span className="text-primary">.</span>
                </h1>
                <p className="m-0 max-w-[460px] text-base leading-[1.65] text-foreground/82">
                  Get your free{" "}
                  <span className="font-mono text-foreground">
                    *.is-pinoy.dev
                  </span>{" "}
                  subdomain and build something that represents you. Open
                  source, community-driven, forever free.
                </p>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  {TRUST_ITEMS.map(({ icon: Icon, label, tone }, i) => (
                    <div key={label} className="flex items-center gap-4">
                      {i > 0 && (
                        <span
                          className="h-6 w-px bg-border"
                          aria-hidden="true"
                        />
                      )}
                      <div className="flex items-center gap-[9px]">
                        <Icon
                          className={`size-[18px] shrink-0 ${tone}`}
                          aria-hidden="true"
                        />
                        <span className="text-xs font-medium text-foreground">
                          {label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              id="claim"
              className="relative flex justify-center border-t border-border px-5 pt-9 pb-11 md:px-8 md:pt-11 md:pb-14 lg:items-center lg:border-t-0 lg:border-l lg:py-14 lg:pr-10 lg:pl-16"
            >
              <div
                className="hero-grid-motif pointer-events-none absolute inset-0"
                aria-hidden="true"
              />
              <div className="relative lg:mt-3">
                <SubdomainChecker />
              </div>
            </div>
          </Container>
        </section>

        <Suspense fallback={<RecentlyClaimedSkeleton />}>
          <RecentlyClaimed />
        </Suspense>
        <HowClaimingWorks />

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
