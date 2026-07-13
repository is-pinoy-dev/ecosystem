import Link from "next/link"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { MainNav } from "@/components/main-nav"

interface DocLayoutProps {
  title: string
  effectiveDate: string
  children: React.ReactNode
}

export function DocLayout({ title, effectiveDate, children }: DocLayoutProps) {
  return (
    <>
      <MainNav />

      <Container className="doc-main max-w-[780px] pt-12 pb-20 sm:pt-16">
        <p className="m-0 mb-5 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
          Legal
        </p>

        <h1 className="m-0 mb-4 text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">
          {title}
        </h1>

        {/* Effective date */}
        <p className="m-0 mb-8 font-mono text-xs tracking-[0.06em] text-muted-foreground uppercase">
          Effective: {effectiveDate}
        </p>

        <div className="mb-12 h-px bg-border" />

        {/* MDX content */}
        <article className="doc-content">{children}</article>

        {/* Back link */}
        <div className="mt-16 border-t border-border pt-8">
          <Button
            asChild
            variant="link"
            className="font-mono text-xs tracking-[0.06em] uppercase"
          >
            <Link href="/" aria-label="Back to home">
              ← Back to home
            </Link>
          </Button>
        </div>
      </Container>
    </>
  )
}
