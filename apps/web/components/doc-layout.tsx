import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { ProgressLink } from "@/components/progress-link"

interface DocLayoutProps {
  title: string
  effectiveDate: string
  children: React.ReactNode
}

// Synchronous, and with no header of its own: the root layout supplies both, so
// these pages render their content without waiting on anything and still get the
// same menu as the rest of the site.
export function DocLayout({ title, effectiveDate, children }: DocLayoutProps) {
  return (
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
          <ProgressLink href="/" aria-label="Back to home">
            ← Back to home
          </ProgressLink>
        </Button>
      </div>
    </Container>
  )
}
