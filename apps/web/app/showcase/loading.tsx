import { Container } from "@is-pinoy-dev/ui/components/container"
import {
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@is-pinoy-dev/ui/components/section-header"
import { ShowcaseGridSkeleton, ShowcaseCTA } from "@/components/showcase-grid"

/**
 * A deliberate near-copy of the page's own shell.
 *
 * Everything on this route except the grid is static copy, so the loading state
 * can show the real thing rather than a grey approximation of it — the transition
 * into the page then changes only the part that was actually being fetched.
 *
 * It also gives `<Link>` something to prefetch. Prefetching a dynamic route
 * fetches it as far as its first loading boundary, so before this file existed
 * there was nothing about /showcase that could be fetched ahead of the click.
 */
export default function ShowcaseLoading() {
  return (
    <main className="min-h-screen">
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeader className="mb-12">
            <SectionEyebrow>Showcase</SectionEyebrow>
            <SectionTitle>Work worth sharing</SectionTitle>
            <SectionDescription>
              Filipino developer portfolios and projects living on is-pinoy.dev.
            </SectionDescription>
          </SectionHeader>

          <ShowcaseGridSkeleton />

          <ShowcaseCTA />
        </Container>
      </section>
    </main>
  )
}
