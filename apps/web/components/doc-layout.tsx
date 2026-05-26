"use client"

import Link from "next/link"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { MainNav } from "@/components/main-nav"
import { ScanlineOverlay } from "@/components/scanline-overlay"
import { TopMarquee } from "@/components/top-marquee"

interface DocLayoutProps {
  title: string
  effectiveDate: string
  children: React.ReactNode
}

export function DocLayout({ title, effectiveDate, children }: DocLayoutProps) {
  return (
    <>
      <ScanlineOverlay />
      <TopMarquee />
      <MainNav />

      <main className="doc-main max-w-[700px] mx-auto pt-[150px] px-10 pb-20">
        {/* Eyebrow badge */}
        <div className="font-pixel text-[8px] text-primary bg-primary/10 border-2 border-primary px-4 py-2 tracking-[0.1875em] uppercase inline-block mb-6">
          {"// LEGAL"}
        </div>

        {/* Title */}
        <h1
          className="font-pixel text-foreground leading-[1.6] m-0 mb-4"
          style={{ fontSize: "clamp(0.875rem, 2.5vw, 1.625rem)" }}
        >
          {title}
        </h1>

        {/* Effective date */}
        <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.0625em] m-0 mb-8">
          Effective: {effectiveDate}
        </p>

        {/* Gold divider */}
        <div className="h-[3px] bg-primary mb-12" />

        {/* MDX content */}
        <article className="doc-content">{children}</article>

        {/* Back link */}
        <div className="mt-16 pt-8 border-t-2 border-card">
          <Button
            asChild
            variant="link"
            className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.0625em] transition-colors duration-100 hover:text-primary p-0 h-auto"
          >
            <Link href="/" aria-label="Back to home">
              ← BACK TO HOME
            </Link>
          </Button>
        </div>
      </main>
    </>
  )
}
