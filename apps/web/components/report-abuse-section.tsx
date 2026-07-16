import { Flag, Shield } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"

export function ReportAbuseSection() {
  return (
    <section
      className="border-b border-border py-5 sm:py-6 lg:py-7"
      aria-labelledby="safety-title"
    >
      <Container className="flex flex-col gap-5 md:flex-row md:items-center md:gap-0">
        <div className="flex flex-1 items-start gap-[22px] sm:gap-[26px]">
          <Shield
            className="mt-0.5 size-10 shrink-0 text-foreground sm:size-11"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div>
            <h2
              id="safety-title"
              className="m-0 text-[15px] font-semibold text-foreground"
            >
              Keeping the community safe
            </h2>
            <p className="m-0 mt-[5px] max-w-[440px] text-[13px] leading-[1.55] text-muted-foreground">
              We do not tolerate phishing, spam, impersonation, or any other
              harmful use. If you see something wrong, let us know.
            </p>
          </div>
        </div>

        <Button
          asChild
          variant="outline"
          className="h-[42px] w-full gap-2 border-destructive bg-transparent text-destructive hover:bg-destructive/5 md:w-[180px] md:shrink-0"
        >
          <a
            href="https://github.com/is-pinoy-dev/domains/issues/new?template=abuse-report.md&title=%5BABUSE%5D+"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Flag className="size-4" aria-hidden="true" />
            Report abuse
          </a>
        </Button>
      </Container>
    </section>
  )
}
