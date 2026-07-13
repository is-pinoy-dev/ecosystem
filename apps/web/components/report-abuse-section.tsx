import { ExternalLink, ShieldCheck } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"

export function ReportAbuseSection() {
  return (
    <section
      className="border-y border-border bg-surface-subtle py-8"
      aria-labelledby="safety-title"
    >
      <Container className="grid gap-6 md:grid-cols-[1fr_auto_auto] md:items-center">
        <div className="flex items-start gap-4">
          <ShieldCheck
            className="mt-0.5 size-6 shrink-0 text-foreground"
            aria-hidden="true"
          />
          <div>
            <h2
              id="safety-title"
              className="m-0 text-base font-semibold text-foreground"
            >
              Keeping the community safe
            </h2>
            <p className="m-0 mt-1 max-w-[620px] text-sm leading-6 text-muted-foreground">
              We do not tolerate phishing, spam, impersonation, or harmful use.
              If something looks wrong, let us know.
            </p>
          </div>
        </div>

        <a
          href="https://status.is-pinoy.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground no-underline hover:text-accent"
        >
          <StatusIndicator tone="success" />
          View system status
        </a>

        <Button asChild variant="destructive">
          <a
            href="https://github.com/is-pinoy-dev/domains/issues/new?template=abuse-report.md&title=%5BABUSE%5D+"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report abuse
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
      </Container>
    </section>
  )
}
