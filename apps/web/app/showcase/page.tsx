import { Suspense } from "react"
import type { Metadata } from "next"
import { Container } from "@is-pinoy-dev/ui/components/container"
import {
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@is-pinoy-dev/ui/components/section-header"
import { MainNav } from "@/components/main-nav"
import { SiteFooter } from "@/components/site-footer"
import {
  ShowcaseGrid,
  ShowcaseGridSkeleton,
  ShowcaseCTA,
} from "@/components/showcase-grid"

export const metadata: Metadata = {
  title: "Showcase",
  description:
    "Explore Filipino developer portfolios and projects built on is-pinoy.dev subdomains.",
  openGraph: {
    title: "Showcase | is-pinoy.dev",
    description:
      "Explore Filipino developer portfolios and projects built on is-pinoy.dev subdomains.",
  },
}

export const dynamic = "force-dynamic"

export default function ShowcasePage() {
  return (
    <>
      <MainNav />

      <main className="min-h-screen">
        <section className="py-16 sm:py-20">
          <Container>
            <SectionHeader className="mb-12">
              <SectionEyebrow>Showcase</SectionEyebrow>
              <SectionTitle>Work worth sharing</SectionTitle>
              <SectionDescription>
                Filipino developer portfolios and projects living on
                is-pinoy.dev.
              </SectionDescription>
            </SectionHeader>

            <Suspense fallback={<ShowcaseGridSkeleton />}>
              <ShowcaseGrid />
            </Suspense>

            <ShowcaseCTA />
          </Container>
        </section>

        <SiteFooter />
      </main>
    </>
  )
}
