import { Suspense } from "react"
import type { Metadata } from "next"
import { ScanlineOverlay } from "@/components/scanline-overlay"
import { TopMarquee } from "@/components/top-marquee"
import { MainNav } from "@/components/main-nav"
import { SiteFooter } from "@/components/site-footer"
import { ShowcaseGrid, ShowcaseGridSkeleton } from "@/components/showcase-grid"

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

export default function ShowcasePage() {
  return (
    <>
      <ScanlineOverlay />
      <TopMarquee />
      <MainNav />

      <main className="flex min-h-screen flex-col">
        <section className="xs:px-3.5 flex flex-col items-center px-10 pt-[220px] pb-[80px] sm:px-5 sm:pt-[180px]">
          <div className="w-full max-w-[960px]">
            <div className="mb-16 h-[2px] bg-primary shadow-[0_2px_0_var(--color-primary-dark)]" />

            <div className="mb-12 flex flex-col gap-4">
              <h1
                className="m-0 font-pixel leading-[1.6] tracking-[0.1em] text-primary"
                style={{ fontSize: "clamp(0.5rem, 1.5vw, 0.75rem)" }}
              >
                {"// SHOWCASE"}
              </h1>
              <p className="m-0 max-w-[480px] font-sans text-[15px] leading-[1.7] text-muted-foreground">
                Filipino developer portfolios and projects living on is-pinoy.dev.
              </p>
            </div>

            <Suspense fallback={<ShowcaseGridSkeleton />}>
              <ShowcaseGrid />
            </Suspense>
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  )
}
