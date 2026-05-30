import { Button } from "@is-pinoy-dev/ui/components/button"

export function ReportAbuseSection() {
  return (
    <section className="w-full border-t-2 border-border">
      <div className="mx-auto flex max-w-[960px] flex-col items-center gap-8 px-10 py-20 text-center">
        {/* Eyebrow */}
        <span className="font-pixel text-[7px] tracking-[0.15em] text-muted-foreground uppercase">
          {"// COMMUNITY SAFETY"}
        </span>

        {/* Heading */}
        <h2
          className="m-0 max-w-[640px] font-pixel leading-[1.8] text-foreground"
          style={{ fontSize: "clamp(0.6rem, 1.8vw, 1rem)" }}
        >
          Seen something wrong?
          <br />
          Report it.
        </h2>

        {/* Body */}
        <p className="m-0 max-w-[480px] font-sans text-[15px] leading-[1.7] text-muted-foreground">
          If a subdomain is being used for phishing, spam, impersonation, or any
          other harmful purpose, let us know. We take abuse seriously and will
          act quickly.
        </p>

        {/* CTA */}
        <Button asChild variant="outline-shadow">
          <a
            href="https://github.com/is-pinoy-dev/domains/issues/new?template=abuse-report.md&title=%5BABUSE%5D+"
            target="_blank"
            rel="noopener noreferrer"
          >
            REPORT MISUSE OR ABUSE
          </a>
        </Button>
      </div>
    </section>
  )
}
