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
    "Browse the community showcase of portfolios, experiments, and projects published with is-pinoy.dev subdomains.",
  openGraph: {
    title: "Showcase — Filipino developer projects on is-pinoy.dev",
    description:
      "Browse the community showcase of portfolios, experiments, and projects published with is-pinoy.dev subdomains.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Community showcase for is-pinoy.dev subdomains",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Showcase — Filipino developer projects on is-pinoy.dev",
    description:
      "Browse portfolios, experiments, and projects from the is-pinoy.dev community.",
    images: ["/opengraph-image"],
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
