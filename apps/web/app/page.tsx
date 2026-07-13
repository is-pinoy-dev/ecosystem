import { Suspense } from "react"
import { Code2, ShieldCheck, Users } from "lucide-react"
import { Container } from "@is-pinoy-dev/ui/components/container"
import {
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@is-pinoy-dev/ui/components/section-header"
import { MainNav } from "@/components/main-nav"
import { SubdomainChecker } from "@/components/subdomain-checker"
import { SubdomainMarquee } from "@/components/subdomain-marquee"
import { DocsSection } from "@/components/docs-section"
import { ProviderGuides } from "@/components/provider-guides"
import { CTASection } from "@/components/cta-section"
import { ReportAbuseSection } from "@/components/report-abuse-section"
import { SiteFooter } from "@/components/site-footer"
import { ShowcaseGrid, ShowcaseGridSkeleton } from "@/components/showcase-grid"

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: "Free forever", detail: "No fees. Ever." },
  { icon: Code2, title: "Open source", detail: "Transparent and auditable." },
  {
    icon: Users,
    title: "Community-run",
    detail: "Reviewed by Filipino developers.",
  },
]

export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <>
      <MainNav />

      <main className="min-h-screen pt-16">
        <section className="border-b border-border py-16 sm:py-20 lg:py-24">
          <Container className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
            <div className="flex flex-col items-start gap-7">
              <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
                Para sa Pinoy developers
              </p>
              <h1 className="m-0 max-w-[620px] text-5xl leading-[1.04] font-semibold tracking-[-0.045em] text-foreground sm:text-6xl">
                A Filipino domain for work worth sharing
                <span className="text-primary">.</span>
              </h1>
              <p className="m-0 max-w-[560px] text-lg leading-8 text-muted-foreground">
                Claim your free{" "}
                <span className="font-mono text-foreground">
                  *.is-pinoy.dev
                </span>{" "}
                subdomain for your portfolio. Open source, community-driven, and
                forever free.
              </p>

              <div className="grid w-full gap-5 border-t border-border pt-6 sm:grid-cols-3">
                {TRUST_ITEMS.map(({ icon: Icon, title, detail }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon
                      className="mt-0.5 size-5 shrink-0 text-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="m-0 text-sm font-semibold text-foreground">
                        {title}
                      </p>
                      <p className="m-0 mt-1 text-xs leading-5 text-muted-foreground">
                        {detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <SubdomainChecker />
          </Container>
        </section>

        <SubdomainMarquee />
        <DocsSection />

        <section
          className="border-t border-border py-16 sm:py-20"
          aria-labelledby="showcase-title"
        >
          <Container>
            <SectionHeader className="mb-10">
              <SectionEyebrow>Built by Filipino developers</SectionEyebrow>
              <SectionTitle id="showcase-title">
                See what&apos;s possible
              </SectionTitle>
              <SectionDescription>
                Portfolios and projects with a memorable Filipino developer
                identity.
              </SectionDescription>
            </SectionHeader>
            <Suspense fallback={<ShowcaseGridSkeleton limit={3} />}>
              <ShowcaseGrid limit={3} />
            </Suspense>
          </Container>
        </section>

        <ProviderGuides />
        <CTASection />
        <ReportAbuseSection />
      </main>

      <SiteFooter />
    </>
  )
}
